/**
 * @fileoverview Budget Proposal Router - 預算提案審批工作流 API
 *
 * @description
 * 提供預算提案的完整生命週期管理，包含創建、編輯、提交、審批的完整工作流。
 * 預算提案是專案啟動的關鍵步驟，支援多狀態流轉、評論討論、審批歷史記錄。
 * 整合通知系統（Epic 8），在狀態變更時自動發送通知給相關人員。
 * 支援文件上傳（計劃書 PDF/PPT）和會議記錄管理功能。
 *
 * @module api/routers/budgetProposal
 *
 * @features
 * - 建立預算提案（Draft 狀態，支援草稿保存）
 * - 更新提案內容（僅 Draft 和 MoreInfoRequired 狀態可編輯）
 * - 提交提案審批（Draft/MoreInfoRequired → PendingApproval）
 * - 審批提案（Approved/Rejected/MoreInfoRequired，含批准金額記錄）
 * - 查詢提案列表（支援狀態、專案、搜尋過濾）
 * - 查詢單一提案詳情（含評論、歷史記錄、專案資訊）
 * - 評論系統（支援多人討論，記錄所有評論）
 * - 審批歷史記錄（完整的狀態變更軌跡）
 * - 文件上傳管理（計劃書 PDF/PPT）
 * - 會議記錄管理（日期、記錄、介紹人員）
 * - 刪除提案（僅 Draft 狀態可刪除）
 * - 通知整合（狀態變更時自動通知相關人員）
 *
 * @procedures
 * - getAll: 查詢提案列表（支援過濾和搜尋）
 * - getById: 查詢單一提案詳情
 * - create: 建立新提案（Draft 狀態）
 * - update: 更新提案內容
 * - submit: 提交提案審批
 * - approve: 審批提案（Supervisor only）
 * - addComment: 新增評論
 * - uploadProposalFile: 上傳提案文件
 * - updateMeetingNotes: 更新會議記錄
 * - delete: 刪除提案（Draft only，僅建立者或 Admin）
 * - deleteMany: 批量刪除提案（CHANGE-017 新增）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 * - TRPCError: 錯誤處理
 *
 * @related
 * - packages/db/prisma/schema.prisma - BudgetProposal, Comment, History 資料模型
 * - packages/api/src/routers/project.ts - 關聯的專案 Router
 * - packages/api/src/routers/notification.ts - 通知系統 Router
 * - apps/web/src/app/[locale]/proposals/page.tsx - 提案列表頁面
 *
 * @author IT Department
 * @since Epic 4 - Proposal and Approval Workflow
 * @lastModified 2025-11-14
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { assertCanMutate, assertCanRead } from '../lib/authorization';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

import type { Prisma } from '@itpm/db';

/**
 * FIX-106: 安全的 User select 欄位，避免洩漏密碼 hash
 */
const safeUserSelect = { id: true, name: true, email: true, image: true } as const;

/**
 * FEAT-014: 含審批流程進度的提案 include（時間線 / 待我審批 / 步驟操作回傳共用）
 */
const proposalApprovalInclude = {
  project: {
    include: {
      manager: { select: safeUserSelect },
      supervisor: { select: safeUserSelect },
      budgetPool: true,
      currency: true,
    },
  },
  omExpense: true, // CHANGE-052: 多態目標 — OM 提案
  vendor: true,
  workflow: {
    include: {
      // CHANGE-047: 步驟審批者可為角色或指定用戶
      steps: {
        include: { role: true, approverUser: { select: safeUserSelect } },
        orderBy: { sequence: 'asc' },
      },
    },
  },
  approvalProgress: {
    orderBy: { sequence: 'asc' },
    include: {
      step: { include: { role: true, approverUser: { select: safeUserSelect } } },
      approver: { select: safeUserSelect }, // 實際決策者
      designatedApprover: { select: safeUserSelect }, // CHANGE-047: 指定審批者
    },
  },
} satisfies Prisma.BudgetProposalInclude;

/**
 * FEAT-014: 解析提案適用的審批流程
 *
 * Phase 1：取唯一一條 isActive 且至少有一個步驟的流程；多條時依
 * isDefault → matchPriority → createdAt 優先（Phase 2 規則引擎再依
 * proposalType / 金額門檻細分）。找不到則回傳 null（呼叫端走 Q-D 舊單階段 fallback）。
 */
async function resolveWorkflow(prisma: Prisma.TransactionClient) {
  const workflows = await prisma.approvalWorkflow.findMany({
    where: { isActive: true },
    include: { steps: { orderBy: { sequence: 'asc' } } },
    orderBy: [
      { isDefault: 'desc' },
      { matchPriority: 'desc' },
      { createdAt: 'desc' },
    ],
  });
  return workflows.find((w) => w.steps.length > 0) ?? null;
}

/**
 * FEAT-014 / CHANGE-047: 通知某步驟的審批者「提案已進入需你審批的步驟」
 * - 指定用戶步驟（approverUserId 有值）→ 僅通知該用戶
 * - 角色步驟（approverRoleId 有值）→ 通知該角色全體
 * 重用已註冊的 PROPOSAL_SUBMITTED 類型（避免發送未註冊類型）。
 */
