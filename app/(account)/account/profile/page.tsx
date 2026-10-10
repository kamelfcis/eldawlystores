import { redirect } from "next/navigation";
import { getSessionRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await getSessionRole();
  if (!session?.userId) redirect("/account/login");

  let email = "";

  if (isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? "";
  }

  return <ProfileForm userId={session.userId} email={email} />;
}
