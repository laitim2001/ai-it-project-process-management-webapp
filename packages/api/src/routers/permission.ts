/**
 * @fileoverview Permission Router - 權限管理 API
 *
 * @description
 * 提供菜單權限和用戶權限管理功能，實現 FEAT-011 的權限管理系統需求。
 * 支援角色預設權限查詢、用戶權限配置、權限繼承計算（角色預設 + 用戶覆蓋）。
 *
 * @module api/routers/permission
 *
 * @features
 * - 獲取所有權限定義列表
 * - 獲取當前用戶有效權限（計算角色預設 + 用戶覆蓋）
 * - 獲取指定用戶的權限配置（Admin）
 * - 設置用戶單一權限（Admin）
 * - 批量設置用戶權限（Admin）
 * - 獲取角色預設權限列表（Admin）
 *
 * @procedures
 * - getAllPermissions: 獲取所有權限定義
 * - getMyPermissions: 獲取當前用戶有效權限
 * - getUserPermissions: 獲取指定用戶的權限（Admin）
 * - setUserPermission: 設置單一用戶權限（Admin）
 * - setUserPermissions: 批量設置用戶權限（Admin）
 * - getRolePermissions: 獲取角色預設權限（Admin）
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - Permission, RolePermission, UserPermission 資料模型
 * - apps/web/src/hooks/usePermissions.ts - 前端權限 Hook
 * - apps/web/src/components/layout/Sidebar.tsx - Sidebar 權限過濾
 *
 * @author IT Department
 * @since FEAT-011 - Permission Management
 * @lastModified 2025-12-14
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, adminProcedure } from '../trpc';

/**
 * 權限類別枚舉
 */
export const PermissionCategoryEnum = z.enum(['menu', 'project', 'proposal', 'expense', 'system']);

/**
 * Permission Router
 */
