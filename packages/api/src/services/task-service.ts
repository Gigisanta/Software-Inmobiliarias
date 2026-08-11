/**
 * Servicio de Tareas — seguimientos, llamadas y documentación que hacen avanzar
 * una operación. Alcance por rol: el asesor ve/gestiona las suyas; gerente y dueño,
 * las de toda la inmobiliaria. Las mutaciones registran auditoría.
 */
import { TRPCError } from "@trpc/server";
import { emitEvent, writeAudit, type Prisma } from "@reos/db";
import { AuditAction, DomainEvent, Priority, TaskStatus } from "@reos/core";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";

export interface ListTasksFilters {
  status?: TaskStatus;
  includeCompleted?: boolean;
  leadId?: string;
}

const taskInclude = {
  lead: { select: { id: true, firstName: true, lastName: true } },
} satisfies Prisma.TaskInclude;

/** Filtro base con alcance por rol (el asesor solo ve las tareas a su nombre). */
function scopeWhere(ctx: ServiceCtx): Prisma.TaskWhereInput {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  return {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };
}

export async function listTasks(ctx: ServiceCtx, filters: ListTasksFilters = {}) {
  const where: Prisma.TaskWhereInput = {
    ...scopeWhere(ctx),
    ...(filters.leadId ? { leadId: filters.leadId } : {}),
    ...(filters.status
      ? { status: filters.status }
      : filters.includeCompleted
        ? {}
        : { status: { in: [TaskStatus.PENDIENTE, TaskStatus.EN_PROGRESO] } }),
  };

  return ctx.prisma.task.findMany({
    where,
    orderBy: [{ status: "asc" }, { dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    take: 200,
    include: taskInclude,
  });
}

export interface CreateTaskInput {
  title: string;
  description?: string | null;
  priority?: Priority;
  dueAt?: Date | null;
  leadId?: string | null;
  assignedToId?: string | null;
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

/** Resuelve el responsable de una tarea, validando que pertenezca al tenant. */
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

export async function createTask(ctx: ServiceCtx, input: CreateTaskInput) {
  if (input.leadId) await assertLeadInScope(ctx, input.leadId);
  const assignedToId = await resolveAssignee(ctx, input.assignedToId);

  return ctx.prisma.$transaction(async (tx) => {
    const task = await tx.task.create({
      data: {
        tenantId: ctx.principal.tenantId,
        title: input.title,
        description: input.description ?? null,
        priority: input.priority ?? Priority.MEDIA,
        dueAt: input.dueAt ?? null,
        leadId: input.leadId ?? null,
        assignedToId,
        createdById: ctx.principal.userId,
      },
      include: taskInclude,
    });

    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.TASK_CREATED,
      aggregateType: "Task",
      aggregateId: task.id,
      actorUserId: ctx.principal.userId,
      payload: { title: task.title, leadId: task.leadId },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.CREATE,
      entityType: "Task",
      entityId: task.id,
      summary: `Tarea creada: ${task.title}`,
    });
    return task;
  });
}

/** Carga una tarea validando tenant + alcance por rol. */
async function loadTask(ctx: ServiceCtx, id: string) {
  const task = await ctx.prisma.task.findUnique({ where: { id } });
  if (!task || task.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tarea no encontrada." });
  }
  if (!canSeeAllLeads(ctx.principal.role) && task.assignedToId !== ctx.principal.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a esta tarea." });
  }
  return task;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  priority?: Priority;
  dueAt?: Date | null;
  leadId?: string | null;
}

export async function updateTask(ctx: ServiceCtx, id: string, patch: UpdateTaskInput) {
  await loadTask(ctx, id);
  if (patch.leadId) await assertLeadInScope(ctx, patch.leadId);

  const data: Prisma.TaskUpdateInput = {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description } : {}),
    ...(patch.priority !== undefined ? { priority: patch.priority } : {}),
    ...(patch.dueAt !== undefined ? { dueAt: patch.dueAt } : {}),
    ...(patch.leadId !== undefined
      ? { lead: patch.leadId ? { connect: { id: patch.leadId } } : { disconnect: true } }
      : {}),
  };

  return ctx.prisma.$transaction(async (tx) => {
    const task = await tx.task.update({ where: { id }, data, include: taskInclude });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Task",
      entityId: task.id,
      summary: `Tarea actualizada: ${task.title}`,
    });
    return task;
  });
}

export async function setTaskStatus(ctx: ServiceCtx, id: string, status: TaskStatus) {
  await loadTask(ctx, id);
  const completed = status === TaskStatus.COMPLETADA;

  return ctx.prisma.$transaction(async (tx) => {
    const task = await tx.task.update({
      where: { id },
      data: { status, completedAt: completed ? new Date() : null },
      include: taskInclude,
    });
    if (completed) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.TASK_COMPLETED,
        aggregateType: "Task",
        aggregateId: task.id,
        actorUserId: ctx.principal.userId,
        payload: { title: task.title },
      });
    }
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Task",
      entityId: task.id,
      summary: `Tarea → ${status}`,
    });
    return task;
  });
}

export async function removeTask(ctx: ServiceCtx, id: string) {
  const task = await loadTask(ctx, id);
  await ctx.prisma.$transaction(async (tx) => {
    await tx.task.delete({ where: { id } });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.DELETE,
      entityType: "Task",
      entityId: id,
      summary: `Tarea eliminada: ${task.title}`,
    });
  });
  return { id };
}
