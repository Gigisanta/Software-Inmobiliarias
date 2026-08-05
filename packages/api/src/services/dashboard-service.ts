/**
 * Servicio del Centro de Operaciones: KPIs, embudo y agenda del día, con alcance por rol.
 */
import { Prisma } from "@reos/db";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";
import { getBoard } from "./pipeline-service";

const DAY_MS = 1000 * 60 * 60 * 24;

/** Etapas que representan una operación en curso (negocio avanzado). */
const OPERATION_STAGE_KEYS = ["NEGOCIACION", "RESERVA", "ESCRIBANIA"] as const;

/** Días sin actividad a partir de los cuales un lead abierto pide seguimiento. */
const FOLLOW_UP_STALE_DAYS = 3;

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getSummary(ctx: ServiceCtx) {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  const scope: Prisma.LeadWhereInput = {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };

  const [total, open, won, lost, unassigned, newToday, hot, funnel, team] = await Promise.all([
    ctx.prisma.lead.count({ where: scope }),
    ctx.prisma.lead.count({ where: { ...scope, status: "OPEN" } }),
    ctx.prisma.lead.count({ where: { ...scope, status: "WON" } }),
    ctx.prisma.lead.count({ where: { ...scope, status: "LOST" } }),
    seeAll
      ? ctx.prisma.lead.count({ where: { ...scope, assignedToId: null, status: "OPEN" } })
      : Promise.resolve(0),
    ctx.prisma.lead.count({ where: { ...scope, createdAt: { gte: startOfToday() } } }),
    ctx.prisma.lead.count({ where: { ...scope, status: "OPEN", scoreBand: "CALIENTE" } }),
    getBoard(ctx),
    ctx.prisma.user.count({ where: { tenantId: ctx.principal.tenantId, isActive: true } }),
  ]);

  return {
    kpis: { total, open, won, lost, unassigned, newToday, hot },
    funnel,
    team,
    scope: seeAll ? ("all" as const) : ("own" as const),
  };
}

/**
 * "Hoy" del asesor / la inmobiliaria: qué visitas vienen, qué leads quedaron
 * sin seguimiento y qué operaciones están en curso. Es la vista de trabajo
 * del dashboard (tarjetas con contexto, no solo números).
 */
export async function getToday(ctx: ServiceCtx) {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  const leadScope: Prisma.LeadWhereInput = {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };
  const now = new Date();
  const staleBefore = new Date(now.getTime() - FOLLOW_UP_STALE_DAYS * DAY_MS);

  const [appointments, followUps, operations, advisors] = await Promise.all([
    // Próximas visitas / llamadas / reuniones (7 días hacia adelante).
    ctx.prisma.appointment.findMany({
      where: {
        tenantId: ctx.principal.tenantId,
        status: { in: ["AGENDADA", "CONFIRMADA"] },
        scheduledAt: { gte: startOfToday(), lte: new Date(now.getTime() + 7 * DAY_MS) },
        ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
      },
      orderBy: { scheduledAt: "asc" },
      take: 6,
      include: {
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // Seguimientos pendientes: abiertos, sin actividad hace N días, el más olvidado primero.
    ctx.prisma.lead.findMany({
      where: { ...leadScope, status: "OPEN", lastActivityAt: { lt: staleBefore } },
      orderBy: { lastActivityAt: "asc" },
      take: 6,
      include: {
        currentStage: { select: { key: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
      },
    }),

    // Operaciones activas: leads en negociación / reserva / escribanía.
    ctx.prisma.lead.findMany({
      where: {
        ...leadScope,
        status: "OPEN",
        currentStage: { key: { in: [...OPERATION_STAGE_KEYS] } },
      },
      orderBy: { stageEnteredAt: "asc" },
      take: 6,
      include: {
        currentStage: { select: { key: true, name: true } },
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        propertyInterests: {
          take: 1,
          orderBy: { createdAt: "desc" },
          include: { property: { select: { id: true, title: true, neighborhood: true } } },
        },
      },
    }),

    // Rendimiento del equipo (solo con visión global): ganados y abiertos por asesor.
    seeAll
      ? ctx.prisma.user.findMany({
          where: { tenantId: ctx.principal.tenantId, isActive: true },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            _count: { select: { assignedLeads: { where: { status: "WON" } } } },
          },
        })
      : Promise.resolve([]),
  ]);

  // Título de la propiedad asociada a cada cita (propertyId es referencia suelta).
  const propertyIds = [...new Set(appointments.map((a) => a.propertyId).filter((id): id is string => id != null))];
  const properties = propertyIds.length
    ? await ctx.prisma.property.findMany({
        where: { id: { in: propertyIds } },
        select: { id: true, title: true, neighborhood: true },
      })
    : [];
  const propertyById = new Map(properties.map((p) => [p.id, p]));

  return {
    appointments: appointments.map((a) => ({
      id: a.id,
      type: a.type,
      status: a.status,
      scheduledAt: a.scheduledAt,
      durationMinutes: a.durationMinutes,
      notes: a.notes,
      lead: a.lead,
      property: a.propertyId ? (propertyById.get(a.propertyId) ?? null) : null,
    })),
    followUps,
    operations,
    advisors: advisors
      .map((u) => ({
        id: u.id,
        firstName: u.firstName,
        lastName: u.lastName,
        won: u._count.assignedLeads,
      }))
      .sort((a, b) => b.won - a.won),
  };
}
