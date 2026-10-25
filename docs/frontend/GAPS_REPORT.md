# Hilo Arte storefront: gaps report

Revised 2026-10-25. Scope: the public storefront in `src/` and the architecture connecting it to the database. The admin app in `admin/` is out of scope except where shared backend contracts and `site_settings` apply.

The remaining work is specified in `docs/frontend/IMPLEMENTATION_PLAN.md` and tracked in `docs/frontend/TASKS.md`. This document details the gap analysis between the current codebase, the target API backend architecture, and the design specification.

Sources compared:
- `docs/backend/IMPLEMENTATION_PLAN.md` (Phases 5 and 5b, storefront rules in Decisions)
- `docs/backend/schema.sql` (catalog, enquiries, orders, `site_settings`)
- `docs/backend/TASKS.md`
- `docs/mockups/hilo-editorial-luxury.html` (current homepage visual target)
- `docs/hilo-mock1.png` (older homepage design; deprecated)
- Current storefront code in `src/`, `admin/`, and `supabase/functions/`

---

## Architectural Shift: Introducing the API Backend Layer

The previous draft assumed direct browser-to-database communication (storefront querying Supabase PostgREST with an anon key, and calling Deno Edge Functions for checkout). 

**The target architecture replaces direct browser-to-database access with a dedicated API Backend Layer:**

```
Storefront (Browser / Static Shell) ──► HTTP /api/v1/* ──┐
                                                         ├──► [API Backend Layer] ──► Database (Postgres)
Admin App (Browser / Static Shell)  ──► HTTP /api/v1/* ──┘          │
                                                               (Razorpay API,
                                                                Stock Lock,
                                                                Private Secrets)
```

### Why this change is necessary:
1. **Security & Credential Isolation:** No database connection details, Supabase anon keys, or payment gateway secrets are exposed to the client bundle.
2. **Business Logic & Pricing Authority:** Order creation, pricing calculation, atomic stock reservation, and payment verification are unified in a single backend service rather than fragmented across Deno edge scripts and SQL functions.
3. **Repository Pattern Compatibility:** The storefront already abstracts data behind `CommerceRepository` and `ContentRepository` (`src/lib/data/repository.ts`). Swapping direct Supabase calls for an `ApiCommerceRepository` / `ApiContentRepository` requires **zero UI component rewrites**.

---

## What Already Matches

- **Repository Abstraction:** Pages and components consume `commerceRepository` and `contentRepository`. Direct data access is isolated to provider implementations.
- **Provider Switching:** `src/lib/data/providers/index.ts` selects the active provider via environment variables (`NEXT_PUBLIC_DATA_PROVIDER`), supporting `mock` for local development.
- **Client Catalog Loading:** Catalog pages use `useLive` (`src/lib/data/use-live.ts`) to fetch runtime data dynamically, preventing static build snapshots from freezing live catalog state.
- **Cart Storage:** Cart persistence remains strictly in browser storage (`localStorage` via Zustand under `hilo-arte-cart-storage`). No server session is required for guest browsing.
- **Form Controls:** `AddToCartButton` and `ProductCard` respect `availableForSale` and cap quantity adjustments at live stock.
- **Guest Checkout:** Checkout collects shipping details without forcing customer account creation. Order submission sends only product IDs and quantities; prices are never trusted from the browser.
- **Editorial Alignment:** The live homepage typography, layout, paper grain texture, and photo cards match `docs/mockups/hilo-editorial-luxury.html`.

---

## Remaining Gaps

### 1. Direct Browser-to-Database Coupling (Primary Gap)
- **Current State:** The storefront talks directly to Supabase (`supabase-provider.ts`) and POSTs directly to a Supabase Edge Function (`create-order`) using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Target:** A dedicated API Backend Layer (`/server` or `/api`) must expose standard REST endpoints (`/api/v1/products`, `/api/v1/collections`, `/api/v1/settings`, `/api/v1/enquiries`, `/api/v1/orders`). The storefront must use an `ApiProvider` that communicates with this backend over HTTP.

### 2. A Missing Settings Row Still Looks Like a Success
- `getSiteSettings()` currently returns a synthesized fallback object when `maybeSingle()` returns no row, populating hero fields from `MOCK_HOMEPAGE_CONTENT.hero`.
- `useSiteSettings` lacks a `reload` mechanism. A failed read silently hides fields or displays empty blocks instead of presenting a retryable `DataErrorState`.
- `src/lib/supabase.ts` still instantiates a fallback client pointed at `https://placeholder.supabase.co`. Any client initialization failure should throw explicitly.

### 3. Mock Variants Have No Numeric Stock
- The live Supabase mapper sets `variant.stock` and derives `availableForSale`. However, mock fixtures omit numeric stock, causing the plus control in `AddToCartButton` to treat mock stock as infinite (`Infinity`). The mock provider must mirror production behavior by providing explicit numeric stock counts.

