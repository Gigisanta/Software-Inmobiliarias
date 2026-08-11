"use client";

import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Columns3, List, Flame, type LucideIcon } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/clientes/pipeline-board";
import { LeadsList } from "@/components/clientes/leads-list";
import { OpportunitiesList } from "@/components/clientes/opportunities-list";
import { NewLeadModal } from "@/components/clientes/new-lead-modal";
import { cn } from "@/lib/utils";

type View = "tablero" | "lista" | "prioridad";

const VIEWS: { key: View; label: string; icon: LucideIcon }[] = [
  { key: "tablero", label: "Tablero", icon: Columns3 },
  { key: "lista", label: "Lista", icon: List },
  { key: "prioridad", label: "Prioridad", icon: Flame },
];

const SUBTITLES: Record<View, string> = {
  tablero: "Arrastrá cada operación a su siguiente etapa",
  lista: "Todos tus clientes, con búsqueda y filtros",
  prioridad: "Los de mayor probabilidad de cierre, primero",
};

export default function ClientesPage() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>("tablero");
  const [newOpen, setNewOpen] = useState(false);

  // Toma la vista inicial de "?vista=" (sin useSearchParams para evitar Suspense).
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get("vista");
    if (v === "tablero" || v === "lista" || v === "prioridad") setView(v);
  }, []);

  function changeView(v: View) {
    setView(v);
    const url = new URL(window.location.href);
    url.searchParams.set("vista", v);
    window.history.replaceState(null, "", url.toString());
  }

  return (
    <div>
      <PageHeader
        title="Clientes"
        subtitle={SUBTITLES[view]}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Button>
        }
      />

      {/* Selector de vista */}
      <div className="mb-6 inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2/60 p-1">
        {VIEWS.map((v) => {
          const active = view === v.key;
          const Icon = v.icon;
          return (
            <button
              key={v.key}
              type="button"
              onClick={() => changeView(v.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-[180ms]",
                active ? "bg-surface text-foreground shadow-card" : "text-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {v.label}
            </button>
          );
        })}
      </div>

      {view === "tablero" ? <PipelineBoard /> : null}
      {view === "lista" ? <LeadsList onNewLead={() => setNewOpen(true)} /> : null}
      {view === "prioridad" ? <OpportunitiesList /> : null}

      <NewLeadModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={() => {
          setNewOpen(false);
          qc.invalidateQueries();
        }}
      />
    </div>
  );
}
