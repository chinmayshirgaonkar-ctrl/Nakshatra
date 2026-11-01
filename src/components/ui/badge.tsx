import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wider uppercase transition-colors focus:outline-none focus:ring-1 focus:ring-gold",
  {
    variants: {
      variant: {
        default:
          "border-gold/30 bg-gold/10 text-gold-soft",
        secondary:
          "border-transparent bg-veil text-mist",
        outline:
          "border-gold/30 text-gold",
        aurora:
          "border-aurora/30 bg-aurora/10 text-aurora",
        ember:
          "border-ember/30 bg-ember/10 text-ember",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
