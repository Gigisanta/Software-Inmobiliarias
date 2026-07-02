"use client";

import { CheckSquare, Phone, FileText, MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export default function TareasPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6">
      <PageHeader
        title="Tareas"
        subtitle="Nada se te escapa: seguimientos, documentación y coordinación en orden"
        icon={<CheckSquare className="h-5 w-5" />}
      />

      <div className="relative">
        {/* Tarjetas fantasma difuminadas de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col gap-3 blur-[2px] select-none"
        >
          <GhostTask
            icon={<Phone className="h-3.5 w-3.5" />}
            title="Llamar a Lucía Martínez"
            due="Vence hoy"
            tag="Llamada"
            variant="hot"
          />
          <GhostTask
            icon={<FileText className="h-3.5 w-3.5" />}
            title="Enviar documentación de reserva a Juan Pérez"
            due="Mañana"
            tag="Documentación"
            variant="primary"
          />
          <GhostTask
            icon={<MapPin className="h-3.5 w-3.5" />}
            title="Coordinar visita — Casa en Tigre"
            due="Vie 4 jul"
            tag="Visita"
            variant="neutral"
          />
        </div>

        <div className="relative">
          <EmptyState
            icon={<CheckSquare className="h-8 w-8" />}
            title="Gestión de tareas en camino"
            description="Vas a organizar todo lo que hace avanzar un lead: llamar, enviar documentación, coordinar visitas y programar seguimientos, con recordatorios y prioridades claras para que nada quede sin hacer."
          />
        </div>
      </div>
    </div>
  );
}

function GhostTask({
  icon,
  title,
  due,
  tag,
  variant,
}: {
  icon: React.ReactNode;
  title: string;
  due: string;
  tag: string;
  variant: "hot" | "primary" | "neutral";
}) {
  return (
    <Card className="opacity-40">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="grid h-6 w-6 shrink-0 place-items-center rounded-md border border-border-strong bg-surface-2" />
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-surface-2 text-muted">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-2">{due}</p>
        </div>
        <Badge variant={variant}>{tag}</Badge>
      </CardContent>
    </Card>
  );
}
