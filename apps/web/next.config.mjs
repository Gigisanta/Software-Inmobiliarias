import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
