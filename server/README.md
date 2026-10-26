# Hilo API

Express service shared by the storefront and the admin app. Listens on port 4000. Base path: `/api/v1`.

Public: published catalog, site settings, enquiries, checkout, Razorpay webhooks.  
Admin: `/api/v1/admin/*` (Supabase access token + `ADMIN_USER_IDS`).

## Setup

```bash
cd server
cp .env.example .env
# fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

## Local development

There is no mock data mode: the storefront and admin both call this API, and the API reads a real Supabase project. Use a **development** Supabase project (never production keys):

1. Apply `docs/backend/schema.sql` to the dev project and add whatever catalogue rows you need.
2. Fill `server/.env` with that project's `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, plus `CORS_ORIGIN` for the local app origins.
3. `npm run dev` here (port 4000), then set `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000` in the storefront's `.env.local`.

Test fixtures live in the contract tests (`test-api.mjs`), not in the apps.

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | `tsx watch` for local development |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build (`node dist/index.js`) |
| `npm run start:tsx` | Run TypeScript directly without a build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Contract checks in `test-api.mjs` |

Production: `npm run build && npm start` (systemd or similar). Keep the env file outside the web root.

## Env

| Var | Required | Default |
|---|---|---|
| `SUPABASE_URL` | yes | — |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | — |
| `ADMIN_USER_IDS` | for admin routes | empty (nobody admin) |
| `PORT` | no | `4000` |
| `CORS_ORIGIN` | no | `*` (set a comma-separated allow-list in production) |
| `NODE_ENV` | no | — (`production` warns if CORS is `*`) |
| `RAZORPAY_*` | for checkout/webhooks | — |

## Contract notes

- Public errors: `{ "error": { "code", "message", "details?" } }`
- Admin/checkout errors: `{ "error": string }`
- Enquiry success: `204` (no body); validation failure: `422`
- Rate limits: 120 req/min/IP on `/api/v1`; `POST /enquiries` is 5/min/IP (`429` + `Retry-After`)
- Successful catalog GETs: `Cache-Control: public, max-age=60`; settings: `max-age=30`
- Security headers: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- OpenAPI (public surface): `GET /api/v1/openapi.json`
- Health: `GET /health` pings `site_settings` (`{ ok, db }` or `503`)

### Pagination (opt-in)

List endpoints keep a JSON **array** body. Pass `?page=1&limit=50` to page (default limit 50, max 200). Responses then include:

- `X-Total-Count`
- `X-Page`
- `X-Limit`

Omit `page` and `limit` for the full list (current storefront and admin clients).

Admin filters (with or without pagination):

- `GET /admin/orders?status=pending`
- `GET /admin/enquiries?handled=false&kind=contact`

### Handles (admin writes)

`POST /admin/products` and `POST /admin/collections` derive `handle` from `title` when missing, and reject invalid handles. `PATCH` validates `handle` when it is present.

## Curl checks

```bash
curl -s http://127.0.0.1:4000/health
curl -s http://127.0.0.1:4000/api/v1/openapi.json
curl -s http://127.0.0.1:4000/api/v1/products
curl -s "http://127.0.0.1:4000/api/v1/products?page=1&limit=10" -D -
curl -s "http://127.0.0.1:4000/api/v1/products?collection=diy-kits&difficulty=Beginner"
curl -s http://127.0.0.1:4000/api/v1/products/best-sellers
curl -s http://127.0.0.1:4000/api/v1/products/blooming-roses
curl -s http://127.0.0.1:4000/api/v1/products/id/<uuid>
curl -s http://127.0.0.1:4000/api/v1/collections
curl -s http://127.0.0.1:4000/api/v1/collections/diy-kits
curl -s http://127.0.0.1:4000/api/v1/settings
curl -s -o /dev/null -w "%{http_code}" -X POST http://127.0.0.1:4000/api/v1/enquiries \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Ada\",\"email\":\"ada@example.com\",\"message\":\"Hello\",\"kind\":\"contact\"}"
```

Draft products must not appear on public routes. Best sellers are `is_best_seller = true` and published. Missing settings → 404. Enquiry success → 204.
