/**
 * Vendor（供應商）管理 tRPC API 路由
 *
 * 功能說明：
 * - 供應商 CRUD 操作：新增、查詢、更新、刪除
 * - 支援分頁、搜尋、排序
 * - 關聯關係：Vendor → Quote[], PurchaseOrder[]
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

// ========================================
// Zod Schema 驗證定義
// ========================================

/**
 * 創建供應商 Schema
 */
const createVendorSchema = z.object({
  name: z.string().min(1, '供應商名稱為必填'),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('無效的電子郵件格式').optional().or(z.literal('')),
  phone: z.string().optional(),
});

/**
 * 更新供應商 Schema
 */
const updateVendorSchema = z.object({
  id: z.string().min(1, '無效的供應商ID'),
  name: z.string().min(1, '供應商名稱為必填').optional(),
  contactPerson: z.string().optional(),
  contactEmail: z.string().email('無效的電子郵件格式').optional().or(z.literal('')),
  phone: z.string().optional(),
});

/**
 * 查詢參數 Schema（分頁、搜尋、排序）
 */
const getVendorsQuerySchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'createdAt', 'updatedAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

// ========================================
// tRPC Router 定義
// ========================================

export const vendorRouter = createTRPCRouter({

  /**
   * 查詢所有供應商（支援分頁、搜尋、排序）
   * @returns { items: Vendor[], pagination: { total, page, limit, totalPages } }
   */
  getAll: protectedProcedure
    .input(getVendorsQuerySchema)
    .query(async ({ ctx, input }) => {
      const { page, limit, search, sortBy, sortOrder } = input;
      const skip = (page - 1) * limit;

      // 構建搜尋條件
      const whereCondition = search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { contactPerson: { contains: search, mode: 'insensitive' as const } },
              { contactEmail: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {};

      // 查詢總數
      const total = await ctx.prisma.vendor.count({
        where: whereCondition,
      });

      // 查詢供應商列表
      const vendors = await ctx.prisma.vendor.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              quotes: true,
              purchaseOrders: true,
            },
          },
        },
      });

      return {
        items: vendors,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    }),

  /**
   * 根據 ID 查詢單一供應商
   * @param id - 供應商 ID
   * @returns Vendor 完整資訊（含關聯的 Quote 和 PurchaseOrder）
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的供應商ID') }))
    .query(async ({ ctx, input }) => {
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.id },
        include: {
          quotes: {
            orderBy: { uploadDate: 'desc' },
            take: 10, // 只顯示最近10個報價
          },
          purchaseOrders: {
            orderBy: { date: 'desc' },
            take: 10, // 只顯示最近10個採購單
            include: {
              project: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該供應商',
        });
      }

      return vendor;
    }),

  /**
   * 創建新供應商
   * @param name - 供應商名稱（必填）
   * @param contactPerson - 聯絡人（選填）
   * @param contactEmail - 聯絡郵箱（選填）
   * @param phone - 電話（選填）
   * @returns 新創建的 Vendor
   */
  create: protectedProcedure
    .input(createVendorSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查供應商名稱是否已存在
      const existingVendor = await ctx.prisma.vendor.findFirst({
        where: { name: input.name },
      });

      if (existingVendor) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: '供應商名稱已存在',
        });
      }

      // 創建供應商
      const vendor = await ctx.prisma.vendor.create({
        data: {
          name: input.name,
          contactPerson: input.contactPerson,
          contactEmail: input.contactEmail === '' ? undefined : input.contactEmail,
          phone: input.phone,
        },
      });

      return vendor;
    }),

  /**
   * 更新供應商資訊
   * @param id - 供應商 ID
   * @param name, contactPerson, contactEmail, phone - 更新欄位（選填）
   * @returns 更新後的 Vendor
   */
  update: protectedProcedure
    .input(updateVendorSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 檢查供應商是否存在
      const existingVendor = await ctx.prisma.vendor.findUnique({
        where: { id },
      });

      if (!existingVendor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該供應商',
        });
      }

      // 如果更新名稱，檢查新名稱是否與其他供應商重複
      if (updateData.name && updateData.name !== existingVendor.name) {
        const duplicateVendor = await ctx.prisma.vendor.findFirst({
          where: {
            name: updateData.name,
            NOT: { id },
          },
        });

        if (duplicateVendor) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: '供應商名稱已存在',
          });
        }
      }

      // 更新供應商
      const updatedVendor = await ctx.prisma.vendor.update({
        where: { id },
        data: {
          ...updateData,
          contactEmail: updateData.contactEmail === '' ? null : updateData.contactEmail,
        },
      });

      return updatedVendor;
    }),

  /**
   * 刪除供應商
   * @param id - 供應商 ID
   * @returns 成功訊息
   *
   * 注意：如果供應商有關聯的 Quote 或 PurchaseOrder，將拒絕刪除
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1, '無效的供應商ID') }))
    .mutation(async ({ ctx, input }) => {
      // 檢查供應商是否存在
      const vendor = await ctx.prisma.vendor.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              quotes: true,
              purchaseOrders: true,
            },
          },
        },
      });

      if (!vendor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到該供應商',
        });
      }

      // 檢查是否有關聯的 Quote 或 PurchaseOrder
      if (vendor._count.quotes > 0 || vendor._count.purchaseOrders > 0) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除供應商，因為有 ${vendor._count.quotes} 個報價單和 ${vendor._count.purchaseOrders} 個採購單與之關聯`,
        });
      }

      // 刪除供應商
      await ctx.prisma.vendor.delete({
        where: { id: input.id },
      });

      return { success: true, message: '供應商已成功刪除' };
    }),

  /**
   * 獲取供應商統計資訊
   * @returns { totalVendors, vendorsWithQuotes, vendorsWithPOs }
   */
  getStats: protectedProcedure
    .query(async ({ ctx }) => {
      const totalVendors = await ctx.prisma.vendor.count();

      const vendorsWithQuotes = await ctx.prisma.vendor.count({
        where: {
          quotes: {
            some: {},
          },
        },
      });

      const vendorsWithPOs = await ctx.prisma.vendor.count({
        where: {
          purchaseOrders: {
            some: {},
          },
        },
      });

      return {
        totalVendors,
        vendorsWithQuotes,
        vendorsWithPOs,
      };
    }),
});
