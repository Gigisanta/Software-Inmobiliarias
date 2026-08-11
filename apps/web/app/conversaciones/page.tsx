"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import {
  MessageSquareText,
  Sparkles,
  Send,
  Loader2,
  Bot,
  UserRound,
  Plus,
  AlertTriangle,
  Check,
  Zap,
} from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { ConversationStatus, MessageAuthor, MessageDirection } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, bandVariant, BAND_LABEL } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Field } from "@/components/ui/input";
import { FadeIn } from "@/components/ui/motion";
import { ProUpsell } from "@/components/pro-upsell";
import { cn, timeAgo, initials } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type ConversationListItem = RouterOutputs["conversation"]["list"][number];
type ConversationDetail = RouterOutputs["conversation"]["byId"];

export default function ConversacionesPage() {
  const trpc = useTRPC();
  const me = useQuery(trpc.health.me.queryOptions());
  const plan = me.data?.tenant?.plan;

  if (me.isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader title="Conversaciones" subtitle="Todos los chats de WhatsApp en una sola bandeja" />
        <Skeleton className="h-[520px] rounded-2xl" />
      </div>
    );
  }

  if (plan === "STARTER") {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader title="Conversaciones" subtitle="Todos los chats de WhatsApp en una sola bandeja" />
        <ProUpsell
          title="Bandeja de WhatsApp con IA"
          description="Centralizá los mensajes de todos tus asesores y dejá que un asistente entrenado responda y clasifique cada consulta, 24/7."
          bullets={[
            "IA que responde mensajes precisos al instante",
            "Clasificación automática de cada lead",
            "Creación automática de leads desde WhatsApp",
            "Derivación al asesor correcto en el momento justo",
          ]}
        />
      </div>
    );
  }

  return <Inbox />;
}

/* ------------------------------------------------------------------ */
/* Bandeja                                                             */
/* ------------------------------------------------------------------ */

function Inbox() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [simOpen, setSimOpen] = useState(false);

  const list = useQuery(trpc.conversation.list.queryOptions({}));
  const provider = useQuery(trpc.ai.provider.queryOptions());
  const items = list.data ?? [];

  const selected = selectedId ?? items[0]?.id ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl">
      <PageHeader
        title="Conversaciones"
        subtitle="Todos los chats de WhatsApp de tu inmobiliaria, en una sola bandeja"
        actions={
          <div className="flex items-center gap-2">
            <AiBadge provider={provider.data?.provider} />
            <Button onClick={() => setSimOpen(true)}>
              <Plus className="h-4 w-4" />
              Simular entrante
            </Button>
          </div>
        }
      />

      {list.isLoading ? (
        <Skeleton className="h-[520px] rounded-2xl" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<MessageSquareText className="h-6 w-6" strokeWidth={1.5} />}
          title="Todavía no hay conversaciones"
          description="Cuando llegue un mensaje de WhatsApp, la IA crea el lead, lo clasifica y responde sola. Probalo con «Simular entrante»."
          action={
            <Button onClick={() => setSimOpen(true)}>
              <Plus className="h-4 w-4" />
              Simular mensaje entrante
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[320px_1fr]">
          <ConversationList
            items={items}
            selectedId={selected}
            onSelect={setSelectedId}
          />
          {selected ? (
            <Thread conversationId={selected} />
          ) : (
            <Card className="grid place-items-center py-20 text-sm text-muted-2">
              Elegí una conversación
            </Card>
          )}
        </div>
      )}

      <SimulateModal
        open={simOpen}
        onClose={() => setSimOpen(false)}
        onDone={(convId) => {
          setSimOpen(false);
          setSelectedId(convId);
          qc.invalidateQueries();
        }}
      />
    </div>
  );
}

function AiBadge({ provider }: { provider?: string }) {
  const isClaude = provider === "claude";
  return (
    <span
      className={cn(
        "hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium sm:inline-flex",
        isClaude
          ? "border-primary/30 bg-primary-soft text-primary"
          : "border-border bg-surface-2 text-muted",
      )}
      title={isClaude ? "IA con Claude (LLM real)" : "IA con motor propio (sin clave de LLM)"}
    >
      <Sparkles className="h-3.5 w-3.5" />
      {isClaude ? "IA: Claude" : "IA: motor propio"}
    </span>
  );
}

