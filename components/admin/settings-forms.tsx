"use client";

import { useActionState, useState } from "react";
import { saveAdminNotificationEmails, saveShippingRate, saveWhatsapp } from "@/lib/admin/actions";
import {
  ADMIN_NOTIFICATION_EMAIL_MESSAGES,
  validateAdminNotificationEmails,
} from "@/lib/admin/notification-emails";
import { formatMoney } from "@/lib/money";
import { LoadingButton } from "@/components/loading/loading-button";
import { Input } from "@/components/ui/input";
import { Field, FormNote, initialFormState } from "./form-bits";

export function WhatsappForm({ number }: { number: string }) {
  const [state, action] = useActionState(saveWhatsapp, initialFormState);
  return (
    <form action={action} className="space-y-3">
      <Field label="رقم واتساب">
        <Input name="whatsapp_number" defaultValue={number} placeholder="01xxxxxxxxx" inputMode="tel" />
      </Field>
      <p className="text-[14px] text-graphite">
        يُحفظ الرقم في إعدادات المتجر. إذا تُرك بدون صف محفوظ يستخدم المتجر الرقم الاحتياطي من التشغيل، دون عرضه هنا.
      </p>
      <div className="flex items-center gap-3">
        <LoadingButton type="submit" size="sm" pendingLabel="جارٍ الحفظ">
          حفظ الرقم
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function AdminNotificationEmailsForm({
  emails,
  emptyListSaved,
}: {
  emails: string[];
  emptyListSaved: boolean;
}) {
  const [state, action] = useActionState(saveAdminNotificationEmails, initialFormState);
  const [list, setList] = useState(emails);
  const [draft, setDraft] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function addAddress() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setLocalError(ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty);
      return;
    }
    const result = validateAdminNotificationEmails([...list, trimmed]);
    if (!result.ok) {
      setLocalError(result.error);
      return;
    }
    setList(result.emails);
    setDraft("");
    setPendingRemove(null);
    setLocalError(null);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="emails_json" value={JSON.stringify(list)} />
      <p className="text-[14px] text-graphite">
        العناوين التي تستقبل إشعارات الطلبات الجديدة عند إتمام العميل للطلب.
      </p>
      {emptyListSaved && list.length === 0 ? (
        <p className="text-[14px] text-carbon-ink">لن يُرسل إشعار أدمن حتى تضيف عنواناً.</p>
      ) : null}
      {list.length === 0 ? (
        <p className="text-[14px] text-graphite">لا توجد عناوين محفوظة بعد.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((email) => (
            <li key={email.toLowerCase()} className="flex flex-wrap items-center justify-between gap-2 border-b border-mist pb-2 last:border-0">
              <span className="text-[14px] text-carbon-ink" dir="ltr">
                {email}
              </span>
              {pendingRemove === email ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-[4px] border border-ash-border px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
                    onClick={() => setPendingRemove(null)}
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-[4px] border border-ember-red px-3 text-[14px] font-bold tracking-[0.038em] text-ember-red focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
                    onClick={() => {
                      setList((current) => current.filter((item) => item !== email));
                      setPendingRemove(null);
                      setLocalError(null);
                    }}
                  >
                    تأكيد الحذف
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="inline-flex h-10 items-center rounded-[4px] border border-ash-border px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
                  onClick={() => setPendingRemove(email)}
                >
                  حذف
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <Field label="بريد إلكتروني">
        <Input
          type="email"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          dir="ltr"
          autoComplete="off"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className="inline-flex h-10 items-center rounded-[4px] border border-carbon-ink px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
          onClick={addAddress}
        >
          إضافة
        </button>
        <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
          حفظ القائمة
        </LoadingButton>
        <FormNote state={state} />
      </div>
      {localError ? <p className="text-[14px] text-carbon-ink">{localError}</p> : null}
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
  const [state, action] = useActionState(saveShippingRate, initialFormState);
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
        <LoadingButton type="submit" size="sm" pendingLabel="جارٍ الحفظ">
          {id ? "حفظ" : "إضافة"}
        </LoadingButton>
      </div>
      <div className="sm:col-span-3">
        <FormNote state={state} />
      </div>
    </form>
  );
}
