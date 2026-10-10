"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/cart/cart-provider";
import { REORDER_NOTICE_STORAGE_KEY } from "@/lib/account/reorder";
import { formatMoney } from "@/lib/money";
import { Button } from "@/components/ui/button";

export default function CartPage() {
  const { cart, totalPiasters, updateQuantity, removeItem } = useCart();
  const [reorderNotice, setReorderNotice] = useState("");

  useEffect(() => {
    const notice = sessionStorage.getItem(REORDER_NOTICE_STORAGE_KEY);
    if (!notice) return;
    sessionStorage.removeItem(REORDER_NOTICE_STORAGE_KEY);
    setReorderNotice(notice);
  }, []);

  if (cart.items.length === 0) {
    return (
      <div className="text-center py-16 space-y-4">
        <p className="text-lg text-graphite">سلتك فارغة</p>
        <Button asChild>
          <Link href="/products">تسوق الآن</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">سلة التسوق</h1>
      {reorderNotice ? (
        <p role="status" className="rounded-[8px] border border-retail-line bg-fog px-4 py-3 text-[14px] text-graphite">
          {reorderNotice}
        </p>
      ) : null}

      <div className="space-y-4">
        {cart.items.map((item) => (
          <div key={item.variantId} className="flex gap-4 p-4 rounded-[8px] border border-mist bg-paper-white">
            <div className="relative h-20 w-20 shrink-0 rounded-[4px] bg-fog overflow-hidden">
              <Image src={item.imageUrl} alt={item.productName} fill className="object-contain p-1" />
            </div>
            <div className="flex-1 space-y-1">
              <Link href={`/products/${item.productSlug}`} className="font-medium hover:underline">
                {item.productName}
              </Link>
              <p className="font-mono text-xs text-graphite">{item.variantSku}</p>
              <p className="font-semibold">{formatMoney(item.unitPricePiasters)}</p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="h-8 w-8 rounded-[4px] border border-mist hover:bg-fog"
                >
                  −
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="h-8 w-8 rounded-[4px] border border-mist hover:bg-fog"
                  disabled={item.quantity >= item.stock}
                >
                  +
                </button>
              </div>
              <button
                onClick={() => removeItem(item.variantId)}
                className="text-xs text-graphite hover:text-carbon-ink hover:underline"
              >
                حذف
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="border-t border-mist pt-4 space-y-4">
        <div className="flex justify-between text-lg font-bold">
          <span>الإجمالي</span>
          <span>{formatMoney(totalPiasters)}</span>
        </div>
        <Button asChild className="w-full" size="lg">
          <Link href="/checkout">إتمام الطلب</Link>
        </Button>
      </div>
    </div>
  );
}
