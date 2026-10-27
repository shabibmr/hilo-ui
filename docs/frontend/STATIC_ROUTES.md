# Static routes and query shells

With `output: 'export'`, only handles known at build time get a folder under `/products/<handle>/` or `/collections/<handle>/`. A bare unknown handle 404s until the next export.

Query shells work for any handle without a rebuild: `/products/view/?handle=` and `/collections/view/?handle=`. Product cards and new collection links should prefer those shells when the handle may not be in the last export.

All in-site links to collections (header, footer, calls to action, nav cards) use `/collections/view/?handle=`. That includes the virtual `all` listing, which has no static folder because the API returns no collection with that handle. Product cards use `/products/view/?handle=`.
