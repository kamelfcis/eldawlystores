const INVALID_EMAIL = "البريد الإلكتروني غير صالح";
const WEAK_PASSWORD = "كلمة المرور ضعيفة. استخدم 8 أحرف على الأقل";
const WRONG_PASSWORD = "كلمة المرور غير صحيحة";
const EMAIL_NOT_CONFIRMED = "أكد بريدك الإلكتروني أولاً. راجع رسالة التأكيد.";
const GENERIC = "تعذر إتمام العملية";

export const GOOGLE_AUTH_UNAVAILABLE = "تسجيل الدخول بحساب Google غير متاح حالياً";

type AuthErrorLike = {
  code?: string | null;
  message?: string | null;
};

/**
 * Maps Supabase Auth failures to Arabic. The raw `error.message` is never returned.
 */
export function authErrorMessage(error: AuthErrorLike | null | undefined): string {
  const code = error?.code?.toLowerCase() ?? "";
  const message = error?.message?.toLowerCase() ?? "";

  if (
    code === "email_address_invalid" ||
    message.includes("unable to validate email") ||
    message.includes("invalid email")
  ) {
    return INVALID_EMAIL;
  }

  if (
    code === "weak_password" ||
    message.includes("password should be at least") ||
    message.includes("weak and easy to guess")
  ) {
    return WEAK_PASSWORD;
  }

  if (
    code === "invalid_credentials" ||
    message.includes("invalid login credentials") ||
    message.includes("invalid credentials")
  ) {
    return WRONG_PASSWORD;
  }

  if (code === "email_not_confirmed" || message.includes("email not confirmed")) {
    return EMAIL_NOT_CONFIRMED;
  }

  return GENERIC;
}

/** @deprecated Use authErrorMessage — kept for plan/checklist naming */
export const mapAuthError = authErrorMessage;

export const EMAIL_CONFIRMATION_MESSAGE =
  "تم إنشاء حسابك. يرجى التحقق من بريدك الإلكتروني لتأكيد الحساب قبل تسجيل الدخول.";
