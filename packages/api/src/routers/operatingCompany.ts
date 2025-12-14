/**
 * @fileoverview Operating Company Router - 營運公司管理 API
 *
 * @description
 * 提供營運公司（OpCo）的完整 CRUD 操作和查詢功能。
 * 營運公司是費用轉嫁和 OM 費用管理的核心實體，支援費用分攤和成本追蹤。
 * 包含啟用/停用狀態管理，以及級聯刪除保護機制防止誤刪有關聯資料的公司。
 *
 * @module api/routers/operatingCompany
 *
 * @features
 * - 建立營運公司（驗證公司代碼唯一性）
 * - 更新營運公司資訊（支援代碼和名稱修改）
 * - 查詢營運公司列表（支援啟用/停用過濾）
 * - 查詢單一營運公司詳情（包含關聯計數）
 * - 切換營運公司啟用/停用狀態
 * - 刪除營運公司（級聯刪除檢查保護）
 *
 * @procedures
 * - create: 建立新營運公司（Supervisor only）
 * - update: 更新營運公司資訊（Supervisor only）
 * - getById: 查詢單一營運公司詳情
 * - getAll: 查詢營運公司列表（支援啟用狀態過濾）
 * - delete: 刪除營運公司（Supervisor only，檢查關聯資料）
 * - toggleActive: 切換啟用/停用狀態（Supervisor only）
 * - getUserPermissions: 獲取用戶的 OpCo 權限列表（FEAT-009）
 * - setUserPermissions: 設定用戶的 OpCo 權限（FEAT-009）
 * - getForCurrentUser: 獲取當前用戶可訪問的 OpCo（FEAT-009）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - OperatingCompany 資料模型
 * - packages/api/src/routers/omExpense.ts - OM 費用 Router
 * - packages/api/src/routers/chargeOut.ts - 費用轉嫁 Router
 * - apps/web/src/app/[locale]/operating-companies/page.tsx - 營運公司列表頁面
 *
 * @author IT Department
 * @since Module 3 - Operating Company Management
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

// ========== Zod Schemas ==========

const createOpCoSchema = z.object({
  code: z.string().min(1, '公司代碼不能為空').max(50),
  name: z.string().min(1, '公司名稱不能為空').max(200),
  description: z.string().optional(),
});

const updateOpCoSchema = z.object({
  id: z.string().min(1, 'ID 不能為空'),
  code: z.string().min(1).max(50).optional(),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ========== Router ==========

export const operatingCompanyRouter = createTRPCRouter({
  /**
   * 創建營運公司
   * 權限：Supervisor only
   */
  create: supervisorProcedure
    .input(createOpCoSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查 code 是否已存在
      const existingOpCo = await ctx.prisma.operatingCompany.findUnique({
        where: { code: input.code },
      });

      if (existingOpCo) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: `公司代碼 "${input.code}" 已存在`,
        });
      }

      const opCo = await ctx.prisma.operatingCompany.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description,
        },
      });

      return opCo;
    }),

  /**
   * 更新營運公司
   * 權限：Supervisor only
   */
  update: supervisorProcedure
    .input(updateOpCoSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 驗證 OpCo 是否存在
      const existingOpCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id },
      });

      if (!existingOpCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '營運公司不存在',
        });
      }

      // 如果要更新 code，檢查新 code 是否衝突
      if (updateData.code && updateData.code !== existingOpCo.code) {
        const codeConflict = await ctx.prisma.operatingCompany.findUnique({
          where: { code: updateData.code },
        });

        if (codeConflict) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: `公司代碼 "${updateData.code}" 已被使用`,
          });
        }
      }

      const updatedOpCo = await ctx.prisma.operatingCompany.update({
        where: { id },
        data: updateData,
      });

      return updatedOpCo;
    }),

  /**
   * 獲取單個營運公司
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              chargeOuts: true,
              // FEAT-007: 更新關係名稱
              omExpenseItems: true, // 明細項目數量
              omExpensesLegacy: true, // 舊版 OM 費用數量（向後兼容）
            },
          },
        },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '營運公司不存在',
        });
      }

      return opCo;
    }),

  /**
   * 獲取所有營運公司列表
   * 支持過濾：僅顯示啟用的 OpCo
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional(),
          includeInactive: z.boolean().optional().default(false),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {};

      // 預設只顯示啟用的
      if (input?.isActive !== undefined) {
        where.isActive = input.isActive;
      } else if (!input?.includeInactive) {
        where.isActive = true;
      }

      const opCos = await ctx.prisma.operatingCompany.findMany({
        where,
        include: {
          _count: {
            select: {
              chargeOuts: true,
              // FEAT-007: 更新關係名稱
              omExpenseItems: true, // 明細項目數量
              omExpensesLegacy: true, // 舊版 OM 費用數量（向後兼容）
            },
          },
        },
        orderBy: [{ code: 'asc' }],
      });

      return opCos;
    }),

  /**
   * 刪除營運公司
   * 權限：Supervisor only
   * 注意：如果有關聯的費用轉嫁或 OM 費用明細項目，禁止刪除
   */
  delete: supervisorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 檢查是否有關聯資料
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.id },
        include: {
          _count: {
            select: {
              chargeOuts: true,
              // FEAT-007: 更新關係名稱
              omExpenseItems: true, // 明細項目數量
              omExpensesLegacy: true, // 舊版 OM 費用數量
              omExpenseMonthly: true,
            },
          },
        },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '營運公司不存在',
        });
      }

      // FEAT-007: 更新關聯檢查
      const hasRelations =
        (opCo._count.chargeOuts ?? 0) > 0 ||
        (opCo._count.omExpenseItems ?? 0) > 0 ||
        (opCo._count.omExpensesLegacy ?? 0) > 0 ||
        (opCo._count.omExpenseMonthly ?? 0) > 0;

      if (hasRelations) {
        throw new TRPCError({
          code: 'PRECONDITION_FAILED',
          message: `無法刪除營運公司 "${opCo.name}"，因為有關聯的費用記錄。請先刪除相關費用記錄。`,
        });
      }

      await ctx.prisma.operatingCompany.delete({
        where: { id: input.id },
      });

      return { success: true, message: '營運公司已刪除' };
    }),

  /**
   * 切換啟用/停用狀態
   * 權限：Supervisor only
   */
  toggleActive: supervisorProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.id },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '營運公司不存在',
        });
      }

      const updated = await ctx.prisma.operatingCompany.update({
        where: { id: input.id },
        data: { isActive: !opCo.isActive },
      });

      return updated;
    }),

  // ========== FEAT-009: Operating Company 數據權限管理 ==========

  /**
   * 獲取指定用戶的 OpCo 權限列表
   * 權限：Supervisor only（用於管理其他用戶的權限）
   * @param userId - 要查詢的用戶 ID
   * @returns 用戶被授權訪問的 OpCo 列表
   */
  getUserPermissions: supervisorProcedure
    .input(z.object({ userId: z.string().min(1, '用戶 ID 不能為空') }))
    .query(async ({ ctx, input }) => {
      const permissions = await ctx.prisma.userOperatingCompany.findMany({
        where: { userId: input.userId },
        include: {
          operatingCompany: true,
        },
        orderBy: {
          operatingCompany: {
            code: 'asc',
          },
        },
      });

      return permissions;
    }),

  /**
   * 設定用戶的 OpCo 權限（整批替換）
   * 權限：Supervisor only
   * @param userId - 要設定權限的用戶 ID
   * @param operatingCompanyIds - 授權的 OpCo ID 列表（空陣列表示清除所有權限）
   */
  setUserPermissions: supervisorProcedure
    .input(
      z.object({
        userId: z.string().min(1, '用戶 ID 不能為空'),
        operatingCompanyIds: z.array(z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 驗證用戶是否存在
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用戶不存在',
        });
      }

      // 驗證所有 OpCo ID 都存在
      if (input.operatingCompanyIds.length > 0) {
        const opCos = await ctx.prisma.operatingCompany.findMany({
          where: {
            id: { in: input.operatingCompanyIds },
          },
        });

        if (opCos.length !== input.operatingCompanyIds.length) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '部分營運公司 ID 無效',
          });
        }
      }

      // 使用 Transaction 進行整批替換
      await ctx.prisma.$transaction(async (tx) => {
        // 1. 刪除現有權限
        await tx.userOperatingCompany.deleteMany({
          where: { userId: input.userId },
        });

        // 2. 建立新權限
        if (input.operatingCompanyIds.length > 0) {
          await tx.userOperatingCompany.createMany({
            data: input.operatingCompanyIds.map((opCoId) => ({
              userId: input.userId,
              operatingCompanyId: opCoId,
              createdBy: ctx.session.user.id,
            })),
          });
        }
      });

      return { success: true, message: '營運公司權限已更新' };
    }),

  /**
   * 獲取當前登入用戶可訪問的 OpCo 列表
   * 用於 OM Summary 頁面的 OpCo 下拉選單
   *
   * 權限邏輯：
   * - Admin 角色（roleId >= 3）：返回所有啟用的 OpCo
   * - 其他用戶：根據 UserOperatingCompany 表過濾
   * - 向後兼容：無權限記錄的用戶返回所有 OpCo（寬鬆模式）
   *
   * @param isActive - 是否只返回啟用的 OpCo（預設 true）
   */
  getForCurrentUser: protectedProcedure
    .input(
      z
        .object({
          isActive: z.boolean().optional().default(true),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const user = ctx.session.user;
      const isActiveFilter = input?.isActive ?? true;
      // CHANGE-014: 修復 isAdmin 檢查 - 使用 role.id 而不是 roleId
      const userRoleId = user.role?.id ?? 0;

      // Admin 角色預設可以訪問所有 OpCo
      if (userRoleId >= 3) {
        return ctx.prisma.operatingCompany.findMany({
          where: isActiveFilter ? { isActive: true } : {},
          orderBy: { code: 'asc' },
        });
      }

      // 查詢用戶的 OpCo 權限
      const permissions = await ctx.prisma.userOperatingCompany.findMany({
        where: { userId: user.id },
        include: {
          operatingCompany: true,
        },
      });

      // 向後兼容：如果用戶沒有任何權限設定，返回所有啟用的 OpCo（寬鬆模式）
      // 這讓管理員有時間逐步設定權限，而不會立即阻斷用戶訪問
      if (permissions.length === 0) {
        return ctx.prisma.operatingCompany.findMany({
          where: isActiveFilter ? { isActive: true } : {},
          orderBy: { code: 'asc' },
        });
      }

      // 只返回用戶被授權且啟用的 OpCo
      const authorizedOpCos = permissions
        .map((p) => p.operatingCompany)
        .filter((opCo) => (isActiveFilter ? opCo.isActive : true))
        .sort((a, b) => a.code.localeCompare(b.code));

      return authorizedOpCos;
    }),
});
