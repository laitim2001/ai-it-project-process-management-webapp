import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

/**
 * OMExpense Router
 * 操作與維護費用（O&M Expense）管理 API
 *
 * 業務特點：
 * 1. 表頭-明細結構（Header-Detail Pattern）
 * 2. 表頭：年度、類別、OpCo、預算金額等
 * 3. 明細：12個月的實際支出記錄
 * 4. actualSpent 由月度記錄自動計算
 * 5. 支持年度增長率計算（YoY Growth Rate）
 */

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
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

const updateMonthlyRecordsSchema = z.object({
  omExpenseId: z.string().min(1, 'OM費用 ID 不能為空'),
  monthlyData: z.array(monthlyRecordSchema).length(12, '必須提供 12 個月的數據'),
});

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
      const result = await ctx.prisma.$transaction(async (tx) => {
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
});
