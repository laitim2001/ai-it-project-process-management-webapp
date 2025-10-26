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
  categories: z.array(budgetCategorySchema.omit({ id: true, isActive: true })).min(1, 'At least one category is required'),
});

export const updateBudgetPoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
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

      return pool;
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
      const { categories, ...poolData } = input;

      return ctx.prisma.budgetPool.create({
        data: {
          ...poolData,
          // DEPRECATED fields - kept for backward compatibility
          totalAmount: categories.reduce((sum, cat) => sum + cat.totalAmount, 0),
          usedAmount: 0,
          categories: {
            create: categories,
          },
        },
        include: {
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
      const { id, categories, ...updateData } = input;

      // 使用 transaction 確保數據一致性
      return ctx.prisma.$transaction(async (tx) => {
        // 更新預算池基本信息
        const pool = await tx.budgetPool.update({
          where: { id },
          data: updateData,
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
                      amount: true,
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
              po.expenses.reduce((eSum, expense) => eSum + expense.amount, 0),
            0
          ),
        0
      );

      const remaining = budgetPool.totalAmount - totalAllocated;
      const utilizationRate = (totalAllocated / budgetPool.totalAmount) * 100;

      return {
        totalBudget: budgetPool.totalAmount,
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
        minAmount: z.number().optional(),
        maxAmount: z.number().optional(),
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
          input?.minAmount ? { totalAmount: { gte: input.minAmount } } : {},
          input?.maxAmount ? { totalAmount: { lte: input.maxAmount } } : {},
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

      // 更新已用金額
      const updated = await ctx.prisma.budgetCategory.update({
        where: { id: input.categoryId },
        data: {
          usedAmount: {
            increment: input.amount,
          },
        },
      });

      // 驗證不會超過總預算（僅在增加時檢查）
      if (input.amount > 0 && updated.usedAmount > updated.totalAmount) {
        // 回滾操作
        await ctx.prisma.budgetCategory.update({
          where: { id: input.categoryId },
          data: {
            usedAmount: {
              decrement: input.amount,
            },
          },
        });

        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `Budget exceeded. Available: ${updated.totalAmount - category.usedAmount}, Requested: ${input.amount}`,
        });
      }

      return updated;
    }),
});
