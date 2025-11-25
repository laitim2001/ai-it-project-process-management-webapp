/**
 * @fileoverview tRPC API Route Handler - 端到端型別安全 API 統一進入點
 * @description tRPC v10 的 Next.js App Router 適配器，處理所有後端 API 請求
 *
 * 此檔案為整個應用程式的 tRPC API 進入點，負責將 HTTP 請求轉發至對應的 tRPC Router。
 * tRPC 提供端到端型別安全，無需手動維護 API 型別定義，前端自動推斷後端型別。
 * 所有業務邏輯位於 `packages/api/src/routers/` 中，前端透過此 API Route 呼叫。
 *
 * @api
 * @method GET, POST
 * @route /api/trpc/[trpc]
 *
 * @features
 * - 端到端型別安全 - 前端自動推斷後端型別，零 API Schema 維護成本
 * - 統一錯誤處理 - 開發環境顯示詳細錯誤訊息，生產環境隱藏敏感資訊
 * - Session 注入 - 自動將 NextAuth Session 注入至 tRPC Context
 * - 中介軟體支援 - 支援 protectedProcedure（需登入）、supervisorProcedure（需主管權限）
 * - 自動型別推斷 - 使用 `api.router.procedure.useQuery()` 即可獲得完整型別提示
 *
 * @security
 * - Session 驗證 - 透過 NextAuth v5 的 `auth()` 取得當前 Session
 * - 角色權限控制 - tRPC 中介軟體實現 RBAC（protectedProcedure, supervisorProcedure）
 * - 錯誤訊息控制 - 生產環境不暴露詳細錯誤訊息
 * - 輸入驗證 - 所有 Procedure 使用 Zod Schema 進行執行期驗證
 *
 * @dependencies
 * - `@trpc/server` - tRPC 伺服器核心邏輯
 * - `@itpm/api` - tRPC App Router 和 Context 創建邏輯
 * - `next/server` - Next.js App Router 的 NextRequest 型別
 * - `apps/web/src/auth.ts` - NextAuth.js 認證邏輯（提供 Session）
 *
 * @related
 * - `packages/api/src/root.ts` - tRPC App Router 定義（合併所有 Router）
 * - `packages/api/src/routers/` - 所有業務邏輯 Router（project, budgetProposal, expense 等）
 * - `apps/web/src/lib/trpc.ts` - 前端 tRPC Client 配置
 * - `apps/web/src/lib/trpc-provider.tsx` - 前端 tRPC Provider（React Query 整合）
 *
 * @author IT Project Management Team
 * @since Epic 2 - Project Management (tRPC 架構建立)
 *
 * @example
 * // 前端呼叫範例（使用 tRPC Client）
 * import { api } from '@/lib/trpc';
 *
 * // 查詢範例（自動推斷型別）
 * const { data, isLoading, error } = api.project.getById.useQuery({ id: 'PROJ-001' });
 * // data 的型別自動推斷為 Project（包含所有欄位）
 *
 * // Mutation 範例（自動推斷輸入和輸出型別）
 * const createProject = api.project.create.useMutation({
 *   onSuccess: (newProject) => {
 *     console.log('專案建立成功:', newProject.id);
 *   },
 * });
 *
 * @example
 * // 後端 Router 範例（位於 packages/api/src/routers/project.ts）
 * export const projectRouter = createTRPCRouter({
 *   getById: protectedProcedure // 需登入
 *     .input(z.object({ id: z.string() }))
 *     .query(async ({ ctx, input }) => {
 *       // ctx.session.user 自動可用（由此檔案注入）
 *       return ctx.prisma.project.findUnique({ where: { id: input.id } });
 *     }),
 * });
 *
 * @example
 * // 錯誤處理（開發環境）
 * // Console 輸出: "❌ tRPC failed on project.getById: Project not found"
 */

import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { type NextRequest } from 'next/server';

import { auth } from '@/auth';
import { appRouter, createInnerTRPCContext } from '@itpm/api';

// Force dynamic rendering to avoid build-time Prisma initialization
export const dynamic = 'force-dynamic';

/**
 * tRPC Request Handler
 * 處理所有 tRPC API 請求（GET 和 POST）
 *
 * @param {NextRequest} req - Next.js Request 物件
 * @returns {Promise<Response>} tRPC Response
 */
const handler = async (req: NextRequest) => {
  // Get session using NextAuth v5
  const session = await auth();

  return fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: () => createInnerTRPCContext({ session }),
    onError:
      process.env.NODE_ENV === 'development'
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? '<no-path>'}: ${error.message}`
            );
          }
        : undefined,
  });
};

/**
 * tRPC GET Handler
 * 處理 GET 請求（用於 Query Procedures）
 * @type {(req: NextRequest) => Promise<Response>}
 */
export const GET = handler;

/**
 * tRPC POST Handler
 * 處理 POST 請求（用於 Mutation Procedures）
 * @type {(req: NextRequest) => Promise<Response>}
 */
export const POST = handler;
