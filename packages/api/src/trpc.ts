/**
 * @fileoverview tRPC Server Configuration - tRPC 伺服器端配置
 *
 * @description
 * tRPC 伺服器端核心配置文件，定義 API Context、中間件和 Procedure。
 * 提供認證檢查、角色權限控制（RBAC）和 Zod 錯誤格式化功能。
 * 整合 NextAuth v5 會話管理和 Prisma 資料庫存取。
 *
 * @module api/trpc
 *
 * @features
 * - tRPC Context 建立（session + prisma）
 * - Superjson 序列化（Date, BigInt 等特殊型別）
 * - Zod 錯誤格式化（前端型別安全的驗證錯誤）
 * - 認證中間件（protectedProcedure）
 * - RBAC 權限控制（supervisorProcedure, adminProcedure）
 * - 自動型別推斷（端對端型別安全）
 *
 * @procedures
 * - publicProcedure: 公開 API（無需登入）
 * - protectedProcedure: 需要登入的 API（檢查 session）
 * - supervisorProcedure: 僅 Supervisor 和 Admin 可訪問
 * - adminProcedure: 僅 Admin 可訪問
 *
 * @dependencies
 * - @trpc/server: tRPC 伺服器核心
 * - @itpm/db: Prisma Client 實例
 * - next-auth: 會話管理（v5）
 * - superjson: 序列化庫
 * - zod: 輸入驗證庫
 *
 * @related
 * - apps/web/src/app/api/trpc/[trpc]/route.ts - tRPC HTTP 處理器（呼叫 auth() 並傳遞 session）
 * - apps/web/src/lib/trpc.ts - tRPC 客戶端配置
 * - packages/api/src/root.ts - AppRouter 定義（匯出所有 routers）
 * - packages/api/src/routers/*.ts - 各功能模組的 Router
 * - packages/auth/src/index.ts - NextAuth v5 配置
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 *
 * @notes
 * - NextAuth v5 遷移完成：會話管理現在在 route handler 中處理
 * - 舊的 createTRPCContext 和 createTRPCContextFetch 已移除（使用 NextAuth v4 API）
 * - 現在使用 createInnerTRPCContext() 直接從 route handler 接收 session
 * - 所有 procedure 都支援自動型別推斷（TypeScript 推斷輸入和輸出型別）
 *
 * @migration-notes
 * NextAuth v4 → v5 遷移：
 * - 舊：getServerSession(authOptions) → 新：auth() from NextAuth v5
 * - 會話現在在 App Router route handler 中獲取
 * - createInnerTRPCContext() 從 route handler 接收 session 參數
 */

import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';
import { ZodError } from 'zod';

import { prisma } from '@itpm/db';
import type { Session } from 'next-auth';
import '@itpm/auth'; // Import auth package to load NextAuth type extensions

/**
 * ====================================================================
 * 1. CONTEXT - tRPC API Context 定義
 * ====================================================================
 *
 * @description
 * 定義 tRPC API 處理請求時可用的 "context"（上下文）。
 * Context 讓你在處理請求時存取資料庫、會話等資源。
 *
 * @context-available
 * - session: NextAuth 會話資料（包含 user 資訊和 role）
 * - prisma: Prisma Client 實例（資料庫操作）
 */

/**
 * Context 建立選項介面
 *
 * @interface CreateContextOptions
 * @property {Session | null} session - NextAuth 會話（null 表示未登入）
 */
interface CreateContextOptions {
  session: Session | null;
}

