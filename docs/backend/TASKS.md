# Hilo Arte Admin Backend: Tasks Register

Status: `[ ]` todo, `[~]` in progress, `[x]` done. Owner: U = user, C = Claude.

## Phase 0: Supabase setup
- [x] C: Write `schema.sql` (tables + RLS)
- [ ] U: Create Supabase project
- [ ] U: Run `schema.sql` in the SQL editor
- [ ] U: Create public storage bucket `product-images`
- [ ] U: Disable public sign-ups in Auth settings
- [ ] U: Create the single admin user
- [ ] U: Provide project URL and anon key (never the service key in chat)

## Phase 1: Seed data
- [x] Decision: no variants in v1, one price per product
- [ ] C: Seed script from `src/lib/data/mock` to Supabase
- [ ] U: Run seed locally with the service key in a local env var

## Phase 2: Admin app scaffold
- [x] C: Create `admin/` Next + Tailwind project
- [x] C: Supabase client and `.env.local.example`
- [x] C: `admin/lib/api.ts` as the only data module (no direct calls in components)
- [ ] C: Make `admin/lib/api.ts` API-only: delete mock mode, direct-Supabase data mode, `NEXT_PUBLIC_DATA_MODE` and the email allowlist (decided 2026-10-27; see `API_SERVICE_PLAN.md` Phase 7)
- [x] C: Login page and auth guard
- [x] C: Layout with navigation

## Phase 3: Products and collections
- [x] C: Products list (search, publish state, stock)
- [x] C: Product create/edit form
- [x] C: Image upload to Storage and reorder/remove
- [x] C: Publish toggle and stock field
- [x] C: Collections list and edit

## Phase 4: Orders and enquiries
- [x] C: Orders list and detail
- [x] C: Order status update
- [x] C: Enquiries list with handled toggle

## Phase 4b: Customers, invoices, purchases, site settings
- [x] C: Customers list and detail with order history
- [x] C: Sales invoice generation (sequential number) and printable view
- [x] C: Suppliers CRUD
- [x] C: Purchase bills entry (increases product stock)
- [x] C: Site settings form: hero image/text, store address, contact, social, announcement bar
- [ ] U: Provide store address, GSTIN and invoice details

## Phase 5: Storefront integration
- [x] C: `SupabaseProvider` implementing `CommerceRepository`
- [x] C: Env flag to switch provider (mock for local dev only)
- [x] C: Error + retry state when Supabase is unreachable
- [x] C: Header, footer, contact page and hero read `site_settings`
- [x] C: Verify product, collection and best-seller pages with live data

## Phase 5b: Order Edge Functions

> Retired by ADR 0001 once the API owns checkout and webhooks (`API_MIGRATION_PLAN.md` Stages 2 and 4).

- [x] C: `create-order` function (DB prices, atomic stock decrement, Razorpay order)
- [x] C: `razorpay-webhook` function (signature check, mark paid)
- [x] C: Scheduled job releasing stock for pending orders older than 15 minutes
- [ ] U: Provide Razorpay test keys as Supabase secrets
- [x] C: Test: tampered price rejected, last item cannot oversell
- [x] C: Schema: add `refunded` status, `refund_id`, `refunded_at`; update `set_order_status` (restock on refund)
- [x] C: `refund-order` Edge Function (admin JWT check, Razorpay refund API, full refund)
- [x] C: `verify-payment` Edge Function (sync a stuck pending order with Razorpay)
- [x] C: `refundOrder` and `verifyPayment` in `admin/lib/api.ts` (mock parity is dropped with mock mode)
- [x] C: Orders screen: Refund button, Verify with Razorpay, Razorpay dashboard link
- [x] C: Block manual "mark as paid" when a `razorpay_payment_id` exists
- [x] C: Test: refund of a paid order restocks once, a second refund is rejected

## Phase 6: Verify and deploy
- [x] C: Test RLS: anon cannot write or read drafts/orders, admin can
- [x] C: Lint and build both apps
- [ ] U: Confirm admin deploy path and domain
- [ ] C: Static export and deploy admin

## Before real orders
- [x] C: Scheduled database export script (or U: upgrade Supabase plan)
- [ ] U: Decide go-live backup approach

## Later (not v1)
- [ ] Order confirmation emails
- [ ] Founder story and other page content editing
- [ ] Seminars and bookings
- [ ] Raw-material inventory
- [ ] Multiple admin users
- [ ] Partial refunds
- [ ] Razorpay settlement reconciliation
