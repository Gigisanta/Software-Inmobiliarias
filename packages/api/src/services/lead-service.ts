/**
 * Servicio de Lead — entidad central del sistema.
 *
 * Concentra la lógica de negocio: creación, listado con alcance por rol,
 * cambio de etapa (con historial append-only + recálculo de score + eventos),
 * asignación y oportunidades del día. Todo lo que muta estado emite eventos
 * al outbox y registra auditoría dentro de la misma transacción.
 */
import { TRPCError } from "@trpc/server";
import { Prisma, emitEvent, writeAudit, type PrismaTx } from "@reos/db";
import {
  computeLeadScore,
  DomainEvent,
  LeadStatus,
  AuditAction,
  LeadChannel,
  PipelineStageKey,
  type LeadScoreInput,
} from "@reos/core";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";
import { getStageByKey } from "./pipeline-service";

const DAY_MS = 1000 * 60 * 60 * 24;

function daysSince(date: Date | null): number {
  if (!date) return 0;
  return Math.max(0, (Date.now() - date.getTime()) / DAY_MS);
}

/** Reúne los factores para el Lead Score a partir del estado actual del lead. */
async function gatherScoreInput(
  db: PrismaTx,
  lead: {
    firstContactAt: Date | null;
    lastActivityAt: Date;
    budgetMin: Prisma.Decimal | null;
    budgetMax: Prisma.Decimal | null;
    id: string;
  },
  stageProbability: number,
): Promise<LeadScoreInput> {
  const [propertiesViewed, visitsCompleted] = await Promise.all([
    db.leadPropertyInterest.count({ where: { leadId: lead.id } }),
    db.appointment.count({ where: { leadId: lead.id, type: "VISITA", status: "REALIZADA" } }),
  ]);

  return {
    daysSinceFirstContact: daysSince(lead.firstContactAt),
    daysSinceLastActivity: daysSince(lead.lastActivityAt),
    conversationCount: 0, // se refinará con el módulo de Conversaciones/WhatsApp
    propertiesViewed,
    visitsCompleted,
    hasBudget: lead.budgetMin != null || lead.budgetMax != null,
    hasDocuments: false, // se refinará con el módulo de Documentación
    stageProbability,
    avgResponseMinutes: null,
  };
}

/** Verifica que el lead pertenezca al tenant y esté dentro del alcance del rol. */
function assertLeadAccess(ctx: ServiceCtx, lead: { tenantId: string; assignedToId: string | null }) {
  if (lead.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
  }
  if (!canSeeAllLeads(ctx.principal.role) && lead.assignedToId !== ctx.principal.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a este lead." });
  }
}

// ---------------------------------------------------------------------------
//  Consultas
// ---------------------------------------------------------------------------

