"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { ListChecks, Plus, Check, Trash2, CalendarDays, User as UserIcon, Sparkles, Loader2 } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { TaskStatus } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { TaskModal } from "@/components/task-modal";
import { FadeIn } from "@/components/ui/motion";
import { useInvalidate } from "@/trpc/invalidate";
import { cn } from "@/lib/utils";

type RouterOutputs = inferRouterOutputs<AppRouter>;
type TaskItem = RouterOutputs["task"]["list"][number];

const PRIORITY_LABEL: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

function priorityVariant(priority: string): BadgeVariant {
  const p = priority.toUpperCase();
  if (p === "URGENTE") return "danger";
  if (p === "ALTA") return "amber";
  if (p === "MEDIA") return "sand";
  return "neutral";
}

function startOfDay(d: Date): number {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.getTime();
}

function dueLabel(dueAt: Date | null): { text: string; overdue: boolean; today: boolean } {
  if (!dueAt) return { text: "Sin fecha", overdue: false, today: false };
  const due = startOfDay(new Date(dueAt));
  const today = startOfDay(new Date());
  const diffDays = Math.round((due - today) / 86_400_000);
  if (diffDays < 0) return { text: `Venció hace ${Math.abs(diffDays)} d`, overdue: true, today: false };
  if (diffDays === 0) return { text: "Vence hoy", overdue: false, today: true };
  if (diffDays === 1) return { text: "Vence mañana", overdue: false, today: false };
  return {
    text: new Date(dueAt).toLocaleDateString("es-AR", { day: "2-digit", month: "short" }),
    overdue: false,
    today: false,
  };
}

export default function TareasPage() {
  const trpc = useTRPC();
  const invalidate = useInvalidate();
  const [showCompleted, setShowCompleted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const tasks = useQuery(trpc.task.list.queryOptions({ includeCompleted: showCompleted }));
  const me = useQuery(trpc.health.me.queryOptions());
  const pro = me.data?.tenant?.plan != null && me.data.tenant.plan !== "STARTER";
  const items = tasks.data ?? [];
  const [followUpMsg, setFollowUpMsg] = useState<string | null>(null);

  const setStatus = useMutation(
    trpc.task.setStatus.mutationOptions({ onSuccess: () => invalidate(["task", "dashboard"]) }),
  );
  const remove = useMutation(
    trpc.task.remove.mutationOptions({ onSuccess: () => invalidate(["task", "dashboard"]) }),
  );
  const followUps = useMutation(
    trpc.ai.runFollowUps.mutationOptions({
      onSuccess: (r) => {
        setFollowUpMsg(
          r.created === 0
            ? "Todo al día: no hay leads sin seguimiento."
            : `La IA generó ${r.created} ${r.created === 1 ? "seguimiento" : "seguimientos"} para leads sin actividad.`,
        );
        invalidate(["task", "dashboard"]);
      },
    }),
  );

  const groups = useMemo(() => groupTasks(items), [items]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Tareas"
        subtitle="Seguimientos, llamadas y documentación, en orden"
        actions={
          <div className="flex items-center gap-2">
            {pro ? (
              <Button variant="secondary" disabled={followUps.isPending} onClick={() => followUps.mutate({})}>
                {followUps.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                Seguimientos con IA
              </Button>
            ) : null}
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          </div>
        }
      />

      {followUpMsg ? (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-primary-soft px-3.5 py-2.5 text-sm text-primary">
          <Sparkles className="h-4 w-4" />
          {followUpMsg}
        </div>
      ) : null}

      <div className="mb-5 flex items-center gap-2">
        <FilterChip active={!showCompleted} onClick={() => setShowCompleted(false)}>
          Pendientes
        </FilterChip>
        <FilterChip active={showCompleted} onClick={() => setShowCompleted(true)}>
          Todas
        </FilterChip>
      </div>

      {tasks.isLoading ? (
        <div className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-6 w-6" strokeWidth={1.5} />}
          title="No tenés tareas pendientes"
          description="Creá una tarea para no perder de vista una llamada, un envío de documentación o un seguimiento."
          action={
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Nueva tarea
            </Button>
          }
        />
      ) : (
        <div className="flex flex-col gap-6">
          {groups.map((group) =>
            group.tasks.length === 0 ? null : (
              <FadeIn key={group.key}>
                <div>
                  <h2 className="mb-2.5 px-1 text-xs font-semibold uppercase tracking-wider text-muted-2">
                    {group.label} · {group.tasks.length}
                  </h2>
                  <Card>
                    <ul className="flex flex-col divide-y divide-border">
                      {group.tasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          onToggle={() =>
                            setStatus.mutate({
                              id: task.id,
                              status:
                                task.status === TaskStatus.COMPLETADA
                                  ? TaskStatus.PENDIENTE
                                  : TaskStatus.COMPLETADA,
                            })
                          }
                          onDelete={() => remove.mutate({ id: task.id })}
                        />
                      ))}
                    </ul>
                  </Card>
                </div>
              </FadeIn>
            ),
          )}
        </div>
      )}

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          invalidate(["task", "dashboard"]);
        }}
      />
    </div>
  );
}

