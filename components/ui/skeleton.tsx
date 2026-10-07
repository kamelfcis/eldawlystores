import { cn } from "@/lib/utils/cn";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("animate-pulse rounded-[4px] bg-mist/60", className)} {...props} />;
}
