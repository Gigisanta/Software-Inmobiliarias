import { describe, it, expect } from "vitest";
import { createTask } from "./task-service";
import { advisorPrincipal, makeCtx } from "./test-utils";

describe("createTask — validación de pertenencia (IDOR)", () => {
  it("rechaza un responsable (assignedToId) de otra inmobiliaria", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.user.findUnique.mockResolvedValue({ tenantId: "tenant-B" });

    await expect(
      createTask(ctx, { title: "Tarea", assignedToId: "user-de-B" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rechaza un responsable inexistente", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(
      createTask(ctx, { title: "Tarea", assignedToId: "fantasma" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("rechaza un lead de otra inmobiliaria", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findUnique.mockResolvedValue({ tenantId: "tenant-B", assignedToId: null });

    await expect(
      createTask(ctx, { title: "Tarea", leadId: "lead-de-B" }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  it("un asesor no puede colgar una tarea de un lead ajeno de su propia inmobiliaria (FORBIDDEN)", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findUnique.mockResolvedValue({ tenantId: "tenant-A", assignedToId: "advisor-2" });

    await expect(
      createTask(ctx, { title: "Tarea", leadId: "lead-de-colega" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
