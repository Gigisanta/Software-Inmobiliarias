/**
 * RBAC — Control de acceso basado en roles.
 *
 * La matriz define permisos GRUESOS (qué acción puede intentar cada rol).
 * El alcance FINO (p. ej. "el asesor solo ve SUS leads") se aplica en los servicios
 * mediante filtros por `assignedToId`, no en esta matriz.
 */
import { UserRole } from "@reos/core";

export const Permission = {
  // Leads
  LEAD_READ: "lead:read",
  LEAD_READ_ALL: "lead:read_all", // ver leads de todo el tenant, no solo los propios
  LEAD_CREATE: "lead:create",
  LEAD_UPDATE: "lead:update",
  LEAD_DELETE: "lead:delete",
  LEAD_ASSIGN: "lead:assign",
  LEAD_REASSIGN: "lead:reassign",
  LEAD_CHANGE_STAGE: "lead:change_stage",

  // Pipeline
  PIPELINE_READ: "pipeline:read",
  PIPELINE_MANAGE: "pipeline:manage",

  // Tareas
  TASK_READ: "task:read",
  TASK_WRITE: "task:write",

  // Agenda
  APPOINTMENT_READ: "appointment:read",
  APPOINTMENT_WRITE: "appointment:write",

  // Propiedades
  PROPERTY_READ: "property:read",
  PROPERTY_WRITE: "property:write",
  PROPERTY_PUBLISH: "property:publish",

  // Conversaciones
  CONVERSATION_READ: "conversation:read",
  CONVERSATION_REPLY: "conversation:reply",

  // Operación / gestión
  OPS_VIEW: "ops:view", // Centro de Operaciones
  REPORT_VIEW: "report:view",
  USER_READ: "user:read",
  USER_MANAGE: "user:manage",
  BRANCH_MANAGE: "branch:manage",
  AUTOMATION_MANAGE: "automation:manage",
  AUDIT_VIEW: "audit:view",
  TENANT_MANAGE: "tenant:manage", // config general, permisos, facturación
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

const ALL: Permission[] = Object.values(Permission);

const MANAGER: Permission[] = [
  Permission.LEAD_READ,
  Permission.LEAD_READ_ALL,
  Permission.LEAD_CREATE,
  Permission.LEAD_UPDATE,
  Permission.LEAD_DELETE,
  Permission.LEAD_ASSIGN,
  Permission.LEAD_REASSIGN,
  Permission.LEAD_CHANGE_STAGE,
  Permission.PIPELINE_READ,
  Permission.PIPELINE_MANAGE,
  Permission.TASK_READ,
  Permission.TASK_WRITE,
  Permission.APPOINTMENT_READ,
  Permission.APPOINTMENT_WRITE,
  Permission.PROPERTY_READ,
  Permission.PROPERTY_WRITE,
  Permission.PROPERTY_PUBLISH,
  Permission.CONVERSATION_READ,
  Permission.CONVERSATION_REPLY,
  Permission.OPS_VIEW,
  Permission.REPORT_VIEW,
  Permission.USER_READ,
  Permission.AUDIT_VIEW,
];

const ADVISOR: Permission[] = [
  Permission.LEAD_READ,
  Permission.LEAD_CREATE,
  Permission.LEAD_UPDATE,
  Permission.LEAD_CHANGE_STAGE,
  Permission.PIPELINE_READ,
  Permission.TASK_READ,
  Permission.TASK_WRITE,
  Permission.APPOINTMENT_READ,
  Permission.APPOINTMENT_WRITE,
  Permission.PROPERTY_READ,
  Permission.CONVERSATION_READ,
  Permission.CONVERSATION_REPLY,
];

/** Matriz rol → permisos. OWNER y ADMIN tienen todo. */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.OWNER]: ALL,
  [UserRole.ADMIN]: ALL,
  [UserRole.MANAGER]: MANAGER,
  [UserRole.ADVISOR]: ADVISOR,
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** ¿El rol puede ver leads de todo el tenant o solo los propios? */
export function canSeeAllLeads(role: UserRole): boolean {
  return hasPermission(role, Permission.LEAD_READ_ALL);
}
