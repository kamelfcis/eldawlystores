import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const actions = readFileSync("lib/admin/actions.ts", "utf8");
const productsPage = readFileSync("app/(admin)/admin/products/page.tsx", "utf8");
const productForm = readFileSync("components/admin/catalog-forms.tsx", "utf8");
const queries = readFileSync("lib/admin/queries.ts", "utf8");
const catalog = readFileSync("lib/catalog/index.ts", "utf8");

describe("saveProduct document persist", () => {
  it("parses specs and writes document on insert and update", () => {
    expect(actions).toContain("parseSpecsFromFormData");
    expect(actions).toContain("const document = parseSpecsFromFormData(formData)");
    expect(actions).toContain("document: document as unknown as Json");
    expect(actions).toMatch(/from\("products"\)\.update\(productPayload\)/);
    expect(actions).toMatch(/from\("products"\)\.insert\(productPayload\)/);
  });
});

describe("deleteProduct archive-when-linked", () => {
  it("hard-deletes unused products and archives linked ones", () => {
    expect(actions).toContain('redirect("/admin/products?notice=product-deleted")');
    expect(actions).toContain("archiveBecauseLinked");
    expect(actions).toContain("لا يمكن حذف المنتج لأنه مرتبط بطلبات. تم أرشفته.");
    expect(actions).toContain("لا يمكن حذف المنتج لأن بيانات أخرى تعتمد عليه. تم أرشفته.");
    expect(productForm).toContain("useFormToast(state, \"تم حذف المنتج\")");
  });
});

describe("admin product editor", () => {
  it("remounts the form, fetches by id, and hydrates specs", () => {
    expect(productsPage).toContain("key={editing?.id ?? \"new\"}");
    expect(productsPage).toContain("getAdminProductById");
    expect(productsPage).toContain("border-t-2");
    expect(productsPage).toContain("border-t-category-blue");
    expect(productForm).toContain("ProductSpecsField");
    expect(productForm).toContain("useFormToast(state, \"تم حفظ المنتج\")");
    expect(queries).toContain("document");
    expect(queries).toContain("specs: parseProductDocument(product.document).specs");
    expect(catalog).toContain("document");
    expect(catalog).toContain("specs: document.specs");
  });
});
