"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Home,
  Calendar,
  CheckSquare,
  Flame,
  Building2,
  Radio,
  User as UserIcon,
  DollarSign,
  BedDouble,
  Landmark,
  PawPrint,
  ClipboardList,
  ChevronsUpDown,
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey } from "@reos/core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bandVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn, formatMoney, timeAgo, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos auxiliares (defensivos): el desglose de score puede llegar como
// `unknown`, por eso se castea explícitamente antes de renderizar.
// ---------------------------------------------------------------------------

type RouterOutputs = inferRouterOutputs<AppRouter>;

/** Ficha completa del lead (shape real inferido del contrato tRPC). */
type LeadData = RouterOutputs["lead"]["byId"];
/** Etapa del pipeline (shape real inferido del contrato tRPC). */
type StageOption = RouterOutputs["pipeline"]["list"][number];

type PropertyInterest = LeadData["propertyInterests"][number];
type StageHistoryEntry = LeadData["stageHistory"][number];
type Task = LeadData["tasks"][number];
type Appointment = LeadData["appointments"][number];

interface ScoreFactor {
  key: string;
  label: string;
  points: number;
  max: number;
  reason: string;
}

type LeadStatus = "OPEN" | "WON" | "LOST";

const STATUS_LABEL: Record<LeadStatus, string> = {
  OPEN: "Abierto",
  WON: "Ganado",
  LOST: "Perdido",
};

function statusVariant(status: LeadStatus): "primary" | "success" | "danger" {
  if (status === "WON") return "success";
  if (status === "LOST") return "danger";
  return "primary";
}

function scoreColor(band?: string | null): string {
  if (band === "CALIENTE") return "text-hot";
  if (band === "TIBIO") return "text-warm";
  return "text-cold";
}

function scoreRing(band?: string | null): string {
  if (band === "CALIENTE") return "border-hot/60 shadow-hot/20";
  if (band === "TIBIO") return "border-warm/60 shadow-warm/20";
  return "border-cold/60 shadow-cold/20";
}

/** Normaliza `scoreFactors` (que puede venir como unknown) a un array tipado. */
function parseScoreFactors(raw: unknown): ScoreFactor[] | null {
  if (!Array.isArray(raw)) return null;
  return (raw as Array<Record<string, unknown>>).map((f) => ({
    key: String(f.key ?? ""),
    label: String(f.label ?? ""),
    points: Number(f.points ?? 0),
    max: Number(f.max ?? 0),
    reason: String(f.reason ?? ""),
  }));
}

/** Coacciona un monto (Prisma Decimal, number, string o null) a string|null. */
function money(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" || typeof value === "string") return String(value);
  // Prisma Decimal (u objetos con toString numérico).
  return String(value);
}

