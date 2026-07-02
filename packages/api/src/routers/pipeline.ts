import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import * as pipelineService from "../services/pipeline-service";

export const pipelineRouter = router({
  /** Etapas del pipeline del tenant, ordenadas. */
  list: permissionProcedure(Permission.PIPELINE_READ).query(({ ctx }) =>
    pipelineService.listStages({ prisma: ctx.prisma, principal: ctx.principal }),
  ),

  /** Tablero Kanban: etapas con sus leads, conteo y valor potencial. */
  board: permissionProcedure(Permission.LEAD_READ).query(({ ctx }) =>
    pipelineService.getBoard({ prisma: ctx.prisma, principal: ctx.principal }),
  ),
});
