/**
 * @fileoverview tRPC Root Router - API 主路由
 *
 * @description
 * tRPC 應用的主路由器（Root Router），整合所有子路由器（routers）。
 * 所有新增的 API 路由器都需要在此文件中手動註冊。
 *
 * @module packages/api/src/root
 * @router AppRouter
 * @author IT Department
 * @since Epic 1 - Story 1.1 (tRPC Setup)
 * @lastModified 2025-11-14
 *
 * @features
 * - 整合 15+ 個業務路由器
 * - 類型安全的 API 定義（AppRouter type）
 * - End-to-end 類型推斷
 * - 模組化路由管理
 *
 * @routers
 * - health - 健康檢查
 * - budgetPool - 預算池管理
 * - project - 專案管理
 * - user - 使用者管理
 * - budgetProposal - 預算提案工作流
 * - vendor - 供應商管理
 * - quote - 報價單管理
 * - purchaseOrder - 採購單管理
 * - expense - 費用記錄管理
 * - dashboard - 儀表板數據
 * - notification - 通知系統
 * - currency - 貨幣管理 (FEAT-001)
 * - operatingCompany - 經營公司管理
 * - omExpense - O&M 費用管理
 * - chargeOut - 費用歸屬管理
 *
 * @dependencies
 * - ./trpc - createTRPCRouter
 * - ./routers/* - 所有子路由器
 *
 * @related
 * - ./trpc.ts - tRPC 配置和 context
 * - ../../apps/web/src/lib/trpc.ts - tRPC client
 * - ../../apps/web/src/app/api/trpc/[trpc]/route.ts - API route handler
 *
 * @example
 * ```typescript
 * // 使用 AppRouter 類型
 * import type { AppRouter } from '@itpm/api';
 *
 * // 在前端呼叫 API
 * const { data } = api.budgetPool.getAll.useQuery({ page: 1, limit: 10 });
 * ```
 */

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
import { currencyRouter } from './routers/currency'; // FEAT-001
import { operatingCompanyRouter } from './routers/operatingCompany';
import { omExpenseRouter } from './routers/omExpense';
import { omExpenseCategoryRouter } from './routers/omExpenseCategory'; // FEAT-005
import { chargeOutRouter } from './routers/chargeOut';

/**
 * tRPC 主路由器
 *
 * 整合所有子路由器，提供類型安全的 API 定義。
 * 新增路由器時，需要在此文件中手動註冊。
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
  currency: currencyRouter, // FEAT-001: Currency Management
  operatingCompany: operatingCompanyRouter,
  omExpense: omExpenseRouter,
  omExpenseCategory: omExpenseCategoryRouter, // FEAT-005: OM Expense Category Management
  chargeOut: chargeOutRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
