import { NextResponse } from "next/server";
import { prisma } from "@reos/db";
import { verifyPassword, createSessionToken } from "@reos/auth";
import { sessionCookie } from "@/lib/cookies";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
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

  // El email es único por tenant; puede haber homónimos en distintos tenants.
  const candidates = await prisma.user.findMany({ where: { email, isActive: true } });
  const user = candidates.find((u) => verifyPassword(password, u.passwordHash));

  if (!user) {
    // Mensaje genérico: no revelar si el email existe.
    return NextResponse.json({ error: "Email o contraseña incorrectos." }, { status: 401 });
  }

  await prisma.user.update({ where: { id: user.id }, data: { lastActiveAt: new Date() } });

  const token = createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", sessionCookie(token));
  return res;
}
