import type { AuthPrincipal } from "@reos/auth";

/**
 * Resuelve el principal desde Clerk.
 *
 * En este incremento devuelve `null` (el contexto cae al stub de desarrollo).
 * El cableado completo de Clerk — middleware, sincronización de usuarios/organizaciones
 * por webhook y mapeo clerkUserId/clerkOrgId → User/Tenant — es la próxima tarea de auth.
 */
export async function resolveClerkPrincipal(_req: Request): Promise<AuthPrincipal | null> {
  if (!process.env.CLERK_SECRET_KEY) return null;
  // TODO(auth): const { userId, orgId } = await auth();  → mapear a User/Tenant.
  return null;
}
