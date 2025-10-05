/**
 * PurchaseOrder（採購單）管理 tRPC API 路由
 *
 * 功能說明：
 * - 採購單 CRUD 操作：創建、查詢、更新、刪除
 * - 自動從選定的 Quote 生成 PO
 * - 與 Project、Vendor、Quote 的關聯管理
 * - 採購單狀態管理
 *
 * Epic 4 - Story 5.3: 選擇最終供應商並記錄採購決策
 * Epic 4 - Story 5.4: 生成採購單 (Purchase Order) 記錄
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 從 Quote 創建 PO Schema
 */
const createPOFromQuoteSchema = z.object({
  quoteId: z.string().min(1, '報價單ID為必填'),
  projectId: z.string().min(1, '專案ID為必填'),
});

/**
 * 手動創建 PO Schema（如果需要不通過 Quote 創建）
 */
const createPOManualSchema = z.object({
  projectId: z.string().min(1, '專案ID為必填'),
  vendorId: z.string().min(1, '供應商ID為必填'),
  totalAmount: z.number().min(0, 'PO 總金額必須大於等於0'),
  description: z.string().optional(),
});

/**
 * 更新 PO Schema
 */
const updatePOSchema = z.object({
  id: z.string().min(1, '無效的PO ID'),
  totalAmount: z.number().min(0, 'PO 總金額必須大於等於0').optional(),
  description: z.string().optional(),
});

/**
 * 查詢 PO 參數 Schema
 */
const getPOsQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  projectId: z.string().optional(),
  vendorId: z.string().optional(),
  sortBy: z.enum(['poNumber', 'date', 'totalAmount']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ========================================
// tRPC Router 定義
// ========================================

export const purchaseOrderRouter = createTRPCRouter({

  /**
   * 查詢所有採購單（支援分頁、篩選、排序）
   * @returns { items: PurchaseOrder[], pagination }
   */
  getAll: protectedProcedure
    .input(getPOsQuerySchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, projectId, vendorId, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // 構建篩選條件
      const whereCondition: any = {};
      if (projectId) {
        whereCondition.projectId = projectId;
      }
      if (vendorId) {
        whereCondition.vendorId = vendorId;
      }

      // 查詢總數
      const total = await ctx.prisma.purchaseOrder.count({
        where: whereCondition,
      });

      // 查詢採購單列表
      const purchaseOrders = await ctx.prisma.purchaseOrder.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
            },
          },
          quote: {
            select: {
              id: true,
              amount: true,
              filePath: true,
            },
          },
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });

      return {
        items: purchaseOrders,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * 根據 ID 查詢單一採購單
   * @param id - 採購單 ID
   * @returns PurchaseOrder 完整資訊
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的PO ID') }))
    .query(async ({ ctx, input }) => {
      const purchaseOrder = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.id },
        include: {
          project: {
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
                  financialYear: true,
                },
              },
            },
          },
          vendor: true,
          quote: true,
          expenses: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      if (!purchaseOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      return purchaseOrder;
    }),

  /**
   * 從選定的 Quote 自動生成 PO
   * @param quoteId - 報價單 ID
   * @param projectId - 專案 ID
   * @returns 新創建的 PurchaseOrder
   *
   * Epic 4 - Story 5.3 & 5.4: 核心功能
   */
  createFromQuote: protectedProcedure
    .input(createPOFromQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 Quote 是否存在
      const quote = await ctx.prisma.quote.findUnique({
        where: { id: input.quoteId },
        include: {
          vendor: true,
          project: true,
          purchaseOrder: true,
        },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該報價單',
        });
      }

      // 檢查 Quote 的 projectId 是否匹配
      if (quote.projectId !== input.projectId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '報價單不屬於該專案',
        });
      }

      // 檢查該 Quote 是否已經生成過 PO
      if (quote.purchaseOrder) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `該報價單已被用於生成採購單 (PO#: ${quote.purchaseOrder.poNumber})`,
        });
      }

      // 檢查該專案是否已有 PO（一個專案只能有一個 PO）
      const existingPO = await ctx.prisma.purchaseOrder.findFirst({
        where: { projectId: input.projectId },
      });

      if (existingPO) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `該專案已有採購單 (PO#: ${existingPO.poNumber})`,
        });
      }

      // 創建 PurchaseOrder（Transaction 確保資料一致性）
      const purchaseOrder = await ctx.prisma.$transaction(async (prisma) => {
        // 1. 創建 PO
        const newPO = await prisma.purchaseOrder.create({
          data: {
            projectId: input.projectId,
            vendorId: quote.vendorId,
            totalAmount: quote.amount,
          },
          include: {
            project: {
              select: {
                id: true,
                name: true,
              },
            },
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

        // 2. 更新 Quote 關聯到新的 PO
        await prisma.quote.update({
          where: { id: input.quoteId },
          data: {
            purchaseOrderId: newPO.id,
          },
        });

        return newPO;
      });

      return purchaseOrder;
    }),

  /**
   * 手動創建 PO（不通過 Quote）
   * @returns 新創建的 PurchaseOrder
   */
  createManual: protectedProcedure
    .input(createPOManualSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證專案是否存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
      });

      if (!project) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該專案',
        });
      }

      // 驗證供應商是否存在
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.vendorId },
      });

      if (!vendor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該供應商',
        });
      }

      // 檢查該專案是否已有 PO
      const existingPO = await ctx.prisma.purchaseOrder.findFirst({
        where: { projectId: input.projectId },
      });

      if (existingPO) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `該專案已有採購單 (PO#: ${existingPO.poNumber})`,
        });
      }

      // 創建 PO
      const purchaseOrder = await ctx.prisma.purchaseOrder.create({
        data: {
          projectId: input.projectId,
          vendorId: input.vendorId,
          totalAmount: input.totalAmount,
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return purchaseOrder;
    }),

  /**
   * 更新採購單資訊
   * @param id - PO ID
   * @param totalAmount - 更新後的總金額（選填）
   * @returns 更新後的 PurchaseOrder
   */
  update: protectedProcedure
    .input(updatePOSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 檢查 PO 是否存在
      const existingPO = await ctx.prisma.purchaseOrder.findUnique({
        where: { id },
        include: {
          expenses: true,
        },
      });

      if (!existingPO) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 如果 PO 已有 Expense 記錄，不允許修改總金額
      if (updateData.totalAmount && existingPO.expenses.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '該採購單已有費用記錄，無法修改總金額',
        });
      }

      // 更新 PO
      const updatedPO = await ctx.prisma.purchaseOrder.update({
        where: { id },
        data: updateData,
        include: {
          project: {
            select: {
              id: true,
              name: true,
            },
          },
          vendor: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedPO;
    }),

  /**
   * 刪除採購單
   * @param id - PO ID
   * @returns 成功訊息
   *
   * 注意：如果 PO 有關聯的 Expense，將拒絕刪除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的PO ID') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查 PO 是否存在
      const purchaseOrder = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              expenses: true,
            },
          },
          quote: true,
        },
      });

      if (!purchaseOrder) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 如果 PO 有關聯的 Expense，不允許刪除
      if (purchaseOrder._count.expenses > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除採購單，因為有 ${purchaseOrder._count.expenses} 筆費用記錄與之關聯`,
        });
      }

      // 刪除 PO（Transaction 確保資料一致性）
      await ctx.prisma.$transaction(async (prisma) => {
        // 1. 如果有關聯的 Quote，先解除關聯
        if (purchaseOrder.quote) {
          await prisma.quote.update({
            where: { id: purchaseOrder.quote.id },
            data: {
              purchaseOrderId: null,
            },
          });
        }

        // 2. 刪除 PO
        await prisma.purchaseOrder.delete({
          where: { id: input.id },
        });
      });

      return { success: true, message: '採購單已成功刪除' };
    }),

  /**
   * 根據專案 ID 查詢 PO
   * @param projectId - 專案 ID
   * @returns PurchaseOrder | null
   */
  getByProject: protectedProcedure
    .input(z.object({ projectId: z.string().min(1, '無效的專案ID') }))
    .query(async ({ ctx, input }) => {
      const purchaseOrder = await ctx.prisma.purchaseOrder.findFirst({
        where: { projectId: input.projectId },
        include: {
          vendor: true,
          quote: {
            select: {
              id: true,
              amount: true,
              uploadDate: true,
            },
          },
          expenses: {
            orderBy: { createdAt: 'desc' },
          },
          _count: {
            select: {
              expenses: true,
            },
          },
        },
      });

      return purchaseOrder;
    }),

  /**
   * 獲取採購單統計資訊
   * @returns { totalPOs, totalAmount, POsByProject, POsWithExpenses }
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalPOs = await ctx.prisma.purchaseOrder.count();

      const totalAmountResult = await ctx.prisma.purchaseOrder.aggregate({
        _sum: {
          totalAmount: true,
        },
      });

      const POsWithExpenses = await ctx.prisma.purchaseOrder.count({
        where: {
          expenses: {
            some: {},
          },
        },
      });

      const POsByProject = await ctx.prisma.purchaseOrder.groupBy({
        by: ['projectId'],
        _count: true,
      });

      return {
        totalPOs,
        totalAmount: totalAmountResult._sum.totalAmount || 0,
        POsWithExpenses,
        POsWithoutExpenses: totalPOs - POsWithExpenses,
        projectsWithPOs: POsByProject.length,
      };
    }),
});
