-- Backend hardening migration: apply with the Supabase migration runner.
-- The Express API uses SUPABASE_SERVICE_ROLE_KEY after validating admin JWTs.
-- Therefore browser roles must not write business tables or execute privileged RPCs.

-- 1) Remove broad authenticated policies. Public storefront access is read-only.
drop policy if exists "admin writes collections" on public.collections;
drop policy if exists "admin writes products" on public.products;
drop policy if exists "admin manages orders" on public.orders;
drop policy if exists "admin manages order items" on public.order_items;
drop policy if exists "admin manages enquiries" on public.enquiries;
drop policy if exists "admin writes site settings" on public.site_settings;
drop policy if exists "admin manages customers" on public.customers;
drop policy if exists "admin manages invoices" on public.invoices;
drop policy if exists "admin manages suppliers" on public.suppliers;
drop policy if exists "admin manages purchase invoices" on public.purchase_invoices;
drop policy if exists "admin manages purchase items" on public.purchase_items;
drop policy if exists "admin uploads images" on storage.objects;

drop policy if exists "public reads published collections" on public.collections;
create policy "public reads published collections" on public.collections
  for select to anon, authenticated using (published = true);
drop policy if exists "public reads published products" on public.products;
create policy "public reads published products" on public.products
  for select to anon, authenticated using (published = true);

-- Remove direct table privileges; retain only storefront reads and enquiry submission.
revoke all on public.collections, public.products, public.orders, public.order_items,
  public.enquiries, public.customers, public.site_settings, public.invoices,
  public.suppliers, public.purchase_invoices, public.purchase_items
  from anon, authenticated;
grant select on public.collections, public.products, public.site_settings to anon, authenticated;
grant insert on public.enquiries to anon, authenticated;

-- 2) Privileged functions are backend-only. Explicitly revoke PUBLIC as well.
revoke all on function public.ensure_invoice(uuid) from public, anon, authenticated;
revoke all on function public.set_order_status(uuid, text) from public, anon, authenticated;
revoke all on function public.create_purchase(uuid, text, date, text, jsonb) from public, anon, authenticated;
revoke all on function public.create_order_atomic(jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.release_expired_pending_orders() from public, anon, authenticated;
grant execute on function public.ensure_invoice(uuid) to service_role;
grant execute on function public.set_order_status(uuid, text) to service_role;
grant execute on function public.create_purchase(uuid, text, date, text, jsonb) to service_role;
grant execute on function public.create_order_atomic(jsonb, jsonb, text) to service_role;
grant execute on function public.release_expired_pending_orders() to service_role;

-- 3) Make order transitions explicit and terminal cancellation/refund states.
create or replace function public.set_order_status(p_order uuid, p_status text)
returns public.orders
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ord public.orders;
  prev text;
  short text;
begin
  if p_status not in ('pending', 'paid', 'shipped', 'delivered', 'cancelled') then
    raise exception 'Invalid or unsupported status: %', p_status;
  end if;

  select * into ord from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  prev := ord.status;
  if prev = p_status then return ord; end if;

  if not (
    (prev = 'pending' and p_status in ('paid', 'cancelled')) or
    (prev = 'paid' and p_status = 'shipped') or
    (prev = 'shipped' and p_status = 'delivered')
  ) then
    raise exception 'Invalid order status transition: % -> %', prev, p_status;
  end if;

  if p_status = 'paid' and ord.razorpay_payment_id is null then
    raise exception 'A verified captured payment is required before marking an order paid';
  end if;

  if p_status = 'cancelled' then
    update public.products p
      set stock = p.stock + oi.quantity
      from public.order_items oi
      where oi.order_id = p_order and oi.product_id = p.id;
  end if;

  update public.orders set status = p_status where id = p_order returning * into ord;
  if p_status = 'paid' then perform public.ensure_invoice(p_order); end if;
  return ord;
end;
$$;

-- Refund completion is a separate operation and only follows a confirmed gateway refund.
create or replace function public.finalize_order_refund(p_order uuid, p_refund_id text)
returns public.orders
language plpgsql
set search_path = public, pg_temp
as $$
declare
  ord public.orders;
