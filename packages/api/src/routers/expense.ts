/**
 * Expense（費用記錄）管理 tRPC API 路由
 *
 * 功能說明：
 * - 費用 CRUD 操作：新增、查詢、更新、刪除
 * - 費用審批工作流：Draft → PendingApproval → Approved → Paid
 * - 與 PurchaseOrder 關聯管理
 * - 預算池扣款邏輯
 *
 * Epic 6 - 費用記錄與審批
 * - Story 6.1: 根據採購單記錄發票與費用
 * - Story 6.2: 管理費用的審批狀態
 * - Story 6.3: 關聯費用至特定資金池
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 費用狀態枚舉
 */
const ExpenseStatusEnum = z.enum(['Draft', 'PendingApproval', 'Approved', 'Paid']);

/**
 * 創建費用 Schema (Story 6.1)
 * 根據更新的 Prisma schema
 */
const createExpenseSchema = z.object({
  name: z.string().min(1, '費用名稱為必填'),
  purchaseOrderId: z.string().min(1, '採購單ID為必填'),
  amount: z.number().min(0, '費用金額必須大於等於0'),
  expenseDate: z.date().or(z.string().transform((str) => new Date(str))),
  invoiceDate: z.date().or(z.string().transform((str) => new Date(str))),
  invoiceNumber: z.string().optional(),
  invoiceFilePath: z.string().optional(),
  description: z.string().optional(),
});

/**
 * 更新費用 Schema
 */
const updateExpenseSchema = z.object({
  id: z.string().min(1, '無效的費用ID'),
  name: z.string().min(1, '費用名稱為必填').optional(),
  amount: z.number().min(0, '費用金額必須大於等於0').optional(),
  expenseDate: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  invoiceDate: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  invoiceNumber: z.string().optional(),
  invoiceFilePath: z.string().optional(),
  description: z.string().optional(),
});

/**
 * 查詢參數 Schema
 */
const getExpensesQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  purchaseOrderId: z.string().optional(),
  status: ExpenseStatusEnum.optional(),
  sortBy: z.enum(['expenseDate', 'amount', 'createdAt']).default('expenseDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ========================================
// tRPC Router 定義
// ========================================

export const expenseRouter = createTRPCRouter({

  /**
   * 查詢所有費用（支援分頁、篩選、排序）
   * @returns { items: Expense[], pagination }
   */
  getAll: protectedProcedure
    .input(getExpensesQuerySchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, purchaseOrderId, status, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // 構建篩選條件
      const whereCondition: any = {};
      if (purchaseOrderId) {
        whereCondition.purchaseOrderId = purchaseOrderId;
      }
      if (status) {
        whereCondition.status = status;
      }

      // 查詢總數
      const total = await ctx.prisma.expense.count({
        where: whereCondition,
      });

      // 查詢費用列表
      const expenses = await ctx.prisma.expense.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          purchaseOrder: {
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                  budgetPoolId: true,
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
        },
      });

      return {
        items: expenses,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * 根據 ID 查詢單一費用
   * @param id - 費用 ID
   * @returns Expense 完整資訊
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的費用ID') }))
    .query(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrder: {
            include: {
              project: {
                include: {
                  budgetPool: true,
                  manager: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                  supervisor: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              },
              vendor: true,
              quote: {
                select: {
                  id: true,
                  amount: true,
                  filePath: true,
                },
              },
            },
          },
        },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      return expense;
    }),

  /**
   * 創建新費用記錄 (Story 6.1)
   * @param purchaseOrderId - 採購單 ID
   * @param amount - 費用金額
   * @param expenseDate - 費用日期
   * @param invoiceFilePath - 發票文件路徑（選填）
   * @returns 新創建的 Expense
   */
  create: protectedProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證採購單是否存在
      const purchaseOrder = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: {
          expenses: true,
        },
      });

      if (!purchaseOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 驗證費用總額不超過採購單金額 (警告，不阻止)
      const totalExpenses = purchaseOrder.expenses.reduce((sum, e) => sum + e.totalAmount, 0);
      const newTotal = totalExpenses + input.amount;

      if (newTotal > purchaseOrder.totalAmount) {
        console.warn(`警告：採購單 ${purchaseOrder.poNumber} 費用總額 (${newTotal}) 超過採購單金額 (${purchaseOrder.totalAmount})`);
      }

      // 創建費用記錄
      const expense = await ctx.prisma.expense.create({
        data: {
          name: input.name,
          purchaseOrderId: input.purchaseOrderId,
          totalAmount: input.amount,
          expenseDate: input.expenseDate,
          invoiceDate: input.invoiceDate,
          invoiceNumber: input.invoiceNumber,
          invoiceFilePath: input.invoiceFilePath,
          description: input.description,
          status: 'Draft', // 初始狀態為草稿
        },
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
        },
      });

      return expense;
    }),

  /**
   * 更新費用資訊
   * @param id - 費用 ID
   * @returns 更新後的 Expense
   *
   * 注意：只有 Draft 狀態的費用才能修改
   */
  update: protectedProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, amount, ...restData } = input;

      // 將 amount 轉換為 totalAmount（API 輸入 -> 資料庫欄位）
      const updateData = amount !== undefined
        ? { ...restData, totalAmount: amount }
        : restData;

      // 檢查費用是否存在
      const existingExpense = await ctx.prisma.expense.findUnique({
        where: { id },
      });

      if (!existingExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 Draft 狀態才能修改
      if (existingExpense.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的費用才能修改',
        });
      }

      // 更新費用
      const updatedExpense = await ctx.prisma.expense.update({
        where: { id },
        data: updateData,
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
        },
      });

      return updatedExpense;
    }),

  /**
   * 刪除費用記錄
   * @param id - 費用 ID
   * @returns 成功訊息
   *
   * 注意：只有 Draft 狀態的費用才能刪除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的費用ID') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查費用是否存在
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 Draft 狀態才能刪除
      if (expense.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的費用才能刪除',
        });
      }

      // 刪除費用
      await ctx.prisma.expense.delete({
        where: { id: input.id },
      });

      return { success: true, message: '費用記錄已成功刪除' };
    }),

  /**
   * 提交費用審批 (Story 6.2)
   * @param id - 費用 ID
   * @returns 更新後的 Expense
   *
   * 狀態轉換: Draft → PendingApproval
   */
  submit: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的費用ID') }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrder: {
            include: {
              project: {
                include: {
                  manager: true,
                  supervisor: true,
                },
              },
              vendor: true,
            },
          },
        },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 Draft 狀態才能提交
      if (expense.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的費用才能提交審批',
        });
      }

      // Transaction: 更新狀態 + 發送通知
      const updatedExpense = await ctx.prisma.$transaction(async (prisma) => {
        // 更新狀態為 PendingApproval
        const updated = await prisma.expense.update({
          where: { id: input.id },
          data: {
            status: 'PendingApproval',
          },
          include: {
            purchaseOrder: {
              include: {
                project: {
                  include: {
                    manager: true,
                    supervisor: true,
                  },
                },
                vendor: true,
              },
            },
          },
        });

        // Epic 8: 發送通知給 Supervisor
        await prisma.notification.create({
          data: {
            userId: updated.purchaseOrder.project.supervisorId,
            type: 'EXPENSE_SUBMITTED',
            title: '新的費用待審批',
            message: `${updated.purchaseOrder.project.manager.name || '專案經理'} 提交了金額為 NT$ ${updated.amount.toLocaleString()} 的費用記錄，請審核。`,
            link: `/expenses/${updated.id}`,
            entityType: 'EXPENSE',
            entityId: updated.id,
          },
        });

        return updated;
      });

      return updatedExpense;
    }),

  /**
   * 批准費用 (Story 6.2 + 6.3)
   * @param id - 費用 ID
   * @returns 更新後的 Expense
   *
   * 狀態轉換: PendingApproval → Approved
   * 業務邏輯: 從預算池扣款
   */
  approve: protectedProcedure
    .input(z.object({
      id: z.string().min(1, '無效的費用ID'),
      comment: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrder: {
            include: {
              project: {
                include: {
                  budgetPool: true,
                },
              },
            },
          },
        },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 PendingApproval 狀態才能批准
      if (expense.status !== 'PendingApproval') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有待審批狀態的費用才能批准',
        });
      }

      // Story 6.3: 從預算池扣款
      const budgetPool = expense.purchaseOrder.project.budgetPool;
      const usedAmount = budgetPool.usedAmount + expense.totalAmount;

      if (usedAmount > budgetPool.totalAmount) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `預算池餘額不足。總預算: ${budgetPool.totalAmount}，已使用: ${budgetPool.usedAmount}，需要: ${expense.totalAmount}`,
        });
      }

      // Transaction: 更新費用狀態 + 扣除預算池 + 發送通知
      const result = await ctx.prisma.$transaction(async (prisma) => {
        // 1. 更新費用狀態為 Approved
        const updatedExpense = await prisma.expense.update({
          where: { id: input.id },
          data: {
            status: 'Approved',
          },
          include: {
            purchaseOrder: {
              include: {
                project: {
                  include: {
                    manager: true,
                    supervisor: true,
                  },
                },
                vendor: true,
              },
            },
          },
        });

        // 2. 從預算池扣款
        await prisma.budgetPool.update({
          where: { id: budgetPool.id },
          data: {
            usedAmount: usedAmount,
          },
        });

        // 3. Epic 8: 發送通知給 Project Manager
        await prisma.notification.create({
          data: {
            userId: updatedExpense.purchaseOrder.project.managerId,
            type: 'EXPENSE_APPROVED',
            title: '費用已批准',
            message: `您的費用記錄（金額 NT$ ${updatedExpense.totalAmount.toLocaleString()}）已被批准並從預算池扣款。`,
            link: `/expenses/${updatedExpense.id}`,
            entityType: 'EXPENSE',
            entityId: updatedExpense.id,
          },
        });

        return updatedExpense;
      });

      return result;
    }),

  /**
   * 拒絕費用 (Story 6.2)
   * @param id - 費用 ID
   * @param comment - 拒絕原因
   * @returns 更新後的 Expense
   *
   * 狀態轉換: PendingApproval → Draft (允許重新提交)
   */
  reject: protectedProcedure
    .input(z.object({
      id: z.string().min(1, '無效的費用ID'),
      comment: z.string().min(1, '請提供拒絕原因'),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 PendingApproval 狀態才能拒絕
      if (expense.status !== 'PendingApproval') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有待審批狀態的費用才能拒絕',
        });
      }

      // 更新狀態回 Draft，允許重新提交
      const updatedExpense = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: 'Draft',
        },
        include: {
          purchaseOrder: {
            include: {
              project: true,
              vendor: true,
            },
          },
        },
      });

      return updatedExpense;
    }),

  /**
   * 標記為已支付 (Story 6.2)
   * @param id - 費用 ID
   * @returns 更新後的 Expense
   *
   * 狀態轉換: Approved → Paid
   */
  markAsPaid: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的費用ID') }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
      });

      if (!expense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該費用記錄',
        });
      }

      // 只有 Approved 狀態才能標記為已支付
      if (expense.status !== 'Approved') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有已批准狀態的費用才能標記為已支付',
        });
      }

      // 更新狀態為 Paid
      const updatedExpense = await ctx.prisma.expense.update({
        where: { id: input.id },
        data: {
          status: 'Paid',
        },
        include: {
          purchaseOrder: {
            include: {
              project: true,
              vendor: true,
            },
          },
        },
      });

      return updatedExpense;
    }),

  /**
   * 根據採購單 ID 查詢費用列表
   * @param purchaseOrderId - 採購單 ID
   * @returns Expense[]
   */
  getByPurchaseOrder: protectedProcedure
    .input(z.object({ purchaseOrderId: z.string().min(1, '無效的採購單ID') }))
    .query(async ({ ctx, input }) => {
      const expenses = await ctx.prisma.expense.findMany({
        where: { purchaseOrderId: input.purchaseOrderId },
        orderBy: { expenseDate: 'desc' },
        include: {
          purchaseOrder: {
            select: {
              id: true,
              poNumber: true,
              totalAmount: true,
            },
          },
        },
      });

      return expenses;
    }),

  /**
   * 獲取費用統計資訊
   * @returns 統計數據
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalExpenses = await ctx.prisma.expense.count();

      const totalAmountResult = await ctx.prisma.expense.aggregate({
        _sum: {
          totalAmount: true,
        },
      });

      const expensesByStatus = await ctx.prisma.expense.groupBy({
        by: ['status'],
        _count: true,
        _sum: {
          totalAmount: true,
        },
      });

      const pendingApprovalAmount = expensesByStatus.find(g => g.status === 'PendingApproval')?._sum.totalAmount || 0;
      const approvedAmount = expensesByStatus.find(g => g.status === 'Approved')?._sum.totalAmount || 0;
      const paidAmount = expensesByStatus.find(g => g.status === 'Paid')?._sum.totalAmount || 0;

      return {
        totalExpenses,
        totalAmount: totalAmountResult._sum.totalAmount || 0,
        byStatus: expensesByStatus.map(g => ({
          status: g.status,
          count: g._count,
          totalAmount: g._sum.totalAmount || 0,
        })),
        pendingApprovalAmount,
        approvedAmount,
        paidAmount,
      };
    }),
});
