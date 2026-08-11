/**
 * Motor de IA del plan Pro.
 *
 * Dos caminos:
 *  1. LLM real (Claude) si `ANTHROPIC_API_KEY` está configurada — vía fetch directo
 *     a la API de Mensajes, sin SDK.
 *  2. Motor heurístico propio (reglas + señales del lead) como fallback, para que
 *     todo funcione sin claves en la demo.
 *
 * Cubre: clasificación automática de leads, redacción de respuestas y
 * generación de seguimientos automáticos.
 */
import { Prisma, writeAudit, emitEvent } from "@reos/db";
import {
  AuditAction,
  DomainEvent,
  InterestLevel,
  Priority,
  ScoreBand,
  TaskStatus,
  MessageAuthor,
  MessageDirection,
} from "@reos/core";
import type { ServiceCtx } from "./types";

const DAY_MS = 1000 * 60 * 60 * 24;

/* ------------------------------------------------------------------ */
/* Puente al LLM (opcional)                                            */
/* ------------------------------------------------------------------ */

/** ¿Hay un LLM real configurado? */
export function aiProvider(): "claude" | "heuristico" {
  return process.env.ANTHROPIC_API_KEY ? "claude" : "heuristico";
}

/** Llama a Claude si hay API key; devuelve el texto o null si no se puede. */
async function callLLM(system: string, user: string, maxTokens = 400): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
        max_tokens: maxTokens,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = (await res.json()) as { content?: Array<{ text?: string }> };
    return data.content?.map((c) => c.text ?? "").join("").trim() || null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Utilidades de contexto                                              */
/* ------------------------------------------------------------------ */

function fullName(lead: { firstName: string; lastName: string | null }): string {
  return `${lead.firstName}${lead.lastName ? ` ${lead.lastName}` : ""}`.trim();
}

function money(v: Prisma.Decimal | null): string | null {
  if (v == null) return null;
  return `US$ ${Number(v).toLocaleString("es-AR")}`;
}

/** Detecta la intención del último mensaje entrante por palabras clave. */
export type Intent = "precio" | "disponibilidad" | "visita" | "financiacion" | "ubicacion" | "saludo" | "otro";

export function detectIntent(text: string): Intent {
  const t = text.toLowerCase();
  if (/(precio|vale|cuesta|cuánto|cuanto|valor)/.test(t)) return "precio";
  if (/(disponible|sigue|queda|reservad|libre)/.test(t)) return "disponibilidad";
  if (/(visita|ver|conocer|recorrer|mostrar|cuándo puedo|cuando puedo)/.test(t)) return "visita";
  if (/(crédito|credito|hipotecari|financia|cuota|banco|apto)/.test(t)) return "financiacion";
  if (/(dónde|donde|ubicaci|barrio|zona|dirección|direccion)/.test(t)) return "ubicacion";
  if (/(hola|buenas|buen día|buen dia|buenos días|buenos dias|qué tal|que tal)/.test(t)) return "saludo";
  return "otro";
}

/* ------------------------------------------------------------------ */
/* Clasificación automática                                           */
/* ------------------------------------------------------------------ */

export interface ClassificationResult {
  scoreBand: ScoreBand;
  interestLevel: InterestLevel;
  reason: string;
  suggestedAction: string;
  provider: "claude" | "heuristico";
}

