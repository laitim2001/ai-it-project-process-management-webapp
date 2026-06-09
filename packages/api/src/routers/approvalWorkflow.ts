/**
 * @fileoverview Approval Workflow Router - 可配置序列審批流程配置 API
 *
 * @description
 * FEAT-014: 提供 Admin 對「審批流程（ApprovalWorkflow）」與其「有序步驟（ApprovalStep）」
 * 的完整配置能力。每個流程含有序多步驟，每步指定一個審批者——CHANGE-047 起可為「角色」
 * （Role，該角色任一人可審）或「指定用戶」（單一使用者）二選一，提案提交後依序流經各步驟
 * （推進邏輯在 budgetProposal router）。
 *
 * 本 router 僅負責「流程配置」（全 adminProcedure）；「審批執行」與「待我審批」視圖
 * 由 budgetProposal router 提供。
 *
 * Phase 1：通常維護一條 isActive 的預設流程，角色判定。
 * Phase 2（未來）：proposalTypeFilter / minAmount / maxAmount / matchPriority 規則引擎
 * （schema 已預留欄位，本 router 暫不暴露為可編輯）。
 *
 * @module api/routers/approvalWorkflow
 *
 * @features
 * - 流程 CRUD（建立 / 編輯 / 啟用切換；停用取代刪除，符合 R1）
 * - 步驟維護（新增 / 編輯 / 移除 / 拖曳排序）
 * - 步驟序號唯一（@@unique([workflowId, sequence])），重排採兩段式避免衝突
 *
 * @procedures
 * - list: 列出所有流程（含步驟與角色、已綁定提案數）
 * - getById: 取單一流程（含步驟與角色）
 * - create: 建立流程
 * - update: 更新流程（name / isActive / isDefault）
 * - toggleActive: 切換啟用狀態
 * - addStep: 新增步驟（序號 = 現有最大 + 1）
 * - updateStep: 更新步驟（角色 / 名稱）
 * - removeStep: 移除步驟（移除後重新壓實剩餘序號）
 * - reorderSteps: 依傳入順序重排步驟序號（兩段式）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作與交易
 * - Zod: 輸入驗證
 * - tRPC: API 框架（adminProcedure 權限）
 *
 * @related
 * - packages/db/prisma/schema.prisma - ApprovalWorkflow / ApprovalStep / ProposalApprovalProgress
 * - packages/api/src/routers/budgetProposal.ts - 審批執行（submit / approveStep / ...）
 * - packages/api/src/routers/user.ts - getRoles（配置頁角色下拉重用）
 * - apps/web/src/app/[locale]/settings/approval-workflows/ - 前端配置頁
 *
 * @author IT Department
 * @since FEAT-014 - 可配置序列審批流程
 * @lastModified 2026-06-02
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, adminProcedure } from '../trpc';

import type { Prisma } from '@itpm/db';

// ============================================================
// Zod 驗證 Schema 定義
// ============================================================

const createWorkflowSchema = z.object({
  name: z.string().min(1, '流程名稱不可為空').max(255),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
});

const updateWorkflowSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, '流程名稱不可為空').max(255).optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

// CHANGE-047: 步驟審批者「角色 / 指定用戶 二選一」（XOR）
const approverTypeEnum = z.enum(['role', 'user']);

const addStepSchema = z
  .object({
    workflowId: z.string().uuid(),
    approverType: approverTypeEnum,
    approverRoleId: z.number().int('角色 ID 必須為整數').optional(),
    approverUserId: z.string().uuid('無效的用戶 ID').optional(),
    name: z.string().max(255).optional(),
  })
  .refine(
    (v) =>
      v.approverType === 'role'
        ? v.approverRoleId != null && v.approverUserId == null
        : v.approverUserId != null && v.approverRoleId == null,
    { message: '審批者類型與所選對象不一致（須角色或用戶二選一）' }
  );

const updateStepSchema = z
  .object({
    id: z.string().uuid(),
    // approverType 未提供時視為「不變更審批者」（僅改名稱）
    approverType: approverTypeEnum.optional(),
    approverRoleId: z.number().int('角色 ID 必須為整數').optional(),
    approverUserId: z.string().uuid('無效的用戶 ID').optional(),
    name: z.string().max(255).nullable().optional(),
  })
  .refine(
    (v) =>
      v.approverType === 'role'
        ? v.approverRoleId != null
        : v.approverType === 'user'
        ? v.approverUserId != null
        : true,
    { message: '審批者類型與所選對象不一致（須角色或用戶二選一）' }
  );

const reorderStepsSchema = z.object({
  workflowId: z.string().uuid(),
  // 依「最終顯示順序」排列的完整步驟 ID 陣列（須包含該流程所有步驟）
  stepIds: z.array(z.string().uuid()).min(1, '至少需有一個步驟'),
});

// ============================================================
// 共用 include（流程含步驟與角色、已綁定提案數）
// ============================================================

// CHANGE-047: 指定用戶顯示用安全欄位
const approverUserSelect = {
  id: true,
  name: true,
  email: true,
} satisfies Prisma.UserSelect;

const workflowInclude = {
  steps: {
    orderBy: { sequence: 'asc' },
    include: { role: true, approverUser: { select: approverUserSelect } },
  },
  _count: { select: { proposals: true } },
} satisfies Prisma.ApprovalWorkflowInclude;

// ============================================================
// 輔助：驗證審批者（角色 / 用戶）存在
// ============================================================

async function assertRoleExists(
  prisma: Prisma.TransactionClient,
  roleId: number
): Promise<void> {
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `找不到角色（ID: ${roleId}）`,
    });
  }
}

async function assertUserExists(
  prisma: Prisma.TransactionClient,
  userId: string
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `找不到用戶（ID: ${userId}）`,
    });
  }
}

/**
 * CHANGE-047: 依審批者類型驗證存在性並回傳要寫入的欄位（另一欄位清為 null，維持 XOR）
 */
