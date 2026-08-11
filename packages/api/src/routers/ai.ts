import { z } from "zod";
import { router, proProcedure } from "../trpc";
import * as aiService from "../services/ai-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

export const aiRouter = router({
  /** Proveedor activo: "claude" (LLM real) o "heuristico" (motor propio). */
  provider: proProcedure.query(() => ({ provider: aiService.aiProvider() })),

  classifyLead: proProcedure
    .input(z.object({ leadId: z.string() }))
    .mutation(({ ctx, input }) => aiService.classifyLead(sctx(ctx), input.leadId)),

  suggestReply: proProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => aiService.suggestReply(sctx(ctx), input.conversationId)),

  runFollowUps: proProcedure
    .input(z.object({ staleDays: z.number().int().positive().max(60).optional() }).optional())
    .mutation(({ ctx, input }) => aiService.runAutoFollowUps(sctx(ctx), input?.staleDays ?? 3)),
});
