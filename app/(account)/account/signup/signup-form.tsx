"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authErrorMessage } from "@/lib/auth/errors";
import { continueWithGoogle } from "@/lib/auth/google";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");

    if (!isSupabaseConfigured()) {
      setError("التسجيل غير متاح — Supabase غير مُعد");
      setLoading(false);
      return;
    }

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (authError) {
        setError(authErrorMessage(authError));
        return;
      }
      const confirmed = Boolean(data.user?.email_confirmed_at);
      if (data.session && confirmed) {
        window.location.href = "/account";
        return;
      }
      if (data.session) {
        await supabase.auth.signOut();
      }
      setNotice("تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيد الحساب.");
    } catch {
      setError(authErrorMessage(null));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setNotice("");
    setGoogleLoading(true);
    try {
      await continueWithGoogle(setError);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto space-y-6 py-8">
      <h1 className="text-2xl font-bold text-center">إنشاء حساب</h1>
      <form onSubmit={handleSignup} className="space-y-4">
        <Input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        <Input type="email" placeholder="البريد الإلكتروني" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="كلمة المرور (8 أحرف على الأقل)" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
        {notice && <p className="text-sm text-carbon-ink">{notice}</p>}
        {error && <p className="text-ember-red text-sm">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "جاري التسجيل..." : "إنشاء حساب"}
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
        لديك حساب؟{" "}
        <Link href="/account/login" className="text-carbon-ink hover:underline">تسجيل الدخول</Link>
      </p>
    </div>
  );
}
