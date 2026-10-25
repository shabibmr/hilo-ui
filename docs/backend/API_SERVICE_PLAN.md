# Hilo Arte Admin API Service: Implementation Plan

Goal: replace the admin app's direct Supabase calls with a thin, authenticated HTTP API, so that secrets, business rules and validation live on the server. The admin UI keeps the same function names in `admin/src/lib/api.ts`; only their bodies change from `supabase.from(...)` to `fetch(...)`.

## 1. Stack decision: Node.js (TypeScript) vs Python FastAPI

**Node.js + TypeScript will be faster to implement here.**

| Factor | Node/TS | FastAPI |
|---|---|---|
| Shared types with `admin/src/lib/types.ts` and `src/lib/data/types.ts` | Reuse directly (or a shared package) | Rewrite every type as a Pydantic model and keep two copies in sync |
| Existing server logic | `supabase/functions/*` (create-order, razorpay-webhook, refund-order, verify-payment, release-expired-orders) are already TS; port by moving the handler bodies | Full rewrite in Python |
| Tooling already on the machine | Node, npm, Next | Needs Python env, uvicorn, process manager |
| Validation and API docs | Zod + `@fastify/swagger` (or Hono + zod-openapi) gives the same OpenAPI docs | Pydantic + automatic docs (FastAPI's best feature, but Node can match it) |
| Runtime speed | Faster than FastAPI in raw throughput, but irrelevant: this API is DB-bound and has one admin user | Fine |
| Where FastAPI would win | Python-heavy work (reports, data science, ML). Not in scope. | |

Recommendation: **Fastify + TypeScript + Zod**. Hono is an equally good alternative; pick one and don't revisit.

Estimated saving: roughly 30-40% less work than FastAPI, mostly from not rewriting types and the Razorpay/stock logic.

## 2. Architecture decisions

- Supabase stays the system of record: Postgres, Storage and Auth. We are adding an API in front of it, not migrating the database.
- Auth: the admin signs in with Supabase Auth as today. The API verifies the Supabase JWT (JWKS or `SUPABASE_JWT_SECRET`) on every request and checks the user is the admin (allow-list by user id or an `app_metadata.role = 'admin'` claim).
- DB access: the API uses the service role key (`supabase-js`) for CRUD and Storage, and calls the existing SQL functions (`set_order_status`, `create_purchase`, `ensure_invoice`, `create_order_atomic`, `release_expired_pending_orders`) via `rpc`. Business rules stay in Postgres where they are already atomic.
- RLS: keep it as defence in depth. Once the admin app goes through the API, remove the broad `authenticated` write policies so a leaked admin JWT cannot bypass the API (Phase 7).
- Public endpoints (storefront): `create-order` and `razorpay-webhook` move into the API as unauthenticated-but-hardened routes. Storefront reads can stay on the anon key for v1.
- Hosting: Node process on the dev server under systemd or pm2, behind a reverse proxy. Layout under `/var/www/html/algo_cloud/hilo/`: `api/` (this service), `store/` (storefront export), `admin/` (admin export). The env file lives outside the web root. See `API_MIGRATION_PLAN.md` for rollout and the storefront move to `store/`.
- The admin is a static export, so it can only call the API from the browser: CORS must allow the admin origin only.

## 3. API surface (v1)

All routes are under `/api/v1`, JSON, admin-JWT protected unless marked public.

| Area | Routes |
|---|---|
| Health | `GET /health` (public) |
| Dashboard | `GET /dashboard/counts` |
| Products | `GET /products`, `GET /products/:id`, `POST /products`, `PATCH /products/:id`, `PATCH /products/:id/published`, `DELETE /products/:id` |
| Collections | `GET /collections`, `POST`, `PATCH /:id`, `PATCH /:id/published`, `DELETE /:id`, `GET /collections/:handle/product-count` |
| Images | `POST /uploads/images` (multipart), `DELETE /uploads/images` |
| Orders | `GET /orders`, `GET /orders/:id`, `PATCH /orders/:id/status`, `POST /orders/:id/release-hold`, `POST /orders/:id/refund`, `POST /orders/:id/verify-payment` |
| Invoices | `GET /orders/:id/invoice`, `POST /orders/:id/invoice` |
| Enquiries | `GET /enquiries`, `PATCH /enquiries/:id/handled` |
| Customers | `GET /customers`, `GET /customers/:id`, `GET /customers/:id/orders` |
| Suppliers | `GET /suppliers`, `POST`, `PATCH /:id`, `DELETE /:id` |
| Purchases | `GET /purchases`, `GET /purchases/:id`, `POST /purchases` |
| Settings | `GET /settings`, `PUT /settings` |
| Checkout (public) | `POST /checkout/orders`, `POST /webhooks/razorpay` |

## Phase 0: Decisions and project setup
- [ ] T0.1 Confirm stack (Fastify + TS + Zod) and that Supabase remains the DB.
- [x] T0.2 Deploy paths decided: api `.../hilo/api/`, store `.../hilo/store/`, admin `.../hilo/admin/`. Still to pick: Node port and CORS origins (store + admin).
- [ ] T0.3 Create `api/` at repo root (sibling of `admin/` and `src/`), `package.json`, `tsconfig`, eslint, `.env.example`.
- [ ] T0.4 Decide type sharing: copy `types.ts` into `api/src/types` for v1, or extract `packages/shared` later. Prefer the copy first, to avoid reshaping the repo.
- [ ] T0.5 Env contract: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (or JWKS URL), `ADMIN_USER_IDS`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `CORS_ORIGINS`, `PORT`. Never committed.

## Phase 1: Server skeleton and cross-cutting concerns
- [ ] T1.1 Fastify app factory, config loader with Zod env validation (fail fast on missing vars).
- [ ] T1.2 Structured logging (pino) with request ids; redact auth headers and payment fields.
- [ ] T1.3 Central error handler: consistent `{ error: { code, message, details } }` shape, map Supabase/Postgres errors (unique violation, FK, check) to 409/422.
- [ ] T1.4 CORS (allow-list), helmet-style headers, body size limits, rate limiting (stricter on public routes).
- [ ] T1.5 Supabase service client module (single instance).
- [ ] T1.6 `GET /health` including a cheap DB ping.
- [ ] T1.7 OpenAPI/Swagger docs generated from Zod schemas (served only outside production).
- [ ] T1.8 Test harness (Vitest) with a test Supabase project or a local Postgres loaded from `schema.sql`.

## Phase 2: Authentication and authorization
- [ ] T2.1 JWT verification plugin: validate signature, expiry, audience.
- [ ] T2.2 Admin guard: reject non-admin users with 403. `ADMIN_USER_IDS` or role claim.
- [ ] T2.3 Route registration pattern: everything under an authenticated scope by default; public routes opt out explicitly.
- [ ] T2.4 Tests: no token, expired token, valid non-admin, valid admin.

## Phase 3: Catalogue (collections, products, images)
- [ ] T3.1 Zod schemas for `Product`, `ProductInput`, `Collection`, `CollectionInput` mirroring `admin/src/lib/types.ts`.
- [ ] T3.2 Collections CRUD + published toggle + product count. Block delete when products reference it, return 409 with a clear message.
- [ ] T3.3 Products CRUD + published toggle. Server-side slug uniqueness and slug generation (port `admin/src/lib/slug.ts`).
- [ ] T3.4 Image upload: multipart, size and mime allow-list (jpeg/png/webp), upload to `product-images` bucket with generated names, return `ImageAsset`.
- [ ] T3.5 Image delete by URL (only inside our bucket). Remove images on product delete.
- [ ] T3.6 Integration tests for each route including validation failures.

## Phase 4: Orders, invoices, enquiries, customers
- [ ] T4.1 Orders list and detail bundle (order + items + customer + invoice), matching `OrderBundle`.
- [ ] T4.2 `PATCH /orders/:id/status` via `set_order_status` RPC. Enforce the allowed transition table in the API too and return 422 for illegal moves.
- [ ] T4.3 Release hold (pending order older than hold window) via RPC.
- [ ] T4.4 Invoices: get, and create/ensure via `ensure_invoice` (idempotent, sequential `HA-xxxxx`).
- [ ] T4.5 Enquiries list and handled toggle.
- [ ] T4.6 Customers list, detail, and their orders.
- [ ] T4.7 Dashboard counts endpoint (single query/RPC instead of several round trips).
- [ ] T4.8 Pagination, sort and basic filters (status, date range, search) on orders, products, customers. Default page size 50.

## Phase 5: Purchasing and site settings
- [ ] T5.1 Suppliers CRUD.
- [ ] T5.2 Purchases: list, get, create via `create_purchase` RPC (adds stock atomically). Validate items reference real products and quantities are positive.
- [ ] T5.3 Site settings get/put with a Zod schema (hero image, address, contact, social, announcement bar). Single-row upsert.
- [ ] T5.4 Tests, including that a purchase raises stock exactly once.

## Phase 6: Payments (Razorpay) and checkout
Port the five Edge Functions, keeping their logic and the DB functions they depend on.
- [ ] T6.1 Razorpay client wrapper (orders, payments fetch, refunds).
- [ ] T6.2 `POST /checkout/orders` (public): input is product ids + quantities + customer details only. Read prices from DB, call `create_order_atomic`, create Razorpay order, return the checkout payload. Rate limited, strict schema.
- [ ] T6.3 `POST /webhooks/razorpay` (public): verify HMAC signature on the raw body, idempotent, mark order `paid`, create invoice.
- [ ] T6.4 `POST /orders/:id/refund` (admin): full refund, store `refund_id`/`refunded_at`, status `refunded`, restock.
- [ ] T6.5 `POST /orders/:id/verify-payment` (admin): reconcile stuck `pending` orders with Razorpay.
- [ ] T6.6 Hold-expiry job: scheduler calling `release_expired_pending_orders` every few minutes (pg_cron remains the primary; the API job is optional).
- [ ] T6.7 Tests with Razorpay mocked: bad signature, replayed webhook, double refund, refund of unpaid order, stock restore.
- [ ] T6.8 Checkout cutover and Edge Function retirement follow `API_MIGRATION_PLAN.md` (Stages 2 and 4).

## Phase 7: Admin app migration and hardening
- [ ] T7.0 Admin and migration steps follow `API_MIGRATION_PLAN.md` Stage 3.
- [ ] T7.1 Add `NEXT_PUBLIC_API_URL` to the admin app; add a small `request()` helper in `admin/src/lib/api.ts` that attaches the Supabase access token.
- [ ] T7.2 Migrate `api.ts` function by function (dashboard, collections, products, images, orders, invoices, enquiries, customers, suppliers, purchases, settings). Signatures unchanged, so pages need no edits. Keep mock mode working.
- [ ] T7.3 Handle 401 (redirect to login) and 403 in `AuthContext`.
- [ ] T7.4 Regression pass through every admin screen against the API.
- [ ] T7.5 Tighten RLS: drop `authenticated` write policies on admin tables and storage so only the service role writes. Re-run the RLS tests.
- [ ] T7.6 Security review: secrets only in server env, CORS, rate limits, webhook raw-body handling, upload limits.

## Phase 8: Deploy and operate
- [ ] T8.1 Build script (`tsc` to `dist`), start via systemd or pm2 with restart-on-failure and env file outside the repo.
- [ ] T8.2 nginx reverse proxy rule for `/algo_cloud/hilo/api/`, deny access to `dist/`, `.env`, `node_modules`, HTTPS, request size limit, timeouts.
- [ ] T8.3 Update the Razorpay webhook URL to the API.
- [ ] T8.4 Log rotation and a basic uptime check on `/health`.
- [ ] T8.5 Backup plan for the database (open item from the original plan).
- [ ] T8.6 Runbook in `docs/backend`: start/stop, env vars, rollback to direct-Supabase mode.

## Suggested order and sizing

| Phase | Rough effort |
|---|---|
| 0-2 Setup, skeleton, auth | 1.5 days |
| 3 Catalogue | 1.5 days |
| 4 Orders/customers | 1.5 days |
| 5 Purchases/settings | 1 day |
| 6 Payments | 2 days |
| 7 Admin migration + RLS tightening | 1.5 days |
| 8 Deploy | 1 day |

Total: about 10 working days for one developer. Phases 3-5 can be done in any order; Phase 6 should be last before the admin migration because it carries the most risk.

## Risks and open items
- Static admin means the browser holds the user's JWT; the API must never trust anything except the verified token.
- Webhook signature needs the raw request body; configure Fastify to keep it for that route only.
- Checkout moves to the API (decided); the staged rollout is in `API_MIGRATION_PLAN.md`. Moving checkout off Edge Functions changes the production payment path. Run both in parallel on a test Razorpay account first.
- Service role key is powerful: keep it in the server env file only, with restricted file permissions.
- A single dev server is a single point of failure; acceptable for v1, revisit with real order volume.
- GST rules and partial refunds remain out of scope, as in the original plan.
- Decide whether the storefront reads should also move behind the API later (cache, rate limits); not in this plan.
