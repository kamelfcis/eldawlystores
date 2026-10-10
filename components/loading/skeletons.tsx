import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

function Status({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div aria-busy="true" role="status" aria-live="polite">
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}

export function HomeSkeleton() {
  return (
    <Status label="جارٍ تحميل الصفحة">
      <div
        dir="ltr"
        className="grid grid-cols-2 items-stretch gap-2.5 lg:grid-cols-[minmax(0,1fr)_minmax(0,2.35fr)_minmax(0,1fr)] lg:gap-3"
      >
        <Skeleton className="col-span-2 aspect-[16/10] rounded-[8px] bg-fog lg:col-span-1 lg:col-start-2 lg:row-start-1 lg:aspect-[16/9]" />
        <Skeleton className="aspect-[3/4] rounded-[8px] bg-fog lg:col-start-1 lg:row-start-1 lg:h-full lg:aspect-auto" />
        <Skeleton className="aspect-[3/4] rounded-[8px] bg-fog lg:col-start-3 lg:row-start-1 lg:h-full lg:aspect-auto" />
      </div>
      <div className="mt-2 border-t border-retail-line pt-2">
        <Skeleton className="mb-4 h-4 w-40 bg-fog" />
        <div className="flex gap-2.5">
          {Array.from({ length: 7 }, (_, index) => (
            <Skeleton key={index} className="size-[88px] shrink-0 rounded-full bg-fog" />
          ))}
        </div>
      </div>
      <div className="mt-10 border-t border-retail-line pt-10">
        <Skeleton className="mb-4 h-6 w-48 bg-fog" />
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-square rounded-[8px] bg-fog" />
              <Skeleton className="h-4 w-3/4 bg-fog" />
              <Skeleton className="h-4 w-1/3 bg-fog" />
            </div>
          ))}
        </div>
      </div>
    </Status>
  );
}

export function CatalogSkeleton({ withHero = false }: { withHero?: boolean }) {
  return (
    <Status label="جارٍ تحميل المنتجات">
      <div className="min-w-0">
        {withHero ? (
          <>
            <Skeleton className="mb-4 h-4 w-36 bg-fog" />
            <Skeleton className="h-[200px] rounded-[8px] bg-fog lg:h-[300px]" />
          </>
        ) : (
          <Skeleton className="h-8 w-48 bg-fog" />
        )}
        <div className="mt-2 border-t border-retail-line pt-2">
          <Skeleton className="mb-2 h-4 w-40 bg-fog" />
          <div className="flex gap-2.5">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="size-[88px] shrink-0 rounded-full bg-fog" />
            ))}
          </div>
        </div>
        <div className="mt-6 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-8">
          <div className="mb-4 space-y-3 lg:mb-0">
            <Skeleton className="h-9 w-full bg-fog" />
            <Skeleton className="h-9 w-full bg-fog" />
            <Skeleton className="h-9 w-full bg-fog" />
          </div>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div key={index} className="space-y-3">
                <Skeleton className="aspect-square rounded-[8px] bg-fog" />
                <Skeleton className="h-4 w-3/4 bg-fog" />
                <Skeleton className="h-4 w-1/3 bg-fog" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </Status>
  );
}

export function ProductSkeleton() {
  return (
    <Status label="جارٍ تحميل المنتج">
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square rounded-[8px] bg-fog" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-24 bg-fog" />
          <Skeleton className="h-8 w-2/3 bg-fog" />
          <Skeleton className="h-8 w-40 bg-fog" />
          <Skeleton className="h-24 w-full bg-fog" />
          <Skeleton className="h-11 w-40 bg-fog" />
        </div>
      </div>
    </Status>
  );
}

export function AdminDashboardSkeleton() {
  return (
    <Status label="جارٍ تحميل لوحة التحكم">
      <div className="mx-auto w-full max-w-[1200px] space-y-6">
        <Skeleton className="h-6 w-40" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-[8px] border border-mist border-t-2 bg-paper-white" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-[8px] border border-mist bg-paper-white" />
          <Skeleton className="h-64 rounded-[8px] border border-mist bg-paper-white" />
        </div>
        <Skeleton className="h-48 rounded-[8px] border border-mist bg-paper-white" />
        <Skeleton className="h-40 rounded-[8px] border border-mist bg-paper-white" />
      </div>
    </Status>
  );
}

export function AdminListSkeleton() {
  return (
    <Status label="جارٍ تحميل الصفحة">
      <div className="mx-auto w-full max-w-[1200px] space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-full rounded-[8px] border border-mist bg-paper-white" />
        <div className="space-y-2 rounded-[8px] border border-mist bg-paper-white p-4">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </Status>
  );
}
