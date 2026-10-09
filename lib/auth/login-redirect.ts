export function loginRedirect(userId: string | null): "/account" | null {
  if (!userId) return null;
  return "/account";
}
