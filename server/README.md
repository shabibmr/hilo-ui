# Hilo read API

Express service for published catalog, site settings, and enquiries. Listens on port 4000. Base path: `/api/v1`.

## Setup

```bash
cd server
cp .env.example .env
# fill SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
npm install
npm run dev
```

Production-style: `npm start`.

## Env

| Var | Required | Default |
|---|---|---|
| `SUPABASE_URL` | yes | — |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | — |
| `PORT` | no | `4000` |
| `CORS_ORIGIN` | no | `*` (set a comma-separated allow-list in production) |

## Contract notes

- Errors: `{ "error": { "code", "message", "details?" } }`
- Enquiry success: `204` (no body)
- Enquiry validation failure: `422`
- Rate limits: 120 req/min/IP on `/api/v1`; `POST /enquiries` is 5/min/IP (`429` + `Retry-After`)
- Successful catalog GETs: `Cache-Control: public, max-age=60`; settings: `max-age=30`
- OpenAPI: `GET /api/v1/openapi.json`
- Health: `GET /health` pings `site_settings` (`{ ok, db }` or `503`)

## Curl checks

```bash
curl -s http://127.0.0.1:4000/health
curl -s http://127.0.0.1:4000/api/v1/openapi.json
curl -s http://127.0.0.1:4000/api/v1/products
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

Draft products must not appear. Best sellers are `is_best_seller = true` and published. Missing settings → 404. Enquiry success → 204.
