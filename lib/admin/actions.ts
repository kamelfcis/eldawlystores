"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { arabicDbError } from "@/lib/admin/errors";
import {
  ADMIN_NOTIFICATION_EMAILS_KEY,
  validateAdminNotificationEmails,
} from "@/lib/admin/notification-emails";
import { assertAdmin } from "@/lib/auth";
import { updateAdminOrderStatus } from "@/lib/orders";
import { createClient } from "@/lib/supabase/server";
import { serializeStorefrontBranding, STOREFRONT_BRANDING_KEY } from "@/lib/store-branding";
import { normalizeEgyptianMobile } from "@/lib/store-settings";
import type { BannerType, Json, OrderStatus, ProductStatus } from "@/lib/types/database";

export type FormState = { error: string | null; saved: boolean; notice: string | null };

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isProductStatus(value: string): value is ProductStatus {
  return value === "draft" || value === "active" || value === "archived";
}

function isBannerType(value: string): value is BannerType {
  return value === "announcement" || value === "hero" || value === "offer";
}

function isOrderStatus(value: string): value is OrderStatus {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "shipped" ||
    value === "delivered" ||
    value === "cancelled" ||
    value === "rejected"
  );
}

function readInt(value: string): number | null {
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) return null;
  return parsed;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function isSlug(value: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function dbMessage(error: { code?: string; message?: string } | null | undefined): string {
  return arabicDbError(error) ?? "تعذر الحفظ";
}

function revalidateCatalog() {
  revalidatePath("/", "layout");
  revalidatePath("/products");
  revalidatePath("/admin");
  revalidatePath("/admin/products");
  revalidatePath("/admin/categories");
  revalidatePath("/admin/brands");
  revalidatePath("/admin/homepage");
  revalidatePath("/admin/promotions");
  revalidatePath("/admin/orders");
  revalidatePath("/admin/settings");
  revalidatePath("/checkout");
}

function revalidateStorefront() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/homepage");
}

async function adminClient() {
  await assertAdmin();
  return createClient();
}

interface GalleryImage {
  id: string;
  url: string;
  sortOrder: number;
}

function readGallery(formData: FormData): { images: GalleryImage[] } | { error: string } {
  const raw = readString(formData, "images_json");
  if (!raw) return { error: "أضف صورة واحدة على الأقل" };

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "معرض الصور غير صالح" };
  }
  if (!Array.isArray(parsed) || parsed.length === 0) return { error: "أضف صورة واحدة على الأقل" };

  const drafts: Array<GalleryImage & { primary: boolean }> = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") return { error: "معرض الصور غير صالح" };
    const row = item as Record<string, unknown>;
    const url = typeof row.url === "string" ? row.url.trim() : "";
    const id = typeof row.id === "string" ? row.id.trim() : "";
    const sortValue = typeof row.sort_order === "number" ? String(row.sort_order) : typeof row.sort_order === "string" ? row.sort_order.trim() : "";
    const sortOrder = readInt(sortValue);
    if (!url || url.length > 2000) return { error: "رابط الصورة غير صالح" };
    if (sortOrder == null || sortOrder > 1000) return { error: "ترتيب الصور غير صالح" };
    if (id && !isUuid(id)) return { error: "معرض الصور غير صالح" };
    drafts.push({ id, url, sortOrder, primary: row.primary === true });
  }

  if (drafts.filter((image) => image.primary).length !== 1) return { error: "اختر صورة أساسية واحدة" };
  const primary = drafts.find((image) => image.primary)!;
  const rest = drafts.filter((image) => !image.primary).sort((a, b) => a.sortOrder - b.sortOrder);
  return {
    images: [primary, ...rest].map((image, index) => ({
      id: image.id,
      url: image.url,
      sortOrder: index,
    })),
  };
}

