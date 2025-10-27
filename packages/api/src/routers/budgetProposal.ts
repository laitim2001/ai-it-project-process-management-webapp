/**
 * BudgetProposal tRPC Router
 *
 * 提供預算提案管理的 API 端點，包含完整的審批工作流
 * - 取得所有提案
 * - 根據 ID 取得提案
 * - 根據專案取得提案
 * - 建立提案（Draft 狀態）
 * - 更新提案
 * - 提交提案（Draft → PendingApproval）
 * - 審批提案（Approved/Rejected/MoreInfoRequired）
 * - 刪除提案
 * - 新增評論
 * - 取得審批歷史
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

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
const budgetProposalCreateInputSchema = z.object({
  title: z.string().min(1, '標題為必填欄位'),
  amount: z.number().positive('金額必須大於0'),
  projectId: z.string().min(1, '專案ID為必填'),
});

const budgetProposalUpdateInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  title: z.string().min(1, '標題不能為空').optional(),
  amount: z.number().positive('金額必須大於0').optional(),
});

const budgetProposalSubmitInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  userId: z.string().min(1, '無效的使用者ID'),
});

const budgetProposalApprovalInputSchema = z.object({
  id: z.string().min(1, '無效的提案ID'),
  userId: z.string().min(1, '無效的使用者ID'),
  action: z.enum(['Approved', 'Rejected', 'MoreInfoRequired']),
  comment: z.string().optional(),
  approvedAmount: z.number().min(0, '批准金額必須大於等於0').optional(), // Module 2/3 新增：批准的預算金額
});

const commentInputSchema = z.object({
  budgetProposalId: z.string().min(1, '無效的提案ID'),
  userId: z.string().min(1, '無效的使用者ID'),
  content: z.string().min(1, '評論內容不能為空'),
});

/**
 * BudgetProposal Router
 */
export const budgetProposalRouter = createTRPCRouter({
  /**
   * 取得所有預算提案
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          status: ProposalStatus.optional(),
          projectId: z.string().min(1).optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const proposals = await ctx.prisma.budgetProposal.findMany({
        where: {
          ...(input?.status && { status: input.status }),
          ...(input?.projectId && { projectId: input.projectId }),
        },
        include: {
          project: {
            include: {
              manager: true,
              supervisor: true,
              budgetPool: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          historyItems: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return proposals;
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
              manager: true,
              supervisor: true,
              budgetPool: true,
            },
          },
          comments: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          historyItems: {
            include: {
              user: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
        },
      });

      if (!proposal) {
        throw new Error('找不到該預算提案');
      }

      return proposal;
    }),

  /**
   * 建立預算提案（預設 Draft 狀態）
   */
  create: protectedProcedure
    .input(budgetProposalCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證專案是否存在
      const project = await ctx.prisma.project.findUnique({
        where: {
          id: input.projectId,
        },
      });

      if (!project) {
        throw new Error('找不到該專案');
      }

      const proposal = await ctx.prisma.budgetProposal.create({
        data: {
          title: input.title,
          amount: input.amount,
          projectId: input.projectId,
          status: 'Draft',
        },
        include: {
          project: {
            include: {
              manager: true,
              supervisor: true,
              budgetPool: true,
            },
          },
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
        throw new Error('找不到該預算提案');
      }

      if (
        existingProposal.status !== 'Draft' &&
        existingProposal.status !== 'MoreInfoRequired'
      ) {
        throw new Error('只有草稿或需要更多資訊狀態的提案可以編輯');
      }

      const proposal = await ctx.prisma.budgetProposal.update({
        where: {
          id: id,
        },
        data: updateData,
        include: {
          project: {
            include: {
              manager: true,
              supervisor: true,
              budgetPool: true,
            },
          },
        },
      });

      return proposal;
    }),

  /**
   * 提交提案審批（Draft/MoreInfoRequired → PendingApproval）
   */
  submit: protectedProcedure
    .input(budgetProposalSubmitInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查提案狀態
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existingProposal) {
        throw new Error('找不到該預算提案');
      }

      if (
        existingProposal.status !== 'Draft' &&
        existingProposal.status !== 'MoreInfoRequired'
      ) {
        throw new Error('只有草稿或需要更多資訊狀態的提案可以提交');
      }

      // 使用 transaction 確保資料一致性
      const result = await ctx.prisma.$transaction(async (prisma) => {
        // 更新提案狀態
        const proposal = await prisma.budgetProposal.update({
          where: {
            id: input.id,
          },
          data: {
            status: 'PendingApproval',
          },
          include: {
            project: {
              include: {
                manager: true,
                supervisor: true,
                budgetPool: true,
              },
            },
          },
        });

        // 記錄歷史
        await prisma.history.create({
          data: {
            action: 'SUBMITTED',
            details: '提案已提交審批',
            userId: input.userId,
            budgetProposalId: input.id,
          },
        });

        // Epic 8: 發送通知給 Supervisor
        const submitter = await prisma.user.findUnique({
          where: { id: input.userId },
        });

        await prisma.notification.create({
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

        return proposal;
      });

      return result;
    }),

  /**
   * 審批提案（PendingApproval → Approved/Rejected/MoreInfoRequired）
   */
  approve: protectedProcedure
    .input(budgetProposalApprovalInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查提案狀態
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existingProposal) {
        throw new Error('找不到該預算提案');
      }

      if (existingProposal.status !== 'PendingApproval') {
        throw new Error('只有待審批狀態的提案可以進行審批');
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
              approvedBy: input.userId,
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
                manager: true,
                supervisor: true,
                budgetPool: true,
              },
            },
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
            userId: input.userId,
            budgetProposalId: input.id,
          },
        });

        // 如果有評論，也建立評論記錄
        if (input.comment) {
          await prisma.comment.create({
            data: {
              content: input.comment,
              userId: input.userId,
              budgetProposalId: input.id,
            },
          });
        }

        // Module 2/3: 批准時同步更新 Project 的 approvedBudget 和狀態
        if (input.action === 'Approved') {
          const approvedAmount = input.approvedAmount || existingProposal.amount;
          await prisma.project.update({
            where: { id: proposal.projectId },
            data: {
              approvedBudget: approvedAmount,
              status: 'InProgress', // 批准後項目變為進行中
            },
          });
        }

        // Epic 8: 發送通知給 Project Manager
        const reviewer = await prisma.user.findUnique({
          where: { id: input.userId },
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

        await prisma.notification.create({
          data: {
            userId: proposal.project.managerId,
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

  /**
   * 新增評論
   */
  addComment: protectedProcedure
    .input(commentInputSchema)
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          content: input.content,
          userId: input.userId,
          budgetProposalId: input.budgetProposalId,
        },
        include: {
          user: true,
        },
      });

      return comment;
    }),

  /**
   * 刪除預算提案（僅 Draft 狀態可刪除）
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, '無效的提案ID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 檢查提案狀態
      const existingProposal = await ctx.prisma.budgetProposal.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!existingProposal) {
        throw new Error('找不到該預算提案');
      }

      if (existingProposal.status !== 'Draft') {
        throw new Error('只有草稿狀態的提案可以刪除');
      }

      await ctx.prisma.budgetProposal.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
