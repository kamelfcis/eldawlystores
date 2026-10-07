import * as React from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    className={cn(
      "flex h-10 w-full rounded-[4px] border border-ash-border bg-paper-white px-3 py-2 text-[14px] text-carbon-ink placeholder:text-graphite focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
    ref={ref}
    {...props}
  />
));
Input.displayName = "Input";
