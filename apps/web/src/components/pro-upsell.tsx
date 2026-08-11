"use client";

import Link from "next/link";
import { Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/** Estado de venta para funciones bloqueadas en el plan Básico. */
export function ProUpsell({
  title,
  description,
  bullets,
}: {
  title: string;
  description: string;
  bullets: string[];
}) {
  return (
    <Card className="mx-auto max-w-xl overflow-hidden">
      <CardContent className="flex flex-col items-center px-8 py-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-(--badge-sand-bg) px-3 py-1 text-xs font-semibold text-(--badge-sand-fg)">
          <Sparkles className="h-3.5 w-3.5" />
          Plan Pro
        </span>
        <h2 className="mt-4 text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">{description}</p>

        <ul className="mt-6 flex w-full max-w-sm flex-col gap-2.5 text-left">
          {bullets.map((b) => (
            <li key={b} className="flex items-start gap-2.5 text-sm text-foreground">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Check className="h-3 w-3" strokeWidth={2.5} />
              </span>
              {b}
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center gap-2.5">
          <Link href="/planes">
            <Button>
              <Sparkles className="h-4 w-4" />
              Conocer el plan Pro
            </Button>
          </Link>
          <Link href="/configuracion">
            <Button variant="secondary">Activar vista previa</Button>
          </Link>
        </div>
        <p className="mt-3 text-xs text-muted-2">
          Podés activar una vista previa del Pro desde Configuración para probarlo.
        </p>
      </CardContent>
    </Card>
  );
}
