import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("motion-safe:animate-pulse rounded-[4px] bg-mist/60", className)} {...props} />;
}
