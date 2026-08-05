import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  /** Tono del avatar: sage (por defecto) o neutral. */
  tone?: "sage" | "neutral" | "sand";
}

const sizes = {
  xs: "h-6 w-6 text-[10px]",
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

const tones = {
  sage: "bg-(--badge-sage-bg) text-(--badge-sage-fg)",
  neutral: "bg-surface-2 text-muted",
  sand: "bg-(--badge-sand-bg) text-(--badge-sand-fg)",
};

/** Avatar sobrio con iniciales: fondo pastel, sin gradientes ni anillos. */
export function Avatar({ initials, size = "md", tone = "sage", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold select-none",
        sizes[size],
        tones[tone],
        className,
      )}
    >
      {initials}
    </div>
  );
}
