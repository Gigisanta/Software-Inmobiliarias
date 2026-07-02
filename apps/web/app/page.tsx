"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Radar, Flame, TrendingUp, UserPlus, Trophy, Inbox, Users2 } from "lucide-react";
import { useTRPC } from "@/trpc/client";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, bandVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { formatMoney, initials, timeAgo, cn } from "@/lib/utils";

export default function OperacionesPage() {
  const trpc = useTRPC();
  const summary = useQuery(trpc.dashboard.summary.queryOptions());
  const opps = useQuery(trpc.lead.opportunities.queryOptions({ limit: 8 }));

  const s = summary.data;
  const maxCount = s ? Math.max(1, ...s.funnel.map((f) => f.count)) : 1;

  return (
    <div className="animate-in">
      <PageHeader
        title="Centro de Operaciones"
        subtitle="Torre de control de la inmobiliaria en tiempo real"
        icon={<Radar className="h-5 w-5" />}
        actions={
          <span className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted">
            <span className="h-2 w-2 rounded-full bg-success live-dot" /> En vivo
          </span>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {summary.isLoading || !s ? (
          Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)
        ) : (
          <>
            <StatCard label="Nuevos hoy" value={s.kpis.newToday} icon={<UserPlus className="h-4 w-4" />} tone="primary" />
            <StatCard label="Hot leads" value={s.kpis.hot} icon={<Flame className="h-4 w-4" />} tone="hot" hint="score alto" />
            <StatCard label="Abiertos" value={s.kpis.open} icon={<TrendingUp className="h-4 w-4" />} />
            <StatCard label="Ganados" value={s.kpis.won} icon={<Trophy className="h-4 w-4" />} tone="success" />
            <StatCard label="Sin asignar" value={s.kpis.unassigned} icon={<Inbox className="h-4 w-4" />} tone={s.kpis.unassigned > 0 ? "danger" : "default"} />
            <StatCard label="Equipo activo" value={s.team} icon={<Users2 className="h-4 w-4" />} />
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        {/* Embudo */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex items-center justify-between">
            <CardTitle>Embudo del pipeline</CardTitle>
            {s && <span className="text-xs text-muted">{s.scope === "own" ? "mis leads" : "toda la inmobiliaria"}</span>}
          </CardHeader>
          <CardContent className="space-y-2.5">
            {summary.isLoading || !s
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-9" />)
              : s.funnel.map((f) => (
                  <Link
                    href={`/pipeline`}
                    key={f.stage.id}
                    className="group flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/5"
                  >
                    <span className="w-36 shrink-0 truncate text-sm">{f.stage.name}</span>
                    <div className="relative h-7 flex-1 overflow-hidden rounded-md bg-surface-2">
                      <div
                        className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-primary/70 to-accent/60 transition-all"
                        style={{ width: `${(f.count / maxCount) * 100}%` }}
                      />
                      <span className="absolute inset-y-0 left-2 flex items-center text-xs font-semibold">
                        {f.count}
                      </span>
                    </div>
                    <span className="w-28 shrink-0 text-right text-xs text-muted">
                      {formatMoney(f.potentialValue)}
                    </span>
                  </Link>
                ))}
          </CardContent>
        </Card>

        {/* Oportunidades del día */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-hot" /> Oportunidades del día
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {opps.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14" />
                ))}
              </div>
            ) : !opps.data || opps.data.length === 0 ? (
              <EmptyState title="Sin oportunidades" description="Cuando entren leads aparecerán acá, priorizados por score." />
            ) : (
              <ul className="divide-y divide-border">
                {opps.data.map((o) => (
                  <li key={o.lead.id}>
                    <Link href={`/leads/${o.lead.id}`} className="flex items-center gap-3 py-2.5 transition-colors hover:opacity-90">
                      <ScoreDot score={o.score} band={o.band} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {o.lead.firstName} {o.lead.lastName ?? ""}
                        </div>
                        <div className="truncate text-xs text-muted">
                          {o.lead.currentStage.name} · {timeAgo(o.lead.lastActivityAt)}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant={bandVariant(o.band)}>{o.action}</Badge>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ScoreDot({ score, band }: { score: number; band?: string | null }) {
  const color = band === "CALIENTE" ? "text-hot" : band === "TIBIO" ? "text-warm" : "text-cold";
  return (
    <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-sm font-bold tabular-nums", color)}>
      {score}
    </div>
  );
}
