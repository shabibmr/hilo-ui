# HILO ARTE — Phase 1 Implementation Plan

## Context

`/home/hilo` currently contains only `docs/context.md` (an 800-line "master AI prompt" brand/product spec) and `docs/hilo-mock1.png` (a homepage mockup). There is no code yet — this is a from-scratch build of a luxury embroidery-kit e-commerce site ("HILO ARTE"): a premium, slow-living, story-driven brand (positioned like Loewe/Aesop/Jo Malone/Sézane, explicitly never like Amazon/Etsy/craft stores) selling beginner embroidery DIY kits and gift experiences.

The spec calls for a full production stack (Next.js 15, Shopify Headless, Sanity CMS, Razorpay, 16 pages). None of the backend services (Shopify, Sanity, Razorpay) have credentials or accounts in this environment, and the spec's illustrated assets (fairy-on-moon hero, bee motif, hoop logo) don't exist as files. Rather than blocking on external accounts or generic stock art, the plan below builds the full frontend against a swappable mock data layer and AI-generated placeholder illustrations matching the mockup's style, so real commerce/CMS/payment backends can be wired in later as a data-layer swap with no UI rework. Scope is phased: this plan covers the "shoppable spine" (Homepage, Collection, PDP, Cart, Checkout, About, Founder Story); the remaining pages (Gallery, FAQ, Contact, Policies, Workshops, dedicated What's Inside page, Customisation) are explicitly deferred to a Phase 2, with a `/coming-soon` stub so nav/footer links to them remain truthful rather than broken.

**Aesthetic refinement pass:** the sections below (type roles/scale, design tokens, color-contrast audit, two-tier motion system, icon system, CTA hierarchy) were checked against a design-intelligence database of style/color/typography/landing patterns and a WCAG contrast calculation of the brand's own hex values — not a restyle. Where the database suggested a direction that conflicts with the brand spec's explicit choices (e.g. it initially proposed a "Liquid Glass"/translucent style and a generic dark+gold palette), that suggestion was discarded in favor of the brand's mandated wine/gold/cream/sage palette and Playfair Display/Cormorant Garamond/Inter fonts; the database was used only to (a) validate that this typography pairing is in fact the top-scoring "luxury editorial" match, (b) surface a real accessibility defect in the palette (gold and sage both fail contrast as text-on-cream), and (c) formalize spacing/radius/shadow/motion-timing conventions the original spec left unspecified.

**Reconciling spec vs. mockup:** `context.md` lists 12 homepage sections; the mockup (`hilo-mock1.png`) shows only 9, ending at the newsletter band before the footer (no separate customer-gallery/testimonials/gift-category/workshops/final-CTA sections). Per Phase 1 scope, the homepage build follows the mockup's 9 sections; the spec's remaining sections move to Phase 2 alongside their dedicated pages.

## Tech Stack & Scaffolding

Next.js 15 (App Router) + TypeScript + Tailwind CSS + Framer Motion + Shadcn UI + Lucide Icons + React Server Components by default (client components as islands).

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*" --eslint
npx shadcn@latest init
npx shadcn@latest add button sheet tabs accordion input label select checkbox radio-group separator badge skeleton dialog sonner
npm install framer-motion lucide-react zustand clsx tailwind-merge class-variance-authority
```

Zustand (+`persist`) for cart state — persists across navigation via localStorage, and its async-action shape maps cleanly onto future Shopify cart mutations.

**Folder structure:**
```
src/
  app/
    layout.tsx                     # fonts, cart provider, global chrome
    page.tsx                       # homepage
    (shop)/collections/[handle]/page.tsx
    (shop)/products/[handle]/page.tsx
    (shop)/checkout/page.tsx
    (shop)/checkout/confirmation/page.tsx
    about/page.tsx
    founder-story/page.tsx
    coming-soon/page.tsx           # stub target for Phase-2-only nav/footer links
    not-found.tsx
  components/
    ui/                            # shadcn primitives
    layout/                        # promo-bar, header, footer, mobile-nav
    motion/                        # presets.ts, reveal.tsx, bee-companion.tsx, thread-path.tsx, flower-bloom.tsx, parallax-layer.tsx
    commerce/                      # product-card, product-grid, cart-drawer, add-to-cart-button, quantity-stepper, collection-filters
    sections/                      # one file per homepage section
    common/                        # container, section, section-heading, hoop-logo, cta-button
  lib/
    data/
      types.ts                     # Product, Collection, Cart, Order, CMS content types
      repository.ts                # CommerceRepository / ContentRepository interfaces
      providers/mock-provider.ts
      providers/index.ts           # factory keyed on DATA_PROVIDER env var
      mock/                        # products.ts, collections.ts, founder.ts, homepage-content.ts
    cart/cart-store.ts             # zustand store + persist
    motion-variants.ts
    utils.ts
  hooks/use-reduced-motion.ts, use-scroll-header.ts
