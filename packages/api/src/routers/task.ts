import { z } from "zod";
import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import { Priority, TaskStatus } from "@reos/core";
import * as taskService from "../services/task-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

export const taskRouter = router({
  list: permissionProcedure(Permission.TASK_READ)
    .input(
      z
        .object({
          status: z.nativeEnum(TaskStatus).optional(),
          includeCompleted: z.boolean().optional(),
          leadId: z.string().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => taskService.listTasks(sctx(ctx), input ?? {})),

  create: permissionProcedure(Permission.TASK_WRITE)
    .input(
      z.object({
        title: z.string().trim().min(1, "El título es obligatorio."),
        description: z.string().trim().optional(),
        priority: z.nativeEnum(Priority).optional(),
        dueAt: z.date().nullable().optional(),
        leadId: z.string().nullable().optional(),
        assignedToId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => taskService.createTask(sctx(ctx), input)),

  update: permissionProcedure(Permission.TASK_WRITE)
    .input(
      z.object({
        id: z.string(),
        patch: z.object({
          title: z.string().trim().min(1).optional(),
          description: z.string().trim().nullable().optional(),
          priority: z.nativeEnum(Priority).optional(),
          dueAt: z.date().nullable().optional(),
          leadId: z.string().nullable().optional(),
        }),
      }),
    )
    .mutation(({ ctx, input }) => taskService.updateTask(sctx(ctx), input.id, input.patch)),

  setStatus: permissionProcedure(Permission.TASK_WRITE)
    .input(z.object({ id: z.string(), status: z.nativeEnum(TaskStatus) }))
    .mutation(({ ctx, input }) => taskService.setTaskStatus(sctx(ctx), input.id, input.status)),

  remove: permissionProcedure(Permission.TASK_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => taskService.removeTask(sctx(ctx), input.id)),
});
