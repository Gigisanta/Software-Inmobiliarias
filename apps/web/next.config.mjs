/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Los paquetes del monorepo se consumen como código TS y Next los transpila.
  transpilePackages: ["@reos/api", "@reos/auth", "@reos/core", "@reos/db"],
  // Prisma no debe ser empaquetado por Next: se resuelve como dependencia externa.
  serverExternalPackages: ["@prisma/client", ".prisma/client"],
};

export default nextConfig;
