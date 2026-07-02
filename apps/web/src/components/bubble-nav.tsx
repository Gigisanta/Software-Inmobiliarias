"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  Flame,
  Calendar,
  MessageCircle,
  CheckSquare,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Operaciones", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: KanbanSquare },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/oportunidades", label: "Oportunidades", icon: Flame },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/conversaciones", label: "Chats", icon: MessageCircle },
  { href: "/tareas", label: "Tareas", icon: CheckSquare },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** Navegación en burbujas horizontales — reemplaza a la sidebar vertical. */
export function BubbleNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-1.5">
      {NAV_ITEMS.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={item.label}
            className={cn(
              "group relative flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition-all duration-200",
              "hover:-translate-y-0.5",
              active
                ? "border-white/10 bg-white/[0.06] text-foreground glow-primary"
                : "border-transparent bg-white/[0.02] text-muted hover:border-white/10 hover:text-foreground",
            )}
          >
            {active && (
              <span className="pointer-events-none absolute inset-x-3 -bottom-px h-px bg-gradient-brand" />
            )}
            <Icon
              className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-accent" : "text-muted-2 group-hover:text-foreground")}
            />
            <span className={cn("hidden md:inline", active && "inline")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
