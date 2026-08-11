/**
 * Servicio de Inmobiliaria (Tenant) — configuración de marca (logo, nombre, color)
 * y gestión del equipo (alta, baja y roles de usuarios con credenciales propias).
 */
import { TRPCError } from "@trpc/server";
import { writeAudit } from "@reos/db";
import { AuditAction, SubscriptionPlan, UserRole } from "@reos/core";
import { hashPassword, validatePasswordStrength } from "@reos/auth";
import type { ServiceCtx } from "./types";

/** Roles con privilegios elevados: solo un OWNER puede crearlos o asignarlos. */
const PRIVILEGED_ROLES: UserRole[] = [UserRole.OWNER, UserRole.ADMIN];

/** Cambia el plan de la inmobiliaria (habilita/inhabilita funciones Pro). */
export async function setPlan(ctx: ServiceCtx, plan: SubscriptionPlan) {
  const tenant = await ctx.prisma.tenant.update({
    where: { id: ctx.principal.tenantId },
    data: { plan },
    select: { id: true, name: true, plan: true },
  });
  await writeAudit(ctx.prisma, {
    tenantId: ctx.principal.tenantId,
    actorUserId: ctx.principal.userId,
    action: AuditAction.UPDATE,
    entityType: "Tenant",
    entityId: tenant.id,
    summary: `Plan cambiado a ${plan}`,
  });
  return tenant;
}

export async function getSettings(ctx: ServiceCtx) {
  const tenant = await ctx.prisma.tenant.findUnique({
    where: { id: ctx.principal.tenantId },
    select: { id: true, name: true, slug: true, plan: true, logoUrl: true, brandColor: true },
  });
  if (!tenant) throw new TRPCError({ code: "NOT_FOUND", message: "Inmobiliaria no encontrada." });
  return tenant;
}

export interface UpdateBrandingInput {
  name?: string;
  logoUrl?: string | null;
  brandColor?: string | null;
}

export async function updateBranding(ctx: ServiceCtx, input: UpdateBrandingInput) {
  const data = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.logoUrl !== undefined ? { logoUrl: input.logoUrl } : {}),
    ...(input.brandColor !== undefined ? { brandColor: input.brandColor } : {}),
  };

  const tenant = await ctx.prisma.tenant.update({
    where: { id: ctx.principal.tenantId },
    data,
    select: { id: true, name: true, slug: true, plan: true, logoUrl: true, brandColor: true },
  });

  await writeAudit(ctx.prisma, {
    tenantId: ctx.principal.tenantId,
    actorUserId: ctx.principal.userId,
    action: AuditAction.UPDATE,
    entityType: "Tenant",
    entityId: tenant.id,
    summary: `Marca actualizada (${Object.keys(data).join(", ")})`,
  });

  return tenant;
}

export async function listUsers(ctx: ServiceCtx) {
  return ctx.prisma.user.findMany({
    where: { tenantId: ctx.principal.tenantId },
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      lastActiveAt: true,
    },
  });
}

export interface CreateUserInput {
  email: string;
  firstName: string;
  lastName?: string;
  role: UserRole;
  password: string;
}

export async function createUser(ctx: ServiceCtx, input: CreateUserInput) {
  const email = input.email.trim().toLowerCase();

  // Anti-escalada: crear un OWNER o ADMIN requiere ser OWNER.
  if (PRIVILEGED_ROLES.includes(input.role) && ctx.principal.role !== UserRole.OWNER) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Solo el dueño de la cuenta puede crear usuarios con rol de administrador.",
    });
  }

  // Política de contraseña (defensa en profundidad, además de la validación del router).
  const weak = validatePasswordStrength(input.password);
  if (weak) {
    throw new TRPCError({ code: "BAD_REQUEST", message: weak });
  }

  const existing = await ctx.prisma.user.findUnique({
    where: { tenantId_email: { tenantId: ctx.principal.tenantId, email } },
  });
  if (existing) {
    throw new TRPCError({ code: "CONFLICT", message: "Ya existe un usuario con ese email." });
  }

  const branch = await ctx.prisma.branch.findFirst({
    where: { tenantId: ctx.principal.tenantId },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });

  const user = await ctx.prisma.user.create({
    data: {
      tenantId: ctx.principal.tenantId,
      email,
      firstName: input.firstName.trim(),
      lastName: input.lastName?.trim() || null,
      role: input.role,
      branchId: branch?.id ?? null,
      passwordHash: hashPassword(input.password),
      passwordChangedAt: new Date(),
    },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  await writeAudit(ctx.prisma, {
    tenantId: ctx.principal.tenantId,
    actorUserId: ctx.principal.userId,
    action: AuditAction.CREATE,
    entityType: "User",
    entityId: user.id,
    summary: `Usuario creado: ${user.email} (${user.role})`,
  });

  return user;
}

export async function setUserActive(ctx: ServiceCtx, userId: string, isActive: boolean) {
  if (userId === ctx.principal.userId) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "No podés desactivar tu propia cuenta." });
  }
  const target = await ctx.prisma.user.findUnique({ where: { id: userId }, select: { tenantId: true } });
  if (!target || target.tenantId !== ctx.principal.tenantId) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Usuario no encontrado." });
  }

  const user = await ctx.prisma.user.update({
    where: { id: userId },
    data: { isActive },
    select: { id: true, email: true, firstName: true, lastName: true, role: true, isActive: true },
  });

  await writeAudit(ctx.prisma, {
    tenantId: ctx.principal.tenantId,
    actorUserId: ctx.principal.userId,
    action: AuditAction.UPDATE,
    entityType: "User",
    entityId: user.id,
    summary: `Usuario ${isActive ? "reactivado" : "desactivado"}: ${user.email}`,
  });

  return user;
}
