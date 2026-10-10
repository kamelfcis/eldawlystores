"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { LoadingButton } from "@/components/loading/loading-button";
import { Input } from "@/components/ui/input";
import {
  archiveProduct,
  deleteBanner,
  deleteBrand,
  deleteCategory,
  deleteProduct,
  deletePromotion,
  moveBanner,
  saveBanner,
  saveBrand,
  saveCategory,
  saveProduct,
  savePromotion,
  type FormState,
} from "@/lib/admin/actions";
import { formatMoney, piastersToPounds } from "@/lib/money";
import type { BannerType, ProductStatus } from "@/lib/types/database";
import { ImageUrlField } from "./image-url-field";
import { ConfirmButton, Field, FormNote, initialFormState, selectClass } from "./form-bits";
import { ProductGalleryField, galleryFromImages } from "./product-gallery";

export interface AdminOption {
  id: string;
  label: string;
}

export interface ProductFormValues {
  id: string;
  name_ar: string;
  slug: string;
  description_ar: string | null;
  category_id: string;
  brand_id: string | null;
  status: ProductStatus;
  variantId: string;
  sku: string;
  price_piasters: number;
  compare_at_piasters: number | null;
  stock: number;
  images: Array<{ id: string; url: string; sort_order: number }>;
}

export function ProductForm({
  categories,
  brands,
  product,
  r2Enabled,
  view,
}: {
  categories: AdminOption[];
  brands: AdminOption[];
  product?: ProductFormValues;
  r2Enabled: boolean;
  view: "cards" | "table";
}) {
  const [state, action] = useActionState(saveProduct, initialFormState);
  const queryClient = useQueryClient();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.saved || !formRef.current) return;
    const slugValue = new FormData(formRef.current).get("slug");
    const slug = typeof slugValue === "string" ? slugValue.trim().toLowerCase() : "";
    if (slug) void queryClient.invalidateQueries({ queryKey: ["product", slug] });
    void queryClient.invalidateQueries({ queryKey: ["products"] });
  }, [state, queryClient]);

  return (
    <form ref={formRef} action={action} className="grid gap-3 sm:grid-cols-2">
      {product ? <input type="hidden" name="productId" value={product.id} /> : null}
      {product?.variantId ? <input type="hidden" name="variantId" value={product.variantId} /> : null}
      <input type="hidden" name="view" value={view} />
      <Field label="الاسم">
        <Input name="name_ar" defaultValue={product?.name_ar} required />
      </Field>
      <Field label="الرابط">
        <Input name="slug" defaultValue={product?.slug} placeholder="iphone-16" required />
      </Field>
      <Field label="الوصف">
        <Input name="description_ar" defaultValue={product?.description_ar ?? ""} />
      </Field>
      <Field label="الفئة">
        <select name="category_id" defaultValue={product?.category_id ?? ""} className={selectClass} required>
          <option value="">اختر فئة</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="العلامة">
        <select name="brand_id" defaultValue={product?.brand_id ?? ""} className={selectClass}>
          <option value="">بدون علامة</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="الحالة">
        <select name="status" defaultValue={product?.status ?? "active"} className={selectClass}>
          <option value="active">نشط</option>
          <option value="draft">مسودة</option>
          <option value="archived">مؤرشف</option>
        </select>
      </Field>
      <Field label="SKU">
        <Input name="sku" defaultValue={product?.sku} className="font-mono" required />
      </Field>
      <Field label="السعر (قرش)">
        <Input name="price_piasters" type="number" min={0} step={1} defaultValue={product?.price_piasters ?? 0} required />
      </Field>
      <Field label="سعر المقارنة (قرش)">
        <Input name="compare_at_piasters" type="number" min={0} step={1} defaultValue={product?.compare_at_piasters ?? ""} />
      </Field>
      <Field label="المخزون">
        <Input name="stock" type="number" min={0} step={1} defaultValue={product?.stock ?? 0} required />
      </Field>
      <p className="text-[14px] text-graphite sm:col-span-2">السعر يُحفظ بالقرش. 100 قرش = 1 جنيه.</p>
      <ProductGalleryField initial={galleryFromImages(product?.images ?? [])} r2Enabled={r2Enabled} />
      <div className="flex items-center gap-3 sm:col-span-2">
        <LoadingButton type="submit" pendingLabel={product ? "جارٍ الحفظ" : "جارٍ الإضافة"}>
          {product ? "حفظ التعديل" : "إضافة منتج"}
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function ArchiveProductForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(archiveProduct, initialFormState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="productId" value={productId} />
      <ConfirmButton message="أرشفة هذا المنتج؟" variant="quiet">
        أرشفة
      </ConfirmButton>
      <FormNote state={state} />
    </form>
  );
}

