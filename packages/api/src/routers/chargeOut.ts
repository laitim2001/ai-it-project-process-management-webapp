/**
 * @fileoverview ChargeOut Router - 費用轉嫁管理 API
 *
 * @description
 * 提供費用轉嫁（ChargeOut）的完整管理功能，用於將 IT 部門的費用分攤給各營運公司（OpCo）。
 * 採用表頭-明細架構（ChargeOut + ChargeOutItem[]），支援多筆費用批量轉嫁。
 * 實現完整的審批工作流（Draft → Submitted → Confirmed → Paid），並支援主管確認和拒絕操作。
 * 每個 ChargeOutItem 必須關聯一筆已批准的 Expense（requiresChargeOut = true）。
 *
 * @module api/routers/chargeOut
 *
 * @features
 * - 建立 ChargeOut 記錄（表頭 + 明細，批量創建）
 * - 更新 ChargeOut 基本資訊（名稱、描述、Debit Note 編號、日期）
 * - 批量更新明細（支援新增、更新、刪除費用項目）
 * - 提交審核（Draft → Submitted，驗證至少有一個項目）
 * - 主管確認（Submitted → Confirmed，記錄確認者和時間）
 * - 主管拒絕（Submitted → Rejected，記錄拒絕原因）
 * - 標記為已支付（Confirmed → Paid，記錄支付日期）
 * - 查詢 ChargeOut 列表（支援分頁、狀態、OpCo、專案過濾）
 * - 查詢單一 ChargeOut 詳情（含明細、關聯費用、專案、OpCo）
 * - 刪除 ChargeOut（僅 Draft 或 Rejected 狀態可刪除）
 * - 獲取可轉嫁費用列表（requiresChargeOut = true 且已批准）
 *
 * @procedures
 * - create: 建立 ChargeOut（含明細）
 * - update: 更新基本資訊
 * - updateItems: 批量更新明細
 * - submit: 提交審核
 * - confirm: 確認 ChargeOut（Supervisor only）
 * - reject: 拒絕 ChargeOut（Supervisor only）
 * - markAsPaid: 標記為已支付
 * - getById: 查詢單一 ChargeOut
 * - getAll: 查詢 ChargeOut 列表（分頁）
 * - delete: 刪除 ChargeOut
 * - getEligibleExpenses: 獲取可轉嫁費用列表
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 * - TRPCError: 錯誤處理
 *
 * @related
 * - packages/db/prisma/schema.prisma - ChargeOut, ChargeOutItem, Expense 資料模型
 * - packages/api/src/routers/expense.ts - 關聯的費用 Router
 * - packages/api/src/routers/project.ts - 關聯的專案 Router
 * - apps/web/src/app/[locale]/charge-outs/page.tsx - ChargeOut 列表頁面
 *
 * @author IT Department
 * @since Epic 6.5 - ChargeOut Management
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@itpm/db';

/**
 * ChargeOut 狀態枚舉
 */
export const ChargeOutStatusEnum = z.enum([
  'Draft',      // 草稿
  'Submitted',  // 已提交
  'Confirmed',  // 已確認
  'Paid',       // 已支付
  'Rejected',   // 已拒絕
]);

/**
 * ChargeOutItem Schema（明細）
 */
const chargeOutItemSchema = z.object({
  id: z.string().optional(), // 更新時需要
  expenseId: z.string().min(1, 'Expense ID 不能為空'),
  amount: z.number().positive('金額必須大於 0'),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  _delete: z.boolean().optional(), // 標記為刪除（用於批量更新）
});

/**
 * Create ChargeOut Schema
 */
const createChargeOutSchema = z.object({
  name: z.string().min(1, '名稱不能為空').max(200),
  description: z.string().optional(),
  projectId: z.string().min(1, '項目不能為空'),
  opCoId: z.string().min(1, 'OpCo 不能為空'),
  items: z.array(chargeOutItemSchema).min(1, '至少需要一個費用項目'),
});

/**
 * Update ChargeOut Schema
 */
const updateChargeOutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  debitNoteNumber: z.string().optional().nullable(),
  issueDate: z.string().optional().nullable(), // ISO 8601 date string
  paymentDate: z.string().optional().nullable(),
});

/**
 * Update Items Schema
 */
const updateItemsSchema = z.object({
  chargeOutId: z.string().min(1),
  items: z.array(chargeOutItemSchema),
});

