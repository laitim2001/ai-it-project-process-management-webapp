/**
 * @fileoverview OM Expense Router - 操作與維護費用管理 API
 *
 * @description
 * 提供 O&M (Operations & Maintenance) 費用的完整管理功能，支援表頭-明細架構。
 * 表頭記錄年度預算和基本資訊，明細記錄12個月的實際支出，系統自動彙總計算總支出。
 * 支援跨年度比較和年增長率（YoY）計算，用於預算追蹤和趨勢分析。
 *
 * @module api/routers/omExpense
 *
 * @features
 * - 建立 OM 費用並自動初始化 12 個月度記錄
 * - 批量更新月度實際支出並自動重算總額
 * - 計算年度增長率（YoY Growth Rate）與歷史比較
 * - 查詢 OM 費用列表（支援年度、OpCo、類別過濾）
 * - 查詢月度支出匯總（用於儀表板統計圖表）
 * - 獲取所有 OM 類別列表（用於下拉選單）
 * - 級聯刪除檢查（刪除時自動刪除月度記錄）
 *
 * @procedures
 * - create: 建立 OM 費用（自動建立 12 個月度記錄）
 * - update: 更新 OM 費用基本資訊
 * - updateMonthlyRecords: 批量更新月度記錄並重算總額
 * - calculateYoYGrowth: 計算年度增長率
 * - getById: 查詢單一 OM 費用詳情（含月度記錄和來源費用）
 * - getAll: 查詢 OM 費用列表（支援分頁和過濾）
 * - getBySourceExpenseId: 查詢由指定費用衍生的 OM 費用列表 (CHANGE-001)
 * - delete: 刪除 OM 費用（級聯刪除月度記錄）
 * - getCategories: 獲取所有 OM 類別列表
 * - getMonthlyTotals: 獲取指定年度的月度支出匯總
 *
 * @dependencies
 * - Prisma Client: 資料庫操作和交易管理
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - OMExpense 和 OMExpenseMonthly 資料模型
 * - packages/api/src/routers/operatingCompany.ts - 營運公司 Router
 * - packages/api/src/routers/vendor.ts - 供應商 Router
 * - apps/web/src/app/[locale]/om-expenses/page.tsx - OM 費用列表頁面
 *
 * @author IT Department
 * @since Module 3 - OM Expense Management
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ========== Zod Schemas ==========

const monthlyRecordSchema = z.object({
  month: z.number().int().min(1).max(12),
  actualAmount: z.number().nonnegative(),
});

const createOMExpenseSchema = z.object({
  name: z.string().min(1, 'OM費用名稱不能為空').max(200),
  description: z.string().optional(),
  financialYear: z.number().int().min(2000).max(2100),
  category: z.string().min(1, '類別不能為空').max(100),
  opCoId: z.string().min(1, 'OpCo 不能為空'),
  budgetAmount: z.number().positive('預算金額必須大於 0'),
  vendorId: z.string().optional(),
  sourceExpenseId: z.string().optional(), // CHANGE-001: 來源費用追蹤
  startDate: z.string().min(1, '開始日期不能為空'),
  endDate: z.string().min(1, '結束日期不能為空'),
});

const updateOMExpenseSchema = z.object({
  id: z.string().min(1, 'ID 不能為空'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  category: z.string().min(1).max(100).optional(),
  budgetAmount: z.number().positive().optional(),
  vendorId: z.string().optional().nullable(),
  sourceExpenseId: z.string().optional().nullable(), // CHANGE-001: 來源費用追蹤
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateMonthlyRecordsSchema = z.object({
  omExpenseId: z.string().min(1, 'OM費用 ID 不能為空'),
  monthlyData: z.array(monthlyRecordSchema).length(12, '必須提供 12 個月的數據'),
});

// ========== Summary API Schema ==========

const getSummarySchema = z.object({
  currentYear: z.number().int().min(2000).max(2100),
  previousYear: z.number().int().min(2000).max(2100),
  opCoIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

// ========== TypeScript Types for Summary ==========

export interface CategorySummaryItem {
  category: string;
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  currentYearBudget: number;
  previousYearActual: number | null;
  changePercent: number | null;
  endDate: Date;
}

export interface OpCoSubTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

export interface OpCoGroup {
  opCoId: string;
  opCoCode: string;
  opCoName: string;
  items: ItemDetail[];
  subTotal: OpCoSubTotal;
}

export interface CategoryTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

export interface CategoryDetailGroup {
  category: string;
  opCoGroups: OpCoGroup[];
  categoryTotal: CategoryTotal;
}

export interface GrandTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

export interface SummaryMeta {
  currentYear: number;
  previousYear: number;
  selectedOpCos: string[];
  selectedCategories: string[];
}

export interface OMSummaryResponse {
  categorySummary: CategorySummaryItem[];
  detailData: CategoryDetailGroup[];
  grandTotal: GrandTotal;
  meta: SummaryMeta;
}

// ========== Router ==========

export const omExpenseRouter = createTRPCRouter({
  /**
   * 創建 OM 費用
   * 自動初始化 12 個月度記錄（actualAmount = 0）
   */
  create: protectedProcedure
    .input(createOMExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OpCo 是否存在
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.opCoId },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OpCo 不存在',
        });
      }

      // 如果提供了 vendorId，驗證 vendor 是否存在
      if (input.vendorId) {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { id: input.vendorId },
        });

        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '供應商不存在',
          });
        }
      }

      // CHANGE-001: 如果提供了 sourceExpenseId，驗證 expense 是否存在
      if (input.sourceExpenseId) {
        const sourceExpense = await ctx.prisma.expense.findUnique({
          where: { id: input.sourceExpenseId },
        });

        if (!sourceExpense) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '來源費用記錄不存在',
          });
        }
      }

      // 驗證日期邏輯
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (startDate >= endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '結束日期必須晚於開始日期',
        });
      }

      // 使用 transaction 創建 OM 費用和月度記錄
      const omExpense = await ctx.prisma.$transaction(async (tx) => {
        // 1. 創建 OM 費用表頭
        const newOMExpense = await tx.oMExpense.create({
          data: {
            name: input.name,
            description: input.description,
            financialYear: input.financialYear,
            category: input.category,
            opCoId: input.opCoId,
            budgetAmount: input.budgetAmount,
            actualSpent: 0, // 初始為 0
            vendorId: input.vendorId,
            sourceExpenseId: input.sourceExpenseId, // CHANGE-001: 來源費用追蹤
            startDate,
            endDate,
          },
        });

        // 2. 自動創建 12 個月度記錄（初始 actualAmount = 0）
        const monthlyRecords = Array.from({ length: 12 }, (_, i) => ({
          omExpenseId: newOMExpense.id,
          month: i + 1,
          actualAmount: 0,
          opCoId: input.opCoId,
        }));

        await tx.oMExpenseMonthly.createMany({
          data: monthlyRecords,
        });

        // 3. 返回完整的 OM 費用（包含月度記錄）
        return tx.oMExpense.findUnique({
          where: { id: newOMExpense.id },
          include: {
            opCo: true,
            vendor: true,
            sourceExpense: {
              // CHANGE-001: 包含來源費用詳情
              include: {
                purchaseOrder: {
                  include: {
                    project: true,
                  },
                },
              },
            },
            monthlyRecords: {
              orderBy: { month: 'asc' },
            },
          },
        });
      });

      return omExpense;
    }),

  /**
   * 更新 OM 費用基本資訊
   * 注意：不更新 actualSpent（由月度記錄自動計算）
   */
  update: protectedProcedure
    .input(updateOMExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 驗證 OM 費用是否存在
      const existing = await ctx.prisma.oMExpense.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 如果提供了 vendorId，驗證 vendor 是否存在
      if (updateData.vendorId) {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { id: updateData.vendorId },
        });

        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '供應商不存在',
          });
        }
      }

      // CHANGE-001: 如果提供了 sourceExpenseId，驗證 expense 是否存在
      if (updateData.sourceExpenseId) {
        const sourceExpense = await ctx.prisma.expense.findUnique({
          where: { id: updateData.sourceExpenseId },
        });

        if (!sourceExpense) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '來源費用記錄不存在',
          });
        }
      }

      // 驗證日期邏輯（如果有更新日期）
      if (updateData.startDate || updateData.endDate) {
        const startDate = updateData.startDate
          ? new Date(updateData.startDate)
          : existing.startDate;
        const endDate = updateData.endDate ? new Date(updateData.endDate) : existing.endDate;

        if (startDate >= endDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '結束日期必須晚於開始日期',
          });
        }
      }

      // 處理日期轉換
      const dataToUpdate: Record<string, unknown> = { ...updateData };
      if (updateData.startDate) {
        dataToUpdate.startDate = new Date(updateData.startDate);
      }
      if (updateData.endDate) {
        dataToUpdate.endDate = new Date(updateData.endDate);
      }

      // 更新 OM 費用
      const updated = await ctx.prisma.oMExpense.update({
        where: { id },
        data: dataToUpdate,
        include: {
          opCo: true,
          vendor: true,
          sourceExpense: {
            // CHANGE-001: 包含來源費用詳情
            include: {
              purchaseOrder: {
                include: {
                  project: true,
                },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 批量更新月度記錄
   * 接收 12 個月的數據，自動重算 actualSpent
   */
  updateMonthlyRecords: protectedProcedure
    .input(updateMonthlyRecordsSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 驗證月份是否完整（1-12）
      const months = input.monthlyData.map((d) => d.month).sort((a, b) => a - b);
      const expectedMonths = Array.from({ length: 12 }, (_, i) => i + 1);

      if (JSON.stringify(months) !== JSON.stringify(expectedMonths)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '必須提供完整的 1-12 月數據',
        });
      }

      // 使用 transaction 更新月度記錄和 actualSpent
      const _result = await ctx.prisma.$transaction(async (tx) => {
        // 1. 批量更新月度記錄
        for (const monthData of input.monthlyData) {
          await tx.oMExpenseMonthly.upsert({
            where: {
              omExpenseId_month: {
                omExpenseId: input.omExpenseId,
                month: monthData.month,
              },
            },
            update: {
              actualAmount: monthData.actualAmount,
            },
            create: {
              omExpenseId: input.omExpenseId,
              month: monthData.month,
              actualAmount: monthData.actualAmount,
              opCoId: omExpense.opCoId,
            },
          });
        }

        // 2. 計算總實際支出
        const monthlyRecords = await tx.oMExpenseMonthly.findMany({
          where: { omExpenseId: input.omExpenseId },
        });

        const actualSpent = monthlyRecords.reduce(
          (sum, record) => sum + record.actualAmount,
          0
        );

        // 3. 更新 OM 費用的 actualSpent
        await tx.oMExpense.update({
          where: { id: input.omExpenseId },
          data: { actualSpent },
        });

        return { success: true, actualSpent };
      });

      // 返回更新後的完整資料
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 計算年度增長率（YoY Growth Rate）
   * 對比上一年度相同名稱、類別、OpCo 的記錄
   */
  calculateYoYGrowth: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const currentOMExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
      });

      if (!currentOMExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 查找上年度同類別同名稱的 OM 費用
      const previousYear = currentOMExpense.financialYear - 1;
      const previousOMExpense = await ctx.prisma.oMExpense.findFirst({
        where: {
          name: currentOMExpense.name,
          category: currentOMExpense.category,
          opCoId: currentOMExpense.opCoId,
          financialYear: previousYear,
        },
      });

      // 如果沒有上年度數據或上年度實際支出為 0，無法計算增長率
      if (!previousOMExpense || previousOMExpense.actualSpent === 0) {
        return {
          yoyGrowthRate: null,
          message: '無上年度數據可比較，或上年度實際支出為 0',
          currentYear: currentOMExpense.financialYear,
          currentAmount: currentOMExpense.actualSpent,
          previousYear: null,
          previousAmount: null,
        };
      }

      // 計算增長率 = (本年 - 上年) / 上年 * 100
      const yoyGrowthRate =
        ((currentOMExpense.actualSpent - previousOMExpense.actualSpent) /
          previousOMExpense.actualSpent) *
        100;

      // 更新增長率
      await ctx.prisma.oMExpense.update({
        where: { id: input.id },
        data: { yoyGrowthRate },
      });

      return {
        yoyGrowthRate,
        currentYear: currentOMExpense.financialYear,
        currentAmount: currentOMExpense.actualSpent,
        previousYear,
        previousAmount: previousOMExpense.actualSpent,
      };
    }),

  /**
   * 獲取 OM 費用詳情（含月度記錄）
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
        include: {
          opCo: true,
          vendor: true,
          sourceExpense: {
            // CHANGE-001: 包含來源費用詳情
            include: {
              purchaseOrder: {
                include: {
                  project: true,
                },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      return omExpense;
    }),

  /**
   * 獲取 OM 費用列表
   * 支持過濾：年度、OpCo、類別
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          financialYear: z.number().int().optional(),
          opCoId: z.string().optional(),
          category: z.string().optional(),
          page: z.number().int().min(1).optional().default(1),
          limit: z.number().int().min(1).max(100).optional().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (input?.financialYear) {
        where.financialYear = input.financialYear;
      }

      if (input?.opCoId) {
        where.opCoId = input.opCoId;
      }

      if (input?.category) {
        where.category = input.category;
      }

      // 獲取總數
      const total = await ctx.prisma.oMExpense.count({ where });

      // 獲取列表
      const items = await ctx.prisma.oMExpense.findMany({
        where,
        include: {
          opCo: true,
          vendor: true,
          _count: {
            select: { monthlyRecords: true },
          },
        },
        orderBy: [{ financialYear: 'desc' }, { category: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      });

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * 刪除 OM 費用
   * 會同時刪除關聯的月度記錄（onDelete: Cascade）
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 刪除 OM 費用（會自動刪除月度記錄，因為設置了 onDelete: Cascade）
      await ctx.prisma.oMExpense.delete({
        where: { id: input.id },
      });

      return { success: true, message: 'OM 費用已刪除' };
    }),

  /**
   * 獲取所有 OM 類別列表（用於下拉選單）
   * 從現有資料中提取唯一的類別名稱
   */
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.oMExpense.findMany({
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });

    return categories.map((c) => c.category);
  }),

  /**
   * 獲取指定年度的月度支出匯總
   * 用於儀表板統計
   */
  getMonthlyTotals: protectedProcedure
    .input(
      z.object({
        financialYear: z.number().int().min(2000).max(2100),
        opCoId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        financialYear: input.financialYear,
      };

      if (input.opCoId) {
        where.opCoId = input.opCoId;
      }

      // 獲取所有符合條件的 OM 費用 ID
      const omExpenses = await ctx.prisma.oMExpense.findMany({
        where,
        select: { id: true },
      });

      const omExpenseIds = omExpenses.map((om) => om.id);

      // 如果沒有 OM 費用，返回 12 個月的 0
      if (omExpenseIds.length === 0) {
        return Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          totalAmount: 0,
        }));
      }

      // 獲取月度記錄，按月份分組加總
      const monthlyRecords = await ctx.prisma.oMExpenseMonthly.findMany({
        where: {
          omExpenseId: { in: omExpenseIds },
        },
        select: {
          month: true,
          actualAmount: true,
        },
      });

      // 按月份分組加總
      const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const records = monthlyRecords.filter((r) => r.month === month);
        const totalAmount = records.reduce((sum, r) => sum + r.actualAmount, 0);

        return {
          month,
          totalAmount,
        };
      });

      return monthlyTotals;
    }),

  /**
   * 獲取 O&M Summary 數據
   * 支援跨年度比較和多層級分組（Category → OpCo → Items）
   *
   * @description
   * 此 API 提供 O&M 費用的匯總視圖，用於 O&M Summary 頁面。
   * - 類別匯總：按 O&M Category 分組，顯示預算、實際支出和變化百分比
   * - 明細數據：按 Category → OpCo → Items 階層結構組織
   * - 支援多選 OpCo 和 Category 過濾
   *
   * @param currentYear - 當前財務年度（用於 Budget 數據）
   * @param previousYear - 上一財務年度（用於 Actual 數據）
   * @param opCoIds - 可選的 OpCo ID 過濾陣列
   * @param categories - 可選的 Category 過濾陣列
   *
   * @returns OMSummaryResponse - 包含類別匯總、明細數據和總計
   */
  getSummary: protectedProcedure
    .input(getSummarySchema)
    .query(async ({ ctx, input }): Promise<OMSummaryResponse> => {
      const { currentYear, previousYear, opCoIds, categories } = input;

      // 構建查詢條件
      const currentYearWhere: Record<string, unknown> = {
        financialYear: currentYear,
      };

      const previousYearWhere: Record<string, unknown> = {
        financialYear: previousYear,
      };

      // OpCo 過濾
      if (opCoIds && opCoIds.length > 0) {
        currentYearWhere.opCoId = { in: opCoIds };
        previousYearWhere.opCoId = { in: opCoIds };
      }

      // Category 過濾
      if (categories && categories.length > 0) {
        currentYearWhere.category = { in: categories };
        previousYearWhere.category = { in: categories };
      }

      // 查詢當前年度數據（Budget）
      const currentYearData = await ctx.prisma.oMExpense.findMany({
        where: currentYearWhere,
        include: {
          opCo: true,
          vendor: true,
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      // 查詢上年度數據（Actual）
      const previousYearData = await ctx.prisma.oMExpense.findMany({
        where: previousYearWhere,
        select: {
          id: true,
          name: true,
          category: true,
          opCoId: true,
          actualSpent: true,
        },
      });

      // 建立上年度數據的查找映射（按 name + category + opCoId）
      const previousYearMap = new Map<string, number>();
      for (const item of previousYearData) {
        const key = `${item.name}|${item.category}|${item.opCoId}`;
        previousYearMap.set(key, item.actualSpent);
      }

      // 計算變化百分比的輔助函數
      const calculateChangePercent = (
        currentBudget: number,
        previousActual: number | null
      ): number | null => {
        if (previousActual === null || previousActual === 0) {
          return null;
        }
        return ((currentBudget - previousActual) / previousActual) * 100;
      };

      // ========== 1. 計算類別匯總 ==========
      const categoryMap = new Map<
        string,
        {
          currentYearBudget: number;
          previousYearActual: number;
          itemCount: number;
        }
      >();

      for (const item of currentYearData) {
        const existing = categoryMap.get(item.category) || {
          currentYearBudget: 0,
          previousYearActual: 0,
          itemCount: 0,
        };

        const prevKey = `${item.name}|${item.category}|${item.opCoId}`;
        const prevActual = previousYearMap.get(prevKey) || 0;

        categoryMap.set(item.category, {
          currentYearBudget: existing.currentYearBudget + item.budgetAmount,
          previousYearActual: existing.previousYearActual + prevActual,
          itemCount: existing.itemCount + 1,
        });
      }

      const categorySummary: CategorySummaryItem[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          currentYearBudget: data.currentYearBudget,
          previousYearActual: data.previousYearActual,
          changePercent: calculateChangePercent(data.currentYearBudget, data.previousYearActual),
          itemCount: data.itemCount,
        }))
        .sort((a, b) => a.category.localeCompare(b.category));

      // ========== 2. 計算明細數據（Category → OpCo → Items） ==========
      // 首先按 Category 分組
      const categoryDetailMap = new Map<
        string,
        Map<
          string,
          {
            opCoId: string;
            opCoCode: string;
            opCoName: string;
            items: ItemDetail[];
          }
        >
      >();

      for (const item of currentYearData) {
        // 確保 Category 存在
        if (!categoryDetailMap.has(item.category)) {
          categoryDetailMap.set(item.category, new Map());
        }

        const opCoMap = categoryDetailMap.get(item.category)!;

        // 確保 OpCo 存在
        if (!opCoMap.has(item.opCoId)) {
          opCoMap.set(item.opCoId, {
            opCoId: item.opCoId,
            opCoCode: item.opCo.code,
            opCoName: item.opCo.name,
            items: [],
          });
        }

        // 獲取上年度實際支出
        const prevKey = `${item.name}|${item.category}|${item.opCoId}`;
        const previousYearActual = previousYearMap.get(prevKey) ?? null;

        // 添加項目
        const opCoGroup = opCoMap.get(item.opCoId)!;
        opCoGroup.items.push({
          id: item.id,
          name: item.name,
          description: item.description,
          currentYearBudget: item.budgetAmount,
          previousYearActual,
          changePercent: calculateChangePercent(item.budgetAmount, previousYearActual),
          endDate: item.endDate,
        });
      }

      // 轉換為最終結構並計算小計
      const detailData: CategoryDetailGroup[] = [];

      const sortedCategories = Array.from(categoryDetailMap.keys()).sort();

      for (const category of sortedCategories) {
        const opCoMap = categoryDetailMap.get(category)!;
        const opCoGroups: OpCoGroup[] = [];

        let categoryBudgetTotal = 0;
        let categoryActualTotal = 0;

        // 按 OpCo Code 排序
        const sortedOpCos = Array.from(opCoMap.values()).sort((a, b) =>
          a.opCoCode.localeCompare(b.opCoCode)
        );

        for (const opCoData of sortedOpCos) {
          // 按項目名稱排序
          opCoData.items.sort((a, b) => a.name.localeCompare(b.name));

          // 計算 OpCo 小計
          const opCoBudgetTotal = opCoData.items.reduce(
            (sum, item) => sum + item.currentYearBudget,
            0
          );
          const opCoActualTotal = opCoData.items.reduce(
            (sum, item) => sum + (item.previousYearActual || 0),
            0
          );

          categoryBudgetTotal += opCoBudgetTotal;
          categoryActualTotal += opCoActualTotal;

          opCoGroups.push({
            opCoId: opCoData.opCoId,
            opCoCode: opCoData.opCoCode,
            opCoName: opCoData.opCoName,
            items: opCoData.items,
            subTotal: {
              currentYearBudget: opCoBudgetTotal,
              previousYearActual: opCoActualTotal,
              changePercent: calculateChangePercent(opCoBudgetTotal, opCoActualTotal),
            },
          });
        }

        detailData.push({
          category,
          opCoGroups,
          categoryTotal: {
            currentYearBudget: categoryBudgetTotal,
            previousYearActual: categoryActualTotal,
            changePercent: calculateChangePercent(categoryBudgetTotal, categoryActualTotal),
          },
        });
      }

      // ========== 3. 計算總計 ==========
      const grandTotal: GrandTotal = {
        currentYearBudget: categorySummary.reduce((sum, c) => sum + c.currentYearBudget, 0),
        previousYearActual: categorySummary.reduce((sum, c) => sum + c.previousYearActual, 0),
        changePercent: null,
        itemCount: categorySummary.reduce((sum, c) => sum + c.itemCount, 0),
      };

      grandTotal.changePercent = calculateChangePercent(
        grandTotal.currentYearBudget,
        grandTotal.previousYearActual
      );

      // ========== 4. 返回結果 ==========
      return {
        categorySummary,
        detailData,
        grandTotal,
        meta: {
          currentYear,
          previousYear,
          selectedOpCos: opCoIds || [],
          selectedCategories: categories || [],
        },
      };
    }),

  /**
   * CHANGE-001: 查詢由指定費用衍生的 OM 費用列表
   * 用於追蹤 Expense 轉換為 OM 費用的歷史
   */
  getBySourceExpenseId: protectedProcedure
    .input(z.object({ sourceExpenseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const omExpenses = await ctx.prisma.oMExpense.findMany({
        where: { sourceExpenseId: input.sourceExpenseId },
        include: {
          opCo: true,
          vendor: true,
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
        orderBy: { financialYear: 'desc' },
      });

      return omExpenses;
    }),
});
