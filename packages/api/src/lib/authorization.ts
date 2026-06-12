/**
 * @fileoverview 物件級授權 helper（FIX-150 / SR-04）
 * @module api/lib/authorization
 *
 * @description
 * 統一「資源所有權（object-level authorization）」檢查，供各 router 的
 * update / submit / getById 等 procedure 複用，補上「只驗登入、不驗歸屬」的水平越權缺口。
 *
 * @design
 * 設計決策見 `claudedocs/4-changes/bug-fixes/FIX-150-153-P1-authorization-fixes.md` §1：
 * - 寫入（assertCanMutate）：擁有者 OR Admin —— 對齊既有 delete 範本
 *   （project.ts:1001-1008、budgetProposal.ts:1248-1259）。
 * - 讀取（assertCanRead）  ：擁有者 OR Supervisor OR Admin —— 讀取放寬一級，
 *   符合 Supervisor 監督所有專案與 Dashboard 跨專案查詢的需求。
 *
 * @usage
 * ```ts
 * import { assertCanMutate } from '../lib/authorization';
 * const project = await ctx.prisma.project.findUnique({ where: { id: input.id } });
 * if (!project) throw new TRPCError({ code: 'NOT_FOUND', message: '找不到專案' });
 * assertCanMutate(project.managerId, ctx, '此專案');
 * ```
 */

import { TRPCError } from '@trpc/server';

/**
 * 授權檢查所需的最小 context 形狀。
 * 僅取 session.user.{id, role.name}，避免耦合 tRPC context 的完整型別。
 * protectedProcedure 之後 session.user 保證非 null。
 */
interface AuthzContext {
  session: { user: { id: string; role: { name: string } } };
}

/**
 * 授權判斷所需的最小 actor 形狀（session.user 的結構子集）。
 * 同時相容 tRPC context 與 NextAuth route handler 的 session.user，
 * 讓 Next.js API route（檔案上傳/下載）可複用同一套授權規則。
 */
interface AuthzActor {
  id: string;
  role: { name: string };
}

/**
 * 寫入授權判斷（非拋出版）：僅資源擁有者或 Admin 回 true。
 * 供 Next.js API route 以 HTTP 狀態碼回應時複用，避免在 route 內 try/catch TRPCError。
 * tRPC 層請改用會拋 FORBIDDEN 的 {@link assertCanMutate}。
 */
export function canMutate(ownerId: string, actor: AuthzActor): boolean {
  return ownerId === actor.id || actor.role.name === 'Admin';
}

/**
 * 讀取授權判斷（非拋出版）：資源擁有者、Supervisor 或 Admin 回 true。
 * 供 Next.js API route 複用；tRPC 層請改用 {@link assertCanRead}。
 */
export function canRead(ownerId: string, actor: AuthzActor): boolean {
  return ownerId === actor.id || actor.role.name === 'Supervisor' || actor.role.name === 'Admin';
}

/**
 * 寫入授權：僅資源擁有者或 Admin 可變更。
 *
 * @param ownerId - 該資源擁有者的 user id（如 `project.managerId`）
 * @param ctx - tRPC context（protectedProcedure 之後）
 * @param label - 用於錯誤訊息的資源名稱（如「此專案」）
 * @throws {TRPCError} FORBIDDEN - 當前使用者既非擁有者也非 Admin
 */
export function assertCanMutate(
  ownerId: string,
  ctx: AuthzContext,
  label = '此資源'
): void {
  if (canMutate(ownerId, ctx.session.user)) return;
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `您沒有權限修改${label}（僅擁有者或管理員可操作）`,
  });
}

/**
 * 讀取授權：資源擁有者、Supervisor 或 Admin 可檢視。
 *
 * @param ownerId - 該資源擁有者的 user id（如 `project.managerId`）
 * @param ctx - tRPC context（protectedProcedure 之後）
 * @param label - 用於錯誤訊息的資源名稱（如「此專案」）
 * @throws {TRPCError} FORBIDDEN - 當前使用者既非擁有者，也不具 Supervisor / Admin
 */
export function assertCanRead(
  ownerId: string,
  ctx: AuthzContext,
  label = '此資源'
): void {
  if (canRead(ownerId, ctx.session.user)) return;
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: `您沒有權限檢視${label}（僅擁有者、主管或管理員可檢視）`,
  });
}