begin
  if coalesce(trim(p_refund_id), '') = '' then
    raise exception 'A confirmed gateway refund ID is required';
  end if;
  select * into ord from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if ord.status = 'refunded' then
    if ord.refund_id = p_refund_id then return ord; end if;
    raise exception 'Order already has a different refund';
  end if;
  if ord.status not in ('paid', 'shipped', 'delivered') then
    raise exception 'Cannot refund order in status %', ord.status;
  end if;

  update public.products p
    set stock = p.stock + oi.quantity
    from public.order_items oi
    where oi.order_id = p_order and oi.product_id = p.id;

  update public.orders
    set status = 'refunded', refund_id = p_refund_id, refunded_at = now()
    where id = p_order
    returning * into ord;
  return ord;
end;
$$;
revoke all on function public.finalize_order_refund(uuid, text) from public, anon, authenticated;
grant execute on function public.finalize_order_refund(uuid, text) to service_role;

-- 4) Durable webhook event deduplication and atomic payment confirmation.
create table if not exists public.payment_webhook_events (
  id uuid primary key default gen_random_uuid(),
  gateway text not null,
  event_id text not null,
  event_type text not null,
  processed_at timestamptz not null default now(),
  unique (gateway, event_id)
);
alter table public.payment_webhook_events enable row level security;
revoke all on public.payment_webhook_events from public, anon, authenticated;
grant all on public.payment_webhook_events to service_role;

