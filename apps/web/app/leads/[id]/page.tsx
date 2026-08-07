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
  House,
  CalendarDays,
  ListChecks,
  Building2,
  Radio,
  User as UserIcon,
  Banknote,
  BedDouble,
  Landmark,
  PawPrint,
  FileText,
  ChevronsUpDown,
  ArrowRight,
  Clock,
  Check,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PipelineStageKey, ScoreBand, OperationType as OperationTypeEnum } from "@reos/core";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, stageVariant, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Field, Select } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { TaskModal } from "@/components/task-modal";
import { ApptModal } from "@/components/appt-modal";
import { cn, formatMoney, timeAgo, initials } from "@/lib/utils";
import { Pencil, Plus, Loader2, Sparkles } from "lucide-react";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type LeadData = RouterOutputs["lead"]["byId"];
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

const OPERATION_LABEL: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  ALQUILER_TEMPORAL: "Alquiler temporal",
};

const PROPERTY_LABEL: Record<string, string> = {
  DEPARTAMENTO: "Departamento",
  CASA: "Casa",
  PH: "PH",
  TERRENO: "Terreno",
  LOCAL: "Local",
  OFICINA: "Oficina",
  COCHERA: "Cochera",
  GALPON: "Galpón",
  CAMPO: "Campo",
  OTRO: "Otro",
};

const FINANCING_LABEL: Record<string, string> = {
  CONTADO: "Contado",
  CREDITO_HIPOTECARIO: "Crédito hipotecario",
  MIXTO: "Mixto",
  A_DEFINIR: "A definir",
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

const STAGE_KEY_LABEL: Record<string, string> = {
  NUEVO_LEAD: "Nuevo lead",
  PRIMER_CONTACTO: "Primer contacto",
  INTERESADO: "Interesado",
  VISITA_AGENDADA: "Visita agendada",
  VISITA_REALIZADA: "Visita realizada",
  NEGOCIACION: "Negociación",
  RESERVA: "Reserva",
  ESCRIBANIA: "Escribanía",
  CERRADO_GANADO: "Vendido",
  PERDIDO: "Perdido",
};

const TASK_STATUS_LABEL: Record<string, string> = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  CANCELADA: "Cancelada",
};

const PRIORITY_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const APPOINTMENT_TYPE_LABEL: Record<string, string> = {
  VISITA: "Visita",
  LLAMADA: "Llamada",
  REUNION: "Reunión",
};

const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  AGENDADA: "Agendada",
  CONFIRMADA: "Confirmada",
  REALIZADA: "Realizada",
  CANCELADA: "Cancelada",
  REPROGRAMADA: "Reprogramada",
  NO_ASISTIO: "No asistió",
};

function statusVariant(status: LeadStatus): "sage" | "forest" | "danger" {
  if (status === "WON") return "forest";
  if (status === "LOST") return "danger";
  return "sage";
}

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

