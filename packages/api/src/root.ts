import { createTRPCRouter } from './trpc';
import { healthRouter } from './routers/health';
import { budgetPoolRouter } from './routers/budgetPool';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  budgetPool: budgetPoolRouter,
  // Add more routers here as they are created:
  // project: projectRouter,
  // proposal: proposalRouter,
  // vendor: vendorRouter,
  // expense: expenseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
