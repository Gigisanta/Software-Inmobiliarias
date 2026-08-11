/**
 * Servicio de Conversaciones (plan Pro) — bandeja unificada de WhatsApp con IA.
 *
 * Incluye el flujo estrella del Pro: un mensaje entrante puede crear el lead
 * automáticamente, clasificarlo con IA y responder solo (24/7), derivando a un
 * humano cuando hace falta.
 */
import { TRPCError } from "@trpc/server";
import { emitEvent, writeAudit, type Prisma } from "@reos/db";
import {
  AuditAction,
  ConversationStatus,
  DomainEvent,
  LeadChannel,
  MessageAuthor,
  MessageDirection,
} from "@reos/core";
import { canSeeAllLeads } from "@reos/auth";
import type { ServiceCtx } from "./types";
import { createLead } from "./lead-service";
import { classifyLead, suggestReply } from "./ai-service";

const convoInclude = {
  lead: { select: { id: true, firstName: true, lastName: true, phone: true, scoreBand: true } },
} satisfies Prisma.ConversationInclude;

function scopeWhere(ctx: ServiceCtx): Prisma.ConversationWhereInput {
  const seeAll = canSeeAllLeads(ctx.principal.role);
  return {
    tenantId: ctx.principal.tenantId,
    ...(seeAll ? {} : { assignedToId: ctx.principal.userId }),
  };
}

export interface ListConversationsFilters {
  status?: ConversationStatus;
  needsHuman?: boolean;
}

export async function listConversations(ctx: ServiceCtx, filters: ListConversationsFilters = {}) {
  const where: Prisma.ConversationWhereInput = {
    ...scopeWhere(ctx),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.needsHuman != null ? { needsHuman: filters.needsHuman } : {}),
  };
  return ctx.prisma.conversation.findMany({
    where,
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    include: convoInclude,
  });
}

export async function getConversation(ctx: ServiceCtx, id: string) {
  const conv = await ctx.prisma.conversation.findUnique({
    where: { id },
    include: {
      ...convoInclude,
      messages: { orderBy: { createdAt: "asc" }, take: 200 },
    },
  });
  if (!conv || conv.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Conversación no encontrada." });
  }
  if (!canSeeAllLeads(ctx.principal.role) && conv.assignedToId && conv.assignedToId !== ctx.principal.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "No tenés acceso a esta conversación." });
  }
  return conv;
}

async function loadConvoForWrite(ctx: ServiceCtx, id: string) {
  const conv = await ctx.prisma.conversation.findUnique({ where: { id } });
  if (!conv || conv.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Conversación no encontrada." });
  }
  return conv;
}

/** Agrega un mensaje al hilo y actualiza los metadatos de la conversación. */
async function appendMessage(
  ctx: ServiceCtx,
  conversationId: string,
  direction: MessageDirection,
  author: MessageAuthor,
  body: string,
) {
  const now = new Date();
  const preview = body.length > 120 ? `${body.slice(0, 117)}…` : body;
  return ctx.prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { tenantId: ctx.principal.tenantId, conversationId, direction, author, body },
    });
    await tx.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: now,
        lastMessagePreview: preview,
        ...(direction === MessageDirection.ENTRANTE
          ? { unreadCount: { increment: 1 }, status: ConversationStatus.PENDIENTE }
          : { unreadCount: 0 }),
      },
    });
    await emitEvent(tx, {
      tenantId: ctx.principal.tenantId,
      type: direction === MessageDirection.ENTRANTE ? DomainEvent.MESSAGE_RECEIVED : DomainEvent.MESSAGE_SENT,
      aggregateType: "Conversation",
      aggregateId: conversationId,
      actorUserId: ctx.principal.userId,
      payload: { author },
    });
    return message;
  });
}

/** Un asesor humano envía un mensaje. */
export async function sendMessage(ctx: ServiceCtx, conversationId: string, body: string) {
  await loadConvoForWrite(ctx, conversationId);
  const text = body.trim();
  if (!text) throw new TRPCError({ code: "BAD_REQUEST", message: "El mensaje no puede estar vacío." });
  await appendMessage(ctx, conversationId, MessageDirection.SALIENTE, MessageAuthor.ASESOR, text);
  // Al responder un humano, la conversación vuelve a estado resuelto/atendido.
  await ctx.prisma.conversation.update({
    where: { id: conversationId },
    data: { status: ConversationStatus.ABIERTA, needsHuman: false },
  });
  return getConversation(ctx, conversationId);
}

/** La IA redacta y envía la respuesta (a pedido o en modo automático). */
export async function replyWithAi(ctx: ServiceCtx, conversationId: string) {
  await loadConvoForWrite(ctx, conversationId);
  const suggestion = await suggestReply(ctx, conversationId);
  await appendMessage(ctx, conversationId, MessageDirection.SALIENTE, MessageAuthor.IA, suggestion.text);
  await ctx.prisma.conversation.update({
    where: { id: conversationId },
    data: { status: ConversationStatus.ABIERTA },
  });
  await writeAudit(ctx.prisma, {
    tenantId: ctx.principal.tenantId,
    actorUserId: ctx.principal.userId,
    action: AuditAction.UPDATE,
    entityType: "Conversation",
    entityId: conversationId,
    summary: `IA (${suggestion.provider}) respondió al contacto`,
  });
  return { conversation: await getConversation(ctx, conversationId), suggestion };
}

