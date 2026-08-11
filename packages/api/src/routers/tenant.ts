import { z } from "zod";
import { router, permissionProcedure } from "../trpc";
import { Permission } from "@reos/auth";
import { SubscriptionPlan, UserRole } from "@reos/core";
import * as tenantService from "../services/tenant-service";

const sctx = (ctx: { prisma: any; principal: any }) => ({ prisma: ctx.prisma, principal: ctx.principal });

// Límite de tamaño para el logo en data URL (~400KB en base64).
const MAX_LOGO_CHARS = 550_000;

export const tenantRouter = router({
  /** Configuración de marca de la inmobiliaria (lectura para cualquier usuario). */
  settings: permissionProcedure(Permission.LEAD_READ).query(({ ctx }) =>
    tenantService.getSettings(sctx(ctx)),
  ),

  updateBranding: permissionProcedure(Permission.TENANT_MANAGE)
    .input(
      z.object({
        name: z.string().trim().min(1, "El nombre no puede estar vacío.").max(120).optional(),
        logoUrl: z
          .string()
          .max(MAX_LOGO_CHARS, "La imagen es demasiado grande (máx. ~400KB).")
          .refine(
            (v) => /^data:image\/(png|jpeg|jpg|webp|gif|svg\+xml);base64,/.test(v) || /^https:\/\//.test(v),
            "El logo debe ser una imagen (data URL de imagen o URL https).",
          )
          .nullable()
          .optional(),
        brandColor: z
          .string()
          .regex(/^#([0-9a-fA-F]{6})$/, "Color inválido (usá formato #RRGGBB).")
          .nullable()
          .optional(),
      }),
    )
    .mutation(({ ctx, input }) => tenantService.updateBranding(sctx(ctx), input)),

  listUsers: permissionProcedure(Permission.USER_READ).query(({ ctx }) =>
    tenantService.listUsers(sctx(ctx)),
  ),

  createUser: permissionProcedure(Permission.USER_MANAGE)
    .input(
      z.object({
        email: z.string().trim().email("Email inválido."),
        firstName: z.string().trim().min(1, "El nombre es obligatorio."),
        lastName: z.string().trim().optional(),
        role: z.nativeEnum(UserRole),
        password: z
          .string()
          .min(8, "La contraseña debe tener al menos 8 caracteres.")
          .max(200, "La contraseña es demasiado larga.")
          .regex(/[a-zA-Z]/, "La contraseña debe incluir letras.")
          .regex(/[0-9]/, "La contraseña debe incluir números."),
      }),
    )
    .mutation(({ ctx, input }) => tenantService.createUser(sctx(ctx), input)),

  setUserActive: permissionProcedure(Permission.USER_MANAGE)
    .input(z.object({ userId: z.string(), isActive: z.boolean() }))
    .mutation(({ ctx, input }) => tenantService.setUserActive(sctx(ctx), input.userId, input.isActive)),

  setPlan: permissionProcedure(Permission.TENANT_MANAGE)
    .input(z.object({ plan: z.nativeEnum(SubscriptionPlan) }))
    .mutation(({ ctx, input }) => tenantService.setPlan(sctx(ctx), input.plan)),
});
