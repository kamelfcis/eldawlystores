"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGovernorates } from "@/lib/promotions";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { Database } from "@/lib/types/database";

type AddressRow = Database["public"]["Tables"]["addresses"]["Row"];

interface AddressDraft {
  label: string;
  governorate: string;
  city: string;
  area: string;
  street: string;
  building: string;
  floor: string;
  phone: string;
  isDefault: boolean;
}

const EMPTY_DRAFT: AddressDraft = {
  label: "",
  governorate: "",
  city: "",
  area: "",
  street: "",
  building: "",
  floor: "",
  phone: "",
  isDefault: false,
};

const FIELD_LABELS: { key: keyof Omit<AddressDraft, "isDefault">; message: string }[] = [
  { key: "label", message: "التسمية مطلوبة" },
  { key: "governorate", message: "المحافظة مطلوبة" },
  { key: "city", message: "المدينة مطلوبة" },
  { key: "area", message: "المنطقة مطلوبة" },
  { key: "street", message: "الشارع مطلوب" },
  { key: "building", message: "المبنى مطلوب" },
  { key: "floor", message: "الدور مطلوب" },
  { key: "phone", message: "رقم الهاتف مطلوب" },
];

const SAVE_ERROR = "تعذر حفظ البيانات";

function fieldErrors(draft: AddressDraft): string[] {
  return FIELD_LABELS.filter(({ key }) => !draft[key].trim()).map(({ message }) => message);
}

function draftFromAddress(address: AddressRow): AddressDraft {
  return {
    label: address.label,
    governorate: address.governorate,
    city: address.city,
    area: address.area,
    street: address.street,
    building: address.building ?? "",
    floor: address.floor ?? "",
    phone: address.phone,
    isDefault: address.is_default,
  };
}

