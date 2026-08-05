"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, LogOut, UserCog } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Avatar } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";
import { DEV_ROLE_LABELS, getDevRole, setDevRole, type DevRole } from "@/lib/dev-role";

const ROLES: DevRole[] = ["OWNER", "MANAGER", "ADVISOR"];

/** Usuario logueado (extremo derecho del header) + menú desplegable. */
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
        className="flex items-center gap-2 rounded-lg p-1 pr-1.5 transition-colors duration-[180ms] hover:bg-surface-2"
      >
        <Avatar initials={initials(user?.firstName, user?.lastName)} size="sm" />
        <ChevronDown className="h-3.5 w-3.5 text-muted-2" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="absolute right-0 top-[calc(100%+8px)] w-64 rounded-2xl border border-border bg-surface p-2 shadow-overlay"
          >
            <div className="flex items-center gap-3 rounded-xl bg-surface-2/70 p-3">
              <Avatar initials={initials(user?.firstName, user?.lastName)} size="md" />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{name}</div>
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
                    "flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors duration-[180ms]",
                    role === r
                      ? "bg-primary-soft text-primary"
                      : "text-muted hover:bg-surface-2 hover:text-foreground",
                  )}
                >
                  {DEV_ROLE_LABELS[r]}
                </button>
              ))}
            </div>

            <button className="mt-2 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground">
              <LogOut className="h-4 w-4" /> Cerrar sesión
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
