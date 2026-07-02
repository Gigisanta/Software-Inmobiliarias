"use client";

import { MessageCircle, Sparkles, ArrowRightLeft } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/empty-state";

export default function ConversacionesPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col px-4 py-6">
      <PageHeader
        title="Conversaciones"
        subtitle="Todos los chats de WhatsApp de tu inmobiliaria, en una sola bandeja"
        icon={<MessageCircle className="h-5 w-5" />}
      />

      <div className="relative">
        {/* Tarjetas fantasma difuminadas de fondo */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex flex-col gap-3 blur-[2px] select-none"
        >
          <GhostChat
            initials="LM"
            name="Lucía Martínez"
            preview="Hola! Sigue disponible el depto de Belgrano?"
            time="hace 4 min"
            unread
          />
          <GhostChat
            initials="JP"
            name="Juan Pérez"
            preview="Perfecto, coordinamos la visita para el sábado 👍"
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
            icon={<MessageCircle className="h-8 w-8" />}
            title="Bandeja de WhatsApp en camino"
            description="Vamos a centralizar los chats de WhatsApp Business de cada asesor en una única bandeja, con respuestas sugeridas por IA y derivación inteligente al agente correcto según el lead."
            action={
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Badge variant="primary">
                  <Sparkles className="h-3 w-3" />
                  Respuestas con IA
                </Badge>
                <Badge variant="neutral">
                  <ArrowRightLeft className="h-3 w-3" />
                  Derivación entre asesores
                </Badge>
              </div>
            }
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
    <Card className="opacity-40">
      <CardContent className="flex items-center gap-3 p-4">
        <Avatar initials={initials} size="md" ring={false} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <span className="shrink-0 text-[11px] text-muted-2">{time}</span>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted">{preview}</p>
        </div>
        {unread ? (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-success px-1 text-[11px] font-bold text-white">
            2
          </span>
        ) : null}
      </CardContent>
    </Card>
  );
}
