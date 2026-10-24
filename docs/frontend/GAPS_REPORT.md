# Hilo Arte storefront: gaps report

Date: 2026-10-25. Scope: the public storefront in `src/`. The admin app in `admin/` is out of scope except where its saved `site_settings` shape is the contract the storefront already reads.

Sources compared:

- `docs/backend/IMPLEMENTATION_PLAN.md` (Phases 5 and 5b, and the storefront rules in Decisions)
- `docs/backend/schema.sql` (catalog, enquiries, `site_settings`)
- `docs/backend/TASKS.md` (Phase 5 and 5b checkboxes)
- `docs/mockups/hilo-editorial-luxury.html` (the current homepage visual target)
- `docs/hilo-mock1.png` (the older homepage picture the first build followed; the app has moved on from it)
- The storefront code: repository, providers, shop routes, cart, checkout, header, footer, promo bar, contact, homepage sections

## Status

The shop UI is built and the homepage already follows the editorial mockup. A Supabase provider exists and matches the schema for published products, collections, one default variant, enquiries, and site settings. The provider is not what production serves today: `NEXT_PUBLIC_DATA_PROVIDER` defaults to `mock`.

`docs/backend/TASKS.md` still marks every Phase 5 row as open. That register is behind the code. The remaining work is wiring, not a new shop.

## What already matches the backend plan

- Pages and components call `commerceRepository` and `contentRepository`. The Supabase client is used only in `src/lib/supabase.ts` and `src/lib/data/providers/supabase-provider.ts`.
- `src/lib/data/providers/index.ts` switches on `NEXT_PUBLIC_DATA_PROVIDER`, then `DATA_PROVIDER`, default `mock`. `.env.local.example` documents both flags, the anon URL, the anon key, and an unused `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- Published products and collections are filtered with `published = true`. Best sellers use `is_best_seller`. One variant is built per product. `availableForSale` is `stock > 0`.
- The cart stays in the browser. Zustand persists it under `hilo-arte-cart-storage`. The Supabase provider keeps a module `Map` and reseeds it with `hydrateCart`.
- Promo bar, footer, and the contact page call `getSiteSettings()` in the browser. Contact inserts into `enquiries` through `submitEnquiry`.
- `getHomepageContent()` overlays `site_settings.hero` onto the mock homepage. Field names are the camelCase names the admin settings form writes (`primaryCtaText`, `backgroundImage`, and the rest). Founder copy stays on `MOCK_FOUNDER_STORY`, which the plan leaves in mock for v1.
- Guest checkout only. The checkout form collects name, email, phone, and address. There is no customer account.

## What already matches the editorial mockup

`docs/mockups/` contains only `hilo-editorial-luxury.html`. It is a homepage reference, not a product, collection, cart, or checkout mock.

The live homepage shares that file's tokens, fonts, paper grain, island nav, section order, copy, and photos: hero in a dark double-bezel, collection photo cards, philosophy bento, best sellers, founder split, kit rail, seven-step journey, newsletter, footer. `docs/hilo-mock1.png` (top bar, centered wordmark, icon wreath, six flat philosophy icons) is the older target. Do not rebuild toward it.

## Gaps

### 1. Catalog is frozen at build time

`next.config.ts` sets `output: 'export'`. These routes are server components, so their Supabase calls run during `next build` and the HTML keeps that snapshot:

- `src/app/page.tsx` (homepage content and best sellers)
- `src/app/(shop)/collections/[handle]/page.tsx`
- `src/app/(shop)/products/[handle]/page.tsx`

`generateStaticParams` on the collection and product routes also runs at build time. A product or collection created in admin has no HTML file and 404s until the next export.

The plan requires the opposite: the static export fetches at runtime, and an admin edit needs no rebuild.

Promo bar, footer, and contact already fetch in the browser. Catalog routes do not.

### 2. Unreachable Supabase still shows stand-in content

The plan requires an error with a retry, and no stale catalog in production.

- `DataErrorState` (`src/components/common/error-retry.tsx`) renders a retry button only when `onRetry` is passed. Homepage, collection, and product pages pass a message and no `onRetry`. On a static export that error is also baked into the file.
- `SupabaseContentRepository.getHomepageContent()` catches a settings failure and returns `MOCK_HOMEPAGE_CONTENT`.
- `getSiteSettings()` fills a missing row with the Bandra studio address, phone, `hello@hiloarte.com`, GSTIN `27AAPFH1842Q1Z5`, and the shipping announcement.
- Promo bar, footer, and contact keep those same strings when the request fails. The failure is a `console.warn`.

The GSTIN fallback is a launch risk. A failed settings read would print a placeholder tax id.

### 3. Sold out is computed and ignored

`mapDbProduct` sets `variants[0].availableForSale` from stock. `AddToCartButton` and `ProductCard` never read it. The quantity control has no upper bound. The cart will accept a line for a product with stock 0.

The Edge Function is what must reject an oversell. The storefront still has to show sold out from live data, which the plan requires.

The mapped product does not expose a numeric stock count, so the UI cannot cap quantity at the live number without a small addition to the mapper.

### 4. Checkout does not place an order

`src/app/(shop)/checkout/page.tsx` submits the form and routes to `/checkout/confirmation`. Nothing is sent to Supabase or Razorpay. The confirmation page always says the order was received. It has no order number.

Prices live in the cart line. Checkout totals `cart.subtotal` and adds shipping with a hardcoded rule: ₹0 at ₹1499 or above, otherwise ₹99. The product page repeats "Free Shipping over ₹1499". The plan says the browser sends product ids and quantities only. `create-order` reads prices from the database, decrements stock, creates the Razorpay order, and inserts the order as `pending`.

`NEXT_PUBLIC_RAZORPAY_KEY_ID` is unused. There is no Razorpay checkout script, no 15-minute hold message, and no path for "last item already taken".

Phase 5b Edge Functions (`create-order`, `razorpay-webhook`, `refund-order`, `verify-payment`) are backend work. The storefront gap is the call site and the confirmation page.

### 5. Storage image URLs are not allowed

`next.config.ts` sets `images.unoptimized: true` and does not set `images.remotePatterns`. Admin uploads land on `https://<project>.supabase.co/storage/...`. `next/image` on the product card, gallery, and hero rejects remote hosts that are not listed.

