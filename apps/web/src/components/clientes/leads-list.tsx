"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { Users, Plus, ChevronLeft, ChevronRight } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey } from "@reos/core";

import { Card } from "@/components/ui/card";
import { Badge, stageVariant, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/ui/input";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { FadeIn } from "@/components/ui/motion";
import { cn, formatMoney, timeAgo, initials } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LeadList = RouterOutputs["lead"]["list"];
type LeadListItem = LeadList["items"][number];

const PAGE_SIZE = 20;

const STAGE_LABEL: Record<string, string> = {
  NUEVO_LEAD: "Nuevo",
  PRIMER_CONTACTO: "Contactado",
  INTERESADO: "Interesado",
  VISITA_AGENDADA: "Visita agendada",
  VISITA_REALIZADA: "Visita realizada",
  NEGOCIACION: "Negociación",
  RESERVA: "Reserva",
  ESCRIBANIA: "Escribanía",
  CERRADO_GANADO: "Vendido",
  PERDIDO: "Perdido",
};

const CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  LANDING: "Landing",
  PORTAL: "Portal",
  LLAMADA: "Llamada",
  REFERIDO: "Referido",
  MANUAL: "Manual",
  OTRO: "Otro",
};

const OPERATION_LABEL: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  ALQUILER_TEMPORAL: "Alquiler temporal",
};

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

/** Vista Lista: tabla de clientes con búsqueda, filtros por etapa y paginación. */
export function LeadsList({ onNewLead }: { onNewLead: () => void }) {
  const trpc = useTRPC();

  const [searchInput, setSearchInput] = useState("");
  const [stageKey, setStageKey] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);

  // Toma "?q=" de la búsqueda global del header (solo al montar).
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearchInput(q);
  }, []);

  const search = useDebounced(searchInput.trim(), 300);

  useEffect(() => {
    setPage(1);
  }, [search, stageKey]);

  const leads = useQuery(
    trpc.lead.list.queryOptions({
      search: search || undefined,
      stageKey: stageKey as PipelineStageKey | undefined,
      page,
      pageSize: PAGE_SIZE,
    }),
  );

  const items = leads.data?.items ?? [];
  const total = leads.data?.total ?? 0;
  const pageCount = leads.data?.pageCount ?? 1;

  return (
    <div>
      <FadeIn>
        <div className="flex flex-col gap-4">
          <SearchInput
            value={searchInput}
            onValueChange={setSearchInput}
            placeholder="Buscar por nombre, teléfono o email…"
            className="max-w-md"
          />

          <div className="flex flex-wrap items-center gap-2">
            <StageChip active={!stageKey} onClick={() => setStageKey(undefined)}>
              Todos
            </StageChip>
            {Object.values(PipelineStageKey).map((key) => (
              <StageChip
                key={key}
                active={stageKey === key}
                onClick={() => setStageKey(stageKey === key ? undefined : key)}
              >
                {STAGE_LABEL[key] ?? key}
              </StageChip>
            ))}
          </div>
        </div>
      </FadeIn>

      <div className="mt-6">
        {leads.isLoading ? (
          <LeadListSkeleton />
        ) : leads.isError ? (
          <EmptyState
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
            title="No pudimos cargar los clientes"
            description="Ocurrió un error al traer la lista. Volvé a intentar en unos segundos."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
            title={search || stageKey ? "No hay clientes con esos filtros" : "Todavía no cargaste ningún cliente"}
            description={
              search || stageKey
                ? "Probá ajustar la búsqueda o limpiar la etapa seleccionada."
                : "Sumá tu primer contacto para empezar a trabajar el embudo."
            }
            action={
              <Button onClick={onNewLead}>
                <Plus className="h-4 w-4" />
                Nuevo cliente
              </Button>
            }
          />
        ) : (
          <FadeIn>
            <Card>
              <LeadsTable items={items} />
            </Card>

            <Pagination
              page={leads.data?.page ?? page}
              pageCount={pageCount}
              total={total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
            />
          </FadeIn>
        )}
      </div>
    </div>
  );
}

function StageChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-[180ms] ease-out",
        active
          ? "border-primary/40 bg-primary-soft text-primary"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function LeadsTable({ items }: { items: LeadListItem[] }) {
  const router = useRouter();

  return (
    <Table>
      <THead>
        <tr>
          <TH>Cliente</TH>
          <TH>Etapa</TH>
          <TH>Prioridad</TH>
          <TH>Operación</TH>
          <TH className="text-right">Presupuesto</TH>
          <TH>Asesor</TH>
          <TH className="text-right">Actividad</TH>
        </tr>
      </THead>
      <TBody>
        {items.map((lead) => {
          const fullName = `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""}`;
          const budget = formatBudget(
            lead.budgetMin != null ? String(lead.budgetMin) : null,
            lead.budgetMax != null ? String(lead.budgetMax) : null,
            lead.currency,
          );
          return (
            <TR key={lead.id} interactive onClick={() => router.push(`/leads/${lead.id}`)}>
              <TD>
                <div className="flex items-center gap-3">
                  <Avatar initials={initials(lead.firstName, lead.lastName)} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{fullName}</p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {lead.phone ?? CHANNEL_LABEL[lead.channel] ?? lead.channel}
                    </p>
                  </div>
                </div>
              </TD>
              <TD>
                {lead.currentStage ? (
                  <Badge variant={stageVariant(lead.currentStage.key)}>
                    {STAGE_LABEL[lead.currentStage.key] ?? lead.currentStage.name}
                  </Badge>
                ) : (
                  <Badge>Sin etapa</Badge>
                )}
              </TD>
              <TD>
                {lead.scoreBand ? (
                  <Badge variant={bandVariant(lead.scoreBand)}>{BAND_LABEL[lead.scoreBand]}</Badge>
                ) : (
                  <span className="text-xs text-muted-2">—</span>
                )}
              </TD>
              <TD>
                <span className="text-sm text-muted">
                  {lead.operationType ? (OPERATION_LABEL[lead.operationType] ?? lead.operationType) : "—"}
                </span>
              </TD>
              <TD className="text-right">
                <span className="text-sm tabular-nums text-foreground">{budget ?? "—"}</span>
              </TD>
              <TD>
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar size="xs" initials={initials(lead.assignedTo.firstName, lead.assignedTo.lastName)} />
                    <span className="truncate text-xs text-muted">
                      {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-2">Sin asignar</span>
                )}
              </TD>
              <TD className="text-right">
                <span className="text-xs text-muted-2">{timeAgo(lead.lastActivityAt)}</span>
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}

function formatBudget(min: string | null, max: string | null, currency: string): string | null {
  const hasMin = min != null && min.trim() !== "";
  const hasMax = max != null && max.trim() !== "";
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  return formatMoney(hasMin ? min : max, currency);
}

function Pagination({
  page,
  pageCount,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  pageCount: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-muted">
        {total} {total === 1 ? "cliente" : "clientes"}
      </p>

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted">
          Página {page} de {Math.max(1, pageCount)}
        </span>
        <div className="flex items-center gap-1.5">
          <Button variant="secondary" size="sm" disabled={page <= 1} onClick={onPrev}>
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button variant="secondary" size="sm" disabled={page >= pageCount} onClick={onNext}>
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function LeadListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 max-w-md" />
      <Skeleton className="h-8" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
