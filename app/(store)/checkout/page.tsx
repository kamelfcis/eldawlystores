"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/cart/cart-provider";
import { reviewCheckoutTotals } from "@/lib/checkout/review";
import { isCheckoutSuccess } from "@/lib/checkout/success";
import { formatMoney } from "@/lib/money";
import { mockShippingRates } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { CheckoutStepper } from "@/components/checkout/checkout-stepper";
import { LoadingButton } from "@/components/loading/loading-button";
import { useDeferredBusy } from "@/components/loading/use-deferred-busy";
import { ROUTE_OPERATION_ID, startOperation } from "@/lib/loading/operations";

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

interface ShippingOption {
  governorate: string;
  ratePiasters: number;
}

function mockShippingOptions(): ShippingOption[] {
  return mockShippingRates.map((rate) => ({
    governorate: rate.governorate,
    ratePiasters: rate.rate_piasters,
  }));
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
  const [governorate, setGovernorate] = useState("");
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>(() =>
    isSupabaseConfigured() ? [] : mockShippingOptions()
  );
  const showPrefillWait = useDeferredBusy(!ready);

  useEffect(() => {
    let cancelled = false;

    async function loadPrefill() {
      if (!isSupabaseConfigured()) {
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const supabase = createClient();
        const { data: rates, error: ratesError } = await supabase
          .from("shipping_rates")
          .select("governorate, rate_piasters")
          .order("governorate");
        if (!cancelled && !ratesError) {
          setShippingOptions(
            (rates ?? []).map((rate) => ({
              governorate: rate.governorate,
              ratePiasters: rate.rate_piasters,
            }))
          );
        }
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
        setGovernorate(address?.governorate ?? "");
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

  const governorateNames = shippingOptions.map((option) => option.governorate);
  const ratesMissing = shippingOptions.length === 0;
  const governorateOptions =
    !ratesMissing && prefill.governorate && !governorateNames.includes(prefill.governorate)
      ? [prefill.governorate, ...governorateNames]
      : governorateNames;
  const selectedRate = shippingOptions.find((option) => option.governorate === governorate);
  const reviewTotals = reviewCheckoutTotals(totalPiasters, selectedRate?.ratePiasters ?? null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;
    if (ratesMissing) {
      setError("لا توجد محافظات متاحة");
      return;
    }
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

    let confirmed = false;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; accessToken?: string };
      if (!res.ok || !isCheckoutSuccess(data)) {
        setError(data.error ?? "حدث خطأ");
        return;
      }
      clear();
      startOperation(ROUTE_OPERATION_ID);
      router.push(`/order/${data.accessToken}?confirmed=1`);
      confirmed = true;
    } catch {
      setError("حدث خطأ في الاتصال");
    } finally {
      if (!confirmed) setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">إتمام الطلب</h1>
      <CheckoutStepper />

      {!ready ? (
        showPrefillWait ? <p className="text-sm text-graphite" role="status">جاري تحميل بياناتك...</p> : <div className="h-10" aria-hidden="true" />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8" aria-busy={loading}>
          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">1. بيانات التواصل</legend>
            <Input name="customerName" placeholder="الاسم الكامل" required defaultValue={prefill.customerName} />
            <Input name="customerEmail" type="email" placeholder="البريد الإلكتروني" required defaultValue={prefill.customerEmail} />
            <Input name="customerPhone" type="tel" placeholder="رقم الهاتف" required defaultValue={prefill.customerPhone} />
          </fieldset>

          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">2. عنوان الشحن</legend>
            {ratesMissing ? (
              <p className="text-sm text-ember-red">لا توجد محافظات متاحة</p>
            ) : (
              <>
                <label htmlFor="governorate" className="text-sm font-bold text-retail-ink">المحافظة</label>
                <select
                  id="governorate"
                  name="governorate"
                  required
                  value={governorate}
                  onChange={(event) => setGovernorate(event.target.value)}
                  className="flex h-10 w-full rounded-[4px] border border-mist bg-paper-white px-3 text-sm"
                >
                  <option value="">اختر المحافظة</option>
                  {governorateOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {selectedRate ? (
                  <p className="text-sm text-graphite">الشحن {formatMoney(selectedRate.ratePiasters)}</p>
                ) : null}
              </>
            )}
            <Input name="city" placeholder="المدينة" required defaultValue={prefill.city} />
            <Input name="street" placeholder="الشارع" required defaultValue={prefill.street} />
            <div className="grid grid-cols-2 gap-4">
              <Input name="building" placeholder="المبنى (اختياري)" defaultValue={prefill.building} />
              <Input name="floor" placeholder="الدور (اختياري)" defaultValue={prefill.floor} />
            </div>
          </fieldset>

          <fieldset className="space-y-4 rounded-[8px] border border-mist p-4">
            <legend className="px-1 text-[16px] font-bold text-retail-ink">3. المراجعة والتأكيد</legend>
            <ul className="space-y-3">
              {cart.items.map((item) => (
                <li key={item.variantId} className="flex gap-3 border-b border-mist pb-3">
                  <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] bg-fog">
                    <Image src={item.imageUrl} alt={item.productName} fill className="object-contain p-1" />
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-[14px] font-medium text-retail-ink">{item.productName}</p>
                    <p className="font-mono text-xs text-graphite">{item.variantSku}</p>
                    <p className="text-sm text-graphite">الكمية {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-retail-ink">{formatMoney(item.unitPricePiasters * item.quantity)}</p>
                </li>
              ))}
            </ul>
            <Input name="promoCode" placeholder="كود الخصم (اختياري)" />
            <p className="text-sm text-graphite">الدفع: نقداً عند الاستلام</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>المجموع الفرعي</span>
                <span>{formatMoney(reviewTotals.subtotalPiasters)}</span>
              </div>
              {reviewTotals.shippingPiasters != null && reviewTotals.orderTotalPiasters != null ? (
                <>
                  <div className="flex justify-between text-graphite">
                    <span>الشحن</span>
                    <span>{formatMoney(reviewTotals.shippingPiasters)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-retail-ink">
                    <span>الإجمالي</span>
                    <span>{formatMoney(reviewTotals.orderTotalPiasters)}</span>
                  </div>
                </>
              ) : null}
            </div>
          </fieldset>

          {error && <p className="text-ember-red text-sm">{error}</p>}

          <LoadingButton type="submit" size="lg" className="w-full" pending={loading} pendingLabel="جارٍ تأكيد الطلب" disabled={ratesMissing}>
            تأكيد الطلب
          </LoadingButton>
        </form>
      )}
    </div>
  );
}
