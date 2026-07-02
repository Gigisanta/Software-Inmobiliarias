import { z } from "zod";
import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import {
  LeadChannel,
  LeadStatus,
  OperationType,
  PropertyType,
  FinancingType,
  PipelineStageKey,
  LossReason,
} from "@reos/core";
import * as leadService from "../services/lead-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

const listInput = z.object({
  status: z.nativeEnum(LeadStatus).optional(),
  stageKey: z.nativeEnum(PipelineStageKey).optional(),
  assignedToId: z.string().optional(),
  channel: z.nativeEnum(LeadChannel).optional(),
  search: z.string().trim().min(1).optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

const createInput = z.object({
  firstName: z.string().trim().min(1, "El nombre es obligatorio."),
  lastName: z.string().trim().optional(),
  email: z.string().email().optional(),
  phone: z.string().trim().optional(),
  channel: z.nativeEnum(LeadChannel).optional(),
  source: z.string().optional(),
  operationType: z.nativeEnum(OperationType).optional(),
  budgetMin: z.number().nonnegative().optional(),
  budgetMax: z.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  preferredNeighborhoods: z.array(z.string()).optional(),
  propertyType: z.nativeEnum(PropertyType).optional(),
  rooms: z.number().int().nonnegative().optional(),
  bedrooms: z.number().int().nonnegative().optional(),
  hasPets: z.boolean().optional(),
  financing: z.nativeEnum(FinancingType).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
});

const updateInput = z.object({
  id: z.string(),
  patch: z.object({
    firstName: z.string().trim().min(1).optional(),
    lastName: z.string().trim().nullable().optional(),
    email: z.string().email().nullable().optional(),
    phone: z.string().trim().nullable().optional(),
    operationType: z.nativeEnum(OperationType).optional(),
    budgetMin: z.number().nonnegative().nullable().optional(),
    budgetMax: z.number().nonnegative().nullable().optional(),
    preferredNeighborhoods: z.array(z.string()).optional(),
    propertyType: z.nativeEnum(PropertyType).optional(),
    rooms: z.number().int().nonnegative().nullable().optional(),
    bedrooms: z.number().int().nonnegative().nullable().optional(),
    hasPets: z.boolean().nullable().optional(),
    financing: z.nativeEnum(FinancingType).optional(),
    notes: z.string().nullable().optional(),
  }),
});

export const leadRouter = router({
  list: permissionProcedure(Permission.LEAD_READ)
    .input(listInput)
    .query(({ ctx, input }) => leadService.listLeads(sctx(ctx), input)),

  byId: permissionProcedure(Permission.LEAD_READ)
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => leadService.getLead(sctx(ctx), input.id)),

  opportunities: permissionProcedure(Permission.LEAD_READ)
    .input(z.object({ limit: z.number().int().positive().max(50).optional() }).optional())
    .query(({ ctx, input }) => leadService.getOpportunities(sctx(ctx), input?.limit ?? 10)),

  create: permissionProcedure(Permission.LEAD_CREATE)
    .input(createInput)
    .mutation(({ ctx, input }) => leadService.createLead(sctx(ctx), input)),

  update: permissionProcedure(Permission.LEAD_UPDATE)
    .input(updateInput)
    .mutation(({ ctx, input }) => leadService.updateLead(sctx(ctx), input.id, input.patch)),

  assign: permissionProcedure(Permission.LEAD_ASSIGN)
    .input(z.object({ id: z.string(), assigneeId: z.string() }))
    .mutation(({ ctx, input }) => leadService.assignLead(sctx(ctx), input.id, input.assigneeId)),

  changeStage: permissionProcedure(Permission.LEAD_CHANGE_STAGE)
    .input(
      z.object({
        leadId: z.string(),
        toStageKey: z.nativeEnum(PipelineStageKey),
        comment: z.string().optional(),
        lossReason: z.nativeEnum(LossReason).optional(),
      }),
    )
    .mutation(({ ctx, input }) => leadService.changeStage(sctx(ctx), input)),
});
