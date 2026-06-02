/**
 * @fileoverview Project Expense Router - 專案費用月度管理 API
 *
 * @description
 * FEAT-015: 為專案新增「按月」維度的費用模組，比照 OM Expense 的三層架構：
 * ProjectExpense（表頭）→ ProjectExpenseItem（明細）→ ProjectExpenseMonthly（月度）。
 * 一個 Project 可有多份費用表（表頭），每張表含多個明細，每個明細有 12 個月的
 * 「預算（budgetAmount）」與「實際（actualAmount）」（比 OM 月度多一個預算欄位）。
 *
 * 與既有 PO→Expense 聚合的實際支出為「同一筆錢的兩種記法」：v1 各自獨立、
 * 任何地方不得相加、不自動同步、不約束 approvedBudget（決策 D11）。
 *
 * @module api/routers/projectExpense
 *
 * @features
 * - 三層架構：表頭（年度）→ 明細（幣別/類別/OpCo）→ 月度（預算+實際）
 * - 明細支援新增 / 編輯 / 刪除 / 拖曳排序（sortOrder）
 * - 月度批量更新（恆 12 筆）+ 二級彙總自動回算（月度→明細→表頭）
 * - 金額一律以 USD 儲存；換算與雙幣別顯示由前端負責
 *
 * @procedures
 * - getByProject: 取某專案所有費用表（表頭，含明細/月度/currency/category/opCo）
 * - createExpense: 新增表頭
 * - updateExpense: 更新表頭
 * - removeExpense: 刪除表頭（級聯刪明細與月度）
 * - addItem: 於表頭下新增明細（自動建立 12 筆月度，budget=0, actual=0）
 * - updateItem: 更新明細基本資訊
 * - removeItem: 刪除明細（級聯刪月度，回算表頭彙總）
 * - reorderItems: 明細拖曳排序
 * - updateItemMonthlyRecords: 批量更新明細 12 個月，回算明細與表頭彙總
 *
 * @dependencies
 * - Prisma Client: 資料庫操作與交易
 * - Zod: 輸入驗證
 * - tRPC: API 框架
 *
 * @related
 * - packages/db/prisma/schema.prisma - ProjectExpense / ProjectExpenseItem / ProjectExpenseMonthly
 * - packages/api/src/routers/omExpense.ts - 架構參考（FEAT-007 三層）
 * - apps/web/src/components/project-expense/ - 前端組件
 *
 * @author IT Department
 * @since FEAT-015 - Project Expense 月度模組
 * @lastModified 2026-06-02
 */

import { TRPCError } from '@trpc/server';
import { z } from 'zod';

import { createTRPCRouter, protectedProcedure } from '../trpc';

import type { Prisma } from '@itpm/db';


// ============================================================
// Zod 驗證 Schema 定義
// ============================================================

// 月度記錄：每月同時有預算與實際（皆 USD，非負）
const monthlyRecordSchema = z.object({
  month: z.number().int().min(1).max(12),
  budgetAmount: z.number().nonnegative('月度預算不能為負'),
  actualAmount: z.number().nonnegative('月度實際不能為負'),
});