async function replaceGallery(
  supabase: Awaited<ReturnType<typeof adminClient>>,
  productId: string,
  nameAr: string,
  images: GalleryImage[]
): Promise<string | null> {
  const { data: existing, error: readError } = await supabase.from("product_images").select("id").eq("product_id", productId);
  if (readError) return dbMessage(readError);

  const keep = new Set(images.map((image) => image.id).filter(Boolean));
  const remove = (existing ?? []).map((row) => row.id).filter((id) => !keep.has(id));
  if (remove.length > 0) {
    const { error } = await supabase.from("product_images").delete().in("id", remove);
    if (error) return dbMessage(error);
  }

  for (const image of images) {
    const payload = { url: image.url, alt_text: nameAr, sort_order: image.sortOrder };
    if (image.id) {
      const { error } = await supabase.from("product_images").update(payload).eq("id", image.id).eq("product_id", productId);
      if (error) return dbMessage(error);
    } else {
      const { error } = await supabase.from("product_images").insert({ ...payload, product_id: productId });
      if (error) return dbMessage(error);
    }
  }

  return null;
}

export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const productId = readString(formData, "productId");
  const variantId = readString(formData, "variantId");
  const view = readString(formData, "view") === "table" ? "table" : "cards";
  const nameAr = readString(formData, "name_ar");
  const slug = readString(formData, "slug").toLowerCase();
  const description = readString(formData, "description_ar");
  const categoryId = readString(formData, "category_id");
  const brandId = readString(formData, "brand_id");
  const status = readString(formData, "status");
  const sku = readString(formData, "sku");
  const price = readInt(readString(formData, "price_piasters"));
  const compareRaw = readString(formData, "compare_at_piasters");
  const compareAt = compareRaw === "" ? null : readInt(compareRaw);
  const stock = readInt(readString(formData, "stock"));
  const gallery = readGallery(formData);

  if (nameAr.length < 2) return { error: "اسم المنتج مطلوب", saved: false, notice: null };
  if (!isSlug(slug)) return { error: "الرابط يجب أن يكون بالإنجليزية وشرطات فقط", saved: false, notice: null };
  if (!categoryId) return { error: "اختر فئة", saved: false, notice: null };
  if (!isProductStatus(status)) return { error: "حالة المنتج غير صالحة", saved: false, notice: null };
  if (!sku) return { error: "SKU مطلوب", saved: false, notice: null };
  if (price == null) return { error: "السعر بالقرش يجب أن يكون رقماً صحيحاً", saved: false, notice: null };
  if (compareRaw !== "" && compareAt == null) return { error: "سعر المقارنة غير صالح", saved: false, notice: null };
  if (stock == null) return { error: "المخزون يجب أن يكون رقماً صحيحاً", saved: false, notice: null };
  if ("error" in gallery) return { error: gallery.error, saved: false, notice: null };

  const productPayload = {
    name_ar: nameAr,
    slug,
    description_ar: description || null,
    category_id: categoryId,
    brand_id: brandId || null,
    status,
    updated_at: new Date().toISOString(),
  };

  let savedProductId = productId;

  if (productId) {
    const { error } = await supabase.from("products").update(productPayload).eq("id", productId);
    if (error) return { error: dbMessage(error), saved: false, notice: null };
  } else {
    const { data, error } = await supabase.from("products").insert(productPayload).select("id").single();
    if (error || !data) return { error: dbMessage(error ?? {}), saved: false, notice: null };
    savedProductId = data.id;
  }

  const variantPayload = {
    sku,
    price_piasters: price,
    compare_at_piasters: compareAt,
    stock,
    is_default: true,
  };

  if (variantId) {
    const { error } = await supabase
      .from("product_variants")
      .update(variantPayload)
      .eq("id", variantId)
      .eq("product_id", savedProductId);
    if (error) return { error: dbMessage(error), saved: false, notice: null };
  } else {
    const { error } = await supabase.from("product_variants").insert({
      ...variantPayload,
      product_id: savedProductId,
    });
    if (error) {
      if (!productId) await supabase.from("products").delete().eq("id", savedProductId);
      return { error: dbMessage(error), saved: false, notice: null };
    }
  }

  const imageError = await replaceGallery(supabase, savedProductId, nameAr, gallery.images);
  if (imageError) return { error: imageError, saved: false, notice: null };

  revalidateCatalog();
  if (!productId) redirect(`/admin/products?view=${view}&edit=${savedProductId}`);
  return { error: null, saved: true, notice: null };
}

