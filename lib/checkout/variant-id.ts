const STORED_VARIANT_ID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isStoredVariantId(variantId: string): boolean {
  return STORED_VARIANT_ID.test(variantId);
}
