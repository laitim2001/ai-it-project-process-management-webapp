/**
 * @fileoverview tRPC Client Configuration - tRPC 客戶端配置
 *
 * @description
 * 創建 tRPC React 客戶端實例，用於前端調用後端 API。
 * 提供端對端的類型安全，無需手動定義 API 介面或型別。
 * 整合 React Query 實現資料快取、背景更新和樂觀更新。
 *
 * @module lib/trpc
 *
 * @features
 * - 端對端類型安全（TypeScript 全程推斷）
 * - 自動型別推斷（從 AppRouter 自動生成）
 * - React Query 整合（useQuery, useMutation, 快取管理）
 * - 批次請求（多個查詢自動合併為單一 HTTP 請求）
 * - 錯誤處理（統一的錯誤格式和 Zod 驗證錯誤）
 *
 * @usage
 * ```typescript
 * import { api } from '@/lib/trpc';
 *
 * // 查詢資料（useQuery）
 * function ProjectList() {
 *   const { data, isLoading, error } = api.project.getAll.useQuery({
 *     page: 1,
 *     limit: 10
 *   });
 *
 *   if (isLoading) return <div>載入中...</div>;
 *   if (error) return <div>錯誤: {error.message}</div>;
 *
 *   return <div>{data.projects.map(p => <ProjectCard key={p.id} {...p} />)}</div>;
 * }
 *
 * // 變更資料（useMutation）
 * function CreateProjectForm() {
 *   const createProject = api.project.create.useMutation({
 *     onSuccess: () => {
 *       toast({ title: "專案建立成功" });
 *       router.push('/projects');
 *     }
 *   });
 *
 *   const handleSubmit = (data) => {
 *     createProject.mutate(data); // 完整類型安全
 *   };
 * }
 *
 * // 手動觸發重新查詢
 * const utils = api.useContext();
 * utils.project.getAll.invalidate(); // 刷新專案列表
 *
 * // 樂觀更新
 * const deleteBudgetPool = api.budgetPool.delete.useMutation({
 *   onMutate: async (id) => {
 *     await utils.budgetPool.getAll.cancel();
 *     const previous = utils.budgetPool.getAll.getData();
 *     utils.budgetPool.getAll.setData(undefined, (old) =>
 *       old?.filter(bp => bp.id !== id)
 *     );
 *     return { previous };
 *   },
 *   onError: (err, id, context) => {
 *     utils.budgetPool.getAll.setData(undefined, context?.previous);
 *   }
 * });
 * ```
 *
 * @dependencies
 * - @trpc/react-query: tRPC React 整合庫
 * - @itpm/api: 後端 AppRouter 型別定義
 * - React Query: 資料同步和快取管理
 *
 * @related
 * - apps/web/src/lib/trpc-provider.tsx - tRPC Provider 組件
 * - packages/api/src/root.ts - AppRouter 定義（後端）
 * - packages/api/src/trpc.ts - tRPC 伺服器配置
 * - apps/web/src/app/api/trpc/[trpc]/route.ts - tRPC HTTP 處理器
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 *
 * @notes
 * - AppRouter 型別會在後端變更時自動同步到前端
 * - 所有查詢和變更都經過 Zod 驗證
 * - 支援 superjson 進行 Date, BigInt 等特殊型別序列化
 * - HTTP 批次請求由 httpBatchLink 自動處理（在 trpc-provider.tsx 配置）
 */

import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@itpm/api';

/**
 * tRPC React 客戶端實例
 *
 * @description
 * 提供類型安全的 API 調用介面，自動推斷所有 procedure 的輸入和輸出型別。
 * 使用 React Query hooks (useQuery, useMutation) 進行資料管理。
 *
 * @type {ReturnType<typeof createTRPCReact<AppRouter>>}
 *
 * @example
 * ```typescript
 * // 自動型別推斷
 * const { data } = api.budgetPool.getById.useQuery({ id: "uuid" });
 * //    ^? { id: string; name: string; totalAmount: number; ... }
 *
 * const createMutation = api.project.create.useMutation();
 * createMutation.mutate({ name: "New Project", ... });
 * //                     ^? 完整的 Zod schema 型別檢查
 * ```
 */
export const api = createTRPCReact<AppRouter>();
