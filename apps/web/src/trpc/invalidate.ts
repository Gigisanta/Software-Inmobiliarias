"use client";

import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

/**
 * Dominios de datos invalidables (uno por router de tRPC con estado en la UI).
 * Invalidar por dominio evita el refetch masivo de `invalidateQueries()` sin
 * argumentos, que refrescaba TODAS las queries activas tras cada acción.
 */
export type Domain =
  | "lead"
  | "pipeline"
  | "dashboard"
  | "task"
  | "appointment"
  | "conversation"
  | "tenant"
  | "health";

/**
 * Hook que devuelve una función para invalidar solo los dominios afectados por
 * una acción. Ej.: mover una etapa → `invalidate(["pipeline", "lead", "dashboard"])`.
 */
export function useInvalidate() {
  const qc = useQueryClient();
  const trpc = useTRPC();

  return useCallback(
    (domains: Domain[]) => {
      const filterFor: Record<Domain, () => Parameters<typeof qc.invalidateQueries>[0]> = {
        lead: () => trpc.lead.pathFilter(),
        pipeline: () => trpc.pipeline.pathFilter(),
        dashboard: () => trpc.dashboard.pathFilter(),
        task: () => trpc.task.pathFilter(),
        appointment: () => trpc.appointment.pathFilter(),
        conversation: () => trpc.conversation.pathFilter(),
        tenant: () => trpc.tenant.pathFilter(),
        health: () => trpc.health.pathFilter(),
      };
      // Dedup por si llega el mismo dominio repetido.
      return Promise.all(
        [...new Set(domains)].map((d) => qc.invalidateQueries(filterFor[d]())),
      );
    },
    [qc, trpc],
  );
}
