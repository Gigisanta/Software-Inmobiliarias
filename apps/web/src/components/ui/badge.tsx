import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Badges con fondos pastel y texto de bajo contraste cromático.
 * Tonos: neutral (lead), slate (contactado), sand (visita), amber
 * (negociación), sage (reserva), forest (vendido), danger (perdido).
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium leading-none",
  {
    variants: {
      variant: {
        neutral: "bg-(--badge-neutral-bg) text-(--badge-neutral-fg)",
        slate: "bg-(--badge-slate-bg) text-(--badge-slate-fg)",
        sand: "bg-(--badge-sand-bg) text-(--badge-sand-fg)",
        amber: "bg-(--badge-amber-bg) text-(--badge-amber-fg)",
        sage: "bg-(--badge-sage-bg) text-(--badge-sage-fg)",
        forest: "bg-(--badge-forest-bg) text-(--badge-forest-fg)",
        danger: "bg-(--badge-danger-bg) text-(--badge-danger-fg)",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

/** Mapea la etapa del pipeline a su tono pastel. */
export function stageVariant(stageKey?: string | null): BadgeVariant {
  switch (stageKey) {
    case "NUEVO_LEAD":
      return "neutral";
    case "PRIMER_CONTACTO":
    case "INTERESADO":
      return "slate";
    case "VISITA_AGENDADA":
    case "VISITA_REALIZADA":
      return "sand";
    case "NEGOCIACION":
      return "amber";
    case "RESERVA":
    case "ESCRIBANIA":
      return "sage";
    case "CERRADO_GANADO":
      return "forest";
    case "PERDIDO":
      return "danger";
    default:
      return "neutral";
  }
}

/** Mapea la banda del Lead Score a su tono pastel. */
export function bandVariant(band?: string | null): BadgeVariant {
  if (band === "CALIENTE") return "amber";
  if (band === "TIBIO") return "sand";
  return "slate";
}

export const BAND_LABEL: Record<string, string> = {
  CALIENTE: "Prioridad alta",
  TIBIO: "En seguimiento",
  FRIO: "A madurar",
};
