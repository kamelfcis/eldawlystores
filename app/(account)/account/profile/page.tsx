import { getSessionRole } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await getSessionRole();
  let email = "";

  if (session && isSupabaseConfigured()) {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    email = data.user?.email ?? "";
  }

  return <ProfileForm userId={session?.userId ?? null} email={email} />;
}
