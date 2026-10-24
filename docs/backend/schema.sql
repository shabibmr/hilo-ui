-- Hilo Arte admin backend: run in the Supabase SQL editor.
-- Public (anon) may read published catalog data and submit enquiries.
-- Only the single admin user (authenticated role) may write or read orders/enquiries.
-- Sign-ups must be DISABLED in Supabase Auth settings; create the admin user manually.

create table collections (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  title text not null,
  description text not null default '',
  image jsonb,                         -- ImageAsset { url, altText }
  featured_product_handles text[] not null default '{}',
  sort_order int not null default 0,
  published boolean not null default true
);

create table products (
  id uuid primary key default gen_random_uuid(),
  handle text unique not null,
  title text not null,
  subtitle text,
  description text not null default '',
  short_description text not null default '',
  price numeric(10,2) not null,
  currency_code text not null default 'INR',
  difficulty text not null default 'Beginner'
    check (difficulty in ('Beginner','Intermediate','Advanced')),
  estimated_hours numeric(4,1) not null default 0,
  images jsonb not null default '[]',          -- ImageAsset[]
  collections text[] not null default '{}',    -- collection handles
  tags text[] not null default '{}',
  whats_included text[] not null default '{}',
  shipping_info text not null default '',
  faqs jsonb not null default '[]',            -- {question, answer}[]
  is_best_seller boolean not null default false,
  is_featured boolean not null default false,
  stock int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text not null,
  customer_phone text,
  shipping_address jsonb not null,
  subtotal numeric(10,2) not null,
  currency_code text not null default 'INR',
  status text not null default 'pending'
    check (status in ('pending','paid','shipped','delivered','cancelled','refunded')),
  razorpay_order_id text,
  razorpay_payment_id text,
  refund_id text,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  title text not null,           -- snapshot at purchase time
  unit_price numeric(10,2) not null,
  quantity int not null check (quantity > 0)
);

create table enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'contact' check (kind in ('contact','workshop')),
  name text not null,
  email text not null,
  message text not null,
  handled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Row-level security
alter table collections  enable row level security;
alter table products     enable row level security;
alter table orders       enable row level security;
alter table order_items  enable row level security;
alter table enquiries    enable row level security;

create policy "public reads published collections" on collections
  for select using (published or auth.role() = 'authenticated');
create policy "public reads published products" on products
  for select using (published or auth.role() = 'authenticated');
create policy "admin writes collections" on collections
  for all to authenticated using (true) with check (true);
create policy "admin writes products" on products
  for all to authenticated using (true) with check (true);

create policy "admin manages orders" on orders
  for all to authenticated using (true) with check (true);
create policy "admin manages order items" on order_items
  for all to authenticated using (true) with check (true);
-- Orders are inserted by a Razorpay webhook Edge Function using the service role key (bypasses RLS).

create policy "anyone submits enquiries" on enquiries
  for insert to anon, authenticated with check (true);
create policy "admin manages enquiries" on enquiries
  for all to authenticated using (true) with check (true);

-- Storage: create a PUBLIC bucket named "product-images" in the dashboard, then:
create policy "admin uploads images" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images') with check (bucket_id = 'product-images');

-- ===== Scope expansion: customers, site settings, invoices, purchases =====
-- "collections" above are the product categories shown in the admin.

create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  phone text,
  default_address jsonb,
  created_at timestamptz not null default now()
);
alter table orders add column customer_id uuid references customers(id) on delete set null;

-- Single-row site settings: hero, store address, contact, social links, etc.
create table site_settings (
  id int primary key default 1 check (id = 1),
  hero jsonb not null default '{}',          -- eyebrow, headline, subheadline, ctas, backgroundImage
  store jsonb not null default '{}',         -- name, address, phone, email, hours, gstin
  social jsonb not null default '{}',
  announcement text,                         -- promo bar text
  updated_at timestamptz not null default now()
);
insert into site_settings (id) values (1);

-- Sales invoices: one per order, sequential number
create sequence invoice_no_seq;
create table invoices (
  id uuid primary key default gen_random_uuid(),
  order_id uuid unique not null references orders(id) on delete cascade,
  invoice_no text unique not null default ('HA-' || lpad(nextval('invoice_no_seq')::text, 5, '0')),
  issued_at timestamptz not null default now(),
  tax_total numeric(10,2) not null default 0,
  total numeric(10,2) not null
);