export function DeleteProductForm({ productId }: { productId: string }) {
  const [state, action] = useActionState(deleteProduct, initialFormState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="productId" value={productId} />
      <ConfirmButton message="حذف هذا المنتج؟ إذا كان مرتبطاً بطلبات ستتم أرشفته.">حذف</ConfirmButton>
      <FormNote state={state} />
    </form>
  );
}

export interface CategoryValues {
  id: string;
  name_ar: string;
  slug: string;
  description_ar: string | null;
  image_url?: string | null;
  sort_order: number;
}

export function CategoryForm({ category, r2Enabled }: { category?: CategoryValues; r2Enabled: boolean }) {
  const [state, action] = useActionState(saveCategory, initialFormState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {category ? <input type="hidden" name="id" value={category.id} /> : null}
      <Field label="الاسم">
        <Input name="name_ar" defaultValue={category?.name_ar} required />
      </Field>
      <Field label="الرابط">
        <Input name="slug" defaultValue={category?.slug} placeholder="smartphones" required />
      </Field>
      <Field label="الوصف">
        <Input name="description_ar" defaultValue={category?.description_ar ?? ""} />
      </Field>
      <Field label="الترتيب">
        <Input name="sort_order" type="number" min={0} step={1} defaultValue={category?.sort_order ?? 0} />
      </Field>
      <div className="sm:col-span-2">
        <Field label="صورة الفئة">
          <ImageUrlField
            name="image_url"
            defaultValue={category?.image_url ?? ""}
            r2Enabled={r2Enabled}
            placeholder="https://"
            folder="categories"
            hint="المقاس: 512×512 (1:1)"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <LoadingButton type="submit" pendingLabel={category ? "جارٍ الحفظ" : "جارٍ الإضافة"}>
          {category ? "حفظ الفئة" : "إضافة فئة"}
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function DeleteCategoryForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteCategory, initialFormState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message="حذف هذه الفئة؟">حذف</ConfirmButton>
      <FormNote state={state} />
    </form>
  );
}

export interface BrandValues {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

export function BrandForm({ brand, r2Enabled }: { brand?: BrandValues; r2Enabled: boolean }) {
  const [state, action] = useActionState(saveBrand, initialFormState);
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {brand ? <input type="hidden" name="id" value={brand.id} /> : null}
      <Field label="الاسم">
        <Input name="name" defaultValue={brand?.name} required />
      </Field>
      <Field label="الرابط">
        <Input name="slug" defaultValue={brand?.slug} placeholder="apple" required />
      </Field>
      <div className="sm:col-span-2">
        <Field label="رابط الشعار">
          <ImageUrlField
            name="logo_url"
            defaultValue={brand?.logo_url ?? ""}
            r2Enabled={r2Enabled}
            placeholder="https://"
            folder="brands"
            hint="المقاس: 400×400 بصيغة PNG"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <LoadingButton type="submit" pendingLabel={brand ? "جارٍ الحفظ" : "جارٍ الإضافة"}>
          {brand ? "حفظ العلامة" : "إضافة علامة"}
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function DeleteBrandForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteBrand, initialFormState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message="حذف هذه العلامة؟">حذف</ConfirmButton>
      <FormNote state={state} />
    </form>
  );
}

