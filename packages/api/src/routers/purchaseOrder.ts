/**
 * @fileoverview Purchase Order Router - 採購單管理 API
 *
 * @description
 * 提供採購單的完整管理功能，支援表頭-明細架構（Header-Detail Pattern）。
 * 採購單記錄專案的採購決策和品項明細，支援從報價單生成或手動建立。
 * 包含狀態工作流（Draft → Submitted → Approved）和主管批准機制。
 * 明細品項支援新增、更新、刪除，總金額自動重新計算。
 *
 * @module api/routers/purchaseOrder
 *
 * @features
 * - 建立採購單並自動計算總金額（支援多品項明細）
 * - 更新採購單表頭和明細（支援品項的新增、更新、刪除）
 * - 查詢採購單列表（支援專案、供應商過濾和排序）
 * - 查詢單一採購單詳情（包含品項明細和費用記錄）
 * - 提交採購單（狀態變更：Draft → Submitted）
 * - 批准採購單（主管權限：Submitted → Approved）
 * - 刪除採購單（級聯刪除檢查保護）
 * - 獲取採購單統計資訊（總數、總金額、關聯專案）
 *
 * @procedures
 * - create: 建立新採購單（含品項明細）
 * - update: 更新採購單表頭和明細
 * - delete: 刪除採購單（檢查費用記錄關聯）
 * - getAll: 查詢採購單列表（支援分頁和過濾）
 * - getById: 查詢單一採購單詳情（含品項和費用）
 * - getByProject: 根據專案查詢採購單
 * - submit: 提交採購單（狀態工作流）
 * - approve: 批准採購單（Supervisor only）
 * - getStats: 獲取採購單統計資訊
 *
 * @dependencies
 * - Prisma Client: 資料庫操作和交易管理
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - PurchaseOrder 和 PurchaseOrderItem 資料模型
 * - packages/api/src/routers/project.ts - 專案 Router
 * - packages/api/src/routers/vendor.ts - 供應商 Router
 * - packages/api/src/routers/quote.ts - 報價單 Router
 * - apps/web/src/app/[locale]/purchase-orders/page.tsx - 採購單列表頁面
 *
 * @author IT Department
 * @since Epic 4 - Procurement and Vendor Management
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 採購品項明細 Schema
 */
const purchaseOrderItemSchema = z.object({
  id: z.string().optional(), // 有 id = 更新，無 id = 新增
  itemName: z.string().min(1, '品項名稱為必填'),
  description: z.string().optional(),
  quantity: z.number().int().min(1, '數量必須至少為 1'),
  unitPrice: z.number().min(0, '單價必須大於等於 0'),
  sortOrder: z.number().int().default(0),
  _delete: z.boolean().optional(), // true = 刪除此品項
});

/**
 * 創建 PO Schema（統一版本，支持明細）
 */
const createPOSchema = z.object({
  name: z.string().min(1, 'PO 名稱為必填'),
  description: z.string().optional(),
  projectId: z.string().min(1, '專案ID為必填'),
  vendorId: z.string().min(1, '供應商ID為必填'),
  quoteId: z.string().optional(),
  date: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, '至少需要一個採購品項'),
});

/**
 * 更新 PO Schema（支持明細）
 */
