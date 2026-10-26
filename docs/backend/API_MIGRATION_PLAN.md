# Migration Plan: Direct Supabase to the Hilo API Service

> Target state is fixed by `docs/adr/0001-api-only-data-access.md`: the API is the only data path for both apps, and mock data and direct Supabase access are removed (Stage 5). Fallback flags below exist only until that stage.

Companion to `API_SERVICE_PLAN.md` (what we build). This file covers how we move the running system over safely: checkout first, then the admin app, then lock-down.

**One service.** Storefront and admin both call `server/` (Express, port 4000). There is no second API to deploy. The folder `.../hilo/api/` on the server is only the built output of `server/`.

**Decision (2026-10-27): the admin app has one data path, the API.** The admin's mock data mode and its direct-Supabase data mode are removed outright, not kept as fallbacks. Supabase Auth stays as the admin sign-in; every data and Storage call goes to `/api/v1/admin`. There is no `NEXT_PUBLIC_DATA_MODE` flag. Local development runs `server/` against a development Supabase project. (The storefront's own mock provider and `CHECKOUT_MODE=edge` fallback are a separate decision and are unchanged.)

## 1. Target layout on the dev server

Base: `/var/www/html/algo_cloud/hilo/`

| Path | Contents | Public URL (assumed) |
|---|---|---|
| `.../hilo/api/` | Built output of repo `server/` (`dist/`, `package.json`, `node_modules`; `.env` kept outside web root or mode 600) | `/algo_cloud/hilo/api/` proxied to `127.0.0.1:4000` |
| `.../hilo/store/` | Storefront static export (`out/`) | `/algo_cloud/hilo/store/` |
| `.../hilo/admin/` | Admin static export (`admin/out/`) | `/algo_cloud/hilo/admin/` |

Points to settle before touching anything:
- **Storefront moves.** It currently deploys to `.../hilo` with `basePath: /hilo` (see the `/hilo/` image-prefix commit). Moving to `/store/` means changing `NEXT_PUBLIC_BASE_PATH` (storefront) to the new URL prefix and rebuilding. Old URL `.../hilo/` then needs a redirect to `.../hilo/store/` or it will 404 once the folder holds only `api/store/admin`.
- **Node code is not served from the web root.** Static files in `api/` must never be reachable. nginx should `proxy_pass` `/algo_cloud/hilo/api/` to the Node port and deny direct access to `dist/`, `.env`, `node_modules`. If the server is Apache rather than nginx, use `ProxyPass` equivalents.
- The `.env` file must live outside `/var/www/html` (e.g. `/etc/hilo-api.env`, mode 600), since the web root is a leak risk.
- Admin and storefront are static, so `CORS_ORIGIN` on the one API must list exactly the admin and store origins. Both apps use the same `NEXT_PUBLIC_API_URL`.

## 2. Migration principles
- One stage at a time, each reversible with a flag or by redeploying the previous build.
- Keep the Supabase Edge Functions deployed and untouched until Stage 4; rollback for checkout is "point the storefront back at them" until Stage 5 deletes that code path. After Stage 5, rollback is redeploying the previous build.
- Use Razorpay **test mode** for every parallel run. Switch to live keys only at cutover.
- No schema-destructive changes until the API has been the only writer for a full week.

## Stage 0: Preconditions
- [ ] M0.1 API phases 0-5 done and green in tests (auth, catalogue, orders, purchasing, settings).
- [ ] M0.2 Build `server/` and deploy that output to `.../hilo/api/` behind nginx with HTTPS, systemd/pm2, env file outside web root. `GET /health` on port 4000 reachable through the proxy. Do not deploy a second process.
- [ ] M0.3 Take a database backup (`pg_dump` via Supabase connection string) and store it off-server. Record the restore command in the runbook.
- [ ] M0.4 Record current state: Edge Function URLs, Razorpay webhook URL, row counts per table, current stock per product (used to reconcile later).
- [ ] M0.5 Add the storefront feature flag `NEXT_PUBLIC_CHECKOUT_MODE=edge|api` (default `edge`). The admin gets no flag: it is API-only. `NEXT_PUBLIC_DATA_PROVIDER` loses its `mock` and `supabase` values at Stage 5.