// 明細輸入（categoryId / opCoId / currencyId v1 皆可選）
const itemInputSchema = z.object({
  name: z.string().min(1, '明細名稱不能為空').max(200),
  description: z.string().optional(),
  currencyId: z.string().optional(),
  categoryId: z.string().optional(),
  opCoId: z.string().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// 表頭：建立
const createExpenseSchema = z.object({
  projectId: z.string().min(1, '專案 ID 不能為空'),
  name: z.string().min(1, '費用表名稱不能為空').max(200),
  description: z.string().optional(),
  financialYear: z.number().int().min(2000).max(2100),
});

// 表頭：更新
const updateExpenseSchema = z.object({
  id: z.string().min(1, 'ID 不能為空'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  financialYear: z.number().int().min(2000).max(2100).optional(),
});

// 明細：新增
const addItemSchema = z.object({
  projectExpenseId: z.string().min(1, '費用表 ID 不能為空'),
  item: itemInputSchema,
});

// 明細：更新（nullable 以支援清除 currency/category/opCo）
const updateItemSchema = z.object({
  id: z.string().min(1, 'Item ID 不能為空'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  currencyId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  opCoId: z.string().optional().nullable(),
});

// 明細：排序
const reorderItemsSchema = z.object({
  projectExpenseId: z.string().min(1, '費用表 ID 不能為空'),
  itemIds: z.array(z.string()), // 按新順序排列的 ID 陣列
});

// 月度：批量更新（恆 12 筆）
const updateItemMonthlyRecordsSchema = z.object({
  projectExpenseItemId: z.string().min(1, 'Item ID 不能為空'),
  monthlyData: z.array(monthlyRecordSchema).length(12, '必須提供 12 個月的數據'),
});

// ============================================================
// 共用：完整表頭 include（明細排序 + 月度排序 + 關聯）
// ============================================================
const fullHeaderInclude = {
  items: {
    orderBy: { sortOrder: 'asc' },
    include: {
      currency: true,
      category: true,
      opCo: true,
      monthly: { orderBy: { month: 'asc' } },
    },
  },
} satisfies Prisma.ProjectExpenseInclude;

// ============================================================
// 共用：彙總回算 helper（皆在 transaction 內呼叫，前端不可直接寫）
// ============================================================

/**
 * 由月度記錄回算單一明細的 totalBudgetAmount / totalActualSpent。
 * @returns 該明細所屬的 projectExpenseId（供回算表頭使用）
 */
async function recomputeItemTotals(
  tx: Prisma.TransactionClient,
  itemId: string
): Promise<string> {
  const monthly = await tx.projectExpenseMonthly.findMany({
    where: { projectExpenseItemId: itemId },
  });
  const totalBudgetAmount = monthly.reduce((sum, m) => sum + m.budgetAmount, 0);
  const totalActualSpent = monthly.reduce((sum, m) => sum + m.actualAmount, 0);

  const item = await tx.projectExpenseItem.update({
    where: { id: itemId },
    data: { totalBudgetAmount, totalActualSpent },
  });
  return item.projectExpenseId;
}

/**
 * 由所有明細回算表頭的 totalBudgetAmount / totalActualSpent。
 */
async function recomputeHeaderTotals(
  tx: Prisma.TransactionClient,
  projectExpenseId: string
): Promise<void> {
  const items = await tx.projectExpenseItem.findMany({
    where: { projectExpenseId },
  });
  const totalBudgetAmount = items.reduce(
    (sum, i) => sum + i.totalBudgetAmount,
    0
  );
  const totalActualSpent = items.reduce(
    (sum, i) => sum + i.totalActualSpent,
    0
  );

  await tx.projectExpense.update({
    where: { id: projectExpenseId },
    data: { totalBudgetAmount, totalActualSpent },
  });
}

/**
 * 驗證明細的可選 FK（currency / category / opCo）若有提供則必須存在。
 */
async function validateItemForeignKeys(
  ctx: { prisma: Prisma.TransactionClient },
  fk: { currencyId?: string | null; categoryId?: string | null; opCoId?: string | null }
): Promise<void> {
  if (fk.currencyId) {
    const currency = await ctx.prisma.currency.findUnique({
      where: { id: fk.currencyId },
    });
    if (!currency) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '幣別不存在' });
    }
  }
  if (fk.categoryId) {
    const category = await ctx.prisma.expenseCategory.findUnique({
      where: { id: fk.categoryId },
    });
    if (!category) {
      throw new TRPCError({ code: 'NOT_FOUND', message: '費用類別不存在' });
    }
  }
  if (fk.opCoId) {
    const opCo = await ctx.prisma.operatingCompany.findUnique({
      where: { id: fk.opCoId },
    });
    if (!opCo) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'OpCo 不存在' });
    }
  }
}

