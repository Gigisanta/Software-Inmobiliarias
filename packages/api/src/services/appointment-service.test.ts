import { describe, it, expect } from "vitest";
import { createAppointment } from "./appointment-service";
import { advisorPrincipal, makeCtx } from "./test-utils";

const WHEN = new Date("2026-09-01T15:00:00Z");

describe("createAppointment — validación de pertenencia (IDOR)", () => {
  it("rechaza un responsable (assignedToId) de otra inmobiliaria", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.user.findUnique.mockResolvedValue({ tenantId: "tenant-B" });

    await expect(
      createAppointment(ctx, { scheduledAt: WHEN, assignedToId: "user-de-B" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rechaza un lead de otra inmobiliaria", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findUnique.mockResolvedValue({ tenantId: "tenant-B", assignedToId: null });

    await expect(
      createAppointment(ctx, { scheduledAt: WHEN, leadId: "lead-de-B" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("un asesor no puede agendar sobre un lead ajeno de su propia inmobiliaria (FORBIDDEN)", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findUnique.mockResolvedValue({ tenantId: "tenant-A", assignedToId: "advisor-2" });

    await expect(
      createAppointment(ctx, { scheduledAt: WHEN, leadId: "lead-de-colega" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
