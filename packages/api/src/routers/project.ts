/**
 * Project Router - 專案管理 tRPC API
 *
 * 功能說明：
 * - 提供專案（Project）的完整 CRUD 操作
 * - 支援分頁、搜尋、篩選和排序功能
 * - 包含專案統計數據查詢
 * - 支援數據導出功能
 *
 * 業務邏輯：
 * - 專案必須關聯到預算池（Budget Pool）
 * - 專案必須指定專案經理（Project Manager）和主管（Supervisor）
 * - 專案狀態包括：Draft（草稿）、InProgress（進行中）、Completed（已完成）、Archived（已歸檔）
 * - 刪除專案前需檢查是否有關聯的提案或採購單
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================
// Zod 驗證 Schema 定義
// ============================================================

/**
 * 專案狀態枚舉
 * - Draft: 草稿（初始狀態）
 * - InProgress: 進行中
 * - Completed: 已完成
 * - Archived: 已歸檔
 */
export const projectStatusEnum = z.enum(['Draft', 'InProgress', 'Completed', 'Archived']);

/**
 * 創建專案的驗證 Schema
 * 必填欄位：name（專案名稱）、budgetPoolId（預算池ID）、managerId（專案經理ID）、supervisorId（主管ID）、startDate（開始日期）
 * 可選欄位：description（專案描述）、endDate（結束日期）、budgetCategoryId（預算類別ID）、requestedBudget（請求預算金額）
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  budgetPoolId: z.string().min(1, 'Budget pool ID is required'),
  budgetCategoryId: z.string().uuid('Invalid budget category ID').optional(), // 新增：預算類別ID
  requestedBudget: z.number().min(0, 'Requested budget must be >= 0').optional(), // 新增：請求預算金額
  managerId: z.string().uuid('Invalid manager ID'),
  supervisorId: z.string().uuid('Invalid supervisor ID'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
});

/**
 * 更新專案的驗證 Schema
 * 必填欄位：id（專案ID）
 * 所有其他欄位均為可選
 */
export const updateProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  status: projectStatusEnum.optional(),
  budgetPoolId: z.string().min(1).optional(),
  budgetCategoryId: z.string().uuid('Invalid budget category ID').optional(), // 新增：預算類別ID
  requestedBudget: z.number().min(0, 'Requested budget must be >= 0').optional(), // 新增：請求預算金額
  approvedBudget: z.number().min(0, 'Approved budget must be >= 0').optional(), // 新增：批准預算金額
  managerId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// ============================================================
// Project Router 定義
// ============================================================

