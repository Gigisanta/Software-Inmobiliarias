import { router, publicProcedure, protectedProcedure } from "../trpc";

export const healthRouter = router({
  /** Chequeo de vida público. */
  ping: publicProcedure.query(() => ({ ok: true, service: "realestate-os-api", ts: new Date().toISOString() })),

  /** Identidad del usuario autenticado + su ficha + la inmobiliaria (tenant). */
  me: protectedProcedure.query(async ({ ctx }) => {
    const [user, tenant] = await Promise.all([
      ctx.prisma.user.findUnique({
        where: { id: ctx.principal.userId },
        select: { id: true, email: true, firstName: true, lastName: true, role: true, branchId: true },
      }),
      ctx.prisma.tenant.findUnique({
        where: { id: ctx.principal.tenantId },
        select: { id: true, name: true, slug: true, plan: true, logoUrl: true, brandColor: true },
      }),
    ]);
    return { principal: ctx.principal, user, tenant };
  }),
});
