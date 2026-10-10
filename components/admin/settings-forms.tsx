"use client";

import { useActionState, useMemo, useState } from "react";
import {
  AdminEmpty,
  AdminList,
  AdminListCell,
  AdminListRow,
  adminFilterChipClass,
} from "@/components/admin/admin-ui";
import { saveAdminNotificationEmails, saveShippingRate, saveWhatsapp } from "@/lib/admin/actions";
import {
  ADMIN_NOTIFICATION_EMAIL_MESSAGES,
  validateAdminNotificationEmails,
  type AdminNotificationInbox,
} from "@/lib/admin/notification-emails";
import type { AdminShippingRate } from "@/lib/admin/queries";
import { SHIPPING_BANDS, filterShippingRates, shippingFiltersActive, type ShippingBand } from "@/lib/admin/shipping-filters";
import { piastersToPounds } from "@/lib/money";
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
      <div className="flex items-center gap-3">
        <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
          حفظ الرقم
        </LoadingButton>
        <FormNote state={state} />
      </div>
    </form>
  );
}

export function AdminNotificationEmailsForm({
  inboxes,
  emptyListSaved,
}: {
  inboxes: AdminNotificationInbox[];
  emptyListSaved: boolean;
}) {
  const [state, action] = useActionState(saveAdminNotificationEmails, initialFormState);
  const [list, setList] = useState(inboxes);
  const [draft, setDraft] = useState("");
  const [pendingRemove, setPendingRemove] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const isDirty = useMemo(() => {
    if (list.length !== inboxes.length) return true;
    return list.some((inbox, index) => {
      const original = inboxes[index];
      return !original || original.email !== inbox.email || original.enabled !== inbox.enabled;
    });
  }, [inboxes, list]);

  function addAddress() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setLocalError(ADMIN_NOTIFICATION_EMAIL_MESSAGES.empty);
      return;
    }
    const result = validateAdminNotificationEmails([...list, { email: trimmed, enabled: true }]);
    if (!result.ok) {
      setLocalError(result.error);
      return;
    }
    setList(result.inboxes);
    setDraft("");
    setPendingRemove(null);
    setLocalError(null);
  }

  function toggleEnabled(email: string) {
    setList((current) =>
      current.map((inbox) => (inbox.email === email ? { ...inbox, enabled: !inbox.enabled } : inbox))
    );
    setLocalError(null);
  }

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="emails_json" value={JSON.stringify(list)} />
      {emptyListSaved && list.length === 0 ? (
        <p className="text-[14px] text-carbon-ink">لن يُرسل إشعار أدمن حتى تضيف عنواناً.</p>
      ) : null}
      {list.length > 0 && list.every((inbox) => !inbox.enabled) ? (
        <p className="text-[14px] text-carbon-ink">كل العناوين معطّلة. لن يُرسل إشعار أدمن بعد الحفظ.</p>
      ) : null}
      {list.length === 0 ? (
        <p className="text-[14px] text-graphite">لا توجد عناوين محفوظة بعد.</p>
      ) : (
        <ul className="space-y-2">
          {list.map((inbox) => (
            <li
              key={inbox.email.toLowerCase()}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-mist pb-2 last:border-0"
            >
              <span className={`text-[14px] ${inbox.enabled ? "text-carbon-ink" : "text-graphite"}`} dir="ltr">
                {inbox.email}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex min-h-6 items-center rounded-full border px-2 text-[12px] ${
                    inbox.enabled
                      ? "border-carbon-ink bg-carbon-ink text-paper-white"
                      : "border-ash-border bg-paper-white text-graphite"
                  }`}
                >
                  {inbox.enabled ? "مفعّل" : "معطّل"}
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={inbox.enabled}
                  aria-label={`إرسال إشعارات الطلبات إلى ${inbox.email}`}
                  title={inbox.enabled ? "إيقاف الإرسال" : "تفعيل الإرسال"}
                  className={`inline-flex h-10 min-h-10 w-12 shrink-0 items-center rounded-full border px-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink ${
                    inbox.enabled ? "justify-end border-carbon-ink bg-carbon-ink" : "justify-start border-ash-border bg-fog"
                  }`}
                  onClick={() => toggleEnabled(inbox.email)}
                >
                  <span className="sr-only">{inbox.enabled ? "إيقاف الإرسال" : "تفعيل الإرسال"}</span>
                  <span className="block size-7 rounded-full bg-paper-white" />
                </button>
                {pendingRemove === inbox.email ? (
                  <>
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
                        setList((current) => current.filter((item) => item.email !== inbox.email));
                        setPendingRemove(null);
                        setLocalError(null);
                      }}
                    >
                      تأكيد الحذف
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    className="inline-flex h-10 items-center rounded-[4px] border border-ash-border px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
                    onClick={() => setPendingRemove(inbox.email)}
                  >
                    حذف
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {list.length > 0 ? (
        <p className="text-[14px] text-graphite">المفعّل يستقبل إشعار الطلب الجديد</p>
      ) : null}
      {isDirty ? (
        <p className="text-[14px] text-carbon-ink">التغييرات غير محفوظة — اضغط حفظ القائمة</p>
      ) : null}
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

const shippingColumns = "lg:grid-cols-[1.4fr_1fr_auto]";

export function ShippingRatesPanel({ rates }: { rates: AdminShippingRate[] }) {
  const [query, setQuery] = useState("");
  const [band, setBand] = useState<ShippingBand>("all");
  const [minPounds, setMinPounds] = useState("");
  const [maxPounds, setMaxPounds] = useState("");

  const filtered = useMemo(
    () => filterShippingRates(rates, { query, band, minPounds, maxPounds }),
    [band, maxPounds, minPounds, query, rates]
  );
  const filtersActive = shippingFiltersActive({ query, band, minPounds, maxPounds });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="بحث بالمحافظة">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} />
        </Field>
        {band === "range" ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="حد أدنى (ج.م)">
              <Input
                dir="ltr"
                inputMode="numeric"
                value={minPounds}
                onChange={(event) => setMinPounds(event.target.value)}
              />
            </Field>
            <Field label="حد أقصى (ج.م)">
              <Input
                dir="ltr"
                inputMode="numeric"
                value={maxPounds}
                onChange={(event) => setMaxPounds(event.target.value)}
              />
            </Field>
          </div>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {SHIPPING_BANDS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={adminFilterChipClass(band === item.id)}
            aria-pressed={band === item.id}
            onClick={() => setBand(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {rates.length > 0 ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[14px] text-graphite">
            {filtered.length} محافظة من أصل {rates.length}
          </p>
          {filtersActive ? (
            <button
              type="button"
              className="inline-flex h-10 items-center rounded-[4px] border border-carbon-ink px-3 text-[14px] font-bold tracking-[0.038em] text-carbon-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"
              onClick={() => {
                setQuery("");
                setBand("all");
                setMinPounds("");
                setMaxPounds("");
              }}
            >
              مسح التصفية
            </button>
          ) : null}
        </div>
      ) : null}
      {rates.length === 0 ? (
        <AdminEmpty>لا توجد محافظات بعد.</AdminEmpty>
      ) : filtered.length === 0 ? (
        <AdminEmpty>لا توجد محافظات مطابقة.</AdminEmpty>
      ) : (
        <AdminList columns={["المحافظة", "الرسوم", "حفظ"]} gridClass={shippingColumns}>
          {filtered.map((rate) => (
            <ShippingRateForm
              key={rate.id}
              id={rate.id}
              governorate={rate.governorate}
              ratePiasters={rate.rate_piasters}
            />
          ))}
        </AdminList>
      )}
      <div className="border-t border-mist pt-4">
        <h3 className="mb-3 text-[14px] font-bold tracking-[0.038em]">محافظة جديدة</h3>
        <ShippingRateForm />
      </div>
    </div>
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
  const [rate, setRate] = useState(ratePiasters == null ? "" : String(piastersToPounds(ratePiasters)));

  const rateField = (
    <div className="flex items-center gap-2">
      <Input
        name="rate_pounds"
        dir="ltr"
        inputMode="decimal"
        value={rate}
        onChange={(event) => setRate(event.target.value)}
        required
      />
      <span className="shrink-0 text-[14px] text-graphite">ج.م</span>
    </div>
  );

  const fields = (
    <>
      {id ? (
        <AdminListCell label="المحافظة">
          <input type="hidden" name="id" value={id} />
          <p className="flex min-h-10 items-center text-[14px] text-carbon-ink">{governorate}</p>
        </AdminListCell>
      ) : (
        <Field label="المحافظة">
          <Input name="governorate" required />
        </Field>
      )}
      {id ? (
        <AdminListCell label="الرسوم">
          {rateField}
        </AdminListCell>
      ) : (
        <Field label="الرسوم (ج.م)">{rateField}</Field>
      )}
      {id ? (
        <AdminListCell label="حفظ">
          <div className="flex flex-col items-start gap-2">
            <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
              حفظ
            </LoadingButton>
            <FormNote state={state} />
          </div>
        </AdminListCell>
      ) : (
        <div className="flex items-center gap-3 pb-1">
          <LoadingButton type="submit" pendingLabel="جارٍ الحفظ">
            إضافة
          </LoadingButton>
        </div>
      )}
      {id ? null : (
        <div className="sm:col-span-3">
          <FormNote state={state} />
        </div>
      )}
    </>
  );

  if (id) {
    return (
      <AdminListRow gridClass={shippingColumns}>
        <form action={action} className="contents">
          {fields}
        </form>
      </AdminListRow>
    );
  }

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-end">
      {fields}
    </form>
  );
}