/**
 * 建立 tRPC 內部 Context
 *
 * @description
 * 產生 tRPC context 的核心函數。如果需要在特殊情況下使用（如測試、SSG），
 * 可以直接匯出此函數。
 *
 * @param {CreateContextOptions} opts - Context 建立選項
 * @param {Session | null} opts.session - NextAuth 會話資料
 * @returns {{session: Session | null, prisma: PrismaClient}} tRPC Context 物件
 *
 * @usage-scenarios
 * - 測試環境：無需模擬 Next.js req/res，直接傳入 mock session
 * - SSG Helpers：使用 tRPC 的 createSSGHelpers 時（無 req/res 可用）
 * - Route Handler：從 App Router route handler 傳入 NextAuth v5 的 auth() 結果
 *
 * @example
 * ```typescript
 * // 在 route handler 中使用（App Router）
 * import { auth } from '@itpm/auth';
 * import { createInnerTRPCContext } from '@itpm/api/trpc';
 *
 * export async function GET(req: Request) {
 *   const session = await auth();
 *   const ctx = createInnerTRPCContext({ session });
 *   // ctx.session → NextAuth session
 *   // ctx.prisma → Prisma Client
 * }
 *
 * // 在測試中使用
 * const mockSession = { user: { id: '123', name: 'Test User', role: { ... } } };
 * const ctx = createInnerTRPCContext({ session: mockSession });
 * ```
 *
 * @see {@link https://create.t3.gg/en/usage/trpc#-serverapitrpcts | T3 Stack tRPC Guide}
 */
export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

/**
 * ====================================================================
 * NextAuth v5 遷移說明
 * ====================================================================
 *
 * @migration-removed-functions
 * 以下函數已移除（使用已棄用的 NextAuth v4 API）：
 * - createTRPCContext (Pages Router 版本)
 * - createTRPCContextFetch (App Router 版本)
 *
 * @migration-new-approach
 * NextAuth v5 會話管理現在在 App Router route handler 中處理：
 * 1. apps/web/src/app/api/trpc/[trpc]/route.ts 呼叫 NextAuth v5 的 auth()
 * 2. 將獲取的 session 傳遞給 createInnerTRPCContext()
 * 3. 直接從 route handler 使用 createInnerTRPCContext()
 *
 * @migration-pages-router-note
 * 如需使用 Pages Router（目前不需要），在 Pages API route 中同樣方式建立 context。
 *
 * @see apps/web/src/app/api/trpc/[trpc]/route.ts - NextAuth v5 整合範例
 */

// 已移除: createTRPCContext (Pages Router) - 使用 NextAuth v4 API
// 已移除: createTRPCContextFetch (App Router) - 使用 NextAuth v4 API
// 使用: 直接從 route handler 配合 NextAuth v5 使用 createInnerTRPCContext()

/**
 * ====================================================================
 * 2. INITIALIZATION - tRPC 實例初始化
 * ====================================================================
 *
 * @description
 * 初始化 tRPC API，連接 context 和 transformer。
 * 解析 ZodErrors 讓前端在驗證失敗時獲得型別安全的錯誤資訊。
 *
 * @config
 * - transformer: superjson（支援 Date, BigInt, Map, Set 等特殊型別）
 * - errorFormatter: Zod 錯誤格式化器（提供詳細的驗證錯誤訊息）
 */

/**
 * tRPC 實例（核心配置）
 *
 * @constant t
 * @description
 * 配置 tRPC 的序列化器和錯誤格式化器。
 * 所有 router 和 procedure 都由此實例建立。
 *
 * @transformer superjson
 * - 支援 Date 物件直接序列化（無需手動轉換 ISO string）
 * - 支援 BigInt, Map, Set, undefined 等 JavaScript 內建型別
 * - 前後端自動序列化/反序列化
 *
 * @error-formatter
 * - 捕獲 Zod 驗證錯誤並格式化為前端友好的結構
 * - 提供欄位級別的錯誤訊息（formErrors, fieldErrors）
 * - 前端可使用 error.data.zodError 獲取詳細驗證錯誤
 *
 * @example
 * ```typescript
 * // Zod 驗證錯誤會被格式化為：
 * {
 *   message: "Validation failed",
 *   data: {
 *     zodError: {
 *       formErrors: [],
 *       fieldErrors: {
 *         email: ["Invalid email format"],
 *         password: ["Password must be at least 8 characters"]
 *       }
 *     }
 *   }
 * }
 * ```
 */
