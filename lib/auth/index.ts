import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type AuthRole = "customer" | "admin" | null;

export interface SessionRole {
  userId: string;
  role: Exclude<AuthRole, null>;
}

export async function getSessionRole(): Promise<SessionRole | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error || !data) {
      return { userId: user.id, role: "customer" };
    }

    return { userId: user.id, role: data.role === "admin" ? "admin" : "customer" };
  } catch {
    return null;
  }
}

export async function getCurrentUserRole(): Promise<AuthRole> {
  const session = await getSessionRole();
  return session?.role ?? null;
}

export async function isAdmin(): Promise<boolean> {
  const session = await getSessionRole();
  return session?.role === "admin";
}

export interface AccountMenu {
  name: string | null;
  email: string;
  isAdmin: boolean;
}

export async function getAccountMenu(): Promise<AccountMenu | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) return null;

    const [{ data: profile }, admin] = await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      isAdmin(),
    ]);

    return {
      name: profile?.full_name?.trim() || null,
      email: user.email,
      isAdmin: admin,
    };
  } catch {
    return null;
  }
}

export async function assertAdmin(): Promise<{ userId: string }> {
  const session = await getSessionRole();
  if (!session) redirect("/account/login");
  if (session.role !== "admin") redirect("/");
  return { userId: session.userId };
}
