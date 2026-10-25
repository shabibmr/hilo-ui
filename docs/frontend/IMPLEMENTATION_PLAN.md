# Storefront and read API

> For agentic workers: follow `docs/frontend/TASKS.md`. Two lanes run at the same time. Lane 1 does not wait on the server. Do not modify `admin/` or `supabase/functions/`.

Revised 2026-10-25 from `docs/frontend/PLAN_SIMPLIFICATION.md`.

**Goal:** Serve published catalog, site settings, and enquiries from a small API, point the storefront at it through the existing repositories, and finish the storefront copy and routing fixes that do not need that API.

**Architecture:** `server/` is an Express service that reads and writes through the Supabase service-role client. The storefront keeps `commerceRepository` and `contentRepository`. `api-provider.ts` calls the read API for catalog, settings, and enquiries. Cart methods stay an in-memory map, the same way the Supabase provider works today. Checkout keeps posting to the existing `create-order` Edge Function.

**Tech stack:** Next.js 16 static export (`output: 'export'`, `basePath: '/hilo'`, `trailingSlash: true`, `images.unoptimized: true`), React 19, Tailwind 4, Zustand. API: Node, Express, TypeScript, `@supabase/supabase-js` service role.

## Out of this plan

- Rebuilding `create-order`, `verify-payment`, `razorpay-webhook`, or `release-expired-orders`. Those functions stay in `supabase/functions/`.
- Admin management endpoints.
- A `pg` connection pool. The API uses `SUPABASE_SERVICE_ROLE_KEY` only.
- Per-product Open Graph tags, a product sitemap, JSON-LD inside `ProductView`, and WhatsApp image recompression. Product HTML is fetched in the browser, and `/products/view/?handle=` is one static file, so those tags cannot vary by handle.

## Decisions

1. **Routes match the repository.** One route per method. Response bodies are the existing `Product`, `Collection`, and `SiteSettings` types. `GET /collections/:handle` returns a `Collection` and does not embed products. `POST /enquiries` returns 204. `getHomepageContent` and `getFounderStory` stay on mock data inside the provider. Do not add routes for them.
2. **Cart is not HTTP.** `api-provider.ts` implements `createCart`, `getCart`, `hydrateCart`, `addCartLine`, `updateCartLine`, and `removeCartLine` with an in-memory `Map`, copied from the Supabase provider. Components keep calling the repository.
3. **Settings failures throw.** `GET /settings` returns 404 when the row is missing. The provider throws on a non-OK response. It does not fill the hero, address, or GSTIN from mock content. Homepage body sections still come from `MOCK_HOMEPAGE_CONTENT`; only the hero is overlaid from settings.
4. **Provider `api` is opt-in** until the live browser pass passes. Production keeps the current rule: the provider must be set explicitly. The production default becomes `api` as the last step of that pass.
5. **Checkout body stays.** `placeOrder` keeps posting to the Edge Function. The body is `customer` (name, email, phone, nested `shippingAddress` with `fullName`, `line1`, `city`, `state`, `postalCode`, `country: 'IN'`) and `items` of `{ productId, quantity }`. No `price`, `subtotal`, or `unit_price`. The Razorpay amount is the function's `amount`.
6. **No second shipping total.** The Edge Function charges the database subtotal in paise. The storefront must not show a ₹99 fee or a free-over-₹1499 threshold as the amount due.
7. **Image paths** are stored as `/images/...`. `basePath` adds `/hilo` once. Do not add `images.remotePatterns`.
8. **New collection handles** open at `/collections/view/?handle=`, matching `/products/view/?handle=`. A bare `/collections/<handle>/` that was not in the last export 404s until the next export.
9. **Mockup copy.** Tagline `Stitch beauty into your life`. Accessories links to `/coming-soon`. The philosophy feature cell headline is `A quieter ritual for modern evenings.` The paragraph is `HILO ARTE is not a craft supply shop. It is a slow-living embroidery experience — premium materials, guided lessons, and the permission to create without hurry.` All six cards render beside that cell, including Beginner Friendly.

## API contract

Base path: `/api/v1`. Published rows only. `stock` is on the variant. `availableForSale` is `stock > 0`.

| Method | Route | Returns |
|---|---|---|
| `getProducts` | `GET /products?collection=&difficulty=&maxPrice=` | `Product[]` |
| `getBestSellers` | `GET /products/best-sellers` | `Product[]` |
| `getProductByHandle` | `GET /products/:handle` | `Product` or 404 |
| `getCollections` | `GET /collections` | `Collection[]` |
| `getCollectionByHandle` | `GET /collections/:handle` | `Collection` or 404 |
| `getSiteSettings` | `GET /settings` | `SiteSettings` or 404 |
| `submitEnquiry` | `POST /enquiries` | 204 |

Enquiry body: `{ name, email, message, kind?: 'contact' | 'workshop' }`.

The service listens on port 4000. Nginx, when deployed:

- `/hilo/api/v1/` proxies to `http://127.0.0.1:4000/api/v1/`
- `/hilo/` serves the static export at `/var/www/html/algo_cloud/hilo`

## File map

| File | Lane | Responsibility |
|---|---|---|
| `server/` | 2 | Express app, service-role client, `routes/catalog.ts`, `routes/content.ts` |
| `src/lib/data/providers/api-provider.ts` | 2 | HTTP for the seven methods. In-memory cart. Settings errors throw |
| `src/lib/data/providers/index.ts`, `.env.local.example` | 2 | Opt-in `api` provider and `NEXT_PUBLIC_API_URL` |
| `src/lib/data/providers/mock-provider.ts` | 1 | Numeric `variant.stock` |
| `src/lib/data/mock/`, `hero-section.tsx`, `collections-nav-section.tsx`, `homepage-content.ts` | 1 | `/images/...` paths and Accessories coming soon |
| `footer.tsx`, `promo-bar.tsx`, `contact/page.tsx`, `use-live.ts` | 1 | Settings `reload` and `DataErrorState`. Footer Accessories href |
| `src/app/(shop)/collections/view/page.tsx`, `docs/frontend/STATIC_ROUTES.md` | 1 | Collection query shell and one-paragraph route note |
| `place-order.ts` | 1 | Dismiss sentence only. Same request URL and body |
| `checkout/page.tsx`, `confirmation/page.tsx` | 1 | Preview subtotal, `preview=1`, `order` id |
| `cart-drawer.tsx`, `product-view.tsx`, `faq/page.tsx`, `policies/shipping/page.tsx` | 1 | Remove the ₹1499 / ₹99 claim |
| `hoop-logo.tsx`, `why-hilo-section.tsx` | 1 | Tagline and philosophy cell |
| `src/app/layout.tsx`, `src/app/robots.ts` | 1 | Default social metadata and crawler rules |

## Review focus

- `GET /collections/:handle` does not include a `products` array. The storefront loads products with `getProducts`.
- Provider `api` with the URL missing does not become the production default before the live pass.
- Provider `api` and an unreachable URL: hero, promo bar, footer store block, and contact address show `DataErrorState` and retry. They do not show the Bandra address or GSTIN `27AAPFH1842Q1Z5`.
- Checkout still posts to the Edge Function. The body has nested `customer.shippingAddress` and no price field.
- A local image requests `/hilo/images/...` once.
- `/collections/view/?handle=diy-kits` renders that collection.
