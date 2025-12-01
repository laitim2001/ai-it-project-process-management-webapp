/**
 * @fileoverview OM Expense Category Router - OM 費用類別管理 API
 *
 * @description
 * 提供 OM 費用類別的完整 CRUD 操作和查詢功能。
 * OM 費用類別用於標準化分類 O&M 費用（如：維護費、軟體授權費、通訊費等）。
 * 包含啟用/停用狀態管理，以及級聯刪除保護機制防止誤刪有關聯資料的類別。
 *
 * @module api/routers/omExpenseCategory
 *
 * @features
 * - 建立費用類別（驗證類別代碼唯一性）
 * - 更新費用類別資訊（支援代碼和名稱修改）
 * - 查詢費用類別列表（支援啟用/停用過濾）
 * - 查詢單一費用類別詳情（包含關聯計數）
 * - 切換費用類別啟用/停用狀態
 * - 刪除費用類別（級聯刪除檢查保護）
 * - 獲取啟用的類別列表（用於下拉選單）
 *
 * @procedures
 * - create: 建立新費用類別（Supervisor only）
 * - update: 更新費用類別資訊（Supervisor only）
 * - getById: 查詢單一費用類別詳情
 * - getAll: 查詢費用類別列表（支援分頁和過濾）
 * - getActive: 獲取啟用的類別列表（用於下拉選單）
 * - delete: 刪除費用類別（Supervisor only，檢查關聯資料）
 * - toggleStatus: 切換啟用/停用狀態（Supervisor only）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - OMExpenseCategory 資料模型
 * - packages/api/src/routers/omExpense.ts - OM 費用 Router
 * - apps/web/src/app/[locale]/om-expense-categories/page.tsx - 費用類別列表頁面
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

// ========== Zod Schemas ==========

const createCategorySchema = z.object({
  code: z
    .string()
    .min(1, '類別代碼不能為空')
    .max(20, '類別代碼最多 20 個字元')
    .regex(/^[A-Z0-9_]+$/, '類別代碼只能包含大寫字母、數字和底線'),
  name: z.string().min(1, '類別名稱不能為空').max(100, '類別名稱最多 100 個字元'),
  description: z.string().max(500, '描述最多 500 個字元').optional(),
  sortOrder: z.number().int().min(0).default(0),
});

const updateCategorySchema = z.object({
  id: z.string().min(1, 'ID 不能為空'),
  code: z
    .string()
    .min(1)
    .max(20)
    .regex(/^[A-Z0-9_]+$/)
    .optional(),
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

const getAllCategoriesSchema = z
  .object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(20),
    search: z.string().optional(),
    isActive: z.boolean().optional(),
    includeInactive: z.boolean().optional().default(false),
  })
  .optional();

// ========== Router ==========

export const omExpenseCategoryRouter = createTRPCRouter({
  /**
   * 創建費用類別
   * 權限：Supervisor only
   */
  create: supervisorProcedure.input(createCategorySchema).mutation(async ({ ctx, input }) => {
    // 檢查 code 是否已存在
    const existingCategory = await ctx.prisma.oMExpenseCategory.findUnique({
      where: { code: input.code },
    });

    if (existingCategory) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: `類別代碼 "${input.code}" 已存在`,
      });
    }

    const category = await ctx.prisma.oMExpenseCategory.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        sortOrder: input.sortOrder,
      },
    });

    return category;
  }),

  /**
   * 更新費用類別
   * 權限：Supervisor only
   */
  update: supervisorProcedure.input(updateCategorySchema).mutation(async ({ ctx, input }) => {
    const { id, ...updateData } = input;

    // 驗證類別是否存在
    const existingCategory = await ctx.prisma.oMExpenseCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: '費用類別不存在',
      });
    }

    // 如果要更新 code，檢查新 code 是否衝突
    if (updateData.code && updateData.code !== existingCategory.code) {
      const codeConflict = await ctx.prisma.oMExpenseCategory.findUnique({
        where: { code: updateData.code },
      });

      if (codeConflict) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `類別代碼 "${updateData.code}" 已被使用`,
        });
      }
    }

    const updatedCategory = await ctx.prisma.oMExpenseCategory.update({
      where: { id },
      data: updateData,
    });

    return updatedCategory;
  }),

  /**
   * 獲取單個費用類別
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.prisma.oMExpenseCategory.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              omExpenses: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '費用類別不存在',
        });
      }

      return category;
    }),

  /**
   * 獲取所有費用類別列表
   * 支持分頁和過濾
   */
  getAll: protectedProcedure.input(getAllCategoriesSchema).query(async ({ ctx, input }) => {
    const page = input?.page ?? 1;
    const limit = input?.limit ?? 20;
    const skip = (page - 1) * limit;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {};

    // 搜尋條件
    if (input?.search) {
      where.OR = [
        { code: { contains: input.search, mode: 'insensitive' } },
        { name: { contains: input.search, mode: 'insensitive' } },
        { description: { contains: input.search, mode: 'insensitive' } },
      ];
    }

    // 啟用狀態過濾
    if (input?.isActive !== undefined) {
      where.isActive = input.isActive;
    } else if (!input?.includeInactive) {
      where.isActive = true;
    }

    const [categories, total] = await Promise.all([
      ctx.prisma.oMExpenseCategory.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: {
              omExpenses: true,
            },
          },
        },
        orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      }),
      ctx.prisma.oMExpenseCategory.count({ where }),
    ]);

    return {
      categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }),

  /**
   * 獲取啟用的類別列表（用於下拉選單）
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.oMExpenseCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    return categories;
  }),

  /**
   * 刪除費用類別
   * 權限：Supervisor only
   * 注意：如果有關聯的 OM 費用，禁止刪除
   */
  delete: supervisorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 檢查是否有關聯資料
      const category = await ctx.prisma.oMExpenseCategory.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              omExpenses: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '費用類別不存在',
        });
      }

      const hasRelations = (category._count.omExpenses ?? 0) > 0;

      if (hasRelations) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除類別 "${category.name}"，因為有 ${category._count.omExpenses} 筆關聯的 OM 費用。請先刪除相關費用記錄或將其改用其他類別。`,
        });
      }

      await ctx.prisma.oMExpenseCategory.delete({
        where: { id: input.id },
      });

      return { success: true, message: '費用類別已刪除' };
    }),

  /**
   * 切換啟用/停用狀態
   * 權限：Supervisor only
   */
  toggleStatus: supervisorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const category = await ctx.prisma.oMExpenseCategory.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '費用類別不存在',
        });
      }

      const updated = await ctx.prisma.oMExpenseCategory.update({
        where: { id: input.id },
        data: { isActive: !category.isActive },
      });

      return updated;
    }),
});
