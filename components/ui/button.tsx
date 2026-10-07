import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-[16px] font-bold tracking-[0.057em] transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-carbon-ink disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-carbon-ink text-paper-white hover:opacity-90",
        outline: "border border-carbon-ink bg-transparent text-carbon-ink hover:bg-fog",
        ghost: "bg-transparent text-carbon-ink hover:opacity-70",
        accent: "bg-carbon-ink text-paper-white hover:opacity-90",
        retail: "bg-retail-red text-paper-white hover:opacity-90",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-8 px-3 text-[14px] tracking-[0.038em]",
        lg: "h-12 px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
