# Storefront Phase 5: task list

Status: `[ ]` todo, `[~]` in progress, `[x]` done.

Spec: `docs/frontend/GAPS_REPORT.md`. Steps and file names: `docs/frontend/IMPLEMENTATION_PLAN.md`.

Owner of every row below is the storefront. Edge Functions, schema, seed, and admin screens stay on `docs/backend/TASKS.md`.

## Phase A — Runtime catalog

- [ ] A1. Add `src/lib/catalog/use-catalog.ts` with `{ data, error, loading, retry }` and a loader argument
- [ ] A2. Homepage best sellers and hero load in a client section. `src/app/page.tsx` does not await the repository
- [ ] A3. Collection page loads the collection and its products in a client section. `generateStaticParams` stays for handles known at build time
- [ ] A4. Product page loads the product in a client section. The built HTML does not contain the product JSON from build time
- [ ] A5. Write `docs/frontend/STATIC_ROUTES.md`: nginx must fall back unknown `/hilo/products/*` and `/hilo/collections/*` to a client shell, or a new handle 404s until the next export
- [ ] A6. Verify: `npm run build` with `NEXT_PUBLIC_DATA_PROVIDER=mock`. Product page shows a loading state, then the product. A bad Supabase URL shows `DataErrorState`, not mock kits

## Phase B — No stand-in content

- [ ] B1. `getSiteSettings` returns the row or throws. Remove the Bandra address, phone, email, GSTIN, and announcement defaults
- [ ] B2. `getHomepageContent` throws when settings fail. It does not return `MOCK_HOMEPAGE_CONTENT` from the catch
- [ ] B3. Promo bar, footer, and contact render `DataErrorState` with `onRetry` when settings fail
- [ ] B4. Provider `supabase` with a missing URL throws at startup in every environment, including production. Remove the placeholder client path for that case
- [ ] B5. Verify: `rg "27AAPFH1842Q1Z5|Studio 4, 18 Hill Road" src` finds nothing. Retry on the homepage calls the loader again

## Phase C — Stock

- [ ] C1. Add `stock: number` to `Product`. Map it in the Supabase provider and the mock provider
- [ ] C2. `AddToCartButton` shows "Sold out" at `stock <= 0` and does not call `addItem`. Plus stops at `stock`
- [ ] C3. `ProductCard` shows the same sold-out state and disables add
- [ ] C4. Verify: one mock product at stock 0 shows sold out on the card and the product page, and the cart does not open. Restore that stock before finishing

## Phase D — Images

- [ ] D1. `next.config.ts` `images.remotePatterns` allows `https://*.supabase.co` storage object URLs
- [ ] D2. Image paths in mock data and section fallbacks use `/images/...`, not `/hilo/images/...`
- [ ] D3. Verify: a local product image requests `/hilo/images/...` once. An absolute Supabase Storage URL renders

## Phase E — Checkout call site

Depends on the `create-order` Edge Function contract in the implementation plan. The function itself is backend work.

- [ ] E1. Add `src/lib/checkout/place-order.ts` with `placeOrder(PlaceOrderInput): Promise<PlaceOrderResult>`
- [ ] E2. Checkout submit sends ids, quantities, and the shipping contact, then opens Razorpay with the amount and key id from the response
- [ ] E3. Razorpay success navigates to `/checkout/confirmation/?orderId=`. Dismiss shows the 15-minute hold message and stays on checkout
- [ ] E4. Confirmation with no `orderId` shows `DataErrorState`. With an id, it shows that id
- [ ] E5. Verify: the invoke body has no price field. Confirmation without a query param does not say the order was received

## Phase F — Editorial mockup deltas

- [ ] F1. `HoopLogo` tagline is `Stitch beauty into your life`
- [ ] F2. Accessories is coming soon and does not link to a live collection grid
- [ ] F3. Philosophy section shows the large ritual cell plus all six cards, including Beginner Friendly
- [ ] F4. Verify on `/` at desktop and at 375px: tagline, Accessories badge, six cards plus the large cell

## Phase G — Close-out

- [ ] G1. `npm run lint` passes
- [ ] G2. `npm run build` passes
- [ ] G3. Browser, provider `mock`: `/`, `/collections/diy-kits/`, `/products/blooming-roses/`, cart open and close, checkout form, contact page. Desktop and 375px
- [ ] G4. Browser, provider `supabase`, only with a real URL and anon key: same routes use database rows, a draft product is hidden, contact insert lands in `enquiries`
- [ ] G5. Mark the matching Phase 5 rows in `docs/backend/TASKS.md` done. Leave Phase 5b Edge Function rows as they are

## Already done (do not redo)

- [x] Repository interfaces and a mock provider
- [x] Supabase mapper for published products, collections, best sellers, one default variant, enquiries, and hero field names
- [x] Browser cart in Zustand
- [x] Homepage aligned to `docs/mockups/hilo-editorial-luxury.html`, except the three Phase F items
- [x] Guest checkout form fields (the submit path is Phase E)
