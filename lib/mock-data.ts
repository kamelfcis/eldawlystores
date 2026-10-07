import type { Brand, Category, ProductWithDetails } from "@/lib/types/database";

export const mockCategories: Category[] = [
  { id: "cat-1", name_ar: "هواتف ذكية", slug: "smartphones", description_ar: "أحدث الهواتف الذكية", image_url: null, sort_order: 1, created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name_ar: "لابتوب", slug: "laptops", description_ar: "أجهزة لابتوب للعمل والألعاب", image_url: null, sort_order: 2, created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-3", name_ar: "سماعات", slug: "headphones", description_ar: "سماعات لاسلكية وسلكية", image_url: null, sort_order: 3, created_at: "2026-01-01T00:00:00Z" },
  { id: "cat-4", name_ar: "إكسسوارات", slug: "accessories", description_ar: "كفرات وشواحن وكابلات", image_url: null, sort_order: 4, created_at: "2026-01-01T00:00:00Z" },
];

export const mockBrands: Brand[] = [
  { id: "brand-1", name: "Apple", slug: "apple", logo_url: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "brand-2", name: "Samsung", slug: "samsung", logo_url: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "brand-3", name: "Xiaomi", slug: "xiaomi", logo_url: null, created_at: "2026-01-01T00:00:00Z" },
];

export const mockProducts: ProductWithDetails[] = [
  {
    id: "prod-1", name_ar: "iPhone 16 Pro", slug: "iphone-16-pro", description_ar: "أحدث iPhone مع شريحة A18 Pro",
    category_id: "cat-1", brand_id: "brand-1", status: "active", rating: 4.8,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[0], category: mockCategories[0],
    variants: [
      { id: "var-1", product_id: "prod-1", sku: "IP16P-256-BK", price_piasters: 6499900, compare_at_piasters: 6999900, cost_price_piasters: null, stock: 12, is_default: true, created_at: "2026-01-01T00:00:00Z" },
      { id: "var-2", product_id: "prod-1", sku: "IP16P-512-BK", price_piasters: 7499900, compare_at_piasters: 7999900, cost_price_piasters: null, stock: 5, is_default: false, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-1", product_id: "prod-1", url: "/placeholder-product.svg", alt_text: "iPhone 16 Pro", sort_order: 0 }],
    defaultVariant: { id: "var-1", product_id: "prod-1", sku: "IP16P-256-BK", price_piasters: 6499900, compare_at_piasters: 6999900, cost_price_piasters: null, stock: 12, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
  {
    id: "prod-2", name_ar: "Samsung Galaxy S25 Ultra", slug: "samsung-galaxy-s25-ultra", description_ar: "أقوى هاتف Samsung مع S Pen",
    category_id: "cat-1", brand_id: "brand-2", status: "active", rating: 4.7,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[1], category: mockCategories[0],
    variants: [
      { id: "var-3", product_id: "prod-2", sku: "SGS25U-256", price_piasters: 5499900, compare_at_piasters: 5999900, cost_price_piasters: null, stock: 8, is_default: true, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-2", product_id: "prod-2", url: "/placeholder-product.svg", alt_text: "Galaxy S25 Ultra", sort_order: 0 }],
    defaultVariant: { id: "var-3", product_id: "prod-2", sku: "SGS25U-256", price_piasters: 5499900, compare_at_piasters: 5999900, cost_price_piasters: null, stock: 8, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
  {
    id: "prod-3", name_ar: "MacBook Air M4", slug: "macbook-air-m4", description_ar: "لابتوب خفيف بمعالج M4",
    category_id: "cat-2", brand_id: "brand-1", status: "active", rating: 4.9,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[0], category: mockCategories[1],
    variants: [
      { id: "var-4", product_id: "prod-3", sku: "MBA-M4-256", price_piasters: 4999900, compare_at_piasters: null, cost_price_piasters: null, stock: 3, is_default: true, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-3", product_id: "prod-3", url: "/placeholder-product.svg", alt_text: "MacBook Air M4", sort_order: 0 }],
    defaultVariant: { id: "var-4", product_id: "prod-3", sku: "MBA-M4-256", price_piasters: 4999900, compare_at_piasters: null, cost_price_piasters: null, stock: 3, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
  {
    id: "prod-4", name_ar: "AirPods Pro 3", slug: "airpods-pro-3", description_ar: "سماعات Apple مع إلغاء الضوضاء",
    category_id: "cat-3", brand_id: "brand-1", status: "active", rating: 4.6,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[0], category: mockCategories[2],
    variants: [
      { id: "var-5", product_id: "prod-4", sku: "APP3-WHT", price_piasters: 999900, compare_at_piasters: 1199900, cost_price_piasters: null, stock: 20, is_default: true, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-4", product_id: "prod-4", url: "/placeholder-product.svg", alt_text: "AirPods Pro 3", sort_order: 0 }],
    defaultVariant: { id: "var-5", product_id: "prod-4", sku: "APP3-WHT", price_piasters: 999900, compare_at_piasters: 1199900, cost_price_piasters: null, stock: 20, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
  {
    id: "prod-5", name_ar: "Xiaomi Redmi Note 14", slug: "xiaomi-redmi-note-14", description_ar: "هاتف اقتصادي بمواصفات ممتازة",
    category_id: "cat-1", brand_id: "brand-3", status: "active", rating: 4.3,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[2], category: mockCategories[0],
    variants: [
      { id: "var-6", product_id: "prod-5", sku: "RN14-128", price_piasters: 899900, compare_at_piasters: 999900, cost_price_piasters: null, stock: 25, is_default: true, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-5", product_id: "prod-5", url: "/placeholder-product.svg", alt_text: "Redmi Note 14", sort_order: 0 }],
    defaultVariant: { id: "var-6", product_id: "prod-5", sku: "RN14-128", price_piasters: 899900, compare_at_piasters: 999900, cost_price_piasters: null, stock: 25, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
  {
    id: "prod-6", name_ar: "شاحن MagSafe 25W", slug: "magsafe-charger-25w", description_ar: "شاحن لاسلكي سريع متوافق مع iPhone",
    category_id: "cat-4", brand_id: "brand-1", status: "active", rating: 4.5,
    created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z",
    brand: mockBrands[0], category: mockCategories[3],
    variants: [
      { id: "var-7", product_id: "prod-6", sku: "MS25W", price_piasters: 199900, compare_at_piasters: null, cost_price_piasters: null, stock: 50, is_default: true, created_at: "2026-01-01T00:00:00Z" },
    ],
    images: [{ id: "img-6", product_id: "prod-6", url: "/placeholder-product.svg", alt_text: "MagSafe Charger", sort_order: 0 }],
    defaultVariant: { id: "var-7", product_id: "prod-6", sku: "MS25W", price_piasters: 199900, compare_at_piasters: null, cost_price_piasters: null, stock: 50, is_default: true, created_at: "2026-01-01T00:00:00Z" },
  },
];

export const mockBanners = [
  { id: "banner-0", title_ar: "شحن مجاني للطلبات فوق 5,000 ج.م — دفع عند الاستلام", subtitle_ar: null, image_url: null, link_url: "/products", sort_order: 0, is_active: true, type: "announcement" as const },
  { id: "banner-0b", title_ar: "ضمان أصلي على كل الأجهزة", subtitle_ar: null, image_url: null, link_url: null, sort_order: 1, is_active: true, type: "announcement" as const },
  { id: "banner-0c", title_ar: "تقسيط واستلام فوري من الفروع", subtitle_ar: null, image_url: null, link_url: null, sort_order: 2, is_active: true, type: "announcement" as const },
  { id: "banner-1", title_ar: "عروض الربيع", subtitle_ar: "خصومات حتى 20% على الهواتف", image_url: "/placeholder-banner.svg", link_url: "/categories/smartphones", sort_order: 0, is_active: true, type: "hero" as const },
  { id: "banner-2", title_ar: "MacBook Air M4", subtitle_ar: "الجديد وصل — اطلب الآن", image_url: "/placeholder-banner.svg", link_url: "/products/macbook-air-m4", sort_order: 1, is_active: true, type: "offer" as const },
];

export const mockShippingRates = [
  { id: "ship-1", governorate: "القاهرة", rate_piasters: 5000 },
  { id: "ship-2", governorate: "الجيزة", rate_piasters: 5000 },
  { id: "ship-3", governorate: "الإسكندرية", rate_piasters: 7000 },
  { id: "ship-4", governorate: "المنصورة", rate_piasters: 8000 },
];

export const mockPromotions = [
  { id: "promo-1", code: "DOLY10", discount_type: "percentage" as const, discount_value: 10, min_order_piasters: 100000, max_uses: 100, used_count: 5, is_active: true, expires_at: "2026-12-31T23:59:59Z", created_at: "2026-01-01T00:00:00Z" },
];
