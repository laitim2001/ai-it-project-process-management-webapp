/**
 * @fileoverview Health Router - 健康檢查 API
 *
 * @description
 * 提供系統健康檢查端點，用於監控 API 服務和資料庫連線狀態。
 * 所有端點使用 publicProcedure，無需身份驗證，方便外部監控系統調用。
 * 適用於容器編排（Docker/Kubernetes）的 liveness 和 readiness 探針。
 *
 * @module api/routers/health
 *
 * @features
 * - 基礎 Ping 端點（驗證 API 服務運行）
 * - 資料庫連線檢查（驗證 Prisma 連線狀態）
 * - Echo 端點（用於測試請求-回應流程）
 * - 返回時間戳（用於監控系統時間同步）
 *
 * @procedures
 * - ping: 簡單的 pong 回應
 * - dbCheck: 資料庫連線健康檢查
 * - echo: 回顯測試端點
 *
 * @dependencies
 * - Prisma Client: 資料庫連線測試
 * - Zod: 輸入驗證
 * - tRPC: API 框架
 *
 * @related
 * - packages/api/src/trpc.ts - tRPC 配置和中介軟體
 * - docker-compose.yml - 容器健康檢查配置
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const healthRouter = createTRPCRouter({
  /**
   * Simple ping endpoint
   */
  ping: publicProcedure.query(() => {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }),

  /**
   * Database connection check
   */
  dbCheck: publicProcedure.query(async ({ ctx }) => {
    try {
      await ctx.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Echo endpoint for testing
   */
  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return { echo: input.message, timestamp: new Date().toISOString() };
    }),

  /**
   * Fix stuck migration - create missing ExpenseCategory table and mark migration complete
   * 修復卡住的 migration - 創建缺失的 ExpenseCategory 表並標記 migration 為完成
   */
  fixMigration: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      // Step 1: Create ExpenseCategory table if not exists
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ExpenseCategory" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ExpenseCategory_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created ExpenseCategory table (if not existed)');

      // Step 2: Add unique constraint
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseCategory_code_key') THEN
            ALTER TABLE "ExpenseCategory" ADD CONSTRAINT "ExpenseCategory_code_key" UNIQUE ("code");
          END IF;
        END $$
      `;
      results.push('Added unique constraint on code');

      // Step 3: Create indexes
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ExpenseCategory_code_idx" ON "ExpenseCategory"("code")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ExpenseCategory_isActive_idx" ON "ExpenseCategory"("isActive")`;
      results.push('Created indexes');

      // Step 4: Insert default data
      await ctx.prisma.$executeRaw`
        INSERT INTO "ExpenseCategory" ("id", "code", "name", "description", "sortOrder", "isActive", "createdAt", "updatedAt")
        SELECT gen_random_uuid()::text, code, name, description, "sortOrder", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        FROM (VALUES
          ('HW', '硬體', '硬體設備、伺服器、工作站等', 1),
          ('SW', '軟體', '軟體授權、應用程式購買', 2),
          ('SV', '服務', '顧問服務、技術支援、實施服務', 3),
          ('MAINT', '維護', '設備維護、系統維護、保固延長', 4),
          ('LICENSE', '授權', '軟體授權續約、訂閱費用', 5),
          ('CLOUD', '雲端', '雲端服務、IaaS/PaaS/SaaS 費用', 6),
          ('TELECOM', '電信', '網路費用、電話費、通訊服務', 7),
          ('OTHER', '其他', '其他未分類費用', 99)
        ) AS v(code, name, description, "sortOrder")
        WHERE NOT EXISTS (SELECT 1 FROM "ExpenseCategory" WHERE "ExpenseCategory"."code" = v.code)
      `;
      results.push('Inserted default expense categories');

      // Step 5: Mark the stuck migration as complete
      await ctx.prisma.$executeRaw`
        UPDATE _prisma_migrations
        SET finished_at = NOW(), applied_steps_count = 1
        WHERE migration_name = '20251202110000_add_postmvp_tables'
        AND finished_at IS NULL
      `;
      results.push('Marked migration 20251202110000_add_postmvp_tables as complete');

      return {
        success: true,
        results,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        results,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Schema check - verify Post-MVP tables exist
   * 驗證 Post-MVP 表格是否存在（用於調試 migration 問題）
   */
  schemaCheck: publicProcedure.query(async ({ ctx }) => {
    const tables = [
      'ExpenseCategory',
      'OperatingCompany',
      'BudgetCategory',
      'OMExpense',
      'OMExpenseMonthly',
      'ChargeOut',
      'ChargeOutItem',
      'PurchaseOrderItem',
      'ExpenseItem',
    ];

    const results: Record<string, { exists: boolean; count?: number; error?: string }> = {};

    for (const table of tables) {
      try {
        const count = await ctx.prisma.$queryRawUnsafe<{ count: bigint }[]>(
          `SELECT COUNT(*) as count FROM "${table}"`
        );
        results[table] = { exists: true, count: Number(count[0]?.count || 0) };
      } catch (error) {
        results[table] = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    // 檢查 _prisma_migrations 表的最後幾條記錄
    let migrations: { migration_name: string; finished_at: Date | null }[] = [];
    try {
      migrations = await ctx.prisma.$queryRaw<{ migration_name: string; finished_at: Date | null }[]>`
        SELECT migration_name, finished_at
        FROM _prisma_migrations
        ORDER BY finished_at DESC
        LIMIT 10
      `;
    } catch (error) {
      // Migration table may not exist
    }

    const allExist = Object.values(results).every((r) => r.exists);

    return {
      status: allExist ? 'complete' : 'incomplete',
      tables: results,
      migrations: migrations.map((m) => ({
        name: m.migration_name,
        finishedAt: m.finished_at?.toISOString() || null,
      })),
      timestamp: new Date().toISOString(),
    };
  }),
});
