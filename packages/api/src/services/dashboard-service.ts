/**
 * Servicio del Centro de Operaciones: KPIs y embudo, con alcance por rol.
 */
import { Prisma } from "@reos/db";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";
import { getBoard } from "./pipeline-service";

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
