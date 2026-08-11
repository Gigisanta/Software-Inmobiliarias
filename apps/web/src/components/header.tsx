"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, BookOpen, ChevronRight, Search } from "lucide-react";
import { NAV_ITEMS } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/user-menu";
import { useGuide } from "@/components/guide";

/** Deriva los breadcrumbs desde la ruta actual. */
function useBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  // La ficha del lead vive en /leads/[id] pero pertenece a la sección Clientes.
  if (pathname.startsWith("/leads/")) {
    return [{ label: "Clientes", href: "/clientes" }, { label: "Ficha" }];
  }

  const section = NAV_ITEMS.find(
    (item) => item.href !== "/" && (pathname === item.href || pathname.startsWith(item.href + "/")),
  );

  if (!section) return [{ label: "Hoy" }];

  const crumbs: { label: string; href?: string }[] = [{ label: section.label, href: section.href }];
  if (pathname !== section.href) {
    crumbs.push({ label: "Detalle" });
  }
  return crumbs;
}

/** Header compacto: breadcrumbs, búsqueda, notificaciones y usuario. */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const crumbs = useBreadcrumbs(pathname);
  const [query, setQuery] = useState("");
  const { startTour } = useGuide();

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/clientes?vista=lista&q=${encodeURIComponent(q)}` : "/clientes?vista=lista");
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-surface/90 px-6 backdrop-blur">
      {/* Breadcrumbs */}
      <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1.5 text-sm">
        <Link
          href="/"
          className="shrink-0 text-muted transition-colors duration-[180ms] hover:text-foreground"
        >
          Inicio
        </Link>
        {crumbs.map((crumb, i) => (
          <span key={i} className="flex min-w-0 items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-2" />
            {crumb.href && i < crumbs.length - 1 ? (
              <Link
                href={crumb.href}
                className="truncate text-muted transition-colors duration-[180ms] hover:text-foreground"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      <div className="flex-1" />

      {/* Búsqueda */}
      <form onSubmit={submitSearch} className="relative hidden w-64 lg:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar leads…"
          className="h-8 w-full rounded-lg border border-border bg-surface-2/60 pl-8 pr-3 text-[13px] text-foreground placeholder:text-muted-2 transition-[border-color,background-color] duration-[180ms] focus:border-primary/50 focus:bg-surface focus:outline-none"
        />
      </form>

      {/* Guía de la plataforma */}
      <button
        type="button"
        onClick={startTour}
        title="Recorrido guiado de la plataforma"
        className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-muted transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
      >
        <BookOpen className="h-4 w-4" strokeWidth={1.75} />
        <span className="hidden sm:inline">Guía</span>
      </button>

      {/* Notificaciones (discretas) */}
      <button
        type="button"
        aria-label="Notificaciones"
        className="relative grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} />
        <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary" />
      </button>

      <ThemeToggle />
      <UserMenu />
    </header>
  );
}
