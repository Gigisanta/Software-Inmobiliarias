import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const headingVariants = cva("font-display tracking-tight bg-clip-text text-transparent", {
  variants: {
    variant: {
      brand: "bg-[linear-gradient(120deg,#8b7bff_0%,#a78bfa_40%,#2dd4ee_100%)]",
      light: "bg-gradient-to-b from-white to-white/70",
      muted: "bg-gradient-to-b from-foreground to-muted",
    },
    size: {
      sm: "text-xl sm:text-2xl",
      md: "text-2xl sm:text-3xl",
      lg: "text-3xl sm:text-4xl lg:text-5xl",
      xl: "text-4xl sm:text-5xl lg:text-6xl",
      xxl: "text-5xl sm:text-6xl lg:text-7xl",
    },
    weight: {
      medium: "font-medium",
      semi: "font-semibold",
      bold: "font-bold",
    },
  },
  defaultVariants: { variant: "light", size: "md", weight: "bold" },
});

export interface GradientHeadingProps extends VariantProps<typeof headingVariants> {
  asChild?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const GradientHeading = React.forwardRef<HTMLHeadingElement, GradientHeadingProps>(
  ({ asChild, variant, weight, size, className, children }, ref) => {
    const Comp = asChild ? Slot : "h2";
    return (
      <Comp ref={ref} className={cn(headingVariants({ variant, size, weight }), "pb-0.5", className)}>
        {children}
      </Comp>
    );
  },
);
GradientHeading.displayName = "GradientHeading";
