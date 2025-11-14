/**
 * @fileoverview User Router - 用戶管理 API
 *
 * @description
 * 提供用戶的完整 CRUD 操作和角色管理功能。
 * 用戶是系統認證和授權的核心，支援三種角色：ProjectManager、Supervisor、Admin。
 * 包含用戶與專案的關聯查詢，以及角色篩選功能用於下拉選單和權限控制。
 * 刪除用戶前會檢查關聯的專案，防止誤刪有管理責任的用戶。
 *
 * @module api/routers/user
 *
 * @features
 * - 建立用戶並指定角色（驗證 Email 唯一性）
 * - 更新用戶資訊（姓名、Email、角色）
 * - 查詢所有用戶列表（包含角色資訊）
 * - 查詢單一用戶詳情（包含管理的專案和批准的專案）
 * - 根據角色查詢用戶（ProjectManager、Supervisor、Admin）
 * - 獲取所有專案經理列表（用於專案指派）
 * - 獲取所有主管列表（用於專案監督）
 * - 刪除用戶（檢查專案關聯保護）
 * - 獲取所有角色列表（用於下拉選單）
 *
 * @procedures
 * - create: 建立新用戶（驗證 Email 和角色）
 * - update: 更新用戶資訊（支援部分更新）
 * - delete: 刪除用戶（檢查專案關聯）
 * - getAll: 查詢所有用戶列表（包含角色）
 * - getById: 查詢單一用戶詳情（包含專案關聯）
 * - getByRole: 根據角色名稱查詢用戶
 * - getManagers: 獲取所有專案經理
 * - getSupervisors: 獲取所有主管
 * - getRoles: 獲取所有角色列表
 *
 * @dependencies
 * - Prisma Client: 資料庫操作
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - User 和 Role 資料模型
 * - packages/auth/src/index.ts - NextAuth.js 認證配置
 * - packages/api/src/trpc.ts - 認證中介軟體
 * - apps/web/src/app/[locale]/users/page.tsx - 用戶列表頁面
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

/**
 * User 輸入驗證 Schema
 */
const userCreateInputSchema = z.object({
  email: z.string().email('請輸入有效的電子郵件地址'),
  name: z.string().min(1, '姓名為必填欄位').optional(),
  roleId: z.number().int().positive('角色ID必須為正整數'),
});

const userUpdateInputSchema = z.object({
  id: z.string().uuid('無效的使用者ID'),
  email: z.string().email('請輸入有效的電子郵件地址').optional(),
  name: z.string().min(1, '姓名不能為空').optional(),
  roleId: z.number().int().positive('角色ID必須為正整數').optional(),
});

/**
 * User Router
 */
export const userRouter = createTRPCRouter({
  /**
   * 取得所有使用者
   */
  getAll: publicProcedure.query(async ({ ctx }) => {
    const users = await ctx.prisma.user.findMany({
      include: {
        role: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return users;
  }),

  /**
   * 根據 ID 取得使用者
   */
  getById: publicProcedure
    .input(
      z.object({
        id: z.string().uuid('無效的使用者ID'),
      })
    )
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: input.id,
        },
        include: {
          role: true,
          projects: {
            include: {
              budgetPool: true,
            },
          },
          approvals: {
            include: {
              budgetPool: true,
            },
          },
        },
      });

      if (!user) {
        throw new Error('找不到該使用者');
      }

      return user;
    }),

  /**
   * 根據角色名稱取得使用者
   * 用於下拉選單（例如：選擇專案管理者或監督者）
   */
  getByRole: publicProcedure
    .input(
      z.object({
        roleName: z.enum(['ProjectManager', 'Supervisor', 'Admin']),
      })
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.prisma.user.findMany({
        where: {
          role: {
            name: input.roleName,
          },
        },
        include: {
          role: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      return users;
    }),

  /**
   * 取得所有管理者（ProjectManager）
   */
  getManagers: publicProcedure.query(async ({ ctx }) => {
    const managers = await ctx.prisma.user.findMany({
      where: {
        role: {
          name: 'ProjectManager',
        },
      },
      include: {
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return managers;
  }),

  /**
   * 取得所有監督者（Supervisor）
   */
  getSupervisors: publicProcedure.query(async ({ ctx }) => {
    const supervisors = await ctx.prisma.user.findMany({
      where: {
        role: {
          name: 'Supervisor',
        },
      },
      include: {
        role: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return supervisors;
  }),

  /**
   * 建立使用者
   */
  create: publicProcedure
    .input(userCreateInputSchema)
    .mutation(async ({ ctx, input }) => {
      // 檢查 email 是否已存在
      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          email: input.email,
        },
      });

      if (existingUser) {
        throw new Error('此電子郵件已被使用');
      }

      // 驗證 roleId 是否存在
      const role = await ctx.prisma.role.findUnique({
        where: {
          id: input.roleId,
        },
      });

      if (!role) {
        throw new Error('無效的角色ID');
      }

      const user = await ctx.prisma.user.create({
        data: {
          email: input.email,
          name: input.name,
          roleId: input.roleId,
        },
        include: {
          role: true,
        },
      });

      return user;
    }),

  /**
   * 更新使用者
   */
  update: publicProcedure
    .input(userUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 如果更新 email，檢查是否與其他使用者重複
      if (updateData.email) {
        const existingUser = await ctx.prisma.user.findFirst({
          where: {
            email: updateData.email,
            NOT: {
              id: id,
            },
          },
        });

        if (existingUser) {
          throw new Error('此電子郵件已被其他使用者使用');
        }
      }

      // 如果更新 roleId，驗證是否存在
      if (updateData.roleId) {
        const role = await ctx.prisma.role.findUnique({
          where: {
            id: updateData.roleId,
          },
        });

        if (!role) {
          throw new Error('無效的角色ID');
        }
      }

      const user = await ctx.prisma.user.update({
        where: {
          id: id,
        },
        data: updateData,
        include: {
          role: true,
        },
      });

      return user;
    }),

  /**
   * 刪除使用者
   */
  delete: publicProcedure
    .input(
      z.object({
        id: z.string().uuid('無效的使用者ID'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 檢查使用者是否有關聯的專案（作為管理者或監督者）
      const userWithProjects = await ctx.prisma.user.findUnique({
        where: {
          id: input.id,
        },
        include: {
          projects: true,
          approvals: true,
        },
      });

      if (!userWithProjects) {
        throw new Error('找不到該使用者');
      }

      if (userWithProjects.projects.length > 0 || userWithProjects.approvals.length > 0) {
        throw new Error('無法刪除：此使用者有關聯的專案');
      }

      await ctx.prisma.user.delete({
        where: {
          id: input.id,
        },
      });

      return { success: true };
    }),

  /**
   * 取得所有角色
   */
  getRoles: publicProcedure.query(async ({ ctx }) => {
    const roles = await ctx.prisma.role.findMany({
      orderBy: {
        id: 'asc',
      },
    });

    return roles;
  }),
});
