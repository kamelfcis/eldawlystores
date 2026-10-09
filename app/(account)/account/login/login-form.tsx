"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GOOGLE_AUTH_UNAVAILABLE, authErrorMessage } from "@/lib/auth/errors";
import { continueWithGoogle } from "@/lib/auth/google";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function LoginForm({ callbackFailed }: { callbackFailed: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(callbackFailed ? GOOGLE_AUTH_UNAVAILABLE : "");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [signedIn, setSignedIn] = useState("");
  const redirectTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimer.current !== null) window.clearTimeout(redirectTimer.current);
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!isSupabaseConfigured()) {
      setError("المصادقة غير متاحة — Supabase غير مُعد");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError || !data.session || !data.user) {
        setError(authErrorMessage(authError));
        return;
      }

      let destination = "/account";
      let label = data.user.email?.trim() || email;
      const [{ data: roleRow }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", data.user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", data.user.id).maybeSingle(),
      ]);
      const name = profile?.full_name?.trim();
      if (name) label = name;
      if (roleRow?.role === "admin") destination = "/admin";

      setSignedIn(label);
      redirectTimer.current = window.setTimeout(() => {
        window.location.assign(destination);
      }, 1200);
    } catch {
      setError(authErrorMessage(null));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setGoogleLoading(true);
    try {
      await continueWithGoogle(setError);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6 py-8">
      <h1 className="text-center text-[28px] font-bold text-retail-ink">تسجيل الدخول</h1>
      {signedIn ? (
        <div role="status" className="rounded-[8px] border border-mist bg-paper-white px-4 py-4">
          <p className="text-[16px] font-bold text-carbon-ink">تم تسجيل الدخول</p>
          <p className="mt-1 text-[14px] text-graphite">{signedIn}</p>
        </div>
      ) : null}
      {signedIn ? null : (
        <>
          <form onSubmit={handleLogin} className="space-y-4">
            <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} required />
            {error && <p className="text-ember-red text-sm">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "جاري الدخول..." : "دخول"}
            </Button>
          </form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-mist" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-fog px-2 text-graphite">أو</span></div>
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin} disabled={googleLoading}>
            المتابعة بحساب Google
          </Button>
          <p className="text-center text-sm text-graphite">
            ليس لديك حساب؟{" "}
            <Link href="/account/signup" className="text-carbon-ink hover:underline">إنشاء حساب</Link>
          </p>
        </>
      )}
    </div>
  );
}
