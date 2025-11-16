/**
 * @fileoverview Currency Router - 貨幣管理 API
 *
 * @description
 * 提供貨幣的完整 CRUD 操作和查詢功能，支援 ISO 4217 標準貨幣代碼。
 * 貨幣模組為專案管理系統提供多幣種支援，允許管理員配置和維護可用的貨幣選項。
 * 系統預設包含 6 種常用貨幣（TWD, USD, EUR, CNY, JPY, HKD），管理員可新增更多貨幣。
 * 支援貨幣啟用/停用功能，停用的貨幣不會顯示在專案表單中，但不影響已使用該貨幣的現有專案。
 *
 * @module api/routers/currency
 *
 * @features
 * - 建立新貨幣（ISO 4217 代碼驗證）
 * - 查詢所有貨幣（支援啟用/停用篩選）
 * - 查詢啟用的貨幣（供專案表單使用）
 * - 查詢單一貨幣詳情
 * - 更新貨幣資訊（代碼、名稱、符號、匯率）
 * - 軟刪除貨幣（切換 active 狀態）
 * - 切換貨幣啟用/停用狀態
 *
 * @procedures
 * - create: 建立新貨幣（僅限管理員）
 * - update: 更新貨幣資訊（僅限管理員）
 * - delete: 軟刪除貨幣（僅限管理員）
 * - getAll: 查詢所有貨幣（支援 includeInactive 參數）
 * - getActive: 查詢啟用的貨幣（供專案表單使用）
 * - getById: 查詢單一貨幣詳情
 * - toggleActive: 切換貨幣啟用/停用狀態（僅限管理員）
 *
 * @permissions
 * - create, update, delete, toggleActive: 僅限 Admin 角色
 * - getAll, getActive, getById: 所有已登入用戶
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 * - TRPCError: 錯誤處理
 *
 * @related
 * - packages/db/prisma/schema.prisma - Currency 資料模型
 * - packages/api/src/routers/project.ts - 關聯的專案 Router（使用貨幣）
 * - apps/web/src/app/[locale]/settings/currencies/page.tsx - 貨幣管理頁面
 * - apps/web/src/components/project/ProjectForm.tsx - 專案表單（選擇貨幣）
 *
 * @author IT Department
 * @since FEAT-001 - Project Fields Enhancement
 * @lastModified 2025-11-16
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';

// ========== Validation Schemas ==========

/**
 * Currency 建立 Schema
 *
 * @description
 * 驗證建立貨幣的輸入資料，確保符合 ISO 4217 標準。
 *
 * @validation
 * - code: 3 個大寫字母（ISO 4217 標準）
 * - name: 必填，1-100 字元
 * - symbol: 必填，1-10 字元
 * - exchangeRate: 可選，必須大於 0
 */
export const createCurrencySchema = z.object({
  code: z
    .string()
    .length(3, 'Currency code must be exactly 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency code must be 3 uppercase letters (ISO 4217 standard)'),
  name: z.string().min(1, 'Currency name is required').max(100),
  symbol: z.string().min(1, 'Currency symbol is required').max(10),
  exchangeRate: z.number().positive('Exchange rate must be positive').optional(),
});

/**
 * Currency 更新 Schema
 *
 * @description
 * 驗證更新貨幣的輸入資料，所有欄位為可選（部分更新）。
 */
export const updateCurrencySchema = z.object({
  id: z.string().uuid('Invalid currency ID'),
  code: z
    .string()
    .length(3)
    .regex(/^[A-Z]{3}$/)
    .optional(),
  name: z.string().min(1).max(100).optional(),
  symbol: z.string().min(1).max(10).optional(),
  exchangeRate: z.number().positive().nullable().optional(),
});

// ========== Currency Router ==========

