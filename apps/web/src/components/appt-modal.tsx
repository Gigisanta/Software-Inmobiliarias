"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@reos/api";
import { Loader2, Plus } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { AppointmentType } from "@reos/core";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Field, Select } from "@/components/ui/input";

type RouterOutputs = inferRouterOutputs<AppRouter>;
export type Appt = RouterOutputs["appointment"]["list"][number];

/** Convierte a "YYYY-MM-DDTHH:mm" en horario local para <input datetime-local>. */
function toLocalInput(d: Date): string {
  const date = new Date(d);
  const off = date.getTimezoneOffset();
  return new Date(date.getTime() - off * 60_000).toISOString().slice(0, 16);
}

/** Modal de alta/edición de evento de agenda. Reutilizable desde /agenda y la ficha. */
export function ApptModal({
  open,
  editing,
  onClose,
  onSaved,
  presetLeadId,
}: {
  open: boolean;
  editing: Appt | null;
  onClose: () => void;
  onSaved: () => void;
  presetLeadId?: string;
}) {
  const trpc = useTRPC();
  const [type, setType] = useState<string>(editing?.type ?? AppointmentType.VISITA);
  const [scheduledAt, setScheduledAt] = useState<string>(
    editing ? toLocalInput(new Date(editing.scheduledAt)) : "",
  );
  const [duration, setDuration] = useState<string>(String(editing?.durationMinutes ?? 45));
  const [leadId, setLeadId] = useState<string>(editing?.lead?.id ?? presetLeadId ?? "");
  const [notes, setNotes] = useState<string>(editing?.notes ?? "");
  const [error, setError] = useState<string | null>(null);

  // Re-sincroniza el formulario cuando cambia el evento a editar.
  const editingKey = editing?.id ?? "new";
  const [lastKey, setLastKey] = useState(editingKey);
  if (lastKey !== editingKey) {
    setLastKey(editingKey);
    setType(editing?.type ?? AppointmentType.VISITA);
    setScheduledAt(editing ? toLocalInput(new Date(editing.scheduledAt)) : "");
    setDuration(String(editing?.durationMinutes ?? 45));
    setLeadId(editing?.lead?.id ?? presetLeadId ?? "");
    setNotes(editing?.notes ?? "");
    setError(null);
  }

  const leads = useQuery(trpc.lead.list.queryOptions({ pageSize: 100 }));
  const leadOptions = (leads.data?.items ?? []).map((l) => ({
    value: l.id,
    label: `${l.firstName}${l.lastName ? ` ${l.lastName}` : ""}`,
  }));

  function onErr(err: unknown) {
    setError(err instanceof Error ? err.message : "No pudimos guardar el evento.");
  }

  const create = useMutation(trpc.appointment.create.mutationOptions({ onSuccess: onSaved, onError: onErr }));
  const update = useMutation(trpc.appointment.update.mutationOptions({ onSuccess: onSaved, onError: onErr }));
  const pending = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!scheduledAt) return setError("Elegí fecha y horario.");
    const durationMinutes = Number(duration) || 30;
    const when = new Date(scheduledAt);

    if (editing) {
      update.mutate({
        id: editing.id,
        patch: {
          type: type as AppointmentType,
          scheduledAt: when,
          durationMinutes,
          leadId: leadId || null,
          notes: notes.trim() || null,
        },
      });
    } else {
      create.mutate({
        type: type as AppointmentType,
        scheduledAt: when,
        durationMinutes,
        leadId: leadId || null,
        notes: notes.trim() || null,
      });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar evento" : "Nueva visita"}
      description="Coordiná una visita, llamada o reunión con un lead."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Tipo">
            <Select
              value={type}
              onValueChange={setType}
              options={[
                { value: AppointmentType.VISITA, label: "Visita" },
                { value: AppointmentType.LLAMADA, label: "Llamada" },
                { value: AppointmentType.REUNION, label: "Reunión" },
              ]}
            />
          </Field>
          <Field label="Duración (min)">
            <Input
              type="number"
              min={5}
              step={5}
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Fecha y horario" required>
          <Input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
        </Field>

        <Field label="Lead (opcional)">
          <Select value={leadId} onValueChange={setLeadId} placeholder="Sin lead" options={leadOptions} />
        </Field>

        <Field label="Notas (opcional)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Dirección, punto de encuentro, referencias…"
          />
        </Field>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
              </>
            ) : editing ? (
              "Guardar"
            ) : (
              <>
                <Plus className="h-4 w-4" /> Agendar
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
