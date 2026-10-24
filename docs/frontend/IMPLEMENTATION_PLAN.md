# Storefront Phase 5 implementation plan

> For agentic workers: use this plan task-by-task. Check off `docs/frontend/TASKS.md` as each item is verified. Do not start the admin app or the Edge Functions from this plan.

**Goal:** Make the existing storefront read live catalog and site settings in the browser, refuse stand-in content when Supabase fails, show sold out from live stock, and place an order by sending ids and quantities to `create-order`.

**Architecture:** Keep `CommerceRepository` and `ContentRepository`. Keep `SupabaseCommerceRepository` as the mapper. Move catalog reads from server components (which `output: 'export'` runs only at build time) into client shells that fetch on mount. Checkout gains one function, `placeOrder`, that calls the Edge Function. Prices stay on the server.

**Tech stack:** Next.js 16 static export (`output: 'export'`, `basePath: '/hilo'`), React 19, Tailwind 4, Zustand, `@supabase/supabase-js` anon key.

**Spec:** `docs/frontend/GAPS_REPORT.md`, which records the comparison against `docs/backend/IMPLEMENTATION_PLAN.md` and `docs/mockups/hilo-editorial-luxury.html`.

There is no test runner in `package.json`. Each task is verified with `npm run lint`, `npm run build`, and a browser pass on the routes named in the task. Do not add Vitest as part of this work.

## Global constraints

- Scope is `src/`, `next.config.ts`, `.env.local.example`, and the new docs under `docs/frontend/`. Do not change `admin/` except to read the `site_settings` shape it already writes.
- No component calls Supabase. Only `src/lib/supabase.ts` and `src/lib/data/providers/supabase-provider.ts` may.
- Mock data is allowed only when the provider is `mock` (local development). With provider `supabase`, a failed read shows `DataErrorState` and a working retry. It does not render mock products, the Bandra address, or GSTIN `27AAPFH1842Q1Z5`.
- The browser order payload is product ids, quantities, and the shipping contact. It does not include prices.
- One default variant per product. Variant id stays `${product.id}-default`.
- Cart remains client-side (`hilo-arte-cart-storage`).
- Homepage body sections and the founder story stay on mock content. Only the hero, announcement, store contact, and social links come from `site_settings`.
- Match the editorial mockup. Do not restyle toward `docs/hilo-mock1.png`.
- Touch only the files a task names.

## Decisions

1. **Client catalog shells.** Homepage best sellers, collection grids, and product detail fetch in `useEffect` (or an equivalent client hook) through the repository. Server `page.tsx` files render the shell. They do not `await` the repository for catalog rows.
2. **New handles.** Prebuilt HTML for handles that existed at the last export will show live edits with no rebuild. A handle created after that export 404s on nginx until either the site is exported again or the server falls back unknown `/hilo/products/*` and `/hilo/collections/*` paths to a client shell. Record the nginx fallback as a deploy note in `docs/frontend/STATIC_ROUTES.md`. Do not pretend static export can invent new HTML files at runtime.
3. **Stock on the product.** Add `stock: number` to the storefront `Product` type and set it in both providers. `availableForSale` stays `stock > 0`. The UI uses `stock` only to disable add and to cap the quantity control. The Edge Function remains the authority that decrements stock.
4. **Images.** Add `images.remotePatterns` for `*.supabase.co`. Store image paths in data without the `/hilo` prefix so `basePath` is applied once.
5. **Checkout waits on the function contract.** Implement `placeOrder` against this request and response. If the deployed function differs, change the type in one file (`src/lib/checkout/place-order.ts`) only.

```ts
type PlaceOrderItem = { productId: string; quantity: number };

type PlaceOrderInput = {
  items: PlaceOrderItem[];
  customer: { name: string; email: string; phone: string };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
  };
};

type PlaceOrderResult = {
  orderId: string;
  razorpayOrderId: string;
  amount: number;       // paise, from the server
  currency: 'INR';
  keyId: string;        // Razorpay key id returned by the function
};
```

The function name is `create-order`. The client calls `supabase.functions.invoke('create-order', { body })`. Razorpay Checkout opens with `keyId`, `amount`, `currency`, and `razorpayOrderId`. The confirmation page is reached only from the Razorpay success handler, and it shows `orderId`. Closing the modal without payment leaves the order `pending` and shows that the hold lasts 15 minutes.

6. **Mockup fixes are copy and layout only.** Tagline string, Accessories `isComingSoon`, and a philosophy feature cell that is not one of the six cards.

