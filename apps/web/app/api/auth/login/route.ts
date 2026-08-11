import { NextResponse } from "next/server";
import { prisma, writeAudit } from "@reos/db";
import { AuditAction } from "@reos/core";
import { verifyPassword, createSessionToken } from "@reos/auth";
import { sessionCookie } from "@/lib/cookies";
import { rateLimit, resetRateLimit, clientIp } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Límite de longitud de contraseña: scrypt es costoso y síncrono; una entrada
// gigante podría degradar el servidor (DoS). bcrypt/PHC rondan estos valores.
const MAX_PASSWORD_LENGTH = 200;

// Bloqueo de cuenta: tras este número de fallos consecutivos, la cuenta queda
// bloqueada por un lapso corto. Frena la fuerza bruta sin depender de la IP.
const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// Rate limit por IP (primera línea, en memoria): tope de intentos por ventana.
const IP_LIMIT = 10;
const IP_WINDOW_SECONDS = 60;

const GENERIC_ERROR = "Email o contraseña incorrectos.";

export async function POST(req: Request) {
  // 1) Freno por IP antes de tocar la base o hashear nada.
  const ip = clientIp(req);
  const ipLimit = rateLimit(`login:${ip}`, IP_LIMIT, IP_WINDOW_SECONDS);
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429, headers: { "Retry-After": String(ipLimit.retryAfterSeconds) } },
    );
  }

  let body: { email?: unknown; password?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!EMAIL_RE.test(email) || password.length < 1) {
    return NextResponse.json({ error: "Ingresá un email y contraseña válidos." }, { status: 400 });
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  const now = new Date();

  // El email es único por tenant; puede haber homónimos en distintos tenants.
  const candidates = await prisma.user.findMany({ where: { email, isActive: true } });

  // Si TODAS las cuentas con ese email están bloqueadas, no seguimos.
  const anyUnlocked = candidates.some((u) => !u.lockedUntil || u.lockedUntil <= now);
  if (candidates.length > 0 && !anyUnlocked) {
    return NextResponse.json(
      { error: "Cuenta bloqueada temporalmente por intentos fallidos. Esperá unos minutos." },
      { status: 429 },
    );
  }

  // Solo se consideran cuentas no bloqueadas para la verificación.
  const usable = candidates.filter((u) => !u.lockedUntil || u.lockedUntil <= now);
  const user = usable.find((u) => verifyPassword(password, u.passwordHash));

  if (!user) {
    // Fallo: se registra en cada candidata no bloqueada y se bloquea al superar el umbral.
    await Promise.all(
      usable.map((u) => {
        const attempts = u.failedLoginAttempts + 1;
        const locked = attempts >= MAX_FAILED_ATTEMPTS;
        return prisma.user.update({
          where: { id: u.id },
          data: {
            failedLoginAttempts: locked ? 0 : attempts,
            lockedUntil: locked ? new Date(now.getTime() + LOCK_MINUTES * 60_000) : u.lockedUntil,
          },
        });
      }),
    );
    // Mensaje genérico: no revelar si el email existe.
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 401 });
  }

  // Éxito: se reinician los contadores y se registra la actividad.
  await prisma.user.update({
    where: { id: user.id },
    data: { lastActiveAt: now, failedLoginAttempts: 0, lockedUntil: null },
  });
  resetRateLimit(`login:${ip}`);

  await writeAudit(prisma, {
    tenantId: user.tenantId,
    actorUserId: user.id,
    action: AuditAction.LOGIN,
    entityType: "User",
    entityId: user.id,
    summary: `Inicio de sesión (${ip})`,
  });

  const token = createSessionToken(user.id, { passwordChangedAt: user.passwordChangedAt });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
