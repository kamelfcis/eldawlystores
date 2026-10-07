import { Skeleton } from "@/components/ui/skeleton";

export default function ProductsLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="جار تحميل المنتجات">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-wrap gap-3">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-36" />
        <Skeleton className="h-9 w-28" />
      </div>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, index) => (
          <div key={index} className="space-y-3">
            <Skeleton className="aspect-square rounded-[8px]" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