async function resolveApproverData(
  prisma: Prisma.TransactionClient,
  input: {
    approverType: 'role' | 'user';
    approverRoleId?: number;
    approverUserId?: string;
  }
): Promise<{ approverRoleId: number | null; approverUserId: string | null }> {
  if (input.approverType === 'role') {
    await assertRoleExists(prisma, input.approverRoleId!);
    return { approverRoleId: input.approverRoleId!, approverUserId: null };
  }
  await assertUserExists(prisma, input.approverUserId!);
  return { approverRoleId: null, approverUserId: input.approverUserId! };
}

// ============================================================
// Router 定義
// ============================================================

export const approvalWorkflowRouter = createTRPCRouter({
  /**
   * 列出所有審批流程（含步驟、角色、已綁定提案數）
   */
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.approvalWorkflow.findMany({
      include: workflowInclude,
      orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
    });
  }),

  /**
   * 取得單一審批流程（含步驟與角色）
   */
  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const workflow = await ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.id },
        include: workflowInclude,
      });
      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批流程' });
      }
      return workflow;
    }),

  /**
   * 建立審批流程
   */
  create: adminProcedure
    .input(createWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.approvalWorkflow.create({
        data: {
          name: input.name,
          isActive: input.isActive,
          isDefault: input.isDefault,
        },
        include: workflowInclude,
      });
    }),

  /**
   * 更新審批流程（name / isActive / isDefault）
   */
  update: adminProcedure
    .input(updateWorkflowSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      const existing = await ctx.prisma.approvalWorkflow.findUnique({
        where: { id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批流程' });
      }
      return ctx.prisma.approvalWorkflow.update({
        where: { id },
        data,
        include: workflowInclude,
      });
    }),

  /**
   * 切換啟用狀態
   */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.id },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批流程' });
      }
      return ctx.prisma.approvalWorkflow.update({
        where: { id: input.id },
        data: { isActive: !existing.isActive },
        include: workflowInclude,
      });
    }),

  /**
   * 新增步驟（序號 = 現有最大 + 1；驗證角色存在）
   */
  addStep: adminProcedure
    .input(addStepSchema)
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.workflowId },
        include: { steps: { orderBy: { sequence: 'desc' }, take: 1 } },
      });
      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批流程' });
      }
      const approver = await resolveApproverData(ctx.prisma, input);

      const nextSequence = (workflow.steps[0]?.sequence ?? 0) + 1;

      await ctx.prisma.approvalStep.create({
        data: {
          workflowId: input.workflowId,
          sequence: nextSequence,
          approverRoleId: approver.approverRoleId,
          approverUserId: approver.approverUserId,
          name: input.name,
        },
      });

      return ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.workflowId },
        include: workflowInclude,
      });
    }),

  /**
   * 更新步驟（角色 / 名稱）
   */
  updateStep: adminProcedure
    .input(updateStepSchema)
    .mutation(async ({ ctx, input }) => {
      const step = await ctx.prisma.approvalStep.findUnique({
        where: { id: input.id },
      });
      if (!step) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批步驟' });
      }
      // CHANGE-047: 有提供 approverType 才變更審批者（二選一，另一欄位清 null）
      const approver =
        input.approverType !== undefined
          ? await resolveApproverData(ctx.prisma, {
              approverType: input.approverType,
              approverRoleId: input.approverRoleId,
              approverUserId: input.approverUserId,
            })
          : undefined;

      await ctx.prisma.approvalStep.update({
        where: { id: input.id },
        data: {
          ...(approver && {
            approverRoleId: approver.approverRoleId,
            approverUserId: approver.approverUserId,
          }),
          ...(input.name !== undefined && { name: input.name }),
        },
      });

      return ctx.prisma.approvalWorkflow.findUnique({
        where: { id: step.workflowId },
        include: workflowInclude,
      });
    }),

  /**
   * 移除步驟（移除後將剩餘步驟序號壓實為 1..N，避免出現空洞）
   */
  removeStep: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const step = await ctx.prisma.approvalStep.findUnique({
        where: { id: input.id },
      });
      if (!step) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批步驟' });
      }
      const { workflowId } = step;

      await ctx.prisma.$transaction(async (tx) => {
        await tx.approvalStep.delete({ where: { id: input.id } });

        // 壓實剩餘步驟序號（兩段式：先 offset 再設最終值，避開唯一約束衝突）
        const remaining = await tx.approvalStep.findMany({
          where: { workflowId },
          orderBy: { sequence: 'asc' },
        });
        for (const [i, s] of remaining.entries()) {
          await tx.approvalStep.update({
            where: { id: s.id },
            data: { sequence: -(i + 1) },
          });
        }
        for (const [i, s] of remaining.entries()) {
          await tx.approvalStep.update({
            where: { id: s.id },
            data: { sequence: i + 1 },
          });
        }
      });

      return ctx.prisma.approvalWorkflow.findUnique({
        where: { id: workflowId },
        include: workflowInclude,
      });
    }),

  /**
   * 依傳入順序重排步驟序號（1..N）
   * 兩段式更新：因 @@unique([workflowId, sequence])，直接賦值會中途衝突，
   * 故先全部設為負數 offset，再設最終 1..N。
   */
  reorderSteps: adminProcedure
    .input(reorderStepsSchema)
    .mutation(async ({ ctx, input }) => {
      const workflow = await ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.workflowId },
        include: { steps: true },
      });
      if (!workflow) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該審批流程' });
      }

      // 驗證傳入的 stepIds 恰為此流程的完整步驟集合
      const existingIds = workflow.steps.map((s) => s.id).sort();
      const inputIds = [...input.stepIds].sort();
      const sameSet =
        existingIds.length === inputIds.length &&
        existingIds.every((id, idx) => id === inputIds[idx]);
      if (!sameSet) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '傳入的步驟順序必須包含且僅包含此流程的所有步驟',
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        for (const [i, stepId] of input.stepIds.entries()) {
          await tx.approvalStep.update({
            where: { id: stepId },
            data: { sequence: -(i + 1) },
          });
        }
        for (const [i, stepId] of input.stepIds.entries()) {
          await tx.approvalStep.update({
            where: { id: stepId },
            data: { sequence: i + 1 },
          });
        }
      });

      return ctx.prisma.approvalWorkflow.findUnique({
        where: { id: input.workflowId },
        include: workflowInclude,
      });
    }),
});
