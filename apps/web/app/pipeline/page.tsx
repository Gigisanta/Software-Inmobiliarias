"use client";

import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KanbanSquare, ChevronLeft, ChevronRight } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, bandVariant } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { cn, formatMoney, timeAgo } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos derivados por inferencia del contrato del board (sin `any`).
// ---------------------------------------------------------------------------

type BoardColumn = {
  stage: {
    id: string;
    key: PipelineStageKey;
    name: string;
    order: number;
    probability: number;
  };
  count: number;
  potentialValue: number;
  leads: BoardLead[];
};

type BoardLead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  channel: string;
  operationType: string;
  budgetMax: string | null;
  currency: string;
  score: number;
  scoreBand: "CALIENTE" | "TIBIO" | "FRIO" | null;
  currentStageId: string;
  assignedToId: string | null;
  lastActivityAt: string | Date;
};

const BAND_LABEL: Record<NonNullable<BoardLead["scoreBand"]>, string> = {
  CALIENTE: "Caliente",
  TIBIO: "Tibio",
  FRIO: "Frío",
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function PipelinePage() {
  const trpc = useTRPC();
  const board = useQuery(trpc.pipeline.board.queryOptions());

  const qc = useQueryClient();
  const changeStage = useMutation(
    trpc.lead.changeStage.mutationOptions({
      onSuccess: () => qc.invalidateQueries(),
    }),
  );

  const columns = (board.data ?? []) as BoardColumn[];

  return (
    <div className="flex h-full min-h-screen flex-col">
      <PageHeader
        title="Pipeline"
        subtitle="Arrastrá o movés leads por el embudo"
        icon={<KanbanSquare className="h-5 w-5" />}
      />

      <div className="flex-1 overflow-x-auto px-4 pb-8 pt-4">
        {board.isLoading ? (
          <BoardSkeleton />
        ) : board.isError ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<KanbanSquare className="h-8 w-8" />}
              title="No pudimos cargar el pipeline"
              description="Ocurrió un error al traer las etapas. Volvé a intentar en unos segundos."
            />
          </div>
        ) : columns.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={<KanbanSquare className="h-8 w-8" />}
              title="Todavía no hay etapas"
              description="Configurá tu embudo para empezar a mover leads."
            />
          </div>
        ) : (
          <div className="flex gap-4">
            {columns.map((column, index) => (
              <StageColumn
                key={column.stage.id}
                column={column}
                prevStageKey={columns[index - 1]?.stage.key ?? null}
                nextStageKey={columns[index + 1]?.stage.key ?? null}
                onMove={(leadId, toStageKey) =>
                  changeStage.mutate({ leadId, toStageKey })
                }
                isMoving={changeStage.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Columna de etapa
// ---------------------------------------------------------------------------

function StageColumn({
  column,
  prevStageKey,
  nextStageKey,
  onMove,
  isMoving,
}: {
  column: BoardColumn;
  prevStageKey: PipelineStageKey | null;
  nextStageKey: PipelineStageKey | null;
  onMove: (leadId: string, toStageKey: PipelineStageKey) => void;
  isMoving: boolean;
}) {
  const { stage, count, potentialValue, leads } = column;

  return (
    <section className="flex w-[300px] shrink-0 flex-col">
      <header className="sticky top-0 z-10 rounded-xl border border-border bg-surface/95 p-3 backdrop-blur">
        <div className="flex items-center justify-between gap-2">
          <h2 className="truncate text-sm font-semibold text-foreground">
            {stage.name}
          </h2>
          <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 text-xs font-medium text-muted">
            {count}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-2">
          <span>{Math.round(stage.probability)}% prob.</span>
          <span className="font-medium text-muted">
            {formatMoney(potentialValue)}
          </span>
        </div>
      </header>

      <div className="mt-3 flex flex-col gap-3">
        {leads.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-xs text-muted-2">
            Sin leads
          </div>
        ) : (
          leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              prevStageKey={prevStageKey}
              nextStageKey={nextStageKey}
              onMove={onMove}
              isMoving={isMoving}
            />
          ))
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta de lead
// ---------------------------------------------------------------------------

function LeadCard({
  lead,
  prevStageKey,
  nextStageKey,
  onMove,
  isMoving,
}: {
  lead: BoardLead;
  prevStageKey: PipelineStageKey | null;
  nextStageKey: PipelineStageKey | null;
  onMove: (leadId: string, toStageKey: PipelineStageKey) => void;
  isMoving: boolean;
}) {
  const band = lead.scoreBand;
  const variant = band ? bandVariant(band) : "neutral";

  const budget =
    lead.budgetMax != null
      ? formatMoney(Number(lead.budgetMax), lead.currency)
      : null;

  return (
    <Card className="group relative transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg">
      <Link
        href={`/leads/${lead.id}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <ScoreCircle score={lead.score} variant={variant} />

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-semibold text-foreground">
                  {lead.firstName} {lead.lastName}
                </p>
              </div>

              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {band ? (
                  <Badge variant={variant}>{BAND_LABEL[band]}</Badge>
                ) : null}
                <Badge variant="neutral">{lead.operationType}</Badge>
              </div>

              {budget ? (
                <p className="mt-2 text-xs font-medium text-muted">{budget}</p>
              ) : null}

              <p className="mt-1 text-xs text-muted-2">
                {timeAgo(lead.lastActivityAt)}
              </p>
            </div>
          </div>
        </CardContent>
      </Link>

      <StageControls
        leadId={lead.id}
        prevStageKey={prevStageKey}
        nextStageKey={nextStageKey}
        onMove={onMove}
        isMoving={isMoving}
      />
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Score en círculo, coloreado por banda
// ---------------------------------------------------------------------------

function ScoreCircle({
  score,
  variant,
}: {
  score: number;
  variant: ReturnType<typeof bandVariant> | "neutral";
}) {
  const colorByVariant: Record<string, string> = {
    hot: "border-hot text-hot",
    warm: "border-warm text-warm",
    cold: "border-cold text-cold",
    neutral: "border-border-strong text-muted",
  };

  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-surface-2 text-sm font-bold",
        colorByVariant[variant] ?? colorByVariant.neutral,
      )}
      aria-label={`Score ${score}`}
    >
      {score}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controles para mover de etapa (◀ / ▶), sin drag&drop
// ---------------------------------------------------------------------------

function StageControls({
  leadId,
  prevStageKey,
  nextStageKey,
  onMove,
  isMoving,
}: {
  leadId: string;
  prevStageKey: PipelineStageKey | null;
  nextStageKey: PipelineStageKey | null;
  onMove: (leadId: string, toStageKey: PipelineStageKey) => void;
  isMoving: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-border px-2 py-1.5">
      <Button
        variant="ghost"
        size="icon"
        disabled={!prevStageKey || isMoving}
        aria-label="Mover a etapa anterior"
        title="Etapa anterior"
        onClick={() => prevStageKey && onMove(leadId, prevStageKey)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <span className="text-[10px] uppercase tracking-wide text-muted-2">
        Mover
      </span>

      <Button
        variant="ghost"
        size="icon"
        disabled={!nextStageKey || isMoving}
        aria-label="Mover a etapa siguiente"
        title="Etapa siguiente"
        onClick={() => nextStageKey && onMove(leadId, nextStageKey)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estado de carga
// ---------------------------------------------------------------------------

function BoardSkeleton() {
  return (
    <div className="flex gap-4">
      {Array.from({ length: 5 }).map((_, columnIndex) => (
        <div key={columnIndex} className="flex w-[300px] shrink-0 flex-col">
          <div className="rounded-xl border border-border bg-surface p-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-6 rounded-full" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {Array.from({ length: 3 }).map((_, cardIndex) => (
              <div
                key={cardIndex}
                className="rounded-xl border border-border bg-surface p-3"
              >
                <div className="flex items-start gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-3 w-2/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