async function notifyStepApprovers(
  tx: Prisma.TransactionClient,
  opts: {
    proposalId: string;
    proposalTitle: string;
    approverRoleId: number | null;
    approverUserId: string | null;
    submitterName?: string | null;
  }
): Promise<void> {
  const approvers =
    opts.approverUserId != null
      ? [{ id: opts.approverUserId }]
      : opts.approverRoleId != null
      ? await tx.user.findMany({
          where: { roleId: opts.approverRoleId },
          select: { id: true },
        })
      : [];
  if (approvers.length === 0) return;

  await tx.notification.createMany({
    data: approvers.map((u) => ({
      userId: u.id,
      type: 'PROPOSAL_SUBMITTED',
      title: '預算提案待您審批',
      message: `${opts.submitterName || '提案人'} 的預算提案「${opts.proposalTitle}」已進入需要您審批的步驟。`,
      link: `/proposals/${opts.proposalId}`,
      entityType: 'PROPOSAL',
      entityId: opts.proposalId,
    })),
  });
}

/**
 * CHANGE-052: 核准回寫 — 依提案綁定的目標（Project 或 OMExpense）寫入核准金額。
 * - Project：approvedBudget + status='InProgress'（沿用既有行為）
 * - OMExpense：approvedBudget + approvalStatus='Approved'
 * 二者皆為 null（理論上不會發生）時不做任何事。
 */
async function applyApprovalWriteback(
  tx: Prisma.TransactionClient,
  target: { projectId: string | null; omExpenseId: string | null },
  approvedAmount: number
): Promise<void> {
  if (target.projectId) {
    await tx.project.update({
      where: { id: target.projectId },
      data: { approvedBudget: approvedAmount, status: 'InProgress' },
    });
  } else if (target.omExpenseId) {
    await tx.oMExpense.update({
      where: { id: target.omExpenseId },
      data: { approvedBudget: approvedAmount, approvalStatus: 'Approved' },
    });
  }
}

/**
 * FEAT-014: 載入提案的「當前審批步驟」並做角色檢查（approveStep/rejectStep/requestMoreInfoStep 共用）
 *
 * 錯誤以 cause.reason 帶穩定識別碼（backend-api.md 規則：前端依 reason 分支，非比對 message）：
 * - NOT_WORKFLOW_PROPOSAL：提案未綁定流程（應走舊單階段 approve）
 * - NOT_PENDING：提案非待審批狀態
 * - STEP_NOT_FOUND：找不到當前步驟進度（資料異常）
 * - NOT_YOUR_STEP：登入者非當前步驟審批者（角色不符，或指定用戶非本人）
 */
async function loadCurrentStep(
  prisma: Prisma.TransactionClient,
  proposalId: string,
  acting: { userId: string; roleId: number }
) {
  const proposal = await prisma.budgetProposal.findUnique({
    where: { id: proposalId },
    include: {
      // CHANGE-052: 不再需要 project（通知改用 ownerId，回寫改用 projectId/omExpenseId 標量）
      approvalProgress: { orderBy: { sequence: 'asc' } },
    },
  });

  if (!proposal) {
    throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該預算提案' });
  }
  if (proposal.workflowId == null || proposal.currentStepSequence == null) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '此提案未綁定審批流程，請使用單階段審批',
      cause: { reason: 'NOT_WORKFLOW_PROPOSAL' },
    });
  }
  if (proposal.status !== 'PendingApproval') {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '只有待審批狀態的提案可以進行審批',
      cause: { reason: 'NOT_PENDING' },
    });
  }
  const currentProgress = proposal.approvalProgress.find(
    (p) => p.sequence === proposal.currentStepSequence
  );
  if (!currentProgress) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: '找不到當前審批步驟的進度記錄',
      cause: { reason: 'STEP_NOT_FOUND' },
    });
  }
  // CHANGE-047: 指定用戶步驟 → 比對本人；角色步驟 → 比對角色
  const allowed =
    currentProgress.approverUserId != null
      ? acting.userId === currentProgress.approverUserId
      : acting.roleId === currentProgress.approverRoleId;
  if (!allowed) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: '您不是當前審批步驟的指定審批者',
      cause: { reason: 'NOT_YOUR_STEP' },
    });
  }
  return { proposal, currentProgress };
}

/**
 * 預算提案狀態枚舉
 */
const ProposalStatus = z.enum([
  'Draft',
  'PendingApproval',
  'Approved',
  'Rejected',
  'MoreInfoRequired',
]);

/**
 * BudgetProposal 輸入驗證 Schema
 */
// CHANGE-043: 提案類型（Budget Proposal / 付款），暫為純選擇欄位（未連 Expense）
const proposalTypeEnum = z.enum(['BudgetProposal', 'Payment']);

// CHANGE-052: 多態目標 — 提案綁定 Project 或 OMExpense（二擇一 XOR）
const budgetProposalCreateInputSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('Project'),
    title: z.string().min(1, '標題為必填欄位'),
    amount: z.number().positive('金額必須大於0'),
    projectId: z.string().min(1, '專案ID為必填'),
  }),
  z.object({
    targetType: z.literal('OMExpense'),
    title: z.string().min(1, '標題為必填欄位'),
    amount: z.number().positive('金額必須大於0'),
    omExpenseId: z.string().min(1, 'OM 費用 ID 為必填'),
  }),
]);

const budgetProposalUpdateInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  title: z.string().min(1, '標題不能為空').optional(),
  amount: z.number().positive('金額必須大於0').optional(),
});

const budgetProposalSubmitInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
});

const budgetProposalApprovalInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  action: z.enum(['Approved', 'Rejected', 'MoreInfoRequired']),
  comment: z.string().optional(),
  approvedAmount: z.number().min(0, '批准金額必須大於等於0').optional(), // Module 2/3 新增：批准的預算金額
});

const commentInputSchema = z.object({
  budgetProposalId: z.string().min(1, '無效的提案ID'),
  content: z.string().min(1, '評論內容不能為空'),
});

