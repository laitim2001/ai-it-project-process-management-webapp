/**
 * Quote（報價單）管理 tRPC API 路由
 *
 * 功能說明：
 * - 報價單 CRUD 操作：上傳、查詢、更新、刪除
 * - 檔案上傳處理（目前使用本地文件系統，未來可升級到 Azure Blob Storage）
 * - 與 Project 和 Vendor 的關聯管理
 * - 報價比較功能支援
 *
 * Epic 4 - Story 5.2: 為已批准的專案上傳並關聯報價單
 * Epic 4 - Story 5.3: 選擇最終供應商並記錄採購決策
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 創建報價單 Schema
 * 注意：實際檔案上傳將通過 Next.js API Route 處理，這裡只接收檔案路徑
 */
const createQuoteSchema = z.object({
  projectId: z.string().min(1, '專案ID為必填'),
  vendorId: z.string().min(1, '供應商ID為必填'),
  amount: z.number().min(0, '報價金額必須大於等於0'),
  filePath: z.string().min(1, '檔案路徑為必填'),
  fileName: z.string().optional(), // 原始檔案名稱
  description: z.string().optional(), // 報價說明
});

/**
 * 更新報價單 Schema
 */
const updateQuoteSchema = z.object({
  id: z.string().uuid('報價單ID必須是有效的UUID格式'),
  amount: z.number().min(0, '報價金額必須大於等於0').optional(),
  description: z.string().optional(),
});

/**
 * 查詢專案報價單 Schema
 */
const getQuotesByProjectSchema = z.object({
  projectId: z.string().min(1, '無效的專案ID'),
  vendorId: z.string().optional(), // 可選：只查詢特定供應商的報價
});

// ========================================
// tRPC Router 定義
// ========================================