function money(value: unknown): string | null {
  if (value == null) return null;
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

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const trpc = useTRPC();
  const qc = useQueryClient();

  const lead = useQuery(trpc.lead.byId.queryOptions({ id }));
  const stages = useQuery(trpc.pipeline.list.queryOptions());

  const [editOpen, setEditOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);

  const changeStage = useMutation(
    trpc.lead.changeStage.mutationOptions({
      onSuccess: () => qc.invalidateQueries(),
    }),
  );

  const classify = useMutation(
    trpc.lead.update.mutationOptions({
      onSuccess: () => qc.invalidateQueries(),
    }),
  );

  if (lead.isLoading) return <LeadSkeleton />;

  if (lead.error || !lead.data) {
    return (
      <div>
        <BackLink />
        <div className="mt-6">
          <EmptyState
            icon={<UserIcon className="h-6 w-6" strokeWidth={1.5} />}
            title="Lead no encontrado"
            description="No pudimos cargar la ficha de este lead. Puede que haya sido eliminado o que el enlace no sea válido."
            action={
              <Link href="/leads">
                <Button variant="secondary">Ir a leads</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const l = lead.data;
  const factors = parseScoreFactors(l.scoreFactors);
  const stageList: StageOption[] = stages.data ?? [];
  const status = l.status as LeadStatus;
  const fullName = `${l.firstName} ${l.lastName}`.trim();

  return (
    <div>
      <BackLink />

      <FadeIn>
        <Card className="mt-5">
          <CardContent className="flex flex-col gap-6 px-6 py-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Avatar initials={initials(l.firstName, l.lastName)} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {fullName || "Lead"}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Badge variant={statusVariant(status)}>{STATUS_LABEL[status]}</Badge>
                  {l.scoreBand && (
                    <Badge variant={bandVariant(l.scoreBand)}>{BAND_LABEL[l.scoreBand]}</Badge>
                  )}
                  {l.currentStage && (
                    <Badge variant={stageVariant(l.currentStage.key)}>{l.currentStage.name}</Badge>
                  )}
                  <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="h-3.5 w-3.5" />
                    Editar ficha
                  </Button>
                </div>
              </div>
            </div>

            <StageSelector
              current={l.currentStage}
              stages={stageList}
              disabled={changeStage.isPending}
              pendingKey={
                changeStage.isPending
                  ? ((changeStage.variables as { toStageKey?: string } | undefined)?.toStageKey ?? null)
                  : null
              }
              onSelect={(toStageKey) =>
                changeStage.mutate({ leadId: id, toStageKey: toStageKey as PipelineStageKey })
              }
            />
          </CardContent>
        </Card>
      </FadeIn>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <FadeIn delay={0.04}>
            <ContactCard lead={l} />
          </FadeIn>
          <FadeIn delay={0.08}>
            <RequirementCard lead={l} />
          </FadeIn>
          <FadeIn delay={0.12}>
            <PropertyInterestsCard interests={l.propertyInterests} />
          </FadeIn>
          <FadeIn delay={0.16}>
            <TimelineCard history={l.stageHistory} />
          </FadeIn>
        </div>

        <div className="flex flex-col gap-6">
          <FadeIn delay={0.06}>
            <ScoreCard
              score={l.score}
              band={l.scoreBand}
              factors={factors}
              onClassify={(band) => classify.mutate({ id, patch: { scoreBand: band } })}
              classifying={classify.isPending}
            />
          </FadeIn>
          <FadeIn delay={0.1}>
            <TasksCard tasks={l.tasks} onAdd={() => setTaskOpen(true)} />
          </FadeIn>
          <FadeIn delay={0.14}>
            <AppointmentsCard appointments={l.appointments} onAdd={() => setApptOpen(true)} />
          </FadeIn>
        </div>
      </div>

      <EditLeadModal lead={l} open={editOpen} onClose={() => setEditOpen(false)} onSaved={() => { setEditOpen(false); qc.invalidateQueries(); }} />
      <TaskModal open={taskOpen} onClose={() => setTaskOpen(false)} onCreated={() => { setTaskOpen(false); qc.invalidateQueries(); }} presetLeadId={id} />
      <ApptModal open={apptOpen} editing={null} onClose={() => setApptOpen(false)} onSaved={() => { setApptOpen(false); qc.invalidateQueries(); }} presetLeadId={id} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-componentes                                                     */
/* ------------------------------------------------------------------ */

function BackLink() {
  return (
    <Link
      href="/leads"
      className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors duration-[180ms] hover:text-foreground"
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
      <p className="mb-1.5 text-xs font-medium text-muted">Etapa del pipeline</p>
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="w-full justify-between"
      >
        <span className="truncate">{current?.name ?? "Sin etapa"}</span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-2" />
      </Button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Cerrar selector"
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute right-0 z-20 mt-2 max-h-80 w-full overflow-auto rounded-2xl border border-border bg-surface p-1.5 shadow-overlay">
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
                      "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors duration-[180ms]",
                      isCurrent
                        ? "bg-primary-soft text-primary"
                        : "text-foreground hover:bg-surface-2",
                      disabled && !isCurrent && "opacity-50",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="tabular-nums text-xs text-muted-2">{stage.order}.</span>
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
    <div className="flex items-start gap-3.5 py-3">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{label}</p>
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
      <CardContent className="divide-y divide-border">
        <InfoRow icon={<Phone className="h-4 w-4" strokeWidth={1.75} />} label="Teléfono">
          {lead.phone ? (
            <a href={`tel:${lead.phone}`} className="transition-colors duration-[180ms] hover:text-primary">
              {lead.phone}
            </a>
          ) : (
            "—"
          )}
        </InfoRow>
        <InfoRow icon={<Mail className="h-4 w-4" strokeWidth={1.75} />} label="Email">
          {lead.email ? (
            <a
              href={`mailto:${lead.email}`}
              className="truncate transition-colors duration-[180ms] hover:text-primary"
            >
              {lead.email}
            </a>
          ) : (
            "—"
          )}
        </InfoRow>
        <InfoRow icon={<Radio className="h-4 w-4" strokeWidth={1.75} />} label="Canal">
          {lead.channel ? (CHANNEL_LABEL[lead.channel] ?? lead.channel) : "—"}
          {lead.source && <span className="text-muted"> · {lead.source}</span>}
        </InfoRow>
        <InfoRow icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />} label="Sucursal">
          {lead.branch?.name ?? "—"}
        </InfoRow>
        <InfoRow icon={<UserIcon className="h-4 w-4" strokeWidth={1.75} />} label="Asesor asignado">
          {lead.assignedTo ? (
            <span className="flex items-center gap-2">
              <Avatar
                size="xs"
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
      <CardContent className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
        <InfoRow icon={<FileText className="h-4 w-4" strokeWidth={1.75} />} label="Operación">
          {lead.operationType ? (OPERATION_LABEL[lead.operationType] ?? lead.operationType) : "—"}
        </InfoRow>
        <InfoRow icon={<Banknote className="h-4 w-4" strokeWidth={1.75} />} label="Presupuesto">
          {budget}
        </InfoRow>
        <InfoRow icon={<House className="h-4 w-4" strokeWidth={1.75} />} label="Tipo de propiedad">
          {lead.propertyType ? (PROPERTY_LABEL[lead.propertyType] ?? lead.propertyType) : "—"}
        </InfoRow>
        <InfoRow icon={<BedDouble className="h-4 w-4" strokeWidth={1.75} />} label="Ambientes / Dormitorios">
          {lead.rooms ?? "—"} amb. · {lead.bedrooms ?? "—"} dorm.
        </InfoRow>
        <InfoRow icon={<Landmark className="h-4 w-4" strokeWidth={1.75} />} label="Financiación">
          {lead.financing ? (FINANCING_LABEL[lead.financing] ?? lead.financing) : "—"}
        </InfoRow>
        <InfoRow icon={<PawPrint className="h-4 w-4" strokeWidth={1.75} />} label="Mascotas">
          {lead.hasPets == null ? "—" : lead.hasPets ? "Sí" : "No"}
        </InfoRow>

        <div className="sm:col-span-2">
          <InfoRow icon={<MapPin className="h-4 w-4" strokeWidth={1.75} />} label="Barrios preferidos">
            {lead.preferredNeighborhoods.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {lead.preferredNeighborhoods.map((n) => (
                  <Badge key={n}>{n}</Badge>
                ))}
              </div>
            ) : (
              "—"
            )}
          </InfoRow>
        </div>

        {lead.notes && (
          <div className="sm:col-span-2">
            <InfoRow icon={<FileText className="h-4 w-4" strokeWidth={1.75} />} label="Notas">
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
          <p className="py-4 text-center text-sm text-muted-2">
            Este lead todavía no consultó ninguna propiedad.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {interests.map((pi) => (
              <li key={pi.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                <div className="flex min-w-0 items-center gap-3.5">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-surface-2 text-muted">
                    <House className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{pi.property.title}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                      <MapPin className="h-3 w-3" />
                      {pi.property.neighborhood ?? pi.property.city ?? "—"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-medium tabular-nums text-foreground">
                    {formatMoney(money(pi.property.price), pi.property.currency)}
                  </span>
                  <Badge>{pi.property.propertyType}</Badge>
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
        <CardTitle>Línea de tiempo</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-2">
            Todavía no hay historial de etapas para este lead.
          </p>
        ) : (
          <ol className="relative ml-1.5 border-l border-border">
            {history.map((h) => {
              const dur = formatDuration(h.durationSeconds);
              return (
                <li key={h.id} className="relative mb-6 pl-6 last:mb-0">
                  <span className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-primary bg-surface" />
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {h.fromStageKey && (
                      <>
                        <span className="text-muted">
                          {STAGE_KEY_LABEL[h.fromStageKey] ?? h.fromStageKey}
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-2" />
                      </>
                    )}
                    <span className="font-medium text-foreground">
                      {STAGE_KEY_LABEL[h.toStageKey] ?? h.toStageKey}
                    </span>
                    {h.probability != null && <Badge>{h.probability}%</Badge>}
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
                    <p className="mt-2 rounded-xl bg-surface-2 px-3.5 py-2 text-xs leading-relaxed text-muted">
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

const CLASSIFY_OPTIONS: { band: ScoreBand; label: string }[] = [
  { band: ScoreBand.CALIENTE, label: "Caliente" },
  { band: ScoreBand.TIBIO, label: "Tibio" },
  { band: ScoreBand.FRIO, label: "Frío" },
];

function ScoreCard({
  score,
  band,
  factors,
  onClassify,
  classifying,
}: {
  score: number;
  band?: string | null;
  factors: ScoreFactor[] | null;
  onClassify: (band: ScoreBand) => void;
  classifying: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Prioridad del lead</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-semibold tabular-nums text-foreground">
            {Math.round(score)}
          </span>
          <span className="text-sm text-muted-2">/ 100</span>
          {band && <Badge variant={bandVariant(band)}>{BAND_LABEL[band]}</Badge>}
        </div>

        {/* Clasificación manual (plan Básico). */}
        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-medium text-muted">
            <Sparkles className="h-3.5 w-3.5" />
            Clasificar manualmente
          </p>
          <div className="flex items-center gap-1.5">
            {CLASSIFY_OPTIONS.map((opt) => {
              const active = band === opt.band;
              return (
                <button
                  key={opt.band}
                  type="button"
                  disabled={classifying}
                  onClick={() => onClassify(opt.band)}
                  className={cn(
                    "flex-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-[180ms] disabled:opacity-50",
                    active
                      ? "border-primary/40 bg-primary-soft text-primary"
                      : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-5">
          <p className="mb-4 text-xs font-medium text-muted">Desglose del puntaje</p>
          {factors == null || factors.length === 0 ? (
            <p className="text-sm text-muted-2">Sin desglose disponible.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {factors.map((f) => {
                const pct = f.max > 0 ? Math.min(100, Math.round((f.points / f.max) * 100)) : 0;
                return (
                  <li key={f.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{f.label}</span>
                      <span className="tabular-nums text-xs text-muted">
                        {f.points}/{f.max}
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-surface-2">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
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

function priorityVariant(priority: string): "amber" | "sand" | "neutral" {
  const p = priority.toUpperCase();
  if (p === "ALTA" || p === "URGENTE") return "amber";
  if (p === "MEDIA") return "sand";
  return "neutral";
}

function TasksCard({ tasks, onAdd }: { tasks: Task[]; onAdd: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
            <ListChecks className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <CardTitle>Tareas</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Nueva
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-2">No hay tareas pendientes.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {tasks.map((t) => (
              <li key={t.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-medium leading-snug text-foreground">{t.title}</p>
                  <Badge variant={priorityVariant(t.priority)}>
                    {PRIORITY_LABEL[t.priority] ?? t.priority}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-3 text-xs text-muted">
                  <span>{TASK_STATUS_LABEL[t.status] ?? t.status}</span>
                  {t.dueAt && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
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

function AppointmentsCard({ appointments, onAdd }: { appointments: Appointment[]; onAdd: () => void }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
            <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <CardTitle>Visitas y reuniones</CardTitle>
        </div>
        <Button variant="ghost" size="sm" onClick={onAdd}>
          <Plus className="h-3.5 w-3.5" />
          Agendar
        </Button>
      </CardHeader>
      <CardContent>
        {appointments.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-2">No hay visitas agendadas.</p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {appointments.map((a) => (
              <li key={a.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {APPOINTMENT_TYPE_LABEL[a.type] ?? a.type}
                  </span>
                  <Badge variant={a.status === "CONFIRMADA" ? "sage" : "neutral"}>
                    {APPOINTMENT_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>
                <div className="mt-1.5 flex items-center gap-1 text-xs text-muted">
                  <CalendarDays className="h-3 w-3" />
                  {new Date(a.scheduledAt).toLocaleString("es-AR", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
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

/* ------------------------------------------------------------------ */
/* Edición de ficha                                                    */
/* ------------------------------------------------------------------ */

function EditLeadModal({
  lead,
  open,
  onClose,
  onSaved,
}: {
  lead: LeadData;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const trpc = useTRPC();
  const [firstName, setFirstName] = useState(lead.firstName ?? "");
  const [lastName, setLastName] = useState(lead.lastName ?? "");
  const [phone, setPhone] = useState(lead.phone ?? "");
  const [email, setEmail] = useState(lead.email ?? "");
  const [operationType, setOperationType] = useState<string>(lead.operationType ?? "");
  const [budgetMin, setBudgetMin] = useState(lead.budgetMin != null ? String(lead.budgetMin) : "");
  const [budgetMax, setBudgetMax] = useState(lead.budgetMax != null ? String(lead.budgetMax) : "");
  const [notes, setNotes] = useState(lead.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  // Re-sincroniza al abrir con otro lead.
  const [lastId, setLastId] = useState(lead.id);
  if (lastId !== lead.id) {
    setLastId(lead.id);
    setFirstName(lead.firstName ?? "");
    setLastName(lead.lastName ?? "");
    setPhone(lead.phone ?? "");
    setEmail(lead.email ?? "");
    setOperationType(lead.operationType ?? "");
    setBudgetMin(lead.budgetMin != null ? String(lead.budgetMin) : "");
    setBudgetMax(lead.budgetMax != null ? String(lead.budgetMax) : "");
    setNotes(lead.notes ?? "");
  }

  const update = useMutation(
    trpc.lead.update.mutationOptions({
      onSuccess: () => onSaved(),
      onError: (err: unknown) =>
        setError(err instanceof Error ? err.message : "No pudimos guardar la ficha."),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return setError("El nombre es obligatorio.");
    const min = budgetMin.trim() === "" ? null : Number(budgetMin);
    const max = budgetMax.trim() === "" ? null : Number(budgetMax);
    if (min != null && Number.isNaN(min)) return setError("El presupuesto mínimo debe ser un número.");
    if (max != null && Number.isNaN(max)) return setError("El presupuesto máximo debe ser un número.");

    update.mutate({
      id: lead.id,
      patch: {
        firstName: firstName.trim(),
        lastName: lastName.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        operationType: operationType ? (operationType as OperationTypeEnum) : undefined,
        budgetMin: min,
        budgetMax: max,
        notes: notes.trim() || null,
      },
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar ficha" description="Actualizá los datos del lead.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre" required>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} autoFocus />
          </Field>
          <Field label="Apellido">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </Field>
          <Field label="Teléfono">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />
          </Field>
          <Field label="Email">
            <Input value={email} onChange={(e) => setEmail(e.target.value)} inputMode="email" />
          </Field>
        </div>

        <Field label="Operación">
          <Select
            value={operationType}
            onValueChange={setOperationType}
            placeholder="Sin definir"
            options={[
              { value: OperationTypeEnum.COMPRA, label: "Compra" },
              { value: OperationTypeEnum.VENTA, label: "Venta" },
              { value: OperationTypeEnum.ALQUILER, label: "Alquiler" },
              { value: OperationTypeEnum.ALQUILER_TEMPORAL, label: "Alquiler temporal" },
            ]}
          />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Presupuesto mín.">
            <Input value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)} inputMode="numeric" />
          </Field>
          <Field label="Presupuesto máx.">
            <Input value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)} inputMode="numeric" />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
        </Field>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={update.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------------------------------------------ */
/* Skeleton                                                            */
/* ------------------------------------------------------------------ */

function LeadSkeleton() {
  return (
    <div>
      <Skeleton className="h-5 w-32" />
      <Skeleton className="mt-5 h-28 rounded-2xl" />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-52 rounded-2xl" />
          ))}
        </div>
        <div className="flex flex-col gap-6">
          {[0, 1].map((i) => (
            <Skeleton key={i} className="h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