export const projectRouter = createTRPCRouter({
  /**
   * 查詢所有專案（支援分頁、搜尋、篩選、排序）
   *
   * 輸入參數：
   * - page: 頁碼（默認 1）
   * - limit: 每頁筆數（默認 20，最大 100）
   * - search: 搜尋關鍵字（模糊搜尋專案名稱）
   * - status: 專案狀態篩選
   * - budgetPoolId: 預算池 ID 篩選
   * - managerId: 專案經理 ID 篩選
   * - supervisorId: 主管 ID 篩選
   * - sortBy: 排序欄位（name, status, createdAt）
   * - sortOrder: 排序方向（asc, desc）
   *
   * 回傳：
   * - items: 專案列表
   * - pagination: 分頁資訊（total, page, limit, totalPages）
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
          status: projectStatusEnum.optional(),
          budgetPoolId: z.string().min(1).optional(),
          managerId: z.string().uuid().optional(),
          supervisorId: z.string().uuid().optional(),
          sortBy: z.enum(['name', 'status', 'createdAt']).default('createdAt'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const search = input?.search;
      const status = input?.status;
      const budgetPoolId = input?.budgetPoolId;
      const managerId = input?.managerId;
      const supervisorId = input?.supervisorId;
      const sortBy = input?.sortBy ?? 'createdAt';
      const sortOrder = input?.sortOrder ?? 'desc';

      // 構建查詢條件
      const where = {
        AND: [
          search
            ? {
                name: {
                  contains: search,
                  mode: 'insensitive' as const,
                },
              }
            : {},
          status ? { status } : {},
          budgetPoolId ? { budgetPoolId } : {},
          managerId ? { managerId } : {},
          supervisorId ? { supervisorId } : {},
        ],
      };

      // 並行執行查詢和計數，提升性能
      const [items, total] = await Promise.all([
        ctx.prisma.project.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === 'name'
              ? { name: sortOrder }
              : sortBy === 'status'
              ? { status: sortOrder }
              : { createdAt: sortOrder },
          include: {
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
            budgetPool: {
              select: {
                id: true,
                name: true,
                totalAmount: true,
                financialYear: true,
              },
            },
            _count: {
              select: {
                proposals: true,
                purchaseOrders: true,
              },
            },
          },
        }),
        ctx.prisma.project.count({ where }),
      ]);

      return {
        items,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * 根據 ID 查詢單一專案
   *
   * 輸入參數：
   * - id: 專案 ID（UUID 格式）
   *
   * 回傳：
   * - 完整專案資訊，包含關聯的預算池、專案經理、主管、提案、採購單
   *
   * 錯誤處理：
   * - 若專案不存在，拋出錯誤
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true,
              role: {
                select: {
                  name: true,
                },
              },
            },
          },
          budgetPool: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              financialYear: true,
            },
          },
          proposals: {
            select: {
              id: true,
              title: true,
              amount: true,
              status: true,
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
              totalAmount: true,
              date: true,
              vendor: {
                select: {
                  name: true,
                },
              },
            },
            orderBy: {
              date: 'desc',
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      return project;
    }),

  /**
   * 根據預算池 ID 查詢專案列表
   *
   * 輸入參數：
   * - budgetPoolId: 預算池 ID（UUID 格式）
   *
   * 回傳：
   * - 該預算池下的所有專案列表（按名稱排序）
   */
  getByBudgetPool: protectedProcedure
    .input(z.object({ budgetPoolId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.project.findMany({
        where: {
          budgetPoolId: input.budgetPoolId,
        },
        include: {
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
          _count: {
            select: {
              proposals: true,
              purchaseOrders: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }),

  /**
   * 查詢專案預算使用情況（Module 2 新增）
   *
   * 輸入參數：
   * - projectId: 專案 ID（UUID 格式）
   *
   * 回傳：
   * - requestedBudget: 請求預算金額
   * - approvedBudget: 批准預算金額
   * - actualSpent: 實際支出（從 PurchaseOrder 和 Expense 聚合）
   * - utilizationRate: 預算使用率（百分比）
   * - remainingBudget: 剩餘預算
   * - budgetCategory: 預算類別資訊（如果有）
   *
   * 業務邏輯：
   * - 實際支出 = 所有已批准的 Expense 總和
   * - 使用率 = (實際支出 / 批准預算) * 100%
   * - 剩餘預算 = 批准預算 - 實際支出
   */
  getBudgetUsage: protectedProcedure
    .input(z.object({ projectId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      // 查詢專案基本資訊
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        select: {
          id: true,
          name: true,
          requestedBudget: true,
          approvedBudget: true,
          budgetCategoryId: true,
          budgetCategory: {
            select: {
              id: true,
              categoryName: true,
              categoryCode: true,
              budgetPoolId: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到指定的專案',
        });
      }

      // 計算實際支出：聚合所有已批准的 Expense
      const expensesAggregation = await ctx.prisma.expense.aggregate({
        where: {
          purchaseOrder: {
            projectId: input.projectId,
          },
          status: {
            in: ['Approved', 'Paid'], // 只計算已批准和已支付的支出
          },
        },
        _sum: {
          totalAmount: true,
        },
      });

      const actualSpent = expensesAggregation._sum.totalAmount ?? 0;
      const approvedBudget = project.approvedBudget ?? 0;
      const requestedBudget = project.requestedBudget ?? 0;

      // 計算使用率和剩餘預算
      const utilizationRate = approvedBudget > 0
        ? (actualSpent / approvedBudget) * 100
        : 0;
      const remainingBudget = approvedBudget - actualSpent;

      return {
        projectId: project.id,
        projectName: project.name,
        requestedBudget,
        approvedBudget,
        actualSpent,
        utilizationRate: Math.round(utilizationRate * 100) / 100, // 四捨五入到小數點後2位
        remainingBudget,
        budgetCategory: project.budgetCategory,
      };
    }),

  /**
   * 創建新專案
   *
   * 輸入參數：
   * - name: 專案名稱（必填）
   * - description: 專案描述（可選）
   * - budgetPoolId: 預算池 ID（必填）
   * - budgetCategoryId: 預算類別 ID（可選，Module 2 新增）
   * - requestedBudget: 請求預算金額（可選，Module 2 新增）
   * - managerId: 專案經理 ID（必填）
   * - supervisorId: 主管 ID（必填）
   *
   * 回傳：
   * - 新創建的專案資訊
   *
   * 業務邏輯：
   * - 預設狀態為 "Draft"（草稿）
   * - 如果提供 budgetCategoryId，驗證其屬於選擇的 budgetPoolId
   * - 如果提供 budgetCategoryId，檢查該類別是否為 active
   */
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      // Module 2: 驗證 budgetCategoryId 是否屬於選擇的 budgetPoolId
      if (input.budgetCategoryId) {
        const budgetCategory = await ctx.prisma.budgetCategory.findUnique({
          where: { id: input.budgetCategoryId },
          select: {
            id: true,
            budgetPoolId: true,
            isActive: true,
          },
        });

        if (!budgetCategory) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '找不到指定的預算類別',
          });
        }

        if (budgetCategory.budgetPoolId !== input.budgetPoolId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '預算類別不屬於選擇的預算池',
          });
        }

        if (!budgetCategory.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '預算類別已停用',
          });
        }
      }

      return ctx.prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          budgetPoolId: input.budgetPoolId,
          budgetCategoryId: input.budgetCategoryId, // Module 2 新增
          requestedBudget: input.requestedBudget,   // Module 2 新增
          managerId: input.managerId,
          supervisorId: input.supervisorId,
          startDate: input.startDate,
          endDate: input.endDate,
          status: 'Draft', // 預設狀態為草稿
        },
        include: {
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
          budgetPool: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              financialYear: true,
            },
          },
          budgetCategory: { // Module 2 新增
            select: {
              id: true,
              categoryName: true,
              categoryCode: true,
              budgetPoolId: true,
              isActive: true,
            },
          },
        },
      });
    }),

  /**
   * 更新專案資訊
   *
   * 輸入參數：
   * - id: 專案 ID（必填）
   * - name: 專案名稱（可選）
   * - description: 專案描述（可選）
   * - status: 專案狀態（可選）
   * - budgetPoolId: 預算池 ID（可選）
   * - budgetCategoryId: 預算類別 ID（可選，Module 2 新增）
   * - requestedBudget: 請求預算金額（可選，Module 2 新增）
   * - approvedBudget: 批准預算金額（可選，Module 2 新增）
   * - managerId: 專案經理 ID（可選）
   * - supervisorId: 主管 ID（可選）
   *
   * 回傳：
   * - 更新後的專案資訊
   *
   * 業務邏輯：
   * - 只更新提供的欄位（部分更新）
   * - 如果更新 budgetCategoryId，驗證其屬於對應的 budgetPoolId
   * - 如果同時更新 budgetPoolId 和 budgetCategoryId，驗證兩者關聯
   */
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Module 2: 驗證 budgetCategoryId 與 budgetPoolId 的關聯
      if (input.budgetCategoryId) {
        // 獲取現有專案的 budgetPoolId（如果沒有在 input 中提供）
        let targetBudgetPoolId = input.budgetPoolId;
        if (!targetBudgetPoolId) {
          const existingProject = await ctx.prisma.project.findUnique({
            where: { id },
            select: { budgetPoolId: true },
          });
          if (!existingProject) {
            throw new TRPCError({
              code: 'NOT_FOUND',
              message: '找不到指定的專案',
            });
          }
          targetBudgetPoolId = existingProject.budgetPoolId;
        }

        // 驗證 budgetCategory
        const budgetCategory = await ctx.prisma.budgetCategory.findUnique({
          where: { id: input.budgetCategoryId },
          select: {
            id: true,
            budgetPoolId: true,
            isActive: true,
          },
        });

        if (!budgetCategory) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '找不到指定的預算類別',
          });
        }

        if (budgetCategory.budgetPoolId !== targetBudgetPoolId) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '預算類別不屬於對應的預算池',
          });
        }

        if (!budgetCategory.isActive) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '預算類別已停用',
          });
        }
      }

      return ctx.prisma.project.update({
        where: { id },
        data: updateData,
        include: {
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
          budgetPool: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              financialYear: true,
            },
          },
          budgetCategory: { // Module 2 新增
            select: {
              id: true,
              categoryName: true,
              categoryCode: true,
              budgetPoolId: true,
              isActive: true,
            },
          },
        },
      });
    }),

  /**
   * 刪除專案
   *
   * 輸入參數：
   * - id: 專案 ID（UUID 格式）
   *
   * 回傳：
   * - 被刪除的專案資訊
   *
   * 業務邏輯：
   * - 刪除前檢查是否有關聯的提案或採購單
   * - 如果有關聯資料，拋出錯誤，禁止刪除
   *
   * 錯誤處理：
   * - 專案不存在：拋出錯誤
   * - 有關聯提案：拋出錯誤
   * - 有關聯採購單：拋出錯誤
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 檢查專案是否存在，並查詢關聯資料數量
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              proposals: true,
              purchaseOrders: true,
            },
          },
        },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該專案',
        });
      }

      // 檢查是否有關聯的提案
      if (project._count.proposals > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除專案：此專案有 ${project._count.proposals} 個關聯的提案。請先刪除或重新分配這些提案。`,
        });
      }

      // 檢查是否有關聯的採購單
      if (project._count.purchaseOrders > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除專案：此專案有 ${project._count.purchaseOrders} 個關聯的採購單。請先刪除或重新分配這些採購單。`,
        });
      }

      // 執行刪除
      return ctx.prisma.project.delete({
        where: { id: input.id },
      });
    }),

  /**
   * 查詢專案統計數據
   *
   * 輸入參數：
   * - id: 專案 ID（UUID 格式）
   *
   * 回傳：
   * - totalProposals: 提案總數
   * - approvedProposals: 已批准提案數
   * - totalProposedAmount: 提案總金額
   * - approvedAmount: 已批准金額
   * - totalPurchaseOrders: 採購單總數
   * - totalPurchaseAmount: 採購總金額
   * - totalExpenses: 費用記錄總數
   * - totalExpenseAmount: 費用總金額
   * - paidExpenseAmount: 已支付費用金額
   *
   * 業務邏輯：
   * - 統計專案下所有提案、採購單、費用的數量和金額
   * - 用於專案儀表板和財務報告
   */
  getStats: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          proposals: {
            select: {
              amount: true,
              status: true,
            },
          },
          purchaseOrders: {
            select: {
              totalAmount: true,
              expenses: {
                select: {
                  totalAmount: true,
                  status: true,
                },
              },
            },
          },
        },
      });

      if (!project) {
        throw new Error('Project not found');
      }

      // 計算提案統計
      const totalProposals = project.proposals.length;
      const approvedProposals = project.proposals.filter(
        (p) => p.status === 'Approved'
      ).length;
      const totalProposedAmount = project.proposals.reduce(
        (sum, p) => sum + p.amount,
        0
      );
      const approvedAmount = project.proposals
        .filter((p) => p.status === 'Approved')
        .reduce((sum, p) => sum + p.amount, 0);

      // 計算採購單統計
      const totalPurchaseOrders = project.purchaseOrders.length;
      const totalPurchaseAmount = project.purchaseOrders.reduce(
        (sum, po) => sum + po.totalAmount,
        0
      );

      // 計算費用統計
      const allExpenses = project.purchaseOrders.flatMap((po) => po.expenses);
      const totalExpenses = allExpenses.length;
      const totalExpenseAmount = allExpenses.reduce(
        (sum, e) => sum + e.totalAmount,
        0
      );
      const paidExpenseAmount = allExpenses
        .filter((e) => e.status === 'Paid')
        .reduce((sum, e) => sum + e.totalAmount, 0);

      return {
        totalProposals,
        approvedProposals,
        totalProposedAmount,
        approvedAmount,
        totalPurchaseOrders,
        totalPurchaseAmount,
        totalExpenses,
        totalExpenseAmount,
        paidExpenseAmount,
      };
    }),

  /**
   * 導出專案資料（用於 CSV/Excel）
   *
   * 輸入參數：
   * - search: 搜尋關鍵字（可選）
   * - status: 專案狀態篩選（可選）
   * - budgetPoolId: 預算池 ID 篩選（可選）
   * - managerId: 專案經理 ID 篩選（可選）
   * - supervisorId: 主管 ID 篩選（可選）
   *
   * 回傳：
   * - 符合條件的所有專案列表（不分頁）
   * - 包含關聯的預算池、專案經理、主管資訊
   *
   * 用途：
   * - 提供前端導出功能的數據來源
   * - 支援 CSV 或 Excel 格式導出
   */
  export: protectedProcedure
    .input(
      z
        .object({
          search: z.string().optional(),
          status: projectStatusEnum.optional(),
          budgetPoolId: z.string().uuid().optional(),
          managerId: z.string().uuid().optional(),
          supervisorId: z.string().uuid().optional(),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        AND: [
          input?.search
            ? {
                name: {
                  contains: input.search,
                  mode: 'insensitive' as const,
                },
              }
            : {},
          input?.status ? { status: input.status } : {},
          input?.budgetPoolId ? { budgetPoolId: input.budgetPoolId } : {},
          input?.managerId ? { managerId: input.managerId } : {},
          input?.supervisorId ? { supervisorId: input.supervisorId } : {},
        ].filter((obj) => Object.keys(obj).length > 0),
      };

      const projects = await ctx.prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
          manager: {
            select: {
              name: true,
              email: true,
            },
          },
          supervisor: {
            select: {
              name: true,
              email: true,
            },
          },
          budgetPool: {
            select: {
              name: true,
              financialYear: true,
            },
          },
          _count: {
            select: {
              proposals: true,
              purchaseOrders: true,
            },
          },
        },
      });

      return projects;
    }),

  /**
   * 執行 Charge Out (Story 6.4)
   * @param id - 專案 ID
   * @returns 更新後的 Project
   *
   * 業務邏輯:
   * 1. 檢查專案所有費用是否都已支付 (Paid 狀態)
   * 2. 更新專案狀態為 Completed
   * 3. 記錄 chargeOutDate
   */
  chargeOut: protectedProcedure
    .input(z.object({
      id: z.string().uuid('無效的專案ID'),
    }))
    .mutation(async ({ ctx, input }) => {
      // 1. 檢查專案是否存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrders: {
            include: {
              expenses: true,
            },
          },
        },
      });

      if (!project) {
        throw new Error('找不到該專案');
      }

      // 2. 檢查專案狀態
      if (project.status === 'Completed' || project.status === 'Archived') {
        throw new Error('專案已完成或已歸檔，無法再次執行 Charge Out');
      }

      // 3. 收集所有費用記錄
      const allExpenses = project.purchaseOrders.flatMap(po => po.expenses);

      if (allExpenses.length === 0) {
        throw new Error('專案沒有任何費用記錄，無法執行 Charge Out');
      }

      // 4. 檢查是否所有費用都已支付
      const unpaidExpenses = allExpenses.filter(exp => exp.status !== 'Paid');

      if (unpaidExpenses.length > 0) {
        throw new Error(
          `專案還有 ${unpaidExpenses.length} 筆未支付的費用，無法執行 Charge Out。所有費用必須處於「已支付」狀態。`
        );
      }

      // 5. 更新專案狀態為 Completed 並記錄 chargeOutDate
      const updatedProject = await ctx.prisma.project.update({
        where: { id: input.id },
        data: {
          status: 'Completed',
          chargeOutDate: new Date(),
        },
        include: {
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
          budgetPool: {
            select: {
              id: true,
              name: true,
              totalAmount: true,
              usedAmount: true,
              financialYear: true,
            },
          },
          _count: {
            select: {
              proposals: true,
              purchaseOrders: true,
            },
          },
        },
      });

      return updatedProject;
    }),
});