create or replace function public.process_razorpay_payment(
  p_event_id text,
  p_event_type text,
  p_razorpay_order_id text,
  p_payment_id text,
  p_amount_paise bigint,
  p_currency text,
  p_payment_status text
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  ord public.orders;
  inserted_id uuid;
begin
  if coalesce(trim(p_event_id), '') = '' or coalesce(trim(p_payment_id), '') = '' then
    raise exception 'Webhook event ID and payment ID are required';
  end if;
  if p_payment_status <> 'captured' then
    raise exception 'Payment is not captured';
  end if;

  insert into public.payment_webhook_events(gateway, event_id, event_type)
    values ('razorpay', p_event_id, p_event_type)
    on conflict (gateway, event_id) do nothing
    returning id into inserted_id;
  if inserted_id is null then
    return jsonb_build_object('status', 'duplicate');
  end if;

  select * into ord
    from public.orders
    where razorpay_order_id = p_razorpay_order_id
    for update;
  if not found then raise exception 'Order not found for Razorpay order ID'; end if;

  if ord.currency_code <> upper(p_currency) then
    raise exception 'Payment currency does not match order currency';
  end if;
  if round(ord.subtotal * 100)::bigint <> p_amount_paise then
    raise exception 'Captured payment amount does not match order amount';
  end if;

  if ord.status = 'paid' and ord.razorpay_payment_id = p_payment_id then
    return jsonb_build_object('status', 'duplicate');
  end if;
  if ord.status <> 'pending' then
    raise exception 'Order cannot be paid from status %', ord.status;
  end if;
  if ord.razorpay_payment_id is not null and ord.razorpay_payment_id <> p_payment_id then
    raise exception 'Order already has a different payment ID';
  end if;

  update public.orders
    set razorpay_payment_id = p_payment_id, status = 'paid'
    where id = ord.id;
  perform public.ensure_invoice(ord.id);
  return jsonb_build_object('status', 'paid', 'order_id', ord.id);
end;
$$;
revoke all on function public.process_razorpay_payment(text, text, text, text, bigint, text, text)
  from public, anon, authenticated;
grant execute on function public.process_razorpay_payment(text, text, text, text, bigint, text, text)
  to service_role;

-- Restrict SECURITY DEFINER search paths on existing stock/order functions.
create or replace function public.create_order_atomic(
  p_customer jsonb, p_items jsonb, p_razorpay_order_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
  v_subtotal numeric(10,2) := 0;
  v_item record;
  v_product record;
begin
  insert into public.customers (name, email, phone, default_address)
  values (
    p_customer->>'name', lower(trim(p_customer->>'email')),
    nullif(trim(p_customer->>'phone'), ''), p_customer->'shipping_address'
  )
  on conflict (email) do update set
    name = excluded.name,
    phone = coalesce(excluded.phone, public.customers.phone),
    default_address = excluded.default_address
  returning id into v_customer_id;

  -- Lock products in stable UUID order to avoid opposite-order deadlocks.
  for v_item in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by x.product_id
    order by x.product_id
  loop
    if v_item.product_id is null or v_item.quantity is null or v_item.quantity <= 0 then
      raise exception 'Each item requires a valid product and positive quantity';
    end if;
    select id, title, price, stock, published into v_product
      from public.products where id = v_item.product_id for update;
    if not found then raise exception 'Product % not found', v_item.product_id; end if;
    if not v_product.published then raise exception 'Product "%" is not available', v_product.title; end if;
    if v_product.stock < v_item.quantity then
      raise exception 'Insufficient stock for "%". Only % available.', v_product.title, v_product.stock;
    end if;
    update public.products set stock = stock - v_item.quantity where id = v_product.id;
    v_subtotal := v_subtotal + (v_product.price * v_item.quantity);
  end loop;

  insert into public.orders (
    customer_name, customer_email, customer_phone, shipping_address,
    subtotal, currency_code, status, razorpay_order_id, customer_id
  ) values (
    p_customer->>'name', lower(trim(p_customer->>'email')),
    nullif(trim(p_customer->>'phone'), ''), p_customer->'shipping_address',
    v_subtotal, 'INR', 'pending', p_razorpay_order_id, v_customer_id
  ) returning id into v_order_id;

  for v_item in
    select x.product_id, sum(x.quantity)::integer as quantity
    from jsonb_to_recordset(p_items) as x(product_id uuid, quantity integer)
    group by x.product_id
    order by x.product_id
  loop
    select id, title, price into v_product from public.products where id = v_item.product_id;
    insert into public.order_items(order_id, product_id, title, unit_price, quantity)
      values (v_order_id, v_product.id, v_product.title, v_product.price, v_item.quantity);
  end loop;

  return jsonb_build_object('order_id', v_order_id, 'subtotal', v_subtotal, 'customer_id', v_customer_id);
end;
$$;

create or replace function public.release_expired_pending_orders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r record;
  v_count integer := 0;
begin
  for r in
    select id from public.orders
    where status = 'pending' and created_at < now() - interval '15 minutes'
    order by created_at
    for update skip locked
  loop
    perform public.set_order_status(r.id, 'cancelled');
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.create_order_atomic(jsonb, jsonb, text) from public, anon, authenticated;
revoke all on function public.release_expired_pending_orders() from public, anon, authenticated;
grant execute on function public.create_order_atomic(jsonb, jsonb, text) to service_role;
grant execute on function public.release_expired_pending_orders() to service_role;


-- Invoice issuance is restricted to paid orders. The function remains idempotent.
create or replace function public.ensure_invoice(p_order uuid)
returns public.invoices
language plpgsql
set search_path = public, pg_temp
as $$
declare
  inv public.invoices;
  ord public.orders;
begin
  select * into ord from public.orders where id = p_order for update;
  if not found then raise exception 'Order not found'; end if;
  if ord.status not in ('paid', 'shipped', 'delivered', 'refunded') then
    raise exception 'An invoice can only be issued for a paid order';
  end if;
  select * into inv from public.invoices where order_id = p_order;
  if found then return inv; end if;
  insert into public.invoices(order_id, tax_total, total)
    values (p_order, 0, ord.subtotal)
    on conflict (order_id) do nothing;
  select * into inv from public.invoices where order_id = p_order;
  return inv;
end;
$$;
revoke all on function public.ensure_invoice(uuid) from public, anon, authenticated;
grant execute on function public.ensure_invoice(uuid) to service_role;
