import { router, createCallerFactory } from "./trpc";
import { healthRouter } from "./routers/health";
import { pipelineRouter } from "./routers/pipeline";
import { leadRouter } from "./routers/lead";
import { dashboardRouter } from "./routers/dashboard";
import { taskRouter } from "./routers/task";
import { appointmentRouter } from "./routers/appointment";
import { tenantRouter } from "./routers/tenant";
import { conversationRouter } from "./routers/conversation";
import { aiRouter } from "./routers/ai";

export const appRouter = router({
  health: healthRouter,
  pipeline: pipelineRouter,
  lead: leadRouter,
  dashboard: dashboardRouter,
  task: taskRouter,
  appointment: appointmentRouter,
  tenant: tenantRouter,
  conversation: conversationRouter,
  ai: aiRouter,
});

export type AppRouter = typeof appRouter;

/** Permite invocar el router server-side (SSR, tests, workers). */
export const createCaller = createCallerFactory(appRouter);
