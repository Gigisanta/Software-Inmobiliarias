/**
 * Motor de Lead Score explicable (v1).
 *
 * Diseño clave del producto: el score NO es una caja negra. Es una suma ponderada
 * de factores, y cada factor devuelve cuánto aportó y por qué. La UI ("¿por qué 82?")
 * se arma directamente con `factors`.
 *
 * Es una FUNCIÓN PURA: recibe una foto del lead y devuelve el resultado. Se recalcula
 * ante eventos (nuevo mensaje, cambio de etapa, visita, etc.) desde un worker/servicio.
 */

export interface LeadScoreInput {
  /** Días transcurridos desde el primer contacto. */
  daysSinceFirstContact: number;
  /** Días desde la última actividad del lead (mensaje/tarea/visita). */
  daysSinceLastActivity: number;
  /** Cantidad de mensajes intercambiados. */
  conversationCount: number;
  /** Cantidad de propiedades consultadas. */
  propertiesViewed: number;
  /** Visitas efectivamente realizadas. */
  visitsCompleted: number;
  /** ¿Tiene presupuesto definido (min y/o max)? */
  hasBudget: boolean;
  /** ¿Entregó documentación? */
  hasDocuments: boolean;
  /** Probabilidad de la etapa actual del pipeline (0-100). */
  stageProbability: number;
  /** Minutos promedio de respuesta del lead (menor = mejor). null si no hay datos. */
  avgResponseMinutes: number | null;
}

export interface ScoreFactor {
  key: string;
  /** Etiqueta legible para la UI. */
  label: string;
  /** Puntos aportados por este factor (ya ponderados). */
  points: number;
  /** Puntaje máximo posible del factor (para mostrar "12 / 20"). */
  max: number;
  /** Explicación en lenguaje natural de por qué aportó eso. */
  reason: string;
}

export interface LeadScoreResult {
  /** Score final 0-100. */
  score: number;
  /** Banda cualitativa. */
  band: "FRIO" | "TIBIO" | "CALIENTE";
  factors: ScoreFactor[];
}

/** Pesos por factor (suman 100). Configurables por tenant en el futuro. */
export const DEFAULT_SCORE_WEIGHTS = {
  stageProbability: 25,
  engagement: 15, // cantidad de conversaciones
  visits: 15,
  responseSpeed: 12,
  budget: 10,
  documents: 8,
  propertiesViewed: 8,
  recency: 7, // penaliza inactividad
} as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/**
 * Calcula el Lead Score de forma explicable.
 * Devuelve el score 0-100, la banda, y el desglose por factor.
 */
export function computeLeadScore(input: LeadScoreInput): LeadScoreResult {
  const w = DEFAULT_SCORE_WEIGHTS;
  const factors: ScoreFactor[] = [];

  // 1) Probabilidad de la etapa: aporta proporcional a stageProbability.
  {
    const points = Math.round((clamp(input.stageProbability, 0, 100) / 100) * w.stageProbability);
    factors.push({
      key: "stageProbability",
      label: "Etapa del pipeline",
      points,
      max: w.stageProbability,
      reason: `La etapa actual tiene ${input.stageProbability}% de probabilidad de cierre.`,
    });
  }

  // 2) Engagement por cantidad de conversaciones (satura en 6 intercambios).
  {
    const ratio = clamp(input.conversationCount / 6, 0, 1);
    const points = Math.round(ratio * w.engagement);
    factors.push({
      key: "engagement",
      label: "Interacción",
      points,
      max: w.engagement,
      reason: `${input.conversationCount} intercambio(s) de mensajes.`,
    });
  }

  // 3) Visitas realizadas (satura en 2).
  {
    const ratio = clamp(input.visitsCompleted / 2, 0, 1);
    const points = Math.round(ratio * w.visits);
    factors.push({
      key: "visits",
      label: "Visitas realizadas",
      points,
      max: w.visits,
      reason:
        input.visitsCompleted > 0
          ? `Realizó ${input.visitsCompleted} visita(s): fuerte señal de intención.`
          : "Todavía no realizó visitas.",
    });
  }

  // 4) Velocidad de respuesta del lead (<15 min = máximo; >120 min = 0).
  {
    let ratio = 0;
    let reason = "Sin datos de tiempo de respuesta.";
    if (input.avgResponseMinutes !== null) {
      ratio = clamp(1 - (input.avgResponseMinutes - 15) / (120 - 15), 0, 1);
      reason = `Responde en ~${Math.round(input.avgResponseMinutes)} min en promedio.`;
    }
    const points = Math.round(ratio * w.responseSpeed);
    factors.push({ key: "responseSpeed", label: "Velocidad de respuesta", points, max: w.responseSpeed, reason });
  }

  // 5) Presupuesto definido (binario).
  {
    const points = input.hasBudget ? w.budget : 0;
    factors.push({
      key: "budget",
      label: "Presupuesto definido",
      points,
      max: w.budget,
      reason: input.hasBudget ? "Tiene presupuesto definido." : "Aún no definió presupuesto.",
    });
  }

  // 6) Documentación entregada (binario).
  {
    const points = input.hasDocuments ? w.documents : 0;
    factors.push({
      key: "documents",
      label: "Documentación",
      points,
      max: w.documents,
      reason: input.hasDocuments ? "Entregó documentación." : "Falta documentación.",
    });
  }

  // 7) Propiedades consultadas (satura en 4).
  {
    const ratio = clamp(input.propertiesViewed / 4, 0, 1);
    const points = Math.round(ratio * w.propertiesViewed);
    factors.push({
      key: "propertiesViewed",
      label: "Propiedades consultadas",
      points,
      max: w.propertiesViewed,
      reason: `Consultó ${input.propertiesViewed} propiedad(es).`,
    });
  }

  // 8) Recencia: penaliza la inactividad. 0 días = máximo; >=14 días = 0.
  {
    const ratio = clamp(1 - input.daysSinceLastActivity / 14, 0, 1);
    const points = Math.round(ratio * w.recency);
    factors.push({
      key: "recency",
      label: "Actividad reciente",
      points,
      max: w.recency,
      reason:
        input.daysSinceLastActivity <= 1
          ? "Activo en las últimas 24 h."
          : `Sin actividad hace ${Math.round(input.daysSinceLastActivity)} día(s).`,
    });
  }

  const score = clamp(
    factors.reduce((acc, f) => acc + f.points, 0),
    0,
    100,
  );

  const band: LeadScoreResult["band"] = score >= 75 ? "CALIENTE" : score >= 45 ? "TIBIO" : "FRIO";

  return { score, band, factors };
}

/** Devuelve una acción sugerida para la sección "🔥 Oportunidades del día". */
export function suggestedAction(result: LeadScoreResult, input: LeadScoreInput): string {
  if (result.band === "CALIENTE") {
    if (input.visitsCompleted > 0 && input.stageProbability >= 55) return "Enviar propuesta hoy.";
    return "Llamar hoy.";
  }
  if (result.band === "TIBIO") {
    if (input.daysSinceLastActivity >= 3) return "Reactivar con un seguimiento.";
    return "Programar seguimiento.";
  }
  return "Nutrir con información relevante.";
}
