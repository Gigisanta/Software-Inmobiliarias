"use client";

import { usePathname } from "next/navigation";
import { Sidebar, MobileNav } from "@/components/sidebar";
import { Header } from "@/components/header";

/** Rutas que se muestran sin la estructura de la app (marketing/landing). */
const BARE_ROUTES = ["/landing", "/login", "/presentacion"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const bare = BARE_ROUTES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (bare) return <>{children}</>;

  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-60">
        <Header />
        <MobileNav />
        <main className="mx-auto w-full max-w-[1200px] px-6 py-10 lg:px-10">{children}</main>
      </div>
    </div>
  );
}
