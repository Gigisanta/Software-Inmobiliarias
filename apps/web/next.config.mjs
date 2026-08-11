import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Política de seguridad de contenido (CSP).
 *
 * Endurecida para una app de datos sensibles. Next/React inyectan estilos y
 * algunos scripts inline de hidratación, por eso 'unsafe-inline' en style/script.
 * `frame-ancestors 'none'` bloquea el clickjacking; `img-src data:` permite el
 * logo del tenant embebido como data URL; `connect-src 'self'` limita las
 * llamadas del cliente al propio origen (la API de IA se llama server-side).
 */
const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  "script-src 'self' 'unsafe-inline'" + (process.env.NODE_ENV !== "production" ? " 'unsafe-eval'" : ""),
  "connect-src 'self'",
  "upgrade-insecure-requests",
].join("; ");

/** Cabeceras de seguridad aplicadas a todas las respuestas. */
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Oculta la cabecera `X-Powered-By: Next.js` (reduce huella para fingerprinting).
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Los paquetes del monorepo se consumen como código TS y Next los transpila.
  transpilePackages: ["@reos/api", "@reos/auth", "@reos/core", "@reos/db"],
  // Prisma no debe ser empaquetado por Next: se resuelve como dependencia externa.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
  // Raíz del monorepo para el file tracing: sin esto, el binario del query
  // engine de Prisma (node_modules/.pnpm/…/.prisma/client) queda fuera del
  // bundle de las funciones serverless en Vercel.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  outputFileTracingIncludes: {
    "/api/trpc/[trpc]": ["../../node_modules/.pnpm/**/.prisma/client/*.so.node"],
  },
};

export default nextConfig;