function heuristicClassify(
  lead: { score: number; budgetMin: Prisma.Decimal | null; budgetMax: Prisma.Decimal | null },
  inboundText: string,
  inboundCount: number,
  daysSinceActivity: number,
): ClassificationResult {
  const t = inboundText.toLowerCase();
  const buyingSignals =
    /(visita|ver|comprar|reservar|seña|sena|crédito|credito|apto|contado|cuándo|cuando|firmar)/.test(t);
  const hasBudget = lead.budgetMin != null || lead.budgetMax != null;

  let band: ScoreBand;
  if (lead.score >= 70 || (buyingSignals && hasBudget)) band = ScoreBand.CALIENTE;
  else if (lead.score >= 40 || buyingSignals || inboundCount >= 3) band = ScoreBand.TIBIO;
  else band = ScoreBand.FRIO;

  if (daysSinceActivity > 7 && band === ScoreBand.CALIENTE) band = ScoreBand.TIBIO;

  const interest: InterestLevel =
    band === ScoreBand.CALIENTE ? InterestLevel.ALTO : band === ScoreBand.TIBIO ? InterestLevel.MEDIO : InterestLevel.BAJO;

  const signals: string[] = [];
  if (buyingSignals) signals.push("mostró intención de avanzar (visita/compra/financiación)");
  if (hasBudget) signals.push("tiene presupuesto definido");
  if (inboundCount >= 3) signals.push(`mantuvo ${inboundCount} intercambios`);
  if (daysSinceActivity > 7) signals.push(`sin actividad hace ${Math.round(daysSinceActivity)} días`);
  if (signals.length === 0) signals.push("consulta inicial sin señales fuertes todavía");

  const action =
    band === ScoreBand.CALIENTE
      ? "Contactar hoy y ofrecer coordinar una visita."
      : band === ScoreBand.TIBIO
        ? "Enviar opciones y proponer un próximo paso concreto."
        : "Nutrir con información y hacer un seguimiento en unos días.";

  return {
    scoreBand: band,
    interestLevel: interest,
    reason: `Clasificado como ${band}: ${signals.join("; ")}.`,
    suggestedAction: action,
    provider: "heuristico",
  };
}

/** Clasifica un lead y persiste banda + nivel de interés. */
export async function classifyLead(ctx: ServiceCtx, leadId: string): Promise<ClassificationResult> {
  const lead = await ctx.prisma.lead.findUnique({
    where: { id: leadId },
    include: {
      currentStage: { select: { name: true } },
      conversations: {
        orderBy: { lastMessageAt: "desc" },
        take: 1,
        include: { messages: { orderBy: { createdAt: "asc" }, take: 20 } },
      },
    },
  });
  if (!lead || lead.tenantId !== ctx.principal.tenantId) {
    throw new Error("Lead no encontrado.");
  }

  const messages = lead.conversations[0]?.messages ?? [];
  const inbound = messages.filter((m) => m.direction === MessageDirection.ENTRANTE);
  const inboundText = inbound.map((m) => m.body).join(" \n");
  const daysSinceActivity = (Date.now() - lead.lastActivityAt.getTime()) / DAY_MS;

  let result = heuristicClassify(lead, inboundText, inbound.length, daysSinceActivity);

  // Camino LLM: pide una clasificación estructurada.
  const llm = await callLLM(
    "Sos un asistente de una inmobiliaria argentina. Clasificás leads. Respondé SOLO un JSON válido.",
    `Lead: ${fullName(lead)}. Presupuesto: ${money(lead.budgetMin) ?? "?"} a ${money(lead.budgetMax) ?? "?"}. ` +
      `Score interno: ${lead.score}/100. Etapa: ${lead.currentStage?.name}. ` +
      `Mensajes del contacto:\n${inboundText || "(sin mensajes)"}\n\n` +
      `Devolvé JSON: {"band":"CALIENTE|TIBIO|FRIO","interest":"ALTO|MEDIO|BAJO","reason":"...","action":"..."}`,
  );
  if (llm) {
    try {
      const jsonStart = llm.indexOf("{");
      const parsed = JSON.parse(llm.slice(jsonStart, llm.lastIndexOf("}") + 1)) as {
        band: string;
        interest: string;
        reason: string;
        action: string;
      };
      const band = (["CALIENTE", "TIBIO", "FRIO"].includes(parsed.band) ? parsed.band : result.scoreBand) as ScoreBand;
      const interest = (["ALTO", "MEDIO", "BAJO"].includes(parsed.interest)
        ? parsed.interest
        : result.interestLevel) as InterestLevel;
      result = {
        scoreBand: band,
        interestLevel: interest,
        reason: parsed.reason || result.reason,
        suggestedAction: parsed.action || result.suggestedAction,
        provider: "claude",
      };
    } catch {
      /* si el LLM no devolvió JSON válido, quedamos con la heurística */
    }
  }

  await ctx.prisma.$transaction(async (tx) => {
    await tx.lead.update({
      where: { id: leadId },
      data: { scoreBand: result.scoreBand, interestLevel: result.interestLevel, scoreUpdatedAt: new Date() },
    });
    await writeAudit(tx, {
      tenantId: ctx.principal.tenantId,
      actorUserId: ctx.principal.userId,
      action: AuditAction.UPDATE,
      entityType: "Lead",
      entityId: leadId,
      summary: `IA (${result.provider}) clasificó el lead como ${result.scoreBand}`,
    });
  });

  return result;
}

