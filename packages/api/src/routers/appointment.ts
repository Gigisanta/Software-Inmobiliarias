import { z } from "zod";
import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import { AppointmentStatus, AppointmentType } from "@reos/core";
import * as apptService from "../services/appointment-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

export const appointmentRouter = router({
  list: permissionProcedure(Permission.APPOINTMENT_READ)
    .input(
      z
        .object({
          includePast: z.boolean().optional(),
          leadId: z.string().optional(),
        })
        .optional(),
    )
    .query(({ ctx, input }) => apptService.listAppointments(sctx(ctx), input ?? {})),

  create: permissionProcedure(Permission.APPOINTMENT_WRITE)
    .input(
      z.object({
        type: z.nativeEnum(AppointmentType).optional(),
        scheduledAt: z.date(),
        durationMinutes: z.number().int().positive().max(600).optional(),
        leadId: z.string().nullable().optional(),
        notes: z.string().trim().nullable().optional(),
        assignedToId: z.string().nullable().optional(),
      }),
    )
    .mutation(({ ctx, input }) => apptService.createAppointment(sctx(ctx), input)),

  update: permissionProcedure(Permission.APPOINTMENT_WRITE)
    .input(
      z.object({
        id: z.string(),
        patch: z.object({
          type: z.nativeEnum(AppointmentType).optional(),
          scheduledAt: z.date().optional(),
          durationMinutes: z.number().int().positive().max(600).optional(),
          notes: z.string().trim().nullable().optional(),
          leadId: z.string().nullable().optional(),
        }),
      }),
    )
    .mutation(({ ctx, input }) => apptService.updateAppointment(sctx(ctx), input.id, input.patch)),

  setStatus: permissionProcedure(Permission.APPOINTMENT_WRITE)
    .input(z.object({ id: z.string(), status: z.nativeEnum(AppointmentStatus) }))
    .mutation(({ ctx, input }) => apptService.setAppointmentStatus(sctx(ctx), input.id, input.status)),

  remove: permissionProcedure(Permission.APPOINTMENT_WRITE)
    .input(z.object({ id: z.string() }))
    .mutation(({ ctx, input }) => apptService.removeAppointment(sctx(ctx), input.id)),
});