export interface ListLeadsFilters {
  status?: LeadStatus;
  stageKey?: PipelineStageKey;
  assignedToId?: string;
  channel?: LeadChannel;
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listLeads(ctx: ServiceCtx, filters: ListLeadsFilters) {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, filters.pageSize ?? 25));
  const seeAll = canSeeAllLeads(ctx.principal.role);

  const where: Prisma.LeadWhereInput = {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.channel ? { channel: filters.channel } : {}),
    ...(filters.assignedToId && seeAll ? { assignedToId: filters.assignedToId } : {}),
    ...(filters.stageKey ? { currentStage: { key: filters.stageKey } } : {}),
    ...(filters.search
      ? {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
            { phone: { contains: filters.search } },
            { email: { contains: filters.search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    ctx.prisma.lead.findMany({
      where,
      orderBy: [{ score: "desc" }, { lastActivityAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        currentStage: { select: { key: true, name: true, probability: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    ctx.prisma.lead.count({ where }),
  ]);

  return { items, total, page, pageSize, pageCount: Math.ceil(total / pageSize) };
}

export async function getLead(ctx: ServiceCtx, id: string) {
  const lead = await ctx.prisma.lead.findUnique({
    where: { id },
    include: {
      currentStage: true,
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      branch: { select: { id: true, name: true } },
      stageHistory: { orderBy: { enteredAt: "desc" }, take: 50 },
      propertyInterests: { include: { property: true } },
      tasks: { orderBy: { createdAt: "desc" }, take: 50 },
      appointments: { orderBy: { scheduledAt: "desc" }, take: 50 },
    },
  });
  if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
  assertLeadAccess(ctx, lead);
  return lead;
}

/** Oportunidades del día: leads abiertos con mayor score + acción sugerida. */
export async function getOpportunities(ctx: ServiceCtx, limit = 10) {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  const leads = await ctx.prisma.lead.findMany({
    where: {
      tenantId: ctx.principal.tenantId,
      status: "OPEN",
      ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
    },
    orderBy: [{ score: "desc" }, { lastActivityAt: "asc" }],
    take: Math.min(50, Math.max(1, limit)),
    include: {
      currentStage: { select: { key: true, name: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return leads.map((lead) => ({
    lead,
    score: lead.score,
    band: lead.scoreBand,
    action:
      lead.scoreBand === "CALIENTE"
        ? "Llamar hoy."
        : lead.scoreBand === "TIBIO"
          ? "Programar seguimiento."
          : "Nutrir con información relevante.",
  }));
}

// ---------------------------------------------------------------------------
//  Mutaciones
// ---------------------------------------------------------------------------

export interface CreateLeadInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  channel?: LeadChannel;
  source?: string;
  operationType?: import("@reos/core").OperationType;
  budgetMin?: number;
  budgetMax?: number;
  currency?: string;
  preferredNeighborhoods?: string[];
  propertyType?: import("@reos/core").PropertyType;
  rooms?: number;
  bedrooms?: number;
  hasPets?: boolean;
  financing?: import("@reos/core").FinancingType;
  notes?: string;
  assignedToId?: string;
}

export async function createLead(ctx: ServiceCtx, input: CreateLeadInput) {
  const stage = await getStageByKey(ctx, PipelineStageKey.NUEVO_LEAD);
  const channel = input.channel ?? LeadChannel.MANUAL;
  const now = new Date();
  const firstContactAt = channel === LeadChannel.MANUAL ? null : now;

  // Un asesor que crea un lead sin asignar → queda a su nombre.
  const assignedToId =
    input.assignedToId ?? (ctx.principal.role === "ADVISOR" ? ctx.principal.userId : null);

  const initialScore = computeLeadScore({
    daysSinceFirstContact: 0,
    daysSinceLastActivity: 0,
    conversationCount: 0,
    propertiesViewed: 0,
    visitsCompleted: 0,
    hasBudget: input.budgetMin != null || input.budgetMax != null,
    hasDocuments: false,
    stageProbability: stage.probability,
    avgResponseMinutes: null,
  });

  return ctx.prisma.$transaction(async (tx) => {
    const lead = await tx.lead.create({
      data: {
        tenantId: ctx.principal.tenantId,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        channel,
        source: input.source,
        operationType: input.operationType,
        budgetMin: input.budgetMin != null ? new Prisma.Decimal(input.budgetMin) : null,
        budgetMax: input.budgetMax != null ? new Prisma.Decimal(input.budgetMax) : null,
        currency: input.currency ?? "USD",
        preferredNeighborhoods: input.preferredNeighborhoods ?? [],
        propertyType: input.propertyType,
        rooms: input.rooms,
        bedrooms: input.bedrooms,
        hasPets: input.hasPets,
        financing: input.financing ?? "A_DEFINIR",
        notes: input.notes,
        currentStageId: stage.id,
        stageEnteredAt: now,
        firstContactAt,
        lastActivityAt: now,
        assignedToId,
        assignedAt: assignedToId ? now : null,
        branchId: ctx.principal.branchId,
        score: initialScore.score,
        scoreBand: initialScore.band,
        scoreFactors: initialScore.factors as unknown as Prisma.InputJsonValue,
        scoreUpdatedAt: now,
        stageHistory: {
          create: {
            tenantId: ctx.principal.tenantId,
            toStageId: stage.id,
            toStageKey: stage.key,
            probability: stage.probability,
            changedById: ctx.principal.userId,
            enteredAt: now,
          },
        },
      },
    });

    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.LEAD_CREATED,
      aggregateType: "Lead",
      aggregateId: lead.id,
      actorUserId: ctx.principal.userId,
      payload: { channel, assignedToId, score: initialScore.score },
    });
    if (assignedToId) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.LEAD_ASSIGNED,
        aggregateType: "Lead",
        aggregateId: lead.id,
        actorUserId: ctx.principal.userId,
        payload: { assignedToId },
      });
    }
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.CREATE,
      entityType: "Lead",
      entityId: lead.id,
      summary: `Lead creado: ${lead.firstName} ${lead.lastName ?? ""}`.trim(),
    });

    return lead;
  });
}

export interface UpdateLeadInput {
  firstName?: string;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  operationType?: import("@reos/core").OperationType;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredNeighborhoods?: string[];
  propertyType?: import("@reos/core").PropertyType;
  rooms?: number | null;
  bedrooms?: number | null;
  hasPets?: boolean | null;
  financing?: import("@reos/core").FinancingType;
  notes?: string | null;
  /** Clasificación manual (plan Básico): prioridad e interés fijados a mano. */
  scoreBand?: import("@reos/core").ScoreBand | null;
  interestLevel?: import("@reos/core").InterestLevel | null;
}

export async function updateLead(ctx: ServiceCtx, id: string, patch: UpdateLeadInput) {
  const existing = await ctx.prisma.lead.findUnique({ where: { id } });
  if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
  assertLeadAccess(ctx, existing);

  const data: Prisma.LeadUpdateInput = {
    ...(patch.firstName !== undefined ? { firstName: patch.firstName } : {}),
    ...(patch.lastName !== undefined ? { lastName: patch.lastName } : {}),
    ...(patch.email !== undefined ? { email: patch.email } : {}),
    ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
    ...(patch.operationType !== undefined ? { operationType: patch.operationType } : {}),
    ...(patch.budgetMin !== undefined
      ? { budgetMin: patch.budgetMin == null ? null : new Prisma.Decimal(patch.budgetMin) }
      : {}),
    ...(patch.budgetMax !== undefined
      ? { budgetMax: patch.budgetMax == null ? null : new Prisma.Decimal(patch.budgetMax) }
      : {}),
    ...(patch.preferredNeighborhoods !== undefined
      ? { preferredNeighborhoods: patch.preferredNeighborhoods }
      : {}),
    ...(patch.propertyType !== undefined ? { propertyType: patch.propertyType } : {}),
    ...(patch.rooms !== undefined ? { rooms: patch.rooms } : {}),
    ...(patch.bedrooms !== undefined ? { bedrooms: patch.bedrooms } : {}),
    ...(patch.hasPets !== undefined ? { hasPets: patch.hasPets } : {}),
    ...(patch.financing !== undefined ? { financing: patch.financing } : {}),
    ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
    ...(patch.scoreBand !== undefined ? { scoreBand: patch.scoreBand } : {}),
    ...(patch.interestLevel !== undefined ? { interestLevel: patch.interestLevel } : {}),
    lastActivityAt: new Date(),
  };

  return ctx.prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({ where: { id }, data });
    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.LEAD_UPDATED,
      aggregateType: "Lead",
      aggregateId: lead.id,
      actorUserId: ctx.principal.userId,
      payload: { fields: Object.keys(patch) },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Lead",
      entityId: lead.id,
      summary: `Lead actualizado (${Object.keys(patch).join(", ")})`,
    });
    return lead;
  });
}

