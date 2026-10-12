export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductDocument {
  specs: ProductSpec[];
}

export const MAX_SPEC_ROWS = 30;
export const MAX_SPEC_LABEL_LENGTH = 80;
export const MAX_SPEC_VALUE_LENGTH = 200;

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeSpecs(rows: unknown): ProductSpec[] {
  if (!Array.isArray(rows)) return [];
  const specs: ProductSpec[] = [];
  for (const row of rows) {
    if (specs.length >= MAX_SPEC_ROWS) break;
    if (!row || typeof row !== "object") continue;
    const record = row as { label?: unknown; value?: unknown };
    const label = asText(record.label).slice(0, MAX_SPEC_LABEL_LENGTH);
    const value = asText(record.value).slice(0, MAX_SPEC_VALUE_LENGTH);
    if (!label || !value) continue;
    specs.push({ label, value });
  }
  return specs;
}

export function parseProductDocument(input: unknown): ProductDocument {
  let value = input;
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return { specs: [] };
    try {
      value = JSON.parse(trimmed) as unknown;
    } catch {
      return { specs: [] };
    }
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) return { specs: [] };
  return { specs: normalizeSpecs((value as { specs?: unknown }).specs) };
}

export function parseSpecsFromFormData(formData: FormData): ProductDocument {
  const labels = formData.getAll("specs_label");
  const values = formData.getAll("specs_value");
  if (labels.length > 0 || values.length > 0) {
    const rows = labels.map((label, index) => ({
      label: typeof label === "string" ? label : "",
      value: typeof values[index] === "string" ? values[index] : "",
    }));
    return { specs: normalizeSpecs(rows) };
  }
  return parseProductDocument(formData.get("document"));
}

export function unionSpecLabels(products: Array<{ specs?: ProductSpec[] | null }>): string[] {
  const seen = new Set<string>();
  const labels: string[] = [];
  for (const product of products) {
    for (const spec of product.specs ?? []) {
      if (seen.has(spec.label)) continue;
      seen.add(spec.label);
      labels.push(spec.label);
    }
  }
  return labels;
}

export function specValueForLabel(specs: ProductSpec[] | null | undefined, label: string): string | undefined {
  return specs?.find((spec) => spec.label === label)?.value;
}
