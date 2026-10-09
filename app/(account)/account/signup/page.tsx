import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { loginRedirect } from "@/lib/auth/login-redirect";
import { SignupForm } from "./signup-form";

export default async function SignupPage() {
  const session = await getSessionRole();
  const destination = loginRedirect(session?.userId ?? null);
  if (destination) redirect(destination);

  return <SignupForm />;
}