export async function archiveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const productId = readString(formData, "productId");
  if (!productId) return { error: "المنتج غير موجود", saved: false, notice: null };

  const { error } = await supabase
    .from("products")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", productId);

  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

async function archiveBecauseLinked(supabase: Awaited<ReturnType<typeof adminClient>>, productId: string, notice: string): Promise<FormState> {
  const { error } = await supabase
    .from("products")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice };
}

export async function deleteProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const productId = readString(formData, "productId");
  if (!isUuid(productId)) return { error: "المنتج غير موجود", saved: false, notice: null };

  const { data: variants, error: variantError } = await supabase.from("product_variants").select("id").eq("product_id", productId);
  if (variantError) return { error: dbMessage(variantError), saved: false, notice: null };

  const variantIds = (variants ?? []).map((row) => row.id);
  if (variantIds.length > 0) {
    const { count, error } = await supabase
      .from("order_items")
      .select("id", { count: "exact", head: true })
      .in("variant_id", variantIds);
    if (error) return { error: dbMessage(error), saved: false, notice: null };
    if ((count ?? 0) > 0) {
      return archiveBecauseLinked(supabase, productId, "لا يمكن حذف المنتج لأنه مرتبط بطلبات. تم أرشفته.");
    }
  }

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error?.code === "23503") {
    return archiveBecauseLinked(supabase, productId, "لا يمكن حذف المنتج لأن بيانات أخرى تعتمد عليه. تم أرشفته.");
  }
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  redirect("/admin/products");
}

function readCategory(formData: FormData):
  | { ok: false; error: string }
  | { ok: true; nameAr: string; slug: string; description: string; sortOrder: number } {
  const nameAr = readString(formData, "name_ar");
  const slug = readString(formData, "slug").toLowerCase();
  const description = readString(formData, "description_ar");
  const sortOrder = readInt(readString(formData, "sort_order") || "0");
  if (nameAr.length < 2) return { ok: false, error: "اسم الفئة مطلوب" };
  if (!isSlug(slug)) return { ok: false, error: "الرابط يجب أن يكون بالإنجليزية وشرطات فقط" };
  if (sortOrder == null) return { ok: false, error: "الترتيب غير صالح" };
  return { ok: true, nameAr, slug, description, sortOrder };
}

export async function saveCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const fields = readCategory(formData);
  if (!fields.ok) return { error: fields.error, saved: false, notice: null };

  const imageUrl = readString(formData, "image_url");
  if (imageUrl.length > 2000) return { error: "رابط الصورة طويل جداً", saved: false, notice: null };

  const payload = {
    name_ar: fields.nameAr,
    slug: fields.slug,
    description_ar: fields.description || null,
    image_url: imageUrl || null,
    sort_order: fields.sortOrder,
  };
  const { error } = id
    ? await supabase.from("categories").update(payload).eq("id", id)
    : await supabase.from("categories").insert(payload);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

