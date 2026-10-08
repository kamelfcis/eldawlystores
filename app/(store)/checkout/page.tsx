"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGovernorates } from "@/lib/promotions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";

interface CheckoutPrefill {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  governorate: string;
  city: string;
  street: string;
  building: string;
  floor: string;
}

const EMPTY_PREFILL: CheckoutPrefill = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  governorate: "",
  city: "",
  street: "",
  building: "",
  floor: "",
};

export default function CheckoutPage() {
  const { cart, totalPiasters, clear } = useCart();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [prefill, setPrefill] = useState<CheckoutPrefill>(EMPTY_PREFILL);
  const [governorates, setGovernorates] = useState<string[]>(() => (isSupabaseConfigured() ? [] : getGovernorates()));

  useEffect(() => {
    let cancelled = false;

    async function loadPrefill() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data: rates, error: ratesError } = await supabase.from("shipping_rates").select("governorate").order("governorate");
        if (!cancelled && !ratesError) setGovernorates((rates ?? []).map((rate) => rate.governorate));
        const { data: authData } = await supabase.auth.getUser();
        const user = authData.user;
        if (!user) return;

        const [{ data: profile }, { data: addresses }] = await Promise.all([
          supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
          supabase
            .from("addresses")
            .select("governorate, city, street, building, floor, phone")
            .eq("user_id", user.id)
            .eq("is_default", true)
            .limit(1),
        ]);

        if (cancelled) return;
        const address = addresses?.[0];
        setPrefill({
          customerName: profile?.full_name ?? "",
          customerEmail: user.email ?? "",
          customerPhone: address?.phone?.trim() || profile?.phone || "",
          governorate: address?.governorate ?? "",
          city: address?.city ?? "",
          street: address?.street ?? "",
          building: address?.building ?? "",
          floor: address?.floor ?? "",
        });
      } catch {
        if (!cancelled) setPrefill(EMPTY_PREFILL);
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    loadPrefill();
    return () => {
      cancelled = true;
    };
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-graphite">السلة فارغة</p>
      </div>
    );
  }

  const governorateOptions = prefill.governorate && !governorates.includes(prefill.governorate)
    ? [prefill.governorate, ...governorates]
    : governorates;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData(e.currentTarget);
    const payload = {
      customerName: form.get("customerName") as string,
      customerEmail: form.get("customerEmail") as string,
      customerPhone: form.get("customerPhone") as string,
      governorate: form.get("governorate") as string,
      city: form.get("city") as string,
      street: form.get("street") as string,
      building: (form.get("building") as string) || undefined,
      floor: (form.get("floor") as string) || undefined,
      promoCode: (form.get("promoCode") as string) || undefined,
      paymentMethod: "cod" as const,
      items: cart.items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "حدث خطأ");
        return;
      }
      clear();
      router.push(`/order/${data.accessToken}?confirmed=1`);
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">إتمام الطلب</h1>
      <CheckoutStepper />

      {!ready ? (
        <p className="text-sm text-graphite">جاري تحميل بياناتك...</p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">1. بيانات التواصل</legend>
            <Input name="customerName" placeholder="الاسم الكامل" required defaultValue={prefill.customerName} />
            <Input name="customerEmail" type="email" placeholder="البريد الإلكتروني" required defaultValue={prefill.customerEmail} />
            <Input name="customerPhone" type="tel" placeholder="رقم الهاتف" required defaultValue={prefill.customerPhone} />
          </fieldset>

          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">2. عنوان الشحن</legend>
            <select name="governorate" required defaultValue={prefill.governorate} className="flex h-10 w-full rounded-[4px] border border-mist bg-paper-white px-3 text-sm">
              <option value="">اختر المحافظة</option>
              {governorateOptions.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
            <Input name="city" placeholder="المدينة" required defaultValue={prefill.city} />
            <Input name="street" placeholder="الشارع" required defaultValue={prefill.street} />
            <div className="grid grid-cols-2 gap-4">
              <Input name="building" placeholder="المبنى (اختياري)" defaultValue={prefill.building} />
              <Input name="floor" placeholder="الدور (اختياري)" defaultValue={prefill.floor} />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">3. المراجعة والتأكيد</legend>
            <Input name="promoCode" placeholder="كود الخصم (اختياري)" />
            <p className="text-sm text-graphite">الدفع: نقداً عند الاستلام</p>
            <div className="flex justify-between text-lg font-bold">
              <span>الإجمالي</span>
              <span>{formatMoney(totalPiasters)}</span>
            </div>
          </fieldset>

          {error && <p className="text-ember-red text-sm">{error}</p>}

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "جاري تأكيد الطلب..." : "تأكيد الطلب"}
          </Button>
        </form>
      )}
    </div>
  );
}
