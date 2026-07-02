import { TenantLogo } from "@/components/tenant-logo";
import { BubbleNav } from "@/components/bubble-nav";
import { UserMenu } from "@/components/user-menu";

/**
 * Barra superior:
 *  - Izquierda: logo de la inmobiliaria (tenant).
 *  - Centro: navegación en burbujas horizontales.
 *  - Derecha: círculo del usuario logueado.
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-background/60 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-4 md:px-6">
        <div className="shrink-0">
          <TenantLogo />
        </div>

        <div className="flex flex-1 justify-center overflow-x-auto px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <BubbleNav />
        </div>

        <div className="shrink-0">
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
