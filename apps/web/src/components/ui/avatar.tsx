import { cn } from "@/lib/utils";

interface AvatarProps {
  initials: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  /** Color de acento del anillo (por defecto primary). */
  ring?: boolean;
}

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

export function Avatar({ initials, size = "md", className, ring = true }: AvatarProps) {
  return (
    <div
      className={cn(
        "grid place-items-center rounded-full bg-gradient-to-br from-primary/80 to-accent/70 font-semibold text-white select-none",
        ring && "ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
        sizes[size],
        className,
      )}
    >
      {initials}
    </div>
  );
}
