/**
 * Utilidades para tests de servicios: un mock ligero de Prisma y constructores de
 * principals. Permite testear la lógica de autorización y aislamiento por tenant
 * sin una base de datos real.
 */
import { vi, type Mock } from "vitest";
import { UserRole } from "@reos/core";
import type { AuthPrincipal } from "@reos/auth";
import type { PrismaClient } from "@reos/db";
import type { ServiceCtx } from "./types";

/** Principal de dueño (ve todo el tenant). */
export function ownerPrincipal(tenantId = "tenant-A", userId = "owner-1"): AuthPrincipal {
  return { userId, tenantId, role: UserRole.OWNER, email: "owner@a.com", branchId: null, source: "session" };
}

/** Principal de asesor (solo ve lo propio). */
export function advisorPrincipal(tenantId = "tenant-A", userId = "advisor-1"): AuthPrincipal {
  return { userId, tenantId, role: UserRole.ADVISOR, email: "advisor@a.com", branchId: null, source: "session" };
}

/** Métodos de un modelo Prisma expuestos como mocks de Vitest. */
interface MockedModel {
  findUnique: Mock;
  findMany: Mock;
  findFirst: Mock;
  count: Mock;
  create: Mock;
  update: Mock;
  delete: Mock;
}

type ModelName = "lead" | "user" | "task" | "appointment" | "conversation" | "message";

/** Mock de Prisma tipado para configurar respuestas y hacer aserciones. */
export type MockPrisma = Record<ModelName, MockedModel> & { $transaction: Mock };

function mockedModel(): MockedModel {
  return {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
}

/**
 * Construye el mock de Prisma. `$transaction` ejecuta el callback pasándole el
 * mismo mock (sirve para caminos felices simples).
 */
export function makePrismaMock(): MockPrisma {
  const prisma = {
    lead: mockedModel(),
    user: mockedModel(),
    task: mockedModel(),
    appointment: mockedModel(),
    conversation: mockedModel(),
    message: mockedModel(),
  } as MockPrisma;
  prisma.$transaction = vi.fn(async (arg: unknown) =>
    typeof arg === "function" ? (arg as (tx: unknown) => unknown)(prisma) : arg,
  );
  return prisma;
}

/**
 * Crea el contexto de servicio y su mock de Prisma. `ctx` se pasa a los servicios;
 * `prisma` se usa para configurar respuestas (`mockResolvedValue`) y aserciones
 * (`mock.calls`).
 */
export function makeCtx(principal: AuthPrincipal): { ctx: ServiceCtx; prisma: MockPrisma } {
  const prisma = makePrismaMock();
  const ctx: ServiceCtx = { principal, prisma: prisma as unknown as PrismaClient };
  return { ctx, prisma };
}