export const quoteRouter = createTRPCRouter({

  /**
   * 查詢所有報價單（分頁）
   * @param page - 頁碼（預設 1）
   * @param limit - 每頁數量（預設 10，最大 100）
   * @param projectId - 可選：按專案篩選
   * @param vendorId - 可選：按供應商篩選
   * @returns { items: Quote[], pagination: { page, limit, total, totalPages } }
   */
  getAll: protectedProcedure
    .input(z.object({
      page: z.number().min(1).default(1),
      limit: z.number().min(1).max(100).default(10),
      projectId: z.string().optional(),
      vendorId: z.string().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const { page, limit, projectId, vendorId } = input;
      const skip = (page - 1) * limit;

      // 構建查詢條件
      const whereCondition: any = {};
      if (projectId) {
        whereCondition.projectId = projectId;
      }
      if (vendorId) {
        whereCondition.vendorId = vendorId;
      }

      // 查詢總數
      const total = await ctx.prisma.quote.count({
        where: whereCondition,
      });

      // 查詢報價單列表
      const quotes = await ctx.prisma.quote.findMany({
        where: whereCondition,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
              contactEmail: true,
              phone: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
              date: true,
            },
          },
        },
        orderBy: { uploadDate: 'desc' },
        skip,
        take: limit,
      });

      return {
        items: quotes,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * 根據專案 ID 查詢所有報價單
   * @param projectId - 專案 ID
   * @param vendorId - 可選：只查詢特定供應商的報價
   * @returns Quote[] 包含供應商資訊
   */
  getByProject: protectedProcedure
    .input(getQuotesByProjectSchema)
    .query(async ({ ctx, input }) => {
      const whereCondition: any = {
        projectId: input.projectId,
      };

      if (input.vendorId) {
        whereCondition.vendorId = input.vendorId;
      }

      const quotes = await ctx.prisma.quote.findMany({
        where: whereCondition,
        include: {
          vendor: {
            select: {
              id: true,
              name: true,
              contactPerson: true,
              contactEmail: true,
              phone: true,
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
              date: true,
            },
          },
        },
        orderBy: { uploadDate: 'desc' },
      });

      return quotes;
    }),

  /**
   * 根據供應商 ID 查詢所有報價單
   * @param vendorId - 供應商 ID
   * @returns Quote[] 包含專案資訊
   */
  getByVendor: protectedProcedure
    .input(z.object({ vendorId: z.string().min(1, '無效的供應商ID') }))
    .query(async ({ ctx, input }) => {
      const quotes = await ctx.prisma.quote.findMany({
        where: { vendorId: input.vendorId },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              status: true,
            },
          },
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
            },
          },
        },
        orderBy: { uploadDate: 'desc' },
      });

      return quotes;
    }),

  /**
   * 根據 ID 查詢單一報價單
   * @param id - 報價單 ID
   * @returns Quote 完整資訊
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid('報價單ID必須是有效的UUID格式') }))
    .query(async ({ ctx, input }) => {
      const quote = await ctx.prisma.quote.findUnique({
        where: { id: input.id },
        include: {
          vendor: true,
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
            },
          },
          purchaseOrders: true,
        },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該報價單',
        });
      }

      return quote;
    }),

  /**
   * 創建新報價單
   * @param projectId - 專案 ID
   * @param vendorId - 供應商 ID
   * @param amount - 報價金額
   * @param filePath - 檔案存儲路徑
   * @returns 新創建的 Quote
   */
  create: protectedProcedure
    .input(createQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證專案是否存在
      const project = await ctx.prisma.project.findUnique({
        where: { id: input.projectId },
        include: {
          proposals: {
            where: {
              status: 'Approved',
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

      // 驗證專案是否有已批准的提案（業務邏輯）
      if (project.proposals.length === 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有已批准提案的專案才能上傳報價單',
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

      // 創建報價單
      const quote = await ctx.prisma.quote.create({
        data: {
          projectId: input.projectId,
          vendorId: input.vendorId,
          amount: input.amount,
          filePath: input.filePath,
        },
        include: {
          vendor: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return quote;
    }),

  /**
   * 更新報價單資訊
   * @param id - 報價單 ID
   * @param amount - 更新後的報價金額（選填）
   * @param description - 報價說明（選填）
   * @returns 更新後的 Quote
   */
  update: protectedProcedure
    .input(updateQuoteSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 檢查報價單是否存在
      const existingQuote = await ctx.prisma.quote.findUnique({
        where: { id },
        include: {
          purchaseOrders: true,
        },
      });

      if (!existingQuote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該報價單',
        });
      }

      // 如果報價單已被選為採購單，不允許修改
      if (existingQuote.purchaseOrders && existingQuote.purchaseOrders.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '該報價單已被選為採購單，無法修改',
        });
      }

      // 更新報價單
      const updatedQuote = await ctx.prisma.quote.update({
        where: { id },
        data: updateData,
        include: {
          vendor: true,
          project: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      return updatedQuote;
    }),

  /**
   * 刪除報價單
   * @param id - 報價單 ID
   * @returns 成功訊息
   *
   * 注意：如果報價單已被選為採購單，將拒絕刪除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid('報價單ID必須是有效的UUID格式') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查報價單是否存在
      const quote = await ctx.prisma.quote.findUnique({
        where: { id: input.id },
        include: {
          purchaseOrders: true,
        },
      });

      if (!quote) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該報價單',
        });
      }

      // 如果報價單已被選為採購單，不允許刪除
      if (quote.purchaseOrders && quote.purchaseOrders.length > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '該報價單已被選為採購單，無法刪除',
        });
      }

      // TODO: 同時刪除關聯的檔案（從文件系統或 Azure Blob Storage）
      // await deleteFile(quote.filePath);

      // 刪除報價單記錄
      await ctx.prisma.quote.delete({
        where: { id: input.id },
      });

      return { success: true, message: '報價單已成功刪除' };
    }),

  /**
   * 比較專案的所有報價單
   * @param projectId - 專案 ID
   * @returns 報價比較資訊（按金額排序）
   */
  compare: protectedProcedure
    .input(z.object({ projectId: z.string().min(1, '無效的專案ID') }))
    .query(async ({ ctx, input }) => {
      const quotes = await ctx.prisma.quote.findMany({
        where: { projectId: input.projectId },
        include: {
          vendor: true,
          purchaseOrders: {
            select: {
              id: true,
              poNumber: true,
            },
          },
        },
        orderBy: { amount: 'asc' }, // 按金額升序排列
      });

      // 計算統計資訊
      const totalQuotes = quotes.length;
      const avgAmount = totalQuotes > 0
        ? quotes.reduce((sum, q) => sum + q.amount, 0) / totalQuotes
        : 0;
      const minAmount = quotes[0]?.amount ?? 0;
      const maxAmount = quotes[quotes.length - 1]?.amount ?? 0;
      const selectedQuote = quotes.find(q => q.purchaseOrders && q.purchaseOrders.length > 0);

      return {
        quotes,
        stats: {
          total: totalQuotes,
          avgAmount,
          minAmount,
          maxAmount,
          selectedVendorId: selectedQuote?.vendorId,
          selectedQuoteId: selectedQuote?.id,
        },
      };
    }),

  /**
   * 獲取報價單統計資訊
   * @returns { totalQuotes, quotesByProject, quotesWithPO }
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalQuotes = await ctx.prisma.quote.count();

      const quotesByProject = await ctx.prisma.project.findMany({
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              quotes: true,
            },
          },
        },
        where: {
          quotes: {
            some: {},
          },
        },
        orderBy: {
          quotes: {
            _count: 'desc',
          },
        },
        take: 10, // 只顯示前10個專案
      });

      const quotesWithPO = await ctx.prisma.quote.count({
        where: {
          purchaseOrderId: {
            not: null,
          },
        },
      });

      return {
        totalQuotes,
        quotesByProject,
        quotesWithPO,
        quotesWithoutPO: totalQuotes - quotesWithPO,
      };
    }),
});
