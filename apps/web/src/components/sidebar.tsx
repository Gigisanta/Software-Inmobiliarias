"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  House,
  Columns3,
  Users,
  Handshake,
  CalendarDays,
  MessageSquareText,
  ListChecks,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { TenantLogo } from "@/components/tenant-logo";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Hoy", icon: House },
  { href: "/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/oportunidades", label: "Oportunidades", icon: Handshake },
  { href: "/agenda", label: "Agenda", icon: CalendarDays },
  { href: "/conversaciones", label: "Conversaciones", icon: MessageSquareText },
  { href: "/tareas", label: "Tareas", icon: ListChecks },
];

export function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Sidebar fija: angosta, blanca, con indicador de sección sereno. */
export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-border bg-surface md:flex">
      <div className="flex h-14 items-center border-b border-border px-5">
        <TenantLogo />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
                "transition-colors duration-[180ms] ease-out",
                active
                  ? "bg-primary-soft text-primary"
                  : "text-muted hover:bg-surface-2 hover:text-foreground",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-primary" />
              )}
              <Icon
                strokeWidth={1.75}
                className={cn(
                  "h-[18px] w-[18px] shrink-0 transition-colors duration-[180ms]",
                  active ? "text-primary" : "text-muted-2 group-hover:text-foreground",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-[11px] leading-relaxed text-muted-2">
          RealEstate OS
          <span className="mx-1.5">·</span>
          Plan Pro
        </p>
      </div>
    </aside>
  );
}

/** Navegación compacta para pantallas chicas (debajo del header). */
export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-border bg-surface px-4 py-2 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
              "transition-colors duration-[180ms] ease-out",
              active ? "bg-primary-soft text-primary" : "text-muted hover:text-foreground",
            )}
          >
            <Icon strokeWidth={1.75} className="h-3.5 w-3.5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
