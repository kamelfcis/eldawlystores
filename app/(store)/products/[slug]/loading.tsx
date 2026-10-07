import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="grid gap-8 md:grid-cols-2" aria-busy="true" aria-label="جار تحميل المنتج">
      <Skeleton className="aspect-square rounded-[8px]" />
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-11 w-40" />
      </div>
    </div>
  );
}
