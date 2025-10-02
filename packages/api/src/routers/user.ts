/**
 * User tRPC Router
 *
 * 提供使用者管理的 API 端點
 * - 取得所有使用者
 * - 根據 ID 取得使用者
 * - 根據角色取得使用者（管理者/監督者）
 * - 建立使用者
 * - 更新使用者
 * - 刪除使用者
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
