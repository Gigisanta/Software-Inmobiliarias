/**
 * Enums de dominio de RealEstate OS.
 *
 * Se declaran como objetos `as const` + tipo derivado en lugar de `enum` de TS,
 * para que los mismos literales sirvan en Prisma, Zod y el runtime sin fricción.
 */

export const UserRole = {
  OWNER: "OWNER",
  MANAGER: "MANAGER",
  ADVISOR: "ADVISOR",
  ADMIN: "ADMIN",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const TenantStatus = {
  TRIAL: "TRIAL",
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
  CANCELLED: "CANCELLED",
} as const;
export type TenantStatus = (typeof TenantStatus)[keyof typeof TenantStatus];

export const SubscriptionPlan = {
  STARTER: "STARTER",
  PRO: "PRO",
  BUSINESS: "BUSINESS",
  ENTERPRISE: "ENTERPRISE",
} as const;
export type SubscriptionPlan = (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

/** Clave canónica de cada etapa del pipeline (semántica estable aunque el nombre sea editable). */
export const PipelineStageKey = {
  NUEVO_LEAD: "NUEVO_LEAD",
  PRIMER_CONTACTO: "PRIMER_CONTACTO",
  INTERESADO: "INTERESADO",
  VISITA_AGENDADA: "VISITA_AGENDADA",
  VISITA_REALIZADA: "VISITA_REALIZADA",
  NEGOCIACION: "NEGOCIACION",
  RESERVA: "RESERVA",
  ESCRIBANIA: "ESCRIBANIA",
  CERRADO_GANADO: "CERRADO_GANADO",
  PERDIDO: "PERDIDO",
} as const;
export type PipelineStageKey = (typeof PipelineStageKey)[keyof typeof PipelineStageKey];

/** Estado macro del lead (independiente de la etapa concreta del pipeline). */
export const LeadStatus = {
  OPEN: "OPEN",
  WON: "WON",
  LOST: "LOST",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

export const OperationType = {
  COMPRA: "COMPRA",
  VENTA: "VENTA",
  ALQUILER: "ALQUILER",
  ALQUILER_TEMPORAL: "ALQUILER_TEMPORAL",
} as const;
export type OperationType = (typeof OperationType)[keyof typeof OperationType];

export const PropertyType = {
  DEPARTAMENTO: "DEPARTAMENTO",
  CASA: "CASA",
  PH: "PH",
  TERRENO: "TERRENO",
  LOCAL: "LOCAL",
  OFICINA: "OFICINA",
  GALPON: "GALPON",
  COCHERA: "COCHERA",
  CAMPO: "CAMPO",
  OTRO: "OTRO",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];

export const PropertyStatus = {
  BORRADOR: "BORRADOR",
  PUBLICADA: "PUBLICADA",
  RESERVADA: "RESERVADA",
  VENDIDA: "VENDIDA",
  ALQUILADA: "ALQUILADA",
  PAUSADA: "PAUSADA",
} as const;
export type PropertyStatus = (typeof PropertyStatus)[keyof typeof PropertyStatus];

export const FinancingType = {
  CONTADO: "CONTADO",
  CREDITO_HIPOTECARIO: "CREDITO_HIPOTECARIO",
  MIXTO: "MIXTO",
  A_DEFINIR: "A_DEFINIR",
} as const;
export type FinancingType = (typeof FinancingType)[keyof typeof FinancingType];

export const InterestLevel = {
  BAJO: "BAJO",
  MEDIO: "MEDIO",
  ALTO: "ALTO",
} as const;
export type InterestLevel = (typeof InterestLevel)[keyof typeof InterestLevel];

/** Banda de prioridad del lead (resultado del Lead Score o clasificación manual). */
export const ScoreBand = {
  FRIO: "FRIO",
  TIBIO: "TIBIO",
  CALIENTE: "CALIENTE",
} as const;
export type ScoreBand = (typeof ScoreBand)[keyof typeof ScoreBand];

export const LeadChannel = {
  WHATSAPP: "WHATSAPP",
  LANDING: "LANDING",
  PORTAL: "PORTAL",
  LLAMADA: "LLAMADA",
  REFERIDO: "REFERIDO",
  MANUAL: "MANUAL",
  OTRO: "OTRO",
} as const;
export type LeadChannel = (typeof LeadChannel)[keyof typeof LeadChannel];

export const LossReason = {
  SIN_RESPUESTA: "SIN_RESPUESTA",
  FUERA_DE_PRESUPUESTO: "FUERA_DE_PRESUPUESTO",
  COMPRO_EN_OTRA: "COMPRO_EN_OTRA",
  DESISTIO: "DESISTIO",
  NO_CALIFICA: "NO_CALIFICA",
  DUPLICADO: "DUPLICADO",
  OTRO: "OTRO",
} as const;
export type LossReason = (typeof LossReason)[keyof typeof LossReason];

export const TaskStatus = {
  PENDIENTE: "PENDIENTE",
  EN_PROGRESO: "EN_PROGRESO",
  COMPLETADA: "COMPLETADA",
  CANCELADA: "CANCELADA",
} as const;
export type TaskStatus = (typeof TaskStatus)[keyof typeof TaskStatus];

export const Priority = {
  BAJA: "BAJA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  URGENTE: "URGENTE",
} as const;
export type Priority = (typeof Priority)[keyof typeof Priority];

export const AppointmentType = {
  VISITA: "VISITA",
  LLAMADA: "LLAMADA",
  REUNION: "REUNION",
} as const;
export type AppointmentType = (typeof AppointmentType)[keyof typeof AppointmentType];

export const AppointmentStatus = {
  AGENDADA: "AGENDADA",
  CONFIRMADA: "CONFIRMADA",
  REALIZADA: "REALIZADA",
  CANCELADA: "CANCELADA",
  REPROGRAMADA: "REPROGRAMADA",
  NO_ASISTIO: "NO_ASISTIO",
} as const;
export type AppointmentStatus = (typeof AppointmentStatus)[keyof typeof AppointmentStatus];

export const AuditAction = {
  CREATE: "CREATE",
  UPDATE: "UPDATE",
  DELETE: "DELETE",
  STAGE_CHANGE: "STAGE_CHANGE",
  ASSIGN: "ASSIGN",
  REASSIGN: "REASSIGN",
  LOGIN: "LOGIN",
  PUBLISH: "PUBLISH",
} as const;
export type AuditAction = (typeof AuditAction)[keyof typeof AuditAction];

export const OutboxStatus = {
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  PROCESSED: "PROCESSED",
  FAILED: "FAILED",
} as const;
export type OutboxStatus = (typeof OutboxStatus)[keyof typeof OutboxStatus];

export const ConversationStatus = {
  ABIERTA: "ABIERTA",
  PENDIENTE: "PENDIENTE",
  RESUELTA: "RESUELTA",
} as const;
export type ConversationStatus = (typeof ConversationStatus)[keyof typeof ConversationStatus];

export const MessageDirection = {
  ENTRANTE: "ENTRANTE",
  SALIENTE: "SALIENTE",
} as const;
export type MessageDirection = (typeof MessageDirection)[keyof typeof MessageDirection];

/** Quién originó el mensaje: el contacto, la IA, o un asesor humano. */
export const MessageAuthor = {
  CONTACTO: "CONTACTO",
  IA: "IA",
  ASESOR: "ASESOR",
} as const;
export type MessageAuthor = (typeof MessageAuthor)[keyof typeof MessageAuthor];
