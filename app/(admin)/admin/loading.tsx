import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-6">
      <Skeleton className="h-6 w-40" />
      <div className="grid gap-px overflow-hidden rounded-[8px] border border-mist bg-mist sm:grid-cols-4">
        <Skeleton className="h-20 rounded-none bg-paper-white" />
        <Skeleton className="h-20 rounded-none bg-paper-white" />
        <Skeleton className="h-20 rounded-none bg-paper-white" />
        <Skeleton className="h-20 rounded-none bg-paper-white" />
      </div>
      <div className="space-y-2 rounded-[8px] border border-mist bg-paper-white p-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    </div>
  );
}