export async function assignLead(ctx: ServiceCtx, id: string, assigneeId: string) {
  const existing = await ctx.prisma.lead.findUnique({ where: { id } });
  if (!existing || existing.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
  }
  const assignee = await ctx.prisma.user.findUnique({ where: { id: assigneeId } });
  if (!assignee || assignee.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "El asesor no pertenece a la inmobiliaria." });
  }

  const wasAssigned = existing.assignedToId != null && existing.assignedToId !== assigneeId;
  const now = new Date();

  return ctx.prisma.$transaction(async (tx) => {
    const lead = await tx.lead.update({
      where: { id },
      data: { assignedToId: assigneeId, assignedAt: now, lastActivityAt: now },
    });
    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: wasAssigned ? DomainEvent.LEAD_REASSIGNED : DomainEvent.LEAD_ASSIGNED,
      aggregateType: "Lead",
      aggregateId: lead.id,
      actorUserId: ctx.principal.userId,
      payload: { from: existing.assignedToId, to: assigneeId },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: wasAssigned ? AuditAction.REASSIGN : AuditAction.ASSIGN,
      entityType: "Lead",
      entityId: lead.id,
      summary: `Lead asignado a ${assignee.firstName ?? assignee.email}`,
    });
    return lead;
  });
}

export interface ChangeStageInput {
  leadId: string;
  toStageKey: PipelineStageKey;
  comment?: string;
  lossReason?: import("@reos/core").LossReason;
}

