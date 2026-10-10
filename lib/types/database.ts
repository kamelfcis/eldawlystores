export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled" | "rejected";
export type ProductStatus = "draft" | "active" | "archived";
export type UserRole = "customer" | "admin";
export type BannerType = "announcement" | "hero" | "offer";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          full_name?: string | null;
          phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [],
      };
      user_roles: {
        Row: { user_id: string; role: UserRole; created_at: string };
        Insert: { user_id: string; role: UserRole };
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Row"]>;
        Relationships: [],
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          description_ar: string | null;
          image_url: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]> & { name_ar: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Relationships: [],
      };
      brands: {
        Row: { id: string; name: string; slug: string; logo_url: string | null; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["brands"]["Row"]> & { name: string; slug: string };
        Update: Partial<Database["public"]["Tables"]["brands"]["Row"]>;
        Relationships: [],
      };
      products: {
        Row: {
          id: string;
          name_ar: string;
          slug: string;
          description_ar: string | null;
          category_id: string;
          brand_id: string | null;
          status: ProductStatus;
          rating: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]> & { name_ar: string; slug: string; category_id: string };
        Update: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_variants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_images_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "product_images";
            referencedColumns: ["id"];
          },
        ];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          sku: string;
          price_piasters: number;
          compare_at_piasters: number | null;
          cost_price_piasters: number | null;
          stock: number;
          is_default: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["product_variants"]["Row"]> & { product_id: string; sku: string; price_piasters: number };
        Update: Partial<Database["public"]["Tables"]["product_variants"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      product_images: {
        Row: { id: string; product_id: string; url: string; alt_text: string | null; sort_order: number };
        Insert: Partial<Database["public"]["Tables"]["product_images"]["Row"]> & { product_id: string; url: string };
        Update: Partial<Database["public"]["Tables"]["product_images"]["Row"]>;
        Relationships: [],
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          order_number: string;
          access_token: string;
          status: OrderStatus;
          subtotal_piasters: number;
          shipping_piasters: number;
          discount_piasters: number;
          total_piasters: number;
          payment_method: string;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
          promo_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]> & {
          order_number: string;
          access_token: string;
          subtotal_piasters: number;
          shipping_piasters: number;
          discount_piasters: number;
          total_piasters: number;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          shipping_address: Json;
        };
        Update: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "order_items";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_sku: string;
          unit_price_piasters: number;
          quantity: number;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]> & {
          order_id: string;
          variant_id: string;
          product_name: string;
          variant_sku: string;
          unit_price_piasters: number;
          quantity: number;
        };
        Update: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Relationships: [],
      };
      order_status_history: {
        Row: { id: string; order_id: string; status: OrderStatus; note: string | null; created_at: string; changed_by: string | null };
        Insert: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]> & { order_id: string; status: OrderStatus };
        Update: Partial<Database["public"]["Tables"]["order_status_history"]["Row"]>;
        Relationships: [],
      };
      addresses: {
        Row: {
          id: string;
          user_id: string;
          label: string;
          governorate: string;
          city: string;
          area: string;
          street: string;
          building: string | null;
          floor: string | null;
          phone: string;
          is_default: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          label?: string;
          governorate: string;
          city: string;
          area?: string;
          street: string;
          building?: string | null;
          floor?: string | null;
          phone?: string;
          is_default?: boolean;
          created_at?: string;
        };
        Update: {
          label?: string;
          governorate?: string;
          city?: string;
          area?: string;
          street?: string;
          building?: string | null;
          floor?: string | null;
          phone?: string;
          is_default?: boolean;
        };
        Relationships: [],
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          min_order_piasters: number;
          max_uses: number | null;
          used_count: number;
          is_active: boolean;
          expires_at: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["promotions"]["Row"]> & { code: string; discount_type: "percentage" | "fixed"; discount_value: number };
        Update: Partial<Database["public"]["Tables"]["promotions"]["Row"]>;
        Relationships: [],
      };
      homepage_banners: {
        Row: { id: string; title_ar: string; subtitle_ar: string | null; image_url: string | null; link_url: string | null; sort_order: number; is_active: boolean; type: BannerType };
        Insert: Partial<Database["public"]["Tables"]["homepage_banners"]["Row"]> & { title_ar: string };
        Update: Partial<Database["public"]["Tables"]["homepage_banners"]["Row"]>;
        Relationships: [],
      };
      shipping_rates: {
        Row: { id: string; governorate: string; rate_piasters: number };
        Insert: Partial<Database["public"]["Tables"]["shipping_rates"]["Row"]> & { governorate: string; rate_piasters: number };
        Update: Partial<Database["public"]["Tables"]["shipping_rates"]["Row"]>;
        Relationships: [],
      };
      settings: {
        Row: { key: string; value: Json; updated_at: string };
        Insert: { key: string; value: Json };
        Update: Partial<Database["public"]["Tables"]["settings"]["Row"]>;
        Relationships: [],
      };
      carts: {
        Row: { id: string; user_id: string | null; session_id: string | null; created_at: string; updated_at: string };
        Insert: Partial<Database["public"]["Tables"]["carts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["carts"]["Row"]>;
        Relationships: [],
      };
      cart_items: {
        Row: { id: string; cart_id: string; variant_id: string; quantity: number; created_at: string };
        Insert: Partial<Database["public"]["Tables"]["cart_items"]["Row"]> & { cart_id: string; variant_id: string; quantity: number };
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Row"]>;
        Relationships: [],
      };
    };
    Views: {};
    Functions: {
      create_checkout_order: {
        Args: {
          p_customer_name: string;
          p_customer_email: string;
          p_customer_phone: string;
          p_governorate: string;
          p_city: string;
          p_street: string;
          p_building: string | null;
          p_floor: string | null;
          p_promo_code: string | null;
          p_payment_method: string;
          p_items: Json;
          p_user_id?: string | null;
        };
        Returns: {
          order_id: string;
          order_number: string;
          access_token: string;
        }[];
      };
      link_guest_orders_to_user: {
        Args: Record<string, never>;
        Returns: number;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Product = Database["public"]["Tables"]["products"]["Row"];
export type ProductVariant = Database["public"]["Tables"]["product_variants"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Brand = Database["public"]["Tables"]["brands"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];

export interface ProductWithDetails extends Product {
  brand: Brand | null;
  category: Category;
  variants: ProductVariant[];
  images: Database["public"]["Tables"]["product_images"]["Row"][];
  defaultVariant: ProductVariant;
}