const t = initTRPC.context<typeof createInnerTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * ====================================================================
 * 3. ROUTER & PROCEDURE - Router 和 Procedure 建立器
 * ====================================================================
 *
 * @description
 * 這些是建構 tRPC API 的核心工具。
 * 在 "packages/api/src/routers/" 目錄中大量使用這些建立器。
 *
 * @tools
 * - createTRPCRouter: 建立新的 router 或 sub-router
 * - publicProcedure: 公開 API（不需要登入）
 * - protectedProcedure: 需要登入的 API（檢查 session）
 * - supervisorProcedure: 僅 Supervisor 和 Admin 可訪問（RBAC）
 * - adminProcedure: 僅 Admin 可訪問（RBAC）
 */

/**
 * 建立 tRPC Router
 *
 * @description
 * 用於建立新的 router 或 sub-router。
 * 所有功能模組的 router 都使用此函數建立。
 *
 * @example
 * ```typescript
 * export const projectRouter = createTRPCRouter({
 *   getAll: protectedProcedure
 *     .input(z.object({ page: z.number(), limit: z.number() }))
 *     .query(async ({ ctx, input }) => { ... }),
 *
 *   create: protectedProcedure
 *     .input(createProjectSchema)
 *     .mutation(async ({ ctx, input }) => { ... }),
 * });
 * ```
 *
 * @see {@link https://trpc.io/docs/router | tRPC Router 文檔}
 */
export const createTRPCRouter = t.router;

/**
 * 公開 Procedure（不需要認證）
 *
 * @description
 * 基礎的 procedure，用於建立不需要登入即可訪問的 query 和 mutation。
 * 雖然不強制用戶登入，但仍可存取 session 資料（如果用戶已登入）。
 *
 * @use-cases
 * - 公開資料查詢（如公告、公開文章）
 * - 登入/註冊相關 API
 * - 健康檢查端點
 *
 * @example
 * ```typescript
 * export const authRouter = createTRPCRouter({
 *   // 公開 API：不檢查登入狀態
 *   login: publicProcedure
 *     .input(z.object({ email: z.string().email(), password: z.string() }))
 *     .mutation(async ({ ctx, input }) => {
 *       // ctx.session 可能為 null（用戶未登入）
 *       return await loginUser(input);
 *     }),
 * });
 * ```
 */
export const publicProcedure = t.procedure;

/**
 * 受保護 Procedure（需要認證）
 *
 * @description
 * 需要用戶登入的 procedure。
 * 自動檢查 session 是否有效，並保證 ctx.session.user 不為 null。
 * 如果未登入，會拋出 UNAUTHORIZED 錯誤。
 *
 * @middleware-behavior
 * - 檢查 ctx.session 和 ctx.session.user 是否存在
 * - 未登入 → 拋出 TRPCError({ code: 'UNAUTHORIZED' })
 * - 已登入 → 繼續執行，ctx.session.user 型別推斷為非 null
 *
 * @use-cases
 * - 所有需要登入的 API（專案、預算池、提案等）
 * - 用戶個人資料操作
 * - 資料的 CRUD 操作（需要知道操作者身份）
 *
 * @example
 * ```typescript
 * export const projectRouter = createTRPCRouter({
 *   getAll: protectedProcedure
 *     .input(z.object({ page: z.number() }))
 *     .query(async ({ ctx, input }) => {
 *       // ctx.session.user 保證非 null（TypeScript 自動推斷）
 *       const userId = ctx.session.user.id;
 *       return await ctx.prisma.project.findMany({
 *         where: { managerId: userId }
 *       });
 *     }),
 * });
 * ```
 *
 * @see {@link https://trpc.io/docs/procedures | tRPC Procedures 文檔}
 */
