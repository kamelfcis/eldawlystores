"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { authErrorMessage } from "@/lib/auth/errors";

const SAVE_ERROR = "تعذر حفظ البيانات";
const EMAIL_CONFIRMATION_NOTICE = "تم إرسال رسالة تأكيد إلى البريد الإلكتروني الجديد. لن يتغير البريد حتى يتم التأكيد.";

function emailChangeNeedsConfirmation(requestedEmail: string, user: User | null): boolean {
  if (!user) return false;
  if (user.new_email) return true;
  return (user.email ?? "").toLowerCase() !== requestedEmail.toLowerCase();
}

export function ProfileForm({ userId, email: sessionEmail }: { userId: string | null; email: string }) {
  const { data } = useProfile(userId);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(sessionEmail);
  const [baselineEmail, setBaselineEmail] = useState(sessionEmail);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name ?? "");
    setPhone(data.phone ?? "");
  }, [data]);

  useEffect(() => {
    setEmail(sessionEmail);
    setBaselineEmail(sessionEmail);
  }, [sessionEmail]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaved(false);
    setError("");
    setNotice("");

    if (!userId || !isSupabaseConfigured()) {
      setError(SAVE_ERROR);
      return;
    }

    const nextEmail = email.trim();
    if (!nextEmail) {
      setError(SAVE_ERROR);
      return;
    }

    setSaving(true);
    try {
      const supabase = createClient();
      const { data: updated, error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          phone: phone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
        .select("id")
        .maybeSingle();

      if (profileError || !updated) {
        setError(SAVE_ERROR);
        return;
      }

      const emailChanged = nextEmail.toLowerCase() !== baselineEmail.trim().toLowerCase();
      if (emailChanged) {
        const { data: authData, error: emailError } = await supabase.auth.updateUser({ email: nextEmail });
        if (emailError) {
          setError(authErrorMessage(emailError));
          return;
        }
        if (emailChangeNeedsConfirmation(nextEmail, authData.user)) {
          setEmail(authData.user?.email ?? baselineEmail);
          setNotice(EMAIL_CONFIRMATION_NOTICE);
        } else {
          setBaselineEmail(nextEmail);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold">الملف الشخصي</h1>
      <Card>
        <CardHeader><CardTitle className="text-base">البيانات الشخصية</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <Input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <Input placeholder="رقم الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} />
            <Input
              type="email"
              placeholder="البريد الإلكتروني"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            {notice && <p className="text-sm text-graphite">{notice}</p>}
            {error && <p className="text-ember-red text-sm">{error}</p>}
            <Button type="submit" disabled={saving}>{saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
