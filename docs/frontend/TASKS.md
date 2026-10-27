# Storefront and read API

Status: `[ ]` todo, `[~]` in progress, `[x]` done.

Spec: `docs/frontend/IMPLEMENTATION_PLAN.md`.

Two lanes run at the same time. Lane 1 does not wait on the server. Lane 2 starts with the scaffold, then each row after its predecessor. One worker per lane.

## Done (do not redo)

- [x] `useLive` loads the homepage, collection, and product in the browser.
- [x] `[handle]` pages are shells. `generateStaticParams` keeps handles known at build time. Product cards link to `/products/view/?handle=`.
- [x] `CommerceRepository` and `ContentRepository`.
- [x] Browser cart in Zustand (`hilo-arte-cart-storage`).
- [x] Sold-out buttons use `availableForSale`. Plus stops at `variant.stock` when the number is present.
- [x] Guest checkout fields. `placeOrder` posts to the `create-order` Edge Function with nested `customer.shippingAddress` and items of `{ productId, quantity }`.
- [x] Homepage layout aligned to `docs/mockups/hilo-editorial-luxury.html`, except the copy rows in Lane 1.
- [x] Edge Functions `create-order`, `verify-payment`, `razorpay-webhook`, and `release-expired-orders`. Do not rebuild them.

## Lane 1 — storefront, no server

- [x] L1. Mock provider sets `variant.stock` on every returned product. An existing fixture `stock` wins. Otherwise use a positive number when `availableForSale` is true and `0` when it is false. Returned `availableForSale` is `stock > 0`. Check: one fixture at `stock: 0` shows "Sold out" on the card and the product page, and the cart does not open. Restore that fixture.
- [x] L2. Image paths in `src/lib/data/mock/`, `hero-section.tsx`, and `collections-nav-section.tsx` start with `/images/`. Accessories in `collectionsNav` is `badge: 'Coming Soon'`, `isComingSoon: true`, and the nav card links to `/coming-soon`. Check: a local product image requests `/hilo/images/...` once.
- [x] L3. `useSiteSettings` returns `reload` and drops its cache on retry. Promo bar, the footer store block, and the contact address column render `DataErrorState` with that reload. The footer Accessories link is `/coming-soon`. The enquiry form still submits.
- [x] L4. Add `src/app/(shop)/collections/view/page.tsx` on the pattern of `products/view`. Write one paragraph in `docs/frontend/STATIC_ROUTES.md`: query shells are `/products/view/?handle=` and `/collections/view/?handle=`; a bare unknown handle 404s until the next export. Check: `/collections/view/?handle=diy-kits` shows that collection.
- [x] L5. `PaymentCancelled` message is `Payment was not completed. Your items stay reserved for 15 minutes.` Stay on checkout. Do not change the request URL or body.
- [x] L6. Checkout drops the ₹99 / ₹1499 total. Line prices and the subtotal are a preview. The pay button does not print that subtotal as the amount due. Mock submit goes to `/checkout/confirmation/?preview=1`. Supabase submit still calls `placeOrder` and then `/checkout/confirmation/?order=`.
- [x] L7. Confirmation with no `order` and no `preview` shows `DataErrorState` and a link to `/checkout`. `preview=1` says no order was placed and no payment was taken. A non-empty `order` shows that id.
- [x] L8. Remove the ₹1499 / ₹99 claim from the cart drawer, the product page, `faq/page.tsx`, and `policies/shipping/page.tsx`. Keep dispatch timing. Do not add a new fee.
- [x] L9. `HoopLogo` tagline is `Stitch beauty into your life`. `WhyHiloSection` shows the fixed ritual cell and all six cards. The headline and paragraph are the ones in the plan.
- [x] L10. In `src/app/layout.tsx`, set `metadataBase`, `og:site_name` `HILO ARTE`, and one default `og:image`. Add `src/app/robots.ts` that allows the public pages and disallows `/checkout` and `/checkout/confirmation`.

## Lane 2 — read API

- [x] B0. Scaffold `server/` with TypeScript, Express, CORS, and `.env`. Listen on port 4000. Leave a single mount for `/api/v1`.
- [x] B1. After B0. Supabase client with `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_URL`. No `pg` pool.
- [x] B2. After B1. `server/src/routes/catalog.ts` implements the five catalog routes in the plan. Published rows only. `GET /collections/:handle` returns a `Collection` with no `products` array. Check with an HTTP client: a published product is returned, a draft is not, and best sellers match `is_best_seller`.
- [x] B3. After B1. `server/src/routes/content.ts` implements `GET /settings` and `POST /enquiries`. Missing settings row is 404. Enquiry success is 204. Check both with an HTTP client.
- [x] A1. After B2 and B3 are specified. `src/lib/data/providers/api-provider.ts` calls `${NEXT_PUBLIC_API_URL}/api/v1` for the seven methods. A non-OK settings response throws. Cart methods use an in-memory `Map`. Homepage and founder content stay on the mock modules.
- [x] A2. (Superseded by ADR 0001 / M3.) The provider switch no longer exists; the API is the only data path (no opt-in or fallback flags). `NEXT_PUBLIC_API_URL` is required and documented in `.env.local.example`.

## Accepted additions on the API
Beyond the initial public read routes (B0–B3), `server/` carries additional endpoints, middleware, and operational capabilities accepted under ADR 0001 and `docs/backend/API_MIGRATION_PLAN.md`:

