"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ImagePlus, Loader2, Check, Plus, UserPlus, Shield, Sparkles } from "lucide-react";

import { useTRPC } from "@/trpc/client";
import { UserRole } from "@reos/core";

import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field, Select } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { FadeIn } from "@/components/ui/motion";
import { cn, initials } from "@/lib/utils";

const MAX_LOGO_BYTES = 380 * 1024; // ~380KB → ~500KB en base64.

const ROLE_LABEL: Record<string, string> = {
  OWNER: "Dueño",
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  ADVISOR: "Asesor",
};

export default function ConfiguracionPage() {
  const trpc = useTRPC();
  const me = useQuery(trpc.health.me.queryOptions());
  const role = me.data?.user?.role;
  const canManageTeam = role === "OWNER" || role === "ADMIN";

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader
        title="Configuración"
        subtitle="La identidad de tu inmobiliaria y tu equipo de trabajo"
      />

      <div className="flex flex-col gap-6">
        <FadeIn>
          <BrandingCard />
        </FadeIn>
        {canManageTeam ? (
          <FadeIn delay={0.05}>
            <PlanCard />
          </FadeIn>
        ) : null}
        {canManageTeam ? (
          <FadeIn delay={0.1}>
            <TeamCard />
          </FadeIn>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Marca                                                               */
/* ------------------------------------------------------------------ */

function BrandingCard() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const settings = useQuery(trpc.tenant.settings.queryOptions());
  const fileRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState("#6B8E7A");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings.data) {
      setName(settings.data.name);
      setLogoUrl(settings.data.logoUrl ?? null);
      setBrandColor(settings.data.brandColor ?? "#6B8E7A");
    }
  }, [settings.data]);

  const save = useMutation(
    trpc.tenant.updateBranding.mutationOptions({
      onSuccess: () => {
        setSaved(true);
        setError(null);
        qc.invalidateQueries();
        setTimeout(() => setSaved(false), 2000);
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : "No pudimos guardar los cambios.");
      },
    }),
  );

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("El archivo debe ser una imagen (PNG, JPG o SVG).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("La imagen es muy pesada. Usá una de menos de 380 KB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoUrl(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("El nombre de la inmobiliaria no puede estar vacío.");
      return;
    }
    save.mutate({ name: trimmed, logoUrl, brandColor });
  }

  if (settings.isLoading) {
    return <Skeleton className="h-72 rounded-2xl" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tu marca</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {/* Logo */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
            ) : (
              <Building2 className="h-7 w-7 text-muted-2" strokeWidth={1.5} />
            )}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-sm font-medium text-foreground">Logo de la inmobiliaria</p>
            <p className="text-xs text-muted">PNG, JPG o SVG · hasta 380 KB. Se ve en la barra lateral.</p>
            <div className="mt-1 flex items-center gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={onPickFile}
                className="hidden"
              />
              <Button variant="secondary" size="sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-4 w-4" />
                {logoUrl ? "Cambiar logo" : "Subir logo"}
              </Button>
              {logoUrl ? (
                <Button variant="ghost" size="sm" onClick={() => setLogoUrl(null)}>
                  Quitar
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre de la inmobiliaria" required>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Inmobiliaria…" />
          </Field>
          <Field label="Color de la marca">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-surface p-1"
                aria-label="Elegir color de marca"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                placeholder="#6B8E7A"
                className="font-mono"
              />
            </div>
          </Field>
        </div>

        {error ? (
          <p className="rounded-xl bg-(--badge-danger-bg) px-3.5 py-2.5 text-xs text-(--badge-danger-fg)">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-end gap-3">
          {saved ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-(--badge-sage-fg)">
              <Check className="h-4 w-4" /> Guardado
            </span>
          ) : null}
          <Button onClick={handleSave} disabled={save.isPending}>
            {save.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Guardando…
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Plan                                                                */
/* ------------------------------------------------------------------ */

function PlanCard() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const me = useQuery(trpc.health.me.queryOptions());
  const plan = me.data?.tenant?.plan ?? "STARTER";
  const isPro = plan !== "STARTER";

  const setPlan = useMutation(
    trpc.tenant.setPlan.mutationOptions({ onSuccess: () => qc.invalidateQueries() }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan y funciones de IA</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-xl",
                isPro ? "bg-primary-soft text-primary" : "bg-surface-2 text-muted",
              )}
            >
              <Sparkles className="h-4 w-4" />
            </span>
            <div>
              <p className="text-sm font-medium text-foreground">
                Plan actual: {isPro ? "Pro" : "Básico"}
              </p>
              <p className="text-xs text-muted">
                {isPro
                  ? "Conversaciones con IA, clasificación automática y seguimientos activos."
                  : "Activá la vista previa del Pro para probar la IA en tu propia inmobiliaria."}
              </p>
            </div>
          </div>
          <Button
            variant={isPro ? "secondary" : "primary"}
            disabled={setPlan.isPending}
            onClick={() => setPlan.mutate({ plan: isPro ? "STARTER" : "PRO" })}
          >
            {setPlan.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Cambiando…
              </>
            ) : isPro ? (
              "Volver a Básico"
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Activar vista previa Pro
              </>
            )}
          </Button>
        </div>
        <p className="rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
          Vista previa para la demo. La facturación real del plan Pro se coordina aparte.
        </p>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Equipo                                                              */
/* ------------------------------------------------------------------ */

function TeamCard() {
  const trpc = useTRPC();
  const qc = useQueryClient();
  const users = useQuery(trpc.tenant.listUsers.queryOptions());
  const me = useQuery(trpc.health.me.queryOptions());
  const [modalOpen, setModalOpen] = useState(false);

  const setActive = useMutation(
    trpc.tenant.setUserActive.mutationOptions({
      onSuccess: () => qc.invalidateQueries(),
    }),
  );

  const list = users.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <CardTitle>Tu equipo</CardTitle>
        <Button size="sm" onClick={() => setModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Agregar usuario
        </Button>
      </CardHeader>
      <CardContent>
        {users.isLoading ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <Skeleton key={i} className="h-14 rounded-xl" />
            ))}
          </div>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {list.map((u) => {
              const fullName = `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || u.email;
              const isSelf = u.id === me.data?.user?.id;
              return (
                <li key={u.id} className="flex items-center justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar initials={initials(u.firstName, u.lastName)} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {fullName}
                        {isSelf ? <span className="text-muted-2"> (vos)</span> : null}
                      </p>
                      <p className="truncate text-xs text-muted">{u.email}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge variant={u.isActive ? "sage" : "neutral"}>
                      {ROLE_LABEL[u.role] ?? u.role}
                    </Badge>
                    {!isSelf ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={setActive.isPending}
                        onClick={() => setActive.mutate({ userId: u.id, isActive: !u.isActive })}
                      >
                        {u.isActive ? "Desactivar" : "Reactivar"}
                      </Button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>

      <AddUserModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={() => {
          setModalOpen(false);
          qc.invalidateQueries();
        }}
      />
    </Card>
  );
}

function AddUserModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const trpc = useTRPC();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roleValue, setRoleValue] = useState<string>(UserRole.ADVISOR);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const create = useMutation(
    trpc.tenant.createUser.mutationOptions({
      onSuccess: () => {
        setFirstName("");
        setLastName("");
        setEmail("");
        setPassword("");
        setRoleValue(UserRole.ADVISOR);
        onCreated();
      },
      onError: (err: unknown) => {
        setError(err instanceof Error ? err.message : "No pudimos crear el usuario.");
      },
    }),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!firstName.trim()) return setError("El nombre es obligatorio.");
    if (!email.trim()) return setError("El email es obligatorio.");
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres.");
    create.mutate({
      firstName: firstName.trim(),
      lastName: lastName.trim() || undefined,
      email: email.trim(),
      role: roleValue as UserRole,
      password,
    });
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Agregar usuario"
      description="Creá una cuenta para un integrante de tu equipo con su propia contraseña."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Nombre" required>
            <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Nombre" autoFocus />
          </Field>
          <Field label="Apellido">
            <Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Apellido" />
          </Field>
        </div>
        <Field label="Email" required>
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="persona@inmobiliaria.com" inputMode="email" />
        </Field>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Rol" required>
            <Select
              value={roleValue}
              onValueChange={setRoleValue}
              options={[
                { value: UserRole.ADVISOR, label: "Asesor" },
                { value: UserRole.MANAGER, label: "Gerente" },
                { value: UserRole.ADMIN, label: "Administrador" },
              ]}
            />
          </Field>
          <Field label="Contraseña inicial" required>
            <Input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
            />
          </Field>
        </div>

        <p className="flex items-start gap-2 rounded-xl bg-surface-2 px-3.5 py-2.5 text-xs text-muted">
          <Shield className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Compartile esta contraseña a la persona. Va a poder ingresar con su email y cambiarla más adelante.
        </p>

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
                <Plus className="h-4 w-4" /> Crear usuario
              </>
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
