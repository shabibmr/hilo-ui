# Migration Plan: Direct Supabase to the Hilo API Service

Companion to `API_SERVICE_PLAN.md` (what we build). This file covers how we move the running system over safely: checkout first, then the admin app, then lock-down.

## 1. Target layout on the dev server

Base: `/var/www/html/algo_cloud/hilo/`

| Path | Contents | Public URL (assumed) |
|---|---|---|
| `.../hilo/api/` | Node API service (`dist/`, `package.json`, `node_modules`, `.env` kept outside web root or mode 600) | `/algo_cloud/hilo/api/` proxied to `127.0.0.1:<port>` |
| `.../hilo/store/` | Storefront static export (`out/`) | `/algo_cloud/hilo/store/` |
| `.../hilo/admin/` | Admin static export (`admin/out/`) | `/algo_cloud/hilo/admin/` |

Points to settle before touching anything:
- **Storefront moves.** It currently deploys to `.../hilo` with `basePath: /hilo` (see the `/hilo/` image-prefix commit). Moving to `/store/` means changing `NEXT_PUBLIC_BASE_PATH` (storefront) to the new URL prefix and rebuilding. Old URL `.../hilo/` then needs a redirect to `.../hilo/store/` or it will 404 once the folder holds only `api/store/admin`.
- **Node code is not served from the web root.** Static files in `api/` must never be reachable. nginx should `proxy_pass` `/algo_cloud/hilo/api/` to the Node port and deny direct access to `dist/`, `.env`, `node_modules`. If the server is Apache rather than nginx, use `ProxyPass` equivalents.
- The `.env` file must live outside `/var/www/html` (e.g. `/etc/hilo-api.env`, mode 600), since the web root is a leak risk.
- Admin and storefront are static, so CORS on the API must list exactly the admin and store origins.

## 2. Migration principles
- One stage at a time, each reversible with a flag or by redeploying the previous build.
- Keep the Supabase Edge Functions deployed and untouched until the final stage; rollback for checkout is "point the storefront back at them".
- Use Razorpay **test mode** for every parallel run. Switch to live keys only at cutover.
- No schema-destructive changes until the API has been the only writer for a full week.

## Stage 0: Preconditions
- [ ] M0.1 API phases 0-5 done and green in tests (auth, catalogue, orders, purchasing, settings).
- [ ] M0.2 Deploy the API to `.../hilo/api/` behind nginx with HTTPS, systemd/pm2, env file outside web root. `GET /health` reachable.
- [ ] M0.3 Take a database backup (`pg_dump` via Supabase connection string) and store it off-server. Record the restore command in the runbook.
- [ ] M0.4 Record current state: Edge Function URLs, Razorpay webhook URL, row counts per table, current stock per product (used to reconcile later).
- [ ] M0.5 Add feature flags: storefront `NEXT_PUBLIC_CHECKOUT_MODE=edge|api` (default `edge`) and admin `NEXT_PUBLIC_DATA_MODE=supabase|api` (default `supabase`).

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

## Stage 3: Admin app migration (read-only first, then writes)
Admin remains logged in through Supabase Auth; only data calls move.
- [ ] M3.1 Add `request()` helper to `admin/src/lib/api.ts` that attaches the access token; add `NEXT_PUBLIC_API_URL`.
- [ ] M3.2 Build admin for `.../hilo/admin/` base path and deploy a build in `DATA_MODE=api`.
- [ ] M3.3 Migrate **reads** first, in this order, verifying each screen against the old results: dashboard, collections, products, customers, orders, enquiries, suppliers, purchases, settings, invoices.
- [ ] M3.4 Migrate **simple writes**: collections, products (+ images), enquiries handled, suppliers, settings.
- [ ] M3.5 Migrate **sensitive writes** last: order status changes, release-hold, invoice creation, purchases (stock changes), refund, verify-payment. For each, test one action in the UI and confirm DB state matches the pre-migration behaviour.
- [ ] M3.6 Handle 401 (sign out and redirect) and 403 (show "not authorised") in `AuthContext`.
- [ ] M3.7 Keep `DATA_MODE=supabase` build available as the fallback until Stage 4.
- **Rollback:** redeploy the admin build with `DATA_MODE=supabase`. RLS still permits it until Stage 4.

## Stage 4: Lock down
Only after the API has been the sole path for about a week with no fallback use.
- [ ] M4.1 Remove authenticated-role write policies from admin tables and `storage.objects` (new SQL migration file under `docs/backend/` plus applied copy). Keep public read on published products/collections/site settings and anon insert on enquiries (or move enquiries to an API route and drop that policy too).
- [ ] M4.2 Re-run RLS tests as anon and as an authenticated non-API client; writes must fail.
- [ ] M4.3 Remove `DATA_MODE=supabase` and `CHECKOUT_MODE=edge` code paths and the direct-Supabase code in admin `api.ts` (keep mock mode only if still wanted for local dev).
- [ ] M4.4 Retire Edge Functions: undeploy once logs show zero traffic for 7 days. Keep source in git history.
- [ ] M4.5 Rotate secrets that were ever exposed during testing (Razorpay webhook secret, service role key if used locally).
- [ ] M4.6 Update `IMPLEMENTATION_PLAN.md`, `TASKS.md`, README and runbook with the new architecture.
- **Rollback:** reapply the dropped policies from the saved SQL (keep `rollback-policies.sql`).

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
| API down = admin and checkout down | systemd restart-on-failure, `/health` uptime check, documented fallback flags until Stage 4 |
| Node code or `.env` exposed through the web root | nginx deny rules, env file outside web root, verify with a curl test for `/api/.env`, `/api/dist/` |
| Accidentally deleting `api/` or `admin/` while clearing the old storefront in `hilo/` | M1.4 explicit file list; take a tarball first |

## 5. Suggested timeline
| Stage | Effort | Wait before next |
|---|---|---|
| 0 Preconditions | 0.5 day | none |
| 1 Storefront relocation | 0.5 day | 1 day |
| 2 Checkout migration | 1.5 days | 48 h monitoring |
| 3 Admin migration | 2 days | about 1 week of use |
| 4 Lock down | 1 day | none |
