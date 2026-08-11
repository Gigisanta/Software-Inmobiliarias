import { describe, it, expect } from "vitest";
import { rateLimit, resetRateLimit, clientIp } from "./rate-limit";

describe("rateLimit", () => {
  it("permite hasta el límite y luego bloquea", () => {
    const key = "test:permite-y-bloquea";
    for (let i = 0; i < 3; i++) {
      expect(rateLimit(key, 3, 60).allowed).toBe(true);
    }
    const blocked = rateLimit(key, 3, 60);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("informa los intentos restantes", () => {
    const key = "test:restantes";
    expect(rateLimit(key, 5, 60).remaining).toBe(4);
    expect(rateLimit(key, 5, 60).remaining).toBe(3);
  });

  it("resetRateLimit libera la clave (login exitoso)", () => {
    const key = "test:reset";
    rateLimit(key, 1, 60);
    expect(rateLimit(key, 1, 60).allowed).toBe(false);
    resetRateLimit(key);
    expect(rateLimit(key, 1, 60).allowed).toBe(true);
  });

  it("claves distintas no se afectan entre sí", () => {
    rateLimit("test:ip-A", 1, 60);
    expect(rateLimit("test:ip-A", 1, 60).allowed).toBe(false);
    expect(rateLimit("test:ip-B", 1, 60).allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("toma la primera IP de x-forwarded-for", () => {
    const req = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.5, 10.0.0.1" },
    });
    expect(clientIp(req)).toBe("203.0.113.5");
  });

  it("cae a x-real-ip y luego a un valor por defecto", () => {
    const withReal = new Request("http://localhost", { headers: { "x-real-ip": "198.51.100.9" } });
    expect(clientIp(withReal)).toBe("198.51.100.9");
    expect(clientIp(new Request("http://localhost"))).toBe("desconocida");
  });
});
