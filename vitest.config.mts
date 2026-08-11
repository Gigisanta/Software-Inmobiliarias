import { defineConfig } from "vitest/config";

/**
 * Configuración de tests del monorepo. Descubre los `*.test.ts` co-locados en
 * los paquetes y la app. Entorno Node (lógica de servidor: auth, servicios,
 * utilidades). Los tests de seguridad no tocan la base: son puros y rápidos.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["packages/**/src/**/*.test.ts", "apps/**/src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/.next/**", "**/dist/**"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**", "apps/web/src/lib/**"],
      exclude: ["**/*.test.ts", "**/index.ts"],
    },
  },
});