- **Admin Routes (`server/src/routes/admin.ts`)**: Full CRUD and management endpoints mounted at `/api/v1/admin/*` for products, collections, orders, enquiries, customers, suppliers, purchase orders, site settings, invoices, and storage uploads. Authenticated via `requireAdminAuth` with Supabase Auth bearer tokens. Accepted per ADR 0001 ("Admin is API-only") and `docs/backend/API_MIGRATION_PLAN.md` Stage 3 (M3.1–M3.7), replacing direct Supabase browser access.
- **Checkout and Webhook Port (`server/src/routes/checkout.ts`, `server/src/routes/webhooks.ts`)**: Server-side checkout order creation (`POST /checkout/orders`), payment verification (`POST /checkout/verify-payment`), and raw-body Razorpay webhook processing (`POST /webhooks/razorpay`) with HMAC-SHA256 signature verification. Accepted per ADR 0001 and `docs/backend/API_MIGRATION_PLAN.md` Stage 2 (M2.1–M2.8) to migrate checkout logic off Supabase Edge Functions into the unified API.
- **OpenAPI 3.0 Specification (`server/src/openapi.ts`)**: Serves `GET /api/v1/openapi.json` documenting the public catalog, settings, and enquiry routes. Accepted per ADR 0001 to maintain an explicit contract for client consumers.
- **Rate Limiting (`server/src/http.ts`)**: In-memory per-IP sliding/fixed window rate limiters applied globally across `/api/v1` (120 req/min) and tightened on sensitive endpoints (`POST /checkout/orders` at 10 req/min, `POST /enquiries` at 5 req/min). Accepted per ADR 0001 and `docs/backend/API_MIGRATION_PLAN.md` to protect public endpoints without an Edge Function gateway.
- **Security Headers (`server/src/http.ts`)**: `securityHeaders` middleware adding `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and `X-DNS-Prefetch-Control: off`. Accepted per ADR 0001 and `docs/backend/API_MIGRATION_PLAN.md` reverse proxy / service security baseline.
- **Product-by-ID Route (`server/src/routes/catalog.ts`)**: `GET /api/v1/products/id/:id` returning a single published product by UUID. Accepted per ADR 0001 as required by the storefront cart repository (`src/lib/data/providers/api-provider.ts`) to fetch product details and verify prices and availability for cart items stored by UUID in localStorage.
- **Pagination and Cache Headers (`server/src/routes/catalog.ts`)**: `X-Total-Count`, `X-Page`, `X-Limit`, and `X-Total-Pages` response headers for paginated product lists, alongside `Cache-Control` response headers. Accepted per ADR 0001 and `docs/backend/API_SERVICE_PLAN.md`.

## Close-out

- [x] G1. `npm run lint` passes.
- [x] G2. `npm run build` passes.
- [x] G3. (Superseded by ADR 0001 / M3–M4.) Mock provider pass and `?preview=1` checkout are obsolete; mock fixtures and preview branches were deleted. Browser verification is consolidated into the live API pass (G4).
- [ ] G4. Browser verification pass against the live API (the only data path since M3), with the server running and a real service-role key: routes (`/`, `/collections/view/?handle=diy-kits`, `/products/view/?handle=blooming-roses`, cart open/close, live checkout flow with test Razorpay keys, contact page) show database rows for catalog items, while homepage and founder stories are served by the API as server-held content (`server/src/content.ts` per ADR 0001 / M1, not database rows). Draft products are hidden, and contact submissions insert into `enquiries`. An unreachable `NEXT_PUBLIC_API_URL` shows `DataErrorState` on the hero, promo bar, footer, and contact address, with a working retry. (The old "set the default provider to api" step is obsolete after M3.)

## API-only (ADR 0001): remove mock and direct Supabase
Order matters. The live API pass (G4) and backend Stage 2 (API checkout) come first. See `docs/backend/API_MIGRATION_PLAN.md` Stage 5.
- [x] M0. Checkout runs the real flow for every provider except `mock` (it used to run only for `supabase`, so `api` builds showed the mock confirmation).
- [x] M1. Serve homepage and founder content from the API (settings or a content endpoint). `ApiContentRepository` returns no fixtures. Content is held as plain content in `server/src/content.ts` (ADR 0001), not in database rows.
- [x] M2. Checkout: `placeOrder` posts to `/api/v1/checkout/orders` only. Delete the Edge Function branch, `NEXT_PUBLIC_CHECKOUT_MODE`, and the Supabase env vars.
- [x] M3. Delete `src/lib/data/mock/`, `mock-provider.ts`, `supabase-provider.ts`, `src/lib/supabase.ts`, and the `@supabase/supabase-js` dependency. `providers/index.ts` builds only the API repositories and throws without `NEXT_PUBLIC_API_URL`.
- [x] M4. Delete the `?preview=1` demo branch in `checkout/page.tsx` and the "mock checkout" notice on the confirmation page.
- [x] M5. `.env.local.example` keeps only `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_BASE_PATH`, and `NEXT_PUBLIC_RAZORPAY_KEY_ID`. Document running `server/` for local development.
- [x] M6. A search for `mock` and `supabase` in `src/` finds nothing. Lint and build pass. Browser pass on the G3 routes against a running API.