Mock images are local paths under `/images/...`, so this only appears once the provider is `supabase`.

The homepage hero fallback and several mock image paths are stored as `/hilo/images/...`, which already includes `basePath`. `next/image` prefixes `basePath` again. Confirm the hero and collection images resolve to `/hilo/images/...` once, not `/hilo/hilo/images/...`.

### 6. Homepage versus the editorial mockup

Three visible differences:

- The mockup wordmark tagline is "Stitch beauty into your life". `HoopLogo` renders "slow embroidery".
- The mockup marks Accessories as coming soon. `MOCK_HOMEPAGE_CONTENT.collectionsNav` leaves Accessories live, and the section links it to `/collections/accessories`.
- The mockup philosophy block is one large cell ("A quieter ritual for modern evenings.") plus all six small cards. `WhyHiloSection` uses the first data card as that large cell, so Beginner Friendly disappears as its own card and its description is appended to the ritual paragraph.

Newsletter submit only sets local React state. The plan does not require a newsletter table in v1. Leave it as a local acknowledgement unless a later decision says otherwise.

### 7. Production provider footgun

In `src/lib/data/providers/index.ts`, provider `supabase` plus `NODE_ENV === 'production'` selects `SupabaseCommerceRepository` even when the URL is missing. `isSupabaseConfigured()` is false in that case, and `src/lib/supabase.ts` builds a client pointed at `https://placeholder.supabase.co`. The build then fails or the exported shell calls a host that does not exist.

Local development with `supabase` and no URL correctly falls back to mock. That fallback must stay off in production.

## Decisions that stay

- Keep the current shop. The UI, repository boundary, and Supabase mapper are the right base.
- Homepage sections other than the hero, and the founder story, stay on mock content for v1.
- Workshops, gallery, policies, and customisation pages stay as they are. Seminars are out of v1.
- Cart storage stays in the browser. Do not create a carts table.
- One price and one variant per product.
- Guest checkout only.
- Do not retarget the homepage to `docs/hilo-mock1.png`.

## Out of this frontend plan

- Supabase project setup, `schema.sql`, seed script, RLS tests, pg_cron stock release, and the Edge Functions themselves.
- Admin refund and verify-payment screens.
- Admin deploy path.
- Order emails, founder-story editing, raw-material inventory, multiple admins.
