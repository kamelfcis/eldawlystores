-- Doly Stores initial schema
-- Apply with: supabase db push (requires .env.local credentials)

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Private schema for admin checks
CREATE SCHEMA IF NOT EXISTS private;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles (locked, not user_metadata)
CREATE TABLE public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  image_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Brands
CREATE TABLE public.brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Products
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description_ar TEXT,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  brand_id UUID REFERENCES public.brands(id),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  rating NUMERIC(2,1),
  search_vector TSVECTOR,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product variants
CREATE TABLE public.product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  price_piasters INT NOT NULL CHECK (price_piasters >= 0),
  compare_at_piasters INT CHECK (compare_at_piasters >= 0),
  cost_price_piasters INT CHECK (cost_price_piasters >= 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Product images
CREATE TABLE public.product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INT NOT NULL DEFAULT 0
);

-- Attribute definitions (category-scoped)
CREATE TABLE public.attribute_definitions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  name_ar TEXT NOT NULL,
  slug TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  UNIQUE(category_id, slug)
);

-- Variant attribute values
CREATE TABLE public.variant_attribute_values (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  attribute_id UUID NOT NULL REFERENCES public.attribute_definitions(id) ON DELETE CASCADE,
  value_ar TEXT NOT NULL,
  UNIQUE(variant_id, attribute_id)
);

-- Inventory movements audit
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  quantity_change INT NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Carts
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (user_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(cart_id, variant_id)
);

-- Addresses
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'المنزل',
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  building TEXT,
  floor TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Promotions
CREATE TABLE public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value INT NOT NULL CHECK (discount_value > 0),
  min_order_piasters INT NOT NULL DEFAULT 0,
  max_uses INT,
  used_count INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.promotion_usages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID NOT NULL REFERENCES public.promotions(id),
  order_id UUID,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Orders
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  order_number TEXT NOT NULL UNIQUE,
  access_token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'rejected')),
  subtotal_piasters INT NOT NULL,
  shipping_piasters INT NOT NULL DEFAULT 0,
  discount_piasters INT NOT NULL DEFAULT 0,
  total_piasters INT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cod',
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  promo_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES public.product_variants(id),
  product_name TEXT NOT NULL,
  variant_sku TEXT NOT NULL,
  unit_price_piasters INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0)
);

CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  note TEXT,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Homepage banners
CREATE TABLE public.homepage_banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title_ar TEXT NOT NULL,
  subtitle_ar TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Shipping rates
CREATE TABLE public.shipping_rates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  governorate TEXT NOT NULL UNIQUE,
  rate_piasters INT NOT NULL CHECK (rate_piasters >= 0)
);

-- Settings
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_products_category_status ON public.products(category_id, status);
CREATE INDEX idx_products_brand ON public.products(brand_id);
CREATE INDEX idx_products_search ON public.products USING GIN(search_vector);
CREATE INDEX idx_orders_status_created ON public.orders(status, created_at DESC);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_access_token ON public.orders(access_token);
CREATE INDEX idx_variant_attributes ON public.variant_attribute_values(attribute_id, value_ar);
CREATE INDEX idx_cart_items_cart ON public.cart_items(cart_id);

-- Search vector trigger
CREATE OR REPLACE FUNCTION public.products_search_vector_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('arabic', coalesce(NEW.name_ar, '') || ' ' || coalesce(NEW.description_ar, ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_search_update
  BEFORE INSERT OR UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.products_search_vector_update();

-- Auth trigger: create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name');
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attribute_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_attribute_values ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_usages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.homepage_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: own row
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (auth.uid() = id OR private.is_admin());
CREATE POLICY profiles_update ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles: read own, admin manages
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT USING (auth.uid() = user_id OR private.is_admin());

-- Public catalog reads
CREATE POLICY categories_public ON public.categories FOR SELECT USING (true);
CREATE POLICY brands_public ON public.brands FOR SELECT USING (true);
CREATE POLICY products_public ON public.products FOR SELECT USING (status = 'active' OR private.is_admin());
CREATE POLICY product_images_public ON public.product_images FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.status = 'active' OR private.is_admin()))
);

-- Variants: public read excludes cost_price via view; direct table grants cost to admin only
CREATE POLICY variants_public ON public.product_variants FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.products p WHERE p.id = product_id AND (p.status = 'active' OR private.is_admin()))
);

CREATE POLICY attributes_public ON public.attribute_definitions FOR SELECT USING (true);
CREATE POLICY variant_attrs_public ON public.variant_attribute_values FOR SELECT USING (true);
CREATE POLICY banners_public ON public.homepage_banners FOR SELECT USING (is_active = true OR private.is_admin());
CREATE POLICY shipping_public ON public.shipping_rates FOR SELECT USING (true);
CREATE POLICY promotions_public ON public.promotions FOR SELECT USING (is_active = true OR private.is_admin());

-- Carts: own cart
CREATE POLICY carts_own ON public.carts FOR ALL USING (auth.uid() = user_id OR private.is_admin());
CREATE POLICY cart_items_own ON public.cart_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_id AND (c.user_id = auth.uid() OR private.is_admin()))
);

-- Addresses: own
CREATE POLICY addresses_own ON public.addresses FOR ALL USING (auth.uid() = user_id OR private.is_admin());

-- Orders: own orders or guest via service role; no anon insert
CREATE POLICY orders_select ON public.orders FOR SELECT USING (
  auth.uid() = user_id OR private.is_admin()
);
CREATE POLICY order_items_select ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR private.is_admin()))
);
CREATE POLICY order_history_select ON public.order_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.user_id = auth.uid() OR private.is_admin()))
);

-- Admin write policies
CREATE POLICY admin_products ON public.products FOR ALL USING (private.is_admin());
CREATE POLICY admin_variants ON public.product_variants FOR ALL USING (private.is_admin());
CREATE POLICY admin_categories ON public.categories FOR ALL USING (private.is_admin());
CREATE POLICY admin_brands ON public.brands FOR ALL USING (private.is_admin());
CREATE POLICY admin_banners ON public.homepage_banners FOR ALL USING (private.is_admin());
CREATE POLICY admin_promotions ON public.promotions FOR ALL USING (private.is_admin());
CREATE POLICY admin_shipping ON public.shipping_rates FOR ALL USING (private.is_admin());
CREATE POLICY admin_settings ON public.settings FOR ALL USING (private.is_admin());
CREATE POLICY admin_inventory ON public.inventory_movements FOR ALL USING (private.is_admin());
CREATE POLICY admin_orders ON public.orders FOR ALL USING (private.is_admin());
CREATE POLICY admin_order_items ON public.order_items FOR ALL USING (private.is_admin());
CREATE POLICY admin_order_history ON public.order_status_history FOR ALL USING (private.is_admin());

-- Revoke cost_price from anon/authenticated via column-level (Postgres 15+)
REVOKE ALL ON public.product_variants FROM anon, authenticated;
GRANT SELECT (id, product_id, sku, price_piasters, compare_at_piasters, stock, is_default, created_at) ON public.product_variants TO anon, authenticated;
GRANT ALL ON public.product_variants TO service_role;

-- Realtime publication for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