export interface PromotionValues {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_order_piasters: number;
  max_uses: number | null;
  is_active: boolean;
  expires_at: string | null;
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function poundsInputValue(piasters: number | undefined): string {
  if (piasters == null || piasters === 0) return "";
  return String(piastersToPounds(piasters));
}

export function PromotionForm({ promotion }: { promotion?: PromotionValues }) {
  const [state, action] = useActionState(savePromotion, initialFormState);
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">(promotion?.discount_type ?? "percentage");
  const [percentValue, setPercentValue] = useState(
    promotion?.discount_type === "percentage" ? String(promotion.discount_value) : ""
  );
  const [fixedValue, setFixedValue] = useState(
    promotion?.discount_type === "fixed" ? poundsInputValue(promotion.discount_value) : ""
  );
  const [active, setActive] = useState(promotion?.is_active ?? true);
  const [expiresAt, setExpiresAt] = useState(toLocalInput(promotion?.expires_at ?? null));
  const expiryPast = Boolean(expiresAt && !Number.isNaN(new Date(expiresAt).getTime()) && new Date(expiresAt) < new Date());

  return (
    <div>
      <h2 className="mb-1 text-[14px] font-bold tracking-[0.038em] text-carbon-ink">
        {promotion ? "تعديل العرض" : "عرض جديد"}
      </h2>
      <p className="mb-3 text-[14px] text-graphite">حدد الكود والنوع والحدود. اكتب المبالغ بالجنيه.</p>
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        {promotion ? <input type="hidden" name="id" value={promotion.id} /> : null}
        <Field label="الكود">
          <Input name="code" dir="ltr" lang="en" className="font-mono" defaultValue={promotion?.code} required />
        </Field>
        <Field label="النوع">
          <select
            name="discount_type"
            value={discountType}
            onChange={(event) => setDiscountType(event.target.value === "fixed" ? "fixed" : "percentage")}
            className={selectClass}
          >
            <option value="percentage">نسبة</option>
            <option value="fixed">خصم ثابت (ج.م)</option>
          </select>
        </Field>
        {discountType === "percentage" ? (
          <Field label="القيمة (%)">
            <Input
              name="discount_value"
              dir="ltr"
              lang="en"
              inputMode="numeric"
              value={percentValue}
              onChange={(event) => setPercentValue(event.target.value)}
              required
            />
          </Field>
        ) : (
          <Field label="قيمة الخصم (ج.م)">
            <div className="flex items-center gap-2">
              <Input
                name="discount_value"
                dir="ltr"
                lang="en"
                inputMode="decimal"
                value={fixedValue}
                onChange={(event) => setFixedValue(event.target.value)}
                required
              />
              <span className="shrink-0 text-[14px] text-graphite">ج.م</span>
            </div>
          </Field>
        )}
        <Field label="الحد الأدنى للطلب (ج.م)">
          <div className="flex items-center gap-2">
            <Input
              name="min_order_pounds"
              dir="ltr"
              lang="en"
              inputMode="decimal"
              defaultValue={poundsInputValue(promotion?.min_order_piasters)}
            />
            <span className="shrink-0 text-[14px] text-graphite">ج.م</span>
          </div>
        </Field>
        <Field label="الحد الأقصى للاستخدام">
          <Input name="max_uses" dir="ltr" lang="en" inputMode="numeric" defaultValue={promotion?.max_uses ?? ""} placeholder="بدون حد" />
        </Field>
        <Field label="ينتهي في">
          <Input
            name="expires_at"
            type="datetime-local"
            dir="ltr"
            lang="en"
            value={expiresAt}
            onChange={(event) => setExpiresAt(event.target.value)}
          />
          {expiryPast ? <span className="block text-[12px] text-graphite">هذا التاريخ في الماضي. العرض سيظهر كمنتهٍ.</span> : null}
        </Field>
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <span
            className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[12px] ${
              active
                ? "border-carbon-ink bg-carbon-ink text-paper-white"
                : "border-ash-border bg-paper-white text-graphite"
            }`}
          >
            {active ? "مفعّل" : "معطّل"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="تفعيل العرض"
            title={active ? "إيقاف العرض" : "تفعيل العرض"}
            className={`inline-flex h-10 min-h-10 w-12 shrink-0 items-center rounded-full border px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink ${
              active ? "justify-end border-carbon-ink bg-carbon-ink" : "justify-start border-ash-border bg-fog"
            }`}
            onClick={() => setActive((current) => !current)}
          >
            <span className="sr-only">{active ? "إيقاف العرض" : "تفعيل العرض"}</span>
            <span className="block size-7 rounded-full bg-paper-white" />
          </button>
          <input type="hidden" name="is_active" value={active ? "true" : "false"} />
        </div>
        <div className="flex items-center gap-3 sm:col-span-2">
          <LoadingButton type="submit" className="h-10" pendingLabel={promotion ? "جارٍ الحفظ" : "جارٍ الإضافة"}>
            {promotion ? "حفظ العرض" : "إضافة عرض"}
          </LoadingButton>
          <FormNote state={state} />
        </div>
      </form>
    </div>
  );
}

export function DeletePromotionForm({ id }: { id: string }) {
  const [state, action] = useActionState(deletePromotion, initialFormState);
  return (
    <form action={action} className="space-y-1">
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message="حذف هذا العرض؟ إذا كان مستخدماً سيتم تعطيله.">حذف</ConfirmButton>
      <FormNote state={state} />
    </form>
  );
}

function savedBannerMessage(type: BannerType) {
  if (type === "hero") return "تم حفظ الشريحة";
  if (type === "announcement") return "تم حفظ الرسالة";
  return "تم حفظ العرض";
}

function useBannerToast(state: FormState, successMessage: string, closeHash?: string) {
  const seen = useRef(state);
  const router = useRouter();

  useEffect(() => {
    if (seen.current === state) return;
    seen.current = state;
    if (state.error) {
      toast.error(state.error);
      return;
    }
    if (!state.saved) return;
    toast.success(successMessage);
    if (closeHash) router.replace(`/admin/homepage#${closeHash}`);
  }, [closeHash, router, state, successMessage]);
}

