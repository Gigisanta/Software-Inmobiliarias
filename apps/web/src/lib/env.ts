/**
 * Validación de entorno del servidor. Se ejecuta al importarse (una vez por
 * instancia) y falla rápido ("fail closed") si falta configuración crítica de
 * seguridad, en lugar de arrancar en un estado inseguro.
 */

const INSECURE_SECRETS = new Set([
  "changeme",
  "secret",
  "development",
  "dev",
  "test",
  "please-change-me",
]);

function assertServerEnv(): void {
  // Solo del lado servidor: en el cliente estas variables no existen.
  if (typeof window !== "undefined") return;

  const isProd = process.env.NODE_ENV === "production";
  const secret = process.env.SESSION_SECRET ?? "";

  if (secret.length < 16 || INSECURE_SECRETS.has(secret.toLowerCase())) {
    throw new Error(
      "SESSION_SECRET ausente, demasiado corto (mín. 16) o inseguro. " +
        "Generá uno con: openssl rand -base64 48",
    );
  }

  // En producción, el backdoor de demo nunca debe estar habilitado.
  if (isProd && process.env.DEV_AUTH === "true" && !process.env.CLERK_SECRET_KEY) {
    // El acceso de demo ya está neutralizado en el contexto tRPC para producción;
    // esto solo deja constancia de una configuración a corregir.
    console.warn(
      "⚠️  DEV_AUTH=true en producción: quitá esa variable. El acceso de demo está desactivado por seguridad.",
    );
  }
}

assertServerEnv();

export {};
