"use client";

import { ListChecks, Phone, FileText, MapPin } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";

export default function TareasPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Tareas"
        subtitle="Seguimientos, documentación y coordinación, en orden"
      />

      <div className="relative">
        {/* Vista previa difuminada de lo que viene */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col gap-4 blur-[2px] select-none"
        >
          <GhostTask
            icon={<Phone className="h-4 w-4" strokeWidth={1.75} />}
            title="Llamar a Lucía Martínez"
            due="Vence hoy"
            tag="Llamada"
            variant="amber"
          />
          <GhostTask
            icon={<FileText className="h-4 w-4" strokeWidth={1.75} />}
            title="Enviar documentación de reserva a Juan Pérez"
            due="Mañana"
            tag="Documentación"
            variant="sage"
          />
          <GhostTask
            icon={<MapPin className="h-4 w-4" strokeWidth={1.75} />}
            title="Coordinar visita — Casa en Tigre"
            due="Vie 4 jul"
            tag="Visita"
            variant="sand"
          />
        </div>

        <div className="relative">
          <EmptyState
            icon={<ListChecks className="h-6 w-6" strokeWidth={1.5} />}
            title="Gestión de tareas en camino"
            description="Vas a organizar todo lo que hace avanzar una operación: llamar, enviar documentación, coordinar visitas y programar seguimientos, con recordatorios y prioridades claras."
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
  variant: BadgeVariant;
}) {
  return (
    <Card className="opacity-50">
      <CardContent className="flex items-center gap-4 px-6 py-5">
        <div className="grid h-5 w-5 shrink-0 place-items-center rounded-md border border-border-strong bg-surface" />
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-surface-2 text-muted">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{title}</p>
          <p className="mt-0.5 text-xs text-muted-2">{due}</p>
        </div>
        <Badge variant={variant}>{tag}</Badge>
      </CardContent>
    </Card>
  );
}