/* ------------------------------------------------------------------ */
/* Redacción de respuestas                                            */
/* ------------------------------------------------------------------ */

export interface SuggestedReply {
  text: string;
  intent: Intent;
  provider: "claude" | "heuristico";
}

function heuristicReply(
  intent: Intent,
  ctx: { name: string; propertyTitle: string | null; price: string | null; neighborhood: string | null },
): string {
  const nombre = ctx.name.split(" ")[0] || "";
  const saludo = nombre ? `¡Hola ${nombre}! ` : "¡Hola! ";
  const prop = ctx.propertyTitle ? `sobre ${ctx.propertyTitle}` : "sobre la propiedad";

  switch (intent) {
    case "precio":
      return `${saludo}Gracias por tu consulta ${prop}. ${
        ctx.price ? `El valor es ${ctx.price}.` : "Te paso el valor y las condiciones."
      } ¿Querés que te cuente la forma de pago y coordinemos una visita?`;
    case "disponibilidad":
      return `${saludo}Sí, ${prop} sigue disponible. ¿Te gustaría coordinar una visita para conocerla? Tengo horarios esta semana.`;
    case "visita":
      return `${saludo}¡Perfecto! Coordinemos la visita ${prop}. ¿Qué día y horario te queda cómodo? Puedo esta semana por la mañana o por la tarde.`;
    case "financiacion":
      return `${saludo}Con gusto te asesoro con la financiación${
        ctx.propertyTitle ? ` de ${ctx.propertyTitle}` : ""
      }. Trabajamos crédito hipotecario y contado. ¿Me contás con qué banco o modalidad estás pensando así te oriento?`;
    case "ubicacion":
      return `${saludo}${
        ctx.neighborhood ? `La propiedad está en ${ctx.neighborhood}.` : "Te paso la ubicación exacta."
      } Si querés, coordinamos una visita para que la conozcas en persona. ¿Te viene bien esta semana?`;
    case "saludo":
      return `${saludo}Gracias por escribir a Antelo Negocios Inmobiliarios. ¿En qué te puedo ayudar? Contame qué estás buscando y te asesoro.`;
    default:
      return `${saludo}Gracias por tu mensaje. Te asesoro con gusto ${prop}. ¿Querés que coordinemos una llamada o una visita para avanzar?`;
  }
}

