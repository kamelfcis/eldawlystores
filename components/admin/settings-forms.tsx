"use client";

import { useActionState, useState } from "react";
import { saveShippingRate, saveWhatsapp } from "@/lib/admin/actions";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FormNote, initialFormState } from "./form-bits";

export function WhatsappForm({ number }: { number: string }) {
  const [state, action, pending] = useActionState(saveWhatsapp, initialFormState);
  return (
    <form action={action} className="space-y-3">
      <Field label="رقم واتساب">
        <Input name="whatsapp_number" defaultValue={number} placeholder="01xxxxxxxxx" inputMode="tel" />
      </Field>
      <p className="text-[14px] text-graphite">
        يُحفظ الرقم في إعدادات المتجر. إذا تُرك بدون صف محفوظ يستخدم المتجر الرقم الاحتياطي من التشغيل، دون عرضه هنا.
      </p>
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>
          حفظ الرقم
        </Button>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function ShippingRateForm({
  id,
  governorate,
  ratePiasters,
}: {
  id?: string;
  governorate?: string;
  ratePiasters?: number;
}) {
  const [state, action, pending] = useActionState(saveShippingRate, initialFormState);
  const [rate, setRate] = useState(ratePiasters == null ? "" : String(ratePiasters));
  const parsed = /^\d+$/.test(rate) ? Number(rate) : null;

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
      {id ? <input type="hidden" name="id" value={id} /> : null}
      <Field label="المحافظة">
        {id ? (
          <p className="flex h-10 items-center text-[14px] text-carbon-ink">{governorate}</p>
        ) : (
          <Input name="governorate" required />
        )}
      </Field>
      <Field label="الرسوم (قرش)">
        <Input
          name="rate_piasters"
          inputMode="numeric"
          value={rate}
          onChange={(event) => setRate(event.target.value)}
          required
        />
      </Field>
      <div className="flex items-center gap-3 pb-1">
        <span className="text-[14px] text-graphite">{parsed == null ? "—" : formatMoney(parsed)}</span>
        <Button type="submit" size="sm" disabled={pending}>
          {id ? "حفظ" : "إضافة"}
        </Button>
      </div>
      <div className="sm:col-span-3">
        <FormNote state={state} />
      </div>
    </form>
  );
}
