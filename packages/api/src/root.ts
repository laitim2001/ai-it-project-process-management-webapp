import { createTRPCRouter } from './trpc';
import { healthRouter } from './routers/health';
import { budgetPoolRouter } from './routers/budgetPool';
import { projectRouter } from './routers/project';
import { userRouter } from './routers/user';
import { budgetProposalRouter } from './routers/budgetProposal';
import { vendorRouter } from './routers/vendor';
import { quoteRouter } from './routers/quote';
import { purchaseOrderRouter } from './routers/purchaseOrder';
import { expenseRouter } from './routers/expense';
import { dashboardRouter } from './routers/dashboard';
import { notificationRouter } from './routers/notification';
import { operatingCompanyRouter } from './routers/operatingCompany';
import { omExpenseRouter } from './routers/omExpense';
import { chargeOutRouter } from './routers/chargeOut';

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
  vendor: vendorRouter,
  quote: quoteRouter,
  purchaseOrder: purchaseOrderRouter,
  expense: expenseRouter,
  dashboard: dashboardRouter,
  notification: notificationRouter,
  operatingCompany: operatingCompanyRouter,
  omExpense: omExpenseRouter,
  chargeOut: chargeOutRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