export async function markRead(ctx: ServiceCtx, id: string) {
  await loadConvoForWrite(ctx, id);
  return ctx.prisma.conversation.update({ where: { id }, data: { unreadCount: 0 } });
}

export async function setAiEnabled(ctx: ServiceCtx, id: string, enabled: boolean) {
  await loadConvoForWrite(ctx, id);
  return ctx.prisma.conversation.update({ where: { id }, data: { aiEnabled: enabled } });
}

export async function setStatus(ctx: ServiceCtx, id: string, status: ConversationStatus) {
  await loadConvoForWrite(ctx, id);
  return ctx.prisma.conversation.update({
    where: { id },
    data: { status, ...(status === ConversationStatus.RESUELTA ? { needsHuman: false } : {}) },
  });
}

export async function setNeedsHuman(ctx: ServiceCtx, id: string, needsHuman: boolean) {
  await loadConvoForWrite(ctx, id);
  return ctx.prisma.conversation.update({ where: { id }, data: { needsHuman } });
}

/* ------------------------------------------------------------------ */
/* Flujo entrante (demo del Pro): WhatsApp → lead → IA                 */
/* ------------------------------------------------------------------ */

export interface SimulateInboundInput {
  conversationId?: string;
  contactName?: string;
  contactPhone?: string;
  body: string;
  /** Crea el lead automáticamente si es un contacto nuevo (default true). */
  autoCreateLead?: boolean;
}

export interface SimulateInboundResult {
  conversationId: string;
  leadCreated: boolean;
  classifiedBand: string | null;
  aiReplied: boolean;
  handoff: boolean;
}

/**
 * Simula un mensaje entrante de WhatsApp y dispara la cadena Pro:
 * crea el lead si es nuevo → clasifica con IA → responde solo o deriva a un humano.
 */
export async function simulateInbound(
  ctx: ServiceCtx,
  input: SimulateInboundInput,
): Promise<SimulateInboundResult> {
  const body = input.body.trim();
  if (!body) throw new TRPCError({ code: "BAD_REQUEST", message: "El mensaje no puede estar vacío." });

  let conversation = input.conversationId ? await loadConvoForWrite(ctx, input.conversationId) : null;
  let leadCreated = false;

  // Contacto nuevo → creamos lead + conversación automáticamente.
  if (!conversation) {
    const autoCreate = input.autoCreateLead !== false;
    let leadId: string | null = null;

    if (autoCreate) {
      const [firstName, ...rest] = (input.contactName ?? "Contacto WhatsApp").trim().split(" ");
      const lead = await createLead(ctx, {
        firstName: firstName || "Contacto",
        lastName: rest.join(" ") || undefined,
        phone: input.contactPhone,
        channel: LeadChannel.WHATSAPP,
        source: "WhatsApp (entrante)",
        notes: `Primer mensaje: "${body}"`,
      });
      leadId = lead.id;
      leadCreated = true;
    }

    conversation = await ctx.prisma.conversation.create({
      data: {
        tenantId: ctx.principal.tenantId,
        leadId,
        channel: LeadChannel.WHATSAPP,
        status: ConversationStatus.PENDIENTE,
        assignedToId: ctx.principal.userId,
        contactName: input.contactName ?? null,
        contactPhone: input.contactPhone ?? null,
        aiEnabled: true,
      },
    });
  }

  // Registrar el mensaje entrante.
  await appendMessage(ctx, conversation.id, MessageDirection.ENTRANTE, MessageAuthor.CONTACTO, body);

  // Clasificación automática (si hay lead).
  let classifiedBand: string | null = null;
  if (conversation.leadId) {
    try {
      const cls = await classifyLead(ctx, conversation.leadId);
      classifiedBand = cls.scoreBand;
    } catch {
      /* no bloquea el flujo si falla la clasificación */
    }
  }

  // Derivación inteligente: ciertos temas requieren un humano.
  const needsHuman = /(reclamo|problema|abogad|escritura|seña|sena|oferta|contraoferta|urgente)/i.test(body);

  let aiReplied = false;
  const fresh = await ctx.prisma.conversation.findUnique({ where: { id: conversation.id } });
  if (needsHuman) {
    await ctx.prisma.conversation.update({
      where: { id: conversation.id },
      data: { needsHuman: true, status: ConversationStatus.PENDIENTE },
    });
  } else if (fresh?.aiEnabled) {
    // La IA responde sola (24/7).
    try {
      await replyWithAi(ctx, conversation.id);
      aiReplied = true;
    } catch {
      /* si falla, queda pendiente para un humano */
    }
  }

  return {
    conversationId: conversation.id,
    leadCreated,
    classifiedBand,
    aiReplied,
    handoff: needsHuman,
  };
}
