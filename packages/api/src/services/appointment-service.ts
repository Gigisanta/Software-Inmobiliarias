/**
 * Servicio de Agenda — visitas, llamadas y reuniones. Alcance por rol: el asesor
 * ve/gestiona las suyas; gerente y dueño, las de toda la inmobiliaria.
 */
import { TRPCError } from "@trpc/server";
import { emitEvent, writeAudit, type Prisma } from "@reos/db";
import { AppointmentStatus, AppointmentType, AuditAction, DomainEvent } from "@reos/core";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";

const apptInclude = {
  lead: { select: { id: true, firstName: true, lastName: true, phone: true } },
} satisfies Prisma.AppointmentInclude;

function scopeWhere(ctx: ServiceCtx): Prisma.AppointmentWhereInput {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  return {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };
}

export interface ListAppointmentsFilters {
  /** Si es true, incluye también las pasadas; por defecto solo desde hoy. */
  includePast?: boolean;
  leadId?: string;
}

export async function listAppointments(ctx: ServiceCtx, filters: ListAppointmentsFilters = {}) {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const where: Prisma.AppointmentWhereInput = {
    ...scopeWhere(ctx),
    ...(filters.leadId ? { leadId: filters.leadId } : {}),
    ...(filters.includePast ? {} : { scheduledAt: { gte: startOfToday } }),
  };

  return ctx.prisma.appointment.findMany({
    where,
    orderBy: { scheduledAt: "asc" },
    take: 200,
    include: apptInclude,
  });
}

/** Valida que el lead pertenezca al tenant y esté dentro del alcance del rol. */
async function assertLeadInScope(ctx: ServiceCtx, leadId: string) {
  const lead = await ctx.prisma.lead.findUnique({
    where: { id: leadId },
    select: { tenantId: true, assignedToId: true },
  });
  if (!lead || lead.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "El lead no pertenece a la inmobiliaria." });
  }
  if (!canSeeAllLeads(ctx.principal.role) && lead.assignedToId !== ctx.principal.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este lead." });
  }
}

/** Resuelve el responsable de un evento, validando que pertenezca al tenant. */
async function resolveAssignee(ctx: ServiceCtx, assignedToId: string | null | undefined): Promise<string> {
  if (!assignedToId) return ctx.principal.userId;
  const user = await ctx.prisma.user.findUnique({
    where: { id: assignedToId },
    select: { tenantId: true },
  });
  if (!user || user.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "El responsable no pertenece a la inmobiliaria." });
  }
  return assignedToId;
}

export interface CreateAppointmentInput {
  type?: AppointmentType;
  scheduledAt: Date;
  durationMinutes?: number;
  leadId?: string | null;
  notes?: string | null;
  assignedToId?: string | null;
}

export async function createAppointment(ctx: ServiceCtx, input: CreateAppointmentInput) {
  if (input.leadId) await assertLeadInScope(ctx, input.leadId);
  const assignedToId = await resolveAssignee(ctx, input.assignedToId);

  return ctx.prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.create({
      data: {
        tenantId: ctx.principal.tenantId,
        type: input.type ?? AppointmentType.VISITA,
        status: AppointmentStatus.AGENDADA,
        scheduledAt: input.scheduledAt,
        durationMinutes: input.durationMinutes ?? 30,
        leadId: input.leadId ?? null,
        notes: input.notes ?? null,
        assignedToId,
      },
      include: apptInclude,
    });

    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.APPOINTMENT_SCHEDULED,
      aggregateType: "Appointment",
      aggregateId: appt.id,
      actorUserId: ctx.principal.userId,
      payload: { type: appt.type, leadId: appt.leadId, scheduledAt: appt.scheduledAt },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.CREATE,
      entityType: "Appointment",
      entityId: appt.id,
      summary: `Evento agendado: ${appt.type}`,
    });
    return appt;
  });
}

async function loadAppointment(ctx: ServiceCtx, id: string) {
  const appt = await ctx.prisma.appointment.findUnique({ where: { id } });
  if (!appt || appt.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Evento no encontrado." });
  }
  if (!canSeeAllLeads(ctx.principal.role) && appt.assignedToId !== ctx.principal.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este evento." });
  }
  return appt;
}

export interface UpdateAppointmentInput {
  type?: AppointmentType;
  scheduledAt?: Date;
  durationMinutes?: number;
  notes?: string | null;
  leadId?: string | null;
}

export async function updateAppointment(ctx: ServiceCtx, id: string, patch: UpdateAppointmentInput) {
  await loadAppointment(ctx, id);
  if (patch.leadId) await assertLeadInScope(ctx, patch.leadId);

  const data: Prisma.AppointmentUpdateInput = {
    ...(patch.type !== undefined ? { type: patch.type } : {}),
    ...(patch.scheduledAt !== undefined ? { scheduledAt: patch.scheduledAt } : {}),
    ...(patch.durationMinutes !== undefined ? { durationMinutes: patch.durationMinutes } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    ...(patch.leadId !== undefined
      ? { lead: patch.leadId ? { connect: { id: patch.leadId } } : { disconnect: true } }
      : {}),
  };

  return ctx.prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({ where: { id }, data, include: apptInclude });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Appointment",
      entityId: appt.id,
      summary: `Evento actualizado: ${appt.type}`,
    });
    return appt;
  });
}

export async function setAppointmentStatus(ctx: ServiceCtx, id: string, status: AppointmentStatus) {
  await loadAppointment(ctx, id);

  return ctx.prisma.$transaction(async (tx) => {
    const appt = await tx.appointment.update({ where: { id }, data: { status }, include: apptInclude });
    if (status === AppointmentStatus.REALIZADA) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.APPOINTMENT_COMPLETED,
        aggregateType: "Appointment",
        aggregateId: appt.id,
        actorUserId: ctx.principal.userId,
        payload: {},
      });
    }
    if (status === AppointmentStatus.CANCELADA) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.APPOINTMENT_CANCELLED,
        aggregateType: "Appointment",
        aggregateId: appt.id,
        actorUserId: ctx.principal.userId,
        payload: {},
      });
    }
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Appointment",
      entityId: appt.id,
      summary: `Evento → ${status}`,
    });
    return appt;
  });
}

export async function removeAppointment(ctx: ServiceCtx, id: string) {
  await loadAppointment(ctx, id);
  await ctx.prisma.$transaction(async (tx) => {
    await tx.appointment.delete({ where: { id } });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.DELETE,
      entityType: "Appointment",
      entityId: id,
      summary: "Evento eliminado",
    });
  });
  return { id };
}