function ConversationList({
  items,
  selectedId,
  onSelect,
}: {
  items: ConversationListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <Card className="flex max-h-[560px] flex-col overflow-y-auto p-1.5">
      {items.map((c) => {
        const name = c.lead
          ? `${c.lead.firstName}${c.lead.lastName ? ` ${c.lead.lastName}` : ""}`
          : (c.contactName ?? c.contactPhone ?? "Contacto");
        const active = c.id === selectedId;
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onSelect(c.id)}
            className={cn(
              "flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-[180ms]",
              active ? "bg-primary-soft" : "hover:bg-surface-2",
            )}
          >
            <Avatar initials={initials(name.split(" ")[0], name.split(" ")[1])} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-sm font-medium text-foreground">{name}</span>
                <span className="shrink-0 text-[11px] text-muted-2">{timeAgo(c.lastMessageAt)}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted">{c.lastMessagePreview ?? "—"}</p>
              <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                {c.needsHuman ? (
                  <Badge variant="amber">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Requiere vos
                  </Badge>
                ) : null}
                {c.unreadCount > 0 ? <Badge variant="forest">{c.unreadCount} sin leer</Badge> : null}
                {c.lead?.scoreBand ? (
                  <Badge variant={bandVariant(c.lead.scoreBand)}>{BAND_LABEL[c.lead.scoreBand]}</Badge>
                ) : null}
              </div>
            </div>
          </button>
        );
      })}
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Hilo                                                                */
/* ------------------------------------------------------------------ */