interface TaskGroup {
  key: string;
  label: string;
  tasks: TaskItem[];
}

function groupTasks(items: TaskItem[]): TaskGroup[] {
  const overdue: TaskItem[] = [];
  const today: TaskItem[] = [];
  const upcoming: TaskItem[] = [];
  const noDate: TaskItem[] = [];
  const done: TaskItem[] = [];

  for (const t of items) {
    if (t.status === TaskStatus.COMPLETADA || t.status === TaskStatus.CANCELADA) {
      done.push(t);
      continue;
    }
    const d = dueLabel(t.dueAt);
    if (!t.dueAt) noDate.push(t);
    else if (d.overdue) overdue.push(t);
    else if (d.today) today.push(t);
    else upcoming.push(t);
  }

  return [
    { key: "overdue", label: "Vencidas", tasks: overdue },
    { key: "today", label: "Para hoy", tasks: today },
    { key: "upcoming", label: "Próximas", tasks: upcoming },
    { key: "noDate", label: "Sin fecha", tasks: noDate },
    { key: "done", label: "Completadas", tasks: done },
  ];
}

function TaskRow({
  task,
  onToggle,
  onDelete,
}: {
  task: TaskItem;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const completed = task.status === TaskStatus.COMPLETADA || task.status === TaskStatus.CANCELADA;
  const due = dueLabel(task.dueAt);
  const leadName = task.lead
    ? `${task.lead.firstName}${task.lead.lastName ? ` ${task.lead.lastName}` : ""}`
    : null;

  return (
    <li className="flex items-center gap-3.5 px-5 py-4 first:rounded-t-2xl last:rounded-b-2xl">
      <button
        type="button"
        onClick={onToggle}
        aria-label={completed ? "Marcar como pendiente" : "Marcar como completada"}
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors duration-[180ms]",
          completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border-strong bg-surface hover:border-primary",
        )}
      >
        {completed ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium",
            completed ? "text-muted-2 line-through" : "text-foreground",
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted">
          <span
            className={cn(
              "flex items-center gap-1",
              due.overdue && !completed && "font-medium text-(--badge-danger-fg)",
              due.today && !completed && "font-medium text-(--badge-amber-fg)",
            )}
          >
            <CalendarDays className="h-3 w-3" />
            {due.text}
          </span>
          {leadName ? (
            <Link
              href={`/leads/${task.lead!.id}`}
              className="flex items-center gap-1 transition-colors duration-[180ms] hover:text-primary"
            >
              <UserIcon className="h-3 w-3" />
              {leadName}
            </Link>
          ) : null}
        </div>
      </div>

      {!completed ? (
        <Badge variant={priorityVariant(task.priority)}>{PRIORITY_LABEL[task.priority] ?? task.priority}</Badge>
      ) : null}

      <button
        type="button"
        onClick={onDelete}
        aria-label="Eliminar tarea"
        className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted-2 transition-colors duration-[180ms] hover:bg-(--badge-danger-bg) hover:text-(--badge-danger-fg)"
      >
        <Trash2 className="h-4 w-4" strokeWidth={1.75} />
      </button>
    </li>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-[180ms] ease-out",
        active
          ? "border-primary/40 bg-primary-soft text-primary"
          : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
