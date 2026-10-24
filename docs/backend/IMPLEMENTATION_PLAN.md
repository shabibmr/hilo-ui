# Hilo Arte Admin Backend: Implementation Plan

Goal: the most basic admin backend that lets one person manage the catalog, stock, orders and enquiries, with the static storefront reading live data.

## Decisions (from planning interview)

| Area | Decision |
|---|---|
| Backend | Supabase (Postgres, Storage, Auth), hosted |
| Admin UI | Separate Next app at `E:\work\hilo\admin` |
| Auth | One admin user in Supabase Auth, public sign-ups disabled. No env-var password, since it would be exposed in a browser app. |
| Storefront data | Static export fetches from Supabase at runtime with the anon key. No rebuild needed after admin edits. |
| Scope v1 | Physical products only (no seminars/workshop bookings). Product + category CRUD with images, stock, customers list, order management, sales invoices, supplier purchase invoices, enquiries, and site settings (hero image, store address, contact, announcement bar). |
| Categories | Existing `collections` table serves as product categories |
| Customers | Guest checkout only in v1 (no customer login or order-history page); a customer record is created/updated per email at order time. Supabase Auth stays admin-only. |
| Invoices | Both: sales invoice per order (sequential `HA-00001`), and supplier purchase bills that add stock |
| Stock reservation | Unpaid orders hold stock for 15 minutes, then it is released |
| Payments | Razorpay. A `create-order` Edge Function is in v1 (see Phase 5b). |
| Order trust | Browser sends only product IDs + quantities. The Edge Function reads prices from the DB, decrements stock atomically, creates the Razorpay order and writes the order. |
| Stock | Enforced in the Edge Function (atomic update fails at 0). Storefront shows sold out from live data. |
| Variants | None in v1. One price per product. Storefront builds a single default variant. |
| Separate app | Kept separate so admin code is not shipped in the public bundle. |
| Data access rule | No component calls Supabase directly. The storefront goes through the repository interfaces, and the admin through one module (`admin/lib/api.ts`, e.g. `listProducts`, `saveProduct`). This keeps a custom API layer a later swap behind the same interfaces, not a rewrite. |

## Architecture

```
Admin app (admin/)  --Supabase JS (authenticated)-->  Supabase
Storefront (src/)   --Supabase JS (anon, read-only)-> (Postgres + Storage + Auth)
Checkout --create-order / razorpay-webhook Edge Functions (service role)--> orders, stock
```

Security is enforced by row-level security in `schema.sql`:
- anon: read published products/collections, insert enquiries
- authenticated (the admin): full access
- service role (webhook only): inserts orders, bypasses RLS

## Phases

### Phase 0: Supabase setup (manual, user)
Create the project, run `schema.sql`, create the public `product-images` bucket, disable sign-ups, create the admin user, and record the URL and anon key in `.env.local` files.

### Phase 1: Seed data
Script that loads the current mock products and collections from `src/lib/data/mock` into Supabase (uses the service key locally, never committed).

### Phase 2: Admin app scaffold
Next + Tailwind + `@supabase/supabase-js`. Login page, auth guard, layout with nav. All data calls live in `admin/lib/api.ts`; pages and components import from it and never use the Supabase client directly.

### Phase 3: Products and collections
List, create/edit form (all `Product` fields, images upload to Storage, publish toggle, stock). Basic collections editor.

### Phase 4: Orders and enquiries
Orders list and detail with status change. Enquiries list with a "handled" toggle.

### Phase 4b: Customers, invoices, purchases, site settings
Customers list with order history. Printable sales invoice per order. Suppliers and purchase bills (saving a bill increases stock). Site settings form (hero image, store address, contact, social, announcement bar).

### Phase 5: Storefront integration
Add a `SupabaseProvider` implementing `CommerceRepository` (cart stays client-side). Header, footer, contact page and homepage hero read from `site_settings`. Switch the provider by env flag (mock data only in local development). In production, if Supabase is unreachable the storefront shows an error with a retry, never stale data.

### Phase 5b: Order Edge Functions
`create-order` (validates cart, prices from DB, atomic stock decrement, creates Razorpay order, inserts order as `pending`) and `razorpay-webhook` (verifies signature, marks order `paid`). Both use the service role key stored as Supabase secrets.

Admin-side Razorpay (also Phase 5b), all through Edge Functions because the Razorpay secret key can never be in the browser:
- `refund-order` (admin-only; checks the caller's JWT). Calls Razorpay's refund API for a paid order (full refund in v1), stores `refund_id` and `refunded_at` on the order, sets status `refunded`, and puts stock back. Wrapped by `refundOrder(orderId)` in `admin/lib/api.ts`.
- `verify-payment` (admin-only). Looks up a stuck `pending` order's Razorpay order and marks it `paid` if Razorpay says it was paid. Wrapped by `verifyPayment(orderId)`.
- Manual "mark as paid" is blocked once a `razorpay_payment_id` exists, and a paid Razorpay order can only be undone by refund, not by a status edit.
- Schema change: add status `refunded` to the `orders.status` check, add `refund_id` and `refunded_at`, and teach `set_order_status` the `refunded` transition (restock).
- Orders screen: "Refund" button (with confirm), "Verify with Razorpay" on pending orders, and a link to the payment in the Razorpay dashboard.
- Partial refunds and settlement reconciliation are not in v1.

### Phase 6: Deploy
Static export of the admin app, deploy to the dev server. Confirm the target path, since `/var/www/html/algo_cloud/hilo` belongs to the storefront.

### Later (not v1)
Order confirmation emails, full homepage/founder content editing beyond hero, seminars and bookings, raw-material inventory, multiple admins.

## Risks and open items
- Static export means no server-side secrets. Only the anon key and RLS protect data, so RLS policies must be tested before launch.
- Pending orders release stock after 15 minutes (scheduled job in Supabase, e.g. pg_cron).
- Purchase bills may be for raw materials (thread, fabric) rather than sellable kits; v1 links purchase items to products only, so material stock is not tracked.
- GST: invoice tax fields exist but rates/rules are not yet decided.
- Seminars/workshops are out of scope for v1.
- Backups: free tier has none. Start on free; before real orders, either add a scheduled database export to the server or upgrade to a paid plan. Free projects also pause after a week of inactivity.
- Admin deploy path and domain are undecided.
- Homepage and founder content stays in mock data for v1.
