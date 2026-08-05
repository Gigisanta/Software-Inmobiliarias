"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { CalendarDays, MapPin, Phone, Video } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/ui/motion";
import { formatTime, dayLabel } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TodayAppointment = RouterOutputs["dashboard"]["today"]["appointments"][number];

const TYPE_META: Record<string, { label: string; icon: React.ReactNode }> = {
  VISITA: { label: "Visita", icon: <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} /> },
  LLAMADA: { label: "Llamada", icon: <Phone className="h-3.5 w-3.5" strokeWidth={1.75} /> },
  REUNION: { label: "Reunión", icon: <Video className="h-3.5 w-3.5" strokeWidth={1.75} /> },
};

export default function AgendaPage() {
  const trpc = useTRPC();
  const today = useQuery(trpc.dashboard.today.queryOptions());

  const appointments = today.data?.appointments ?? [];

  // Agrupa por día conservando el orden cronológico.
  const groups = appointments.reduce<Map<string, TodayAppointment[]>>((acc, a) => {
    const key = dayLabel(a.scheduledAt);
    const list = acc.get(key) ?? [];
    list.push(a);
    acc.set(key, list);
    return acc;
  }, new Map());

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Agenda"
        subtitle="Visitas, llamadas y reuniones de los próximos días"
      />

      {today.isLoading ? (
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="h-6 w-6" strokeWidth={1.5} />}
          title="No hay eventos próximos"
          description="Cuando agendes visitas, llamadas o reuniones con tus leads, van a aparecer acá ordenadas por día y horario."
        />
      ) : (
        <div className="flex flex-col gap-8">
          {[...groups.entries()].map(([day, events], groupIndex) => (
            <FadeIn key={day} delay={groupIndex * 0.05}>
              <section>
                <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-2">
                  {day}
                </h2>
                <Card>
                  <ul className="flex flex-col divide-y divide-border">
                    {events.map((a) => {
                      const meta = TYPE_META[a.type] ?? TYPE_META.VISITA;
                      return (
                        <li key={a.id}>
                          <Link
                            href={a.lead ? `/leads/${a.lead.id}` : "#"}
                            className="flex items-center gap-5 px-6 py-5 transition-colors duration-[180ms] ease-out hover:bg-surface-2/60"
                          >
                            <div className="w-14 shrink-0 text-center">
                              <div className="text-base font-semibold tabular-nums text-foreground">
                                {formatTime(a.scheduledAt)}
                              </div>
                              <div className="text-[11px] text-muted-2">{a.durationMinutes} min</div>
                            </div>

                            <div className="h-10 w-px bg-border" />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">
                                {a.property?.title ?? meta.label}
                              </p>
                              {a.lead ? (
                                <p className="mt-0.5 truncate text-xs text-muted">
                                  Cliente: {a.lead.firstName} {a.lead.lastName ?? ""}
                                </p>
                              ) : null}
                              {a.notes ? (
                                <p className="mt-0.5 truncate text-xs text-muted-2">{a.notes}</p>
                              ) : null}
                            </div>

                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <Badge variant="sand">
                                {meta.icon}
                                {meta.label}
                              </Badge>
                              <Badge variant={a.status === "CONFIRMADA" ? "sage" : "neutral"}>
                                {a.status === "CONFIRMADA" ? "Confirmada" : "Agendada"}
                              </Badge>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </Card>
              </section>
            </FadeIn>
          ))}
        </div>
      )}
    </div>
  );
}
