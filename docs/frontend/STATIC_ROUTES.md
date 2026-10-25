# Static routes and query shells

With `output: 'export'`, only handles known at build time get a folder under `/products/<handle>/` or `/collections/<handle>/`. A bare unknown handle 404s until the next export.

Query shells work for any handle without a rebuild: `/products/view/?handle=` and `/collections/view/?handle=`. Product cards and new collection links should prefer those shells when the handle may not be in the last export.
