-- Seed catalog: categories, brands, products, variants, images, and homepage banners.
-- Idempotent: conflict targets are slug, sku, or id so a second run does not duplicate rows.

INSERT INTO public.categories (name_ar, slug, description_ar, sort_order)
VALUES
  ('موبايلات', 'mobiles', 'هواتف ذكية', 1),
  ('تابلت', 'tablets', 'أجهزة تابلت', 2),
  ('لابتوب', 'laptops', 'أجهزة لابتوب', 3),
  ('سماعات', 'headphones', 'سماعات لاسلكية وسلكية', 4),
  ('إكسسوارات', 'accessories', 'شواحن وكابلات وإكسسوارات', 5)
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  description_ar = EXCLUDED.description_ar,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.brands (name, slug)
VALUES
  ('Apple', 'apple'),
  ('Samsung', 'samsung'),
  ('Xiaomi', 'xiaomi')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name;

INSERT INTO public.products (name_ar, slug, description_ar, category_id, brand_id, status, rating)
SELECT v.name_ar, v.slug, v.description_ar, c.id, b.id, 'active', v.rating::numeric
FROM (
  VALUES
    ('آيفون 15', 'iphone-15', 'هاتف آيفون 15 بشاشة سوبر ريتينا', 'mobiles', 'apple', '4.6'),
    ('آيباد إير', 'ipad-air', 'تابلت آيباد إير خفيف للعمل والدراسة', 'tablets', 'apple', '4.7'),
    ('ماك بوك إير', 'macbook-air', 'لابتوب ماك بوك إير بمعالج أبل', 'laptops', 'apple', '4.8'),
    ('إيربودز برو', 'airpods-pro', 'سماعات إيربودز برو مع إلغاء الضوضاء', 'headphones', 'apple', '4.5'),
    ('جالاكسي إس 24', 'galaxy-s24', 'هاتف سامسونج جالاكسي إس 24', 'mobiles', 'samsung', '4.6'),
    ('شاومي 14', 'xiaomi-14', 'هاتف شاومي 14 بشحن سريع', 'mobiles', 'xiaomi', '4.4'),
    ('شاحن سامسونج 25 واط', 'samsung-charger-25w', 'شاحن سامسونج سريع 25 واط', 'accessories', 'samsung', '4.2')
) AS v(name_ar, slug, description_ar, category_slug, brand_slug, rating)
JOIN public.categories c ON c.slug = v.category_slug
JOIN public.brands b ON b.slug = v.brand_slug
ON CONFLICT (slug) DO UPDATE SET
  name_ar = EXCLUDED.name_ar,
  description_ar = EXCLUDED.description_ar,
  category_id = EXCLUDED.category_id,
  brand_id = EXCLUDED.brand_id,
  status = EXCLUDED.status,
  rating = EXCLUDED.rating,
  updated_at = now();

INSERT INTO public.product_variants (product_id, sku, price_piasters, compare_at_piasters, stock, is_default)
SELECT p.id, v.sku, v.price_piasters, v.compare_at_piasters, v.stock, true
FROM (
  VALUES
    ('iphone-15', 'IP15-128', 4599900, 4999900, 10),
    ('ipad-air', 'IPAD-AIR-128', 3299900, 3599900, 6),
    ('macbook-air', 'MBA-13-256', 5499900, 5999900, 4),
    ('airpods-pro', 'AIRPODS-PRO', 1099900, 1299900, 0),
    ('galaxy-s24', 'GS24-256', 3899900, 4299900, 8),
    ('xiaomi-14', 'X14-256', 2199900, 2499900, 15),
    ('samsung-charger-25w', 'SCHG-25W', 49900, 69900, 40)
) AS v(slug, sku, price_piasters, compare_at_piasters, stock)
JOIN public.products p ON p.slug = v.slug
ON CONFLICT (sku) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  price_piasters = EXCLUDED.price_piasters,
  compare_at_piasters = EXCLUDED.compare_at_piasters,
  stock = EXCLUDED.stock,
  is_default = EXCLUDED.is_default;

INSERT INTO public.product_images (id, product_id, url, alt_text, sort_order)
SELECT v.id, p.id, '/placeholder-product.svg', p.name_ar, 0
FROM (
  VALUES
    ('a1000000-0000-4000-8000-000000000001'::uuid, 'iphone-15'),
    ('a1000000-0000-4000-8000-000000000002'::uuid, 'ipad-air'),
    ('a1000000-0000-4000-8000-000000000003'::uuid, 'macbook-air'),
    ('a1000000-0000-4000-8000-000000000004'::uuid, 'airpods-pro'),
    ('a1000000-0000-4000-8000-000000000005'::uuid, 'galaxy-s24'),
    ('a1000000-0000-4000-8000-000000000006'::uuid, 'xiaomi-14'),
    ('a1000000-0000-4000-8000-000000000007'::uuid, 'samsung-charger-25w')
) AS v(id, slug)
JOIN public.products p ON p.slug = v.slug
ON CONFLICT (id) DO UPDATE SET
  product_id = EXCLUDED.product_id,
  url = EXCLUDED.url,
  alt_text = EXCLUDED.alt_text,
  sort_order = EXCLUDED.sort_order;

INSERT INTO public.homepage_banners (id, title_ar, subtitle_ar, image_url, link_url, sort_order, is_active)
VALUES
  ('b1000000-0000-4000-8000-000000000001', 'عروض الموبايلات', 'تسوق آيفون 15 بأفضل سعر', '/placeholder-banner.svg', '/products/iphone-15', 0, true),
  ('b1000000-0000-4000-8000-000000000002', 'تابلت آيباد', 'آيباد إير جاهز للطلب', '/placeholder-banner.svg', '/products/ipad-air', 1, true),
  ('b1000000-0000-4000-8000-000000000003', 'لابتوب للعمل والدراسة', 'ماك بوك إير خفيف وسريع', '/placeholder-banner.svg', '/products/macbook-air', 2, true),
  ('b1000000-0000-4000-8000-000000000004', 'إكسسوارات أصلية', 'شواحن وكابلات بضمان', '/placeholder-banner.svg', '/categories/accessories', 3, true)
ON CONFLICT (id) DO UPDATE SET
  title_ar = EXCLUDED.title_ar,
  subtitle_ar = EXCLUDED.subtitle_ar,
  image_url = EXCLUDED.image_url,
  link_url = EXCLUDED.link_url,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active;
