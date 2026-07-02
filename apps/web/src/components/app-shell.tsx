"use client";

import { usePathname } from "next/navigation";
import { Topbar } from "@/components/topbar";

/** Rutas que se muestran sin la barra de la app (marketing/landing). */
const BARE_ROUTES = ["/landing", "/login"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Topbar />
      <main className="mx-auto max-w-[1400px] px-4 py-6 md:px-6 md:py-8">{children}</main>
    </div>
  );
}
