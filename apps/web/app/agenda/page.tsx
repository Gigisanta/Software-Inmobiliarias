"use client";

import { Calendar, Clock, MapPin, Video } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export default function AgendaPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6">
      <PageHeader
        title="Agenda"
        subtitle="Tu día, ordenado: visitas, llamadas y reuniones en un solo lugar"
        icon={<Calendar className="h-5 w-5" />}
      />

      <div className="relative">
        {/* Tarjetas fantasma difuminadas de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col gap-3 blur-[2px] select-none"
        >
          <GhostEvent
            icon={<MapPin className="h-3.5 w-3.5" />}
            title="Visita — Depto 3 amb. en Palermo"
            time="09:30"
            tag="Visita"
          />
          <GhostEvent
            icon={<Video className="h-3.5 w-3.5" />}
            title="Videollamada con Familia Gómez"
            time="12:00"
            tag="Reunión"
          />
          <GhostEvent
            icon={<Clock className="h-3.5 w-3.5" />}
            title="Seguimiento telefónico — Lead caliente"
            time="17:15"
            tag="Llamada"
          />
        </div>

        <div className="relative">
          <EmptyState
            icon={<Calendar className="h-8 w-8" />}
            title="Agenda inteligente en camino"
            description="Vas a poder coordinar visitas, llamadas y reuniones sin pisar horarios, con detección automática de conflictos y sincronización en dos vías con Google Calendar y Outlook."
          />
        </div>
      </div>
    </div>
  );
}

function GhostEvent({
  icon,
  title,
  time,
  tag,
}: {
  icon: React.ReactNode;
  title: string;
  time: string;
  tag: string;
}) {
  return (
    <Card className="opacity-40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-2">Hoy · {time}</p>
        </div>
        <Badge variant="primary">{tag}</Badge>
      </CardContent>
    </Card>
  );
}
