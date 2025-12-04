/**
 * @fileoverview Expense Router - 費用記錄與審批工作流 API
 *
 * @description
 * 提供費用記錄的完整生命週期管理，包含 CRUD 操作和審批工作流（Draft → Submitted → Approved → Paid）。
 * 採用表頭-明細架構（Expense + ExpenseItem[]），支援多項目費用拆分和細緻分類管理。
 * 實現與採購單（PurchaseOrder）的關聯、預算池自動扣款邏輯、通知整合等功能。
 * 支援發票管理、費用統計、預算類別分配等完整的財務管理需求。
 *
 * @module api/routers/expense
 *
 * @features
 * - 建立費用記錄（表頭 + 明細，關聯採購單和專案）
 * - 更新費用資訊（支援明細新增、更新、刪除，僅 Draft 可編輯）
 * - 提交費用審批（Draft → Submitted，驗證至少有一個項目）
 * - 批准費用（Submitted → Approved，自動扣除預算池和預算類別）
 * - 拒絕費用（Submitted → Draft，記錄拒絕原因）
 * - 標記為已支付（Approved → Paid）
 * - 查詢費用列表（支援分頁、採購單過濾、狀態過濾、排序）
 * - 查詢單一費用詳情（含明細、採購單、專案、預算池資訊）
 * - 刪除費用（僅 Draft 狀態可刪除）
 * - 根據採購單查詢費用列表
 * - 費用統計資訊（總數、總金額、各狀態分佈）
 * - 通知整合（狀態變更時自動通知相關人員）
 *
 * @procedures
 * - getAll: 查詢費用列表（分頁 + 過濾 + 排序）
 * - getById: 查詢單一費用詳情
 * - create: 建立新費用記錄（含明細）
 * - update: 更新費用資訊（含明細）
 * - delete: 刪除費用記錄（Draft only）
 * - submit: 提交費用審批
 * - approve: 批准費用（Supervisor only，預算扣款）
 * - reject: 拒絕費用（Supervisor only）
 * - markAsPaid: 標記為已支付
 * - getByPurchaseOrder: 根據採購單查詢費用
 * - getStats: 獲取費用統計資訊
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 * - TRPCError: 錯誤處理
 *
 * @related
 * - packages/db/prisma/schema.prisma - Expense, ExpenseItem 資料模型
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 Router
 * - packages/api/src/routers/budgetPool.ts - 預算池 Router
 * - apps/web/src/app/[locale]/expenses/page.tsx - 費用列表頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording and Approval
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 費用狀態枚舉
 * Module 5: 更新為與 PurchaseOrder 一致的狀態流
 */
const ExpenseStatusEnum = z.enum(['Draft', 'Submitted', 'Approved', 'Paid']);

/**
 * 費用明細項目 Schema
 * Module 5: 支持表頭-明細結構
 * CHANGE-002: 新增 chargeOutOpCoId 費用轉嫁目標
 */
const expenseItemSchema = z.object({
  id: z.string().optional(), // 有 id = 更新，無 id = 新增
  itemName: z.string().min(1, '費用項目名稱為必填'),
  description: z.string().optional(),
  amount: z.number().min(0, '金額必須大於等於 0'),
  category: z.string().optional(), // 費用類別（如: Hardware, Software, Consulting）
  chargeOutOpCoId: z.string().nullable().optional(), // CHANGE-002: 費用轉嫁目標 OpCo
  sortOrder: z.number().int().default(0),
  _delete: z.boolean().optional(), // true = 刪除此項目
});

/**
 * 創建費用 Schema (Module 5 - 支持明細)
 * 根據更新的 Prisma schema
 */
const createExpenseSchema = z.object({
  name: z.string().min(1, '費用名稱為必填'),
  description: z.string().optional(),
  purchaseOrderId: z.string().min(1, '採購單ID為必填'),
  projectId: z.string().min(1, '專案ID為必填'), // Module 5: 新增
  budgetCategoryId: z.string().optional(),
  vendorId: z.string().optional(),
  invoiceNumber: z.string().min(1, '發票號碼為必填'),
  invoiceDate: z.date().or(z.string().transform((str) => new Date(str))),
  invoiceFilePath: z.string().optional(),
  expenseDate: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  requiresChargeOut: z.boolean().default(false),
  isOperationMaint: z.boolean().default(false),
  items: z.array(expenseItemSchema).min(1, '至少需要一個費用項目'),
});