export const chargeOutRouter = createTRPCRouter({
  /**
   * 1. create - 創建 ChargeOut（表頭 + 明細）
   *
   * 業務邏輯：
   * - 驗證 Project 和 OpCo 存在性
   * - 驗證所有 Expense 存在且 requiresChargeOut = true
   * - 使用 transaction 創建 ChargeOut + ChargeOutItems
   * - 自動計算 totalAmount（items 的 amount 總和）
   * - 初始狀態為 "Draft"
   */
  create: protectedProcedure
    .input(createChargeOutSchema)
    .mutation(async ({ ctx, input }) => {
      const { name, description, projectId, opCoId, items } = input;

      // 1. 驗證 Project 存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: projectId },
      });
      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `項目不存在 (ID: ${projectId})`,
        });
      }

      // 2. 驗證 OpCo 存在
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: opCoId },
      });
      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `OpCo 不存在 (ID: ${opCoId})`,
        });
      }

      // 3. 驗證所有 Expense 存在且符合條件
      const expenseIds = items.map((item) => item.expenseId);
      const expenses = await ctx.prisma.expense.findMany({
        where: {
          id: { in: expenseIds },
        },
      });

      if (expenses.length !== expenseIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '部分費用記錄不存在',
        });
      }

      // 驗證所有 Expense 都標記為 requiresChargeOut = true
      const invalidExpenses = expenses.filter((exp) => !exp.requiresChargeOut);
      if (invalidExpenses.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `以下費用未標記為需要轉嫁：${invalidExpenses.map((e) => e.name).join(', ')}`,
        });
      }

      // 4. 計算總金額
      const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

      // 5. 使用 transaction 創建 ChargeOut + ChargeOutItems
      const chargeOut = await ctx.prisma.$transaction(async (prisma) => {
        // 創建 ChargeOut
        const newChargeOut = await prisma.chargeOut.create({
          data: {
            name,
            description,
            projectId,
            opCoId,
            totalAmount,
            status: 'Draft',
          },
        });

        // 創建 ChargeOutItems
        await prisma.chargeOutItem.createMany({
          data: items.map((item, index) => ({
            chargeOutId: newChargeOut.id,
            expenseId: item.expenseId,
            amount: item.amount,
            description: item.description,
            sortOrder: item.sortOrder ?? index,
          })),
        });

        // 返回完整數據
        return prisma.chargeOut.findUnique({
          where: { id: newChargeOut.id },
          include: {
            project: true,
            opCo: true,
            items: {
              include: {
                expense: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
      });

      return chargeOut;
    }),

  /**
   * 2. update - 更新 ChargeOut 基本信息
   *
   * 業務邏輯：
   * - 僅 Draft 狀態可更新
   * - 支持部分更新（name, description, debitNoteNumber, issueDate, paymentDate）
   * - 不更新 items（使用專門的 updateItems endpoint）
   */
  update: protectedProcedure
    .input(updateChargeOutSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態（僅 Draft 可更新基本信息）
      if (chargeOut.status !== 'Draft') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `只有草稿狀態可以編輯（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 準備更新數據
      const dataToUpdate: Prisma.ChargeOutUpdateInput = {};

      if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
      if (updateData.description !== undefined) dataToUpdate.description = updateData.description;
      if (updateData.debitNoteNumber !== undefined) dataToUpdate.debitNoteNumber = updateData.debitNoteNumber;
      if (updateData.issueDate !== undefined) {
        dataToUpdate.issueDate = updateData.issueDate ? new Date(updateData.issueDate) : null;
      }
      if (updateData.paymentDate !== undefined) {
        dataToUpdate.paymentDate = updateData.paymentDate ? new Date(updateData.paymentDate) : null;
      }

      // 4. 更新
      const updated = await ctx.prisma.chargeOut.update({
        where: { id },
        data: dataToUpdate,
        include: {
          project: true,
          opCo: true,
          items: {
            include: {
              expense: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 3. updateItems - 批量更新明細
   *
   * 業務邏輯：
   * - 僅 Draft 狀態可更新
   * - 接收完整的 items 陣列
   * - 使用 upsert 更新現有項目，create 新項目
   * - 刪除標記為 _delete 的項目
   * - 使用 transaction 自動重算 totalAmount
   */
  updateItems: protectedProcedure
    .input(updateItemsSchema)
    .mutation(async ({ ctx, input }) => {
      const { chargeOutId, items } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id: chargeOutId },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態（僅 Draft 可更新）
      if (chargeOut.status !== 'Draft') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `只有草稿狀態可以編輯明細（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 驗證所有 Expense 存在且符合條件
      const expenseIds = items
        .filter((item) => !item._delete)
        .map((item) => item.expenseId);

      const expenses = await ctx.prisma.expense.findMany({
        where: {
          id: { in: expenseIds },
        },
      });

      if (expenses.length !== expenseIds.length) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '部分費用記錄不存在',
        });
      }

      const invalidExpenses = expenses.filter((exp) => !exp.requiresChargeOut);
      if (invalidExpenses.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `以下費用未標記為需要轉嫁：${invalidExpenses.map((e) => e.name).join(', ')}`,
        });
      }

      // 4. 使用 transaction 批量更新
      const updated = await ctx.prisma.$transaction(async (prisma) => {
        // a. 處理刪除
        const itemsToDelete = items.filter((item) => item._delete && item.id);
        if (itemsToDelete.length > 0) {
          await prisma.chargeOutItem.deleteMany({
            where: {
              id: { in: itemsToDelete.map((item) => item.id!) },
              chargeOutId,
            },
          });
        }

        // b. 處理新增和更新
        const itemsToUpsert = items.filter((item) => !item._delete);
        for (const [index, item] of itemsToUpsert.entries()) {
          if (item.id) {
            // 更新現有項目
            await prisma.chargeOutItem.update({
              where: { id: item.id },
              data: {
                expenseId: item.expenseId,
                amount: item.amount,
                description: item.description,
                sortOrder: item.sortOrder ?? index,
              },
            });
          } else {
            // 創建新項目
            await prisma.chargeOutItem.create({
              data: {
                chargeOutId,
                expenseId: item.expenseId,
                amount: item.amount,
                description: item.description,
                sortOrder: item.sortOrder ?? index,
              },
            });
          }
        }

        // c. 重新計算總金額
        const allItems = await prisma.chargeOutItem.findMany({
          where: { chargeOutId },
        });

        const newTotalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);

        // d. 更新 ChargeOut 總金額
        await prisma.chargeOut.update({
          where: { id: chargeOutId },
          data: { totalAmount: newTotalAmount },
        });

        // e. 返回完整數據
        return prisma.chargeOut.findUnique({
          where: { id: chargeOutId },
          include: {
            project: true,
            opCo: true,
            items: {
              include: {
                expense: true,
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
      });

      return updated;
    }),

  /**
   * 4. submit - 提交審核
   *
   * 業務邏輯：
   * - Draft → Submitted
   * - 驗證至少有一個 item
   * - 發送通知（可選）
   */
  submit: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態
      if (chargeOut.status !== 'Draft') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `只有草稿狀態可以提交（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 驗證至少有一個項目
      if (chargeOut.items.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '至少需要一個費用項目才能提交',
        });
      }

      // 4. 更新狀態
      const updated = await ctx.prisma.chargeOut.update({
        where: { id },
        data: {
          status: 'Submitted',
        },
        include: {
          project: true,
          opCo: true,
          items: {
            include: {
              expense: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // TODO: 發送通知給主管

      return updated;
    }),

  /**
   * 5. confirm - 確認 ChargeOut（Supervisor only）
   *
   * 業務邏輯：
   * - Submitted → Confirmed
   * - supervisorProcedure 保護
   * - 記錄 confirmedBy 和 confirmedAt
   */
  confirm: supervisorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態
      if (chargeOut.status !== 'Submitted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `只有已提交狀態可以確認（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 確認操作
      const updated = await ctx.prisma.chargeOut.update({
        where: { id },
        data: {
          status: 'Confirmed',
          confirmedBy: ctx.session.user.id,
          confirmedAt: new Date(),
        },
        include: {
          project: true,
          opCo: true,
          confirmer: true,
          items: {
            include: {
              expense: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // TODO: 發送通知給創建者

      return updated;
    }),

  /**
   * 6. reject - 拒絕 ChargeOut
   *
   * 業務邏輯：
   * - Submitted → Rejected
   * - 記錄拒絕原因（可選）
   */
  reject: supervisorProcedure
    .input(
      z.object({
        id: z.string().min(1),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, reason } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態
      if (chargeOut.status !== 'Submitted') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `只有已提交狀態可以拒絕（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 拒絕操作（將狀態改為 Rejected，或回到 Draft 讓用戶修改）
      const updated = await ctx.prisma.chargeOut.update({
        where: { id },
        data: {
          status: 'Rejected', // 或 'Draft' - 根據業務需求決定
          description: reason
            ? `${chargeOut.description || ''}\n\n拒絕原因：${reason}`
            : chargeOut.description,
        },
        include: {
          project: true,
          opCo: true,
          items: {
            include: {
              expense: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      // TODO: 發送通知給創建者

      return updated;
    }),

  /**
   * 7. markAsPaid - 標記為已支付
   *
   * 業務邏輯：
   * - Confirmed → Paid
   * - 記錄 paymentDate（必填）
   */
  markAsPaid: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1),
        paymentDate: z.string().min(1, '支付日期不能為空'), // ISO 8601 date string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, paymentDate } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態
      if (chargeOut.status !== 'Confirmed') {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `只有已確認狀態可以標記為已支付（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 標記為已支付
      const updated = await ctx.prisma.chargeOut.update({
        where: { id },
        data: {
          status: 'Paid',
          paymentDate: new Date(paymentDate),
        },
        include: {
          project: true,
          opCo: true,
          confirmer: true,
          items: {
            include: {
              expense: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 8. getById - 獲取 ChargeOut 詳情
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id: input.id },
        include: {
          project: {
            include: {
              manager: true,
              supervisor: true,
            },
          },
          opCo: true,
          confirmer: true,
          items: {
            include: {
              expense: {
                include: {
                  purchaseOrder: {
                    include: {
                      vendor: true,
                    },
                  },
                  budgetCategory: true,
                },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      return chargeOut;
    }),

  /**
   * 9. getAll - 列表查詢（分頁）
   *
   * 支持過濾：
   * - status: ChargeOut 狀態
   * - opCoId: OpCo ID
   * - projectId: 項目 ID
   */
  getAll: protectedProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),
        status: ChargeOutStatusEnum.optional(),
        opCoId: z.string().optional(),
        projectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, status, opCoId, projectId } = input;

      // 構建 where 條件
      const where: Prisma.ChargeOutWhereInput = {};

      if (status) {
        where.status = status;
      }

      if (opCoId) {
        where.opCoId = opCoId;
      }

      if (projectId) {
        where.projectId = projectId;
      }

      // 計算分頁
      const skip = (page - 1) * limit;

      // 並行查詢總數和數據
      const [total, items] = await Promise.all([
        ctx.prisma.chargeOut.count({ where }),
        ctx.prisma.chargeOut.findMany({
          where,
          skip,
          take: limit,
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            opCo: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            confirmer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            _count: {
              select: {
                items: true,
              },
            },
          },
          orderBy: [{ createdAt: 'desc' }],
        }),
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
   * 10. delete - 刪除 ChargeOut
   *
   * 業務邏輯：
   * - 僅 Draft 或 Rejected 狀態可刪除
   * - 自動刪除 items（Cascade）
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const { id } = input;

      // 1. 檢查 ChargeOut 是否存在
      const chargeOut = await ctx.prisma.chargeOut.findUnique({
        where: { id },
      });

      if (!chargeOut) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'ChargeOut 不存在',
        });
      }

      // 2. 驗證狀態（僅 Draft 或 Rejected 可刪除）
      if (chargeOut.status !== 'Draft' && chargeOut.status !== 'Rejected') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `只有草稿或已拒絕狀態可以刪除（當前狀態：${chargeOut.status}）`,
        });
      }

      // 3. 刪除（items 會自動刪除，因為 onDelete: Cascade）
      await ctx.prisma.chargeOut.delete({
        where: { id },
      });

      return { success: true, id };
    }),

  /**
   * 11. getEligibleExpenses - 獲取可用於 ChargeOut 的費用
   *
   * 業務邏輯：
   * - 篩選：requiresChargeOut = true
   * - 狀態為 Approved 或 Paid
   * - 可選：按項目過濾
   */
  getEligibleExpenses: protectedProcedure
    .input(
      z.object({
        projectId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const { projectId } = input;

      const where: Prisma.ExpenseWhereInput = {
        requiresChargeOut: true,
        status: {
          in: ['Approved', 'Paid'],
        },
      };

      if (projectId) {
        where.purchaseOrder = {
          project: {
            id: projectId,
          },
        };
      }

      const expenses = await ctx.prisma.expense.findMany({
        where,
        include: {
          purchaseOrder: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          budgetCategory: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          items: {
            select: {
              id: true,
              itemName: true,
              amount: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }],
      });

      return expenses;
    }),
});