export async function deleteCategory(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  if (!isUuid(id)) return { error: "الفئة غير موجودة", saved: false, notice: null };

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("category_id", id);
  if (countError) return { error: dbMessage(countError), saved: false, notice: null };
  if ((count ?? 0) > 0) return { error: "لا يمكن حذف الفئة لوجود منتجات مرتبطة بها", saved: false, notice: null };

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

function readBrand(formData: FormData):
  | { ok: false; error: string }
  | { ok: true; name: string; slug: string; logoUrl: string } {
  const name = readString(formData, "name");
  const slug = readString(formData, "slug").toLowerCase();
  const logoUrl = readString(formData, "logo_url");
  if (name.length < 2) return { ok: false, error: "اسم العلامة مطلوب" };
  if (!isSlug(slug)) return { ok: false, error: "الرابط يجب أن يكون بالإنجليزية وشرطات فقط" };
  if (logoUrl.length > 2000) return { ok: false, error: "رابط الشعار طويل جداً" };
  return { ok: true, name, slug, logoUrl };
}

export async function saveBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const fields = readBrand(formData);
  if (!fields.ok) return { error: fields.error, saved: false, notice: null };

  const payload = { name: fields.name, slug: fields.slug, logo_url: fields.logoUrl || null };
  const { error } = id
    ? await supabase.from("brands").update(payload).eq("id", id)
    : await supabase.from("brands").insert(payload);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

export async function deleteBrand(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  if (!isUuid(id)) return { error: "العلامة غير موجودة", saved: false, notice: null };

  const { count, error: countError } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("brand_id", id);
  if (countError) return { error: dbMessage(countError), saved: false, notice: null };
  if ((count ?? 0) > 0) return { error: "لا يمكن حذف العلامة لوجود منتجات مرتبطة بها", saved: false, notice: null };

  const { error } = await supabase.from("brands").delete().eq("id", id);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

function readPromotion(formData: FormData):
  | { ok: false; error: string }
  | {
      ok: true;
      code: string;
      discountType: "percentage" | "fixed";
      discountValue: number;
      minOrder: number;
      maxUses: number | null;
      isActive: boolean;
      expiresAt: string | null;
    } {
  const code = readString(formData, "code").toUpperCase();
  const discountType = readString(formData, "discount_type");
  const discountValue = readInt(readString(formData, "discount_value"));
  const minOrder = readInt(readString(formData, "min_order_piasters") || "0");
  const maxUsesRaw = readString(formData, "max_uses");
  const maxUses = maxUsesRaw === "" ? null : readInt(maxUsesRaw);
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";
  const expiresRaw = readString(formData, "expires_at");

  if (code.length < 2 || code.length > 40 || /\s/.test(code)) return { ok: false, error: "كود العرض غير صالح" };
  if (discountType !== "percentage" && discountType !== "fixed") return { ok: false, error: "نوع الخصم غير صالح" };
  if (discountValue == null || discountValue <= 0) return { ok: false, error: "قيمة الخصم يجب أن تكون أكبر من صفر" };
  if (discountType === "percentage" && discountValue > 100) return { ok: false, error: "النسبة يجب ألا تتجاوز 100" };
  if (minOrder == null) return { ok: false, error: "الحد الأدنى غير صالح" };
  if (maxUsesRaw !== "" && (maxUses == null || maxUses <= 0)) return { ok: false, error: "الحد الأقصى للاستخدام غير صالح" };

  let expiresAt: string | null = null;
  if (expiresRaw) {
    const parsed = new Date(expiresRaw);
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "تاريخ الانتهاء غير صالح" };
    expiresAt = parsed.toISOString();
  }

  return { ok: true, code, discountType, discountValue, minOrder, maxUses, isActive, expiresAt };
}

export async function savePromotion(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const fields = readPromotion(formData);
  if (!fields.ok) return { error: fields.error, saved: false, notice: null };

  const payload = {
    code: fields.code,
    discount_type: fields.discountType,
    discount_value: fields.discountValue,
    min_order_piasters: fields.minOrder,
    max_uses: fields.maxUses,
    is_active: fields.isActive,
    expires_at: fields.expiresAt,
  };
  const { error } = id
    ? await supabase.from("promotions").update(payload).eq("id", id)
    : await supabase.from("promotions").insert(payload);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

export async function deletePromotion(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  if (!isUuid(id)) return { error: "العرض غير موجود", saved: false, notice: null };

  const { data, error: readError } = await supabase.from("promotions").select("id, used_count").eq("id", id).maybeSingle();
  if (readError) return { error: dbMessage(readError), saved: false, notice: null };
  if (!data) return { error: "العرض غير موجود", saved: false, notice: null };

  if (data.used_count > 0) {
    const { error } = await supabase.from("promotions").update({ is_active: false }).eq("id", id);
    if (error) return { error: dbMessage(error), saved: false, notice: null };
    revalidateCatalog();
    return { error: null, saved: true, notice: "تم تعطيل العرض لأنه استُخدم ولا يمكن حذفه" };
  }

  const { error } = await supabase.from("promotions").delete().eq("id", id);
  if (error?.code === "23503") {
    const { error: disableError } = await supabase.from("promotions").update({ is_active: false }).eq("id", id);
    if (disableError) return { error: dbMessage(disableError), saved: false, notice: null };
    revalidateCatalog();
    return { error: null, saved: true, notice: "تم تعطيل العرض لأنه استُخدم ولا يمكن حذفه" };
  }
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

export async function saveBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const titleAr = readString(formData, "title_ar");
  const subtitleAr = readString(formData, "subtitle_ar");
  const linkUrl = readString(formData, "link_url");
  const imageUrl = readString(formData, "image_url");
  const bannerType = readString(formData, "type");
  const sortOrder = readInt(readString(formData, "sort_order") || "0");
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  if (!isBannerType(bannerType)) {
    return { error: "نوع البانر غير صالح", saved: false, notice: null };
  }
  if (titleAr.length < 2) return { error: "عنوان البانر مطلوب", saved: false, notice: null };
  if (sortOrder == null) return { error: "الترتيب غير صالح", saved: false, notice: null };
  if ((bannerType === "hero" || bannerType === "offer") && !imageUrl) {
    return { error: "صورة البانر مطلوبة", saved: false, notice: null };
  }
  if (imageUrl.length > 2000 || linkUrl.length > 2000) return { error: "الرابط طويل جداً", saved: false, notice: null };

  const payload = {
    title_ar: titleAr,
    subtitle_ar: subtitleAr || null,
    link_url: linkUrl || null,
    image_url: imageUrl || null,
    sort_order: sortOrder,
    is_active: isActive,
    type: bannerType,
  };

  const { error } = id
    ? await supabase.from("homepage_banners").update(payload).eq("id", id)
    : await supabase.from("homepage_banners").insert(payload);

  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  revalidateStorefront();
  return { error: null, saved: true, notice: null };
}

export async function moveBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const direction = readString(formData, "direction");
  if (!isUuid(id)) return { error: "البانر غير موجود", saved: false, notice: null };
  if (direction !== "up" && direction !== "down") return { error: "اتجاه غير صالح", saved: false, notice: null };

  const current = await supabase.from("homepage_banners").select("id, type").eq("id", id).maybeSingle();
  if (current.error) return { error: dbMessage(current.error), saved: false, notice: null };
  if (!current.data) return { error: "البانر غير موجود", saved: false, notice: null };

  const { data, error } = await supabase
    .from("homepage_banners")
    .select("id, sort_order")
    .eq("type", current.data.type)
    .order("sort_order", { ascending: true });
  if (error) return { error: dbMessage(error), saved: false, notice: null };

  const rows = [...(data ?? [])].sort((a, b) => a.sort_order - b.sort_order || a.id.localeCompare(b.id));
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) return { error: "البانر غير موجود", saved: false, notice: null };
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= rows.length) return { error: null, saved: true, notice: null };

  const next = [...rows];
  const [item] = next.splice(index, 1);
  next.splice(target, 0, item);

  for (let position = 0; position < next.length; position += 1) {
    if (next[position].sort_order === position) continue;
    const { error: updateError } = await supabase.from("homepage_banners").update({ sort_order: position }).eq("id", next[position].id);
    if (updateError) return { error: dbMessage(updateError), saved: false, notice: null };
  }

  revalidateCatalog();
  revalidateStorefront();
  return { error: null, saved: true, notice: null };
}