export interface BannerFormValues {
  id: string;
  title_ar: string;
  subtitle_ar?: string | null;
  link_url: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  type: BannerType;
}

export function BannerForm({
  banner,
  r2Enabled,
  bannerType,
}: {
  banner?: BannerFormValues;
  r2Enabled: boolean;
  bannerType: BannerType;
}) {
  const [state, action] = useActionState(saveBanner, initialFormState);
  const type = banner?.type ?? bannerType;
  useBannerToast(state, savedBannerMessage(type), type);
  const imageLabel = type === "hero" ? "صورة الغلاف" : type === "announcement" ? "صورة اختيارية" : "رابط الصورة";
  const imageHint =
    type === "hero"
      ? "المقاس: 1600×900 لشرائح الوسط"
      : type === "offer"
        ? "المقاس: 800×1000 للبطاقة اليسرى والبطاقة اليمنى"
        : "اختياري. ارتفاع الصورة 36px داخل شريط 48px، object-contain. ارفع حوالي 144×144 أو شعار قصير حوالي 240×96";
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {banner ? <input type="hidden" name="id" value={banner.id} /> : null}
      <input type="hidden" name="type" value={type} />
      <Field label="العنوان">
        <Input name="title_ar" defaultValue={banner?.title_ar} required />
      </Field>
      <Field label="العنوان الفرعي">
        <Input name="subtitle_ar" defaultValue={banner?.subtitle_ar ?? ""} />
      </Field>
      <Field label="رابط الوجهة">
        <Input name="link_url" defaultValue={banner?.link_url ?? ""} placeholder="/products" />
      </Field>
      <Field label="الترتيب">
        <Input name="sort_order" type="number" min={0} step={1} defaultValue={banner?.sort_order ?? 0} />
      </Field>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" name="is_active" defaultChecked={banner?.is_active ?? true} />
        نشط
      </label>
      <div className="sm:col-span-2">
        <Field label={imageLabel}>
          <ImageUrlField
            name="image_url"
            defaultValue={banner?.image_url ?? ""}
            r2Enabled={r2Enabled}
            placeholder="https://"
            folder="banners"
            hint={imageHint}
          />
        </Field>
      </div>
      <div className="flex items-center gap-3 sm:col-span-2">
        <LoadingButton type="submit" pendingLabel={banner ? "جارٍ الحفظ" : "جارٍ الإضافة"}>
          {banner ? "حفظ البانر" : "إضافة بانر"}
        </LoadingButton>
        {state.error ? <p className="text-[14px] text-carbon-ink">{state.error}</p> : null}
      </div>
    </form>
  );
}

export function MoveBannerForm({ id, direction, disabled }: { id: string; direction: "up" | "down"; disabled?: boolean }) {
  const [state, action] = useActionState(moveBanner, initialFormState);
  useBannerToast(state, "تم تحديث الترتيب");
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="direction" value={direction} />
      <LoadingButton type="submit" variant="outline" disabled={disabled} pendingLabel="جارٍ النقل">
        {direction === "up" ? "أعلى" : "أسفل"}
      </LoadingButton>
    </form>
  );
}

export function DeleteBannerForm({ id }: { id: string }) {
  const [state, action] = useActionState(deleteBanner, initialFormState);
  useBannerToast(state, "تم الحذف");
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton message="حذف هذا البانر؟ لن تُحذف المنتجات.">حذف</ConfirmButton>
    </form>
  );
}

export function moneyBeside(piasters: number): string {
  return formatMoney(piasters);
}
