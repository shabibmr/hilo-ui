# Hilo API service

**Decision (2026-10-25): one API for both apps.** The storefront and the admin app share `server/` (Express, port 4000, base path `/api/v1`). Do not add a second service, a Fastify app, or an `api/` package at the repo root.

Goal: secrets, business rules, and validation live on that server. The admin UI keeps the same function names in `admin/src/lib/api.ts`; only their bodies change from `supabase.from(...)` to `fetch(...)`. **The admin is API-only (decided 2026-10-27): its mock mode and direct-Supabase mode are deleted, not kept alongside.** Supabase Auth remains the admin sign-in. The storefront keeps `commerceRepository` / `contentRepository` and calls the same process through `api-provider.ts`.

## 1. Stack decision

Node.js + TypeScript stays. Python is out: types and the Razorpay/stock handlers are already TypeScript.

The earlier Fastify + Zod recommendation is retired. `server/` is already the running service (catalog, content, checkout, webhooks, and `/admin`). Switching frameworks would duplicate that work. Add validation inside Express if a route needs it. Do not start a second framework to get OpenAPI.

## 2. Architecture decisions

- **One process.** Source is `server/`. The deploy folder `/var/www/html/algo_cloud/hilo/api/` is the built artifact behind nginx, not a second codebase. Storefront export is `store/`, admin export is `admin/`. Env file stays outside the web root. Rollout is `API_MIGRATION_PLAN.md`.
- Supabase stays the system of record: Postgres, Storage, and Auth. The API sits in front of it.
- **Two audiences, two prefixes** so public catalog reads do not collide with admin CRUD:
  - Public (no admin JWT): `/api/v1/products`, `/collections`, `/settings`, `/enquiries`, `/checkout/orders`, `/webhooks/razorpay`, plus `GET /health`. Catalog is published-only.
  - Admin: `/api/v1/admin/...`. Supabase access token, then `ADMIN_USER_IDS`. Fail closed when the list is empty.
- DB access: service role (`supabase-js`) for CRUD and Storage, and the existing SQL functions (`set_order_status`, `create_purchase`, `ensure_invoice`, `create_order_atomic`, `release_expired_pending_orders`) via `rpc`. Business rules stay in Postgres.
- RLS stays as defence in depth. The admin app has no direct-Supabase data path, so the broad `authenticated` write policies have no legitimate user. Remove them so a leaked admin JWT cannot bypass the API (Phase 7).
- Both apps are static exports, so the browser calls the API. `CORS_ORIGIN` must list the storefront origin and the admin origin. The current default `*` is not acceptable in production.
- Public errors stay `{ error: { code, message, details? } }`. Admin and checkout routes still use their own `{ error: string }` shape. Do not unify those envelopes unless that work is requested on its own.

## 3. API surface (v1)

JSON under `/api/v1`. Admin routes below are mounted at `/admin` and require the admin guard. Paths in this table are the suffix after `/api/v1`.

| Area | Routes | Audience |
|---|---|---|
| Health | `GET /health` (app root, not under `/api/v1`) | public |
| Catalog | `GET /products`, `GET /products/best-sellers`, `GET /products/id/:id`, `GET /products/:handle`, `GET /collections`, `GET /collections/:handle` | public, published only |
| Content | `GET /settings`, `POST /enquiries` | public |
| Checkout | `POST /checkout/orders`, `POST /webhooks/razorpay` | public, hardened |
| Dashboard | `GET /admin/dashboard/counts` | admin |
| Products | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`, `PATCH /admin/products/:id/published` | admin |
| Collections | `GET/POST /admin/collections`, `PATCH/DELETE /admin/collections/:id`, `PATCH /admin/collections/:id/published`, `GET /admin/collections/:handle/product-count` | admin |
| Images | `POST /admin/uploads/images` (raw body, jpeg/png/webp), `DELETE /admin/uploads/images` | admin |
| Orders | `GET /admin/orders`, `GET /admin/orders/:id`, `PATCH /admin/orders/:id/status`, `POST /admin/orders/:id/release-hold`, `POST /admin/orders/:id/refund`, `POST /admin/orders/:id/verify-payment` | admin |
| Invoices | `GET /admin/orders/:id/invoice`, `POST /admin/orders/:id/invoice` | admin |
| Enquiries | `GET /admin/enquiries`, `PATCH /admin/enquiries/:id/handled` | admin |
| Customers | `GET /admin/customers`, `GET /admin/customers/:id`, `GET /admin/customers/:id/orders` | admin |
| Suppliers | `GET/POST /admin/suppliers`, `PATCH/DELETE /admin/suppliers/:id` | admin |
| Purchases | `GET /admin/purchases`, `GET /admin/purchases/:id`, `POST /admin/purchases` | admin |
| Settings | `GET /admin/settings`, `PUT /admin/settings` | admin |

These handlers already live in `server/src/routes/`. A route existing in source is not the same as a cutover: the admin still ships its direct-Supabase and mock code until Phase 7 deletes it, and storefront checkout still defaults to the Edge Functions until `API_MIGRATION_PLAN.md` says otherwise. The end state (ADR 0001) is that both apps use this API only, with mock data and direct Supabase access removed (Stage 5).

## Phase 0: Decisions and project setup
- [x] T0.1 One service: Express + TypeScript in `server/`. Supabase remains the DB. Fastify and a new `api/` package are cancelled.
- [x] T0.2 Deploy paths: built API `.../hilo/api/`, store `.../hilo/store/`, admin `.../hilo/admin/`. Port is 4000. CORS must list the storefront and admin origins before production (`CORS_ORIGIN`, comma-separated).
- [x] T0.3 Project lives in `server/` (`package.json`, `tsconfig`, `.env.example`). Do not create a sibling `api/` app.
- [ ] T0.4 Type sharing: keep copying shapes for now, or extract `packages/shared` later. Do not reshape the repo for v1.
- [x] T0.5 Env contract in use: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_USER_IDS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PORT`, `CORS_ORIGIN`. Admin auth uses `supabase.auth.getUser(token)`, so `SUPABASE_JWT_SECRET` is not required. Never commit the env file.

