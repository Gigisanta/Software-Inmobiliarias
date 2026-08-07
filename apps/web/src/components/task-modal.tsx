"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { Priority } from "@reos/core";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Field, Select } from "@/components/ui/input";

/** Modal de alta de tarea. Reutilizable desde /tareas y desde la ficha del lead. */
export function TaskModal({
  open,
  onClose,
  onCreated,
  presetLeadId,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  presetLeadId?: string;
}) {
  const trpc = useTRPC();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<string>(Priority.MEDIA);
  const [dueAt, setDueAt] = useState("");
  const [leadId, setLeadId] = useState<string>(presetLeadId ?? "");
  const [error, setError] = useState<string | null>(null);

  const leads = useQuery(trpc.lead.list.queryOptions({ pageSize: 100 }));
  const leadOptions = (leads.data?.items ?? []).map((l) => ({
    value: l.id,
    label: `${l.firstName}${l.lastName ? ` ${l.lastName}` : ""}`,
  }));

  const create = useMutation(
    trpc.task.create.mutationOptions({
      onSuccess: () => {
        setTitle("");
        setDescription("");
        setPriority(Priority.MEDIA);
        setDueAt("");
        setLeadId(presetLeadId ?? "");
        onCreated();
      },
      onError: (err: unknown) =>
        setError(err instanceof Error ? err.message : "No pudimos crear la tarea."),
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) return setError("El título es obligatorio.");
    create.mutate({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority as Priority,
      dueAt: dueAt ? new Date(dueAt) : null,
      leadId: leadId || null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva tarea" description="Una acción concreta que hace avanzar una operación.">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <Field label="¿Qué hay que hacer?" required>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Llamar a…, enviar documentación de…"
            autoFocus
          />
        </Field>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Prioridad">
            <Select
              value={priority}
              onValueChange={setPriority}
              options={[
                { value: Priority.BAJA, label: "Baja" },
                { value: Priority.MEDIA, label: "Media" },
                { value: Priority.ALTA, label: "Alta" },
                { value: Priority.URGENTE, label: "Urgente" },
              ]}
            />
          </Field>
          <Field label="Vence">
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </Field>
        </div>

        {!presetLeadId ? (
          <Field label="Lead relacionado (opcional)">
            <Select value={leadId} onValueChange={setLeadId} placeholder="Sin lead" options={leadOptions} />
          </Field>
        ) : null}

        <Field label="Notas (opcional)">
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Detalle o contexto…"
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Creando…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Crear tarea
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
