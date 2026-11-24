-- Phase 1 commerce stability: persistent anonymous carts.
-- Apply after taking a database backup. API access uses the Supabase service role;
-- no anon/authenticated table policies are intentionally created.

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  currency_code text not null default 'INR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  variant_id text not null,
  quantity integer not null check (quantity between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_cart_product_variant_key unique (cart_id, product_id, variant_id)
);

create index if not exists carts_expires_at_idx on public.carts(expires_at);
create index if not exists cart_items_cart_id_idx on public.cart_items(cart_id);

alter table public.carts enable row level security;
alter table public.cart_items enable row level security;

-- Serialize mutations per cart and product so concurrent tabs cannot lose increments.
create or replace function public.add_cart_item(
  p_cart_id uuid,
  p_product_id uuid,
  p_variant_id text,
  p_quantity integer
) returns public.cart_items
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts;
  v_stock integer;
  v_currency_code text;
  v_existing integer := 0;
  v_item public.cart_items;
begin
  if p_quantity is null or p_quantity < 1 or p_quantity > 20 then
    raise exception 'Quantity must be an integer between 1 and 20';
  end if;

  select * into v_cart from public.carts where id = p_cart_id for update;
  if not found or v_cart.expires_at <= now() then
    raise exception 'Cart not found or expired';
  end if;

  if p_variant_id <> p_product_id::text || '-default' then
    raise exception 'Invalid product variant';
  end if;

  select stock, currency_code into v_stock, v_currency_code
    from public.products
    where id = p_product_id and published = true
    for update;
  if not found then
    raise exception 'Product is not available';
  end if;

  if not exists (select 1 from public.cart_items where cart_id = p_cart_id) then
    update public.carts set currency_code = coalesce(v_currency_code, 'INR') where id = p_cart_id;
  elsif v_cart.currency_code <> coalesce(v_currency_code, 'INR') then
    raise exception 'A cart cannot contain products in different currencies';
  end if;

  select quantity into v_existing
    from public.cart_items
    where cart_id = p_cart_id and product_id = p_product_id and variant_id = p_variant_id;

  if coalesce(v_existing, 0) + p_quantity > least(v_stock, 20) then
    raise exception 'Requested quantity exceeds available stock';
  end if;

  insert into public.cart_items (cart_id, product_id, variant_id, quantity, updated_at)
  values (p_cart_id, p_product_id, p_variant_id, p_quantity, now())
  on conflict (cart_id, product_id, variant_id)
  do update set quantity = public.cart_items.quantity + excluded.quantity, updated_at = now()
  returning * into v_item;

  update public.carts set updated_at = now(), expires_at = now() + interval '30 days'
    where id = p_cart_id;
  return v_item;
end;
$$;

create or replace function public.set_cart_item_quantity(
  p_cart_id uuid,
  p_line_id uuid,
  p_quantity integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart public.carts;
  v_item public.cart_items;
  v_stock integer;
begin
  if p_quantity is null or p_quantity < 0 or p_quantity > 20 then
    raise exception 'Quantity must be an integer between 0 and 20';
  end if;

  select * into v_cart from public.carts where id = p_cart_id for update;
  if not found or v_cart.expires_at <= now() then
    raise exception 'Cart not found or expired';
  end if;

  select * into v_item from public.cart_items
    where id = p_line_id and cart_id = p_cart_id for update;
  if not found then
    raise exception 'Cart item not found';
  end if;

  if p_quantity = 0 then
    delete from public.cart_items where id = p_line_id;
  else
    select stock into v_stock from public.products
      where id = v_item.product_id and published = true for update;
    if not found or p_quantity > least(v_stock, 20) then
      raise exception 'Requested quantity exceeds available stock';
    end if;
    update public.cart_items set quantity = p_quantity, updated_at = now()
      where id = p_line_id;
  end if;

  update public.carts set updated_at = now(), expires_at = now() + interval '30 days'
    where id = p_cart_id;
end;
$$;

revoke all on function public.add_cart_item(uuid, uuid, text, integer) from public, anon, authenticated;
revoke all on function public.set_cart_item_quantity(uuid, uuid, integer) from public, anon, authenticated;
grant execute on function public.add_cart_item(uuid, uuid, text, integer) to service_role;
grant execute on function public.set_cart_item_quantity(uuid, uuid, integer) to service_role;

-- Expired carts are intentionally retained for a short recovery window, then purged.
-- Schedule this statement with pg_cron if the extension is enabled:
-- select cron.schedule('purge-expired-carts-daily', '17 3 * * *',
--   $$delete from public.carts where expires_at < now() - interval '7 days'$$);
