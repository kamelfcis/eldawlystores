export function isCheckoutSuccess<T extends { accessToken?: unknown }>(
  body: T
): body is T & { accessToken: string } {
  return typeof body.accessToken === "string" && body.accessToken.length > 0;
}
