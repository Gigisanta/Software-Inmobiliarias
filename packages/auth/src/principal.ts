/**
 * Principal autenticado: la identidad resuelta para cada request.
 * Se construye en la creación del contexto tRPC a partir de Clerk (o del stub de dev).
 */
import type { UserRole } from "@reos/core";

export interface AuthPrincipal {
  userId: string;
  tenantId: string;
  role: UserRole;
  email: string;
  branchId: string | null;
  /** Fuente de la identidad, para debugging. */
  source: "clerk" | "dev-stub";
}
