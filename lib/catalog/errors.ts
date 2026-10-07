export type CatalogErrorKind = "network" | "auth" | "not_found" | "unknown";

function errorText(error: unknown): string {
  if (error instanceof Error) {
    const parts = [error.message];
    if (error.cause) parts.push(String(error.cause));
    return parts.join(" ").toLowerCase();
  }
  return String(error).toLowerCase();
}

export function classifyCatalogError(error: unknown): CatalogErrorKind {
  const text = errorText(error);

  if (
    text.includes("fetch failed") ||
    text.includes("econnrefused") ||
    text.includes("enotfound") ||
    text.includes("etimedout") ||
    text.includes("econnreset") ||
    text.includes("network") ||
    text.includes("timeout") ||
    text.includes("aborterror")
  ) {
    return "network";
  }

  if (
    text.includes("jwt") ||
    text.includes("unauthorized") ||
    text.includes("401") ||
    text.includes("403") ||
    text.includes("permission") ||
    text.includes("row-level security") ||
    text.includes("invalid api key")
  ) {
    return "auth";
  }

  if (text.includes("not found") || text.includes("404") || text.includes("pgrst116")) {
    return "not_found";
  }

  return "unknown";
}

export function isRetryable(kind: CatalogErrorKind): boolean {
  return kind === "network";
}

export function userFacingMessage(kind: CatalogErrorKind): string {
  switch (kind) {
    case "network":
      return "تعذر الاتصال بالخادم. يرجى المحاولة مرة أخرى.";
    case "auth":
      return "حدث خطأ في الوصول إلى البيانات.";
    case "not_found":
      return "المحتوى غير متوفر حالياً.";
    default:
      return "حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.";
  }
}
