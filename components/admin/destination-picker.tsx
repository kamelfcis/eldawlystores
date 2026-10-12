"use client";

import { useEffect, useId, useState } from "react";
import { adminFilterChipClass } from "@/components/admin/admin-ui";
import { Field, selectClass } from "@/components/admin/form-bits";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { AdminCategoryOption, AdminProductSearchRow } from "@/lib/admin/queries";
import {
  categoryDestinationPath,
  inferDestinationKind,
  productDestinationPath,
  slugFromCategoryPath,
  slugFromProductPath,
  type DestinationKind,
} from "@/lib/admin/destination-url";
import { cn } from "@/lib/utils/cn";

const kindLabels: Record<DestinationKind, string> = {
  home: "الرئيسية",
  products: "كل المنتجات",
  product: "منتج",
  category: "قسم",
  custom: "رابط مخصص",
};

export function DestinationPicker({
  categories,
  value,
  onChange,
  name = "link_url",
}: {
  categories: AdminCategoryOption[];
  value: string;
  onChange: (url: string) => void;
  name?: string;
}) {
  const [kind, setKind] = useState<DestinationKind>(() => inferDestinationKind(value));
  const [customPath, setCustomPath] = useState(() => (inferDestinationKind(value) === "custom" ? value : ""));
  const [categorySlug, setCategorySlug] = useState(() => {
    if (inferDestinationKind(value) !== "category") return categories[0]?.slug ?? "";
    return slugFromCategoryPath(value) || categories[0]?.slug || "";
  });
  const [selectedProduct, setSelectedProduct] = useState<AdminProductSearchRow | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productQuery, setProductQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [productResults, setProductResults] = useState<AdminProductSearchRow[]>([]);
  const [productLoading, setProductLoading] = useState(false);
  const [productError, setProductError] = useState<string | null>(null);
  const listId = useId();

  useEffect(() => {
    const nextKind = inferDestinationKind(value);
    setKind(nextKind);
    if (nextKind === "custom") setCustomPath(value);
    if (nextKind === "category") setCategorySlug(slugFromCategoryPath(value) || categories[0]?.slug || "");
    if (nextKind === "product") {
      const slug = slugFromProductPath(value);
      setSelectedProduct((current) =>
        current?.slug === slug ? current : { id: slug, name_ar: slug, slug, image_url: null }
      );
    }
    if (nextKind === "home" || nextKind === "products") {
      setSelectedProduct(null);
    }
  }, [value, categories]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(productQuery.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [productQuery]);

  useEffect(() => {
    if (!productDialogOpen) return;
    if (debouncedQuery.length < 2) {
      setProductResults([]);
      setProductError(null);
      setProductLoading(false);
      return;
    }

    let cancelled = false;
    setProductLoading(true);
    setProductError(null);

    fetch(`/api/admin/products/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(async (response) => {
        const payload = (await response.json()) as { products?: AdminProductSearchRow[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? "تعذر البحث");
        return payload.products ?? [];
      })
      .then((products) => {
        if (!cancelled) setProductResults(products);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setProductResults([]);
          setProductError(error instanceof Error ? error.message : "تعذر البحث");
        }
      })
      .finally(() => {
        if (!cancelled) setProductLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, productDialogOpen]);

  function applyKind(nextKind: DestinationKind) {
    setKind(nextKind);
    if (nextKind === "home") onChange("/");
    else if (nextKind === "products") onChange("/products");
    else if (nextKind === "category") onChange(categoryDestinationPath(categorySlug || categories[0]?.slug || ""));
    else if (nextKind === "custom") onChange(customPath);
    else if (nextKind === "product" && selectedProduct) onChange(productDestinationPath(selectedProduct.slug));
  }

  function selectProduct(product: AdminProductSearchRow) {
    setSelectedProduct(product);
    setKind("product");
    onChange(productDestinationPath(product.slug));
    setProductDialogOpen(false);
    setProductQuery("");
    setDebouncedQuery("");
    setProductResults([]);
  }

  const summary =
    kind === "home"
      ? "/"
      : kind === "products"
        ? "/products"
        : kind === "category"
          ? categoryDestinationPath(categorySlug)
          : kind === "product"
            ? selectedProduct
              ? productDestinationPath(selectedProduct.slug)
              : value
            : customPath || value;

  return (
    <div className="space-y-3">
      <input type="hidden" name={name} value={value} readOnly />
      <Field label="وجهة الرابط">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(kindLabels) as DestinationKind[]).map((option) => (
            <button
              key={option}
              type="button"
              className={adminFilterChipClass(kind === option)}
              onClick={() => applyKind(option)}
            >
              {kindLabels[option]}
            </button>
          ))}
        </div>
      </Field>

      {kind === "product" ? (
        <div className="space-y-2">
          <Button type="button" variant="outline" className="w-full min-[390px]:w-auto" onClick={() => setProductDialogOpen(true)}>
            {selectedProduct ? "تغيير المنتج" : "اختيار منتج"}
          </Button>
          {selectedProduct ? (
            <p className="text-[14px] text-carbon-ink">{selectedProduct.name_ar}</p>
          ) : (
            <p className="text-[14px] text-graphite">لم يُحدَّد منتج بعد.</p>
          )}
        </div>
      ) : null}

      {kind === "category" ? (
        <Field label="القسم">
          <select
            className={selectClass}
            value={categorySlug}
            onChange={(event) => {
              const slug = event.target.value;
              setCategorySlug(slug);
              onChange(categoryDestinationPath(slug));
            }}
          >
            {categories.length === 0 ? <option value="">لا توجد أقسام</option> : null}
            {categories.map((category) => (
              <option key={category.id} value={category.slug}>
                {category.name_ar}
              </option>
            ))}
          </select>
        </Field>
      ) : null}

      {kind === "custom" ? (
        <Field label="المسار">
          <Input
            value={customPath}
            onChange={(event) => {
              const next = event.target.value;
              setCustomPath(next);
              onChange(next);
            }}
            placeholder="/categories/smartphones"
            dir="ltr"
            className="text-left"
          />
        </Field>
      ) : null}

      <p className="truncate text-[12px] text-graphite" dir="ltr">
        {summary || "—"}
      </p>

      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>بحث المنتجات</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="اكتب اسم المنتج"
              autoFocus
            />
            {productLoading ? <p className="text-[14px] text-graphite">جارٍ البحث…</p> : null}
            {productError ? <p className="text-[14px] text-ember-red">{productError}</p> : null}
            {!productLoading && debouncedQuery.length >= 2 && productResults.length === 0 && !productError ? (
              <p className="text-[14px] text-graphite">لا توجد نتائج.</p>
            ) : null}
            <ul id={listId} className="max-h-64 space-y-2 overflow-y-auto">
              {productResults.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[8px] border border-mist bg-paper-white px-3 py-2 text-right transition-colors hover:bg-fog"
                    )}
                    onClick={() => selectProduct(product)}
                  >
                    {product.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={product.image_url} alt="" className="h-10 w-10 shrink-0 rounded-[4px] object-contain" />
                    ) : (
                      <div className="h-10 w-10 shrink-0 rounded-[4px] border border-mist bg-fog" />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[14px] text-carbon-ink">{product.name_ar}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
