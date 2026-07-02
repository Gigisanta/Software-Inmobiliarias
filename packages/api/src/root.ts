import { router, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";
import { pipelineRouter } from "./routers/pipeline";
import { leadRouter } from "./routers/lead";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  health: healthRouter,
  pipeline: pipelineRouter,
  lead: leadRouter,
  dashboard: dashboardRouter,
});

export type AppRouter = typeof appRouter;

/** Permite invocar el router server-side (SSR, tests, workers). */
export const createCaller = createCallerFactory(appRouter);
