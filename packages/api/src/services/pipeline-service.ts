/**
 * Servicio de Pipeline: etapas configurables por tenant y armado del tablero Kanban.
 */
import { Prisma } from "@reos/db";
import { DEFAULT_PIPELINE, type PipelineStageKey } from "@reos/core";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";

/** Lista las etapas del pipeline del tenant, ordenadas. */
export async function listStages(ctx: ServiceCtx) {
  return ctx.prisma.pipelineStage.findMany({
    where: { tenantId: ctx.principal.tenantId },
    orderBy: { order: "asc" },
  });
}

/** Devuelve la etapa por su clave canónica (o lanza si no existe). */
export async function getStageByKey(ctx: ServiceCtx, key: PipelineStageKey) {
  const stage = await ctx.prisma.pipelineStage.findUnique({
    where: { tenantId_key: { tenantId: ctx.principal.tenantId, key } },
  });
  if (!stage) throw new Error(`El tenant no tiene la etapa ${key} configurada.`);
  return stage;
}

/**
 * Siembra el pipeline por defecto para un tenant si aún no tiene etapas.
 * Se usa al crear un tenant nuevo.
 */
export async function ensureDefaultPipeline(ctx: ServiceCtx) {
  const count = await ctx.prisma.pipelineStage.count({ where: { tenantId: ctx.principal.tenantId } });
  if (count > 0) return;
  await ctx.prisma.pipelineStage.createMany({
    data: DEFAULT_PIPELINE.map((s) => ({
      tenantId: ctx.principal.tenantId,
      key: s.key,
      name: s.name,
      order: s.order,
      probability: s.defaultProbability,
      isWon: s.isWon,
      isLost: s.isLost,
    })),
  });
}

/**
 * Arma el tablero Kanban: cada etapa con sus leads (respetando el alcance del rol),
 * conteo y valor potencial estimado (sumatoria de budgetMax ponderado por probabilidad).
 */
export async function getBoard(ctx: ServiceCtx) {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  const leadWhere: Prisma.LeadWhereInput = {
    tenantId: ctx.principal.tenantId,
    status: "OPEN",
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };

  const [stages, leads] = await Promise.all([
    ctx.prisma.pipelineStage.findMany({
      where: { tenantId: ctx.principal.tenantId, isLost: false },
      orderBy: { order: "asc" },
    }),
    ctx.prisma.lead.findMany({
      where: leadWhere,
      orderBy: [{ score: "desc" }, { lastActivityAt: "desc" }],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        channel: true,
        operationType: true,
        budgetMax: true,
        currency: true,
        score: true,
        scoreBand: true,
        currentStageId: true,
        assignedToId: true,
        lastActivityAt: true,
      },
    }),
  ]);

  const byStage = new Map<string, typeof leads>();
  for (const lead of leads) {
    const arr = byStage.get(lead.currentStageId) ?? [];
    arr.push(lead);
    byStage.set(lead.currentStageId, arr);
  }

  return stages.map((stage) => {
    const stageLeads = byStage.get(stage.id) ?? [];
    const potentialValue = stageLeads.reduce((acc, l) => {
      const max = l.budgetMax ? Number(l.budgetMax) : 0;
      return acc + (max * stage.probability) / 100;
    }, 0);
    return {
      stage: {
        id: stage.id,
        key: stage.key,
        name: stage.name,
        order: stage.order,
        probability: stage.probability,
      },
      count: stageLeads.length,
      potentialValue: Math.round(potentialValue),
      leads: stageLeads,
    };
  });
}