public/images/{hero,bee,logo,icons,founder,products,kit-contents}/
tailwind.config.ts
```

**Tailwind tokens:** extend `colors` with named brand tokens — `wine` #380B0C, `deep-wine` #340A0A, `gold` #B08D57, `antique-gold` #C4A360, `cream` #F8F5EF, `sage` #A8B39A (components read `bg-wine`/`text-gold`, never raw hex). Breakpoints need no config changes — Tailwind's defaults (640/768/1024/1280/1536) already match the spec exactly.

**Mobile-first methodology (not just "responsive"):** the source mockup (`hilo-mock1.png`) is desktop-only, so every section below is easy to design desktop-first by default — this must be actively resisted. Build each component's base (unprefixed) Tailwind classes for the ≤375px layout first, then layer `sm:`/`md:`/`lg:`/`xl:` on top for wider viewports, never the reverse. Several of the mockup's dense desktop rows do not survive a naive "let it wrap" reflow and need an explicit mobile pattern decided at build time, not discovered in the QA pass:
| Desktop pattern (mockup) | Mobile pattern |
|---|---|
| 5-icon "Bee-Guided Collections" wreath row | Horizontal scroll-snap carousel (not a 5-col→1-col wrap — icons are too detailed to shrink that far) |
| 6-card "Why HILO ARTE" row | 2-column grid |
| 4-product "Best Sellers" grid | 1-column stack (2-column at `sm:`) |
| Founder Story asymmetric split (1 large + 2×2 image grid + text) | Stack vertically: text → large image → 2×2 grid, in that order (matches natural reading flow, not a side-by-side squeeze) |
| 9-item "What's Inside Your Kit" row | Horizontal scroll-snap carousel |
| 7-step "Creative Journey" horizontal timeline | Vertical stepper (numbered list with connecting line down the left edge, not a squeezed horizontal line) |
| Hero fairy-on-moon illustration | Dedicated mobile crop (already planned in Asset Generation #3) — not the desktop asset scaled down |

Touch targets on all of the above (collection icons, kit-contents icons, timeline steps) must stay ≥44×44px with ≥8px spacing even inside a scroll-snap carousel — small decorative icons are exactly where accidental undersized tap targets creep in.

**Fonts & type roles:** `next/font/google` for Cormorant Garamond, Playfair Display, Inter, each a CSS variable wired into `tailwind.config.ts` `fontFamily` (`display`, `accent`, `body`). The spec lists both serif headings without assigning roles — resolve the ambiguity: **Playfair Display** (`font-display`) for primary display headings (hero H1, page titles, "Best Sellers"/"Founder Story" section titles — higher contrast, more structural); **Cormorant Garamond italic** (`font-accent italic`) for the smaller editorial voice — eyebrows ("OUR STORY"), pull-quotes, section dividers, the subheadline under the hero. This pairing matches the design-intelligence database's top luxury/editorial match ("Classic Elegant": Playfair Display + Inter, tagged *elegant, luxury, editorial, high-end e-commerce*) with Cormorant layered in as the accent voice the brand spec explicitly asks for.

**Type scale:** fluid, editorial, not a dense UI scale — `text-sm` (14px, labels/meta), `text-base` (16px, body), `text-lg` (18px, lede/subheadline), then display sizes via `clamp()` so hero/section headlines scale smoothly instead of jumping at breakpoints: `--text-h2: clamp(1.75rem, 3vw + 1rem, 2.75rem)`, `--text-h1: clamp(2.5rem, 5vw + 1rem, 4.5rem)`. Body line-height 1.6–1.75, display line-height 1.05–1.15 (tight, per editorial convention).

**Design tokens — spacing, radius, elevation:** 4px/8px spacing scale throughout (Tailwind defaults already fit; don't introduce arbitrary values). Radius: soft but not rounded-pill — `rounded-md`/`rounded-lg` (6–12px) on cards/buttons/inputs, echoing the embroidery hoop's soft circularity without looking like a generic SaaS app. Shadows must be **warm-tinted, not default gray** — derive card/hover shadows from the wine token at low opacity (e.g. `shadow-[0_8px_30px_-8px_rgba(56,11,12,0.25)]`) rather than Tailwind's neutral `shadow-lg`, and the spec's "gold glow" hover state as a second, separate glow shadow layered from the gold token (e.g. `0_0_24px_0_rgba(176,141,87,0.35)`), not a recolored default shadow. Product card hover: image `scale-105` + gold glow, 250–300ms `ease-out` (this is a micro-interaction, not a narrative one — see the two-tier motion system below).

**Color-contrast audit (WCAG) — verified, not assumed:**
| Pair | Ratio | Verdict |
|---|---|---|
| wine on cream (body text, headings) | 15.8:1 | Safe everywhere, including small text |
| cream on wine / cream on deep-wine (solid header, footer, wine sections) | 15.8–16.2:1 | Safe everywhere |
| gold `#B08D57` on wine (nav links, small labels on dark) | 5.56:1 | Passes AA normal text |
| antique-gold `#C4A360` on wine (emphasis text, primary CTA label) | 7.17:1 | Passes AAA — **preferred over plain gold for CTA text on wine** |
| sage on wine (secondary accents on dark sections) | 7.84:1 | Passes AAA |
| **gold `#B08D57` on cream (body/label text)** | **2.84:1** | **Fails AA — do not use gold as readable text color on cream.** Restrict gold-on-cream to decorative use only: icon strokes, dividers, borders, large-scale display numerals — never body copy, price text, or nav labels. |
| **sage on cream (text)** | **2.01:1** | **Fails AA badly.** Sage is a decorative/background accent only (icon fills, soft section backgrounds, subtle borders) — never text on cream. |

