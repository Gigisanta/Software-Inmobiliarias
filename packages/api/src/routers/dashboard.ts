import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import * as dashboardService from "../services/dashboard-service";

export const dashboardRouter = router({
  /** Resumen del Centro de Operaciones: KPIs + embudo (con alcance por rol). */
  summary: permissionProcedure(Permission.LEAD_READ).query(({ ctx }) =>
    dashboardService.getSummary({ prisma: ctx.prisma, principal: ctx.principal }),
  ),

  /** El día de trabajo: visitas próximas, seguimientos pendientes y operaciones activas. */
  today: permissionProcedure(Permission.LEAD_READ).query(({ ctx }) =>
    dashboardService.getToday({ prisma: ctx.prisma, principal: ctx.principal }),
  ),
});
