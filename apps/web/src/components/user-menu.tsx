"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Avatar } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { DEV_ROLE_LABELS, getDevRole, setDevRole, type DevRole } from "@/lib/dev-role";

const ROLES: DevRole[] = ["OWNER", "MANAGER", "ADVISOR"];

/** Círculo del usuario logueado (esquina superior derecha) + menú. */
export function UserMenu() {
  const trpc = useTRPC();
  const { data } = useQuery(trpc.health.me.queryOptions());
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<DevRole>("OWNER");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setRole(getDevRole()), []);
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const user = data?.user;
  const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "…";

  function changeRole(r: DevRole) {
    setDevRole(r);
    window.location.reload();
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full p-0.5 pr-2 transition-colors hover:bg-white/5"
      >
        <Avatar initials={initials(user?.firstName, user?.lastName)} size="md" />
        <div className="hidden text-left sm:block">
          <div className="text-sm font-medium leading-tight">{name}</div>
          <div className="text-[11px] leading-tight text-muted">
            {user ? DEV_ROLE_LABELS[user.role as DevRole] ?? user.role : ""}
          </div>
        </div>
        <ChevronDown className="h-4 w-4 text-muted" />
      </button>

      {open && (
        <div className="animate-in absolute right-0 top-[calc(100%+10px)] w-64 rounded-2xl border border-border bg-surface p-2 shadow-2xl shadow-black/40">
          <div className="flex items-center gap-3 rounded-xl bg-surface-2 p-3">
            <Avatar initials={initials(user?.firstName, user?.lastName)} size="md" />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{name}</div>
              <div className="truncate text-[11px] text-muted">{user?.email}</div>
            </div>
          </div>

          <div className="mt-2 px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-2">
            <span className="inline-flex items-center gap-1">
              <UserCog className="h-3 w-3" /> Ver como (modo demo)
            </span>
          </div>
          <div className="flex gap-1 px-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => changeRole(r)}
                className={cn(
                  "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors",
                  role === r ? "bg-primary/20 text-foreground" : "text-muted hover:bg-white/5",
                )}
              >
                {DEV_ROLE_LABELS[r]}
              </button>
            ))}
          </div>

          <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors hover:bg-white/5 hover:text-foreground">
            <LogOut className="h-4 w-4" /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