export default function AddressesPage() {
  const [governorates, setGovernorates] = useState<string[]>(() => (isSupabaseConfigured() ? [] : getGovernorates()));
  const [userId, setUserId] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<AddressRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<AddressDraft>(EMPTY_DRAFT);
  const [fieldErrorList, setFieldErrorList] = useState<string[]>([]);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const loadAddresses = useCallback(async (id: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("addresses")
      .select("id, user_id, label, governorate, city, area, street, building, floor, phone, is_default, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: true });
    if (error) throw new Error("load");
    setAddresses(data ?? []);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isSupabaseConfigured()) {
        setLoading(false);
        return;
      }
      try {
        const supabase = createClient();
        const { data: rates, error: ratesError } = await supabase.from("shipping_rates").select("governorate").order("governorate");
        if (!cancelled && !ratesError) setGovernorates((rates ?? []).map((rate) => rate.governorate));
        const { data } = await supabase.auth.getUser();
        const id = data.user?.id ?? null;
        if (cancelled) return;
        setUserId(id);
        if (id) await loadAddresses(id);
      } catch {
        if (!cancelled) setFormError("تعذر تحميل العناوين");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [loadAddresses]);

  function openAdd() {
    setEditingId(null);
    setDraft({ ...EMPTY_DRAFT, isDefault: addresses.length === 0 });
    setFieldErrorList([]);
    setFormError("");
    setShowForm(true);
  }

  function openEdit(address: AddressRow) {
    setEditingId(address.id);
    setDraft(draftFromAddress(address));
    setFieldErrorList([]);
    setFormError("");
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setDraft(EMPTY_DRAFT);
    setFieldErrorList([]);
    setFormError("");
  }

  function updateDraft<K extends keyof AddressDraft>(key: K, value: AddressDraft[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }

  async function clearOtherDefaults(id: string, keepId?: string) {
    const supabase = createClient();
    let query = supabase.from("addresses").update({ is_default: false }).eq("user_id", id);
    if (keepId) query = query.neq("id", keepId);
    const { error } = await query;
    if (error) throw new Error("clear");
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const errors = fieldErrors(draft);
    setFieldErrorList(errors);
    setFormError("");
    if (errors.length > 0 || !userId) {
      if (!userId) setFormError(SAVE_ERROR);
      return;
    }

    const editing = addresses.find((row) => row.id === editingId);
    if (editing?.is_default && !draft.isDefault && addresses.length > 1) {
      setFormError("يجب أن يبقى عنوان افتراضي واحد");
      return;
    }

    const makeDefault = draft.isDefault || addresses.length === 0 || (editingId != null && addresses.length === 1);
    const payload = {
      label: draft.label.trim(),
      governorate: draft.governorate.trim(),
      city: draft.city.trim(),
      area: draft.area.trim(),
      street: draft.street.trim(),
      building: draft.building.trim(),
      floor: draft.floor.trim(),
      phone: draft.phone.trim(),
      is_default: makeDefault,
    };

    setSaving(true);
    try {
      const supabase = createClient();
      if (makeDefault) {
        await clearOtherDefaults(userId, editingId ?? undefined);
      }

      if (editingId) {
        const { error } = await supabase.from("addresses").update(payload).eq("id", editingId).eq("user_id", userId);
        if (error) throw new Error("save");
      } else {
        const { error } = await supabase.from("addresses").insert({ ...payload, user_id: userId });
        if (error) throw new Error("save");
      }

      await loadAddresses(userId);
      closeForm();
    } catch {
      setFormError(SAVE_ERROR);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(address: AddressRow) {
    if (!userId) return;
    setFormError("");
    try {
      const supabase = createClient();
      const { error } = await supabase.from("addresses").delete().eq("id", address.id).eq("user_id", userId);
      if (error) throw new Error("delete");

      const remaining = addresses.filter((row) => row.id !== address.id);
      if (address.is_default && remaining.length > 0) {
        await clearOtherDefaults(userId, remaining[0].id);
        const { error: defaultError } = await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", remaining[0].id)
          .eq("user_id", userId);
        if (defaultError) throw new Error("default");
      }

      await loadAddresses(userId);
      if (editingId === address.id) closeForm();
    } catch {
      setFormError(SAVE_ERROR);
    }
  }

  async function handleSetDefault(address: AddressRow) {
    if (!userId || address.is_default) return;
    setFormError("");
    try {
      await clearOtherDefaults(userId, address.id);
      const supabase = createClient();
      const { error } = await supabase
        .from("addresses")
        .update({ is_default: true })
        .eq("id", address.id)
        .eq("user_id", userId);
      if (error) throw new Error("default");
      await loadAddresses(userId);
    } catch {
      setFormError(SAVE_ERROR);
    }
  }

  const governorateOptions = draft.governorate && !governorates.includes(draft.governorate)
    ? [draft.governorate, ...governorates]
    : governorates;

  return (
    <div className="max-w-lg space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">العناوين</h1>
        <Button size="sm" onClick={() => (showForm ? closeForm() : openAdd())} disabled={!userId && !loading}>
          {showForm ? "إلغاء" : "إضافة عنوان"}
        </Button>
      </div>

      {formError && !showForm && <p className="text-ember-red text-sm">{formError}</p>}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{editingId ? "تعديل العنوان" : "عنوان جديد"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-3">
              <Input placeholder="تسمية (المنزل، العمل)" value={draft.label} onChange={(e) => updateDraft("label", e.target.value)} />
              <select
                value={draft.governorate}
                onChange={(e) => updateDraft("governorate", e.target.value)}
                className="flex h-10 w-full rounded-[4px] border border-mist bg-paper-white px-3 text-sm"
              >
                <option value="">المحافظة</option>
                {governorateOptions.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
              <Input placeholder="المدينة" value={draft.city} onChange={(e) => updateDraft("city", e.target.value)} />
              <Input placeholder="المنطقة" value={draft.area} onChange={(e) => updateDraft("area", e.target.value)} />
              <Input placeholder="الشارع" value={draft.street} onChange={(e) => updateDraft("street", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="المبنى" value={draft.building} onChange={(e) => updateDraft("building", e.target.value)} />
                <Input placeholder="الدور" value={draft.floor} onChange={(e) => updateDraft("floor", e.target.value)} />
              </div>
              <Input placeholder="رقم الهاتف" value={draft.phone} onChange={(e) => updateDraft("phone", e.target.value)} />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={draft.isDefault || addresses.length === 0}
                  disabled={addresses.length === 0 || (editingId != null && addresses.length === 1)}
                  onChange={(e) => updateDraft("isDefault", e.target.checked)}
                />
                عنوان افتراضي
              </label>
              {fieldErrorList.length > 0 && (
                <ul className="text-ember-red text-sm space-y-1">
                  {fieldErrorList.map((message) => <li key={message}>{message}</li>)}
                </ul>
              )}
              {formError && <p className="text-ember-red text-sm">{formError}</p>}
              <Button type="submit" disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ العنوان"}</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {loading && <p className="text-graphite text-sm">جاري تحميل العناوين...</p>}

      {!loading && !userId && (
        <p className="text-graphite text-sm">سجّل الدخول لإدارة عناوينك</p>
      )}

      {!loading && userId && addresses.length === 0 && !showForm && (
        <p className="text-graphite text-sm">لا توجد عناوين محفوظة</p>
      )}

      {addresses.map((addr) => (
        <Card key={addr.id}>
          <CardContent className="pt-4 space-y-2">
            <p className="font-medium">
              {addr.label} {addr.is_default && <span className="text-xs text-graphite">(افتراضي)</span>}
            </p>
            <p className="text-sm text-graphite">
              {addr.street}، {addr.area}، {addr.city}، {addr.governorate}
            </p>
            <p className="text-sm text-graphite">
              مبنى {addr.building}، دور {addr.floor} — {addr.phone}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => openEdit(addr)}>تعديل</Button>
              {!addr.is_default && (
                <Button type="button" size="sm" variant="outline" onClick={() => handleSetDefault(addr)}>
                  تعيين كافتراضي
                </Button>
              )}
              <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(addr)}>حذف</Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
