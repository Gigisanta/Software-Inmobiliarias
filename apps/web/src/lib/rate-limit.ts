/**
 * Limitador de tasa en memoria (ventana fija). Server-only.
 *
 * Primera línea de defensa contra fuerza bruta y abuso, por IP/clave. En un
 * despliegue con varias instancias no es global (cada instancia tiene su mapa),
 * por eso se combina con el bloqueo de cuenta persistido en la base (que sí es
 * consistente entre instancias). Para un límite distribuido estricto conviene
 * un store compartido (Redis/Upstash).
 */

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Limpieza perezosa: si el mapa crece demasiado, se purgan las entradas vencidas.
const MAX_BUCKETS = 10_000;

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Consume un intento para `key`. Permite hasta `limit` intentos por ventana de
 * `windowSeconds`. Devuelve si se permite y cuánto falta para reintentar.
 */
export function rateLimit(key: string, limit: number, windowSeconds: number): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt <= now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { allowed: true, remaining: limit - bucket.count, retryAfterSeconds: 0 };
}

/** Reinicia el contador de una clave (p. ej. tras un login exitoso). */
export function resetRateLimit(key: string): void {
  buckets.delete(key);
}

/** Extrae la IP del cliente de las cabeceras habituales de proxy (Vercel). */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "desconocida";
}
