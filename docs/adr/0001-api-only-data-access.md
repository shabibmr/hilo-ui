# 0001. API-only data access; no mock data, no direct Supabase

Status: accepted, 2026-10-27. Supersedes the "mock / supabase / api provider" model in `docs/IMPLEMENTATION_PLAN.md` and the "direct, default" fallbacks in `docs/backend/API_MIGRATION_PLAN.md`.

## Decision

`server/` (Express, `/api/v1`) is the only data path for both apps.

- **Storefront:** reads catalog and settings, sends enquiries, and creates orders only through `NEXT_PUBLIC_API_URL`. It does not import `@supabase/supabase-js`, hold the anon key, or call Edge Functions.
- **Admin:** (API-only since the 2026-10-27 decision in `API_MIGRATION_PLAN.md`, removed in Stage 3) all data calls go through the API with the Supabase access token. The one remaining Supabase browser use is **sign-in** (Supabase Auth), because the API verifies that token.
- **Mock data is removed from both apps.** Local development runs `server/` against a dev Supabase project (or a local one). Test fixtures live in `server/` tests, not in app bundles.
- **Page copy** that was served from `MOCK_HOMEPAGE_CONTENT` and `MOCK_FOUNDER_STORY` moves to the API (site settings or a content endpoint) or into the page source as plain content. Nothing named "mock" ships.
- **Cart** stays client-side state (Zustand). It is not a data provider; prices and stock are re-checked by the API when the order is created.

## Consequences

- One provider means `NEXT_PUBLIC_DATA_PROVIDER`, `DATA_PROVIDER`, `NEXT_PUBLIC_CHECKOUT_MODE`, and `NEXT_PUBLIC_DATA_MODE` are deleted, not defaulted. A build without `NEXT_PUBLIC_API_URL` fails.
- The browser no longer needs Supabase table access. RLS lock-down (Stage 4) can drop all anon and authenticated data policies; Auth stays.
- **Rollback changes shape.** The admin has no fallback from Stage 3. The storefront has no flag back to Edge Functions or direct Supabase once Stage 5 lands. Rollback is redeploying the previous build, so the fallback code must be removed only after the API has been the sole path for about a week.
- An API outage takes the storefront catalog down with it. The static export has no offline fallback. `/health` monitoring and systemd restart-on-failure are the mitigation.
- Edge Functions (`create-order`, `verify-payment`, `refund-order`, `razorpay-webhook`, `release-expired-orders`) are retired once the API owns checkout and webhooks and logs show no traffic for 7 days.

## Alternatives rejected

- Keep `mock` for local development only: it kept shipping sample data paths into production builds and let the `mock`/`supabase` checkout branch go wrong (the `?preview=1` bug). A dev API removes the need.
- Keep direct Supabase as a rollback flag: leaves the anon key and write-capable RLS policies in play, which Stage 4 is meant to remove.
