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
- [x] A2. After A1. `index.ts` accepts `NEXT_PUBLIC_DATA_PROVIDER=api`. It is opt-in. Document `NEXT_PUBLIC_API_URL` in `.env.local.example`. Do not make `api` the production default in this row.

## Close-out

- [x] G1. `npm run lint` passes.
- [x] G2. `npm run build` passes.
- [~] G3. Browser, provider `mock`, desktop and 375px: `/`, `/collections/diy-kits/`, `/collections/view/?handle=diy-kits`, `/products/blooming-roses/`, `/products/view/?handle=blooming-roses`, cart open and close, checkout through `?preview=1`, contact page. Tagline, Accessories badge, and six philosophy cards plus the ritual cell are visible on `/`.
- [ ] G4. Browser, provider `api`, with the server running and a real service-role key: the same routes show database rows, a draft product is hidden, and a contact insert lands in `enquiries`. An unreachable `NEXT_PUBLIC_API_URL` shows `DataErrorState` on the hero, promo bar, footer, and contact address, with a working retry. After this pass, set the production default provider to `api`.
