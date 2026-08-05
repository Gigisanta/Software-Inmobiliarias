"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { Users, Plus, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey, LeadChannel, OperationType } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, stageVariant, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, SearchInput, Field } from "@/components/ui/input";
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

export default function LeadsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [stageKey, setStageKey] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

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
      <PageHeader
        title="Leads"
        subtitle="Compradores y consultas de tu inmobiliaria"
        actions={
          <Button onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo lead
          </Button>
        }
      />

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
            title="No pudimos cargar los leads"
            description="Ocurrió un error al traer la lista. Volvé a intentar en unos segundos."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users className="h-6 w-6" strokeWidth={1.5} />}
            title={search || stageKey ? "No hay leads con esos filtros" : "Todavía no cargaste ningún lead"}
            description={
              search || stageKey
                ? "Probá ajustar la búsqueda o limpiar la etapa seleccionada."
                : "Sumá tu primer contacto para empezar a trabajar el embudo."
            }
            action={
              <Button onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo lead
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

      <NewLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          qc.invalidateQueries();
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Filtros                                                             */
/* ------------------------------------------------------------------ */

function StageChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
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

/* ------------------------------------------------------------------ */
/* Tabla                                                               */
/* ------------------------------------------------------------------ */

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
                  {lead.operationType
                    ? (OPERATION_LABEL[lead.operationType] ?? lead.operationType)
                    : "—"}
                </span>
              </TD>
              <TD className="text-right">
                <span className="text-sm tabular-nums text-foreground">{budget ?? "—"}</span>
              </TD>
              <TD>
                {lead.assignedTo ? (
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="xs"
                      initials={initials(lead.assignedTo.firstName, lead.assignedTo.lastName)}
                    />
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

/* ------------------------------------------------------------------ */
/* Paginación                                                          */
/* ------------------------------------------------------------------ */

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
        {total} {total === 1 ? "lead" : "leads"}
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

/* ------------------------------------------------------------------ */
/* Alta de lead                                                        */
/* ------------------------------------------------------------------ */

type NewLeadForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  channel: string;
  operationType: string;
  budgetMin: string;
  budgetMax: string;
  notes: string;
};

const EMPTY_FORM: NewLeadForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  channel: LeadChannel.MANUAL,
  operationType: OperationType.COMPRA,
  budgetMin: "",
  budgetMax: "",
  notes: "",
};

function NewLeadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const [form, setForm] = useState<NewLeadForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const createLead = useMutation(
    trpc.lead.create.mutationOptions({
      onSuccess: () => {
        setForm(EMPTY_FORM);
        onCreated();
      },
      onError: (err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos crear el lead. Revisá los datos e intentá de nuevo.",
        );
      },
    }),
  );

  const update = <K extends keyof NewLeadForm>(key: K, value: NewLeadForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const parsedMin = form.budgetMin.trim() === "" ? undefined : Number(form.budgetMin);
  const parsedMax = form.budgetMax.trim() === "" ? undefined : Number(form.budgetMax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const firstName = form.firstName.trim();
    if (!firstName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (parsedMin != null && Number.isNaN(parsedMin)) {
      setError("El presupuesto mínimo debe ser un número.");
      return;
    }
    if (parsedMax != null && Number.isNaN(parsedMax)) {
      setError("El presupuesto máximo debe ser un número.");
      return;
    }

    createLead.mutate({
      firstName,
      lastName: form.lastName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      channel: form.channel as LeadChannel,
      operationType: form.operationType as OperationType,
      budgetMin: parsedMin,
      budgetMax: parsedMax,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo lead"
      description="Cargá los datos básicos. Podés completar el resto más tarde."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre" required>
            <Input
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              placeholder="Juan"
              autoFocus
            />
          </Field>
          <Field label="Apellido">
            <Input
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              placeholder="Pérez"
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              placeholder="+54 9 11 5555-5555"
              inputMode="tel"
            />
          </Field>
          <Field label="Email">
            <Input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="juan@email.com"
              inputMode="email"
            />
          </Field>
        </div>

        <Field label="Canal">
          <ChipGroup
            options={Object.values(LeadChannel)}
            value={form.channel}
            labels={CHANNEL_LABEL}
            onChange={(v) => update("channel", v)}
          />
        </Field>

        <Field label="Operación">
          <ChipGroup
            options={Object.values(OperationType)}
            value={form.operationType}
            labels={OPERATION_LABEL}
            onChange={(v) => update("operationType", v)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Presupuesto mín.">
            <Input
              value={form.budgetMin}
              onChange={(e) => update("budgetMin", e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
          <Field label="Presupuesto máx.">
            <Input
              value={form.budgetMax}
              onChange={(e) => update("budgetMax", e.target.value)}
              placeholder="0"
              inputMode="numeric"
            />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={3}
            placeholder="Contexto, preferencias, cómo llegó…"
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createLead.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createLead.isPending}>
            {createLead.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear lead
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChipGroup({
  options,
  value,
  labels,
  onChange,
}: {
  options: readonly string[];
  value: string;
  labels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-[180ms] ease-out",
            value === option
              ? "border-primary/40 bg-primary-soft text-primary"
              : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
          )}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function LeadListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-10 max-w-md" />
      <Skeleton className="h-8" />
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
