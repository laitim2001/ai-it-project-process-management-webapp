import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, supervisorProcedure } from '../trpc';

/**
 * OperatingCompany Router
 * 營運公司（OpCo）管理 API
 *
 * 用途：管理不同的營運公司，支持費用轉嫁和 OM 費用管理
 */

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
              omExpenses: true,
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
              omExpenses: true,
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
   * 注意：如果有關聯的費用轉嫁或 OM 費用，禁止刪除
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
              omExpenses: true,
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

      const hasRelations =
        (opCo._count.chargeOuts ?? 0) > 0 ||
        (opCo._count.omExpenses ?? 0) > 0 ||
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
});
