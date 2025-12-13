/**
 * @fileoverview Budget Pool Router - 預算池管理 API
 *
 * @description
 * 提供預算池的完整 CRUD 操作和查詢功能，是整個專案預算管理的核心模組。
 * 預算池代表財年預算分配的頂層實體，包含多個預算類別（BudgetCategory）。
 * 支援即時預算使用率計算、級聯刪除檢查、統計分析和數據導出等功能。
 * 採用表頭-明細架構（BudgetPool + BudgetCategory[]），實現細緻的預算分類管理。
 *
 * @module api/routers/budgetPool
 *
 * @features
 * - 建立預算池並自動建立預算類別（表頭-明細同步創建）
 * - 查詢預算池列表（支援分頁、搜尋、財年過濾、排序）
 * - 查詢單一預算池詳情（包含類別明細和使用率計算）
 * - 更新預算池資訊和預算類別（支援類別新增、更新、刪除）
 * - 刪除預算池（級聯刪除檢查，防止誤刪有關聯專案的預算池）
 * - 即時計算預算使用率和健康狀態（從 BudgetCategory 累加）
 * - 獲取預算池統計資訊（總預算、已分配、已花費、剩餘、使用率）
 * - 預算類別管理（查詢、更新已用金額、統計）
 * - 數據導出功能（CSV/Excel 友好格式）
 *
 * @procedures
 * - getAll: 查詢預算池列表（分頁 + 過濾 + 排序）
 * - getById: 查詢單一預算池（含使用率計算）
 * - getByYear: 根據財年查詢預算池
 * - create: 建立新預算池（含類別）
 * - update: 更新預算池和類別
 * - delete: 刪除預算池（級聯檢查）
 * - getStats: 獲取預算池統計
 * - export: 導出預算池數據
 * - getCategories: 獲取預算類別列表
 * - getCategoryStats: 獲取類別使用統計
 * - updateCategoryUsage: 更新類別已用金額（內部使用）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 * - TRPCError: 錯誤處理
 *
 * @related
 * - packages/db/prisma/schema.prisma - BudgetPool, BudgetCategory 資料模型
 * - packages/api/src/routers/project.ts - 關聯的專案 Router
 * - packages/api/src/routers/expense.ts - 費用扣款 Router
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池列表頁面
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ========== Validation Schemas ==========

// BudgetCategory schema
export const budgetCategorySchema = z.object({
  id: z.string().uuid().optional(), // 有 id = 更新，無 id = 新增
  categoryName: z.string().min(1, 'Category name is required'),
  categoryCode: z.string().optional(),
  totalAmount: z.number().min(0, 'Amount must be non-negative'),
  description: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
});

// BudgetPool schemas
export const createBudgetPoolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  financialYear: z.number().int().min(2000).max(2100),
  description: z.string().optional(),
  currencyId: z.string().uuid('Currency is required'), // FEAT-002: 貨幣 ID（必填）
  categories: z.array(budgetCategorySchema.omit({ id: true, isActive: true })).min(1, 'At least one category is required'),
});

export const updateBudgetPoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
  currencyId: z.string().uuid().optional(), // FEAT-002: 可選更新貨幣
  categories: z.array(budgetCategorySchema).optional(),
});

export const budgetPoolRouter = createTRPCRouter({
  // Get all budget pools with pagination and filters
  getAll: protectedProcedure
    .input(
      z
        .object({
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(100).default(20),
          search: z.string().optional(),
          financialYear: z.number().int().optional(),
          sortBy: z.enum(['name', 'year']).default('year'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const search = input?.search;
      const financialYear = input?.financialYear;
      const sortBy = input?.sortBy ?? 'year';
      const sortOrder = input?.sortOrder ?? 'desc';

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
          financialYear ? { financialYear } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      };

      const [items, total] = await Promise.all([
        ctx.prisma.budgetPool.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === 'name'
              ? { name: sortOrder }
              : { financialYear: sortOrder },
          include: {
            currency: true, // FEAT-002: Include currency
            categories: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),
        ctx.prisma.budgetPool.count({ where }),
      ]);

      // 計算每個預算池的總預算和已用金額（從 categories 累加）
      const poolsWithTotals = items.map(pool => {
        const totalAmount = pool.categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
        const usedAmount = pool.categories.reduce((sum, cat) => sum + cat.usedAmount, 0);
        return {
          ...pool,
          computedTotalAmount: totalAmount,
          computedUsedAmount: usedAmount,
          utilizationRate: totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0,
        };
      });

      return {
        items: poolsWithTotals,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  // Get budget pool by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const pool = await ctx.prisma.budgetPool.findUnique({
        where: { id: input.id },
        include: {
          currency: true, // FEAT-002: Include currency
          categories: {
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
              _count: {
                select: {
                  projects: true,
                  expenses: true,
                },
              },
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              budgetCategoryId: true,
              requestedBudget: true,
              approvedBudget: true,
              manager: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      if (!pool) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Budget pool not found',
        });
      }

      // 計算總預算和已用金額（從 categories 累加）
      const totalAmount = pool.categories.reduce((sum, cat) => sum + cat.totalAmount, 0);
      const usedAmount = pool.categories.reduce((sum, cat) => sum + cat.usedAmount, 0);

      // 為每個類別計算使用率
      const categoriesWithRate = pool.categories.map(cat => ({
        ...cat,
        utilizationRate: cat.totalAmount > 0 ? (cat.usedAmount / cat.totalAmount) * 100 : 0,
      }));

      return {
        ...pool,
        categories: categoriesWithRate,
        computedTotalAmount: totalAmount,
        computedUsedAmount: usedAmount,
        utilizationRate: totalAmount > 0 ? (usedAmount / totalAmount) * 100 : 0,
      };
    }),

  // Get budget pools by financial year
  getByYear: protectedProcedure
    .input(z.object({ year: z.number().int() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.budgetPool.findMany({
        where: {
          financialYear: input.year,
        },
        orderBy: {
          name: 'asc',
        },
      });
    }),

  // Create new budget pool with categories
  create: protectedProcedure
    .input(createBudgetPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const { categories, currencyId, ...poolData } = input;

      // FEAT-002: Validate currency exists and is active
      const currency = await ctx.prisma.currency.findUnique({
        where: { id: currencyId },
      });

      if (!currency || !currency.active) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Invalid or inactive currency',
        });
      }

      return ctx.prisma.budgetPool.create({
        data: {
          ...poolData,
          currencyId, // FEAT-002: Add currencyId
          // DEPRECATED fields - kept for backward compatibility
          totalAmount: categories.reduce((sum, cat) => sum + cat.totalAmount, 0),
          usedAmount: 0,
          categories: {
            create: categories,
          },
        },
        include: {
          currency: true, // FEAT-002: Include currency in response
          categories: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }),

  // Update budget pool and categories
  update: protectedProcedure
    .input(updateBudgetPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, categories, currencyId, ...updateData } = input;

      // FEAT-002: Validate currency if provided
      if (currencyId) {
        const currency = await ctx.prisma.currency.findUnique({
          where: { id: currencyId },
        });

        if (!currency || !currency.active) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Invalid or inactive currency',
          });
        }
      }

      // 使用 transaction 確保數據一致性
      return ctx.prisma.$transaction(async (tx) => {
        // 更新預算池基本信息
        const pool = await tx.budgetPool.update({
          where: { id },
          data: {
            ...updateData,
            ...(currencyId && { currencyId }), // FEAT-002: Update currency if provided
          },
        });

        // 處理類別更新
        if (categories) {
          for (const cat of categories) {
            if (cat.id) {
              // 更新現有類別
              await tx.budgetCategory.update({
                where: { id: cat.id },
                data: {
                  categoryName: cat.categoryName,
                  categoryCode: cat.categoryCode,
                  totalAmount: cat.totalAmount,
                  description: cat.description,
                  sortOrder: cat.sortOrder,
                  isActive: cat.isActive,
                },
              });
            } else {
              // 新增類別
              await tx.budgetCategory.create({
                data: {
                  budgetPoolId: id,
                  categoryName: cat.categoryName,
                  categoryCode: cat.categoryCode,
                  totalAmount: cat.totalAmount,
                  description: cat.description,
                  sortOrder: cat.sortOrder ?? 0,
                },
              });
            }
          }
        }

        // 返回完整的預算池資料（含類別）
        return tx.budgetPool.findUnique({
          where: { id },
          include: {
            currency: true, // FEAT-002: Include currency
            categories: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        });
      });
    }),

  // Delete budget pool
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Check if budget pool has projects
      const budgetPool = await ctx.prisma.budgetPool.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!budgetPool) {
        throw new Error('Budget pool not found');
      }

      if (budgetPool._count.projects > 0) {
        throw new Error(
          'Cannot delete budget pool with existing projects. Please delete or reassign projects first.'
        );
      }

      return ctx.prisma.budgetPool.delete({
        where: { id: input.id },
      });
    }),

  // Get budget pool statistics
  getStats: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const budgetPool = await ctx.prisma.budgetPool.findUnique({
        where: { id: input.id },
        include: {
          categories: {
            where: { isActive: true },
          },
          projects: {
            include: {
              proposals: {
                where: {
                  status: 'Approved',
                },
                select: {
                  amount: true,
                },
              },
              purchaseOrders: {
                select: {
                  totalAmount: true,
                  expenses: {
                    where: {
                      status: { in: ['Approved', 'Paid'] },
                    },
                    select: {
                      totalAmount: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!budgetPool) {
        throw new Error('Budget pool not found');
      }

      // Calculate total budget from categories (not deprecated totalAmount field)
      const totalBudget = budgetPool.categories.reduce(
        (sum: number, cat: { totalAmount: number }) => sum + cat.totalAmount,
        0
      );

      // Calculate statistics
      const totalAllocated = budgetPool.projects.reduce(
        (sum, project) =>
          sum +
          project.proposals.reduce(
            (pSum, proposal) => pSum + proposal.amount,
            0
          ),
        0
      );

      const totalSpent = budgetPool.projects.reduce(
        (sum, project) =>
          sum +
          project.purchaseOrders.reduce(
            (poSum, po) =>
              poSum +
              po.expenses.reduce((eSum, expense) => eSum + expense.totalAmount, 0),
            0
          ),
        0
      );

      const remaining = totalBudget - totalAllocated;
      const utilizationRate = totalBudget > 0 ? (totalAllocated / totalBudget) * 100 : 0;

      return {
        totalBudget,
        totalAllocated,
        totalSpent,
        remaining,
        utilizationRate,
        projectCount: budgetPool.projects.length,
      };
    }),

  // Export budget pools (for CSV/Excel)
  export: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        year: z.number().int().optional(),
      }).optional()
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
          input?.year ? { financialYear: input.year } : {},
        ].filter(obj => Object.keys(obj).length > 0),
      };

      const budgetPools = await ctx.prisma.budgetPool.findMany({
        where,
        orderBy: { financialYear: 'desc' },
        include: {
          _count: {
            select: {
              projects: true,
            },
          },
        },
      });

      return budgetPools;
    }),

  // ========== BudgetCategory 操作 ==========

  /**
   * 獲取預算池的所有預算類別
   */
  getCategories: protectedProcedure
    .input(z.object({ budgetPoolId: z.string().min(1) })) // 支援 UUID 和非 UUID 格式的 ID
    .query(async ({ ctx, input }) => {
      const categories = await ctx.prisma.budgetCategory.findMany({
        where: {
          budgetPoolId: input.budgetPoolId,
          isActive: true,
        },
        select: {
          id: true,
          categoryName: true,
          categoryCode: true,
          totalAmount: true,
          usedAmount: true,
          description: true,
          sortOrder: true,
          isActive: true,
        },
        orderBy: {
          sortOrder: 'asc',
        },
      });

      return categories;
    }),

  /**
   * 獲取類別使用統計
   */
  getCategoryStats: protectedProcedure
    .input(z.object({ categoryId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const category = await ctx.prisma.budgetCategory.findUnique({
        where: { id: input.categoryId },
        include: {
          budgetPool: {
            select: {
              id: true,
              name: true,
              financialYear: true,
            },
          },
          _count: {
            select: {
              projects: true,
              expenses: true,
            },
          },
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
              requestedBudget: true,
              approvedBudget: true,
            },
          },
          expenses: {
            where: {
              status: { in: ['Approved', 'Paid'] },
            },
            select: {
              totalAmount: true,
              status: true,
            },
          },
        },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Budget category not found',
        });
      }

      const utilizationRate = category.totalAmount > 0
        ? (category.usedAmount / category.totalAmount) * 100
        : 0;
      const remainingAmount = category.totalAmount - category.usedAmount;

      return {
        category,
        utilizationRate,
        remainingAmount,
      };
    }),

  /**
   * 更新類別已用金額（內部使用，當費用審批時調用）
   */
  updateCategoryUsage: protectedProcedure
    .input(
      z.object({
        categoryId: z.string().uuid(),
        amount: z.number(), // 正數=增加，負數=減少
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 驗證類別存在
      const category = await ctx.prisma.budgetCategory.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Budget category not found',
        });
      }

      // 優化: 在增加金額時,先檢查預算可用性（避免 rollback 操作）
      if (input.amount > 0) {
        const availableAmount = category.totalAmount - category.usedAmount;
        if (availableAmount < input.amount) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Budget exceeded. Available: ${availableAmount}, Requested: ${input.amount}`,
          });
        }
      }

      // 更新已用金額
      const updated = await ctx.prisma.budgetCategory.update({
        where: { id: input.categoryId },
        data: {
          usedAmount: {
            increment: input.amount,
          },
        },
      });

      return updated;
    }),
});