// ============================================================
// Router 定義
// ============================================================
export const projectExpenseRouter = createTRPCRouter({
  /**
   * 取得某專案的所有費用表（表頭），含明細、月度、currency/category/opCo。
   */
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.projectExpense.findMany({
        where: { projectId: input.projectId },
        orderBy: [{ financialYear: 'desc' }, { createdAt: 'asc' }],
        include: fullHeaderInclude,
      });
    }),

  /**
   * 新增費用表（表頭）。明細由 addItem 另行新增。
   */
  createExpense: protectedProcedure
    .input(createExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證專案存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        select: { id: true },
      });
      if (!project) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '專案不存在' });
      }

      return ctx.prisma.projectExpense.create({
        data: {
          projectId: input.projectId,
          name: input.name,
          description: input.description,
          financialYear: input.financialYear,
        },
        include: fullHeaderInclude,
      });
    }),

  /**
   * 更新費用表（表頭）基本資訊（name / description / financialYear）。
   */
  updateExpense: protectedProcedure
    .input(updateExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existing = await ctx.prisma.projectExpense.findUnique({
        where: { id },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '費用表不存在' });
      }

      return ctx.prisma.projectExpense.update({
        where: { id },
        data,
        include: fullHeaderInclude,
      });
    }),

  /**
   * 刪除費用表（表頭）。級聯刪除其所有明細與月度（schema onDelete: Cascade）。
   */
  removeExpense: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.projectExpense.findUnique({
        where: { id: input.id },
        select: { id: true },
      });
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '費用表不存在' });
      }

      await ctx.prisma.projectExpense.delete({ where: { id: input.id } });
      return { success: true };
    }),

  /**
   * 於某費用表（表頭）下新增明細。
   * transaction 內自動建立 12 筆月度記錄（budget=0, actual=0），再回算表頭彙總。
   */
  addItem: protectedProcedure
    .input(addItemSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證表頭存在
      const header = await ctx.prisma.projectExpense.findUnique({
        where: { id: input.projectExpenseId },
        include: { items: { select: { sortOrder: true } } },
      });
      if (!header) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '費用表不存在' });
      }

      // 驗證可選 FK
      await validateItemForeignKeys(ctx, input.item);

      // 計算 sortOrder（放最後）
      const maxSortOrder = header.items.reduce(
        (max, item) => Math.max(max, item.sortOrder),
        -1
      );
      const newSortOrder = input.item.sortOrder ?? maxSortOrder + 1;

      await ctx.prisma.$transaction(async (tx) => {
        // 1. 建立明細
        const newItem = await tx.projectExpenseItem.create({
          data: {
            projectExpenseId: input.projectExpenseId,
            name: input.item.name,
            description: input.item.description,
            currencyId: input.item.currencyId ?? null,
            categoryId: input.item.categoryId ?? null,
            opCoId: input.item.opCoId ?? null,
            sortOrder: newSortOrder,
          },
        });

        // 2. 建立 12 筆月度（預算與實際皆 0）
        await tx.projectExpenseMonthly.createMany({
          data: Array.from({ length: 12 }, (_, i) => ({
            projectExpenseItemId: newItem.id,
            month: i + 1,
            budgetAmount: 0,
            actualAmount: 0,
          })),
        });

        // 3. 回算表頭彙總（新明細彙總為 0，但回算確保一致）
        await recomputeHeaderTotals(tx, input.projectExpenseId);
      });

      return ctx.prisma.projectExpense.findUnique({
        where: { id: input.projectExpenseId },
        include: fullHeaderInclude,
      });
    }),

  /**
   * 更新明細基本資訊（name / description / currencyId / categoryId / opCoId）。
   * 金額由月度驅動，故此處不動彙總。
   */
  updateItem: protectedProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;

      const existingItem = await ctx.prisma.projectExpenseItem.findUnique({
        where: { id },
        select: { id: true, projectExpenseId: true },
      });
      if (!existingItem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '明細不存在' });
      }

      // 驗證可選 FK（僅當有提供）
      await validateItemForeignKeys(ctx, {
        currencyId: data.currencyId,
        categoryId: data.categoryId,
        opCoId: data.opCoId,
      });

      await ctx.prisma.projectExpenseItem.update({ where: { id }, data });

      return ctx.prisma.projectExpense.findUnique({
        where: { id: existingItem.projectExpenseId },
        include: fullHeaderInclude,
      });
    }),

  /**
   * 刪除明細（級聯刪月度），再回算表頭彙總。
   */
  removeItem: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const existingItem = await ctx.prisma.projectExpenseItem.findUnique({
        where: { id: input.id },
        select: { id: true, projectExpenseId: true },
      });
      if (!existingItem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '明細不存在' });
      }

      const projectExpenseId = existingItem.projectExpenseId;

      await ctx.prisma.$transaction(async (tx) => {
        // 月度由 onDelete: Cascade 自動刪除
        await tx.projectExpenseItem.delete({ where: { id: input.id } });
        await recomputeHeaderTotals(tx, projectExpenseId);
      });

      return ctx.prisma.projectExpense.findUnique({
        where: { id: projectExpenseId },
        include: fullHeaderInclude,
      });
    }),

  /**
   * 調整明細排序（傳按新順序排列的 itemIds，批量更新 sortOrder）。
   */
  reorderItems: protectedProcedure
    .input(reorderItemsSchema)
    .mutation(async ({ ctx, input }) => {
      const header = await ctx.prisma.projectExpense.findUnique({
        where: { id: input.projectExpenseId },
        include: { items: { select: { id: true } } },
      });
      if (!header) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '費用表不存在' });
      }

      // 驗證所有 ID 都屬於此表頭
      const existingItemIds = header.items.map((item) => item.id);
      const invalidIds = input.itemIds.filter(
        (id) => !existingItemIds.includes(id)
      );
      if (invalidIds.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `以下明細 ID 不屬於此費用表: ${invalidIds.join(', ')}`,
        });
      }

      await ctx.prisma.$transaction(
        input.itemIds.map((itemId, index) =>
          ctx.prisma.projectExpenseItem.update({
            where: { id: itemId },
            data: { sortOrder: index },
          })
        )
      );

      return ctx.prisma.projectExpense.findUnique({
        where: { id: input.projectExpenseId },
        include: fullHeaderInclude,
      });
    }),

  /**
   * 批量更新某明細的 12 個月度記錄（預算 + 實際）。
   * transaction 內 upsert 12 筆 → 回算明細彙總 → 回算表頭彙總。
   */
  updateItemMonthlyRecords: protectedProcedure
    .input(updateItemMonthlyRecordsSchema)
    .mutation(async ({ ctx, input }) => {
      const existingItem = await ctx.prisma.projectExpenseItem.findUnique({
        where: { id: input.projectExpenseItemId },
        select: { id: true, projectExpenseId: true },
      });
      if (!existingItem) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '明細不存在' });
      }

      // 驗證月份完整（1-12）
      const months = input.monthlyData.map((d) => d.month).sort((a, b) => a - b);
      const expectedMonths = Array.from({ length: 12 }, (_, i) => i + 1);
      if (JSON.stringify(months) !== JSON.stringify(expectedMonths)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '必須提供完整的 1-12 月數據',
        });
      }

      await ctx.prisma.$transaction(async (tx) => {
        // 1. upsert 12 筆月度
        for (const m of input.monthlyData) {
          await tx.projectExpenseMonthly.upsert({
            where: {
              projectExpenseItemId_month: {
                projectExpenseItemId: input.projectExpenseItemId,
                month: m.month,
              },
            },
            update: {
              budgetAmount: m.budgetAmount,
              actualAmount: m.actualAmount,
            },
            create: {
              projectExpenseItemId: input.projectExpenseItemId,
              month: m.month,
              budgetAmount: m.budgetAmount,
              actualAmount: m.actualAmount,
            },
          });
        }

        // 2. 回算明細彙總（budget + actual）
        const projectExpenseId = await recomputeItemTotals(
          tx,
          input.projectExpenseItemId
        );

        // 3. 回算表頭彙總
        await recomputeHeaderTotals(tx, projectExpenseId);
      });

      return ctx.prisma.projectExpense.findUnique({
        where: { id: existingItem.projectExpenseId },
        include: fullHeaderInclude,
      });
    }),
});
