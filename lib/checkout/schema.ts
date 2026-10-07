import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().min(2, "الاسم مطلوب"),
  customerEmail: z.string().email("البريد الإلكتروني غير صالح"),
  customerPhone: z.string().min(10, "رقم الهاتف مطلوب"),
  governorate: z.string().min(1, "المحافظة مطلوبة"),
  city: z.string().min(1, "المدينة مطلوبة"),
  street: z.string().min(1, "الشارع مطلوب"),
  building: z.string().optional(),
  floor: z.string().optional(),
  promoCode: z.string().optional(),
  paymentMethod: z.enum(["cod"]).default("cod"),
  items: z.array(
    z.object({
      variantId: z.string(),
      quantity: z.number().int().min(1),
    })
  ).min(1, "السلة فارغة"),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