export async function deleteBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  if (!isUuid(id)) return { error: "البانر غير موجود", saved: false, notice: null };
  const { error } = await supabase.from("homepage_banners").delete().eq("id", id);
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  revalidateStorefront();
  return { error: null, saved: true, notice: null };
}

export async function saveAdminOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const orderId = readString(formData, "orderId");
  const status = readString(formData, "status");
  if (!isUuid(orderId)) return { error: "الطلب غير موجود", saved: false, notice: null };
  if (!isOrderStatus(status)) return { error: "حالة الطلب غير صالحة", saved: false, notice: null };

  const result = await updateAdminOrderStatus(orderId, status);
  if (!result.success) return { error: result.error ?? "تعذر تحديث الحالة", saved: false, notice: null };
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
  return { error: null, saved: true, notice: null };
}

export async function saveStorefrontBranding(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const branding = serializeStorefrontBranding({
    logoUrl: readString(formData, "logoUrl"),
    gradientStart: readString(formData, "gradientStart"),
    gradientMid: readString(formData, "gradientMid"),
    gradientEnd: readString(formData, "gradientEnd"),
    gradientAngle: Number(readString(formData, "gradientAngle")),
    marqueeEnabled: readString(formData, "marqueeEnabled") === "true",
  });
  if (!branding) {
    return { error: "بيانات الهوية غير صالحة. استخدم ألواناً سداسية وزاوية بين 0 و360", saved: false, notice: null };
  }

  const payload: Json = {
    logoUrl: branding.logoUrl,
    gradientStart: branding.gradientStart,
    gradientMid: branding.gradientMid,
    gradientEnd: branding.gradientEnd,
    gradientAngle: branding.gradientAngle,
    marqueeEnabled: branding.marqueeEnabled,
  };

  const existing = await supabase.from("settings").select("key").eq("key", STOREFRONT_BRANDING_KEY).maybeSingle();
  if (existing.error) return { error: dbMessage(existing.error), saved: false, notice: null };
  const { error } = existing.data
    ? await supabase
        .from("settings")
        .update({ value: payload, updated_at: new Date().toISOString() })
        .eq("key", STOREFRONT_BRANDING_KEY)
    : await supabase.from("settings").insert({ key: STOREFRONT_BRANDING_KEY, value: payload });
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  return { error: null, saved: true, notice: null };
}