export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
  return next({
    ctx: {
      // 推斷 session 為非 null（TypeScript 型別縮小）
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

/**
 * ====================================================================
 * RBAC 權限控制中間件 (Epic 1 - Story 1.4)
 * ====================================================================
 *
 * @description
 * 檢查用戶是否具有指定角色權限的中間件。
 * 實現基於角色的存取控制（Role-Based Access Control）。
 *
 * @roles
 * - ProjectManager: 專案經理（建立專案、提案、費用）
 * - Supervisor: 主管（審批提案、費用，查看所有專案）
 * - Admin: 管理員（完整系統權限，包括用戶管理）
 *
 * @procedures
 * - supervisorProcedure: 僅 Supervisor 或 Admin 可訪問
 * - adminProcedure: 僅 Admin 可訪問
 */

/**
 * Supervisor 權限 Procedure
 *
 * @description
 * 僅限 Supervisor 和 Admin 角色訪問的 procedure。
 * 用於需要主管權限的操作（如審批提案、查看所有專案）。
 *
 * @allowed-roles
 * - Supervisor: 主管
 * - Admin: 管理員
 *
 * @denied-roles
 * - ProjectManager: 專案經理（無權限）
 *
 * @error
 * 如果用戶不是 Supervisor 或 Admin，拋出 FORBIDDEN 錯誤。
 *
 * @example
 * ```typescript
 * export const budgetProposalRouter = createTRPCRouter({
 *   // 僅主管和管理員可以審批提案
 *   approve: supervisorProcedure
 *     .input(z.object({ id: z.string(), comment: z.string() }))
 *     .mutation(async ({ ctx, input }) => {
 *       // ctx.session.user.role.name 保證為 'Supervisor' 或 'Admin'
 *       return await approveBudgetProposal(input.id, input.comment);
 *     }),
 *
 *   // 查看所有專案的提案（跨專案查詢）
 *   getAllPendingProposals: supervisorProcedure
 *     .query(async ({ ctx }) => {
 *       return await ctx.prisma.budgetProposal.findMany({
 *         where: { status: 'PendingApproval' }
 *       });
 *     }),
 * });
 * ```
 */
export const supervisorProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.session.user.role.name;

  if (userRole !== 'Supervisor' && userRole !== 'Admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '您沒有權限執行此操作（需要 Supervisor 或 Admin 權限）',
    });
  }

  return next({ ctx });
});

/**
 * Admin 權限 Procedure
 *
 * @description
 * 僅限 Admin 角色訪問的 procedure。
 * 用於需要最高權限的操作（如用戶管理、系統配置）。
 *
 * @allowed-roles
 * - Admin: 管理員（唯一允許的角色）
 *
 * @denied-roles
 * - ProjectManager: 專案經理（無權限）
 * - Supervisor: 主管（無權限）
 *
 * @error
 * 如果用戶不是 Admin，拋出 FORBIDDEN 錯誤。
 *
 * @example
 * ```typescript
 * export const userRouter = createTRPCRouter({
 *   // 僅管理員可以建立新用戶
 *   create: adminProcedure
 *     .input(createUserSchema)
 *     .mutation(async ({ ctx, input }) => {
 *       // ctx.session.user.role.name 保證為 'Admin'
 *       return await ctx.prisma.user.create({ data: input });
 *     }),
 *
 *   // 僅管理員可以刪除用戶
 *   delete: adminProcedure
 *     .input(z.object({ id: z.string() }))
 *     .mutation(async ({ ctx, input }) => {
 *       return await ctx.prisma.user.delete({ where: { id: input.id } });
 *     }),
 * });
 * ```
 */
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  const userRole = ctx.session.user.role.name;

  if (userRole !== 'Admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '您沒有權限執行此操作（需要 Admin 權限）',
    });
  }

  return next({ ctx });
});

// Session type is now imported from @itpm/auth