function formatDuration(seconds?: number | null): string | null {
  if (seconds == null || seconds <= 0) return null;
  const days = Math.floor(seconds / 86400);
  if (days >= 1) return `${days} d`;
  const hrs = Math.floor(seconds / 3600);
  if (hrs >= 1) return `${hrs} h`;
  const mins = Math.max(1, Math.floor(seconds / 60));
  return `${mins} min`;
}

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const trpc = useTRPC();
  const qc = useQueryClient();

  const lead = useQuery(trpc.lead.byId.queryOptions({ id }));
  const stages = useQuery(trpc.pipeline.list.queryOptions());

  const changeStage = useMutation(
    trpc.lead.changeStage.mutationOptions({
      onSuccess: () => qc.invalidateQueries(),
    }),
  );

  if (lead.isLoading) return <LeadSkeleton />;

  if (lead.error || !lead.data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6">
        <BackLink />
        <EmptyState
          icon={<UserIcon className="h-6 w-6" />}
          title="Lead no encontrado"
          description="No pudimos cargar la ficha de este lead. Puede que haya sido eliminado o que el enlace no sea válido."
          action={
            <Link href="/leads">
              <Button variant="secondary">Ir a leads</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const l = lead.data;
  const factors = parseScoreFactors(l.scoreFactors);
  const stageList: StageOption[] = stages.data ?? [];
  const status = l.status as LeadStatus;
  const fullName = `${l.firstName} ${l.lastName}`.trim();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <BackLink />

      {/* ---------------------------------------------------------------- */}
      {/* HEADER de la ficha                                               */}
      {/* ---------------------------------------------------------------- */}
      <header className="mt-4 flex flex-col gap-5 rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-sm lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "grid h-16 w-16 shrink-0 place-items-center rounded-full border-2 bg-surface-2 shadow-lg",
              scoreRing(l.scoreBand),
            )}
          >
            <span className={cn("text-2xl font-bold tabular-nums", scoreColor(l.scoreBand))}>
              {Math.round(l.score)}
            </span>
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-2xl font-semibold tracking-tight">{fullName || "Lead"}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant={statusVariant(status)}>{STATUS_LABEL[status]}</Badge>
              {l.scoreBand && (
                <Badge variant={bandVariant(l.scoreBand)}>
                  <Flame className="h-3 w-3" />
                  {l.scoreBand}
                </Badge>
              )}
              {l.currentStage && (
                <span className="text-xs text-muted">
                  {l.currentStage.name} · {l.currentStage.probability}% prob.
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Selector de etapa */}
        <StageSelector
          current={l.currentStage}
          stages={stageList}
          disabled={changeStage.isPending}
          pendingKey={
            changeStage.isPending
              ? (changeStage.variables as { toStageKey?: string } | undefined)?.toStageKey ?? null
              : null
          }
          onSelect={(toStageKey) =>
            changeStage.mutate({ leadId: id, toStageKey: toStageKey as PipelineStageKey })
          }
        />
      </header>

      {/* ---------------------------------------------------------------- */}
      {/* Layout 2 columnas                                                */}
      {/* ---------------------------------------------------------------- */}
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        {/* ---- Columna principal ---- */}
        <div className="flex flex-col gap-5">
          <ContactCard lead={l} />
          <RequirementCard lead={l} />
          <PropertyInterestsCard interests={l.propertyInterests} />
          <TimelineCard history={l.stageHistory} />
        </div>

        {/* ---- Columna lateral ---- */}
        <div className="flex flex-col gap-5">
          <ScoreCard score={l.score} band={l.scoreBand} factors={factors} />
          <TasksCard tasks={l.tasks} />
          <AppointmentsCard appointments={l.appointments} />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-componentes
// ---------------------------------------------------------------------------

function BackLink() {
  return (
    <Link
      href="/leads"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Volver a leads
    </Link>
  );
}

interface StageSelectorProps {
  current: { key: string; name: string; probability: number } | null;
  stages: StageOption[];
  disabled: boolean;
  pendingKey: string | null;
  onSelect: (toStageKey: string) => void;
}

function StageSelector({ current, stages, disabled, pendingKey, onSelect }: StageSelectorProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full lg:w-72">
      <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
        Etapa del pipeline
      </p>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full justify-between"
      >
        <span className="truncate">{current?.name ?? "Sin etapa"}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />
      </Button>

      {open && (
        <>
          {/* overlay para cerrar al hacer click afuera */}
          <button
            type="button"
            aria-label="Cerrar selector"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute right-0 z-20 mt-2 max-h-80 w-full overflow-auto rounded-xl border border-border bg-surface-2 p-1.5 shadow-2xl shadow-black/40">
            {stages.map((stage) => {
              const isCurrent = current?.key === stage.key;
              const isPending = pendingKey === stage.key;
              return (
                <li key={stage.id}>
                  <button
                    type="button"
                    disabled={disabled || isCurrent}
                    onClick={() => {
                      setOpen(false);
                      if (!isCurrent) onSelect(stage.key);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                      isCurrent
                        ? "bg-primary/15 text-primary"
                        : "text-foreground hover:bg-white/5",
                      disabled && !isCurrent && "opacity-50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-xs text-muted">{stage.order}.</span>
                      <span className="truncate">{stage.name}</span>
                    </span>
                    <span className="flex items-center gap-2 text-xs text-muted">
                      {stage.probability}%
                      {isCurrent && <Check className="h-3.5 w-3.5 text-primary" />}
                      {isPending && (
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-transparent" />
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 py-2">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border bg-surface-2 text-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <div className="mt-0.5 text-sm text-foreground">{children}</div>
      </div>
    </div>
  );
}

function ContactCard({ lead }: { lead: LeadData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contacto</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/60">
        <InfoRow icon={<Phone className="h-4 w-4" />} label="Teléfono">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} className="hover:text-primary">
              {lead.phone}
            </a>
          ) : (
            "—"
          )}
        </InfoRow>
        <InfoRow icon={<Mail className="h-4 w-4" />} label="Email">
          {lead.email ? (
            <a href={`mailto:${lead.email}`} className="truncate hover:text-primary">
              {lead.email}
            </a>
          ) : (
            "—"
          )}
        </InfoRow>
        <InfoRow icon={<Radio className="h-4 w-4" />} label="Canal">
          {lead.channel || "—"}
          {lead.source && <span className="text-muted"> · {lead.source}</span>}
        </InfoRow>
        <InfoRow icon={<Building2 className="h-4 w-4" />} label="Sucursal">
          {lead.branch?.name ?? "—"}
        </InfoRow>
        <InfoRow icon={<UserIcon className="h-4 w-4" />} label="Asesor asignado">
          {lead.assignedTo ? (
            <span className="flex items-center gap-2">
              <Avatar
                size="sm"
                initials={initials(lead.assignedTo.firstName, lead.assignedTo.lastName)}
              />
              <span>
                {lead.assignedTo.firstName} {lead.assignedTo.lastName}
              </span>
            </span>
          ) : (
            <span className="text-muted">Sin asignar</span>
          )}
        </InfoRow>
      </CardContent>
    </Card>
  );
}

function RequirementCard({ lead }: { lead: LeadData }) {
  const budget =
    lead.budgetMin == null && lead.budgetMax == null
      ? "—"
      : `${formatMoney(money(lead.budgetMin), lead.currency)} – ${formatMoney(money(lead.budgetMax), lead.currency)}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Requerimiento</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
        <InfoRow icon={<ClipboardList className="h-4 w-4" />} label="Operación">
          {lead.operationType || "—"}
        </InfoRow>
        <InfoRow icon={<DollarSign className="h-4 w-4" />} label="Presupuesto">
          {budget}
        </InfoRow>
        <InfoRow icon={<Home className="h-4 w-4" />} label="Tipo de propiedad">
          {lead.propertyType || "—"}
        </InfoRow>
        <InfoRow icon={<BedDouble className="h-4 w-4" />} label="Ambientes / Dormitorios">
          {lead.rooms ?? "—"} amb. · {lead.bedrooms ?? "—"} dorm.
        </InfoRow>
        <InfoRow icon={<Landmark className="h-4 w-4" />} label="Financiación">
          {lead.financing == null ? "—" : lead.financing ? "Sí" : "No"}
        </InfoRow>
        <InfoRow icon={<PawPrint className="h-4 w-4" />} label="Mascotas">
          {lead.hasPets == null ? "—" : lead.hasPets ? "Sí" : "No"}
        </InfoRow>

        <div className="sm:col-span-2">
          <InfoRow icon={<MapPin className="h-4 w-4" />} label="Barrios preferidos">
            {lead.preferredNeighborhoods.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.preferredNeighborhoods.map((n) => (
                  <span
                    key={n}
                    className="rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {n}
                  </span>
                ))}
              </div>
            ) : (
              "—"
            )}
          </InfoRow>
        </div>

        {lead.notes && (
          <div className="sm:col-span-2">
            <InfoRow icon={<ClipboardList className="h-4 w-4" />} label="Notas">
              <p className="whitespace-pre-wrap leading-relaxed text-muted">{lead.notes}</p>
            </InfoRow>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PropertyInterestsCard({ interests }: { interests: PropertyInterest[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Propiedades consultadas</CardTitle>
      </CardHeader>
      <CardContent>
        {interests.length === 0 ? (
          <EmptyState
            icon={<Home className="h-5 w-5" />}
            title="Sin consultas"
            description="Este lead todavía no consultó ninguna propiedad."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {interests.map((pi) => (
              <li
                key={pi.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-2 p-3 transition-colors hover:border-border-strong"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{pi.property.title}</p>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3 w-3" />
                    {pi.property.neighborhood ?? pi.property.city ?? "—"}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {formatMoney(money(pi.property.price), pi.property.currency)}
                  </span>
                  <Badge variant="neutral">{pi.property.propertyType}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function TimelineCard({ history }: { history: StageHistoryEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Línea de tiempo del pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <EmptyState
            icon={<Clock className="h-5 w-5" />}
            title="Sin movimientos"
            description="Todavía no hay historial de etapas para este lead."
          />
        ) : (
          <ol className="relative ml-3 border-l border-border">
            {history.map((h) => {
              const dur = formatDuration(h.durationSeconds);
              return (
                <li key={h.id} className="relative mb-5 pl-6 last:mb-0">
                  <span className="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2 border-primary bg-surface" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {h.fromStageKey && (
                      <>
                        <span className="text-muted">{h.fromStageKey}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted" />
                      </>
                    )}
                    <span className="font-medium text-foreground">{h.toStageKey}</span>
                    <Badge variant="neutral">{h.probability}%</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 text-xs text-muted">
                    <span>{timeAgo(h.enteredAt)}</span>
                    {dur && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {dur} en etapa
                      </span>
                    )}
                  </div>
                  {h.comment && (
                    <p className="mt-1.5 rounded-lg bg-surface-2 px-3 py-1.5 text-xs text-muted">
                      {h.comment}
                    </p>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

function ScoreCard({
  score,
  band,
  factors,
}: {
  score: number;
  band?: string | null;
  factors: ScoreFactor[] | null;
}) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Flame className={cn("h-4 w-4", scoreColor(band))} />
        <CardTitle className="!p-0">Lead Score</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3">
          <span className={cn("text-4xl font-bold tabular-nums", scoreColor(band))}>
            {Math.round(score)}
          </span>
          {band && <Badge variant={bandVariant(band)}>{band}</Badge>}
        </div>

        <div className="mt-4 border-t border-border/60 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Desglose del puntaje
          </p>
          {factors == null || factors.length === 0 ? (
            <p className="text-sm text-muted">Sin desglose disponible.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {factors.map((f) => {
                const pct = f.max > 0 ? Math.min(100, Math.round((f.points / f.max) * 100)) : 0;
                return (
                  <li key={f.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{f.label}</span>
                      <span className="tabular-nums text-muted">
                        {f.points}/{f.max}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          band === "CALIENTE"
                            ? "bg-hot"
                            : band === "TIBIO"
                              ? "bg-warm"
                              : "bg-cold",
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    {f.reason && <p className="mt-1 text-xs text-muted">{f.reason}</p>}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function priorityVariant(priority: string): "hot" | "warm" | "neutral" {
  const p = priority.toUpperCase();
  if (p === "ALTA" || p === "HIGH" || p === "URGENT") return "hot";
  if (p === "MEDIA" || p === "MEDIUM") return "warm";
  return "neutral";
}

function TasksCard({ tasks }: { tasks: Task[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted" />
        <CardTitle className="!p-0">Tareas</CardTitle>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="h-5 w-5" />}
            title="Sin tareas"
            description="No hay tareas pendientes para este lead."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {tasks.map((t) => (
              <li
                key={t.id}
                className="rounded-xl border border-border bg-surface-2 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{t.title}</p>
                  <Badge variant={priorityVariant(t.priority)}>{t.priority}</Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                  <span>{t.status}</span>
                  {t.dueAt && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {timeAgo(t.dueAt)}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AppointmentsCard({ appointments }: { appointments: Appointment[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted" />
        <CardTitle className="!p-0">Agenda / Visitas</CardTitle>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <EmptyState
            icon={<Calendar className="h-5 w-5" />}
            title="Sin visitas"
            description="Este lead no tiene visitas agendadas."
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {appointments.map((a) => (
              <li
                key={a.id}
                className="rounded-xl border border-border bg-surface-2 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{a.type}</span>
                  <Badge variant="neutral">{a.status}</Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                  <Calendar className="h-3 w-3" />
                  {new Date(a.scheduledAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {a.durationMinutes && <span> · {a.durationMinutes} min</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skeleton de carga
// ---------------------------------------------------------------------------

function LeadSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <Skeleton className="h-5 w-32" />
      <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-surface/80 p-5">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-5 w-40" />
        </div>
        <Skeleton className="h-10 w-72" />
      </div>
      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-5">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 w-full rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