export async function saveAdminNotificationEmails(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const raw = readString(formData, "emails_json");
  let parsed: unknown = [];
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { error: "من فضلك أدخل بريدًا إلكترونيًا صحيحًا.", saved: false, notice: null };
    }
  }

  const validated = validateAdminNotificationEmails(parsed);
  if (!validated.ok) return { error: validated.error, saved: false, notice: null };

  const payload = validated.emails as Json;
  const existing = await supabase.from("settings").select("key").eq("key", ADMIN_NOTIFICATION_EMAILS_KEY).maybeSingle();
  if (existing.error) return { error: dbMessage(existing.error), saved: false, notice: null };
  const { error } = existing.data
    ? await supabase
        .from("settings")
        .update({ value: payload, updated_at: new Date().toISOString() })
        .eq("key", ADMIN_NOTIFICATION_EMAILS_KEY)
    : await supabase.from("settings").insert({ key: ADMIN_NOTIFICATION_EMAILS_KEY, value: payload });
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidatePath("/admin/settings");
  return { error: null, saved: true, notice: null };
}

export async function saveWhatsapp(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const raw = readString(formData, "whatsapp_number");
  const number = normalizeEgyptianMobile(raw);
  if (!number) return { error: "رقم واتساب غير صالح. استخدم رقماً مصرياً يبدأ بـ 010 أو 011 أو 012 أو 015", saved: false, notice: null };

  const existing = await supabase.from("settings").select("key").eq("key", "whatsapp_number").maybeSingle();
  if (existing.error) return { error: dbMessage(existing.error), saved: false, notice: null };
  const { error } = existing.data
    ? await supabase.from("settings").update({ value: number, updated_at: new Date().toISOString() }).eq("key", "whatsapp_number")
    : await supabase.from("settings").insert({ key: "whatsapp_number", value: number });
  if (error) return { error: dbMessage(error), saved: false, notice: null };
  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}

export async function saveShippingRate(_prev: FormState, formData: FormData): Promise<FormState> {
  const supabase = await adminClient();
  const id = readString(formData, "id");
  const governorate = readString(formData, "governorate");
  const rate = readInt(readString(formData, "rate_piasters"));
  if (governorate.length < 2) return { error: "اسم المحافظة مطلوب", saved: false, notice: null };
  if (rate == null) return { error: "رسوم الشحن بالقرش يجب أن تكون رقماً صحيحاً", saved: false, notice: null };

  if (id) {
    if (!isUuid(id)) return { error: "سعر الشحن غير موجود", saved: false, notice: null };
    const { error } = await supabase.from("shipping_rates").update({ rate_piasters: rate }).eq("id", id);
    if (error) return { error: dbMessage(error), saved: false, notice: null };
  } else {
    const { error } = await supabase.from("shipping_rates").insert({ governorate, rate_piasters: rate });
    if (error) return { error: dbMessage(error), saved: false, notice: null };
  }

  revalidateCatalog();
  return { error: null, saved: true, notice: null };
}
