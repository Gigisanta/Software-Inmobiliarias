"use client";

import { MessageSquareText } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";

export default function ConversacionesPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Conversaciones"
        subtitle="Todos los chats de WhatsApp de tu inmobiliaria, en una sola bandeja"
      />

      <div className="relative">
        {/* Vista previa difuminada de lo que viene */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col gap-4 blur-[2px] select-none"
        >
          <GhostChat
            initials="LM"
            name="Lucía Martínez"
            preview="Hola! ¿Sigue disponible el depto de Belgrano?"
            time="hace 4 min"
            unread
          />
          <GhostChat
            initials="JP"
            name="Juan Pérez"
            preview="Perfecto, coordinamos la visita para el sábado."
            time="hace 1 h"
          />
          <GhostChat
            initials="FS"
            name="Familia Sosa"
            preview="Nos interesa la financiación, ¿cómo seguimos?"
            time="hace 3 h"
          />
        </div>

        <div className="relative">
          <EmptyState
            icon={<MessageSquareText className="h-6 w-6" strokeWidth={1.5} />}
            title="Bandeja de WhatsApp en camino"
            description="Vamos a centralizar los chats de WhatsApp Business de cada asesor en una única bandeja, con derivación al asesor correcto según el lead."
          />
        </div>
      </div>
    </div>
  );
}

function GhostChat({
  initials,
  name,
  preview,
  time,
  unread = false,
}: {
  initials: string;
  name: string;
  preview: string;
  time: string;
  unread?: boolean;
}) {
  return (
    <Card className="opacity-50">
      <CardContent className="flex items-center gap-4 px-6 py-5">
        <Avatar initials={initials} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <span className="shrink-0 text-[11px] text-muted-2">{time}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{preview}</p>
        </div>
        {unread ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[11px] font-semibold text-primary-foreground">
            2
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
