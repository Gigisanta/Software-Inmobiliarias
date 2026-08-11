"use client";

import { memo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { Columns3, GripVertical } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { useInvalidate } from "@/trpc/invalidate";
import { PipelineStageKey } from "@reos/core";

import { Badge, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn, formatMoney, timeAgo, initials } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type BoardColumn = RouterOutputs["pipeline"]["board"][number];
type BoardLead = BoardColumn["leads"][number];

/** Próxima acción sugerida según la banda del score. */
function nextAction(band?: string | null): string {
  if (band === "CALIENTE") return "Llamar hoy";
  if (band === "TIBIO") return "Programar seguimiento";
  return "Enviar información";
}

/** Vista Tablero: kanban del pipeline con arrastrar y soltar. */
export function PipelineBoard() {
  const trpc = useTRPC();
  const invalidate = useInvalidate();
  const board = useQuery(trpc.pipeline.board.queryOptions());

  const changeStage = useMutation(
    trpc.lead.changeStage.mutationOptions({
      onSuccess: () => invalidate(["pipeline", "lead", "dashboard"]),
    }),
  );

  const columns = board.data ?? [];
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  function handleDrop(e: React.DragEvent, toStageKey: string) {
    e.preventDefault();
    setDragOverStage(null);
    const leadId = e.dataTransfer.getData("text/lead-id");
    const fromStageKey = e.dataTransfer.getData("text/from-stage");
    if (!leadId || fromStageKey === toStageKey) return;
    changeStage.mutate({ leadId, toStageKey: toStageKey as PipelineStageKey });
  }

  if (board.isLoading) return <BoardSkeleton />;
  if (board.isError) {
    return (
      <EmptyState
        icon={<Columns3 className="h-6 w-6" strokeWidth={1.5} />}
        title="No pudimos cargar el tablero"
        description="Ocurrió un error al traer las etapas. Volvé a intentar en unos segundos."
      />
    );
  }
  if (columns.length === 0) {
    return (
      <EmptyState
        icon={<Columns3 className="h-6 w-6" strokeWidth={1.5} />}
        title="Todavía no hay etapas"
        description="Configurá tu embudo para empezar a mover operaciones."
      />
    );
  }

  return (
    <div className="-mx-6 overflow-x-auto px-6 pb-4 lg:-mx-10 lg:px-10">
      <div className="flex gap-5">
        {columns.map((column) => (
          <StageColumn
            key={column.stage.id}
            column={column}
            isDragOver={dragOverStage === column.stage.key}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverStage(column.stage.key);
            }}
            onDragLeave={() => setDragOverStage(null)}
            onDrop={(e) => handleDrop(e, column.stage.key)}
            isMoving={changeStage.isPending}
          />
        ))}
      </div>
    </div>
  );
}

function StageColumn({
  column,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  isMoving,
}: {
  column: BoardColumn;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  isMoving: boolean;
}) {
  const { stage, count, potentialValue, leads } = column;

  return (
    <section
      className={cn(
        "flex w-[290px] shrink-0 flex-col rounded-2xl p-2 transition-colors duration-[180ms] ease-out",
        isDragOver ? "bg-primary-soft" : "bg-transparent",
      )}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <header className="flex items-center justify-between gap-2 px-2 pb-3 pt-1">
        <div className="flex items-center gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">{stage.name}</h2>
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted">
            {count}
          </span>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-muted-2">{formatMoney(potentialValue)}</span>
      </header>

      <div className="flex min-h-24 flex-col gap-3">
        {leads.length === 0 ? (
          <div
            className={cn(
              "rounded-2xl border border-dashed px-3 py-10 text-center text-xs transition-colors duration-[180ms]",
              isDragOver ? "border-primary/40 text-primary" : "border-border text-muted-2",
            )}
          >
            {isDragOver ? "Soltar acá" : "Sin operaciones"}
          </div>
        ) : (
          leads.map((lead) => <KanbanCard key={lead.id} lead={lead} isMoving={isMoving} stageKey={stage.key} />)
        )}
      </div>
    </section>
  );
}

/**
 * Tarjeta del kanban memoizada: al arrastrar cambia `dragOverStage` en el tablero,
 * pero como no es prop de la tarjeta, `memo` evita re-renderizar todas las tarjetas
 * en cada evento de arrastre (arrastre fluido con muchas operaciones).
 */
const KanbanCard = memo(function KanbanCard({
  lead,
  stageKey,
  isMoving,
}: {
  lead: BoardLead;
  stageKey: string;
  isMoving: boolean;
}) {
  const router = useRouter();
  const [dragging, setDragging] = useState(false);
  const budget = lead.budgetMax != null ? formatMoney(String(lead.budgetMax), lead.currency) : null;

  return (
    <article
      draggable={!isMoving}
      onDragStart={(e) => {
        e.dataTransfer.setData("text/lead-id", lead.id);
        e.dataTransfer.setData("text/from-stage", stageKey);
        e.dataTransfer.effectAllowed = "move";
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      onClick={() => router.push(`/leads/${lead.id}`)}
      className={cn(
        "animate-in group cursor-pointer rounded-2xl border border-border bg-surface p-4 shadow-card",
        "transition-[box-shadow,border-color,opacity] duration-[180ms] ease-out",
        "hover:border-border-strong hover:shadow-card-hover",
        dragging && "opacity-50",
        isMoving && "pointer-events-none opacity-70",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-sm font-semibold text-foreground">
          {lead.firstName} {lead.lastName}
        </p>
        <GripVertical className="h-4 w-4 shrink-0 text-transparent transition-colors duration-[180ms] group-hover:text-muted-2" />
      </div>

      {budget ? <p className="mt-1.5 text-sm font-medium tabular-nums text-foreground">{budget}</p> : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {lead.scoreBand ? <Badge variant={bandVariant(lead.scoreBand)}>{BAND_LABEL[lead.scoreBand]}</Badge> : null}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3">
        <div className="flex min-w-0 items-center gap-2">
          {lead.assignedTo ? (
            <>
              <Avatar size="xs" initials={initials(lead.assignedTo.firstName, lead.assignedTo.lastName)} />
              <span className="truncate text-[11px] text-muted">{lead.assignedTo.firstName}</span>
            </>
          ) : (
            <span className="text-[11px] text-muted-2">Sin asignar</span>
          )}
        </div>
        <span className="shrink-0 text-[11px] text-muted-2">{timeAgo(lead.lastActivityAt)}</span>
      </div>

      <p className="mt-2 text-[11px] font-medium text-primary">{nextAction(lead.scoreBand)}</p>
    </article>
  );
});

function BoardSkeleton() {
  return (
    <div className="flex gap-5 overflow-hidden">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex w-[290px] shrink-0 flex-col gap-3">
          <Skeleton className="h-8" />
          {Array.from({ length: 3 }).map((_, j) => (
            <Skeleton key={j} className="h-36 rounded-2xl" />
          ))}
        </div>
      ))}
    </div>
  );
}