export const currencyRouter = createTRPCRouter({
  /**
   * 建立新貨幣
   *
   * @description
   * 建立一個新的貨幣記錄。貨幣代碼（code）必須唯一。
   * 預設為啟用狀態（active: true）。
   *
   * @permission Admin only
   * @input createCurrencySchema
   * @returns 新建立的 Currency 物件
   * @throws CONFLICT - 貨幣代碼已存在
   * @example
   * ```typescript
   * const newCurrency = await trpc.currency.create.mutate({
   *   code: 'SGD',
   *   name: '新加坡元',
   *   symbol: 'S$',
   *   exchangeRate: 22.5
   * });
   * ```
   */
  create: adminProcedure
    .input(createCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查貨幣代碼是否已存在
      const existing = await ctx.prisma.currency.findUnique({
        where: { code: input.code },
      });

      if (existing) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `Currency code "${input.code}" already exists`,
        });
      }

      // 建立新貨幣
      return ctx.prisma.currency.create({
        data: {
          code: input.code,
          name: input.name,
          symbol: input.symbol,
          exchangeRate: input.exchangeRate,
          active: true,
        },
      });
    }),

  /**
   * 更新貨幣資訊
   *
   * @description
   * 更新指定貨幣的資訊。支援部分更新（只傳入需要更新的欄位）。
   * 如果更新貨幣代碼，會檢查新代碼是否與其他貨幣衝突。
   *
   * @permission Admin only
   * @input updateCurrencySchema
   * @returns 更新後的 Currency 物件
   * @throws NOT_FOUND - 貨幣不存在
   * @throws CONFLICT - 貨幣代碼已被其他貨幣使用
   */
  update: adminProcedure
    .input(updateCurrencySchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 檢查貨幣是否存在
      const currency = await ctx.prisma.currency.findUnique({
        where: { id },
      });

      if (!currency) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Currency not found',
        });
      }

      // 如果更新 code，檢查是否與其他貨幣衝突
      if (updateData.code && updateData.code !== currency.code) {
        const existing = await ctx.prisma.currency.findUnique({
          where: { code: updateData.code },
        });

        if (existing) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `Currency code "${updateData.code}" already exists`,
          });
        }
      }

      // 更新貨幣
      return ctx.prisma.currency.update({
        where: { id },
        data: updateData,
      });
    }),

  /**
   * 軟刪除貨幣
   *
   * @description
   * 將貨幣標記為停用（active: false），而非真正刪除。
   * 停用的貨幣不會出現在專案表單的貨幣選項中，但不影響已使用該貨幣的現有專案。
   *
   * @permission Admin only
   * @input { id: string }
   * @returns 更新後的 Currency 物件（active: false）
   * @throws NOT_FOUND - 貨幣不存在
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // 檢查貨幣是否存在
      const currency = await ctx.prisma.currency.findUnique({
        where: { id: input.id },
      });

      if (!currency) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Currency not found',
        });
      }

      // 軟刪除：設定 active = false
      return ctx.prisma.currency.update({
        where: { id: input.id },
        data: { active: false },
      });
    }),

  /**
   * 查詢所有貨幣
   *
   * @description
   * 查詢所有貨幣列表，支援篩選啟用/停用狀態。
   * 預設只返回啟用的貨幣，可透過 includeInactive 參數包含停用的貨幣。
   * 結果按貨幣代碼（code）排序。
   *
   * @permission Protected (所有已登入用戶)
   * @input { includeInactive?: boolean }
   * @returns Currency[] - 貨幣列表
   * @example
   * ```typescript
   * // 只查詢啟用的貨幣
   * const activeCurrencies = await trpc.currency.getAll.query({ includeInactive: false });
   *
   * // 查詢所有貨幣（包含停用）
   * const allCurrencies = await trpc.currency.getAll.query({ includeInactive: true });
   * ```
   */
  getAll: protectedProcedure
    .input(
      z.object({
        includeInactive: z.boolean().default(false),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.prisma.currency.findMany({
        where: input.includeInactive ? undefined : { active: true },
        orderBy: { code: 'asc' },
      });
    }),

  /**
   * 查詢啟用的貨幣
   *
   * @description
   * 快捷方法，只返回啟用的貨幣列表。
   * 主要供專案表單的貨幣下拉選單使用。
   *
   * @permission Protected (所有已登入用戶)
   * @returns Currency[] - 啟用的貨幣列表
   */
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.currency.findMany({
      where: { active: true },
      orderBy: { code: 'asc' },
    });
  }),

  /**
   * 查詢單一貨幣詳情
   *
   * @description
   * 根據 ID 查詢單一貨幣的詳細資訊。
   * 包含該貨幣被使用的專案數量統計。
   *
   * @permission Protected (所有已登入用戶)
   * @input { id: string }
   * @returns Currency 物件 + 專案數量
   * @throws NOT_FOUND - 貨幣不存在
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const currency = await ctx.prisma.currency.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: { projects: true },
          },
        },
      });

      if (!currency) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Currency not found',
        });
      }

      return currency;
    }),

  /**
   * 切換貨幣啟用/停用狀態
   *
   * @description
   * 切換指定貨幣的啟用狀態（active: true ↔ false）。
   * 停用後的貨幣不會出現在專案表單中，但不影響現有專案。
   *
   * @permission Admin only
   * @input { id: string }
   * @returns 更新後的 Currency 物件
   * @throws NOT_FOUND - 貨幣不存在
   */
  toggleActive: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const currency = await ctx.prisma.currency.findUnique({
        where: { id: input.id },
      });

      if (!currency) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Currency not found',
        });
      }

      return ctx.prisma.currency.update({
        where: { id: input.id },
        data: { active: !currency.active },
      });
    }),
});
