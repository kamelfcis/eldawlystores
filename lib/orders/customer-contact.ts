/** Digits-only tel href, or null when the value cannot be dialed. */
export function customerTelHref(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 8) return null;
  return `tel:${digits}`;
}

/**
 * WhatsApp chat URL for an Egyptian mobile number.
 * Accepts 01…, +20, 0020, and 20 prefixes. Returns null when unusable.
 */
export function customerWhatsAppHref(phone: string): string | null {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(4);
  else if (digits.startsWith("20") && digits.length >= 11) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);

  if (!/^1\d{9}$/.test(digits)) return null;
  return `https://wa.me/20${digits}`;
}