## Stage 1: Storefront relocation to `/store/`
Independent of the API, done first so later changes are not confounded.
- [ ] M1.1 Set the storefront base path for `/algo_cloud/hilo/store`; rebuild; check images, links and `trailingSlash` behaviour.
- [ ] M1.2 Deploy `out/` to `.../hilo/store/` alongside the old copy (do not delete yet).
- [ ] M1.3 Smoke test: home, collection, product, cart, contact, checkout page loads and reads live Supabase data.
- [ ] M1.4 Add redirect from `.../hilo/` to `.../hilo/store/`, then remove the old files from `.../hilo/` root (leaving `api/`, `store/`, `admin/`). Take care not to delete the `api` and `admin` folders when clearing.
- [ ] M1.5 Update any hard-coded URLs (emails, social links, Razorpay dashboard references).
- **Rollback:** redeploy the previous build to `.../hilo/` and revert the redirect.

## Stage 2: Checkout and webhook migration (the user-facing change)
- [ ] M2.1 Implement and deploy API checkout routes (`POST /checkout/orders`, `POST /webhooks/razorpay`) with Razorpay **test** keys.
- [ ] M2.2 Add a test webhook in the Razorpay dashboard pointing to the API URL. Keep the production webhook pointing at the Edge Function.
- [ ] M2.3 Storefront checkout client: a single function `createOrder()` that calls the Edge Function or the API based on `NEXT_PUBLIC_CHECKOUT_MODE`. Response shape must be identical so the Razorpay modal code does not change.
- [ ] M2.4 Parallel verification (test mode, `api` mode build on a staging copy of `store/`):
  - happy path: order created `pending`, stock reduced, webhook marks `paid`, invoice created
  - cancelled / abandoned payment: hold expires after 15 min and stock returns
  - webhook replay: second delivery changes nothing
  - bad signature: rejected with 400/401 and logged
  - out-of-stock and tampered price/quantity: rejected; price comes from DB only
  - concurrent orders for the last unit: exactly one succeeds
- [ ] M2.5 Compare outputs with `edge` mode: same order fields, same invoice numbering, no gaps in `HA-xxxxx` caused by failed orders.
- [ ] M2.6 Cutover (low-traffic window): switch Razorpay webhook to the API URL, switch live keys into the API env, build storefront with `CHECKOUT_MODE=api`, deploy to `store/`.
- [ ] M2.7 Place one real low-value order end to end, then refund it from Razorpay to verify the money path.
- [ ] M2.8 Watch logs and the orders table for 48 hours. Reconcile: every `paid` order has a Razorpay payment id; no stuck `pending` older than the hold window.
- **Rollback:** repoint the Razorpay webhook to the Edge Function, rebuild storefront with `CHECKOUT_MODE=edge`. Because both write the same tables through the same SQL functions (`create_order_atomic`), data stays consistent. Any order created mid-switch is resolved by `verify-payment`.

## Stage 3: Admin app migration (API-only, mock and direct Supabase removed)
Admin remains logged in through Supabase Auth; only data calls move. Each function in `admin/src/lib/api.ts` is rewritten to call the API and its mock and direct-Supabase branches are deleted in the same change, so there is never a second path to keep in sync.
- [ ] M3.1 Add `request()` helper to `admin/src/lib/api.ts` that attaches the access token; add `NEXT_PUBLIC_API_URL`. The admin build fails if `NEXT_PUBLIC_API_URL` or the Supabase Auth variables are missing.
- [ ] M3.2 Build admin for `.../hilo/admin/` base path and deploy it.
- [ ] M3.3 Migrate **reads** first, in this order, verifying each screen against the old results (capture them before the old paths are deleted): dashboard, collections, products, customers, orders, enquiries, suppliers, purchases, settings, invoices.
- [ ] M3.4 Migrate **simple writes**: collections, products (+ images), enquiries handled, suppliers, settings.
- [ ] M3.5 Migrate **sensitive writes** last: order status changes, release-hold, invoice creation, purchases (stock changes), refund, verify-payment. For each, test one action in the UI and confirm DB state matches the pre-migration behaviour.
- [ ] M3.6 Handle 401 (sign out and redirect) and 403 (show "not authorised") in `AuthContext`.
- [ ] M3.7 Delete the mock store, the mock sign-in, the `isMockMode()` and `apiMode()` branches, the direct Supabase data client and the admin email allowlist from the admin app. The only Supabase client left in the admin is the one used for sign-in and the session token.
- **Rollback:** redeploy the previous admin build (from the tarball taken before deploy) and fix the API. There is no runtime fallback; the previous build is the only one that still talks to Supabase directly.

