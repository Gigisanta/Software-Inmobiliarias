"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, LogOut, Settings, Loader2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { Avatar } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Dueño",
  MANAGER: "Gerente",
  ADVISOR: "Asesor",
};

/** Usuario logueado (extremo derecho del header) + menú desplegable. */
export function UserMenu() {
  const trpc = useTRPC();
  const router = useRouter();
  const { data } = useQuery(trpc.health.me.queryOptions());
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const user = data?.user;
  const name = user ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || user.email : "…";
  const roleLabel = user?.role ? (ROLE_LABEL[user.role] ?? user.role) : "";

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* si falla, igual mandamos al login */
    }
    router.push("/login");
    router.refresh();
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
                <div className="truncate text-[11px] text-muted">
                  {roleLabel ? `${roleLabel} · ` : ""}
                  {user?.email}
                </div>
              </div>
            </div>

            <div className="mt-2 flex flex-col gap-0.5">
              <Link
                href="/configuracion"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
              >
                <Settings className="h-4 w-4" /> Configuración
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted transition-colors duration-[180ms] hover:bg-surface-2 hover:text-foreground"
              >
                {loggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Cerrando…
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" /> Cerrar sesión
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
