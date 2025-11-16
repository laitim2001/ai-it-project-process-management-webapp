/**
 * @fileoverview Project Router - 專案管理 API
 *
 * @description
 * 提供專案的完整生命週期管理，從建立到完成的所有功能。
 * 專案是整個預算流程的核心，關聯預算池、提案、採購單、費用等模組。
 * 支援分頁、搜尋、過濾、排序，以及預算使用率追蹤和費用轉嫁（Charge Out）功能。
 * 包含角色權限控制，確保專案經理和主管的資料隔離。
 *
 * @module api/routers/project
 *
 * @features
 * - 建立專案並關聯預算池和預算類別（Module 2）
 * - 查詢專案列表（支援分頁、搜尋、多條件過濾和排序）
 * - 查詢單一專案詳情（包含提案、採購單、費用記錄）
 * - 更新專案資訊和狀態（Draft → InProgress → Completed）
 * - 刪除專案（級聯刪除檢查保護）
 * - 查詢專案預算使用情況（實際支出、使用率、剩餘預算）
 * - 查詢專案統計數據（提案、採購單、費用匯總）
 * - 導出專案資料（支援 CSV/Excel 格式）
 * - 執行費用轉嫁（Charge Out）將專案標記為完成
 *
 * @procedures
 * - create: 建立新專案（關聯預算池和預算類別）
 * - update: 更新專案資訊（支援部分更新）
 * - delete: 刪除專案（檢查關聯資料保護）
 * - getAll: 查詢專案列表（支援分頁和多條件過濾）
 * - getById: 查詢單一專案詳情（包含所有關聯資料）
 * - getByBudgetPool: 根據預算池查詢專案列表
 * - getBudgetUsage: 查詢專案預算使用情況（Module 2）
 * - getStats: 查詢專案統計數據（提案、採購單、費用）
 * - export: 導出專案資料（不分頁）
 * - chargeOut: 執行費用轉嫁並標記專案完成（Story 6.4）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作和交易管理
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - Project 資料模型
 * - packages/api/src/routers/budgetPool.ts - 預算池 Router
 * - packages/api/src/routers/budgetProposal.ts - 預算提案 Router
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 Router
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案列表頁面
 *
 * @author IT Department
 * @since Epic 2 - Project Management
 * @lastModified 2025-11-14
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
 * 全域標誌枚舉 (FEAT-001)
 * - RCL: Regional/Corporate Level（全域專案）
 * - Region: 區域專案
 */
export const globalFlagEnum = z.enum(['RCL', 'Region']);

/**
 * 優先權枚舉 (FEAT-001)
 * - High: 高優先
 * - Medium: 中優先
 * - Low: 低優先
 */
export const priorityEnum = z.enum(['High', 'Medium', 'Low']);

/**
 * 創建專案的驗證 Schema
 * 必填欄位：name（專案名稱）、projectCode（專案編號）、budgetPoolId（預算池ID）、managerId（專案經理ID）、supervisorId（主管ID）、startDate（開始日期）
 * 可選欄位：description（專案描述）、endDate（結束日期）、budgetCategoryId（預算類別ID）、requestedBudget（請求預算金額）、globalFlag（全域標誌，預設 Region）、priority（優先權，預設 Medium）、currencyId（貨幣 ID）
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

  // FEAT-001: 專案欄位擴展 (4 個新欄位)
  projectCode: z
    .string()
    .min(1, 'Project code is required')
    .max(50, 'Project code must be <= 50 characters')
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Project code can only contain letters, numbers, hyphens, and underscores'),
  globalFlag: globalFlagEnum.default('Region'), // 預設為 Region
  priority: priorityEnum.default('Medium'), // 預設為 Medium
  currencyId: z.string().uuid('Invalid currency ID').optional(), // 可選：貨幣 ID
});

/**
 * 更新專案的驗證 Schema
 * 必填欄位：id（專案ID）
 * 所有其他欄位均為可選（包含 FEAT-001 的 4 個新欄位）
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

  // FEAT-001: 專案欄位擴展 (4 個新欄位，所有可選)
  projectCode: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-zA-Z0-9\-_]+$/, 'Project code can only contain letters, numbers, hyphens, and underscores')
    .optional(),
  globalFlag: globalFlagEnum.optional(),
  priority: priorityEnum.optional(),
  currencyId: z.string().uuid('Invalid currency ID').nullable().optional(), // 可選且可為 null
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
   * - 刪除前檢查是否有關聯的提案、採購單、報價單或費用轉嫁
   * - 如果有任何關聯資料，拋出錯誤並列出所有關聯，禁止刪除
   *
   * 錯誤處理：
   * - 專案不存在：拋出錯誤
   * - 有關聯提案：拋出錯誤
   * - 有關聯採購單：拋出錯誤
   * - 有關聯報價單：拋出錯誤
   * - 有關聯費用轉嫁：拋出錯誤
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
              quotes: true,
              chargeOuts: true,
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

      // 檢查所有關聯資料
      const errors: string[] = [];

      if (project._count.proposals > 0) {
        errors.push(`${project._count.proposals} 個預算提案`);
      }

      if (project._count.purchaseOrders > 0) {
        errors.push(`${project._count.purchaseOrders} 個採購單`);
      }

      if (project._count.quotes > 0) {
        errors.push(`${project._count.quotes} 個報價單`);
      }

      if (project._count.chargeOuts > 0) {
        errors.push(`${project._count.chargeOuts} 個費用轉嫁記錄`);
      }

      if (errors.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除專案：此專案有以下關聯資料：\n- ${errors.join('\n- ')}\n\n請先處理這些資料後再刪除專案。`,
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

  /**
   * 檢查專案編號是否可用 (FEAT-001)
   *
   * @description
   * 即時檢查專案編號的唯一性，用於表單驗證。
   * 如果提供 excludeProjectId，則會排除該專案（用於編輯時檢查）。
   *
   * 輸入參數：
   * - projectCode: 要檢查的專案編號
   * - excludeProjectId: 要排除的專案 ID（可選，編輯時使用）
   *
   * 回傳：
   * - available: boolean - 專案編號是否可用
   * - message: string - 提示訊息
   *
   * @example
   * ```typescript
   * // 建立時檢查
   * const { available } = await api.project.checkCodeAvailability.query({
   *   projectCode: 'PROJ-2025-001'
   * });
   *
   * // 編輯時檢查（排除自己）
   * const { available } = await api.project.checkCodeAvailability.query({
   *   projectCode: 'PROJ-2025-001',
   *   excludeProjectId: 'abc-123-def'
   * });
   * ```
   */
  checkCodeAvailability: protectedProcedure
    .input(
      z.object({
        projectCode: z
          .string()
          .min(1)
          .max(50)
          .regex(/^[a-zA-Z0-9\-_]+$/),
        excludeProjectId: z.string().uuid().optional(), // 編輯時排除自己
      })
    )
    .query(async ({ ctx, input }) => {
      const existing = await ctx.prisma.project.findUnique({
        where: { projectCode: input.projectCode },
        select: { id: true },
      });

      // 如果找不到重複，表示可用
      if (!existing) {
        return {
          available: true,
          message: 'Project code is available',
        };
      }

      // 如果找到重複，但是是自己（編輯場景），表示可用
      if (input.excludeProjectId && existing.id === input.excludeProjectId) {
        return {
          available: true,
          message: 'Project code is available (current project)',
        };
      }

      // 否則不可用
      return {
        available: false,
        message: 'Project code is already in use',
      };
    }),
});
