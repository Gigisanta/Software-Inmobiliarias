"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium",
    "transition-[background-color,border-color,color,box-shadow,transform,opacity] duration-[180ms] ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "disabled:pointer-events-none disabled:opacity-50 cursor-pointer select-none",
  ].join(" "),
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary-strong active:scale-[0.99]",
        secondary:
          "bg-surface text-foreground border border-border hover:bg-surface-2 hover:border-border-strong",
        ghost: "text-muted hover:text-foreground hover:bg-surface-2",
        danger: "bg-surface text-danger border border-danger/30 hover:bg-danger/5",
        soft: "bg-primary-soft text-primary hover:bg-primary/15",
      },
      size: {
        sm: "h-8 px-3 text-xs rounded-lg",
        md: "h-10 px-4",
        lg: "h-11 px-6",
        icon: "h-9 w-9 rounded-lg",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

export { buttonVariants };
