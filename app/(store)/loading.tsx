import { Skeleton } from "@/components/ui/skeleton";

export default function StoreHomeLoading() {
  return (
    <div aria-busy="true" aria-label="جار التحميل">
      <Skeleton className="full-bleed -mt-10 min-h-[480px] rounded-none md:min-h-[560px]" />
      <div className="grid gap-4 py-16 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-44 rounded-[8px]" />
        <Skeleton className="h-44 rounded-[8px]" />
        <Skeleton className="h-44 rounded-[8px]" />
      </div>
      <div className="space-y-8 pb-16">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-10 w-28 rounded-full" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="aspect-square rounded-[8px]" />
          ))}
        </div>
      </div>
    </div>
  );
}
