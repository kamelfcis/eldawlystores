export function arabicDbError(error: { code?: string; message?: string } | null | undefined): string | null {
  if (!error) return null;
  if (error.code === "23505") return "هذه القيمة مستخدمة بالفعل";
  if (error.code === "23503") return "لا يمكن إتمام العملية لأن هناك بيانات مرتبطة";
  if (error.code === "42501") return "ليست لديك صلاحية الحفظ";
  if (error.code === "23514") return "القيمة غير صالحة";
  return "تعذر إكمال العملية";
}
