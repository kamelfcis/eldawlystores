"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatMoney } from "@/lib/money";

export function CartDrawerTrigger({ className }: { className?: string }) {
  const { itemCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className={className ?? "relative p-2 text-carbon-ink hover:opacity-70 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink"}
        aria-label="السلة"
        onClick={() => setOpen(true)}
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={1.5} />
        {itemCount > 0 ? (
          <span className="absolute -top-0.5 -left-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-carbon-ink px-1 text-[10px] text-paper-white">
            {itemCount}
          </span>
        ) : null}
      </button>
      <CartDrawer open={open} onOpenChange={setOpen} />
    </>
  );
}

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { cart, totalPiasters, updateQuantity, removeItem } = useCart();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fixed inset-y-0 start-0 end-auto top-0 max-h-none w-full max-w-md translate-x-0 translate-y-0 rounded-none border-0 border-e border-mist p-0 sm:rounded-none"
        aria-describedby={undefined}
      >
        <div className="flex h-full flex-col">
          <DialogHeader className="border-b border-mist px-4 py-4 text-start">
            <DialogTitle>سلة التسوق</DialogTitle>
          </DialogHeader>

          {cart.items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-12 text-center">
              <p className="text-graphite">سلتك فارغة</p>
              <Button asChild variant="outline" onClick={() => onOpenChange(false)}>
                <Link href="/products">تسوق الآن</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {cart.items.map((item) => (
                  <li key={item.variantId} className="flex gap-3 border-b border-mist pb-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-[4px] bg-fog">
                      <Image src={item.imageUrl} alt={item.productName} fill className="object-contain p-1" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <Link
                        href={`/products/${item.productSlug}`}
                        className="line-clamp-2 text-[14px] font-medium hover:underline"
                        onClick={() => onOpenChange(false)}
                      >
                        {item.productName}
                      </Link>
                      <p className="text-[14px] font-semibold text-retail-red">{formatMoney(item.unitPricePiasters)}</p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-mist hover:bg-fog"
                          aria-label="تقليل الكمية"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-[14px]">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          disabled={item.quantity >= item.stock}
                          className="flex h-7 w-7 items-center justify-center rounded-[4px] border border-mist hover:bg-fog disabled:opacity-40"
                          aria-label="زيادة الكمية"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeItem(item.variantId)}
                          className="ms-auto text-[12px] text-graphite hover:text-carbon-ink hover:underline"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="space-y-3 border-t border-mist px-4 py-4">
                <div className="flex justify-between text-[16px] font-bold">
                  <span>الإجمالي</span>
                  <span>{formatMoney(totalPiasters)}</span>
                </div>
                <Button asChild className="w-full" size="lg" onClick={() => onOpenChange(false)}>
                  <Link href="/checkout">إتمام الطلب</Link>
                </Button>
                <Button asChild variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
                  <Link href="/cart">عرض السلة كاملة</Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
