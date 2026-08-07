import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "reos_session";

/** Rutas públicas (marketing + login) que no requieren sesión. */
const PUBLIC_PREFIXES = ["/login", "/landing", "/presentacion", "/planes"];

/**
 * Protección de rutas: si no hay cookie de sesión, redirige a /login.
 *
 * Nota: acá solo se chequea la PRESENCIA de la cookie (chequeo barato en el edge).
 * La verificación criptográfica autoritativa ocurre en el contexto tRPC (Node).
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const hasSession = req.cookies.has(SESSION_COOKIE);

  const isPublic = PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  // Usuario ya logueado que visita /login → mandarlo al inicio.
  if (pathname === "/login" && hasSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  if (isPublic) return NextResponse.next();

  if (!hasSession) {
    const url = new URL("/login", req.url);
    if (pathname !== "/") url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a todo salvo assets estáticos y las rutas de API (que se protegen solas).
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