export async function changeStage(ctx: ServiceCtx, input: ChangeStageInput) {
  const lead = await ctx.prisma.lead.findUnique({
    where: { id: input.leadId },
    include: { currentStage: true },
  });
  if (!lead) throw new TRPCError({ code: "NOT_FOUND", message: "Lead no encontrado." });
  assertLeadAccess(ctx, lead);

  const toStage = await getStageByKey(ctx, input.toStageKey);
  if (toStage.id === lead.currentStageId) return lead;

  const now = new Date();
  const status = toStage.isWon ? LeadStatus.WON : toStage.isLost ? LeadStatus.LOST : LeadStatus.OPEN;

  return ctx.prisma.$transaction(async (tx) => {
    // Cierro la fila abierta del historial (la etapa que estaba transcurriendo).
    const open = await tx.leadStageHistory.findFirst({
      where: { leadId: lead.id, exitedAt: null },
      orderBy: { enteredAt: "desc" },
    });
    if (open) {
      await tx.leadStageHistory.update({
        where: { id: open.id },
        data: { exitedAt: now, durationSeconds: Math.round((now.getTime() - open.enteredAt.getTime()) / 1000) },
      });
    }

    // Abro la nueva etapa.
    await tx.leadStageHistory.create({
      data: {
        tenantId: ctx.principal.tenantId,
        leadId: lead.id,
        fromStageId: lead.currentStageId,
        fromStageKey: lead.currentStage.key,
        toStageId: toStage.id,
        toStageKey: toStage.key,
        probability: toStage.probability,
        comment: input.comment,
        changedById: ctx.principal.userId,
        enteredAt: now,
      },
    });

    // Recalculo el score con la probabilidad de la nueva etapa.
    const scoreInput = await gatherScoreInput(tx, lead, toStage.probability);
    const scored = computeLeadScore(scoreInput);

    const updated = await tx.lead.update({
      where: { id: lead.id },
      data: {
        currentStageId: toStage.id,
        stageEnteredAt: now,
        lastActivityAt: now,
        status,
        wonAt: toStage.isWon ? now : lead.wonAt,
        lostAt: toStage.isLost ? now : lead.lostAt,
        lossReason: toStage.isLost ? (input.lossReason ?? "OTRO") : lead.lossReason,
        score: scored.score,
        scoreBand: scored.band,
        scoreFactors: scored.factors as unknown as Prisma.InputJsonValue,
        scoreUpdatedAt: now,
      },
    });

    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.LEAD_STAGE_CHANGED,
      aggregateType: "Lead",
      aggregateId: lead.id,
      actorUserId: ctx.principal.userId,
      payload: { from: lead.currentStage.key, to: toStage.key },
    });
    if (toStage.isWon) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.LEAD_WON,
        aggregateType: "Lead",
        aggregateId: lead.id,
        actorUserId: ctx.principal.userId,
        payload: {},
      });
    }
    if (toStage.isLost) {
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.LEAD_LOST,
        aggregateType: "Lead",
        aggregateId: lead.id,
        actorUserId: ctx.principal.userId,
        payload: { reason: input.lossReason ?? "OTRO" },
      });
    }
    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: DomainEvent.LEAD_SCORE_UPDATED,
      aggregateType: "Lead",
      aggregateId: lead.id,
      actorUserId: ctx.principal.userId,
      payload: { score: scored.score, band: scored.band },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.STAGE_CHANGE,
      entityType: "Lead",
      entityId: lead.id,
      summary: `Etapa: ${lead.currentStage.key} → ${toStage.key}`,
    });

    return updated;
  });
}
