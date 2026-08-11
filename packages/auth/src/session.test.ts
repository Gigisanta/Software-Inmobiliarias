// El secreto debe existir antes de firmar/verificar (getSecret lo lee en runtime).
process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";

import { describe, it, expect } from "vitest";
import { createSessionToken, verifySessionToken, SESSION_TTL_SECONDS } from "./session";

describe("createSessionToken / verifySessionToken", () => {
  it("crea un token válido y lo verifica devolviendo el userId", () => {
    const token = createSessionToken("user-123");
    const payload = verifySessionToken(token);
    expect(payload?.uid).toBe("user-123");
    expect(payload?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it("rechaza un token nulo o vacío", () => {
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken("sin-punto")).toBeNull();
  });

  it("rechaza un token con la firma manipulada", () => {
    const token = createSessionToken("user-123");
    const [body] = token.split(".");
    const forged = `${body}.firmafalsa`;
    expect(verifySessionToken(forged)).toBeNull();
  });

  it("rechaza un token con el payload manipulado (firma no coincide)", () => {
    const token = createSessionToken("user-123");
    const sig = token.split(".")[1];
    const otherBody = Buffer.from(
      JSON.stringify({ uid: "user-999", exp: Math.floor(Date.now() / 1000) + 1000 }),
    ).toString("base64url");
    expect(verifySessionToken(`${otherBody}.${sig}`)).toBeNull();
  });

  it("rechaza un token expirado", () => {
    const token = createSessionToken("user-123", { ttlSeconds: -10 });
    expect(verifySessionToken(token)).toBeNull();
  });

  it("firmado con otro secreto no valida (aísla por SESSION_SECRET)", () => {
    const token = createSessionToken("user-123");
    process.env.SESSION_SECRET = "otro-secreto-completamente-distinto";
    expect(verifySessionToken(token)).toBeNull();
    process.env.SESSION_SECRET = "secreto-de-prueba-suficientemente-largo";
  });

  it("incluye la época de contraseña (pca) cuando se provee", () => {
    const changedAt = new Date("2026-01-01T00:00:00Z");
    const token = createSessionToken("user-123", { passwordChangedAt: changedAt });
    const payload = verifySessionToken(token);
    expect(payload?.pca).toBe(Math.floor(changedAt.getTime() / 1000));
  });

  it("usa el TTL por defecto de 7 días", () => {
    expect(SESSION_TTL_SECONDS).toBe(60 * 60 * 24 * 7);
  });

  it("lanza si el secreto es demasiado corto", () => {
    const prev = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = "corto";
    expect(() => createSessionToken("user-123")).toThrow(/SESSION_SECRET/);
    process.env.SESSION_SECRET = prev;
  });
});
