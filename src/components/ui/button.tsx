import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-gold text-night font-semibold shadow-astral hover:bg-gold-soft hover:shadow-astral-glow active:scale-[0.98]",
        outline:
          "border border-gold/30 bg-deep/60 backdrop-blur-sm text-ivory hover:border-gold hover:text-gold hover:bg-veil/60",
        secondary:
          "bg-veil text-ivory border border-gold/15 hover:bg-veil/80 hover:border-gold/30",
        ghost:
          "text-mist hover:text-gold hover:bg-veil/40",
        link:
          "text-gold underline-offset-4 hover:underline p-0 h-auto",
        celestial:
          "relative overflow-hidden bg-gradient-to-r from-[#D4AF6A] via-[#E9D6A8] to-[#D4AF6A] text-[#0A0D18] font-semibold shadow-astral hover:shadow-astral-glow hover:brightness-105 active:scale-[0.98] border border-[#E9D6A8]/40",
        ember:
          "bg-ember/15 text-ember border border-ember/30 hover:bg-ember/25",
        aurora:
          "bg-aurora/15 text-aurora border border-aurora/30 hover:bg-aurora/25",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-full px-3.5 text-xs tracking-wide",
        lg: "h-12 rounded-full px-8 text-base tracking-wide",
        icon: "h-10 w-10 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
