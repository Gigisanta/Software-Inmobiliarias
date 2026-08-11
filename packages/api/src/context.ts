/**
 * Contexto tRPC: resuelve el principal autenticado y expone Prisma.
 *
 * Dos fuentes de identidad:
 *  1. `principal` provisto por el caller (la app Next lo resuelve desde Clerk).
 *  2. Stub de demo: si DEV_AUTH=true (opt-in explícito) y no llega principal,
 *     se resuelve un usuario del tenant demo (rol elegible con `x-dev-role`).
 *     ATENCIÓN: con DEV_AUTH=true el deploy queda público sobre el tenant demo.
 *     Apagar (DEV_AUTH=false o quitar la variable) cuando haya datos reales.
 */
import { prisma } from "@reos/db";
import type { AuthPrincipal } from "@reos/auth";
import type { UserRole } from "@reos/core";

const DEMO_TENANT_SLUG = "inmobiliaria-demo";
const DEV_ROLE_EMAILS: Record<string, string> = {
  OWNER: "dueno@demo.com",
  MANAGER: "gerente@demo.com",
  ADVISOR: "asesor@demo.com",
};

export interface CreateContextOptions {
  headers: Headers;
  /** Principal ya resuelto por el caller (p. ej. desde Clerk). */
  principal?: AuthPrincipal | null;
}

export interface Context {
  prisma: typeof prisma;
  principal: AuthPrincipal | null;
}

async function resolveDevPrincipal(headers: Headers): Promise<AuthPrincipal | null> {
  // ⚠️ Backdoor de demo: da acceso sin sesión al tenant demo mediante headers.
  // Se blinda en tres niveles para que NUNCA pueda quedar activo con datos reales:
  //  1. Jamás en producción, sin importar cómo estén las demás variables.
  //  2. Se desactiva apenas Clerk está configurado.
  //  3. Exige opt-in explícito (DEV_AUTH=true).
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.CLERK_SECRET_KEY) return null;
  if (process.env.DEV_AUTH !== "true") return null;

  const roleHeader = (headers.get("x-dev-role") ?? "OWNER").toUpperCase();
  const email = headers.get("x-dev-email") ?? DEV_ROLE_EMAILS[roleHeader] ?? DEV_ROLE_EMAILS.OWNER!;

  const tenant = await prisma.tenant.findUnique({ where: { slug: DEMO_TENANT_SLUG } });
  if (!tenant) return null;

  const user = await prisma.user.findUnique({
    where: { tenantId_email: { tenantId: tenant.id, email } },
  });
  if (!user) return null;

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as UserRole,
    email: user.email,
    branchId: user.branchId,
    source: "dev-stub",
  };
}

export async function createTRPCContext(opts: CreateContextOptions): Promise<Context> {
  const principal = opts.principal ?? (await resolveDevPrincipal(opts.headers));
  return { prisma, principal };
}
