import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// Validation schemas
export const createBudgetPoolSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  totalAmount: z.number().positive('Amount must be positive'),
  financialYear: z.number().int().min(2000).max(2100),
});

export const updateBudgetPoolSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  totalAmount: z.number().positive().optional(),
  financialYear: z.number().int().min(2000).max(2100).optional(),
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
          year: z.number().int().optional(),
          sortBy: z.enum(['name', 'year', 'amount']).default('year'),
          sortOrder: z.enum(['asc', 'desc']).default('desc'),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;
      const search = input?.search;
      const year = input?.year;
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
          year ? { financialYear: year } : {},
        ],
      };

      const [items, total] = await Promise.all([
        ctx.prisma.budgetPool.findMany({
          where,
          skip,
          take: limit,
          orderBy:
            sortBy === 'name'
              ? { name: sortOrder }
              : sortBy === 'amount'
              ? { totalAmount: sortOrder }
              : { financialYear: sortOrder },
          include: {
            _count: {
              select: {
                projects: true,
              },
            },
          },
        }),
        ctx.prisma.budgetPool.count({ where }),
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

  // Get budget pool by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const budgetPool = await ctx.prisma.budgetPool.findUnique({
        where: { id: input.id },
        include: {
          projects: {
            select: {
              id: true,
              name: true,
              status: true,
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

      if (!budgetPool) {
        throw new Error('Budget pool not found');
      }

      return budgetPool;
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

  // Create new budget pool
  create: protectedProcedure
    .input(createBudgetPoolSchema)
    .mutation(async ({ ctx, input }) => {
      return ctx.prisma.budgetPool.create({
        data: {
          name: input.name,
          totalAmount: input.totalAmount,
          financialYear: input.financialYear,
        },
      });
    }),

  // Update budget pool
  update: protectedProcedure
    .input(updateBudgetPoolSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      return ctx.prisma.budgetPool.update({
        where: { id },
        data: updateData,
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
});
