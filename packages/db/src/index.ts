import { PrismaClient, Prisma } from "@prisma/client";
import type { DomainEventEnvelope } from "@reos/core";
import type { AuditAction } from "@reos/core";

/**
 * Cliente Prisma como singleton (evita múltiples instancias en hot-reload de dev).
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    // Neon (pooler) suma latencia por query; las transacciones interactivas
    // con varias escrituras (lead + historial + outbox + auditoría) superan
    // el timeout por defecto de 5 s.
    transactionOptions: { maxWait: 10_000, timeout: 30_000 },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export { Prisma, PrismaClient };
export type { PrismaClient as PrismaClientType };

/** Cliente utilizable tanto directo como dentro de una transacción. */
export type PrismaTx = Prisma.TransactionClient | PrismaClient;

/**
 * Persiste un evento de dominio en el outbox.
 * DEBE llamarse dentro de la misma transacción que el cambio de estado que lo origina,
 * para garantizar atomicidad (transactional outbox). Un worker lo relaya luego.
 */
export async function emitEvent(tx: PrismaTx, envelope: DomainEventEnvelope): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      tenantId: envelope.tenantId,
      type: envelope.type,
      aggregateType: envelope.aggregateType,
      aggregateId: envelope.aggregateId,
      payload: envelope.payload as Prisma.InputJsonValue,
      actorUserId: envelope.actorUserId ?? null,
    },
  });
}

export interface AuditInput {
  tenantId: string;
  actorUserId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId: string;
  summary?: string;
  diff?: Prisma.InputJsonValue;
}

/** Registra una acción en el log de auditoría (inmutable). */
export async function writeAudit(tx: PrismaTx, input: AuditInput): Promise<void> {
  await tx.auditLog.create({
    data: {
      tenantId: input.tenantId,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      diff: input.diff,
    },
  });
}