## File map

| File | Responsibility |
|---|---|
| `src/lib/data/types.ts` | Add `stock` on `Product` |
| `src/lib/data/providers/supabase-provider.ts` | Map `stock`. Stop swallowing settings errors into mock content when the provider is supabase |
| `src/lib/data/providers/mock-provider.ts` | Set `stock` from the fixture variant (`availableForSale` true → a positive stock, false → 0) |
| `src/lib/data/providers/index.ts` | Refuse to construct the Supabase client when the URL is missing, including in production |
| `src/lib/catalog/use-catalog.ts` | Client hook: load, error, retry for products, one product, collections |
| `src/components/common/error-retry.tsx` | Retry button is required for catalog failures. Callers pass `onRetry` |
| `src/app/page.tsx` | Shell. Best sellers load on the client. Hero still comes from settings fetched on the client |
| `src/app/(shop)/collections/[handle]/page.tsx` | Shell plus client grid. `generateStaticParams` may stay so current handles have a file |
| `src/app/(shop)/products/[handle]/page.tsx` | Shell plus client detail |
| `src/components/commerce/add-to-cart-button.tsx` | Sold-out state and quantity cap |
| `src/components/commerce/product-card.tsx` | Sold-out label. Disable the card add button at stock 0 |
| `src/lib/checkout/place-order.ts` | The only module that invokes `create-order` |
| `src/app/(shop)/checkout/page.tsx` | Submit calls `placeOrder`, then Razorpay |
| `src/app/(shop)/checkout/confirmation/page.tsx` | Read `orderId` from the query string. Empty id shows an error, not a success message |
| `next.config.ts` | `images.remotePatterns` for Supabase Storage |
| `src/components/common/hoop-logo.tsx` | Tagline "Stitch beauty into your life" |
| `src/lib/data/mock/homepage-content.ts` | Accessories `isComingSoon` |
| `src/components/sections/why-hilo-section.tsx` | Large cell is fixed copy. All six cards render beside it |
| `docs/frontend/STATIC_ROUTES.md` | Nginx fallback note for new handles |

## Review focus

These are the cases most likely to look fine in mock mode and fail against live data. Each task below names the check.

- Provider `supabase`, URL missing, production build: the build fails with a clear error. It does not call `placeholder.supabase.co`.
- Supabase down in the browser: best sellers, a collection, a product, the promo bar, and the footer show the error state. They do not show mock kits or the placeholder GSTIN.
- Stock 0: the product page and the card show sold out and do not call `addCartLine`.
- Checkout submit: the request body has no `price`, `subtotal`, or `unit_price` field.
- A product image whose `url` is `https://<ref>.supabase.co/storage/v1/object/public/product-images/...` renders.
- A new handle that was not in `generateStaticParams` 404s until the nginx note is applied. The plan does not claim otherwise.

## Phases

### Phase A — Runtime catalog

1. Add `useCatalog` in `src/lib/catalog/use-catalog.ts`. It accepts a loader `() => Promise<T>`, returns `{ data, error, loading, retry }`, and calls the loader on mount and on retry.
2. Change the homepage, collection page, and product page into shells that render client sections. Those sections call the repository. Remove the `await commerceRepository` calls from the server pages.
3. Keep `generateStaticParams` so handles present at build time have a directory. The page body must not include the product JSON from that build.
4. Write `docs/frontend/STATIC_ROUTES.md` with the nginx `try_files` note for unknown product and collection paths. One paragraph plus the snippet.

Verify: with `NEXT_PUBLIC_DATA_PROVIDER=mock`, `npm run build` succeeds. In the browser, changing a mock product title in `src/lib/data/mock/products.ts` is not required for this check. Instead, confirm the product page shows a loading state before the title (the fetch is client-side). With the provider set to `supabase` and a bad URL, the page shows `DataErrorState`, not the mock catalog.

### Phase B — No stand-in content

