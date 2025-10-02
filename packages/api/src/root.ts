import { createTRPCRouter } from './trpc';
import { healthRouter } from './routers/health';
import { budgetPoolRouter } from './routers/budgetPool';
import { projectRouter } from './routers/project';
import { userRouter } from './routers/user';
import { budgetProposalRouter } from './routers/budgetProposal';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  health: healthRouter,
  budgetPool: budgetPoolRouter,
  project: projectRouter,
  user: userRouter,
  budgetProposal: budgetProposalRouter,
  // Add more routers here as they are created:
  // vendor: vendorRouter,
  // expense: expenseRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
