import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { loginRedirect } from "@/lib/auth/login-redirect";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const session = await getSessionRole();
  const destination = loginRedirect(session?.userId ?? null);
  if (destination) redirect(destination);

  const params = await searchParams;
  const queryError = params.error;
  const callbackFailed =
    queryError === "auth" || (Array.isArray(queryError) && queryError.includes("auth"));

  return <LoginForm callbackFailed={callbackFailed} />;
}
