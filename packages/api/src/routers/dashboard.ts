/**
 * Dashboard Router
 *
 * Epic 7 - Dashboard and Basic Reporting
 *
 * 提供專案經理和主管儀表板的數據端點
 *
 * Story 7.1: 專案經理儀表板
 * Story 7.2: 主管儀表板
 * Story 7.4: 預算池概覽
 * Story 7.3: 數據導出
 */

import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

/**
 * Story 7.1: 專案經理儀表板
 *
 * 功能:
 * - 顯示我負責的專案列表
 * - 顯示待處理的任務（需補充資訊的提案、草稿費用）
 * - 提供統計數據
 */
export const dashboardRouter = createTRPCRouter({
  /**
   * 獲取專案經理儀表板數據
   */
  getProjectManagerDashboard: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id;

    // 1. 查詢我負責的專案
    const myProjects = await ctx.prisma.project.findMany({
      where: { managerId: userId },
      include: {
        budgetPool: {
          select: {
            id: true,
            financialYear: true,
            totalAmount: true,
            usedAmount: true,
          },
        },
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
        proposals: {
          where: {
            status: {
              in: ['PendingApproval', 'MoreInfoRequired', 'Approved'],
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 1, // 只取最新一筆
        },
        purchaseOrders: {
          include: {
            vendor: {
              select: {
                id: true,
                name: true,
              },
            },
            expenses: {
              where: {
                status: {
                  in: ['PendingApproval', 'Approved'],
                },
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2. 查詢待處理的任務

    // 2.1 需要補充資訊的提案
    const proposalsNeedingInfo = await ctx.prisma.budgetProposal.findMany({
      where: {
        project: { managerId: userId },
        status: 'MoreInfoRequired',
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // 2.2 草稿狀態的費用（需要提交審批）
    const draftExpenses = await ctx.prisma.expense.findMany({
      where: {
        purchaseOrder: {
          project: { managerId: userId },
        },
        status: 'Draft',
      },
      include: {
        purchaseOrder: {
          select: {
            id: true,
            poNumber: true,
            project: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10, // 限制數量
    });

    // 3. 計算統計數據
    const stats = {
      // 總專案數
      totalProjects: myProjects.length,

      // 進行中的專案
      activeProjects: myProjects.filter((p) => p.status === 'InProgress').length,

      // 已完成的專案
      completedProjects: myProjects.filter((p) => p.status === 'Completed')
        .length,

      // 待審批的提案數量
      pendingApprovals: myProjects.reduce((sum, p) => {
        const pendingCount = p.proposals.filter(
          (prop) => prop.status === 'PendingApproval'
        ).length;
        return sum + pendingCount;
      }, 0),

      // 待處理的任務總數
      pendingTasks: proposalsNeedingInfo.length + draftExpenses.length,

      // 總預算額度（所有專案的預算池總和，去重）
      totalBudget: Array.from(
        new Set(myProjects.map((p) => p.budgetPool.id))
      ).reduce((sum, poolId) => {
        const pool = myProjects.find((p) => p.budgetPool.id === poolId)
          ?.budgetPool;
        return sum + (pool?.totalAmount || 0);
      }, 0),

      // 已使用預算
      usedBudget: Array.from(
        new Set(myProjects.map((p) => p.budgetPool.id))
      ).reduce((sum, poolId) => {
        const pool = myProjects.find((p) => p.budgetPool.id === poolId)
          ?.budgetPool;
        return sum + (pool?.usedAmount || 0);
      }, 0),
    };

    return {
      myProjects,
      pendingTasks: {
        proposalsNeedingInfo,
        draftExpenses,
      },
      stats,
    };
  }),

  /**
   * Story 7.2 & 7.4: 主管儀表板
   *
   * 功能:
   * - 顯示所有專案總覽
   * - 支援篩選（狀態、專案經理）
   * - 分頁
   * - 預算池概覽
   */
  getSupervisorDashboard: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(['Draft', 'InProgress', 'Completed', 'Archived'])
          .optional()
          .nullable(),
        managerId: z.string().uuid().optional().nullable(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      // 權限檢查：僅主管可訪問
      if (ctx.session.user.role !== 'Supervisor') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: '僅部門主管可訪問此儀表板',
        });
      }

      const { status, managerId, page, limit } = input;

      // 構建查詢條件
      const where: any = {};

      if (status) {
        where.status = status;
      }

      if (managerId) {
        where.managerId = managerId;
      }

      // 查詢專案列表（分頁）
      const [projects, total] = await Promise.all([
        ctx.prisma.project.findMany({
          where,
          include: {
            budgetPool: {
              select: {
                id: true,
                financialYear: true,
                totalAmount: true,
                usedAmount: true,
              },
            },
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
            proposals: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            purchaseOrders: {
              include: {
                expenses: {
                  where: {
                    status: {
                      in: ['Approved', 'Paid'],
                    },
                  },
                },
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        ctx.prisma.project.count({ where }),
      ]);

      // 計算統計數據
      const [
        totalProjects,
        activeProjects,
        completedProjects,
        pendingApprovals,
      ] = await Promise.all([
        ctx.prisma.project.count(),
        ctx.prisma.project.count({ where: { status: 'InProgress' } }),
        ctx.prisma.project.count({ where: { status: 'Completed' } }),
        ctx.prisma.budgetProposal.count({
          where: { status: 'PendingApproval' },
        }),
      ]);

      const stats = {
        totalProjects,
        activeProjects,
        completedProjects,
        archivedProjects: await ctx.prisma.project.count({
          where: { status: 'Archived' },
        }),
        pendingApprovals,
      };

      // Story 7.4: 預算池概覽
      const budgetPools = await ctx.prisma.budgetPool.findMany({
        include: {
          projects: {
            select: {
              id: true,
              status: true,
            },
          },
        },
        orderBy: { financialYear: 'desc' },
      });

      // 計算預算池統計
      const budgetPoolOverview = budgetPools.map((pool) => {
        const totalUsed = pool.usedAmount;
        const remaining = pool.totalAmount - totalUsed;
        const usagePercentage =
          pool.totalAmount > 0 ? (totalUsed / pool.totalAmount) * 100 : 0;

        return {
          id: pool.id,
          fiscalYear: pool.financialYear,
          totalAmount: pool.totalAmount,
          usedAmount: totalUsed,
          remainingAmount: remaining,
          usagePercentage,
          projectCount: pool.projects.length,
          activeProjectCount: pool.projects.filter(
            (p) => p.status === 'InProgress'
          ).length,
        };
      });

      return {
        projects,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        stats,
        budgetPoolOverview,
      };
    }),

  /**
   * Story 7.3: 導出專案數據
   *
   * 返回 CSV 友好的數據格式
   */
  exportProjects: protectedProcedure
    .input(
      z.object({
        role: z.enum(['ProjectManager', 'Supervisor']),
        status: z.string().optional().nullable(),
        managerId: z.string().uuid().optional().nullable(),
      })
    )
    .query(async ({ ctx, input }) => {
      let projects;

      if (input.role === 'ProjectManager') {
        // 專案經理只能導出自己的專案
        projects = await ctx.prisma.project.findMany({
          where: { managerId: ctx.session.user.id },
          include: {
            budgetPool: true,
            manager: true,
            supervisor: true,
            proposals: true,
            purchaseOrders: {
              include: {
                expenses: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
      } else {
        // 主管導出所有專案（根據篩選條件）
        if (ctx.session.user.role !== 'Supervisor') {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: '無權限導出數據',
          });
        }

        const where: any = {};

        if (input.status) {
          where.status = input.status;
        }

        if (input.managerId) {
          where.managerId = input.managerId;
        }

        projects = await ctx.prisma.project.findMany({
          where,
          include: {
            budgetPool: true,
            manager: true,
            supervisor: true,
            proposals: true,
            purchaseOrders: {
              include: {
                expenses: true,
              },
            },
          },
          orderBy: { updatedAt: 'desc' },
        });
      }

      // 轉換為 CSV 友好的格式
      const csvData = projects.map((p) => {
        const latestProposal = p.proposals[p.proposals.length - 1];
        const totalExpenses = p.purchaseOrders.reduce(
          (sum, po) =>
            sum +
            po.expenses.reduce(
              (expSum, exp) =>
                exp.status === 'Approved' || exp.status === 'Paid'
                  ? expSum + exp.amount
                  : expSum,
              0
            ),
          0
        );

        return {
          專案名稱: p.name,
          專案經理: p.manager.name,
          主管: p.supervisor?.name || '',
          狀態: p.status,
          預算池年度: p.budgetPool.financialYear,
          預算池總額: p.budgetPool.totalAmount,
          採購單數量: p.purchaseOrders.length,
          已批准費用總額: totalExpenses,
          最新提案狀態: latestProposal?.status || '尚無提案',
          創建日期: new Date(p.createdAt).toLocaleDateString('zh-TW'),
          最後更新: new Date(p.updatedAt).toLocaleDateString('zh-TW'),
        };
      });

      return csvData;
    }),

  /**
   * 獲取所有專案經理列表（用於主管儀表板篩選）
   */
  getProjectManagers: protectedProcedure.query(async ({ ctx }) => {
    // 權限檢查：僅主管可訪問
    if (ctx.session.user.role !== 'Supervisor') {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: '僅部門主管可訪問',
      });
    }

    // 查詢所有有專案的專案經理
    const managers = await ctx.prisma.user.findMany({
      where: {
        role: 'ProjectManager',
        managedProjects: {
          some: {},
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        _count: {
          select: {
            managedProjects: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return managers;
  }),
});
