/**
 * Sesiones firmadas (HMAC-SHA256). Server-only.
 *
 * El token es `<payload-base64url>.<firma-base64url>`. El payload solo lleva el
 * userId y la expiración; el tenant/rol se recargan desde la base en cada request
 * (fuente de verdad), de modo que un cambio de rol o baja de usuario impacta al toque.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

/** Nombre de la cookie de sesión. */
export const SESSION_COOKIE = "reos_session";

/** Duración por defecto de la sesión: 7 días (equilibra comodidad y exposición). */
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;

export interface SessionPayload {
  uid: string;
  exp: number;
  /**
   * Época de la contraseña (epoch en segundos de `passwordChangedAt`). Permite
   * revocar todas las sesiones previas al cambiar la contraseña: si no coincide
   * con la de la base, el token se considera inválido.
   */
  pca?: number;
}

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "SESSION_SECRET no configurado o demasiado corto (mínimo 16 caracteres).",
    );
  }
  return secret;
}

function sign(body: string): string {
  return createHmac("sha256", getSecret()).update(body).digest("base64url");
}

export interface CreateSessionOptions {
  ttlSeconds?: number;
  /** Marca del último cambio de contraseña, para atar la sesión a esa época. */
  passwordChangedAt?: Date | null;
}

/** Crea un token de sesión firmado para un userId. */
export function createSessionToken(uid: string, options: CreateSessionOptions = {}): string {
  const ttlSeconds = options.ttlSeconds ?? SESSION_TTL_SECONDS;
  const payload: SessionPayload = {
    uid,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    ...(options.passwordChangedAt
      ? { pca: Math.floor(options.passwordChangedAt.getTime() / 1000) }
      : {}),
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Verifica y decodifica un token de sesión; null si es inválido o expiró. */
export function verifySessionToken(token: string | null | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.indexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body);

  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString()) as SessionPayload;
    if (!payload || typeof payload.uid !== "string" || typeof payload.exp !== "number") return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
