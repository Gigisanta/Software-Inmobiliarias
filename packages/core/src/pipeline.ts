/**
 * Definición canónica del pipeline comercial.
 *
 * El pipeline es configurable por tenant (tabla PipelineStage), pero cada etapa
 * conserva una `key` estable de este catálogo para preservar la semántica del negocio
 * (reportes, automatizaciones, score) aunque la inmobiliaria renombre o reordene etapas.
 */
import { PipelineStageKey } from "./enums";

export interface PipelineStageDef {
  key: PipelineStageKey;
  /** Nombre por defecto mostrado en la UI (editable por tenant). */
  name: string;
  /** Orden dentro del embudo. */
  order: number;
  /** Probabilidad de cierre sugerida por defecto (0-100). */
  defaultProbability: number;
  /** Etapa terminal ganada. */
  isWon: boolean;
  /** Etapa terminal perdida. */
  isLost: boolean;
}

/** Pipeline por defecto que se siembra al crear un tenant. */
export const DEFAULT_PIPELINE: readonly PipelineStageDef[] = [
  { key: PipelineStageKey.NUEVO_LEAD, name: "Nuevo Lead", order: 1, defaultProbability: 5, isWon: false, isLost: false },
  { key: PipelineStageKey.PRIMER_CONTACTO, name: "Primer contacto", order: 2, defaultProbability: 10, isWon: false, isLost: false },
  { key: PipelineStageKey.INTERESADO, name: "Interesado", order: 3, defaultProbability: 25, isWon: false, isLost: false },
  { key: PipelineStageKey.VISITA_AGENDADA, name: "Visita agendada", order: 4, defaultProbability: 40, isWon: false, isLost: false },
  { key: PipelineStageKey.VISITA_REALIZADA, name: "Visita realizada", order: 5, defaultProbability: 55, isWon: false, isLost: false },
  { key: PipelineStageKey.NEGOCIACION, name: "Negociación", order: 6, defaultProbability: 70, isWon: false, isLost: false },
  { key: PipelineStageKey.RESERVA, name: "Reserva", order: 7, defaultProbability: 85, isWon: false, isLost: false },
  { key: PipelineStageKey.ESCRIBANIA, name: "Escribanía", order: 8, defaultProbability: 95, isWon: false, isLost: false },
  { key: PipelineStageKey.CERRADO_GANADO, name: "Venta / Alquiler", order: 9, defaultProbability: 100, isWon: true, isLost: false },
  { key: PipelineStageKey.PERDIDO, name: "Perdido", order: 10, defaultProbability: 0, isWon: false, isLost: true },
];

/** Etapas activas (no terminales), en orden. */
export const ACTIVE_STAGE_KEYS: readonly PipelineStageKey[] = DEFAULT_PIPELINE.filter(
  (s) => !s.isWon && !s.isLost,
).map((s) => s.key);

export function getStageDef(key: PipelineStageKey): PipelineStageDef {
  const def = DEFAULT_PIPELINE.find((s) => s.key === key);
  if (!def) throw new Error(`Etapa de pipeline desconocida: ${key}`);
  return def;
}
