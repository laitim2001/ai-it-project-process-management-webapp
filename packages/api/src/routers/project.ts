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
 * 必填欄位：name（專案名稱）、budgetPoolId（預算池ID）、managerId（專案經理ID）、supervisorId（主管ID）
 * 可選欄位：description（專案描述）
 */
export const createProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(255),
  description: z.string().optional(),
  budgetPoolId: z.string().uuid('Invalid budget pool ID'),
  managerId: z.string().uuid('Invalid manager ID'),
  supervisorId: z.string().uuid('Invalid supervisor ID'),
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
  budgetPoolId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  supervisorId: z.string().uuid().optional(),
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
          budgetPoolId: z.string().uuid().optional(),
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
   * 創建新專案
   *
   * 輸入參數：
   * - name: 專案名稱（必填）
   * - description: 專案描述（可選）
   * - budgetPoolId: 預算池 ID（必填）
   * - managerId: 專案經理 ID（必填）
   * - supervisorId: 主管 ID（必填）
   *
   * 回傳：
   * - 新創建的專案資訊
   *
   * 業務邏輯：
   * - 預設狀態為 "Draft"（草稿）
   */
  create: protectedProcedure
    .input(createProjectSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.project.create({
        data: {
          name: input.name,
          description: input.description,
          budgetPoolId: input.budgetPoolId,
          managerId: input.managerId,
          supervisorId: input.supervisorId,
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
   * - managerId: 專案經理 ID（可選）
   * - supervisorId: 主管 ID（可選）
   *
   * 回傳：
   * - 更新後的專案資訊
   *
   * 業務邏輯：
   * - 只更新提供的欄位（部分更新）
   */
  update: protectedProcedure
    .input(updateProjectSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

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
        throw new Error('Project not found');
      }

      // 檢查是否有關聯的提案
      if (project._count.proposals > 0) {
        throw new Error(
          'Cannot delete project with existing proposals. Please delete or reassign proposals first.'
        );
      }

      // 檢查是否有關聯的採購單
      if (project._count.purchaseOrders > 0) {
        throw new Error(
          'Cannot delete project with existing purchase orders. Please delete or reassign purchase orders first.'
        );
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
                  amount: true,
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
        (sum, e) => sum + e.amount,
        0
      );
      const paidExpenseAmount = allExpenses
        .filter((e) => e.status === 'Paid')
        .reduce((sum, e) => sum + e.amount, 0);

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
});