Direct implication for the primary CTA button (mockup shows a solid gold-filled "Start Your First Stitch" button): **fill must pair with wine or deep-wine text, never cream/white text** — gold-filled + cream-text is the 2.84:1 failing pair inverted. Button variants to implement in the themed Shadcn `Button`: `solid-gold` (gold/antique-gold fill, wine text — primary), `solid-wine` (wine fill, cream text — used on cream sections where a dark CTA reads better), `outline` (cream or gold 1.5px border, cream/gold text, transparent fill — for the hero's secondary CTA and any button placed over the wine hero background).

## Data Layer Abstraction

Every repository method is `async`, returning shapes that map 1:1 onto the future Shopify Storefront API / Sanity GROQ results, even though Phase 1 reads local TS fixtures — so Server Components never need to know the data is mocked.

Core types in `src/lib/data/types.ts`: `Product` (id, handle, title, description, images, priceRange, difficulty, hours, collections, tags, variants, options, whatsIncluded, shippingInfo, faqs, seo), `Collection`, `CartLine`/`Cart`, `Order`, plus CMS content shapes `HomepageContent` (hero, collectionsNav, whyHilo, bestSellerProductIds, founderTeaser, kitContents, creativeJourney, newsletter) and `FounderStoryContent`.

Repository interfaces in `src/lib/data/repository.ts`:
- `CommerceRepository`: `getProduct`, `getProducts`, `getCollection`, `getCollections`, `createCart`, `getCart`, `addCartLine`, `updateCartLine`, `removeCartLine`.
- `ContentRepository`: `getHomepageContent`, `getFounderStory`, `getAboutContent`.

`src/lib/data/mock/*.ts` holds typed fixtures; `providers/mock-provider.ts` implements both interfaces against them; `providers/index.ts` is a factory selecting the active provider via `DATA_PROVIDER` env (default `mock`) — adding Shopify/Sanity later is a new provider file + one factory `case`, zero UI changes.

**Cart is the one stateful exception**: a Zustand store (`lib/cart/cart-store.ts`) whose actions are thin wrappers around `CommerceRepository` methods (against the mock provider, persisted to `localStorage`) — swapping to real Shopify cart mutations later only touches the provider.

Pages `await` repository calls directly in Server Components; only the cart drawer and add-to-cart button are client components reading the Zustand store.

## Component Architecture

**Server components (default):** `layout.tsx`, page files, `Footer`, `SectionHeading`, `Container`, `Section`, `ProductCard` shell, homepage `sections/*` wrappers.

**Client islands (`'use client'`):**
- `Header` — scroll-tracked transparent→solid-blurred-with-gold-border state; takes a `variant: 'overlay' | 'solid'` prop per route so non-hero pages (About, Founder Story, Collection, PDP, Cart, Checkout) render solid immediately instead of flashing transparent-then-solid.
- `MobileNav` (Shadcn `Sheet`), `CartDrawer` (Shadcn `Sheet` + Zustand store: line items, qty stepper, subtotal, checkout CTA).
- `AddToCartButton`, `QuantityStepper`, `CollectionFilters`, PDP `Gallery` + `Tabs`.
- Motion primitives: `Reveal` (fade+translateY via `useInView`), `ParallaxLayer` (`useScroll`+`useTransform`), `BeeCompanion`, `ThreadDrawing`, `FlowerBloom`.
- Newsletter form, checkout form.

**Reusable primitives:** `<Container>`, `<Section variant="cream"|"wine"|"blush">`, `<SectionHeading eyebrow headline dividerVariant>` (repeated eyebrow/serif-headline/gold-flourish pattern), `<IconIllustrationCard variant>` (powers both the 5-item hoop-wreath collections row and the 6-item "Why HILO ARTE" row), `HoopLogo` (reused in header, footer, favicon, dividers, loading state).

**Icon system rule:** one consistent visual language across every icon on the site — Lucide (1.5–2px stroke, no fill) for functional UI icons (cart, search, close, chevrons, filters), hand-authored SVG line art at the same stroke weight for brand-specific icons (Creative Journey steps, Why HILO ARTE row, kit-contents icons). No emoji anywhere as a structural or navigational element — inconsistent across platforms and can't be recolored/animated, which breaks the "editorial luxury" feel immediately.

## Page-by-Page Build Order

0. **Scaffolding & config** — init command, Tailwind tokens/fonts, Shadcn init.
1. **Data layer** — types, repository interfaces, mock fixtures, mock provider, factory (built early so everything downstream renders against real-shaped mock data, not hardcoded strings needing later refactor).
2. **Design system primitives** — `Container`, `Section`, `SectionHeading`, `HoopLogo`, `IconIllustrationCard`, themed Shadcn `Button` variants, `motion-variants.ts`, `Reveal`/`ParallaxLayer`, `useReducedMotion`.
3. **Layout shell** — `PromoBar`, `Header` (desktop + mobile nav, cart icon badge wired to an empty drawer), `Footer`, root `layout.tsx`.
4. **Cart system** — Zustand store, `CartDrawer`, `AddToCartButton` (built before Best Sellers/PDP need it).
5. **Homepage**, mockup's 9-section order: Hero/Arrival (fairy-on-moon illustration, headline/subheadline, bee entrance, floating particles — **one dominant CTA** `solid-gold` "Start Your First Stitch" + a visually subordinate `outline` "Explore Gift Experiences", never equal visual weight; this follows the design database's Hero-Centric pattern, where a hero converts best with a single primary action and the hero content sits in 60–80% of the viewport) → Bee-Guided Collections (5-icon hoop-wreath nav, DIY Kits/Gift Experiences/Accessories live, Workshops/Customisation "coming soon", thread-path + flower-bloom on hover) → Why You'll Love (6 icon cards) → Best Sellers (4-product grid, "View All Kits" → `/collections/diy-kits`) → Founder Story teaser (→ `/founder-story`) → What's Inside Your Kit (9-item row, "View Details" → `/coming-soon`) → Your Creative Journey (7-step timeline) → Newsletter band (optimistic-toast submit) → Footer.
6. **Collection page** `/collections/[handle]` (generalized for `diy-kits`/`gift-experiences`/`accessories`) — filters (difficulty/price/occasion), sort, grid, empty state.
7. **Product Detail Page** `/products/[handle]` — gallery, name/price/difficulty/hours, variant selector, add-to-cart, tabs (Description/What's Included/Shipping/FAQ), related products.
8. **Cart drawer polish** — empty state, free-shipping-threshold messaging matching promo bar's ₹1499 copy.
9. **Checkout** `/checkout` (one page, UI only) — order summary, contact/shipping form, payment method radio group (Razorpay/UPI/Card, stubbed/disabled, no live SDK call) → `/checkout/confirmation` static success page. Verify zero network calls to any payment SDK.
10. **About page** — brand philosophy, slow creativity, handmade experience, "HILO ARTE universe" via `Section`/`SectionHeading` primitives.
11. **Founder Story page** — full editorial long-form version of the homepage teaser.
12. **Cross-page QA pass** — add `/coming-soon` stub + `not-found.tsx` + baseline per-page metadata; responsive/reduced-motion/a11y checks (see Verification below).

## Asset Generation Plan

Generate via an image-generation tool during implementation, interleaved with the build steps above:

1. **Hoop logo mark** — AI image as a tracing reference, then hand-build final `HoopLogo` as real SVG paths (crisp, recolorable, animatable). Needed before step 3.
2. **Bee motif** — still, realistic, elegant illustration (not a sprite sheet — flight motion done via code-driven transform/rotate keyframes, not frame animation). Needed before step 5.1–5.2.
3. **Hero illustration** — fairy on crescent moon stitching, wine/gold night sky, botanical vines/stars, matching mockup composition; desktop full-bleed + simplified mobile crop. Gates step 5.1.
4. **Decorative botanical/floral line art** — gold flourish dividers, hero corner vines, collection-icon wreath frames, footer/newsletter accents.
5. **Founder portrait + workspace lifestyle photos** — sized for the mockup's asymmetric split layout (one large + 2×2 grid). Needed before 5.5 and step 11.
6. **Product photography** — the 4 named best-sellers (Blooming Roses, Wildflower Meadow, Moonlit Garden, Lavender Dreams) plus ~8 more SKUs across the 3 collections, one consistent batch/style. Needed before 5.4 and steps 6–7.
7. **"What's Inside Your Kit" 9 flat-lay images** — one consistent batch. Needed before 5.6.
8. **Creative Journey (7) + Why You'll Love (6) icons** — hand-authored/Lucide-derived line icons rather than AI-generated (small, simple, need to stay crisp/recolorable/animatable — a deliberate exception).

Assets land in `public/images/{hero,bee,logo,icons,founder,products,kit-contents}/` as WebP (PNG only where true alpha transparency is needed), referenced via `next/image` and via `ImageAsset.url` in the mock fixtures — so a future swap to Shopify CDN/Sanity image URLs is a one-field data change.

## Animation System

**Two-tier motion system** — the brand spec's 0.8–2.5s "slow" band is for *narrative* moments only; applying it to ordinary interactive feedback reads as sluggish rather than luxurious, so the plan splits motion into two explicit tiers:
- **Tier 1 — micro-interactions** (button/link hover, focus rings, input states, filter toggles, card hover glow+zoom, drawer open/close, tab switches): 150–300ms, `ease-out` on enter / `ease-in` on exit, standard UX-best-practice timing. These are things the user is actively waiting on to continue — keep them snappy.
- **Tier 2 — signature/narrative motion** (bee flight, thread-drawing, flower-bloom, hero fade/parallax, section-reveal-on-scroll): 0.8–2.5s, `EASE_ORGANIC`, the spec's slow/organic band. These are ambient or scroll-triggered, never blocking an interaction.

Central `lib/motion-variants.ts` exports both tiers as named constants (`DURATION.micro` = 0.15–0.3s / `DURATION.slow`, `DURATION.slower` = the narrative band) plus `EASE_ORGANIC` (gentle custom cubic-bezier) and `EASE_UI` (standard ease-out/ease-in for Tier 1), and shared variants `fadeUp`, `fadeIn`, `staggerContainer`, `floatLoop`, `drawPath`, `bloom` — all custom animation code draws from these two tiers rather than inlining ad hoc durations, and animates only `transform`/`opacity`. Infinite-loop animation (`repeat: Infinity`, e.g. hero floating particles) stays confined to the hero and low-opacity/low-count, per the general UX rule that continuous motion outside of loading states is distracting — the hero is a deliberate, scoped exception, not a pattern to repeat elsewhere on the site.

**Reduced motion:** one `useReducedMotion` hook (wrapping Framer Motion's) checked inside each shared primitive (`Reveal`, `ParallaxLayer`, `BeeCompanion`, `ThreadDrawing`, `FlowerBloom`) so section components never handle it individually; falls back to instant/opacity-only. Global `@media (prefers-reduced-motion: reduce)` CSS as defense-in-depth.

**Signature effects:**
- **Bee:** absolutely-positioned SVG/PNG, animated via Framer Motion `animate` stepping through hand-authored `{x, y, rotate}` keyframe waypoints, triggered `whileInView`, 1.5–2.5s, `EASE_ORGANIC`. No Lottie — avoids an extra dependency/asset pipeline and gives more direct control over "slow, organic, never playful" easing.
- **Thread trail:** hand-authored SVG `<path>` tracing the bee's route, `pathLength` 0→1 via stroke-dasharray, synced to the bee's flight.
- **Flower bloom:** SVG center + N petal paths inside a `staggerContainer`, petals scale 0→1 with slight rotation (~0.08–0.15s stagger), triggered on scroll-into-view (collection icons) and hover (product/collection cards, paired with gold-glow + image-zoom per spec).
- **Floating particles (hero):** ~8–15 looping transform/opacity-only elements, randomized delay, `repeat: Infinity`, GPU-friendly.
- **Parallax:** `useScroll`+`useTransform` used sparingly (hero background drift only).

## Verification Plan

- **Scaffolding sanity:** `npm run dev`, visit `localhost:3000`, confirm `next/font` variable classes and computed font-family in devtools.
- **Type safety at every milestone:** `npx tsc --noEmit` after the data layer, after each new page, and after the cart store — catches Server Component/repository shape mismatches early.
- **Route-by-route manual pass:** `/`, `/collections/diy-kits|gift-experiences|accessories`, `/products/<mock-handle>`, `/checkout`, `/checkout/confirmation`, `/about`, `/founder-story`, `/coming-soon`, plus opening/closing the cart drawer from every page — no 404/500s, correct header variant behavior per page.
- **Responsive check:** check mobile (≤375px) *first* for each component as it's built, not only at the end — then devtools device toolbar at 640/768/1024/1280/1536 for the full sweep, on homepage and PDP minimum. Confirm the mobile-first patterns from the table above are actually in place, not just wrapped: collections row and kit-contents row scroll-snap horizontally (not squeeze into a grid), creative journey renders as a vertical stepper (not a shrunk horizontal line), founder split stacks text→large image→2×2 grid, mobile nav opens/closes, hero uses the dedicated mobile crop asset.
- **Reduced-motion check:** devtools "emulate prefers-reduced-motion: reduce", reload every page with bee/thread/flower/particle effects — calm/instant, never blank or stuck mid-transition.
- **Accessibility spot-check:** keyboard-only tab through header nav, mobile menu, add-to-cart, cart drawer, checkout form — visible gold focus rings, logical order; automated pass (Lighthouse/axe) alongside.
- **Lighthouse spot-check:** `npm run build && npm run start` then `npx lighthouse http://localhost:3000 --view` (production build, not dev) on homepage + a PDP — target Accessibility ~100; hero illustration is the primary LCP risk, mitigate with `next/image` `priority` + explicit sizing + WebP/AVIF.
- **Cart correctness:** add from Best Sellers → header badge updates → open drawer → adjust qty → remove line → subtotal recalculates → refresh → cart persists (localStorage).
- **Checkout UI correctness:** submit form, confirm zero network calls to any payment SDK, zero console errors from a missing Razorpay script, lands cleanly on the static confirmation page.
- **Data-layer decoupling smoke test:** temporarily point the provider factory at a second dummy dataset via `DATA_PROVIDER` and confirm every page re-renders correctly with zero component changes — concrete proof the repository interface actually decouples UI from data source ahead of real Shopify/Sanity/Razorpay integration.

### Critical files
- `src/lib/data/repository.ts` — CommerceRepository/ContentRepository interfaces everything (mock now, Shopify/Sanity later) implements against.
- `src/lib/data/providers/mock-provider.ts` — the concrete Phase 1 data implementation every page reads from.
- `tailwind.config.ts` — brand color/font tokens every component depends on visually.
- `src/components/layout/header.tsx` — transparent→scrolled state machine used on every page.
- `src/lib/cart/cart-store.ts` — Zustand cart store underpinning Best Sellers, PDP, cart drawer, checkout.
- `src/lib/motion-variants.ts` — shared animation constants/variants all motion primitives draw from.
