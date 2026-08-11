"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import {
  CalendarDays,
  PhoneCall,
  KeyRound,
  MapPin,
  Video,
  ArrowUpRight,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, stageVariant, bandVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion";
import { formatMoney, formatTime, dayLabel, daysSince, initials, cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TodayData = RouterOutputs["dashboard"]["today"];
type SummaryData = RouterOutputs["dashboard"]["summary"];

const APPOINTMENT_TYPE: Record<string, { label: string; icon: React.ReactNode }> = {
  VISITA: { label: "Visita", icon: <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> },
  LLAMADA: { label: "Llamada", icon: <PhoneCall className="h-3.5 w-3.5" strokeWidth={1.75} /> },
  REUNION: { label: "Reunión", icon: <Video className="h-3.5 w-3.5" strokeWidth={1.75} /> },
};

export default function HoyPage() {
  const trpc = useTRPC();
  const summary = useQuery(trpc.dashboard.summary.queryOptions());
  const today = useQuery(trpc.dashboard.today.queryOptions());

  const s = summary.data;
  const t = today.data;
  const loading = summary.isLoading || today.isLoading;

  const dateLabel = new Date().toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <PageHeader
        title="Hoy"
        subtitle={dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}
      />

      {/* Resumen silencioso del día */}
      <FadeIn>
        <QuietStats summary={s} today={t} loading={loading} />
      </FadeIn>

      {/* Tarjetas de trabajo: qué hacer ahora */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeIn delay={0.04}>
          <VisitsCard today={t} loading={loading} />
        </FadeIn>
        <FadeIn delay={0.08}>
          <FollowUpsCard today={t} loading={loading} />
        </FadeIn>
        <FadeIn delay={0.12}>
          <OperationsCard today={t} loading={loading} />
        </FadeIn>
      </div>

      {/* Embudo + equipo */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <FadeIn delay={0.16} className="lg:col-span-2">
          <FunnelCard summary={s} loading={loading} />
        </FadeIn>
        <FadeIn delay={0.2}>
          <TeamCard today={t} loading={loading} />
        </FadeIn>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Resumen: una sola línea de números discretos                        */
/* ------------------------------------------------------------------ */

function QuietStats({
  summary,
  today,
  loading,
}: {
  summary: SummaryData | undefined;
  today: TodayData | undefined;
  loading: boolean;
}) {
  if (loading || !summary || !today) {
    return <Skeleton className="h-20 rounded-2xl" />;
  }

  const stats = [
    { label: "Visitas próximas", value: today.appointments.length },
    { label: "Sin seguimiento", value: today.followUps.length },
    { label: "Operaciones activas", value: today.operations.length },
    { label: "Leads abiertos", value: summary.kpis.open },
    { label: "Ganados", value: summary.kpis.won },
  ];

  return (
    <Card>
      <CardContent className="grid grid-cols-2 gap-x-6 gap-y-5 px-6 py-6 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((stat) => (
          <div key={stat.label}>
            <div className="text-2xl font-semibold tabular-nums text-foreground">{stat.value}</div>
            <div className="mt-1 text-xs text-muted">{stat.label}</div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Próximas visitas                                                    */
/* ------------------------------------------------------------------ */

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-surface-2 text-muted">
          {icon}
        </span>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function QuietEmpty({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-muted-2">{text}</p>;
}

function VisitsCard({ today, loading }: { today: TodayData | undefined; loading: boolean }) {
  return (
    <SectionCard
      icon={<CalendarDays className="h-4 w-4" strokeWidth={1.75} />}
      title="Próximas visitas"
    >
      {loading || !today ? (
        <ListSkeleton />
      ) : today.appointments.length === 0 ? (
        <QuietEmpty text="No hay visitas agendadas." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {today.appointments.map((a) => {
            const type = APPOINTMENT_TYPE[a.type] ?? APPOINTMENT_TYPE.VISITA;
            return (
              <li key={a.id} className="py-3.5 first:pt-0 last:pb-0">
                <ItemLink href={a.lead ? `/leads/${a.lead.id}` : "/agenda"}>
                  <div className="w-14 shrink-0">
                    <div className="text-sm font-semibold tabular-nums text-foreground">
                      {formatTime(a.scheduledAt)}
                    </div>
                    <div className="text-[11px] text-muted-2">{dayLabel(a.scheduledAt)}</div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {a.property?.title ?? type.label}
                    </p>
                    {a.lead ? (
                      <p className="mt-0.5 truncate text-xs text-muted">
                        Cliente: {a.lead.firstName} {a.lead.lastName ?? ""}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="sand">
                    {type.icon}
                    {type.label}
                  </Badge>
                </ItemLink>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Seguimientos pendientes                                             */
/* ------------------------------------------------------------------ */

function FollowUpsCard({ today, loading }: { today: TodayData | undefined; loading: boolean }) {
  return (
    <SectionCard
      icon={<PhoneCall className="h-4 w-4" strokeWidth={1.75} />}
      title="Seguimientos pendientes"
    >
      {loading || !today ? (
        <ListSkeleton />
      ) : today.followUps.length === 0 ? (
        <QuietEmpty text="Todos los leads están al día." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {today.followUps.map((lead) => {
            const days = daysSince(lead.lastActivityAt);
            return (
              <li key={lead.id} className="py-3.5 first:pt-0 last:pb-0">
                <ItemLink href={`/leads/${lead.id}`}>
                  <Avatar
                    initials={initials(lead.firstName, lead.lastName)}
                    size="sm"
                    tone="neutral"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {lead.firstName} {lead.lastName ?? ""}
                    </p>
                    <p className={cn("mt-0.5 text-xs", days >= 5 ? "text-danger" : "text-muted")}>
                      Hace {days} {days === 1 ? "día" : "días"} sin respuesta
                    </p>
                  </div>
                  <Badge variant={stageVariant(lead.currentStage?.key)}>
                    {lead.currentStage?.name ?? "Sin etapa"}
                  </Badge>
                </ItemLink>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Operaciones activas                                                 */
/* ------------------------------------------------------------------ */

const OPERATION_HINT: Record<string, string> = {
  NEGOCIACION: "Negociación en curso",
  RESERVA: "Reserva en proceso",
  ESCRIBANIA: "Escritura programada",
};

function OperationsCard({ today, loading }: { today: TodayData | undefined; loading: boolean }) {
  return (
    <SectionCard
      icon={<KeyRound className="h-4 w-4" strokeWidth={1.75} />}
      title="Operaciones activas"
    >
      {loading || !today ? (
        <ListSkeleton />
      ) : today.operations.length === 0 ? (
        <QuietEmpty text="No hay operaciones en curso." />
      ) : (
        <ul className="flex flex-col divide-y divide-border">
          {today.operations.map((lead) => {
            const property = lead.propertyInterests[0]?.property;
            const amount = lead.budgetMax ?? lead.budgetMin;
            return (
              <li key={lead.id} className="py-3.5 first:pt-0 last:pb-0">
                <ItemLink href={`/leads/${lead.id}`}>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {property?.title ?? `${lead.firstName} ${lead.lastName ?? ""}`}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted">
                      {OPERATION_HINT[lead.currentStage?.key ?? ""] ?? lead.currentStage?.name}
                      {amount != null ? ` · ${formatMoney(String(amount), lead.currency)}` : ""}
                    </p>
                  </div>
                  <Badge variant={stageVariant(lead.currentStage?.key)}>
                    {lead.currentStage?.name}
                  </Badge>
                </ItemLink>
              </li>
            );
          })}
        </ul>
      )}
    </SectionCard>
  );
}

/* ------------------------------------------------------------------ */
/* Embudo minimalista                                                  */
/* ------------------------------------------------------------------ */

function FunnelCard({ summary, loading }: { summary: SummaryData | undefined; loading: boolean }) {
  const funnel = summary?.funnel ?? [];
  const maxCount = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Embudo del pipeline</CardTitle>
        {summary && (
          <span className="text-xs text-muted-2">
            {summary.scope === "own" ? "Mis leads" : "Toda la inmobiliaria"}
          </span>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {loading || !summary
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-8" />)
          : funnel.map((f) => (
              <Link key={f.stage.id} href="/clientes?vista=tablero" className="group block">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm text-foreground">{f.stage.name}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted">
                    {f.count} · {formatMoney(f.potentialValue)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div
                    className="h-full rounded-full bg-primary/70 transition-[width] duration-300 ease-out group-hover:bg-primary"
                    style={{ width: `${Math.max(3, (f.count / maxCount) * 100)}%` }}
                  />
                </div>
              </Link>
            ))}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Equipo                                                              */
/* ------------------------------------------------------------------ */

function TeamCard({ today, loading }: { today: TodayData | undefined; loading: boolean }) {
  const advisors = today?.advisors ?? [];

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Equipo</CardTitle>
      </CardHeader>
      <CardContent>
        {loading || !today ? (
          <ListSkeleton />
        ) : advisors.length === 0 ? (
          <QuietEmpty text="Visible para dueños y gerentes." />
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {advisors.map((advisor) => (
              <li key={advisor.id} className="flex items-center gap-3 py-3.5 first:pt-0 last:pb-0">
                <Avatar initials={initials(advisor.firstName, advisor.lastName)} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {advisor.firstName} {advisor.lastName}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-muted">
                  {advisor.won} {advisor.won === 1 ? "venta" : "ventas"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Piezas compartidas                                                  */
/* ------------------------------------------------------------------ */

function ItemLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group -mx-2 flex items-center gap-3 rounded-xl px-2 py-1 transition-colors duration-[180ms] ease-out hover:bg-surface-2/60"
    >
      {children}
      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-transparent transition-colors duration-[180ms] group-hover:text-muted-2" />
    </Link>
  );
}

function ListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12" />
      ))}
    </div>
  );
}
