alter table public.products
  add column if not exists stock_quantity integer;

alter table public.products
  add constraint products_stock_quantity_nonnegative
  check (stock_quantity is null or stock_quantity >= 0);

alter table public.orders
  add column if not exists idempotency_key uuid,
  add column if not exists subtotal numeric(12, 2),
  add column if not exists shipping numeric(12, 2),
  add column if not exists total numeric(12, 2),
  add column if not exists updated_at timestamptz;

create unique index if not exists orders_idempotency_key_unique
  on public.orders (idempotency_key)
  where idempotency_key is not null;

create or replace function public.place_order(
  p_order_id uuid,
  p_idempotency_key uuid,
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text,
  p_status text,
  p_created_at timestamptz,
  p_subtotal numeric,
  p_shipping numeric,
  p_total numeric
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_item jsonb;
  v_product_id bigint;
  v_quantity integer;
  v_stock_quantity integer;
  v_in_stock boolean;
  v_remaining integer;
  v_inventory_tracked boolean := true;
begin
  insert into public.orders (
    id, idempotency_key, customer, items, payment_method, status,
    created_at, subtotal, shipping, total
  )
  values (
    p_order_id, p_idempotency_key, p_customer, p_items, p_payment_method, p_status,
    p_created_at, p_subtotal, p_shipping, p_total
  )
  on conflict (idempotency_key) where idempotency_key is not null
  do nothing
  returning * into v_order;

  if not found then
    select * into v_order
    from public.orders
    where idempotency_key = p_idempotency_key;

    return jsonb_build_object(
      'created', false,
      'order', to_jsonb(v_order),
      'inventory_tracked', null
    );
  end if;

  for v_item in
    select value
    from jsonb_array_elements(p_items)
    order by (value->>'product_id')::bigint
  loop
    v_product_id := (v_item->>'product_id')::bigint;
    v_quantity := (v_item->>'quantity')::integer;

    select stock_quantity, in_stock
    into v_stock_quantity, v_in_stock
    from public.products
    where id = v_product_id
    for update;

    if not found then
      raise exception using errcode = 'P0001', message = 'A product is no longer available';
    end if;

    if v_in_stock is distinct from true then
      raise exception using errcode = 'P0001', message = 'A product is out of stock';
    end if;

    if v_stock_quantity is null then
      v_inventory_tracked := false;
    else
      if v_stock_quantity < v_quantity then
        raise exception using errcode = 'P0001', message = 'Insufficient stock for a product';
      end if;

      v_remaining := v_stock_quantity - v_quantity;
      update public.products
      set stock_quantity = v_remaining,
          in_stock = (v_remaining > 0)
      where id = v_product_id;
    end if;
  end loop;

  return jsonb_build_object(
    'created', true,
    'order', to_jsonb(v_order),
    'inventory_tracked', v_inventory_tracked
  );
end;
$$;

revoke all on function public.place_order(
  uuid, uuid, jsonb, jsonb, text, text, timestamptz, numeric, numeric, numeric
) from public, anon, authenticated;

grant execute on function public.place_order(
  uuid, uuid, jsonb, jsonb, text, text, timestamptz, numeric, numeric, numeric
) to service_role;
