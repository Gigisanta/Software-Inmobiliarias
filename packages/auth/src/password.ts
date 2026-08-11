/**
 * Hashing de contraseñas con scrypt (node:crypto). Server-only.
 *
 * Formato almacenado: `scrypt$<salt-hex>$<hash-hex>`.
 * Nunca se guarda la contraseña en texto plano; la comparación es de tiempo constante.
 */
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEYLEN = 64;
const PREFIX = "scrypt";

/** Longitud mínima y máxima de contraseña aceptada. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 200;

/**
 * Valida la fortaleza de una contraseña. Devuelve un mensaje de error si no
 * cumple la política, o null si es válida. Exige longitud mínima y una mezcla
 * de letras y números (equilibrio entre seguridad y usabilidad para el rubro).
 */
export function validatePasswordStrength(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `La contraseña no puede superar los ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contraseña debe combinar letras y números.";
  }
  return null;
}

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