## Stage 4: Lock down
Only after the admin has run on the API for about a week with no need to roll back to the pre-migration build.
- [ ] M4.1 Remove authenticated-role write policies from admin tables and `storage.objects` (new SQL migration file under `docs/backend/` plus applied copy). Keep public read on published products/collections/site settings and anon insert on enquiries (or move enquiries to an API route and drop that policy too).
- [ ] M4.2 Re-run RLS tests as anon and as an authenticated non-API client; writes must fail.
- [ ] M4.3 Remove the `CHECKOUT_MODE=edge` code path from the storefront. The admin's direct-Supabase and mock code is already gone (M3.7).
- [ ] M4.4 Retire Edge Functions: undeploy once logs show zero traffic for 7 days. Keep source in git history.
- [ ] M4.5 Rotate secrets that were ever exposed during testing (Razorpay webhook secret, service role key if used locally).
- [ ] M4.6 Confirm `IMPLEMENTATION_PLAN.md`, `TASKS.md`, README and runbook describe the final architecture (API-only admin was recorded on 2026-10-27).
- **Rollback:** reapply the dropped policies from the saved SQL (keep `rollback-policies.sql`).

## Stage 5: Remove mock data and direct Supabase access (code)
Storefront code removal. The admin was already made API-only in Stage 3 (M3.7). Starts only when the API has been the sole path for about a week (Stages 2 and 3 done) and the Stage 4 lock-down is verified. Decision: `docs/adr/0001-api-only-data-access.md`.
- [ ] M5.1 Move homepage and founder copy (`MOCK_HOMEPAGE_CONTENT`, `MOCK_FOUNDER_STORY`) behind the API (settings or a content endpoint) or into page source. `ApiContentRepository` then returns no fixtures.
- [ ] M5.2 Storefront: delete `src/lib/data/mock/`, `mock-provider.ts`, `supabase-provider.ts`, and `src/lib/supabase.ts`. `providers/index.ts` builds only the API repositories and throws if `NEXT_PUBLIC_API_URL` is unset. Remove `DATA_PROVIDER`, `NEXT_PUBLIC_DATA_PROVIDER`, `NEXT_PUBLIC_CHECKOUT_MODE`, `NEXT_PUBLIC_SUPABASE_*`, the `?preview=1` demo branch, and the mock notice on the confirmation page.
- [ ] M5.3 Storefront checkout: `place-order.ts` calls `POST /api/v1/checkout/orders` only. Remove the Edge Function path and the anon key.
- [ ] M5.4 Admin: confirm M3.7 is done (no `mock-store`, `isMockMode()`, or direct-Supabase data branches in `admin/src/lib/api.ts`). Only Supabase Auth sign-in and token retrieval remain.
- [ ] M5.5 Drop `@supabase/supabase-js` from the storefront `package.json`. Confirm a search for `supabase` and `mock` in `src/` and `admin/src/` finds nothing outside the admin auth module.
- [ ] M5.6 Local development: document running `server/` against a dev Supabase project in `README.md` and `server/README.md`; update both `.env.local.example` files. Fixtures live in the `server/` contract tests.
- [ ] M5.7 Update the static-export-reviewer agent notes that mention `DATA_PROVIDER`.
- **Rollback:** redeploy the previous build; there are no fallback flags left.

## 3. Verification checklist per stage
- Order counts, stock levels and invoice sequence match the recorded baseline plus expected new activity.
- No 5xx in API logs for the monitoring window; webhook deliveries in the Razorpay dashboard all return 2xx.
- Static assets (images, fonts) load under the new base paths with no 404s.

## 4. Risks
| Risk | Mitigation |
|---|---|
| Base path change breaks images/links on the storefront | Stage 1 isolated and tested before payments change |
| Webhook missed during cutover | Cut over in a quiet window; `verify-payment` reconciles stragglers; Razorpay retries failed deliveries |
| Oversell during parallel running | Both paths use the same `create_order_atomic`, so stock stays atomic |
| API down = admin and checkout down | systemd restart-on-failure, `/health` uptime check. Admin has no fallback path by design; checkout keeps `CHECKOUT_MODE=edge` until Stage 4 |
| Node code or `.env` exposed through the web root | nginx deny rules, env file outside web root, verify with a curl test for `/api/.env`, `/api/dist/` |
| Accidentally deleting `api/` or `admin/` while clearing the old storefront in `hilo/` | M1.4 explicit file list; take a tarball first |

## 5. Suggested timeline
| Stage | Effort | Wait before next |
|---|---|---|
| 0 Preconditions | 0.5 day | none |
| 1 Storefront relocation | 0.5 day | 1 day |
| 2 Checkout migration | 1.5 days | 48 h monitoring |
| 3 Admin migration | 2 days | about 1 week of use |
| 4 Lock down | 1 day | about 1 week |
| 5 Remove mock and direct Supabase code | 1 day | none |
