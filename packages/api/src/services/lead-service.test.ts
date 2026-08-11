import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { getLead, listLeads } from "./lead-service";
import { ownerPrincipal, advisorPrincipal, makeCtx } from "./test-utils";

describe("getLead — aislamiento por tenant y rol", () => {
  it("un lead de OTRA inmobiliaria se ve como NOT_FOUND", async () => {
    const { ctx, prisma } = makeCtx(ownerPrincipal("tenant-A"));
    prisma.lead.findUnique.mockResolvedValue({ id: "lead-1", tenantId: "tenant-B", assignedToId: null });

    await expect(getLead(ctx, "lead-1")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("un asesor NO puede ver un lead de su tenant asignado a otro (FORBIDDEN)", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findUnique.mockResolvedValue({
      id: "lead-1",
      tenantId: "tenant-A",
      assignedToId: "advisor-2",
    });

    await expect(getLead(ctx, "lead-1")).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("un asesor SÍ puede ver un lead propio", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    const lead = { id: "lead-1", tenantId: "tenant-A", assignedToId: "advisor-1" };
    prisma.lead.findUnique.mockResolvedValue(lead);

    await expect(getLead(ctx, "lead-1")).resolves.toBe(lead);
  });

  it("un lead inexistente es NOT_FOUND", async () => {
    const { ctx, prisma } = makeCtx(ownerPrincipal("tenant-A"));
    prisma.lead.findUnique.mockResolvedValue(null);

    await expect(getLead(ctx, "lead-x")).rejects.toBeInstanceOf(TRPCError);
  });
});

describe("listLeads — alcance de la consulta", () => {
  it("siempre filtra por el tenant del usuario", async () => {
    const { ctx, prisma } = makeCtx(ownerPrincipal("tenant-A"));
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);

    await listLeads(ctx, {});

    const where = prisma.lead.findMany.mock.calls[0]![0]!.where;
    expect(where.tenantId).toBe("tenant-A");
  });

  it("un asesor solo consulta sus propios leads", async () => {
    const { ctx, prisma } = makeCtx(advisorPrincipal("tenant-A", "advisor-1"));
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);

    await listLeads(ctx, {});

    const where = prisma.lead.findMany.mock.calls[0]![0]!.where;
    expect(where.assignedToId).toBe("advisor-1");
  });

  it("un dueño no restringe por asignado (ve todos)", async () => {
    const { ctx, prisma } = makeCtx(ownerPrincipal("tenant-A"));
    prisma.lead.findMany.mockResolvedValue([]);
    prisma.lead.count.mockResolvedValue(0);

    await listLeads(ctx, {});

    const where = prisma.lead.findMany.mock.calls[0]![0]!.where;
    expect(where.assignedToId).toBeUndefined();
  });
});
