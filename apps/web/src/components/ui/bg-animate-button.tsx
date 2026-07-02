"use client";

import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Botón con fondo de gradiente cónico giratorio (cult-ui, adaptado a la marca).
 * Un span con conic-gradient gira detrás del contenido, dejando ver el borde animado.
 */
const outerVariants = cva("relative inline-block overflow-hidden p-[1.5px]", {
  variants: {
    rounded: {
      full: "rounded-full",
      xl: "rounded-xl",
      "2xl": "rounded-2xl",
    },
  },
  defaultVariants: { rounded: "full" },
});

const spinVariants = cva("absolute inset-[-1000%] m-auto block", {
  variants: {
    animation: {
      spin: "animate-[spin_4s_linear_infinite]",
      "spin-slow": "animate-[spin_8s_linear_infinite]",
      "spin-fast": "animate-[spin_2.5s_linear_infinite]",
    },
    gradient: {
      brand: "bg-[conic-gradient(from_90deg_at_50%_50%,#2dd4ee_0%,#6d5efc_50%,#a78bfa_100%)]",
      cyan: "bg-[conic-gradient(from_90deg_at_50%_50%,#2dd4ee_0%,#0ea5e9_50%,#2dd4ee_100%)]",
      violet: "bg-[conic-gradient(from_90deg_at_50%_50%,#a78bfa_0%,#6d5efc_50%,#a78bfa_100%)]",
    },
  },
  defaultVariants: { animation: "spin", gradient: "brand" },
});

const innerVariants = cva(
  "relative z-10 inline-flex items-center justify-center gap-2 font-medium text-foreground transition-colors",
  {
    variants: {
      size: {
        sm: "px-4 py-1.5 text-xs",
        default: "px-5 py-2.5 text-sm",
        lg: "px-7 py-3 text-base",
      },
      rounded: {
        full: "rounded-full",
        xl: "rounded-[15px]",
        "2xl": "rounded-[19px]",
      },
    },
    defaultVariants: { size: "default", rounded: "full" },
  },
);

export interface BgAnimateButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "sm" | "default" | "lg";
  rounded?: "full" | "xl" | "2xl";
  gradient?: "brand" | "cyan" | "violet";
  animation?: "spin" | "spin-slow" | "spin-fast";
}

export const BgAnimateButton = React.forwardRef<HTMLButtonElement, BgAnimateButtonProps>(
  (
    { size = "default", rounded = "full", gradient = "brand", animation = "spin", className, children, ...props },
    ref,
  ) => (
    <button ref={ref} className={cn(outerVariants({ rounded }), className)} {...props}>
      <span className={cn(spinVariants({ gradient, animation }))} />
      <span className={cn(innerVariants({ size, rounded }), "bg-surface/95")}>{children}</span>
    </button>
  ),
);
BgAnimateButton.displayName = "BgAnimateButton";
