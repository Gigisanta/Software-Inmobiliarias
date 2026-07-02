"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Users,
  Plus,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  UserRound,
  Loader2,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey, LeadChannel, OperationType } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, bandVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn, formatMoney, timeAgo, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos derivados del contrato de `lead.list` (sin `any`).
// ---------------------------------------------------------------------------

type LeadListItem = {
  id: string;
  firstName: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  channel: string;
  operationType: string;
  budgetMin: number | string | null;
  budgetMax: number | string | null;
  currency: string;
  score: number;
  scoreBand: "CALIENTE" | "TIBIO" | "FRIO" | null;
  status: string;
  currentStage: { key: string; name: string; probability: number } | null;
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  lastActivityAt: string | Date | null;
  createdAt: string | Date;
};

const PAGE_SIZE = 20;

// ---------------------------------------------------------------------------
// Etiquetas legibles para chips / selects.
// ---------------------------------------------------------------------------

const STAGE_LABEL: Record<string, string> = {
  NUEVO_LEAD: "Nuevo",
  PRIMER_CONTACTO: "Primer contacto",
  INTERESADO: "Interesado",
  VISITA_AGENDADA: "Visita agendada",
  VISITA_REALIZADA: "Visita realizada",
  NEGOCIACION: "Negociación",
  RESERVA: "Reserva",
  ESCRIBANIA: "Escribanía",
  CERRADO_GANADO: "Cerrado ganado",
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

const BAND_LABEL: Record<"CALIENTE" | "TIBIO" | "FRIO", string> = {
  CALIENTE: "Caliente",
  TIBIO: "Tibio",
  FRIO: "Frío",
};

// ---------------------------------------------------------------------------
// Hook de debounce (evita disparar la query en cada tecla).
// ---------------------------------------------------------------------------

function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const handle = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handle);
  }, [value, delay]);
  return debounced;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function LeadsPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();

  const [searchInput, setSearchInput] = useState("");
  const [stageKey, setStageKey] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);

  const search = useDebounced(searchInput.trim(), 300);

  // Reinicia a la primera página cuando cambian los filtros.
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

  const data = leads.data as
    | {
        items: LeadListItem[];
        total: number;
        page: number;
        pageSize: number;
        pageCount: number;
      }
    | undefined;

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = data?.pageCount ?? 1;

  return (
    <div className="flex min-h-screen flex-col px-4 pb-10 pt-4">
      <PageHeader
        title="Leads"
        subtitle="Todos tus contactos y oportunidades en un solo lugar"
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Nuevo lead
          </Button>
        }
      />

      <FilterBar
        searchInput={searchInput}
        onSearch={setSearchInput}
        stageKey={stageKey}
        onStage={setStageKey}
      />

      <div className="mt-5 flex-1">
        {leads.isLoading ? (
          <LeadListSkeleton />
        ) : leads.isError ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title="No pudimos cargar los leads"
            description="Ocurrió un error al traer la lista. Volvé a intentar en unos segundos."
          />
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={
              search || stageKey
                ? "No hay leads con esos filtros"
                : "Todavía no cargaste ningún lead"
            }
            description={
              search || stageKey
                ? "Probá ajustar la búsqueda o limpiar la etapa seleccionada."
                : "Sumá tu primer contacto para empezar a trabajar el embudo."
            }
            action={
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                <Plus className="h-4 w-4" />
                Nuevo lead
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {items.map((lead) => (
                <LeadRow key={lead.id} lead={lead} />
              ))}
            </div>

            <Pagination
              page={data?.page ?? page}
              pageCount={pageCount}
              total={total}
              onPrev={() => setPage((p) => Math.max(1, p - 1))}
              onNext={() => setPage((p) => Math.min(pageCount, p + 1))}
            />
          </>
        )}
      </div>

      {modalOpen ? (
        <NewLeadModal
          onClose={() => setModalOpen(false)}
          onCreated={() => {
            setModalOpen(false);
            qc.invalidateQueries();
          }}
        />
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Barra de filtros: búsqueda + chips de etapa
// ---------------------------------------------------------------------------

function FilterBar({
  searchInput,
  onSearch,
  stageKey,
  onStage,
}: {
  searchInput: string;
  onSearch: (value: string) => void;
  stageKey: string | undefined;
  onStage: (value: string | undefined) => void;
}) {
  const stages = useMemo(() => Object.values(PipelineStageKey), []);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={searchInput}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Buscar por nombre, teléfono o email…"
          className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-9 text-sm text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        {searchInput ? (
          <button
            type="button"
            onClick={() => onSearch("")}
            aria-label="Limpiar búsqueda"
            className="absolute right-2 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <StageChip active={!stageKey} onClick={() => onStage(undefined)}>
          Todos
        </StageChip>
        {stages.map((key) => (
          <StageChip
            key={key}
            active={stageKey === key}
            onClick={() => onStage(stageKey === key ? undefined : key)}
          >
            {STAGE_LABEL[key] ?? key}
          </StageChip>
        ))}
      </div>
    </div>
  );
}

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
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Fila de lead (tarjeta, no tabla)
// ---------------------------------------------------------------------------

function LeadRow({ lead }: { lead: LeadListItem }) {
  const band = lead.scoreBand;
  const variant = band ? bandVariant(band) : "neutral";

  const budget = formatBudget(lead.budgetMin, lead.budgetMax, lead.currency);
  const fullName = `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""}`;

  return (
    <Link
      href={`/leads/${lead.id}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
    >
      <Card className="group transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-lg">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {/* Score + banda */}
          <div className="flex items-center gap-3">
            <ScoreCircle score={lead.score} variant={variant} />
            {band ? (
              <Badge variant={variant}>{BAND_LABEL[band]}</Badge>
            ) : (
              <Badge variant="neutral">Sin score</Badge>
            )}
          </div>

          {/* Identidad + contacto */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">
              {fullName}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {lead.phone ? (
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {lead.phone}
                </span>
              ) : null}
              <span>{CHANNEL_LABEL[lead.channel] ?? lead.channel}</span>
            </div>
          </div>

          {/* Operación + presupuesto */}
          <div className="min-w-0 sm:w-44">
            <Badge variant="neutral">
              {OPERATION_LABEL[lead.operationType] ?? lead.operationType}
            </Badge>
            {budget ? (
              <p className="mt-1.5 truncate text-xs font-medium text-muted">
                {budget}
              </p>
            ) : null}
          </div>

          {/* Etapa actual */}
          <div className="sm:w-40">
            {lead.currentStage ? (
              <Badge variant="primary">
                {STAGE_LABEL[lead.currentStage.key] ?? lead.currentStage.name}
              </Badge>
            ) : (
              <Badge variant="neutral">Sin etapa</Badge>
            )}
          </div>

          {/* Asesor asignado */}
          <div className="flex items-center gap-2 sm:w-44">
            {lead.assignedTo ? (
              <>
                <Avatar
                  size="sm"
                  ring={false}
                  initials={initials(
                    lead.assignedTo.firstName,
                    lead.assignedTo.lastName,
                  )}
                />
                <span className="truncate text-xs text-muted">
                  {lead.assignedTo.firstName} {lead.assignedTo.lastName}
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                <span className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-border text-muted">
                  <UserRound className="h-4 w-4" />
                </span>
                Sin asignar
              </span>
            )}
          </div>

          {/* Última actividad */}
          <div className="shrink-0 text-right text-xs text-muted sm:w-24">
            {timeAgo(lead.lastActivityAt)}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

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
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-surface-2 text-sm font-bold",
        colorByVariant[variant] ?? colorByVariant.neutral,
      )}
      aria-label={`Score ${score}`}
    >
      {score}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Paginación
// ---------------------------------------------------------------------------

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
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={onPrev}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= pageCount}
            onClick={onNext}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal de alta de lead
// ---------------------------------------------------------------------------

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
  onClose,
  onCreated,
}: {
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

  // Cerrar con Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Nuevo lead</h2>
            <p className="mt-0.5 text-xs text-muted">
              Cargá los datos básicos. Podés completar el resto más tarde.
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombre" required>
              <TextInput
                value={form.firstName}
                onChange={(v) => update("firstName", v)}
                placeholder="Juan"
                autoFocus
              />
            </Field>
            <Field label="Apellido">
              <TextInput
                value={form.lastName}
                onChange={(v) => update("lastName", v)}
                placeholder="Pérez"
              />
            </Field>
            <Field label="Teléfono">
              <TextInput
                value={form.phone}
                onChange={(v) => update("phone", v)}
                placeholder="+54 9 11 5555-5555"
                inputMode="tel"
              />
            </Field>
            <Field label="Email">
              <TextInput
                value={form.email}
                onChange={(v) => update("email", v)}
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

          <div className="grid grid-cols-2 gap-4">
            <Field label="Presupuesto mín.">
              <TextInput
                value={form.budgetMin}
                onChange={(v) => update("budgetMin", v)}
                placeholder="0"
                inputMode="numeric"
              />
            </Field>
            <Field label="Presupuesto máx.">
              <TextInput
                value={form.budgetMax}
                onChange={(v) => update("budgetMax", v)}
                placeholder="0"
                inputMode="numeric"
              />
            </Field>
          </div>

          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={3}
              placeholder="Contexto, preferencias, cómo llegó…"
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </Field>

          {error ? (
            <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-xs text-danger">
              {error}
            </p>
          ) : null}

          <div className="mt-1 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={createLead.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" variant="primary" disabled={createLead.isPending}>
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
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Controles de formulario reutilizables
// ---------------------------------------------------------------------------

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted">
        {label}
        {required ? <span className="text-danger"> *</span> : null}
      </span>
      {children}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  inputMode,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  autoFocus?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      inputMode={inputMode}
      autoFocus={autoFocus}
      className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted focus:border-border-strong focus:outline-none focus:ring-2 focus:ring-primary/40"
    />
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
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === option
              ? "border-primary/60 bg-primary/15 text-primary"
              : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
          )}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatBudget(
  min: number | string | null,
  max: number | string | null,
  currency: string,
): string | null {
  const hasMin = min != null && `${min}`.trim() !== "";
  const hasMax = max != null && `${max}`.trim() !== "";
  if (!hasMin && !hasMax) return null;
  if (hasMin && hasMax) {
    return `${formatMoney(min, currency)} – ${formatMoney(max, currency)}`;
  }
  return formatMoney(hasMin ? min : max, currency);
}

// ---------------------------------------------------------------------------
// Estado de carga
// ---------------------------------------------------------------------------

function LeadListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-3 w-52" />
            </div>
            <Skeleton className="h-5 w-24 rounded-full sm:w-40" />
            <Skeleton className="h-8 w-32 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
