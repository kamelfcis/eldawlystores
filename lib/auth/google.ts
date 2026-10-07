import { GOOGLE_AUTH_UNAVAILABLE } from "@/lib/auth/errors";
import { isSupabaseConfigured, getSupabaseAnonKey } from "@/lib/supabase/config";

export async function continueWithGoogle(setError: (message: string) => void) {
  if (!isSupabaseConfigured()) {
    setError(GOOGLE_AUTH_UNAVAILABLE);
    return;
  }

  try {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      setError(GOOGLE_AUTH_UNAVAILABLE);
      return;
    }

    const anonKey = getSupabaseAnonKey();
    const response = await fetch(data.url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
    });
    if (!response.ok) {
      setError(GOOGLE_AUTH_UNAVAILABLE);
      return;
    }

    const body: unknown = await response.json();
    const nextUrl =
      body && typeof body === "object" && "url" in body && typeof body.url === "string"
        ? body.url
        : null;
    if (!nextUrl) {
      setError(GOOGLE_AUTH_UNAVAILABLE);
      return;
    }

    window.location.assign(nextUrl);
  } catch {
    setError(GOOGLE_AUTH_UNAVAILABLE);
  }
}
