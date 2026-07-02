"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Flame, ArrowRight, Phone } from "lucide-react";

import { useTRPC } from "@/trpc/client";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, bandVariant } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { cn, timeAgo, initials } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Tipos derivados por inferencia del contrato lead.opportunities (sin `any`).
// ---------------------------------------------------------------------------

type ScoreBand = "CALIENTE" | "TIBIO" | "FRIO";

type OpportunityLead = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  channel: string;
  operationType: string;
  budgetMax: string | null;
  currency: string;
  score: number;
  scoreBand: ScoreBand | null;
  currentStage: { key: string; name: string };
  assignedTo: { id: string; firstName: string; lastName: string } | null;
  lastActivityAt: string | Date;
};

type Opportunity = {
  lead: OpportunityLead;
  score: number;
  band: ScoreBand | null;
  action: string;
};

const BAND_LABEL: Record<ScoreBand, string> = {
  CALIENTE: "Caliente",
  TIBIO: "Tibio",
  FRIO: "Frío",
};

const CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  WEB: "Web",
  PORTAL: "Portal",
  REFERIDO: "Referido",
  LLAMADA: "Llamada",
  EMAIL: "Email",
};

// ---------------------------------------------------------------------------
// Página
// ---------------------------------------------------------------------------

export default function OportunidadesPage() {
  const trpc = useTRPC();
  const opps = useQuery(trpc.lead.opportunities.queryOptions({ limit: 25 }));

  const opportunities = (opps.data ?? []) as Opportunity[];

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6">
      <PageHeader
        title="🔥 Oportunidades del día"
        subtitle="Los leads con mayor probabilidad de cierre, priorizados por el Lead Score"
        icon={<Flame className="h-5 w-5" />}
      />

      {opps.isLoading ? (
        <OpportunitiesSkeleton />
      ) : opps.isError ? (
        <EmptyState
          icon={<Flame className="h-8 w-8" />}
          title="No pudimos cargar las oportunidades"
          description="Ocurrió un error al priorizar tus leads. Volvé a intentar en unos segundos."
        />
      ) : opportunities.length === 0 ? (
        <EmptyState
          icon={<Flame className="h-8 w-8" />}
          title="Todavía no hay oportunidades priorizadas"
          description="Cuando entren leads y sumen actividad, vas a ver acá los de mayor probabilidad de cierre, listos para accionar."
        />
      ) : (
        <ol className="flex flex-col gap-3">
          {opportunities.map((opp, index) => (
            <OpportunityCard key={opp.lead.id} opportunity={opp} rank={index + 1} />
          ))}
        </ol>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tarjeta accionable de oportunidad
// ---------------------------------------------------------------------------

function OpportunityCard({
  opportunity,
  rank,
}: {
  opportunity: Opportunity;
  rank: number;
}) {
  const { lead, score, band, action } = opportunity;
  const variant = band ? bandVariant(band) : "neutral";
  const isHot = band === "CALIENTE";

  const channel = CHANNEL_LABEL[lead.channel] ?? lead.channel;
  const advisorName = lead.assignedTo
    ? `${lead.assignedTo.firstName} ${lead.assignedTo.lastName}`
    : "Sin asignar";

  return (
    <li>
      <Card
        className={cn(
          "transition hover:border-border-strong hover:shadow-xl",
          isHot && "border-hot/40 ring-1 ring-hot/25",
        )}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          {/* Score coloreado por banda */}
          <div className="flex items-center gap-3 sm:flex-col sm:gap-2">
            <ScoreCircle score={score} variant={variant} />
            {band ? (
              <Badge variant={variant}>{BAND_LABEL[band]}</Badge>
            ) : (
              <Badge variant="neutral">Sin banda</Badge>
            )}
          </div>

          {/* Datos del lead */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-muted-2">
                #{rank}
              </span>
              <p className="truncate text-base font-semibold text-foreground">
                {lead.firstName} {lead.lastName}
              </p>
            </div>

            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted">
              <span className="rounded-md bg-surface-2 px-2 py-0.5 font-medium">
                {lead.currentStage.name}
              </span>
              <span className="text-muted-2">·</span>
              <span>{channel}</span>
              <span className="text-muted-2">·</span>
              <span>{timeAgo(lead.lastActivityAt)}</span>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Avatar
                initials={initials(
                  lead.assignedTo?.firstName,
                  lead.assignedTo?.lastName,
                )}
                size="sm"
                ring={false}
              />
              <span className="truncate text-xs text-muted">{advisorName}</span>
            </div>
          </div>

          {/* Acción sugerida + abrir */}
          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold",
                isHot
                  ? "border-hot/30 bg-hot/10 text-hot"
                  : "border-border bg-surface-2 text-foreground",
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              {action}
            </div>

            <Link href={`/leads/${lead.id}`} className="sm:w-auto">
              <Button
                variant={isHot ? "primary" : "secondary"}
                size="sm"
                className="w-full"
              >
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

// ---------------------------------------------------------------------------
// Score grande en círculo, coloreado por banda
// ---------------------------------------------------------------------------

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
        "flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 bg-surface-2 text-xl font-bold tabular-nums",
        colorByVariant[variant] ?? colorByVariant.neutral,
      )}
      aria-label={`Lead Score ${score}`}
    >
      {score}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Estado de carga
// ---------------------------------------------------------------------------

function OpportunitiesSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <Card key={index}>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex flex-col items-center gap-2">
              <Skeleton className="h-14 w-14 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="hidden flex-col items-end gap-2 sm:flex">
              <Skeleton className="h-8 w-28 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
