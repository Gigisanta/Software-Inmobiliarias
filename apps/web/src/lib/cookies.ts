import { SESSION_COOKIE, SESSION_TTL_SECONDS } from "@reos/auth";

/** Arma el header Set-Cookie para la sesión (httpOnly, SameSite=Lax). */
export function sessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=${SESSION_TTL_SECONDS}`;
}

/** Header Set-Cookie que borra la sesión. */
export function clearSessionCookie(): string {
  const secure = process.env.NODE_ENV === "production" ? " Secure;" : "";
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax;${secure} Max-Age=0`;
}
