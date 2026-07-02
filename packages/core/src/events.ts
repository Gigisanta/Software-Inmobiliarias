/**
 * Catálogo de eventos de dominio.
 *
 * Cada cambio de estado relevante persiste un evento en la tabla OutboxEvent dentro
 * de la misma transacción (patrón transactional outbox). Un worker los relaya luego a:
 *  - el motor de automatizaciones/seguimientos,
 *  - la capa de tiempo real (Centro de Operaciones vía WebSockets),
 *  - integraciones externas.
 *
 * Los nombres son la fuente de verdad. Convención: `dominio.acción` en snakeCase por segmento.
 */

export const DomainEvent = {
  // Leads
  LEAD_CREATED: "lead.created",
  LEAD_UPDATED: "lead.updated",
  LEAD_ASSIGNED: "lead.assigned",
  LEAD_REASSIGNED: "lead.reassigned",
  LEAD_STAGE_CHANGED: "lead.stage_changed",
  LEAD_SCORE_UPDATED: "lead.score_updated",
  LEAD_WON: "lead.won",
  LEAD_LOST: "lead.lost",

  // Tareas
  TASK_CREATED: "task.created",
  TASK_COMPLETED: "task.completed",
  TASK_OVERDUE: "task.overdue",

  // Agenda / visitas
  APPOINTMENT_SCHEDULED: "appointment.scheduled",
  APPOINTMENT_COMPLETED: "appointment.completed",
  APPOINTMENT_CANCELLED: "appointment.cancelled",

  // Conversaciones (se completarán en la rebanada de WhatsApp)
  MESSAGE_RECEIVED: "conversation.message_received",
  MESSAGE_SENT: "conversation.message_sent",
} as const;

export type DomainEvent = (typeof DomainEvent)[keyof typeof DomainEvent];

/** Estructura mínima de un evento emitido al outbox. */
export interface DomainEventEnvelope<TPayload = Record<string, unknown>> {
  tenantId: string;
  type: DomainEvent;
  /** Entidad principal afectada (para trazabilidad y ruteo). */
  aggregateType: string;
  aggregateId: string;
  payload: TPayload;
  /** Usuario que originó el evento, si aplica. */
  actorUserId?: string | null;
}
