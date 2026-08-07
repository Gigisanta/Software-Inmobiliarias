"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import {
  CalendarDays,
  MapPin,
  Phone,
  Video,
  Plus,
  Check,
  X,
  Trash2,
  Clock,
  User as UserIcon,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { AppointmentStatus } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { ApptModal } from "@/components/appt-modal";
import { FadeIn } from "@/components/ui/motion";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Appt = RouterOutputs["appointment"]["list"][number];

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  VISITA: { label: "Visita", icon: <MapPin className="h-4 w-4" strokeWidth={1.75} /> },
  LLAMADA: { label: "Llamada", icon: <Phone className="h-4 w-4" strokeWidth={1.75} /> },
  REUNION: { label: "Reunión", icon: <Video className="h-4 w-4" strokeWidth={1.75} /> },
};

const STATUS_META: Record<string, { label: string; variant: BadgeVariant }> = {
  AGENDADA: { label: "Agendada", variant: "neutral" },
  CONFIRMADA: { label: "Confirmada", variant: "sage" },
  REALIZADA: { label: "Realizada", variant: "forest" },
  CANCELADA: { label: "Cancelada", variant: "danger" },
  REPROGRAMADA: { label: "Reprogramada", variant: "sand" },
  NO_ASISTIO: { label: "No asistió", variant: "danger" },
};

function dayHeading(d: Date): string {
  const date = new Date(d);
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86_400_000);
  const same = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  if (same(date, today)) return "Hoy";
  if (same(date, tomorrow)) return "Mañana";
  return date.toLocaleDateString("es-AR", { weekday: "long", day: "2-digit", month: "long" });
}

function timeOf(d: Date): string {
  return new Date(d).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function AgendaPage() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Appt | null>(null);
  const [includePast, setIncludePast] = useState(false);

  const appts = useQuery(trpc.appointment.list.queryOptions({ includePast }));
  const items = appts.data ?? [];

  const setStatus = useMutation(
    trpc.appointment.setStatus.mutationOptions({ onSuccess: () => qc.invalidateQueries() }),
  );
  const remove = useMutation(
    trpc.appointment.remove.mutationOptions({ onSuccess: () => qc.invalidateQueries() }),
  );

  const groups = useMemo(() => {
    const map = new Map<string, Appt[]>();
    for (const a of items) {
      const key = dayHeading(new Date(a.scheduledAt));
      const list = map.get(key) ?? [];
      list.push(a);
      map.set(key, list);
    }
    return Array.from(map.entries());
  }, [items]);

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(a: Appt) {
    setEditing(a);
    setModalOpen(true);
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Agenda"
        subtitle="Visitas, llamadas y reuniones de los próximos días"
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" />
            Nueva visita
          </Button>
        }
      />

      <div className="mb-5 flex items-center gap-2">
        <FilterChip active={!includePast} onClick={() => setIncludePast(false)}>
          Próximas
        </FilterChip>
        <FilterChip active={includePast} onClick={() => setIncludePast(true)}>
          Todas
        </FilterChip>
      </div>

      {appts.isLoading ? (
        <div className="flex flex-col gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" strokeWidth={1.5} />}
          title="No hay eventos próximos"
          description="Agendá una visita, llamada o reunión con un lead y va a aparecer acá, ordenada por día y horario."
          action={
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" />
              Nueva visita
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map(([day, list]) => (
            <FadeIn key={day}>
              <div>
                <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-2">
                  {day}
                </h2>
                <div className="flex flex-col gap-3">
                  {list.map((a) => (
                    <ApptCard
                      key={a.id}
                      appt={a}
                      onEdit={() => openEdit(a)}
                      onComplete={() =>
                        setStatus.mutate({ id: a.id, status: AppointmentStatus.REALIZADA })
                      }
                      onCancel={() =>
                        setStatus.mutate({ id: a.id, status: AppointmentStatus.CANCELADA })
                      }
                      onDelete={() => remove.mutate({ id: a.id })}
                    />
                  ))}
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      )}

      <ApptModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          qc.invalidateQueries();
        }}
      />
    </div>
  );
}

function ApptCard({
  appt,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}: {
  appt: Appt;
  onEdit: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onDelete: () => void;
}) {
  const type = TYPE_META[appt.type] ?? TYPE_META.VISITA;
  const status = STATUS_META[appt.status] ?? STATUS_META.AGENDADA;
  const leadName = appt.lead
    ? `${appt.lead.firstName}${appt.lead.lastName ? ` ${appt.lead.lastName}` : ""}`
    : null;
  const closed = appt.status === "REALIZADA" || appt.status === "CANCELADA";

  return (
    <Card className={cn(closed && "opacity-70")}>
      <div className="flex items-start gap-4 px-5 py-4">
        <div className="flex w-16 shrink-0 flex-col items-center">
          <span className="text-base font-semibold tabular-nums text-foreground">
            {timeOf(appt.scheduledAt)}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-2">
            <Clock className="h-3 w-3" />
            {appt.durationMinutes}m
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <span className="text-muted">{type.icon}</span>
              {type.label}
            </span>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>
          {leadName ? (
            <Link
              href={`/leads/${appt.lead!.id}`}
              className="mt-1 flex items-center gap-1 text-xs text-muted transition-colors duration-[180ms] hover:text-primary"
            >
              <UserIcon className="h-3 w-3" />
              {leadName}
              {appt.lead?.phone ? <span className="text-muted-2"> · {appt.lead.phone}</span> : null}
            </Link>
          ) : null}
          {appt.notes ? (
            <p className="mt-2 rounded-xl bg-surface-2 px-3.5 py-2 text-xs leading-relaxed text-muted">
              {appt.notes}
            </p>
          ) : null}

          {!closed ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <Button variant="secondary" size="sm" onClick={onComplete}>
                <Check className="h-3.5 w-3.5" />
                Marcar realizada
              </Button>
              <Button variant="ghost" size="sm" onClick={onEdit}>
                Editar
              </Button>
              <Button variant="ghost" size="sm" onClick={onCancel}>
                <X className="h-3.5 w-3.5" />
                Cancelar
              </Button>
            </div>
          ) : (
            <div className="mt-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="text-muted-2 hover:text-(--badge-danger-fg)"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function FilterChip({
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
