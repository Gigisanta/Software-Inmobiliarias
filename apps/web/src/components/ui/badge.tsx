import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
  {
    variants: {
      variant: {
        neutral: "bg-white/8 text-muted",
        hot: "bg-hot/15 text-hot",
        warm: "bg-warm/15 text-warm",
        cold: "bg-cold/15 text-cold",
        success: "bg-success/15 text-success",
        danger: "bg-danger/15 text-danger",
        primary: "bg-primary/15 text-primary",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Mapea la banda del Lead Score a la variante de color. */
export function bandVariant(band?: string | null): "hot" | "warm" | "cold" {
  if (band === "CALIENTE") return "hot";
  if (band === "TIBIO") return "warm";
  return "cold";
}
