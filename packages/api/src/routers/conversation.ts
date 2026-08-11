import { z } from "zod";
import { router, proProcedure } from "../trpc";
import { ConversationStatus } from "@reos/core";
import * as convoService from "../services/conversation-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

export const conversationRouter = router({
  list: proProcedure
    .input(
      z
        .object({
          status: z.nativeEnum(ConversationStatus).optional(),
          needsHuman: z.boolean().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => convoService.listConversations(sctx(ctx), input ?? {})),

  byId: proProcedure
    .input(z.object({ id: z.string() }))
    .query(({ ctx, input }) => convoService.getConversation(sctx(ctx), input.id)),

  send: proProcedure
    .input(z.object({ conversationId: z.string(), body: z.string().trim().min(1) }))
    .mutation(({ ctx, input }) => convoService.sendMessage(sctx(ctx), input.conversationId, input.body)),

  replyWithAi: proProcedure
    .input(z.object({ conversationId: z.string() }))
    .mutation(({ ctx, input }) => convoService.replyWithAi(sctx(ctx), input.conversationId)),

  markRead: proProcedure
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => convoService.markRead(sctx(ctx), input.id)),

  setAiEnabled: proProcedure
    .input(z.object({ id: z.string(), enabled: z.boolean() }))
    .mutation(({ ctx, input }) => convoService.setAiEnabled(sctx(ctx), input.id, input.enabled)),

  setStatus: proProcedure
    .input(z.object({ id: z.string(), status: z.nativeEnum(ConversationStatus) }))
    .mutation(({ ctx, input }) => convoService.setStatus(sctx(ctx), input.id, input.status)),

  setNeedsHuman: proProcedure
    .input(z.object({ id: z.string(), needsHuman: z.boolean() }))
    .mutation(({ ctx, input }) => convoService.setNeedsHuman(sctx(ctx), input.id, input.needsHuman)),

  simulateInbound: proProcedure
    .input(
      z.object({
        conversationId: z.string().optional(),
        contactName: z.string().trim().optional(),
        contactPhone: z.string().trim().optional(),
        body: z.string().trim().min(1),
        autoCreateLead: z.boolean().optional(),
      }),
    )
    .mutation(({ ctx, input }) => convoService.simulateInbound(sctx(ctx), input)),
});
