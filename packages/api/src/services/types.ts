import type { PrismaClient } from "@reos/db";
import type { AuthPrincipal } from "@reos/auth";

/** Dependencias que reciben los servicios de dominio. */
export interface ServiceCtx {
  prisma: PrismaClient;
  principal: AuthPrincipal;
}