/** Sugiere una respuesta para el último mensaje entrante de la conversación. */
export async function suggestReply(ctx: ServiceCtx, conversationId: string): Promise<SuggestedReply> {
  const conv = await ctx.prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      lead: {
        include: {
          propertyInterests: { include: { property: true }, take: 1 },
        },
      },
      messages: { orderBy: { createdAt: "asc" }, take: 20 },
    },
  });
  if (!conv || conv.tenantId !== ctx.principal.tenantId) {
    throw new Error("Conversación no encontrada.");
  }

  const lastInbound = [...conv.messages].reverse().find((m) => m.direction === MessageDirection.ENTRANTE);
  const intent = detectIntent(lastInbound?.body ?? "");

  const property = conv.lead?.propertyInterests[0]?.property ?? null;
  const name = conv.lead ? fullName(conv.lead) : (conv.contactName ?? "");
  const replyCtx = {
    name,
    propertyTitle: property?.title ?? null,
    price: property?.price != null ? `US$ ${Number(property.price).toLocaleString("es-AR")}` : null,
    neighborhood: property?.neighborhood ?? null,
  };

  let text = heuristicReply(intent, replyCtx);
  let provider: "claude" | "heuristico" = "heuristico";

  const transcript = conv.messages
    .map((m) => `${m.direction === MessageDirection.ENTRANTE ? "Cliente" : "Inmobiliaria"}: ${m.body}`)
    .join("\n");
  const llm = await callLLM(
    "Sos el asistente de Antelo Negocios Inmobiliarios (Neuquén, Argentina). Escribís respuestas de WhatsApp " +
      "breves, cálidas y profesionales, en español rioplatense (voseo). Objetivo: avanzar hacia una visita o el " +
      "próximo paso. No inventes datos que no tengas. Respondé SOLO con el texto del mensaje.",
    `Contexto de la propiedad: ${replyCtx.propertyTitle ?? "sin propiedad asociada"}${
      replyCtx.price ? `, valor ${replyCtx.price}` : ""
    }${replyCtx.neighborhood ? `, en ${replyCtx.neighborhood}` : ""}.\n\nConversación:\n${transcript}\n\nEscribí la próxima respuesta de la inmobiliaria.`,
    300,
  );
  if (llm) {
    text = llm;
    provider = "claude";
  }

  return { text, intent, provider };
}

/* ------------------------------------------------------------------ */
/* Seguimientos automáticos                                           */
/* ------------------------------------------------------------------ */

export interface FollowUpResult {
  created: number;
  leads: { id: string; name: string }[];
}

/** Genera tareas de seguimiento para leads abiertos sin actividad reciente. */
export async function runAutoFollowUps(ctx: ServiceCtx, staleDays = 3): Promise<FollowUpResult> {
  const cutoff = new Date(Date.now() - staleDays * DAY_MS);
  const stale = await ctx.prisma.lead.findMany({
    where: {
      tenantId: ctx.principal.tenantId,
      status: "OPEN",
      lastActivityAt: { lt: cutoff },
      assignedToId: { not: null },
    },
    orderBy: { score: "desc" },
    take: 50,
    include: { tasks: { where: { status: { in: [TaskStatus.PENDIENTE, TaskStatus.EN_PROGRESO] } }, take: 1 } },
  });

  const targets = stale.filter((l) => l.tasks.length === 0);
  const created: { id: string; name: string }[] = [];

  for (const lead of targets) {
    const days = Math.round((Date.now() - lead.lastActivityAt.getTime()) / DAY_MS);
    await ctx.prisma.$transaction(async (tx) => {
      const task = await tx.task.create({
        data: {
          tenantId: ctx.principal.tenantId,
          leadId: lead.id,
          title: `Seguimiento automático: retomar contacto con ${fullName(lead)} (${days} días sin actividad)`,
          status: TaskStatus.PENDIENTE,
          priority: lead.scoreBand === ScoreBand.CALIENTE ? Priority.ALTA : Priority.MEDIA,
          dueAt: new Date(),
          assignedToId: lead.assignedToId,
          createdById: ctx.principal.userId,
        },
      });
      await emitEvent(tx, {
        tenantId: ctx.principal.tenantId,
        type: DomainEvent.TASK_CREATED,
        aggregateType: "Task",
        aggregateId: task.id,
        actorUserId: ctx.principal.userId,
        payload: { auto: true, leadId: lead.id },
      });
    });
    created.push({ id: lead.id, name: fullName(lead) });
  }

  return { created: created.length, leads: created };
}
