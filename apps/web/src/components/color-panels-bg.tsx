import { cn } from "@/lib/utils";

/**
 * Fondo de "paneles de color" animados (versión CSS del hero-color-panels de cult-ui,
 * sin dependencia de shader WebGL): blobs de gradiente difusos que flotan sobre el mesh.
 */
export function ColorPanelsBg({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      <div className="absolute -left-24 top-0 h-[420px] w-[420px] animate-float rounded-full bg-[conic-gradient(from_120deg,#6d5efc,#a78bfa,#2dd4ee,#6d5efc)] opacity-30 blur-[90px]" />
      <div
        className="absolute right-0 top-24 h-[380px] w-[380px] animate-float rounded-full bg-[conic-gradient(from_0deg,#2dd4ee,#22d3ee,#6d5efc,#2dd4ee)] opacity-25 blur-[100px]"
        style={{ animationDelay: "1.5s" }}
      />
      <div
        className="absolute bottom-0 left-1/3 h-[320px] w-[320px] animate-float rounded-full bg-[conic-gradient(from_220deg,#a78bfa,#ec4899,#6d5efc,#a78bfa)] opacity-20 blur-[110px]"
        style={{ animationDelay: "3s" }}
      />
    </div>
  );
}
