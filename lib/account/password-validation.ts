export const PASSWORD_MISMATCH = "كلمة المرور الجديدة غير متطابقة";
export const PASSWORD_SAME_AS_CURRENT = "اختر كلمة مرور مختلفة عن الحالية";
export const PASSWORD_TOO_SHORT = "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل";
export const PASSWORD_CURRENT_REQUIRED = "أدخل كلمة المرور الحالية";

export function validatePasswordChange(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  requiresCurrent: boolean;
}): string | null {
  if (input.newPassword.length < 8) return PASSWORD_TOO_SHORT;
  if (input.newPassword !== input.confirmPassword) return PASSWORD_MISMATCH;
  if (input.requiresCurrent) {
    if (!input.currentPassword.trim()) return PASSWORD_CURRENT_REQUIRED;
    if (input.newPassword === input.currentPassword) return PASSWORD_SAME_AS_CURRENT;
  }
  return null;
}