function Thread({ conversationId }: { conversationId: string }) {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");

  const conv = useQuery(trpc.conversation.byId.queryOptions({ id: conversationId }));

  const invalidate = () => qc.invalidateQueries();

  const send = useMutation(
    trpc.conversation.send.mutationOptions({
      onSuccess: () => {
        setDraft("");
        invalidate();
      },
    }),
  );
  const replyAi = useMutation(trpc.conversation.replyWithAi.mutationOptions({ onSuccess: invalidate }));
  const suggest = useMutation(trpc.ai.suggestReply.mutationOptions());
  const setAi = useMutation(trpc.conversation.setAiEnabled.mutationOptions({ onSuccess: invalidate }));
  const setStatus = useMutation(trpc.conversation.setStatus.mutationOptions({ onSuccess: invalidate }));

  if (conv.isLoading || !conv.data) {
    return <Skeleton className="h-[560px] rounded-2xl" />;
  }

  const c = conv.data;
  const name = c.lead
    ? `${c.lead.firstName}${c.lead.lastName ? ` ${c.lead.lastName}` : ""}`
    : (c.contactName ?? c.contactPhone ?? "Contacto");

  return (
    <Card className="flex max-h-[560px] flex-col">
      {/* Cabecera del hilo */}
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar initials={initials(name.split(" ")[0], name.split(" ")[1])} size="sm" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {c.lead ? (
                <Link
                  href={`/leads/${c.lead.id}`}
                  className="truncate text-sm font-medium text-foreground transition-colors duration-[180ms] hover:text-primary"
                >
                  {name}
                </Link>
              ) : (
                <span className="truncate text-sm font-medium text-foreground">{name}</span>
              )}
              {c.lead?.scoreBand ? (
                <Badge variant={bandVariant(c.lead.scoreBand)}>{BAND_LABEL[c.lead.scoreBand]}</Badge>
              ) : null}
            </div>
            <p className="truncate text-xs text-muted">{c.contactPhone ?? c.lead?.phone ?? "WhatsApp"}</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={() => setAi.mutate({ id: c.id, enabled: !c.aiEnabled })}
            disabled={setAi.isPending}
            title="Auto-respuesta con IA"
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors duration-[180ms]",
              c.aiEnabled
                ? "border-primary/30 bg-primary-soft text-primary"
                : "border-border bg-surface text-muted hover:text-foreground",
            )}
          >
            <Bot className="h-3.5 w-3.5" />
            IA {c.aiEnabled ? "activa" : "en pausa"}
          </button>
          {c.status !== "RESUELTA" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStatus.mutate({ id: c.id, status: ConversationStatus.RESUELTA })}
            >
              <Check className="h-3.5 w-3.5" />
              Resolver
            </Button>
          ) : (
            <Badge variant="sage">Resuelta</Badge>
          )}
        </div>
      </div>

      {c.needsHuman ? (
        <div className="flex items-center gap-2 border-b border-border bg-(--badge-amber-bg) px-5 py-2 text-xs font-medium text-(--badge-amber-fg)">
          <AlertTriangle className="h-3.5 w-3.5" />
          La IA derivó esta conversación: necesita tu atención personal.
        </div>
      ) : null}

      {/* Mensajes */}
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
        {c.messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      {/* Redactor */}
      <div className="border-t border-border px-4 py-3">
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            disabled={replyAi.isPending}
            onClick={() => replyAi.mutate({ conversationId: c.id })}
          >
            {replyAi.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            Responder con IA
          </Button>
          <Button
            variant="ghost"
            size="sm"
            disabled={suggest.isPending}
            onClick={() =>
              suggest.mutate(
                { conversationId: c.id },
                { onSuccess: (r) => setDraft(r.text) },
              )
            }
          >
            {suggest.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Sugerir respuesta
          </Button>
        </div>
        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={2}
            placeholder="Escribí una respuesta…"
            className="min-h-[44px]"
          />
          <Button
            disabled={send.isPending || !draft.trim()}
            onClick={() => send.mutate({ conversationId: c.id, body: draft.trim() })}
          >
            {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}

function MessageBubble({ message }: { message: ConversationDetail["messages"][number] }) {
  const inbound = message.direction === MessageDirection.ENTRANTE;
  const isAi = message.author === MessageAuthor.IA;

  return (
    <div className={cn("flex", inbound ? "justify-start" : "justify-end")}>
      <div className={cn("flex max-w-[78%] flex-col gap-1", inbound ? "items-start" : "items-end")}>
        {!inbound ? (
          <span className="flex items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wide text-muted-2">
            {isAi ? (
              <>
                <Bot className="h-3 w-3" /> IA
              </>
            ) : (
              <>
                <UserRound className="h-3 w-3" /> Asesor
              </>
            )}
          </span>
        ) : null}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            inbound
              ? "rounded-tl-md bg-surface-2 text-foreground"
              : isAi
                ? "rounded-tr-md bg-primary-soft text-foreground"
                : "rounded-tr-md bg-primary text-primary-foreground",
          )}
        >
          {message.body}
        </div>
        <span className="px-1 text-[10px] text-muted-2">{timeAgo(message.createdAt)}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Simular mensaje entrante                                            */
/* ------------------------------------------------------------------ */

const PRESETS = [
  "Hola! ¿Sigue disponible el depto del centro?",
  "¿Cuánto sale el lote de Primaterra?",
  "Me interesa, ¿puedo coordinar una visita esta semana?",
  "¿Toman crédito hipotecario? ¿Es apto?",
];

function SimulateModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (conversationId: string) => void;
}) {
  const trpc = useTRPC();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [body, setBody] = useState("");
  const [result, setResult] = useState<RouterOutputs["conversation"]["simulateInbound"] | null>(null);

  const sim = useMutation(
    trpc.conversation.simulateInbound.mutationOptions({
      onSuccess: (r) => setResult(r),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setResult(null);
    sim.mutate({
      contactName: name.trim() || undefined,
      contactPhone: phone.trim() || undefined,
      body: body.trim(),
      autoCreateLead: true,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Simular mensaje entrante"
      description="Emulá un WhatsApp de un cliente nuevo y mirá cómo la IA crea el lead, lo clasifica y responde."
    >
      {result ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-surface-2/60 p-4">
            <p className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              Esto hizo el asistente:
            </p>
            <ul className="flex flex-col gap-2 text-sm text-muted">
              <li className="flex items-center gap-2">
                <ResultDot ok={result.leadCreated} />
                {result.leadCreated ? "Creó el lead automáticamente" : "Usó una conversación existente"}
              </li>
              <li className="flex items-center gap-2">
                <ResultDot ok={!!result.classifiedBand} />
                {result.classifiedBand
                  ? `Clasificó el lead como ${BAND_LABEL[result.classifiedBand] ?? result.classifiedBand}`
                  : "Sin clasificación (sin lead)"}
              </li>
              <li className="flex items-center gap-2">
                <ResultDot ok={result.aiReplied} warn={result.handoff} />
                {result.handoff
                  ? "Derivó la conversación a un humano"
                  : result.aiReplied
                    ? "Respondió al cliente al instante"
                    : "Quedó pendiente"}
              </li>
            </ul>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setResult(null);
                setName("");
                setPhone("");
                setBody("");
              }}
            >
              Simular otro
            </Button>
            <Button onClick={() => onDone(result.conversationId)}>Ver conversación</Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Nombre del contacto">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Lucía Martínez" />
            </Field>
            <Field label="Teléfono">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+54 9 299…" />
            </Field>
          </div>
          <Field label="Mensaje" required>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Hola! Vi el aviso…" />
          </Field>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBody(p)}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-muted transition-colors duration-[180ms] hover:border-border-strong hover:text-foreground"
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose} disabled={sim.isPending}>
              Cancelar
            </Button>
            <Button type="submit" disabled={sim.isPending || !body.trim()}>
              {sim.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Procesando…
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> Enviar mensaje
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function ResultDot({ ok, warn }: { ok: boolean; warn?: boolean }) {
  return (
    <span
      className={cn(
        "grid h-4 w-4 shrink-0 place-items-center rounded-full",
        warn ? "bg-(--badge-amber-bg) text-(--badge-amber-fg)" : ok ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted-2",
      )}
    >
      {warn ? <AlertTriangle className="h-2.5 w-2.5" /> : <Check className="h-2.5 w-2.5" strokeWidth={3} />}
    </span>
  );
}
