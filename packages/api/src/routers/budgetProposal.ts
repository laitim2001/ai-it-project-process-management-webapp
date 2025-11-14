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
 * - delete: 刪除提案（Draft only）
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
          search: z.string().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const proposals = await ctx.prisma.budgetProposal.findMany({
        where: {
          ...(input?.status && { status: input.status }),
          ...(input?.projectId && { projectId: input.projectId }),
          ...(input?.search && {
            OR: [
              { title: { contains: input.search, mode: 'insensitive' } },
              { project: { name: { contains: input.search, mode: 'insensitive' } } },
            ],
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該專案',
        });
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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

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
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該預算提案',
        });
      }

      if (
        existingProposal.status !== 'Draft' &&
        existingProposal.status !== 'MoreInfoRequired'
      ) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '只有草稿或需要更多資訊狀態的提案可以提交',
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

      await ctx.prisma.budgetProposal.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),
});
