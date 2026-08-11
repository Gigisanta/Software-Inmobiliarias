import type { AuthPrincipal } from "@reos/auth";
import { verifySessionToken, SESSION_COOKIE } from "@reos/auth";
import type { UserRole } from "@reos/core";
import { prisma } from "@reos/db";

/** Lee el valor de una cookie desde el header `Cookie`. */
function readCookie(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

/**
 * Resuelve el principal autenticado desde la cookie de sesión firmada.
 *
 * El token solo contiene el userId; el tenant y el rol se recargan de la base
 * (fuente de verdad). Devuelve null si no hay sesión válida o el usuario está inactivo.
 */
export async function resolveSessionPrincipal(req: Request): Promise<AuthPrincipal | null> {
  const token = readCookie(req.headers.get("cookie"), SESSION_COOKIE);
  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.uid } });
  if (!user || !user.isActive) return null;

  // Invalidación por cambio de contraseña: si el usuario cambió su clave después
  // de emitido el token, la época no coincide y la sesión se considera revocada.
  if (user.passwordChangedAt) {
    const currentPca = Math.floor(user.passwordChangedAt.getTime() / 1000);
    if (payload.pca !== currentPca) return null;
  }

  return {
    userId: user.id,
    tenantId: user.tenantId,
    role: user.role as UserRole,
    email: user.email,
    branchId: user.branchId,
    source: "session",
  };
}