### 4. Local Image Paths Include `basePath`
- `next.config.ts` configures `basePath: '/hilo'` and `images.unoptimized: true`. Mock images and section fallbacks are stored with a `/hilo/images/...` prefix. Next's `<Image>` component prepends `basePath` again, producing invalid URLs like `/hilo/hilo/images/...`.
- All stored asset paths must omit the `/hilo` prefix and use `/images/...`.

### 5. A New Collection Handle Has No Client Shell
- While product handles missing at build time can be viewed via the client query shell `/products/view/?handle=<handle>`, collections lack an equivalent shell. Any collection handle created post-build returns a 404.
- An equivalent `/collections/view/?handle=<handle>` route must be added and documented in `docs/frontend/STATIC_ROUTES.md`.

### 6. Checkout Copy Overclaims Payment and Shipping
- The backend order creator charges the database subtotal in paise without adding a separate shipping surcharge. The storefront checkout page still calculates and displays a hardcoded ₹99 fee (waived at ₹1499), creating a mismatch with the actual payment gateway amount.
- The cart drawer, product page, shipping policy, FAQ, and mock announcement still mention the ₹1499 / ₹99 rule. These must be sanitized.
- Dismissing the payment modal currently displays "Payment was cancelled. Your basket is still here." It should explicitly communicate that items remain reserved for 15 minutes.
- Order confirmation blindly displays an order received message even when the `order` query parameter is missing.

### 7. Homepage Editorial Mockup Deltas
- **Tagline:** `HoopLogo` renders "slow embroidery" instead of the mockup tagline: "Stitch beauty into your life".
- **Accessories Navigation:** Accessories is rendered as an active collection linking to `/collections/accessories`. It must display a "Coming Soon" badge and link to `/coming-soon`.
- **Philosophy Bento Block:** `WhyHiloSection` collapses the first card ("Beginner Friendly") into the main headline cell. The layout should present the fixed ritual headline alongside all six distinct cards.

### 8. Social Media Previews & WhatsApp Link Sharing Missing
- **Current State:** `src/app/layout.tsx` defines only basic title, description, and keywords. There is no `metadataBase`, no Open Graph metadata (`og:title`, `og:image`, `og:description`), no Twitter Card metadata, and no `generateMetadata` function on dynamic routes (`products/[handle]/page.tsx`).
- **Impact on WhatsApp & Social Sharing:** WhatsApp, Facebook, Twitter, and iMessage link scrapers do NOT execute client-side JavaScript. When a user copies and shares a product link on WhatsApp, no product image appears, and only fallback site-level text is shown. Furthermore, WhatsApp crawlers specifically fail if the preview image is over 300KB, non-HTTPS, or in certain WebP variants.
- **Target:** 
  - Add root Open Graph and Twitter Card tags in `src/app/layout.tsx`.
  - Implement `generateMetadata` on `src/app/(shop)/products/[handle]/page.tsx` pulling the product title, description, and an optimized primary image URL (< 300KB JPG/PNG).

### 9. Search Engine Optimization (SEO) & Structured Data Missing
- **Current State:** The codebase lacks a `robots.txt` configuration, an XML sitemap generator (`sitemap.ts`), and Schema.org structured data.
- **Impact on Organic Search & Indexing:**
  - Search crawlers cannot identify which routes are canonical or prioritize product indexing.
  - Private transactional pages (`/checkout`, `/checkout/confirmation`) are unprotected from indexation without a robots rule.
  - Google Search cannot display rich product snippets (live price in INR, in-stock badge, product rating) due to missing JSON-LD `Product` and `Offer` schema.
- **Target:**
  - Add `src/app/robots.ts` allowing public catalog routes while disallowing private checkout and administrative paths.
  - Add `src/app/sitemap.ts` dynamically listing published products and collections with change frequencies.
  - Inject Schema.org `Product` JSON-LD structured data into the product view.

---

## Decisions That Stay

1. **Repository Boundary:** Storefront UI code must never import database drivers or backend SDKs directly; all operations flow through `CommerceRepository` and `ContentRepository`.
2. **Client-Side Cart:** Cart state lives in the browser (`hilo-arte-cart-storage`). No server-side session or carts table.
3. **Price Authority:** The API backend is the sole authority for pricing and stock verification. The frontend submits only product IDs and requested quantities.
4. **Single Price & Variant:** Each catalog item exposes one default variant and a single price in v1.
5. **Static Export Delivery:** Storefront build output remains statically exported (`output: 'export'`) to `/var/www/html/algo_cloud/hilo`. Dynamic capabilities are achieved through client-side API requests.
6. **No Reversion to Older Mockups:** Retain the editorial luxury styling (`hilo-editorial-luxury.html`); do not restyle toward `hilo-mock1.png`.
