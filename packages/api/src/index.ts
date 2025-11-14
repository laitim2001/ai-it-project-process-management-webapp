/**
 * @fileoverview API Package Index - tRPC API 統一導出
 *
 * @description
 * 統一導出 tRPC API 的核心元素，包含完整的 API Router 和 Context 創建函數。
 * 提供類型安全的 API 定義 (AppRouter)，供前端 tRPC Client 使用。
 * 這是整個 API 層的入口點，所有 tRPC 相關的導出都應該從這裡開始。
 *
 * @module api
 *
 * @exports
 * - appRouter: 完整的 tRPC API Router (包含所有子 Router)
 * - AppRouter: AppRouter 類型定義 (用於前端 tRPC Client 類型推斷)
 * - createInnerTRPCContext: tRPC Context 創建函數 (用於測試和 SSR)
 *
 * @routers
 * appRouter 包含以下子 Router：
 * - budgetPool: 預算池 CRUD
 * - project: 專案管理
 * - user: 用戶管理
 * - budgetProposal: 預算提案工作流
 * - vendor: 供應商管理
 * - quote: 報價管理
 * - purchaseOrder: 採購單管理
 * - expense: 費用記錄與核銷
 * - dashboard: 儀表板數據
 * - notification: 通知系統 (Epic 8)
 *
 * @usage
 * ```typescript
 * // 前端 tRPC Client (apps/web/src/lib/trpc.ts)
 * import { type AppRouter } from '@itpm/api';
 * import { createTRPCProxyClient } from '@trpc/client';
 *
 * export const trpc = createTRPCProxyClient<AppRouter>({ ... });
 *
 * // 測試環境 (packages/api/src/__tests__/routers/project.test.ts)
 * import { appRouter, createInnerTRPCContext } from '@itpm/api';
 *
 * const ctx = createInnerTRPCContext({ session: mockSession });
 * const caller = appRouter.createCaller(ctx);
 * ```
 *
 * @dependencies
 * - ./root: appRouter 定義 (所有子 Router 的根)
 * - ./trpc: createInnerTRPCContext 函數
 *
 * @related
 * - packages/api/src/root.ts - App Router 定義
 * - packages/api/src/trpc.ts - tRPC Context 和中介軟體
 * - packages/api/src/routers/*.ts - 各個子 Router 實現
 * - apps/web/src/lib/trpc.ts - 前端 tRPC Client
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

export { appRouter, type AppRouter } from './root';
export { createInnerTRPCContext } from './trpc';
