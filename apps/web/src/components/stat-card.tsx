import { cn } from "@/lib/utils";
import { AnimatedNumber } from "@/components/ui/animated-number";

interface StatCardProps {
  label: string;
  value: number;
  hint?: string;
  icon?: React.ReactNode;
  tone?: "default" | "hot" | "success" | "primary" | "danger";
  /** Formato del número (por defecto, entero es-AR). */
  format?: (n: number) => string;
}

const toneText = {
  default: "text-foreground",
  hot: "text-hot",
  success: "text-success",
  primary: "text-accent",
  danger: "text-danger",
};

const toneChip = {
  default: "bg-white/5 text-muted",
  hot: "bg-hot/15 text-hot",
  success: "bg-success/15 text-success",
  primary: "bg-primary/15 text-accent",
  danger: "bg-danger/15 text-danger",
};

export function StatCard({ label, value, hint, icon, tone = "default", format }: StatCardProps) {
  return (
    <div className="group glass relative overflow-hidden rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-0.5">
      {/* halo de color según el tono */}
      <div
        className={cn(
          "pointer-events-none absolute -right-8 -top-10 h-24 w-24 rounded-full blur-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100",
          tone === "hot" && "bg-hot/30",
          tone === "primary" && "bg-primary/30",
          tone === "success" && "bg-success/30",
          tone === "danger" && "bg-danger/30",
          tone === "default" && "bg-white/10",
        )}
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</span>
        {icon && <span className={cn("grid h-7 w-7 place-items-center rounded-lg", toneChip[tone])}>{icon}</span>}
      </div>
      <div className={cn("font-display mt-2 text-3xl font-semibold tabular-nums", toneText[tone])}>
        <AnimatedNumber value={value} format={format} />
      </div>
      {hint && <div className="mt-1 text-xs text-muted">{hint}</div>}
    </div>
  );
}
