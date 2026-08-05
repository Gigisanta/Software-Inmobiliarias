import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Formatea un monto en la moneda dada (es-AR). */
export function formatMoney(amount: number | string | null | undefined, currency = "USD"): string {
  if (amount == null) return "—";
  const n = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(n);
}

/** Tiempo relativo compacto en español ("hace 3 h"). */
export function timeAgo(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  const secs = Math.round((Date.now() - d.getTime()) / 1000);
  if (secs < 60) return "recién";
  const mins = Math.round(secs / 60);
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `hace ${hrs} h`;
  const days = Math.round(hrs / 24);
  if (days < 30) return `hace ${days} d`;
  return d.toLocaleDateString("es-AR");
}

/** Hora corta "15:30" (es-AR). */
export function formatTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

/** Etiqueta del día: "Hoy", "Mañana" o "vie 8 ago". */
export function dayLabel(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return "Hoy";
  if (diffDays === 1) return "Mañana";
  return d.toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
}

/** Días completos transcurridos desde una fecha. */
export function daysSince(date: Date | string | null | undefined): number {
  if (!date) return 0;
  const d = typeof date === "string" ? new Date(date) : date;
  return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000));
}

/** Iniciales a partir de nombre y apellido. */
export function initials(first?: string | null, last?: string | null): string {
  const a = first?.trim()?.[0] ?? "";
  const b = last?.trim()?.[0] ?? "";
  return (a + b).toUpperCase() || "?";
}
