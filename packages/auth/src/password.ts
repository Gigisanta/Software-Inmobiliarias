/**
 * Hashing de contraseñas con scrypt (node:crypto). Server-only.
 *
 * Formato almacenado: `scrypt$<salt-hex>$<hash-hex>`.
 * Nunca se guarda la contraseña en texto plano; la comparación es de tiempo constante.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const PREFIX = "scrypt";

/** Genera un hash salado para almacenar. */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEYLEN).toString("hex");
  return `${PREFIX}$${salt}$${derived}`;
}

/** Verifica una contraseña contra un hash almacenado (tiempo constante). */
export function verifyPassword(password: string, stored: string | null | undefined): boolean {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== PREFIX) return false;
  const [, salt, hashHex] = parts;
  if (!salt || !hashHex) return false;

  const derived = scryptSync(password, salt, KEYLEN);
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(expected, derived);
}
