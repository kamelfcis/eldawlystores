"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_SPEC_ROWS, type ProductSpec } from "@/lib/catalog/product-specs";

function emptyRow(): ProductSpec {
  return { label: "", value: "" };
}

export function ProductSpecsField({ initial }: { initial: ProductSpec[] }) {
  const [rows, setRows] = useState<ProductSpec[]>(initial.length > 0 ? initial : [emptyRow()]);

  function update(index: number, key: keyof ProductSpec, value: string) {
    setRows((current) => current.map((row, rowIndex) => (rowIndex === index ? { ...row, [key]: value } : row)));
  }

  function move(index: number, direction: -1 | 1) {
    const next = index + direction;
    if (next < 0 || next >= rows.length) return;
    setRows((current) => {
      const copy = [...current];
      const [row] = copy.splice(index, 1);
      copy.splice(next, 0, row);
      return copy;
    });
  }

  return (
    <fieldset className="space-y-3 sm:col-span-2">
      <legend className="text-[14px] font-bold tracking-[0.038em] text-carbon-ink">المواصفات</legend>
      <p className="text-[14px] text-graphite">أضف أزواج الاسم والقيمة. تظهر في صفحة المنتج وفي المقارنة.</p>
      <ul className="space-y-2">
        {rows.map((row, index) => (
          <li key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block space-y-1 text-[14px]">
              <span className="text-graphite">الاسم</span>
              <Input
                name="specs_label"
                value={row.label}
                onChange={(event) => update(index, "label", event.target.value)}
                maxLength={80}
              />
            </label>
            <label className="block space-y-1 text-[14px]">
              <span className="text-graphite">القيمة</span>
              <Input
                name="specs_value"
                value={row.value}
                onChange={(event) => update(index, "value", event.target.value)}
                maxLength={200}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => move(index, -1)}>
                أعلى
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={index === rows.length - 1} onClick={() => move(index, 1)}>
                أسفل
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRows((current) => (current.length <= 1 ? [emptyRow()] : current.filter((_, rowIndex) => rowIndex !== index)))}
              >
                حذف
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        disabled={rows.length >= MAX_SPEC_ROWS}
        onClick={() => setRows((current) => (current.length >= MAX_SPEC_ROWS ? current : [...current, emptyRow()]))}
      >
        إضافة مواصفة
      </Button>
    </fieldset>
  );
}
