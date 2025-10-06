/**
 * Notification Router
 * Epic 8 - Story 8.2: 通知系統 API 路由
 *
 * 功能:
 * - 獲取用戶通知列表 (分頁、篩選)
 * - 標記通知為已讀
 * - 刪除通知
 * - 創建通知 (內部方法，供其他服務調用)
 */

import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { emailService } from "../lib/email";

/**
 * 通知類型枚舉
 */
export const NotificationType = z.enum([
  "PROPOSAL_SUBMITTED",
  "PROPOSAL_APPROVED",
  "PROPOSAL_REJECTED",
  "PROPOSAL_MORE_INFO",
  "EXPENSE_SUBMITTED",
  "EXPENSE_APPROVED",
]);

/**
 * 實體類型枚舉
 */
export const EntityType = z.enum([
  "PROPOSAL",
  "EXPENSE",
  "PROJECT",
]);

export const notificationRouter = createTRPCRouter({
  /**
   * 獲取當前用戶的通知列表
   * 支持分頁和已讀/未讀篩選
   */
  getAll: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(20), // 每頁數量
        cursor: z.string().optional(), // 分頁游標 (通知 ID)
        isRead: z.boolean().optional(), // 篩選: 已讀/未讀 (undefined = 全部)
      })
    )
    .query(async ({ ctx, input }) => {
      const { limit, cursor, isRead } = input;
      const userId = ctx.session.user.id;

      // 構建查詢條件
      const where = {
        userId,
        ...(isRead !== undefined && { isRead }),
      };

      // 查詢通知列表
      const notifications = await ctx.db.notification.findMany({
        where,
        take: limit + 1, // 多取一條用於判斷是否有下一頁
        cursor: cursor ? { id: cursor } : undefined,
        orderBy: {
          createdAt: "desc", // 最新的通知排在前面
        },
      });

      // 判斷是否有下一頁
      let nextCursor: string | undefined = undefined;
      if (notifications.length > limit) {
        const nextItem = notifications.pop(); // 移除多取的一條
        nextCursor = nextItem?.id;
      }

      return {
        notifications,
        nextCursor,
      };
    }),

  /**
   * 獲取單個通知詳情
   */
  getById: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId, // 確保只能查詢自己的通知
        },
      });

      if (!notification) {
        throw new Error("通知不存在或無權訪問");
      }

      return notification;
    }),

  /**
   * 獲取未讀通知數量
   */
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const count = await ctx.db.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    return { count };
  }),

  /**
   * 標記單個通知為已讀
   */
  markAsRead: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 確保只能標記自己的通知
      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!notification) {
        throw new Error("通知不存在或無權訪問");
      }

      // 更新為已讀
      const updated = await ctx.db.notification.update({
        where: { id: input.id },
        data: { isRead: true },
      });

      return updated;
    }),

  /**
   * 標記所有通知為已讀
   */
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    const result = await ctx.db.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return { count: result.count };
  }),

  /**
   * 刪除單個通知
   */
  delete: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // 確保只能刪除自己的通知
      const notification = await ctx.db.notification.findFirst({
        where: {
          id: input.id,
          userId,
        },
      });

      if (!notification) {
        throw new Error("通知不存在或無權訪問");
      }

      await ctx.db.notification.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),

  /**
   * 創建通知 (內部方法)
   * 此方法供其他服務調用，例如 Proposal/Expense 狀態變更時
   *
   * 功能:
   * 1. 在數據庫創建通知記錄
   * 2. 發送郵件通知
   */
  create: protectedProcedure
    .input(
      z.object({
        userId: z.string().uuid(), // 接收通知的用戶 ID
        type: NotificationType, // 通知類型
        title: z.string().min(1), // 通知標題
        message: z.string().min(1), // 通知內容
        link: z.string().optional(), // 相關頁面連結
        entityType: EntityType.optional(), // 關聯實體類型
        entityId: z.string().uuid().optional(), // 關聯實體 ID
        sendEmail: z.boolean().default(true), // 是否發送郵件
        emailData: z.any().optional(), // 郵件數據 (傳遞給 emailService)
      })
    )
    .mutation(async ({ ctx, input }) => {
      const {
        userId,
        type,
        title,
        message,
        link,
        entityType,
        entityId,
        sendEmail,
        emailData,
      } = input;

      // 1. 創建通知記錄
      const notification = await ctx.db.notification.create({
        data: {
          userId,
          type,
          title,
          message,
          link,
          entityType,
          entityId,
          emailSent: false, // 初始狀態為未發送
        },
      });

      // 2. 發送郵件通知 (如果需要)
      if (sendEmail && emailData) {
        try {
          // 獲取用戶郵箱
          const user = await ctx.db.user.findUnique({
            where: { id: userId },
            select: { email: true },
          });

          if (!user?.email) {
            console.warn(`用戶 ${userId} 沒有郵箱地址，跳過郵件發送`);
            return notification;
          }

          // 根據通知類型發送對應的郵件
          let emailSent = false;

          switch (type) {
            case "PROPOSAL_SUBMITTED":
              emailSent = await emailService.sendProposalSubmittedEmail({
                to: user.email,
                proposalTitle: emailData.proposalTitle,
                proposalLink: emailData.proposalLink,
                submitterName: emailData.submitterName,
                supervisorName: emailData.supervisorName,
              });
              break;

            case "PROPOSAL_APPROVED":
            case "PROPOSAL_REJECTED":
            case "PROPOSAL_MORE_INFO":
              const statusMap = {
                PROPOSAL_APPROVED: "approved" as const,
                PROPOSAL_REJECTED: "rejected" as const,
                PROPOSAL_MORE_INFO: "more_info" as const,
              };
              emailSent = await emailService.sendProposalStatusEmail({
                to: user.email,
                proposalTitle: emailData.proposalTitle,
                proposalLink: emailData.proposalLink,
                status: statusMap[type],
                comment: emailData.comment,
                reviewerName: emailData.reviewerName,
              });
              break;

            case "EXPENSE_SUBMITTED":
              emailSent = await emailService.sendExpenseSubmittedEmail({
                to: user.email,
                expenseAmount: emailData.expenseAmount,
                projectName: emailData.projectName,
                expenseLink: emailData.expenseLink,
                submitterName: emailData.submitterName,
              });
              break;

            case "EXPENSE_APPROVED":
              emailSent = await emailService.sendExpenseApprovedEmail({
                to: user.email,
                expenseAmount: emailData.expenseAmount,
                projectName: emailData.projectName,
                expenseLink: emailData.expenseLink,
              });
              break;

            default:
              console.warn(`未知的通知類型: ${type}`);
          }

          // 更新郵件發送狀態
          if (emailSent) {
            await ctx.db.notification.update({
              where: { id: notification.id },
              data: { emailSent: true },
            });
          }
        } catch (error) {
          console.error("發送郵件失敗:", error);
          // 郵件發送失敗不應阻斷通知創建流程
        }
      }

      return notification;
    }),
});