const updatePOSchema = z.object({
  id: z.string().min(1, '無效的PO ID'),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  vendorId: z.string().optional(),
  date: z.string().optional(),
  items: z.array(purchaseOrderItemSchema).optional(),
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
   * 根據 ID 查詢單一採購單（含明細）
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
          items: {
            orderBy: { sortOrder: 'asc' },
          },
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
   * 創建採購單（含明細）- Module 4 新版本
   * @param name - PO 名稱
   * @param items - 採購品項明細
   * @returns 新創建的 PurchaseOrder
   *
   * Module 4: 支持表頭-明細結構
   */
  create: protectedProcedure
    .input(createPOSchema)
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

      // 驗證至少要有一個品項
      if (input.items.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '至少需要一個採購品項',
        });
      }

      // 計算總金額
      const totalAmount = input.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice);
      }, 0);

      return await ctx.prisma.$transaction(async (tx) => {
        // 創建採購單表頭
        const po = await tx.purchaseOrder.create({
          data: {
            name: input.name,
            description: input.description,
            projectId: input.projectId,
            vendorId: input.vendorId,
            quoteId: input.quoteId,
            date: input.date ? new Date(input.date) : new Date(),
            totalAmount,
            status: 'Draft',
          },
        });

        // 創建明細
        await tx.purchaseOrderItem.createMany({
          data: input.items.map((item, index) => ({
            purchaseOrderId: po.id,
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.quantity * item.unitPrice,
            sortOrder: item.sortOrder ?? index,
          })),
        });

        // 返回完整的 PO（含明細）
        return await tx.purchaseOrder.findUnique({
          where: { id: po.id },
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
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
      });
    }),

  // Module 4 重構：createFromQuote 和 createManual 已移除，請使用統一的 create endpoint

  /**
   * 更新採購單（含明細）- Module 4 新版本
   * @param id - PO ID
   * @param items - 更新的明細（支持新增、更新、刪除）
   * @returns 更新後的 PurchaseOrder
   *
   * Module 4: 支持明細的新增、更新、刪除
   */
  update: protectedProcedure
    .input(updatePOSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, items, ...headerUpdate } = input;

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

      // 如果狀態不是 Draft，不允許修改
      if (existingPO.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的採購單才能修改',
        });
      }

      return await ctx.prisma.$transaction(async (tx) => {
        // 準備表頭更新數據
        const updateData: any = {};
        if (headerUpdate.name) updateData.name = headerUpdate.name;
        if (headerUpdate.description !== undefined) updateData.description = headerUpdate.description;
        if (headerUpdate.vendorId) updateData.vendorId = headerUpdate.vendorId;
        if (headerUpdate.date) updateData.date = new Date(headerUpdate.date);

        // 處理明細更新
        if (items) {
          // 1. 刪除標記為刪除的品項
          const itemsToDelete = items.filter(item => item._delete && item.id);
          if (itemsToDelete.length > 0) {
            await tx.purchaseOrderItem.deleteMany({
              where: {
                id: { in: itemsToDelete.map(item => item.id!) },
              },
            });
          }

          // 2. 處理更新和新增
          const itemsToProcess = items.filter(item => !item._delete);
          for (const item of itemsToProcess) {
            const subtotal = item.quantity * item.unitPrice;

            if (item.id) {
              // 更新現有品項
              await tx.purchaseOrderItem.update({
                where: { id: item.id },
                data: {
                  itemName: item.itemName,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  subtotal,
                  sortOrder: item.sortOrder,
                },
              });
            } else {
              // 新增品項
              await tx.purchaseOrderItem.create({
                data: {
                  purchaseOrderId: id,
                  itemName: item.itemName,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  subtotal,
                  sortOrder: item.sortOrder,
                },
              });
            }
          }

          // 3. 重新計算總金額
          const allItems = await tx.purchaseOrderItem.findMany({
            where: { purchaseOrderId: id },
          });
          const totalAmount = allItems.reduce((sum, item) => sum + item.subtotal, 0);
          updateData.totalAmount = totalAmount;
        }

        // 更新表頭
        const po = await tx.purchaseOrder.update({
          where: { id },
          data: updateData,
          include: {
            items: {
              orderBy: { sortOrder: 'asc' },
            },
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

        return po;
      });
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
        // 1. 先刪除所有關聯的明細
        await prisma.purchaseOrderItem.deleteMany({
          where: { purchaseOrderId: input.id },
        });

        // 2. 刪除 PO（Quote 關聯會自動解除，因為是 optional foreign key）
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
   * 提交採購單（狀態變更：Draft → Submitted）
   * @param id - PO ID
   * @returns 更新後的 PurchaseOrder
   *
   * Module 4: 採購單狀態工作流
   */
  submit: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的PO ID') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查 PO 是否存在
      const po = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.id },
        include: {
          items: true,
        },
      });

      if (!po) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 驗證狀態
      if (po.status !== 'Draft') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有草稿狀態的採購單才能提交',
        });
      }

      // 驗證至少有一個品項
      if (po.items.length === 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '無法提交空的採購單，請至少添加一個品項',
        });
      }

      // 更新狀態
      return await ctx.prisma.purchaseOrder.update({
        where: { id: input.id },
        data: {
          status: 'Submitted',
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
    }),

  /**
   * 批准採購單（主管）- Module 4
   * @param id - PO ID
   * @returns 更新後的 PurchaseOrder
   *
   * Module 4: 主管批准工作流
   */
  approve: supervisorProcedure
    .input(z.object({ id: z.string().min(1, '無效的PO ID') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查 PO 是否存在
      const po = await ctx.prisma.purchaseOrder.findUnique({
        where: { id: input.id },
      });

      if (!po) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該採購單',
        });
      }

      // 驗證狀態
      if (po.status !== 'Submitted') {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: '只有已提交的採購單才能批准',
        });
      }

      // 更新狀態和批准日期
      return await ctx.prisma.purchaseOrder.update({
        where: { id: input.id },
        data: {
          status: 'Approved',
          approvedDate: new Date(),
        },
        include: {
          items: {
            orderBy: { sortOrder: 'asc' },
          },
        },
      });
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