// FEAT-014: 序列審批步驟操作 Schema
const approveStepInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  comment: z.string().optional(),
  // 僅最末步核准時採用；前面步驟忽略此值（最末步通過才整案 Approved 並寫入 Project.approvedBudget）
  approvedAmount: z.number().min(0, '批准金額必須大於等於0').optional(),
});

const rejectStepInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  reason: z.string().min(1, '駁回原因為必填'),
});

const requestMoreInfoStepInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  comment: z.string().min(1, '補件說明為必填'),
});

/**
 * BudgetProposal Router
 */
export const budgetProposalRouter = createTRPCRouter({
  /**
   * 取得所有預算提案（支援分頁）
   * FIX-112: 新增分頁支援，避免大量資料一次載入
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          status: ProposalStatus.optional(),
          projectId: z.string().min(1).optional(),
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where = {
        ...(input?.status && { status: input.status }),
        ...(input?.projectId && { projectId: input.projectId }),
        ...(input?.search && {
          OR: [
            { title: { contains: input.search, mode: 'insensitive' as const } },
            { project: { name: { contains: input.search, mode: 'insensitive' as const } } },
            // CHANGE-052: 也可依 OM 費用名稱搜尋
            { omExpense: { name: { contains: input.search, mode: 'insensitive' as const } } },
          ],
        }),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.budgetProposal.findMany({
          where,
          skip,
          take: limit,
          include: {
            project: {
              include: {
                manager: { select: safeUserSelect },
                supervisor: { select: safeUserSelect },
                budgetPool: true,
                currency: true, // FEAT-002: Include project currency
              },
            },
            omExpense: true, // CHANGE-052: 多態目標
            comments: {
              include: {
                user: { select: safeUserSelect },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            historyItems: {
              include: {
                user: { select: safeUserSelect },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        }),
        ctx.prisma.budgetProposal.count({ where }),
      ]);

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * 根據 ID 取得預算提案
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, '無效的提案ID'),
      })
    )
    .query(async ({ ctx, input }) => {
      const proposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
        include: {
          project: {
            include: {
              manager: { select: safeUserSelect },
              supervisor: { select: safeUserSelect },
              budgetPool: true,
              currency: true, // FEAT-002: Include project currency
            },
          },
          omExpense: true, // CHANGE-052: 多態目標
          vendor: true, // CHANGE-043: Pay to
          // FEAT-014 / CHANGE-047: 審批流程 + 各步驟進度（提案詳情頁時間線；步驟審批者可為角色或指定用戶）
          workflow: {
            include: {
              steps: {
                include: { role: true, approverUser: { select: safeUserSelect } },
                orderBy: { sequence: 'asc' },
              },
            },
          },
          approvalProgress: {
            orderBy: { sequence: 'asc' },
            include: {
              step: { include: { role: true, approverUser: { select: safeUserSelect } } },
              approver: { select: safeUserSelect }, // 實際決策者
              designatedApprover: { select: safeUserSelect }, // CHANGE-047: 指定審批者
            },
          },
          comments: {
            include: {
              user: { select: safeUserSelect },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          historyItems: {
            include: {
              user: { select: safeUserSelect },
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!proposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      // FIX-150 (SR-04) / CHANGE-052: 資源所有權檢查改用 proposal.ownerId（脫離 project）
      assertCanRead(proposal.ownerId, ctx, '此提案');

      return proposal;
    }),

  /**
   * 建立預算提案（預設 Draft 狀態）
   */
  create: protectedProcedure
    .input(budgetProposalCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // CHANGE-052: 依目標類型驗證對應對象存在
      if (input.targetType === 'Project') {
        const project = await ctx.prisma.project.findUnique({
          where: { id: input.projectId },
        });
        if (!project) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該專案' });
        }
      } else {
        const omExpense = await ctx.prisma.oMExpense.findUnique({
          where: { id: input.omExpenseId },
        });
        if (!omExpense) {
          throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該 OM 費用' });
        }
      }

      const proposal = await ctx.prisma.budgetProposal.create({
        data: {
          title: input.title,
          amount: input.amount,
          // CHANGE-052: 二擇一綁定 + 擁有者（授權錨點）
          ...(input.targetType === 'Project'
            ? { projectId: input.projectId }
            : { omExpenseId: input.omExpenseId }),
          ownerId: ctx.session.user.id,
          status: 'Draft',
        },
        include: {
          project: {
            include: {
              manager: { select: safeUserSelect },
              supervisor: { select: safeUserSelect },
              budgetPool: true,
            },
          },
          omExpense: true, // CHANGE-052
        },
      });

      return proposal;
    }),

  /**
   * 更新預算提案（僅 Draft 或 MoreInfoRequired 狀態可編輯）
   */
  update: protectedProcedure
    .input(budgetProposalUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 檢查提案狀態
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: id,
        },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      // FIX-150 (SR-04) / CHANGE-052: 資源所有權檢查改用 proposal.ownerId
      assertCanMutate(existingProposal.ownerId, ctx, '此提案');

      if (
        existingProposal.status !== 'Draft' &&
        existingProposal.status !== 'MoreInfoRequired'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只有草稿或需要更多資訊狀態的提案可以編輯',
        });
      }

      const proposal = await ctx.prisma.budgetProposal.update({
        where: {
          id: id,
        },
        data: updateData,
        include: {
          project: {
            include: {
              manager: { select: safeUserSelect },
              supervisor: { select: safeUserSelect },
              budgetPool: true,
            },
          },
          omExpense: true, // CHANGE-052
        },
      });

      return proposal;
    }),

  /**
   * 提交提案審批（Draft/MoreInfoRequired → PendingApproval）
   *
   * FEAT-014:
   * - 首次提交：解析適用的審批流程（Q-B 快照綁定）→ 建立各步驟 progress →
   *   currentStepSequence = 第一步 → 通知第一步角色。無 active 流程則走 Q-D 舊單階段 fallback。
   * - 重新提交（補件後、已綁定流程）：回到原步驟續走（Q-A），不重建 progress、
   *   currentStepSequence 不變、前面步驟維持 Approved。
   */
  submit: protectedProcedure
    .input(budgetProposalSubmitInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: { id: input.id },
        include: { project: true },
      });

      if (!existingProposal) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '找不到該預算提案' });
      }

      // FIX-150 (SR-04) / CHANGE-052: 資源所有權檢查改用 proposal.ownerId
      assertCanMutate(existingProposal.ownerId, ctx, '此提案');

      if (
        existingProposal.status !== 'Draft' &&
        existingProposal.status !== 'MoreInfoRequired'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只有草稿或需要更多資訊狀態的提案可以提交',
        });
      }

      const submitter = await ctx.prisma.user.findUnique({
        where: { id: ctx.session.user.id },
        select: { name: true },
      });

      // Q-A: 重新提交（已在流程中）→ 回到原步驟續走，不重建 progress
      const isResubmitIntoWorkflow =
        existingProposal.workflowId != null &&
        existingProposal.currentStepSequence != null;

      if (isResubmitIntoWorkflow) {
        return ctx.prisma.$transaction(async (tx) => {
          const proposal = await tx.budgetProposal.update({
            where: { id: input.id },
            data: { status: 'PendingApproval' },
            include: proposalApprovalInclude,
          });
          await tx.history.create({
            data: {
              action: 'SUBMITTED',
              details: `提案已重新提交，回到第 ${existingProposal.currentStepSequence} 步審批`,
              userId: ctx.session.user.id,
              budgetProposalId: input.id,
            },
          });
          const currentProgress = proposal.approvalProgress.find(
            (p) => p.sequence === existingProposal.currentStepSequence
          );
          if (currentProgress) {
            await notifyStepApprovers(tx, {
              proposalId: proposal.id,
              proposalTitle: proposal.title,
              approverRoleId: currentProgress.approverRoleId,
              approverUserId: currentProgress.approverUserId,
              submitterName: submitter?.name,
            });
          }
          return proposal;
        });
      }

      // 首次提交：解析適用流程
      const workflow = await resolveWorkflow(ctx.prisma);

      const firstStep = workflow?.steps[0];

      // CHANGE-052 (D2): OM 提案必須走審批流程；無 active workflow 時直接擋下（不進 legacy fallback）
      if ((!workflow || !firstStep) && existingProposal.omExpenseId != null) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '此 OM 費用提案需要啟用的審批流程才能提交，請先設定審批流程',
          cause: { reason: 'OM_PROPOSAL_REQUIRES_WORKFLOW' },
        });
      }

      return ctx.prisma.$transaction(async (tx) => {
        if (workflow && firstStep) {
          const proposal = await tx.budgetProposal.update({
            where: { id: input.id },
            data: {
              status: 'PendingApproval',
              workflowId: workflow.id,
              currentStepSequence: firstStep.sequence,
            },
          });
          // 建立各步驟 progress（快照 sequence + approverRoleId，Q-B）
          await tx.proposalApprovalProgress.createMany({
            data: workflow.steps.map((s) => ({
              budgetProposalId: proposal.id,
              stepId: s.id,
              sequence: s.sequence,
              approverRoleId: s.approverRoleId,
              approverUserId: s.approverUserId, // CHANGE-047: 快照指定用戶
              status: 'Pending',
            })),
          });
          await tx.history.create({
            data: {
              action: 'SUBMITTED',
              details: `提案已提交審批（流程：${workflow.name}）`,
              userId: ctx.session.user.id,
              budgetProposalId: input.id,
            },
          });
          await notifyStepApprovers(tx, {
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            approverRoleId: firstStep.approverRoleId,
            approverUserId: firstStep.approverUserId,
            submitterName: submitter?.name,
          });
          return tx.budgetProposal.findUnique({
            where: { id: proposal.id },
            include: proposalApprovalInclude,
          });
        }

        // Q-D fallback: 無 active 流程 → 舊單階段（通知專案 supervisor）
        const proposal = await tx.budgetProposal.update({
          where: { id: input.id },
          data: { status: 'PendingApproval' },
          include: proposalApprovalInclude,
        });
        await tx.history.create({
          data: {
            action: 'SUBMITTED',
            details: '提案已提交審批',
            userId: ctx.session.user.id,
            budgetProposalId: input.id,
          },
        });
        // CHANGE-052: 僅「綁 Project」提案會走到 legacy fallback（OM 提案已於上方擋下）
        if (proposal.project) {
          await tx.notification.create({
            data: {
              userId: proposal.project.supervisorId,
              type: 'PROPOSAL_SUBMITTED',
              title: '新的預算提案待審批',
              message: `${submitter?.name || '專案經理'} 提交了預算提案「${proposal.title}」，請審核。`,
              link: `/proposals/${proposal.id}`,
              entityType: 'PROPOSAL',
              entityId: proposal.id,
            },
          });
        }
        return proposal;
      });
    }),

  /**
   * 審批提案（PendingApproval → Approved/Rejected/MoreInfoRequired）
   */
  approve: supervisorProcedure
    .input(budgetProposalApprovalInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查提案狀態
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      if (existingProposal.status !== 'PendingApproval') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只有待審批狀態的提案可以進行審批',
        });
      }

      // 使用 transaction 確保資料一致性
      const result = await ctx.prisma.$transaction(async (prisma) => {
        // 更新提案狀態
        const proposal = await prisma.budgetProposal.update({
          where: {
            id: input.id,
          },
          data: {
            status: input.action,
            // Module 2/3: 批准時記錄批准金額、批准者、批准時間
            ...(input.action === 'Approved' && {
              approvedAmount: input.approvedAmount || existingProposal.amount,
              approvedBy: ctx.session.user.id,
              approvedAt: new Date(),
            }),
            // 拒絕時記錄原因
            ...(input.action === 'Rejected' && input.comment && {
              rejectionReason: input.comment,
            }),
          },
          include: {
            project: {
              include: {
                manager: { select: safeUserSelect },
                supervisor: { select: safeUserSelect },
                budgetPool: true,
              },
            },
            omExpense: true, // CHANGE-052
          },
        });

        // 記錄歷史
        const historyAction =
          input.action === 'Approved'
            ? 'APPROVED'
            : input.action === 'Rejected'
            ? 'REJECTED'
            : 'MORE_INFO_REQUIRED';

        await prisma.history.create({
          data: {
            action: historyAction,
            details: input.comment || null,
            userId: ctx.session.user.id,
            budgetProposalId: input.id,
          },
        });

        // 如果有評論，也建立評論記錄
        if (input.comment) {
          await prisma.comment.create({
            data: {
              content: input.comment,
              userId: ctx.session.user.id,
              budgetProposalId: input.id,
            },
          });
        }

        // CHANGE-052: 批准時依目標回寫（Project.approvedBudget 或 OMExpense.approvedBudget）
        if (input.action === 'Approved') {
          const approvedAmount = input.approvedAmount || existingProposal.amount;
          await applyApprovalWriteback(prisma, proposal, approvedAmount);
        }

        // Epic 8: 發送通知給 Project Manager
        const reviewer = await prisma.user.findUnique({
          where: { id: ctx.session.user.id },
        });

        const notificationTypeMap = {
          Approved: 'PROPOSAL_APPROVED' as const,
          Rejected: 'PROPOSAL_REJECTED' as const,
          MoreInfoRequired: 'PROPOSAL_MORE_INFO' as const,
        };

        const notificationTitleMap = {
          Approved: '預算提案已批准',
          Rejected: '預算提案已駁回',
          MoreInfoRequired: '預算提案需要補充資訊',
        };

        const notificationMessageMap = {
          Approved: `您的預算提案「${proposal.title}」已被批准${input.approvedAmount ? `，批准金額：$${input.approvedAmount.toLocaleString()}` : ''}。`,
          Rejected: `您的預算提案「${proposal.title}」已被駁回。${input.comment ? `原因：${input.comment}` : ''}`,
          MoreInfoRequired: `您的預算提案「${proposal.title}」需要補充更多資訊。${input.comment ? `說明：${input.comment}` : ''}`,
        };

        // CHANGE-052: 通知提案擁有者（取代 project.managerId，對既有提案等價）
        await prisma.notification.create({
          data: {
            userId: proposal.ownerId,
            type: notificationTypeMap[input.action],
            title: notificationTitleMap[input.action],
            message: notificationMessageMap[input.action],
            link: `/proposals/${proposal.id}`,
            entityType: 'PROPOSAL',
            entityId: proposal.id,
          },
        });

        return proposal;
      });

      return result;
    }),

  // ============================================================
  // FEAT-014: 序列審批執行（綁定 workflow 的提案走此路；未綁定者走上方舊 approve）
  // ============================================================

  /**
   * 核准當前步驟（protectedProcedure + 內部角色比對）
   * 有下一步 → 推進並通知下一步角色；最末步 → 整案 Approved（沿用既有 Project.approvedBudget 更新）
   */
  approveStep: protectedProcedure
    .input(approveStepInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { proposal, currentProgress } = await loadCurrentStep(
        ctx.prisma,
        input.id,
        { userId: ctx.session.user.id, roleId: ctx.session.user.role.id }
      );
      const userId = ctx.session.user.id;
      const reviewer = await ctx.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });

      // 找下一步（序號大於當前且最小者）— 容忍序號空洞
      const nextProgress = proposal.approvalProgress
        .filter((p) => p.sequence > currentProgress.sequence)
        .sort((a, b) => a.sequence - b.sequence)[0];

      return ctx.prisma.$transaction(async (tx) => {
        // 標記當前步驟 Approved
        await tx.proposalApprovalProgress.update({
          where: { id: currentProgress.id },
          data: {
            status: 'Approved',
            approvedByUserId: userId,
            decidedAt: new Date(),
            comment: input.comment ?? null,
          },
        });

        if (nextProgress) {
          // 推進到下一步
          await tx.budgetProposal.update({
            where: { id: proposal.id },
            data: { currentStepSequence: nextProgress.sequence },
          });
          await tx.history.create({
            data: {
              action: 'STEP_APPROVED',
              details: `第 ${currentProgress.sequence} 步已核准，進入第 ${nextProgress.sequence} 步${input.comment ? `。意見：${input.comment}` : ''}`,
              userId,
              budgetProposalId: proposal.id,
            },
          });
          await notifyStepApprovers(tx, {
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            approverRoleId: nextProgress.approverRoleId,
            approverUserId: nextProgress.approverUserId,
            submitterName: reviewer?.name,
          });
        } else {
          // 最末步通過 → 整案 Approved（沿用既有 Project.approvedBudget 更新 + 通知 PM）
          const approvedAmount = input.approvedAmount ?? proposal.amount;
          await tx.budgetProposal.update({
            where: { id: proposal.id },
            data: {
              status: 'Approved',
              approvedAmount,
              approvedBy: userId,
              approvedAt: new Date(),
              currentStepSequence: null,
            },
          });
          // CHANGE-052: 依目標回寫（Project 或 OMExpense）
          await applyApprovalWriteback(tx, proposal, approvedAmount);
          await tx.history.create({
            data: {
              action: 'APPROVED',
              details: `最終核准（第 ${currentProgress.sequence} 步）${input.comment ? `。意見：${input.comment}` : ''}`,
              userId,
              budgetProposalId: proposal.id,
            },
          });
          await tx.notification.create({
            data: {
              userId: proposal.ownerId, // CHANGE-052: 通知提案擁有者
              type: 'PROPOSAL_APPROVED',
              title: '預算提案已批准',
              message: `您的預算提案「${proposal.title}」已完成所有審批步驟並批准，批准金額：$${approvedAmount.toLocaleString()}。`,
              link: `/proposals/${proposal.id}`,
              entityType: 'PROPOSAL',
              entityId: proposal.id,
            },
          });
        }

        return tx.budgetProposal.findUnique({
          where: { id: proposal.id },
          include: proposalApprovalInclude,
        });
      });
    }),

  /**
   * 駁回當前步驟 → 整案 Rejected + 通知提案人（須帶原因）
   */
  rejectStep: protectedProcedure
    .input(rejectStepInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { proposal, currentProgress } = await loadCurrentStep(
        ctx.prisma,
        input.id,
        { userId: ctx.session.user.id, roleId: ctx.session.user.role.id }
      );
      const userId = ctx.session.user.id;

      return ctx.prisma.$transaction(async (tx) => {
        await tx.proposalApprovalProgress.update({
          where: { id: currentProgress.id },
          data: {
            status: 'Rejected',
            approvedByUserId: userId,
            decidedAt: new Date(),
            comment: input.reason,
          },
        });
        await tx.budgetProposal.update({
          where: { id: proposal.id },
          data: {
            status: 'Rejected',
            rejectionReason: input.reason,
            currentStepSequence: null,
          },
        });
        await tx.history.create({
          data: {
            action: 'REJECTED',
            details: `第 ${currentProgress.sequence} 步駁回。原因：${input.reason}`,
            userId,
            budgetProposalId: proposal.id,
          },
        });
        await tx.notification.create({
          data: {
            userId: proposal.ownerId, // CHANGE-052: 通知提案擁有者
            type: 'PROPOSAL_REJECTED',
            title: '預算提案已駁回',
            message: `您的預算提案「${proposal.title}」已被駁回。原因：${input.reason}`,
            link: `/proposals/${proposal.id}`,
            entityType: 'PROPOSAL',
            entityId: proposal.id,
          },
        });
        return tx.budgetProposal.findUnique({
          where: { id: proposal.id },
          include: proposalApprovalInclude,
        });
      });
    }),

  /**
   * 要求補件（Q-A）→ 整案 MoreInfoRequired；當前步驟進度維持 Pending、
   * currentStepSequence 不變。提案人補件重提後回到原步驟續走（前面步驟維持 Approved）。
   */
  requestMoreInfoStep: protectedProcedure
    .input(requestMoreInfoStepInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { proposal, currentProgress } = await loadCurrentStep(
        ctx.prisma,
        input.id,
        { userId: ctx.session.user.id, roleId: ctx.session.user.role.id }
      );
      const userId = ctx.session.user.id;

      return ctx.prisma.$transaction(async (tx) => {
        // 整案退回補件；不更動 progress（保持 Pending、currentStepSequence 不變）— Q-A
        await tx.budgetProposal.update({
          where: { id: proposal.id },
          data: { status: 'MoreInfoRequired' },
        });
        await tx.history.create({
          data: {
            action: 'MORE_INFO_REQUIRED',
            details: `第 ${currentProgress.sequence} 步要求補件。說明：${input.comment}`,
            userId,
            budgetProposalId: proposal.id,
          },
        });
        await tx.notification.create({
          data: {
            userId: proposal.ownerId, // CHANGE-052: 通知提案擁有者
            type: 'PROPOSAL_MORE_INFO',
            title: '預算提案需要補充資訊',
            message: `您的預算提案「${proposal.title}」需要補充資訊。說明：${input.comment}`,
            link: `/proposals/${proposal.id}`,
            entityType: 'PROPOSAL',
            entityId: proposal.id,
          },
        });
        return tx.budgetProposal.findUnique({
          where: { id: proposal.id },
          include: proposalApprovalInclude,
        });
      });
    }),

  /**
   * 待我審批（R11 / CHANGE-047）：當前步驟之審批者 == 登入者 且狀態 Pending 的提案。
   * 涵蓋兩種步驟：指定用戶（approverUserId == 本人）與角色（approverUserId 為 null 且 approverRoleId == 本人角色）。
   */
  getPendingForMe: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const roleId = ctx.session.user.role.id;
    const candidates = await ctx.prisma.budgetProposal.findMany({
      where: {
        status: 'PendingApproval',
        workflowId: { not: null },
        approvalProgress: {
          some: {
            status: 'Pending',
            OR: [
              { approverUserId: userId },
              { approverUserId: null, approverRoleId: roleId },
            ],
          },
        },
      },
      include: proposalApprovalInclude,
      orderBy: { updatedAt: 'desc' },
    });
    // 僅保留「當前步驟」即指向登入者（指定用戶本人，或其角色）者
    return candidates.filter((p) => {
      const current = p.approvalProgress.find(
        (pr) => pr.sequence === p.currentStepSequence
      );
      if (current == null || current.status !== 'Pending') return false;
      return current.approverUserId != null
        ? current.approverUserId === userId
        : current.approverRoleId === roleId;
    });
  }),

  /**
   * 全部尚未批准綜覽（R12，Supervisor/Admin）
   */
  getAllPending: supervisorProcedure.query(async ({ ctx }) => {
    return ctx.prisma.budgetProposal.findMany({
      where: { status: 'PendingApproval' },
      include: proposalApprovalInclude,
      orderBy: { updatedAt: 'desc' },
    });
  }),

  /**
   * 新增評論
   */
  addComment: protectedProcedure
    .input(commentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          userId: ctx.session.user.id,
          budgetProposalId: input.budgetProposalId,
        },
        include: {
          user: { select: safeUserSelect },
        },
      });

      return comment;
    }),

  /**
   * Module 3: 上傳提案文件
   * 用於上傳項目計劃書 PDF/PPT 文件
   */
  uploadProposalFile: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().min(1, '無效的提案ID'),
        filePath: z.string().min(1, '文件路徑為必填'),
        fileName: z.string().min(1, '文件名稱為必填'),
        fileSize: z.number().int().positive('文件大小必須為正整數'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 檢查提案是否存在
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.proposalId,
        },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      // 更新提案文件資訊
      const proposal = await ctx.prisma.budgetProposal.update({
        where: {
          id: input.proposalId,
        },
        data: {
          proposalFilePath: input.filePath,
          proposalFileName: input.fileName,
          proposalFileSize: input.fileSize,
        },
        include: {
          project: {
            include: {
              manager: { select: safeUserSelect },
              supervisor: { select: safeUserSelect },
              budgetPool: true,
            },
          },
          omExpense: true, // CHANGE-052
        },
      });

      return proposal;
    }),

  /**
   * Module 3: 更新會議記錄
   * 用於記錄提案介紹會議的日期、記錄和介紹人員
   */
  updateMeetingNotes: protectedProcedure
    .input(
      z.object({
        proposalId: z.string().min(1, '無效的提案ID'),
        meetingDate: z.string().min(1, '會議日期為必填'),
        meetingNotes: z.string().min(1, '會議記錄為必填'),
        presentedBy: z.string().optional(),
        // CHANGE-043: 會議記錄擴充欄位
        proposalType: proposalTypeEnum.optional(),
        vendorId: z.string().nullable().optional(), // Pay to（null 表示清除）
        reviewNotes: z.string().optional(), // Review notes / action items
        documentLink: z
          .string()
          .url('請輸入有效的網址（需含 http(s)://）')
          .or(z.literal(''))
          .optional(), // Docuware 連結
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 檢查提案是否存在
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.proposalId,
        },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      // 更新會議記錄
      const proposal = await ctx.prisma.budgetProposal.update({
        where: {
          id: input.proposalId,
        },
        data: {
          meetingDate: new Date(input.meetingDate),
          meetingNotes: input.meetingNotes,
          presentedBy: input.presentedBy,
          // CHANGE-043: 會議記錄擴充欄位
          proposalType: input.proposalType,
          vendorId: input.vendorId,
          reviewNotes: input.reviewNotes,
          documentLink: input.documentLink,
        },
        include: {
          project: {
            include: {
              manager: { select: safeUserSelect },
              supervisor: { select: safeUserSelect },
              budgetPool: true,
            },
          },
          omExpense: true, // CHANGE-052
          vendor: true, // CHANGE-043
        },
      });

      return proposal;
    }),

  /**
   * 刪除預算提案（僅 Draft 狀態可刪除）
   * CHANGE-017: 新增權限檢查 - 僅建立者或 Admin 可刪除
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, '無效的提案ID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 檢查提案（CHANGE-052: 權限改用 ownerId，無需 include project）
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      if (existingProposal.status !== 'Draft') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有草稿狀態的提案可以刪除',
        });
      }

      // CHANGE-017 / CHANGE-052: 檢查權限 - 僅擁有者或 Admin 可刪除
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role.name;
      const isOwner = existingProposal.ownerId === userId;
      const isAdmin = userRole === 'Admin';

      if (!isOwner && !isAdmin) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '您沒有權限刪除此提案（僅建立者或管理員可刪除）',
        });
      }

      // 使用 transaction 確保原子性：先刪除相關記錄，再刪除提案
      await ctx.prisma.$transaction(async (tx) => {
        // Step 1: 刪除相關的 History 記錄
        await tx.history.deleteMany({
          where: { budgetProposalId: input.id },
        });

        // Step 2: 刪除相關的 Comment 記錄
        await tx.comment.deleteMany({
          where: { budgetProposalId: input.id },
        });

        // Step 3: 刪除提案
        await tx.budgetProposal.delete({
          where: { id: input.id },
        });
      });

      return { success: true };
    }),

  /**
   * 批量刪除預算提案（僅 Draft 狀態可刪除）
   * CHANGE-017: 新增批量刪除功能
   */
  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().min(1)).min(1, '請選擇要刪除的提案'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const userRole = ctx.session.user.role.name;
      const isAdmin = userRole === 'Admin';

      // 查詢所有要刪除的提案（CHANGE-052: 權限改用 ownerId，無需 include project）
      const proposals = await ctx.prisma.budgetProposal.findMany({
        where: {
          id: { in: input.ids },
        },
      });

      // 檢查是否所有提案都存在
      if (proposals.length !== input.ids.length) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '部分提案不存在',
        });
      }

      // 檢查所有提案是否都是 Draft 狀態
      const nonDraftProposals = proposals.filter(p => p.status !== 'Draft');
      if (nonDraftProposals.length > 0) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `以下提案不是草稿狀態，無法刪除：${nonDraftProposals.map(p => p.title).join(', ')}`,
        });
      }

      // 檢查權限 - 僅建立者或 Admin 可刪除
      if (!isAdmin) {
        const unauthorizedProposals = proposals.filter(p => p.ownerId !== userId);
        if (unauthorizedProposals.length > 0) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: `您沒有權限刪除以下提案：${unauthorizedProposals.map(p => p.title).join(', ')}`,
          });
        }
      }

      // 使用 transaction 確保原子性：先刪除相關記錄，再刪除提案
      const result = await ctx.prisma.$transaction(async (tx) => {
        // Step 1: 刪除相關的 History 記錄
        await tx.history.deleteMany({
          where: { budgetProposalId: { in: input.ids } },
        });

        // Step 2: 刪除相關的 Comment 記錄
        await tx.comment.deleteMany({
          where: { budgetProposalId: { in: input.ids } },
        });

        // Step 3: 批量刪除提案
        const deleteResult = await tx.budgetProposal.deleteMany({
          where: { id: { in: input.ids } },
        });

        return deleteResult;
      });

      return { success: true, deletedCount: result.count };
    }),

  // ============================================================
  // CHANGE-018: 狀態回退功能
  // ============================================================
  /**
   * 回退提案到草稿狀態
   * @description 將 PendingApproval/Approved/Rejected/MoreInfoRequired 狀態的提案回退到 Draft
   * @permission Admin 或 Supervisor 可執行
   * @param id - 提案 ID
   * @param reason - 回退原因（必填）
   */
  revertToDraft: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, '無效的提案ID'),
        reason: z.string().min(1, '回退原因為必填'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. 檢查權限：Admin 或 Supervisor
      const userRole = ctx.session.user.role.name;
      if (userRole !== 'Admin' && userRole !== 'Supervisor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '只有管理員或主管可以執行此操作',
        });
      }

      // 2. 檢查提案存在（CHANGE-052: 回退僅用標量 projectId/omExpenseId，無需 include project）
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: { id: input.id },
      });

      if (!existingProposal) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '提案不存在',
        });
      }

      // 3. 檢查狀態（Draft 不需要回退）
      if (existingProposal.status === 'Draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '提案已是草稿狀態，無需回退',
        });
      }

      // 4. 記錄原狀態用於歷史記錄
      const originalStatus = existingProposal.status;

      // 5. 執行回退（使用 transaction 確保資料一致性）
      const result = await ctx.prisma.$transaction(async (tx) => {
        // 5a. 更新提案狀態
        const updatedProposal = await tx.budgetProposal.update({
          where: { id: input.id },
          data: {
            status: 'Draft',
            // 清除審批相關欄位
            approvedAmount: null,
            approvedBy: null,
            approvedAt: null,
            rejectionReason: null,
          },
          include: {
            project: {
              include: {
                manager: { select: safeUserSelect },
                supervisor: { select: safeUserSelect },
                budgetPool: true,
              },
            },
            omExpense: true, // CHANGE-052
            comments: {
              include: { user: { select: safeUserSelect } },
              orderBy: { createdAt: 'desc' },
            },
            historyItems: {
              include: { user: { select: safeUserSelect } },
              orderBy: { createdAt: 'desc' },
            },
          },
        });

        // 5b. 記錄歷史
        await tx.history.create({
          data: {
            action: 'REVERTED_TO_DRAFT',
            details: `從「${originalStatus}」回退到「Draft」。原因：${input.reason}`,
            user: {
              connect: { id: ctx.session.user.id },
            },
            budgetProposal: {
              connect: { id: input.id },
            },
          },
        });

        // 5c. CHANGE-052: 原狀態 Approved → 依目標（Project 或 OMExpense）扣回已核准金額
        if (originalStatus === 'Approved' && existingProposal.approvedAmount) {
          const revertAmount = existingProposal.approvedAmount;
          if (existingProposal.projectId) {
            await tx.project.update({
              where: { id: existingProposal.projectId },
              data: { approvedBudget: { decrement: revertAmount } },
            });
          } else if (existingProposal.omExpenseId) {
            await tx.oMExpense.update({
              where: { id: existingProposal.omExpenseId },
              data: { approvedBudget: { decrement: revertAmount } },
            });
          }
        }

        // FIX-008 / CHANGE-052: 若目標已無其他已批准提案，回退目標狀態
        if (originalStatus === 'Approved') {
          if (existingProposal.projectId) {
            const otherApprovedProposals = await tx.budgetProposal.count({
              where: {
                projectId: existingProposal.projectId,
                status: 'Approved',
                id: { not: input.id }, // 排除當前正在回退的提案
              },
            });
            // 如果沒有其他已批准的提案，將專案狀態回退到 Draft
            if (otherApprovedProposals === 0) {
              await tx.project.update({
                where: { id: existingProposal.projectId },
                data: { status: 'Draft' },
              });
            }
          } else if (existingProposal.omExpenseId) {
            const otherApprovedProposals = await tx.budgetProposal.count({
              where: {
                omExpenseId: existingProposal.omExpenseId,
                status: 'Approved',
                id: { not: input.id },
              },
            });
            // 沒有其他已批准提案 → 清除 OM 費用的核准狀態
            if (otherApprovedProposals === 0) {
              await tx.oMExpense.update({
                where: { id: existingProposal.omExpenseId },
                data: { approvalStatus: null },
              });
            }
          }
        }

        return updatedProposal;
      });

      return result;
    }),
});
