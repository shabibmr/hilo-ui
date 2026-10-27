# Static routes and query shells

With `output: 'export'`, only handles known at build time get a folder under `/products/<handle>/` or `/collections/<handle>/`. A bare unknown handle 404s until the next export.

Query shells work for any handle without a rebuild: `/products/view/?handle=` and `/collections/view/?handle=`. Product cards and new collection links should prefer those shells when the handle may not be in the last export.

All in-site links to collections (header, footer, calls to action, nav cards) use `/collections/view/?handle=`. That includes the virtual `all` listing, which has no static folder because the API returns no collection with that handle. Product cards use `/products/view/?handle=`.

## Collection Link Decisions

Under static export (`output: 'export'`), static collection routes (`/collections/[handle]`) are only pre-rendered for collections available at build time via `generateStaticParams`.

### Static Export Routes vs. Dynamic Query Shells

- **Static Export Routes (`/collections/[handle]`)**: Pre-rendered at export time from the API snapshot. They provide canonical deep links for known collections at build time. However, any collection added, renamed, or unpublished in the database after export will 404 if accessed via this path until the site is rebuilt. Furthermore, virtual listings such as `/collections/all` do not exist in the database and have no static folder.
- **Dynamic Query Shell (`/collections/view/?handle=`)**: A single pre-rendered shell (`/collections/view/index.html`) that performs client-side data fetching via `useLive` and the API client at runtime. It resolves any current collection dynamically and handles virtual collections (`all`) without requiring a rebuild or redeployment.

### Routing Policy for In-Site Links

To avoid 404s when the catalog changes or when linking to virtual listings, all in-site collection links MUST use the query shell (`/collections/view/?handle=<handle>`):

- Header & mobile nav: `/collections/view/?handle=diy-kits`, `/collections/view/?handle=gift-experiences`
- Footer: `/collections/view/?handle=diy-kits`, `/collections/view/?handle=gift-experiences`, `/collections/view/?handle=all`
- Cart drawer empty state: `/collections/view/?handle=diy-kits`
- Checkout empty state: `/collections/view/?handle=diy-kits`
- What's Inside section CTA: `/collections/view/?handle=diy-kits`
- Best Sellers section CTA: `/collections/view/?handle=diy-kits`
- Homepage collections rail (`CollectionsNavSection`): `/collections/view/?handle=${handle}`
- Empty/404 fallbacks in `CollectionView` and `ProductView`: `/collections/view/?handle=all`
