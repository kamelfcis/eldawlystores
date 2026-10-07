import { ProductCard } from "./product-card";
import type { ProductWithDetails } from "@/lib/types/database";

interface ProductGridProps {
  products: ProductWithDetails[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-graphite">
        <p className="text-[16px]">لا توجد منتجات</p>
        <p className="mt-2 text-[14px]">جرب تغيير الفلاتر أو البحث</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