export const permissionRouter = createTRPCRouter({
  /**
   * 獲取所有權限定義
   * 用於權限配置 UI 顯示所有可選權限
   */
  getAllPermissions: protectedProcedure
    .input(
      z
        .object({
          category: PermissionCategoryEnum.optional(), // 按類別過濾
          isActive: z.boolean().optional(), // 按啟用狀態過濾
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const where = {
        ...(input?.category && { category: input.category }),
        ...(input?.isActive !== undefined && { isActive: input.isActive }),
      };

      const permissions = await ctx.prisma.permission.findMany({
        where,
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      });

      return permissions;
    }),

  /**
   * 獲取當前用戶的有效權限
   * 計算邏輯：角色預設權限 + 用戶覆蓋（granted=true 新增, granted=false 移除）
   */
  getMyPermissions: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const roleId = ctx.session.user.role.id;

    // 1. 獲取角色預設權限
    const rolePermissions = await ctx.prisma.rolePermission.findMany({
      where: { roleId },
      include: { permission: true },
    });

    // 2. 獲取用戶自訂權限
    const userPermissions = await ctx.prisma.userPermission.findMany({
      where: { userId },
      include: { permission: true },
    });

    // 3. 合併計算有效權限
    // 先收集角色預設權限
    const effectivePermissions = new Map<string, { code: string; name: string; category: string }>();

    for (const rp of rolePermissions) {
      if (rp.permission.isActive) {
        effectivePermissions.set(rp.permission.code, {
          code: rp.permission.code,
          name: rp.permission.name,
          category: rp.permission.category,
        });
      }
    }

    // 應用用戶覆蓋
    for (const up of userPermissions) {
      if (up.permission.isActive) {
        if (up.granted) {
          // 新增權限
          effectivePermissions.set(up.permission.code, {
            code: up.permission.code,
            name: up.permission.name,
            category: up.permission.category,
          });
        } else {
          // 撤銷權限
          effectivePermissions.delete(up.permission.code);
        }
      }
    }

    // 返回權限代碼列表
    return {
      permissions: Array.from(effectivePermissions.values()),
      permissionCodes: Array.from(effectivePermissions.keys()),
    };
  }),

  /**
   * 獲取指定用戶的權限配置
   * 返回角色預設權限和用戶自訂權限的完整資訊
   */
  getUserPermissions: adminProcedure
    .input(z.object({ userId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      // 獲取用戶資訊
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { role: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用戶不存在',
        });
      }

      // 獲取所有啟用的權限
      const allPermissions = await ctx.prisma.permission.findMany({
        where: { isActive: true },
        orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }],
      });

      // 獲取角色預設權限
      const rolePermissions = await ctx.prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        select: { permissionId: true },
      });
      const rolePermissionIds = new Set(rolePermissions.map((rp) => rp.permissionId));

      // 獲取用戶自訂權限
      const userPermissions = await ctx.prisma.userPermission.findMany({
        where: { userId: input.userId },
        select: { permissionId: true, granted: true },
      });
      const userPermissionMap = new Map(userPermissions.map((up) => [up.permissionId, up.granted]));

      // 組合權限狀態
      const permissionsWithStatus = allPermissions.map((p) => {
        const isRoleDefault = rolePermissionIds.has(p.id);
        const userOverride = userPermissionMap.get(p.id);

        // 計算有效狀態
        let isGranted = isRoleDefault; // 預設為角色權限
        if (userOverride !== undefined) {
          isGranted = userOverride; // 用戶覆蓋
        }

        return {
          ...p,
          isRoleDefault,
          userOverride: userOverride ?? null,
          isGranted,
        };
      });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
        permissions: permissionsWithStatus,
      };
    }),

  /**
   * 設置單一用戶權限
   */
  setUserPermission: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        permissionId: z.string().min(1),
        granted: z.boolean(), // true=授予, false=撤銷
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminUserId = ctx.session.user.id;

      // 驗證用戶存在
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用戶不存在',
        });
      }

      // 驗證權限存在
      const permission = await ctx.prisma.permission.findUnique({
        where: { id: input.permissionId },
      });

      if (!permission) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '權限不存在',
        });
      }

      // 檢查是否需要刪除記錄（恢復角色預設）
      // 獲取角色預設狀態
      const rolePermission = await ctx.prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId: user.roleId,
            permissionId: input.permissionId,
          },
        },
      });

      const isRoleDefault = !!rolePermission;

      // 如果用戶設定等於角色預設，刪除用戶覆蓋記錄
      if (input.granted === isRoleDefault) {
        await ctx.prisma.userPermission.deleteMany({
          where: {
            userId: input.userId,
            permissionId: input.permissionId,
          },
        });
      } else {
        // 否則創建或更新用戶覆蓋記錄
        await ctx.prisma.userPermission.upsert({
          where: {
            userId_permissionId: {
              userId: input.userId,
              permissionId: input.permissionId,
            },
          },
          update: {
            granted: input.granted,
            createdBy: adminUserId,
          },
          create: {
            userId: input.userId,
            permissionId: input.permissionId,
            granted: input.granted,
            createdBy: adminUserId,
          },
        });
      }

      return { success: true };
    }),

  /**
   * 批量設置用戶權限
   * 用於權限配置 UI 的一次性保存
   */
  setUserPermissions: adminProcedure
    .input(
      z.object({
        userId: z.string().min(1),
        permissions: z.array(
          z.object({
            permissionId: z.string().min(1),
            granted: z.boolean(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const adminUserId = ctx.session.user.id;

      // 驗證用戶存在
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: { role: true },
      });

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '用戶不存在',
        });
      }

      // 獲取角色預設權限
      const rolePermissions = await ctx.prisma.rolePermission.findMany({
        where: { roleId: user.roleId },
        select: { permissionId: true },
      });
      const rolePermissionIds = new Set(rolePermissions.map((rp) => rp.permissionId));

      // 使用事務處理批量更新
      await ctx.prisma.$transaction(async (tx) => {
        // 先刪除該用戶的所有自訂權限
        await tx.userPermission.deleteMany({
          where: { userId: input.userId },
        });

        // 創建需要覆蓋的權限記錄
        const permissionsToCreate = input.permissions
          .filter((p) => {
            const isRoleDefault = rolePermissionIds.has(p.permissionId);
            // 只有當用戶設定與角色預設不同時才需要記錄
            return p.granted !== isRoleDefault;
          })
          .map((p) => ({
            userId: input.userId,
            permissionId: p.permissionId,
            granted: p.granted,
            createdBy: adminUserId,
          }));

        if (permissionsToCreate.length > 0) {
          await tx.userPermission.createMany({
            data: permissionsToCreate,
          });
        }
      });

      return { success: true, updatedCount: input.permissions.length };
    }),

  /**
   * 獲取角色預設權限
   */
  getRolePermissions: adminProcedure
    .input(z.object({ roleId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      // 如果指定了角色 ID，只返回該角色的權限
      if (input.roleId !== undefined) {
        const rolePermissions = await ctx.prisma.rolePermission.findMany({
          where: { roleId: input.roleId },
          include: {
            permission: true,
            role: true,
          },
        });

        return {
          roleId: input.roleId,
          permissions: rolePermissions.map((rp) => ({
            ...rp.permission,
            role: rp.role,
          })),
        };
      }

      // 否則返回所有角色的權限配置
      const roles = await ctx.prisma.role.findMany({
        include: {
          defaultPermissions: {
            include: { permission: true },
          },
        },
      });

      return roles.map((role) => ({
        roleId: role.id,
        roleName: role.name,
        permissions: role.defaultPermissions.map((rp) => rp.permission),
      }));
    }),

  /**
   * 檢查當前用戶是否有指定權限
   * 用於前端權限檢查
   */
  hasPermission: protectedProcedure
    .input(z.object({ code: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;
      const roleId = ctx.session.user.role.id;

      // 檢查權限是否存在且啟用
      const permission = await ctx.prisma.permission.findUnique({
        where: { code: input.code },
      });

      if (!permission || !permission.isActive) {
        return { hasPermission: false };
      }

      // 檢查角色預設權限
      const rolePermission = await ctx.prisma.rolePermission.findUnique({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId: permission.id,
          },
        },
      });

      // 檢查用戶覆蓋
      const userPermission = await ctx.prisma.userPermission.findUnique({
        where: {
          userId_permissionId: {
            userId,
            permissionId: permission.id,
          },
        },
      });

      // 計算有效權限
      let hasPermission = !!rolePermission; // 預設為角色權限
      if (userPermission) {
        hasPermission = userPermission.granted; // 用戶覆蓋
      }

      return { hasPermission };
    }),
});
