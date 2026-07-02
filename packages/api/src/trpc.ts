/**
 * Inicialización de tRPC: transformer, formateo de errores Zod, y procedimientos
 * base (público, protegido, y con permiso RBAC).
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { hasPermission, type Permission, type AuthPrincipal } from "@reos/auth";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zod: error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
export const createCallerFactory = t.createCallerFactory;
export const middleware = t.middleware;

/** Contexto con principal garantizado no-nulo. */
export interface AuthedContext extends Context {
  principal: AuthPrincipal;
}

/** Requiere sesión autenticada. */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.principal) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Requiere autenticación." });
  }
  return next({ ctx: { ...ctx, principal: ctx.principal } });
});

/** Requiere sesión + un permiso RBAC específico. */
export function permissionProcedure(permission: Permission) {
  return protectedProcedure.use(({ ctx, next }) => {
    if (!hasPermission(ctx.principal.role, permission)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: `El rol ${ctx.principal.role} no tiene el permiso ${permission}.`,
      });
    }
    return next({ ctx });
  });
}