1. `getSiteSettings` returns the row or throws. Delete the hardcoded store, social, GSTIN, and announcement defaults from that method.
2. `getHomepageContent` uses settings for the hero. On failure it throws. It does not return `MOCK_HOMEPAGE_CONTENT` from the `catch`.
3. Promo bar, footer, and contact pass `onRetry` and render `DataErrorState` when settings fail. They do not keep the Bandra address or the placeholder GSTIN in a `||` fallback.
4. `index.ts`: if the provider is `supabase` and `isSupabaseConfigured()` is false, throw at module init with a message that names `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Remove the production branch that still constructs the provider.

Verify: grep `src/` for `27AAPFH1842Q1Z5` and `Studio 4, 18 Hill Road` returns no matches. Load the homepage with the provider set to `supabase` and an unreachable URL. The hero area shows the error and the retry button. Retry calls the loader again.

### Phase C — Stock

1. Add `stock: number` to `Product`. Map `row.stock` in the Supabase provider. Set it in the mock provider (use a positive number where `availableForSale` is true).
2. `AddToCartButton`: when `stock <= 0`, show "Sold out" and do not call `addItem`. The plus control stops at `stock`.
3. `ProductCard`: same sold-out label. The add control on the card is disabled at stock 0.

Verify: temporarily set one mock product's stock to 0. Its card and page show sold out. The add action does not open the cart. Restore the stock value before finishing.

### Phase D — Images

1. In `next.config.ts`, allow `https://*.supabase.co/storage/v1/object/public/**` via `images.remotePatterns`.
2. Change stored image paths that start with `/hilo/images/` to `/images/...` in `src/lib/data/mock/` and in the collection and hero section fallbacks.

Verify: `npm run build`. Open a product whose image is a local `/images/products/...` path and confirm the request URL is `/hilo/images/products/...` once. Load one product whose image URL is an absolute Supabase Storage URL (or a temporary absolute URL on that host) and confirm the image renders.

### Phase E — Checkout call site

Depends on the `create-order` Edge Function being deployed. The function work is not part of this plan. The client can land before the function if `placeOrder` is the only new module and the checkout page shows a clear error when the invoke fails.

1. Add `src/lib/checkout/place-order.ts` with `placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>` and the types in Decisions. Build `items` from cart lines as `{ productId: line.product.id, quantity: line.quantity }`.
2. Replace the checkout submit handler. It collects the form fields, calls `placeOrder`, then loads Razorpay Checkout. On success, `router.push('/checkout/confirmation/?orderId=' + orderId)`. On dismiss, show "Payment was not completed. Your items stay reserved for 15 minutes." Do not navigate to confirmation.
3. Confirmation reads `orderId`. With no id, render `DataErrorState` and a link back to checkout. Remove the unconditional "we have received your order" copy for that case.
4. Delete the client shipping-price rule from the total that is sent anywhere. The page may still display the cart line prices as a preview, labeled as a preview, until the function returns `amount`. After a successful invoke, the amount shown to Razorpay is `PlaceOrderResult.amount`.

Verify: in the browser network panel, the `create-order` body has `items`, `customer`, and `shippingAddress`, and no price field. Confirmation with no query param does not say the order was received. A mocked success handler with `orderId=test-1` shows that id.

### Phase F — Mockup deltas

1. `HoopLogo` tagline: `Stitch beauty into your life`.
2. Accessories in `collectionsNav`: `badge: 'Coming Soon'`, `isComingSoon: true`. Point the link at `/coming-soon` the same way workshops and customisation are non-shop links, or keep `/collections/accessories` only if that route itself is the coming-soon page. Preferred: same pattern as workshops (`/customisation` style). Use `/coming-soon` for Accessories if the collection page would still list products. Check `collections-nav-section.tsx` and add Accessories to the non-catalog href branch.
3. `WhyHiloSection`: the large cell uses the fixed headline "A quieter ritual for modern evenings." and the fixed paragraph from the mockup. Render every entry in `cards` as a small cell. Do not shift the first card into the feature.

Verify: homepage shows six philosophy cards plus the large cell, Accessories shows the coming-soon badge, and the header tagline matches the mockup string.

### Phase G — Register and build

1. Update the Phase 5 rows in `docs/backend/TASKS.md` only after the matching frontend task is verified. Leave Phase 5b Edge Function rows untouched.
2. `npm run lint` and `npm run build` pass.
3. Browser pass, provider `mock`: `/`, `/collections/diy-kits/`, `/products/blooming-roses/`, cart open and close, checkout validation, contact page. Desktop width and a 375px width.
4. Browser pass, provider `supabase`, only when `.env.local` has a real URL and anon key: the same routes show database rows, a draft product does not appear, and an enquiry insert from the contact form lands in `enquiries`.

## Not in this plan

- Rewriting the shop UI.
- A newsletter backend.
- Customer accounts.
- Refunds and "verify payment" (admin, Phase 5b).
- Changing RLS or `schema.sql`.