-- Purchases from suppliers (entering a bill increases product stock)
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  gstin text
);
create table purchase_invoices (
  id uuid primary key default gen_random_uuid(),
  supplier_id uuid references suppliers(id) on delete set null,
  bill_no text not null,
  bill_date date not null,
  total numeric(10,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);
create table purchase_items (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references purchase_invoices(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  description text not null,
  quantity int not null check (quantity > 0),
  unit_cost numeric(10,2) not null
);

alter table customers         enable row level security;
alter table site_settings     enable row level security;
alter table invoices          enable row level security;
alter table suppliers         enable row level security;
alter table purchase_invoices enable row level security;
alter table purchase_items    enable row level security;

create policy "public reads site settings" on site_settings for select using (true);
create policy "admin writes site settings" on site_settings
  for all to authenticated using (true) with check (true);
create policy "admin manages customers" on customers
  for all to authenticated using (true) with check (true);
create policy "admin manages invoices" on invoices
  for all to authenticated using (true) with check (true);
create policy "admin manages suppliers" on suppliers
  for all to authenticated using (true) with check (true);
create policy "admin manages purchase invoices" on purchase_invoices
  for all to authenticated using (true) with check (true);
create policy "admin manages purchase items" on purchase_items
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Admin functions (called through supabase.rpc). They run as the signed-in
-- admin, so the RLS policies above still apply.
-- ---------------------------------------------------------------------------

-- Idempotent: returns the existing invoice for an order or issues the next HA- number.
create or replace function ensure_invoice(p_order uuid)
returns invoices
language plpgsql
as $$
declare
  inv invoices;
  ord orders;
begin
  select * into inv from invoices where order_id = p_order;
  if found then return inv; end if;
  select * into ord from orders where id = p_order;
  if not found then raise exception 'Order not found'; end if;
  insert into invoices (order_id, tax_total, total)
    values (p_order, 0, ord.subtotal)
    on conflict (order_id) do nothing;
  select * into inv from invoices where order_id = p_order;
  return inv;
end;
$$;

-- Changes status in one transaction. Every non-cancelled order holds its stock, so
-- moving into 'cancelled' puts the stock back and moving out of it (reopening)
-- takes it again, failing if there isn't enough. Paid/shipped/delivered orders get an invoice.
create or replace function set_order_status(p_order uuid, p_status text)
returns orders
language plpgsql
as $$
declare
  ord orders;
  prev text;
  short text;
begin
  if p_status not in ('pending', 'paid', 'shipped', 'delivered', 'cancelled', 'refunded') then
    raise exception 'Invalid status: %', p_status;
  end if;
  select * into ord from orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  prev := ord.status;
  if prev = p_status then return ord; end if;
  if prev = 'refunded' then
    raise exception 'Order is already refunded';
  end if;
  -- A captured Razorpay payment can only be unwound by a refund, never by cancel/pending.
  if ord.razorpay_payment_id is not null and prev in ('paid', 'shipped', 'delivered')
     and p_status in ('pending', 'cancelled') then
    raise exception 'This order has a captured payment; refund it instead';
  end if;
  if prev = 'cancelled' and p_status = 'refunded' then
    null; -- stock was already restored when the order was cancelled
  elsif p_status in ('cancelled', 'refunded') and prev != 'cancelled' then
    update products p set stock = p.stock + oi.quantity
      from order_items oi
      where oi.order_id = p_order and oi.product_id = p.id;
  elsif prev = 'cancelled' then
    select string_agg(p.title, ', ') into short
      from order_items oi join products p on p.id = oi.product_id
      where oi.order_id = p_order and p.stock < oi.quantity;
    if short is not null then
      raise exception 'Not enough stock to reopen this order: %', short;
    end if;
    update products p set stock = p.stock - oi.quantity
      from order_items oi
      where oi.order_id = p_order and oi.product_id = p.id;
  end if;
  update orders set status = p_status, refunded_at = case when p_status = 'refunded' then now() else refunded_at end
    where id = p_order returning * into ord;
  if p_status in ('paid', 'shipped', 'delivered') then
    perform ensure_invoice(p_order);
  end if;
  return ord;
end;
$$;

-- Saves a purchase bill, its lines and the stock increase together.
-- p_items: [{ "product_id": uuid|null, "description": text, "quantity": int, "unit_cost": numeric }]
create or replace function create_purchase(
  p_supplier uuid, p_bill_no text, p_bill_date date, p_notes text, p_items jsonb
)
returns purchase_invoices
language plpgsql
as $$
declare
  pur purchase_invoices;
  line jsonb;
  v_total numeric(10,2) := 0;
begin
  if coalesce(trim(p_bill_no), '') = '' then raise exception 'Bill number is required'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0 then
    raise exception 'Add at least one line';
  end if;
  insert into purchase_invoices (supplier_id, bill_no, bill_date, notes)
    values (p_supplier, trim(p_bill_no), p_bill_date, p_notes)
    returning * into pur;
  for line in select * from jsonb_array_elements(p_items) loop
    insert into purchase_items (purchase_id, product_id, description, quantity, unit_cost)
      values (
        pur.id,
        nullif(line->>'product_id', '')::uuid,
        line->>'description',
        (line->>'quantity')::int,
        (line->>'unit_cost')::numeric
      );
    v_total := v_total + (line->>'quantity')::int * (line->>'unit_cost')::numeric;
    if nullif(line->>'product_id', '') is not null then
      update products set stock = stock + (line->>'quantity')::int
        where id = (line->>'product_id')::uuid;
    end if;
  end loop;
  update purchase_invoices set total = v_total where id = pur.id returning * into pur;
  return pur;
end;
$$;

revoke execute on function ensure_invoice(uuid), set_order_status(uuid, text),
  create_purchase(uuid, text, date, text, jsonb) from public, anon;
grant execute on function ensure_invoice(uuid), set_order_status(uuid, text),
  create_purchase(uuid, text, date, text, jsonb) to authenticated;


-- ---------------------------------------------------------------------------
-- Atomic order creation (called by create-order Edge Function with service_role)
-- ---------------------------------------------------------------------------

create or replace function create_order_atomic(
  p_customer jsonb,
  p_items jsonb,
  p_razorpay_order_id text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_item record;
  v_product record;
begin
  -- 1. Upsert customer
  insert into customers (name, email, phone, default_address)
    values (
      p_customer->>'name',
      lower(trim(p_customer->>'email')),
      nullif(trim(p_customer->>'phone'), ''),
      p_customer->'shipping_address'
    )
    on conflict (email) do update set
      name = excluded.name,
      phone = coalesce(excluded.phone, customers.phone),
      default_address = excluded.default_address
    returning id into v_customer_id;

  -- 2. Validate and reserve stock for all items
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int) loop
    if v_item.quantity <= 0 then
      raise exception 'Item quantity must be greater than zero';
    end if;

    select id, title, price, stock, published into v_product
      from products
      where id = v_item.product_id
      for update;

    if not found then
      raise exception 'Product % not found', v_item.product_id;
    end if;

    if not v_product.published then
      raise exception 'Product "%" is not available for purchase', v_product.title;
    end if;

    if v_product.stock < v_item.quantity then
      raise exception 'Insufficient stock for "%". Only % available.', v_product.title, v_product.stock;
    end if;

    -- Decrement stock atomically
    update products set stock = stock - v_item.quantity where id = v_product.id;

    -- Calculate line total strictly from DB price (client prices are ignored)
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  -- 3. Create order
  insert into orders (
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    subtotal,
    currency_code,
    status,
    razorpay_order_id,
    customer_id
  ) values (
    p_customer->>'name',
    lower(trim(p_customer->>'email')),
    nullif(trim(p_customer->>'phone'), ''),
    p_customer->'shipping_address',
    v_subtotal,
    'INR',
    'pending',
    p_razorpay_order_id,
    v_customer_id
  ) returning id into v_order_id;

  -- 4. Insert order items snapshot
  for v_item in select * from jsonb_to_recordset(p_items) as x(product_id uuid, quantity int) loop
    select id, title, price into v_product from products where id = v_item.product_id;

    insert into order_items (order_id, product_id, title, unit_price, quantity)
      values (v_order_id, v_product.id, v_product.title, v_product.price, v_item.quantity);
  end loop;

  return jsonb_build_object(
    'order_id', v_order_id,
    'subtotal', v_subtotal,
    'customer_id', v_customer_id
  );
end;
$$;

-- Releases stock holds for unpaid pending orders older than 15 minutes
create or replace function release_expired_pending_orders()
returns int
language plpgsql
security definer
as $$
declare
  r record;
  v_count int := 0;
begin
  for r in
    select id from orders
    where status = 'pending'
      and created_at < (now() - interval '15 minutes')
  loop
    perform set_order_status(r.id, 'cancelled');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

-- Grant execution to authenticated & service_role
grant execute on function create_order_atomic(jsonb, jsonb, text) to authenticated, service_role;
grant execute on function release_expired_pending_orders() to authenticated, service_role;

-- Scheduled job configuration (enable pg_cron extension in Supabase Dashboard):
-- select cron.schedule('release-unpaid-orders-every-5m', '*/5 * * * *', 'select release_expired_pending_orders();');
