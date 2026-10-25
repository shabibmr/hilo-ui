# Plan simplification report

Date: 2026-10-25. Reviewed the plan, the task list, and the order file against `src/lib/data/repository.ts`, `CollectionView`, `output: 'export'`, and `supabase/functions/`.

Applied: `IMPLEMENTATION_PLAN.md` and `TASKS.md` now follow the cuts below. `IMPLEMENTATION_ORDER.md` is deleted. The schedule lives only in `TASKS.md`.

## Verdict

Treat this as two small plans. The current documents describe four projects and already disagree with each other.

1. Storefront copy, image paths, mock stock, and the collection query shell. No server.
2. A read API for catalog, settings, and enquiries, plus `api-provider.ts`.

Leave orders and SEO out of both. Orders already exist as Edge Functions. The SEO phase cannot do what it asks on a static export whose product data is fetched in the browser.

## The schedule is already two documents

`TASKS.md` says its implementation-order section and `IMPLEMENTATION_ORDER.md` are the same text. They are not.

- `IMPLEMENTATION_ORDER.md` puts M1–M6 in Wave 2, calls G5 the Open Graph check, and calls G6 the nginx note.
- The order section inside `TASKS.md` has no M rows. Its Wave 1 docs lane still assigns G5 to the nginx note.
- The checklist at the bottom of `TASKS.md` uses G5 for Open Graph and G6 for nginx.

An agent that follows the top of `TASKS.md` will write the nginx note as G5 and will never schedule the SEO tasks. Delete `IMPLEMENTATION_ORDER.md`, or reduce it to a link. Keep one schedule, in `TASKS.md`, and regenerate it after the cuts below.

## Cut the order rewrite

`supabase/functions/` already contains `create-order`, `verify-payment`, `razorpay-webhook`, and `release-expired-orders`. B4 and B5 build those again inside Express. That is the largest block in the plan, and P1 only needs a URL.

Simpler plan: `server/` serves catalog, settings, and enquiries. Checkout keeps posting to the existing `create-order` function. The 15-minute release job stays where it is. Drop B4, B5, and the payment half of B6 from this plan. Move them to a later plan if the Edge Functions are actually retired.

P1, P3, and P6 then shrink to the dismiss sentence, the confirmation states, and the shipping-copy removal, which do not need a new orders service.

## One database client

Phase 0 step 2 allows a `pg` pool through `DATABASE_URL` or a Supabase client through the service role key. Pick the Supabase service-role client. The storefront mapper and the Edge Functions already use that API. A second query layer means every route invents its own SQL.

## Match the repository, do not invent a payload

`CollectionView` calls `getCollectionByHandle` and then `getProducts({ collectionHandle })`. `Collection` has no `products` field. `submitEnquiry` returns `Promise<void>`.

The plan's `GET /collections/:handle` returns a collection plus `products`, and `POST /enquiries` returns `{ success, id }`. The client will ignore both inventions, and `api-provider.ts` will have to unpack them.

Simpler contract, one route per existing method:

| Method | Route | Returns |
|---|---|---|
| `getProducts` | `GET /products?collection=&difficulty=&maxPrice=` | `Product[]` |
| `getProductByHandle` | `GET /products/:handle` | `Product` or 404 |
| `getBestSellers` | `GET /products/best-sellers` | `Product[]` |
| `getCollections` | `GET /collections` | `Collection[]` |
| `getCollectionByHandle` | `GET /collections/:handle` | `Collection` or 404 |
| `getSiteSettings` | `GET /settings` | `SiteSettings` or 404 |
| `submitEnquiry` | `POST /enquiries` | 204 |

`getHomepageContent` and `getFounderStory` stay on mock data inside the provider. Do not add homepage or founder routes.

`CommerceRepository` also has cart methods, and the plan has no cart routes. Say this in the plan: cart methods in `api-provider.ts` are the in-memory map the Supabase provider already uses. They are not HTTP. Otherwise A1 forces someone to invent a cart API.

## Drop the admin box

The architecture diagram includes admin management endpoints. No task implements them. Remove that box from this plan.

## Fold tasks that share a file

The order section exists mostly to stop two people editing one file. Merge those rows and the warning goes away.

| Keep | Fold in | Why |
|---|---|---|
| A1 | S1 | Both are `api-provider.ts`. A failed settings response throws. That is the provider's behavior, not a second task. |
| A2 | A3 | Adding the `api` provider includes the env example line. |
| P1 | P3 | Both are `place-order.ts`. If orders stay on the Edge Function, this task is the dismiss sentence only. |
| I1 | F2 | Both edit `homepage-content.ts` and `collections-nav-section.tsx`. |
| H1 | H2 | The route file and the one-paragraph `STATIC_ROUTES.md` note are one change. |
| S3 | the footer half of F2 | One owner for `footer.tsx`. |

Fold each verify row into the task it checks: K2 into K1, I2 into I1, H3 into H1, F4 into F1–F3, B6 into B2 and B3. Keep G1–G4 as the only close-out.

## Do not flip the production default early

A2 sets `api` as the production default. A production build then fails until `NEXT_PUBLIC_API_URL` exists, which is correct, and it fails for every storefront task that runs first. Simpler rule: the `api` branch is opt-in until G4 passes. Production keeps its current "provider must be explicit" throw. The default flip is the last line of G4, not part of A2.

## S4 is cleanup of a client this plan retires

Once the provider is `api`, catalog and settings do not import `src/lib/supabase.ts`. Rewriting the placeholder client is optional. Delete the import from the storefront path when A2 lands, and leave S4 off the critical path.

## Fix the checkout verify sentence

P6 says the body contains only `items` and `customer.shippingAddress`. The contract nests `shippingAddress` inside `customer` and also sends `name`, `email`, and `phone`. An implementer who "simplifies" the body to match P6 will get a 400. The check is: no `price`, `subtotal`, or `unit_price`. The customer object stays as specified.

## SEO does not fit this export

`output: 'export'` bakes `generateMetadata`, `robots.ts`, and `sitemap.ts` at build time. Product pages then fetch the product in the browser, and the cards link to `/products/view/?handle=`, which is one static file. Metadata on that file cannot change per handle. JSON-LD rendered inside `ProductView` (`'use client'`) is absent from the first HTML. A sitemap of published products is stale for any product created after the export, which is the same limit the plan already accepted for handles. WhatsApp's 300KB image rule is an asset edit, not a page-component change. `/cart` is a drawer, not a route. `/admin` is a different app.

Simpler SEO task, one file: `metadataBase`, `og:site_name`, and one default `og:image` in `src/app/layout.tsx`. Drop M2, M3, M5, and M6 from this plan. A `robots.ts` that allows the public pages and disallows `/checkout` and `/checkout/confirmation` can stay. It does not need the API.

## A smaller schedule

Two lanes, then a close-out.

**Lane 1, no server.** One worker, one branch: mock `variant.stock`, `/images/...` paths, Accessories and the footer link, tagline, philosophy bento, collection query shell, shipping-copy removal, confirmation states, dismiss sentence.

**Lane 2, after B0.** Service-role client, then catalog routes and settings routes together as two files. Then `api-provider.ts` (catalog, settings, enquiries over HTTP; cart in memory; settings failures throw). Then the provider switch, still opt-in.

**Close-out.** Lint, build, mock browser pass, API browser pass. Flip the production default only after that pass.

Lane 1 and the `server/` scaffold start together. Nothing in Lane 1 waits on Lane 2.
