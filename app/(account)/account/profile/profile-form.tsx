"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProfile } from "@/hooks/use-profile";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { authErrorMessage } from "@/lib/auth/errors";
import { validatePasswordChange } from "@/lib/account/password-validation";

const SAVE_ERROR = "تعذر حفظ البيانات";
const EMAIL_CONFIRMATION_NOTICE =
  "تم إرسال رسالة تأكيد إلى البريد الإلكتروني الجديد. لن يتغير البريد حتى يتم التأكيد.";
const PASSWORD_SUCCESS = "تم تغيير كلمة المرور";
const GOOGLE_PASSWORD_NOTICE =
  "حسابك مربوط بجوجل. يمكنك تعيين كلمة مرور للدخول بالبريد لاحقاً.";

const fieldClass = "space-y-1.5";
const labelClass = "text-[14px] font-bold text-retail-ink";

function emailChangeNeedsConfirmation(requestedEmail: string, user: User | null): boolean {
  if (!user) return false;
  if (user.new_email) return true;
  return (user.email ?? "").toLowerCase() !== requestedEmail.toLowerCase();
}

function hasEmailPasswordIdentity(user: User | null): boolean {
  return (user?.identities ?? []).some((identity) => identity.provider === "email");
}

export function ProfileForm({ userId, email: sessionEmail }: { userId: string | null; email: string }) {
  const router = useRouter();
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

  const [authUser, setAuthUser] = useState<User | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordNotice, setPasswordNotice] = useState("");

  const requiresCurrentPassword = hasEmailPasswordIdentity(authUser);

  useEffect(() => {
    if (!userId) {
      router.replace("/account/login");
    }
  }, [userId, router]);

  useEffect(() => {
    if (!data) return;
    setFullName(data.full_name ?? "");
    setPhone(data.phone ?? "");
  }, [data]);

  useEffect(() => {
    setEmail(sessionEmail);
    setBaselineEmail(sessionEmail);
  }, [sessionEmail]);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured()) return;
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data: userData }) => {
      setAuthUser(userData.user ?? null);
    });
  }, [userId]);

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

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordNotice("");

    if (!userId || !isSupabaseConfigured()) {
      setPasswordError(SAVE_ERROR);
      return;
    }

    const validationError = validatePasswordChange({
      currentPassword,
      newPassword,
      confirmPassword,
      requiresCurrent: requiresCurrentPassword,
    });
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setPasswordSaving(true);
    try {
      const supabase = createClient();
      const loginEmail = authUser?.email ?? baselineEmail;

      if (requiresCurrentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: loginEmail,
          password: currentPassword,
        });
        if (signInError) {
          setPasswordError(authErrorMessage(signInError));
          return;
        }
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
      if (updateError) {
        setPasswordError(authErrorMessage(updateError));
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordNotice(PASSWORD_SUCCESS);
      const { data: userData } = await supabase.auth.getUser();
      setAuthUser(userData.user ?? null);
    } catch {
      setPasswordError(SAVE_ERROR);
    } finally {
      setPasswordSaving(false);
    }
  }

  if (!userId) return null;

  return (
    <div className="max-w-md space-y-6">
      <h1 className="text-2xl font-bold text-retail-ink">الملف الشخصي</h1>

      <Card className="border-retail-line">
        <CardHeader>
          <CardTitle className="text-base text-retail-ink">البيانات الشخصية</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="space-y-4">
            <div className={fieldClass}>
              <label htmlFor="profile-full-name" className={labelClass}>
                الاسم الكامل
              </label>
              <Input
                id="profile-full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                className="h-10"
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="profile-phone" className={labelClass}>
                رقم الهاتف
              </label>
              <Input
                id="profile-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                inputMode="tel"
                dir="ltr"
                autoComplete="tel"
                className="h-10"
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="profile-email" className={labelClass}>
                البريد الإلكتروني
              </label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                dir="ltr"
                autoComplete="email"
                className="h-10"
              />
            </div>
            {notice ? <p className="text-sm text-graphite">{notice}</p> : null}
            {error ? <p className="text-sm text-ember-red">{error}</p> : null}
            <Button type="submit" disabled={saving} className="h-10 min-h-10">
              {saved ? "تم الحفظ ✓" : saving ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-retail-line">
        <CardHeader>
          <CardTitle className="text-base text-retail-ink">تغيير كلمة المرور</CardTitle>
        </CardHeader>
        <CardContent>
          {!requiresCurrentPassword ? (
            <p className="mb-4 text-[14px] text-graphite">{GOOGLE_PASSWORD_NOTICE}</p>
          ) : null}
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {requiresCurrentPassword ? (
              <div className={fieldClass}>
                <label htmlFor="profile-current-password" className={labelClass}>
                  كلمة المرور الحالية
                </label>
                <Input
                  id="profile-current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  autoComplete="current-password"
                  className="h-10"
                />
              </div>
            ) : null}
            <div className={fieldClass}>
              <label htmlFor="profile-new-password" className={labelClass}>
                كلمة المرور الجديدة
              </label>
              <Input
                id="profile-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="h-10"
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="profile-confirm-password" className={labelClass}>
                تأكيد كلمة المرور الجديدة
              </label>
              <Input
                id="profile-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                minLength={8}
                className="h-10"
              />
            </div>
            {passwordNotice ? <p className="text-sm text-graphite">{passwordNotice}</p> : null}
            {passwordError ? <p className="text-sm text-ember-red">{passwordError}</p> : null}
            <Button type="submit" disabled={passwordSaving} className="h-10 min-h-10">
              {passwordSaving ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
