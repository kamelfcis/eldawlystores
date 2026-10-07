import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const badgeVariants = cva("inline-flex items-center rounded-full px-2 py-0.5 text-[14px] font-bold", {
  variants: {
    variant: {
      default: "bg-carbon-ink text-paper-white",
      outline: "border border-ash-border text-carbon-ink",
      accent: "bg-ember-red text-paper-white",
      muted: "bg-pewter text-paper-white",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
