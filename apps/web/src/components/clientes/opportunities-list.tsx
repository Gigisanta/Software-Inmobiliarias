"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { Handshake, ArrowRight, Phone } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, stageVariant, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { FadeIn } from "@/components/ui/motion";
import { timeAgo, initials } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type Opportunity = RouterOutputs["lead"]["opportunities"][number];

const CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  LANDING: "Landing",
  PORTAL: "Portal",
  LLAMADA: "Llamada",
  REFERIDO: "Referido",
  MANUAL: "Manual",
  OTRO: "Otro",
};

/** Vista Prioridad: los leads con mayor probabilidad de cierre, primero. */
export function OpportunitiesList() {
  const trpc = useTRPC();
  const opps = useQuery(trpc.lead.opportunities.queryOptions({ limit: 25 }));
  const opportunities = opps.data ?? [];

  if (opps.isLoading) return <OpportunitiesSkeleton />;
  if (opps.isError) {
    return (
      <EmptyState
        icon={<Handshake className="h-6 w-6" strokeWidth={1.5} />}
        title="No pudimos cargar la priorización"
        description="Ocurrió un error al priorizar tus leads. Volvé a intentar en unos segundos."
      />
    );
  }
  if (opportunities.length === 0) {
    return (
      <EmptyState
        icon={<Handshake className="h-6 w-6" strokeWidth={1.5} />}
        title="Todavía no hay leads priorizados"
        description="Cuando entren leads y sumen actividad, vas a ver acá los de mayor probabilidad de cierre, listos para accionar."
      />
    );
  }

  return (
    <ol className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {opportunities.map((opp, index) => (
        <FadeIn key={opp.lead.id} delay={index * 0.03}>
          <OpportunityCard opportunity={opp} rank={index + 1} />
        </FadeIn>
      ))}
    </ol>
  );
}

function OpportunityCard({ opportunity, rank }: { opportunity: Opportunity; rank: number }) {
  const { lead, score, band, action } = opportunity;
  const channel = CHANNEL_LABEL[lead.channel] ?? lead.channel;
  const advisorName = lead.assignedTo
    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
    : "Sin asignar";

  return (
    <li className="list-none">
      <Card interactive>
        <CardContent className="flex flex-col gap-5 px-6 py-6 sm:flex-row sm:items-center">
          <div className="flex shrink-0 items-center gap-3">
            <span className="w-6 text-sm font-medium tabular-nums text-muted-2">{rank}</span>
            <Avatar initials={initials(lead.firstName, lead.lastName)} size="md" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-base font-semibold text-foreground">
                {lead.firstName} {lead.lastName}
              </p>
              {band ? <Badge variant={bandVariant(band)}>{BAND_LABEL[band]}</Badge> : null}
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
              <Badge variant={stageVariant(lead.currentStage.key)}>{lead.currentStage.name}</Badge>
              <span>{channel}</span>
              <span className="text-muted-2">·</span>
              <span>{timeAgo(lead.lastActivityAt)}</span>
              <span className="text-muted-2">·</span>
              <span>{advisorName}</span>
            </div>

            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
              {action}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="text-xl font-semibold tabular-nums text-foreground">{score}</div>
              <div className="text-[11px] text-muted-2">score</div>
            </div>
            <Link href={`/leads/${lead.id}`}>
              <Button variant="secondary" size="sm">
                Abrir
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function OpportunitiesSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-2xl" />
      ))}
    </div>
  );
}