/**
 * 更新費用 Schema (Module 5 - 支持明細)
 * FIX: 新增 requiresChargeOut, isOperationMaint, purchaseOrderId 欄位支援
 * 注意：projectId 不在 Expense model 中，是通過 purchaseOrder.projectId 間接關聯
 */
const updateExpenseSchema = z.object({
  id: z.string().min(1, '無效的費用ID'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  purchaseOrderId: z.string().optional(), // FIX: 新增支援更新採購單
  budgetCategoryId: z.string().optional(), // FIX: 新增支援更新預算類別
  vendorId: z.string().optional(),
  invoiceNumber: z.string().optional(),
  invoiceDate: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  invoiceFilePath: z.string().optional(),
  expenseDate: z.date().or(z.string().transform((str) => new Date(str))).optional(),
  requiresChargeOut: z.boolean().optional(), // FIX: 新增支援更新
  isOperationMaint: z.boolean().optional(),  // FIX: 新增支援更新
  items: z.array(expenseItemSchema).optional(),
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
                  currency: true, // FEAT-002: 用於貨幣繼承
                },
              },
              vendor: {
                select: {
                  id: true,
                  name: true,
                },
              },
              currency: true, // FEAT-002: PO 的貨幣
            },
          },
          currency: true, // FEAT-002: Expense 的貨幣
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
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              chargeOutOpCo: true, // CHANGE-002: 包含轉嫁目標 OpCo
            },
          },
          purchaseOrder: {
            include: {
              project: {
                include: {
                  budgetPool: true,
                  currency: true, // FEAT-002: 用於貨幣繼承
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
              currency: true, // FEAT-002: PO 的貨幣
              quote: {
                select: {
                  id: true,
                  amount: true,
                  filePath: true,
                },
              },
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
          budgetCategory: {
            select: {
              id: true,
              categoryName: true,
            },
          },
          currency: true, // FEAT-002: Expense 的貨幣
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
   * 創建新費用記錄 (Module 5 - 支持明細)
   * @param name - 費用名稱
   * @param items - 費用項目明細
   * @returns 新創建的 Expense（含明細）
   *
   * Module 5: 表頭-明細重構
   */
  create: protectedProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證專案是否存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          budgetCategory: true,
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該專案',
        });
      }

      // 驗證採購單是否存在
      const purchaseOrder = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.purchaseOrderId },
        include: {
          project: {
            include: {
              budgetCategory: true,
            },
          },
        },
      });

      if (!purchaseOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 驗證 projectId 與 PO 的 projectId 一致
      if (input.projectId !== purchaseOrder.projectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '費用的專案必須與採購單的專案一致',
        });
      }

      // 驗證至少要有一個費用項目
      if (input.items.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '至少需要一個費用項目',
        });
      }

      // 計算總金額
      const totalAmount = input.items.reduce((sum, item) => {
        return sum + item.amount;
      }, 0);

      // FIX-006: 驗證 budgetCategoryId 是否有效
      // 優先使用用戶輸入的 budgetCategoryId，否則從 project 繼承
      // 但必須確認 BudgetCategory 實際存在（通過 include 載入的關聯驗證）
      let validBudgetCategoryId: string | undefined = undefined;

      if (input.budgetCategoryId && input.budgetCategoryId.trim() !== '') {
        // 用戶明確提供了 budgetCategoryId，需要驗證它是否存在
        const categoryExists = await ctx.prisma.budgetCategory.findUnique({
          where: { id: input.budgetCategoryId },
          select: { id: true },
        });
        if (categoryExists) {
          validBudgetCategoryId = input.budgetCategoryId;
        }
        // 如果不存在，不設置（避免外鍵約束錯誤）
      } else if (purchaseOrder.project.budgetCategory) {
        // 從 project 繼承（只有當 budgetCategory 關聯實際存在時才使用）
        validBudgetCategoryId = purchaseOrder.project.budgetCategoryId ?? undefined;
      }

      return await ctx.prisma.$transaction(async (tx) => {
        // 創建費用表頭
        // 注意：projectId 僅用於驗證，不儲存在 Expense model 中
        // Expense 通過 purchaseOrder 間接關聯到 project
        const expense = await tx.expense.create({
          data: {
            name: input.name,
            description: input.description,
            // projectId 不存在於 Expense model，已移除
            purchaseOrderId: input.purchaseOrderId,
            budgetCategoryId: validBudgetCategoryId,
            vendorId: input.vendorId,
            invoiceNumber: input.invoiceNumber,
            invoiceDate: input.invoiceDate,
            invoiceFilePath: input.invoiceFilePath,
            expenseDate: input.expenseDate || new Date(),
            requiresChargeOut: input.requiresChargeOut,
            isOperationMaint: input.isOperationMaint,
            totalAmount,
            status: 'Draft',
          },
        });

        // 創建費用明細
        // CHANGE-002: 包含 chargeOutOpCoId 欄位
        await tx.expenseItem.createMany({
          data: input.items.map((item, index) => ({
            expenseId: expense.id,
            itemName: item.itemName,
            description: item.description,
            amount: item.amount,
            category: item.category,
            chargeOutOpCoId: item.chargeOutOpCoId || null, // CHANGE-002
            sortOrder: item.sortOrder ?? index,
          })),
        });

        // 返回完整的 Expense（含明細）
        return await tx.expense.findUnique({
          where: { id: expense.id },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
            purchaseOrder: {
              select: {
                id: true,
                poNumber: true,
                project: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });
      });
    }),

  /**
   * 更新費用資訊 (Module 5 - 支持明細)
   * @param id - 費用 ID
   * @param items - 更新的明細（支持新增、更新、刪除）
   * @returns 更新後的 Expense（含明細）
   *
   * Module 5: 支持明細的新增、更新、刪除
   */
  update: protectedProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...headerUpdate } = input;

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

      // 如果狀態不是 Draft，不允許修改
      if (existingExpense.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的費用才能修改',
        });
      }

      // FIX: 驗證新的採購單是否存在（如果要更新）
      if (headerUpdate.purchaseOrderId && headerUpdate.purchaseOrderId !== existingExpense.purchaseOrderId) {
        const newPurchaseOrder = await ctx.prisma.purchaseOrder.findUnique({
          where: { id: headerUpdate.purchaseOrderId },
        });
        if (!newPurchaseOrder) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '找不到指定的採購單',
          });
        }
      }

      return await ctx.prisma.$transaction(async (tx) => {
        // 準備表頭更新數據
        const updateData: any = {};
        if (headerUpdate.name) updateData.name = headerUpdate.name;
        if (headerUpdate.description !== undefined) updateData.description = headerUpdate.description;
        // FIX: 支援更新採購單和預算類別
        if (headerUpdate.purchaseOrderId) updateData.purchaseOrderId = headerUpdate.purchaseOrderId;
        if (headerUpdate.budgetCategoryId !== undefined) updateData.budgetCategoryId = headerUpdate.budgetCategoryId || null;
        if (headerUpdate.vendorId) updateData.vendorId = headerUpdate.vendorId;
        if (headerUpdate.invoiceNumber) updateData.invoiceNumber = headerUpdate.invoiceNumber;
        if (headerUpdate.invoiceDate) updateData.invoiceDate = headerUpdate.invoiceDate;
        if (headerUpdate.invoiceFilePath !== undefined) updateData.invoiceFilePath = headerUpdate.invoiceFilePath;
        if (headerUpdate.expenseDate) updateData.expenseDate = headerUpdate.expenseDate;
        // FIX: 支援更新 requiresChargeOut 和 isOperationMaint
        if (headerUpdate.requiresChargeOut !== undefined) updateData.requiresChargeOut = headerUpdate.requiresChargeOut;
        if (headerUpdate.isOperationMaint !== undefined) updateData.isOperationMaint = headerUpdate.isOperationMaint;

        // FIX: 當 requiresChargeOut 從 true 變為 false 時，清除所有 ExpenseItem 的 chargeOutOpCoId
        if (headerUpdate.requiresChargeOut === false && existingExpense.requiresChargeOut === true) {
          await tx.expenseItem.updateMany({
            where: { expenseId: id },
            data: { chargeOutOpCoId: null },
          });
        }

        // 處理明細更新
        if (items) {
          // 1. 刪除標記為刪除的項目
          const itemsToDelete = items.filter(item => item._delete && item.id);
          if (itemsToDelete.length > 0) {
            await tx.expenseItem.deleteMany({
              where: {
                id: { in: itemsToDelete.map(item => item.id!) },
              },
            });
          }

          // 2. 處理更新和新增
          // CHANGE-002: 包含 chargeOutOpCoId 欄位
          const itemsToProcess = items.filter(item => !item._delete);
          for (const item of itemsToProcess) {
            if (item.id) {
              // 更新現有項目
              await tx.expenseItem.update({
                where: { id: item.id },
                data: {
                  itemName: item.itemName,
                  description: item.description,
                  amount: item.amount,
                  category: item.category,
                  chargeOutOpCoId: item.chargeOutOpCoId || null, // CHANGE-002
                  sortOrder: item.sortOrder,
                },
              });
            } else {
              // 新增項目
              await tx.expenseItem.create({
                data: {
                  expenseId: id,
                  itemName: item.itemName,
                  description: item.description,
                  amount: item.amount,
                  category: item.category,
                  chargeOutOpCoId: item.chargeOutOpCoId || null, // CHANGE-002
                  sortOrder: item.sortOrder,
                },
              });
            }
          }

          // 3. 重新計算總金額
          const allItems = await tx.expenseItem.findMany({
            where: { expenseId: id },
          });
          const totalAmount = allItems.reduce((sum, item) => sum + item.amount, 0);
          updateData.totalAmount = totalAmount;
        }

        // 更新表頭
        const expense = await tx.expense.update({
          where: { id },
          data: updateData,
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
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
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            budgetCategory: {
              select: {
                id: true,
                categoryName: true,
              },
            },
          },
        });

        return expense;
      });
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
   * Module 5: 狀態轉換 Draft → Submitted
   */
  submit: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的費用ID') }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: {
          items: true,
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

      // Module 5: 驗證至少有一個費用項目
      if (!expense.items || expense.items.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '費用記錄至少需要一個費用項目才能提交',
        });
      }

      // Transaction: 更新狀態 + 發送通知
      const updatedExpense = await ctx.prisma.$transaction(async (prisma) => {
        // Module 5: 更新狀態為 Submitted
        const updated = await prisma.expense.update({
          where: { id: input.id },
          data: {
            status: 'Submitted',
          },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
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
            message: `${updated.purchaseOrder.project.manager.name || '專案經理'} 提交了金額為 NT$ ${updated.totalAmount.toLocaleString()} 的費用記錄，請審核。`,
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
   * Module 5: 狀態轉換 Submitted → Approved
   * 業務邏輯: 從預算池扣款
   * 權限: 僅 Supervisor 可執行
   */
  approve: supervisorProcedure
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
                  budgetCategory: true,
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

      // Module 5: 只有 Submitted 狀態才能批准
      if (expense.status !== 'Submitted') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有已提交審批狀態的費用才能批准',
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

        // 2.5. 更新 BudgetCategory.usedAmount（如果 expense 有 budgetCategoryId）
        if (expense.budgetCategoryId) {
          await prisma.budgetCategory.update({
            where: { id: expense.budgetCategoryId },
            data: {
              usedAmount: {
                increment: expense.totalAmount,
              },
            },
          });
        }

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
   * Module 5: 狀態轉換 Submitted → Draft (允許重新提交)
   * 權限: 僅 Supervisor 可執行
   */
  reject: supervisorProcedure
    .input(z.object({
      id: z.string().min(1, '無效的費用ID'),
      comment: z.string().min(1, '請提供拒絕原因'),
    }))
    .mutation(async ({ ctx, input }) => {
      const expense = await ctx.prisma.expense.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrder: {
            include: {
              project: {
                include: {
                  manager: true,
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

      // Module 5: 只有 Submitted 狀態才能拒絕
      if (expense.status !== 'Submitted') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有已提交審批狀態的費用才能拒絕',
        });
      }

      // Transaction: 更新狀態 + 發送通知
      const result = await ctx.prisma.$transaction(async (prisma) => {
        // 更新狀態回 Draft，允許重新提交
        const updatedExpense = await prisma.expense.update({
          where: { id: input.id },
          data: {
            status: 'Draft',
          },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
            purchaseOrder: {
              include: {
                project: {
                  include: {
                    manager: true,
                  },
                },
                vendor: true,
              },
            },
          },
        });

        // Epic 8: 發送通知給 Project Manager
        await prisma.notification.create({
          data: {
            userId: updatedExpense.purchaseOrder.project.managerId,
            type: 'EXPENSE_REJECTED',
            title: '費用被退回',
            message: `您的費用記錄（金額 NT$ ${updatedExpense.totalAmount.toLocaleString()}）已被退回，拒絕原因：${input.comment}`,
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
