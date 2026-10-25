# Migration Runbook (operator steps)

Companion to `API_MIGRATION_PLAN.md`. Everything here is run by a person on the server or in a dashboard. Nothing in this file has been executed.

## Flags (already in code)
| Flag | App | Values | Default |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_PATH` | storefront, admin | URL prefix the export is served under | storefront `/hilo`, admin empty |
| `NEXT_PUBLIC_CHECKOUT_MODE` | storefront | `edge` or `api` | `edge` |
| `NEXT_PUBLIC_DATA_MODE` | admin | `supabase` or `api` | `supabase` (not wired until Stage 3) |

Flags are baked in at build time, so changing one means rebuilding and redeploying.

## Stage 0: preconditions
```bash
# Backup (store the file off-server)
pg_dump "$SUPABASE_DB_URL" -Fc -f hilo-$(date +%F).dump
# Restore
pg_restore --clean --if-exists -d "$SUPABASE_DB_URL" hilo-YYYY-MM-DD.dump

# Baseline (save the output)
psql "$SUPABASE_DB_URL" -c "select 'orders', count(*) from orders union all select 'products', count(*) from products union all select 'invoices', count(*) from invoices;"
psql "$SUPABASE_DB_URL" -c "select id, stock from products order by id;"
```
Record the Edge Function URLs and the current Razorpay webhook URL.

API env file lives outside the web root: `/etc/hilo-api.env`, `chmod 600`. Run the API under systemd with `Restart=on-failure`.

nginx sketch (adjust if Apache):
```nginx
location /algo_cloud/hilo/api/ { proxy_pass http://127.0.0.1:4000/; }
location ~ ^/algo_cloud/hilo/api/(dist|node_modules|\.env) { deny all; }
```
Leak check: `curl -I https://<host>/algo_cloud/hilo/api/.env` and `.../api/dist/` must not return 200.

## Stage 1: storefront relocation
```bash
cd /var/www/html/algo_cloud
tar czf hilo-pre-stage1-$(date +%F).tgz hilo   # safety copy first

# Build with the new prefix, e.g.
NEXT_PUBLIC_BASE_PATH=/algo_cloud/hilo/store npm run build
mkdir -p hilo/store && cp -r out/. hilo/store/
```
Smoke test: home, collection, product, cart, contact, checkout; confirm images load with no 404s.

Redirect `.../hilo/` to `.../hilo/store/` in nginx, then remove only the old storefront files from `hilo/`. Never delete `api/`, `admin/` or `store/`; list the files explicitly rather than `rm -rf hilo/*`.

Rollback: restore from the tarball and drop the redirect.

## Stage 2: checkout cutover
Blocked until the API has `POST /api/v1/checkout/orders` and `POST /api/v1/webhooks/razorpay` (the `server/` today has read routes only).

1. Deploy the API with Razorpay test keys; add a test webhook in the Razorpay dashboard pointing at the API. Leave the production webhook on the Edge Function.
2. Build a staging storefront with `NEXT_PUBLIC_CHECKOUT_MODE=api`. Run the M2.4 checks from the plan.
3. Cutover in a quiet window: repoint the live webhook to the API, put live keys in `/etc/hilo-api.env`, restart the API, rebuild the storefront with `CHECKOUT_MODE=api`, deploy to `store/`.
4. Place one low-value real order, then refund it from Razorpay.
5. Watch for 48 hours: every `paid` order has a payment id; no `pending` older than 15 minutes.

Rollback: repoint the webhook to the Edge Function, rebuild with `CHECKOUT_MODE=edge`.

## Stage 3: admin
Needs API auth and the admin routes first. Then: set `NEXT_PUBLIC_BASE_PATH=/algo_cloud/hilo/admin`, `NEXT_PUBLIC_DATA_MODE=api`, `NEXT_PUBLIC_API_URL`, build, deploy to `hilo/admin/`. Keep a `supabase`-mode build for fallback.

## Stage 4: lock down (after about a week with no fallback use)
Save `rollback-policies.sql` with the current policies before dropping anything. Drop authenticated write policies on admin tables and `storage.objects`, re-test as anon and as a non-API authenticated client, remove the fallback code paths, undeploy Edge Functions after 7 days of zero traffic, rotate exposed secrets.
