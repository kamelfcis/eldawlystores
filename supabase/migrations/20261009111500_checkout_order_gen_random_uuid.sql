-- Order ids use gen_random_uuid() so checkout works with search_path = public.

CREATE OR REPLACE FUNCTION public.create_checkout_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_governorate text,
  p_city text,
  p_street text,
  p_building text,
  p_floor text,
  p_promo_code text,
  p_payment_method text,
  p_items jsonb
)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  access_token text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requested jsonb;
  v_lines jsonb := '[]'::jsonb;
  v_req record;
  v_stock int;
  v_price int;
  v_sku text;
  v_name text;
  v_status text;
  v_subtotal bigint := 0;
  v_discount int := 0;
  v_shipping int;
  v_total int;
  v_order_id uuid;
  v_order_number text;
  v_access_token text;
  v_promo public.promotions%ROWTYPE;
  v_promo_input text;
  v_item record;
BEGIN
  IF p_customer_name IS NULL OR length(trim(p_customer_name)) < 2 THEN
    RAISE EXCEPTION 'الاسم مطلوب';
  END IF;

  IF p_governorate IS NULL OR length(trim(p_governorate)) = 0
    OR p_city IS NULL OR length(trim(p_city)) = 0
    OR p_street IS NULL OR length(trim(p_street)) = 0 THEN
    RAISE EXCEPTION 'عنوان الشحن غير مكتمل';
  END IF;

  IF p_payment_method IS NOT NULL AND btrim(p_payment_method) <> '' AND btrim(p_payment_method) <> 'cod' THEN
    RAISE EXCEPTION 'طريقة الدفع غير مدعومة';
  END IF;

  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة';
  END IF;

  BEGIN
    SELECT COALESCE(jsonb_agg(jsonb_build_object(
      'variant_id', grouped.variant_id,
      'quantity', grouped.quantity
    ) ORDER BY grouped.variant_id), '[]'::jsonb)
    INTO v_requested
    FROM (
      SELECT (elem->>'variant_id')::uuid AS variant_id,
             SUM((elem->>'quantity')::int) AS quantity
      FROM jsonb_array_elements(p_items) AS elem
      GROUP BY 1
    ) AS grouped;
  EXCEPTION
    WHEN invalid_text_representation OR numeric_value_out_of_range THEN
      RAISE EXCEPTION 'منتج غير موجود في السلة';
  END;

  IF v_requested IS NULL OR jsonb_array_length(v_requested) = 0 THEN
    RAISE EXCEPTION 'السلة فارغة';
  END IF;

  FOR v_req IN
    SELECT (elem->>'variant_id')::uuid AS variant_id,
           (elem->>'quantity')::int AS quantity
    FROM jsonb_array_elements(v_requested) AS elem
    ORDER BY 1
  LOOP
    IF v_req.quantity IS NULL OR v_req.quantity < 1 THEN
      RAISE EXCEPTION 'كمية غير صالحة';
    END IF;

    SELECT pv.stock, pv.price_piasters, pv.sku, p.name_ar, p.status
    INTO v_stock, v_price, v_sku, v_name, v_status
    FROM public.product_variants pv
    JOIN public.products p ON p.id = pv.product_id
    WHERE pv.id = v_req.variant_id
    FOR UPDATE OF pv, p;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'منتج غير موجود في السلة';
    END IF;

    IF v_status IS DISTINCT FROM 'active' THEN
      RAISE EXCEPTION 'المنتج غير متاح';
    END IF;

    IF v_stock < v_req.quantity THEN
      RAISE EXCEPTION 'المخزون غير كافٍ لـ %', v_name;
    END IF;

    v_subtotal := v_subtotal + (v_price::bigint * v_req.quantity);
    v_lines := v_lines || jsonb_build_object(
      'variant_id', v_req.variant_id,
      'quantity', v_req.quantity,
      'price', v_price,
      'sku', v_sku,
      'name', v_name
    );
  END LOOP;

  IF v_subtotal > 2147483647 THEN
    RAISE EXCEPTION 'تعذر إتمام الطلب';
  END IF;

  v_promo_input := NULLIF(btrim(COALESCE(p_promo_code, '')), '');
  IF v_promo_input IS NOT NULL THEN
    SELECT * INTO v_promo
    FROM public.promotions
    WHERE upper(code) = upper(v_promo_input)
      AND is_active
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'كود الخصم غير صالح';
    END IF;

    IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
      RAISE EXCEPTION 'انتهت صلاحية كود الخصم';
    END IF;

    IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
      RAISE EXCEPTION 'تم استخدام كود الخصم بالكامل';
    END IF;

    IF v_subtotal < v_promo.min_order_piasters THEN
      RAISE EXCEPTION 'الحد الأدنى للطلب % ج.م', (v_promo.min_order_piasters / 100.0);
    END IF;

    IF v_promo.discount_type = 'percentage' THEN
      v_discount := LEAST(ROUND(v_subtotal * v_promo.discount_value / 100.0)::int, v_subtotal::int);
    ELSE
      v_discount := LEAST(v_promo.discount_value, v_subtotal::int);
    END IF;
  END IF;

  SELECT rate_piasters INTO v_shipping
  FROM public.shipping_rates
  WHERE governorate = btrim(p_governorate);

  IF NOT FOUND THEN
    v_shipping := 10000;
  END IF;

  v_total := GREATEST(0, v_subtotal::int + v_shipping - v_discount);
  v_order_id := gen_random_uuid();
  v_order_number := 'DOLY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))
    || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
  v_access_token := gen_random_uuid()::text;

  INSERT INTO public.orders (
    id,
    order_number,
    access_token,
    status,
    subtotal_piasters,
    shipping_piasters,
    discount_piasters,
    total_piasters,
    payment_method,
    customer_name,
    customer_email,
    customer_phone,
    shipping_address,
    promo_code
  ) VALUES (
    v_order_id,
    v_order_number,
    v_access_token,
    'pending',
    v_subtotal::int,
    v_shipping,
    v_discount,
    v_total,
    'cod',
    btrim(p_customer_name),
    btrim(p_customer_email),
    btrim(p_customer_phone),
    jsonb_strip_nulls(jsonb_build_object(
      'governorate', btrim(p_governorate),
      'city', btrim(p_city),
      'street', btrim(p_street),
      'building', NULLIF(btrim(COALESCE(p_building, '')), ''),
      'floor', NULLIF(btrim(COALESCE(p_floor, '')), '')
    )),
    CASE WHEN v_promo_input IS NULL THEN NULL ELSE v_promo.code END
  );

  INSERT INTO public.order_status_history (order_id, status)
  VALUES (v_order_id, 'pending');

  IF v_promo_input IS NOT NULL THEN
    UPDATE public.promotions
    SET used_count = used_count + 1
    WHERE id = v_promo.id;

    INSERT INTO public.promotion_usages (promotion_id, order_id)
    VALUES (v_promo.id, v_order_id);
  END IF;

  FOR v_item IN
    SELECT *
    FROM jsonb_to_recordset(v_lines) AS x(
      variant_id uuid,
      quantity int,
      price int,
      sku text,
      name text
    )
  LOOP
    INSERT INTO public.order_items (
      order_id,
      variant_id,
      product_name,
      variant_sku,
      unit_price_piasters,
      quantity
    ) VALUES (
      v_order_id,
      v_item.variant_id,
      v_item.name,
      v_item.sku,
      v_item.price,
      v_item.quantity
    );

    UPDATE public.product_variants
    SET stock = stock - v_item.quantity
    WHERE id = v_item.variant_id
      AND stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'المخزون غير كافٍ';
    END IF;

    INSERT INTO public.inventory_movements (variant_id, quantity_change, reason, reference_id)
    VALUES (v_item.variant_id, -v_item.quantity, 'order', v_order_id);
  END LOOP;

  order_id := v_order_id;
  order_number := v_order_number;
  access_token := v_access_token;
  RETURN NEXT;
END;
$$;

NOTIFY pgrst, 'reload schema';
