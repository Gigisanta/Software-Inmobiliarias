import { describe, it, expect } from "vitest";
import {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  PASSWORD_MIN_LENGTH,
} from "./password";

describe("hashPassword / verifyPassword", () => {
  it("verifica la contraseña correcta", () => {
    const stored = hashPassword("Secreta123");
    expect(verifyPassword("Secreta123", stored)).toBe(true);
  });

  it("rechaza la contraseña incorrecta", () => {
    const stored = hashPassword("Secreta123");
    expect(verifyPassword("otra-clave", stored)).toBe(false);
  });

  it("nunca guarda la contraseña en texto plano", () => {
    const stored = hashPassword("Secreta123");
    expect(stored).not.toContain("Secreta123");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("genera un salt distinto en cada hash", () => {
    expect(hashPassword("Secreta123")).not.toBe(hashPassword("Secreta123"));
  });

  it("rechaza un hash nulo, vacío o con formato inválido", () => {
    expect(verifyPassword("x", null)).toBe(false);
    expect(verifyPassword("x", undefined)).toBe(false);
    expect(verifyPassword("x", "")).toBe(false);
    expect(verifyPassword("x", "formato-invalido")).toBe(false);
    expect(verifyPassword("x", "bcrypt$salt$hash")).toBe(false);
  });
});

describe("validatePasswordStrength", () => {
  it("acepta una contraseña que cumple la política", () => {
    expect(validatePasswordStrength("Secreta123")).toBeNull();
  });

  it("rechaza contraseñas demasiado cortas", () => {
    expect(validatePasswordStrength("Ab1")).toMatch(/al menos/);
    expect("corta1".length).toBeLessThan(PASSWORD_MIN_LENGTH);
  });

  it("rechaza contraseñas demasiado largas (anti-DoS)", () => {
    expect(validatePasswordStrength("a1" + "x".repeat(300))).toMatch(/superar/);
  });

  it("exige combinar letras y números", () => {
    expect(validatePasswordStrength("solamenteletras")).toMatch(/letras y números/);
    expect(validatePasswordStrength("12345678")).toMatch(/letras y números/);
  });
});
