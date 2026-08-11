"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Plus } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { LeadChannel, OperationType } from "@reos/core";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input, Textarea, Field } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const CHANNEL_LABEL: Record<string, string> = {
  WHATSAPP: "WhatsApp",
  LANDING: "Landing",
  PORTAL: "Portal",
  LLAMADA: "Llamada",
  REFERIDO: "Referido",
  MANUAL: "Manual",
  OTRO: "Otro",
};

const OPERATION_LABEL: Record<string, string> = {
  COMPRA: "Compra",
  VENTA: "Venta",
  ALQUILER: "Alquiler",
  ALQUILER_TEMPORAL: "Alquiler temporal",
};

type NewLeadForm = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  channel: string;
  operationType: string;
  budgetMin: string;
  budgetMax: string;
  notes: string;
};

const EMPTY_FORM: NewLeadForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  channel: LeadChannel.MANUAL,
  operationType: OperationType.COMPRA,
  budgetMin: "",
  budgetMax: "",
  notes: "",
};

export function NewLeadModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const [form, setForm] = useState<NewLeadForm>(EMPTY_FORM);
  const [error, setError] = useState<string | null>(null);

  const createLead = useMutation(
    trpc.lead.create.mutationOptions({
      onSuccess: () => {
        setForm(EMPTY_FORM);
        onCreated();
      },
      onError: (err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "No pudimos crear el lead. Revisá los datos e intentá de nuevo.",
        );
      },
    }),
  );

  const update = <K extends keyof NewLeadForm>(key: K, value: NewLeadForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const parsedMin = form.budgetMin.trim() === "" ? undefined : Number(form.budgetMin);
  const parsedMax = form.budgetMax.trim() === "" ? undefined : Number(form.budgetMax);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const firstName = form.firstName.trim();
    if (!firstName) {
      setError("El nombre es obligatorio.");
      return;
    }
    if (parsedMin != null && Number.isNaN(parsedMin)) {
      setError("El presupuesto mínimo debe ser un número.");
      return;
    }
    if (parsedMax != null && Number.isNaN(parsedMax)) {
      setError("El presupuesto máximo debe ser un número.");
      return;
    }

    createLead.mutate({
      firstName,
      lastName: form.lastName.trim() || undefined,
      phone: form.phone.trim() || undefined,
      email: form.email.trim() || undefined,
      channel: form.channel as LeadChannel,
      operationType: form.operationType as OperationType,
      budgetMin: parsedMin,
      budgetMax: parsedMax,
      notes: form.notes.trim() || undefined,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo cliente"
      description="Cargá los datos básicos. Podés completar el resto más tarde."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre" required>
            <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} placeholder="Juan" autoFocus />
          </Field>
          <Field label="Apellido">
            <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} placeholder="Pérez" />
          </Field>
          <Field label="Teléfono">
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+54 9 299…" inputMode="tel" />
          </Field>
          <Field label="Email">
            <Input value={form.email} onChange={(e) => update("email", e.target.value)} placeholder="juan@email.com" inputMode="email" />
          </Field>
        </div>

        <Field label="Canal">
          <ChipGroup options={Object.values(LeadChannel)} value={form.channel} labels={CHANNEL_LABEL} onChange={(v) => update("channel", v)} />
        </Field>

        <Field label="Operación">
          <ChipGroup options={Object.values(OperationType)} value={form.operationType} labels={OPERATION_LABEL} onChange={(v) => update("operationType", v)} />
        </Field>

        <div className="grid grid-cols-2 gap-5">
          <Field label="Presupuesto mín.">
            <Input value={form.budgetMin} onChange={(e) => update("budgetMin", e.target.value)} placeholder="0" inputMode="numeric" />
          </Field>
          <Field label="Presupuesto máx.">
            <Input value={form.budgetMax} onChange={(e) => update("budgetMax", e.target.value)} placeholder="0" inputMode="numeric" />
          </Field>
        </div>

        <Field label="Notas">
          <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} rows={3} placeholder="Contexto, preferencias, cómo llegó…" />
        </Field>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">{error}</p>
        ) : null}

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={onClose} disabled={createLead.isPending}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createLead.isPending}>
            {createLead.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando…
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Crear cliente
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function ChipGroup({
  options,
  value,
  labels,
  onChange,
}: {
  options: readonly string[];
  value: string;
  labels: Record<string, string>;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={cn(
            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-[180ms] ease-out",
            value === option
              ? "border-primary/40 bg-primary-soft text-primary"
              : "border-border bg-surface text-muted hover:border-border-strong hover:text-foreground",
          )}
        >
          {labels[option] ?? option}
        </button>
      ))}
    </div>
  );
}