## Phase 1: Server skeleton and cross-cutting concerns
- [x] T1.1 Express app in `server/src/index.ts`. Mount order: webhooks (raw body), then `express.json`, then catalog, content, checkout, admin.
- [ ] T1.2 Structured logging with request ids; redact auth headers and payment fields. Request ids exist; logging is still `console.error`.
- [x] T1.3 Public error handler: `{ error: { code, message, details? } }`. Admin maps unique/FK to 409 and other DB codes to 422, with `{ error: string }`. Leave the two shapes as they are.
- [x] T1.4 CORS allow-list via `CORS_ORIGIN` (comma-separated; `*` still allowed for local/dev and warns when `NODE_ENV=production`). Rate limits exist (120/min on `/api/v1`, stricter on enquiries and checkout). Lightweight security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`.
- [x] T1.5 Single Supabase service client in `server/src/supabase.ts`.
- [x] T1.6 `GET /health` pings `site_settings`.
- [x] T1.7 `GET /api/v1/openapi.json` documents the public surface. It does not cover `/admin`.
- [ ] T1.8 Test harness (Vitest or the existing `server/test-api.mjs` extended) against a test Supabase project or local Postgres from `schema.sql`.

## Phase 2: Authentication and authorization
- [x] T2.1 `requireAdmin` calls `supabase.auth.getUser` (signature and expiry come from Supabase Auth).
- [x] T2.2 Admin guard: 403 unless the user id is in `ADMIN_USER_IDS`. Empty list means nobody is admin.
- [x] T2.3 Public routes mount without the guard. `router.use('/admin', requireAdmin)` covers the admin router.
- [ ] T2.4 Tests: no token, expired token, valid non-admin, valid admin.

Handlers for phases 3-6 are already in `server/src/routes/`. Do not rebuild them in a new app. Boxes below stay open for behavior that is stricter than the current handler, for tests, and for cutover.

## Phase 3: Catalogue (collections, products, images)
- [ ] T3.1 Request validation for product and collection writes (Express). Zod is optional. The current admin router accepts a JSON object and strips `id`, `created_at`, and `updated_at`.
- [x] T3.2 Collections CRUD, published toggle, and product count are in `admin.ts`. Delete conflicts surface as 409 when Postgres returns a foreign-key error.
- [x] T3.3 Products CRUD and published toggle exist. API slug helpers in `server/src/slug.ts`: create derives `handle` from title when missing; create/update reject invalid handles.
- [x] T3.4 Image upload: raw body (not multipart), jpeg/png/webp, 5 MB, `product-images` bucket, `POST /admin/uploads/images`.
- [x] T3.5 `DELETE /admin/uploads/images` removes a URL only when it points inside the bucket.
- [ ] T3.6 Integration tests for each route, including validation failures.

## Phase 4: Orders, invoices, enquiries, customers
- [x] T4.1 `GET /admin/orders` and `GET /admin/orders/:id`.
- [x] T4.2 `PATCH /admin/orders/:id/status`.
- [x] T4.3 `POST /admin/orders/:id/release-hold`.
- [x] T4.4 `GET` and `POST /admin/orders/:id/invoice`.
- [x] T4.5 `GET /admin/enquiries` and `PATCH /admin/enquiries/:id/handled`.
- [x] T4.6 `GET /admin/customers`, `GET /admin/customers/:id`, `GET /admin/customers/:id/orders`.
- [x] T4.7 `GET /admin/dashboard/counts`.
- [x] T4.8 Opt-in pagination (`?page=&limit=`, default limit 50, max 200) on public catalog lists and admin list routes. Body stays a JSON array; totals in `X-Total-Count` / `X-Page` / `X-Limit`. Omit params for the full list (current clients). Basic filters: `orders?status=`, `enquiries?handled=&kind=`.

## Phase 5: Purchasing and site settings
- [x] T5.1 Suppliers CRUD under `/admin/suppliers`.
- [x] T5.2 `GET /admin/purchases`, `GET /admin/purchases/:id`, `POST /admin/purchases`.
- [x] T5.3 `GET /admin/settings` and `PUT /admin/settings`. Public `GET /settings` stays the storefront read.
- [ ] T5.4 Tests, including that a purchase raises stock exactly once.

## Phase 6: Payments (Razorpay) and checkout
Edge Function behavior is ported into the same process. Production still calls the functions until Stage 2 of the migration plan.
- [x] T6.1 Razorpay calls live in `checkout.ts`, `webhooks.ts`, and the admin refund/verify handlers.
- [x] T6.2 `POST /checkout/orders` (public): product ids and quantities only, prices from the DB, rate limited.
- [x] T6.3 `POST /webhooks/razorpay` (public): raw body, mounted before `express.json`.
- [x] T6.4 `POST /admin/orders/:id/refund`.
- [x] T6.5 `POST /admin/orders/:id/verify-payment`.
- [ ] T6.6 Hold-expiry job inside the API. `pg_cron` / the existing scheduled function remains the primary.
- [ ] T6.7 Tests with Razorpay mocked: bad signature, replayed webhook, double refund, refund of unpaid order, stock restore.
- [ ] T6.8 Checkout cutover and Edge Function retirement follow `API_MIGRATION_PLAN.md` (Stages 2 and 4).
- [ ] T6.9 Serve homepage and founder content from the API, then remove mock data and direct Supabase access from both apps (Stage 5, ADR 0001).

## Phase 7: Admin app migration and hardening
- [ ] T7.0 Admin and migration steps follow `API_MIGRATION_PLAN.md` Stage 3.
- [ ] T7.1 Add `NEXT_PUBLIC_API_URL` to the admin app; add a small `request()` helper in `admin/src/lib/api.ts` that attaches the Supabase access token.
- [ ] T7.2 Migrate `api.ts` function by function (dashboard, collections, products, images, orders, invoices, enquiries, customers, suppliers, purchases, settings). Signatures unchanged, so pages need no edits. Delete each function's mock and direct-Supabase branch as it moves.
- [ ] T7.3 Handle 401 (redirect to login) and 403 in `AuthContext`.
- [ ] T7.3a Delete the mock store, mock sign-in, `isMockMode()`/`apiMode()`/`NEXT_PUBLIC_DATA_MODE`, the direct Supabase data client and the admin email allowlist. Make the admin build fail without `NEXT_PUBLIC_API_URL` and the Supabase Auth variables.
- [ ] T7.4 Regression pass through every admin screen against the API (the only data path).
- [ ] T7.5 Tighten RLS: drop `authenticated` write policies on admin tables and storage so only the service role writes. Re-run the RLS tests.
- [ ] T7.6 Security review: secrets only in server env, CORS, rate limits, webhook raw-body handling, upload limits.

## Phase 8: Deploy and operate
- [x] T8.1 Production start: `npm run build` (`tsc` → `dist/`), `npm start` runs `node dist/index.js`. `npm run start:tsx` keeps the previous tsx path. systemd restart-on-failure and env-outside-repo remain ops steps.
- [ ] T8.2 nginx reverse proxy rule for `/algo_cloud/hilo/api/`, deny access to `dist/`, `.env`, `node_modules`, HTTPS, request size limit, timeouts.
- [ ] T8.3 Update the Razorpay webhook URL to the API.
- [ ] T8.4 Log rotation and a basic uptime check on `/health`.
- [ ] T8.5 Backup plan for the database (open item from the original plan).
- [x] T8.6 Runbook is `docs/backend/MIGRATION_RUNBOOK.md` (flags, nginx, rollback to Edge Functions; admin rollback is the previous build).

## Suggested order

Phases 0-2 and the route handlers are in `server/` already. Do not restart them as a new app. Remaining work is tests, production CORS, admin and checkout cutover, RLS lock-down, and deploy. Follow `API_MIGRATION_PLAN.md`: checkout cutover first, then the API-only admin, then lock-down once both have run on the API.

## Risks and open items
- Static admin means the browser holds the user's JWT; the API must never trust anything except the verified token.
- The admin has no fallback when the API is down and no offline or sample-data mode. Developers run `server/` against a development Supabase project.
- Webhook signature needs the raw request body. `webhooks.ts` is mounted before `express.json` and uses `express.raw`. Keep that order.
- Checkout code is in `server/`, but production still uses the Edge Functions until Stage 2 of `API_MIGRATION_PLAN.md`. Run the parallel test on Razorpay test keys first.
- Service role key is powerful: keep it in the server env file only, with restricted file permissions.
- One process means an API outage takes catalog, checkout, and admin writes down together. systemd restart-on-failure and `/health` are the v1 mitigation. Splitting processes is not the plan.
- A single dev server is a single point of failure; acceptable for v1, revisit with real order volume.
- GST rules and partial refunds remain out of scope, as in the original plan.
- `CORS_ORIGIN` still defaults to `*` for local/dev. Set the storefront and admin origins before production (`NODE_ENV=production` logs a warning when left as `*`).
- List pagination is opt-in so existing array clients keep working. Clients that need pages should send `page`/`limit` and read `X-Total-Count`.
