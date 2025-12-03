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

  /**
   * Diagnose omExpense.getAll - 測試 OMExpense 查詢
   * 用於診斷為什麼 omExpense.getAll 返回 500 錯誤
   */
  diagOmExpense: publicProcedure.query(async ({ ctx }) => {
    const diagnostics: string[] = [];

    try {
      // Step 1: 檢查 OMExpense 表結構
      diagnostics.push('Step 1: Checking OMExpense table columns...');
      const columns = await ctx.prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'OMExpense'
        ORDER BY ordinal_position
      `;
      diagnostics.push(`OMExpense has ${columns.length} columns: ${columns.map((c) => c.column_name).join(', ')}`);

      // Step 2: 檢查 OperatingCompany 表結構
      diagnostics.push('Step 2: Checking OperatingCompany table columns...');
      const opCoColumns = await ctx.prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = 'OperatingCompany'
        ORDER BY ordinal_position
      `;
      diagnostics.push(`OperatingCompany has ${opCoColumns.length} columns: ${opCoColumns.map((c) => c.column_name).join(', ')}`);

      // Step 3: 嘗試簡單查詢 OMExpense
      diagnostics.push('Step 3: Testing simple OMExpense query...');
      const simpleQuery = await ctx.prisma.$queryRaw<{ id: string; name: string }[]>`
        SELECT id, name FROM "OMExpense" LIMIT 1
      `;
      diagnostics.push(`Simple query returned ${simpleQuery.length} rows`);

      // Step 4: 嘗試通過 Prisma Client 查詢 (不含 include)
      diagnostics.push('Step 4: Testing Prisma findMany without includes...');
      try {
        const prismaSimple = await ctx.prisma.oMExpense.findMany({
          take: 1,
          select: { id: true, name: true },
        });
        diagnostics.push(`Prisma simple query returned ${prismaSimple.length} rows`);
      } catch (error) {
        diagnostics.push(`Prisma simple query FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 5: 嘗試通過 Prisma Client 查詢 (含 opCo include)
      diagnostics.push('Step 5: Testing Prisma findMany with opCo include...');
      try {
        const prismaWithOpCo = await ctx.prisma.oMExpense.findMany({
          take: 1,
          include: { opCo: true },
        });
        diagnostics.push(`Prisma with opCo returned ${prismaWithOpCo.length} rows`);
      } catch (error) {
        diagnostics.push(`Prisma with opCo FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 6: 嘗試完整查詢 (與 getAll 相同)
      diagnostics.push('Step 6: Testing full query like getAll...');
      try {
        const fullQuery = await ctx.prisma.oMExpense.findMany({
          take: 1,
          include: {
            opCo: true,
            vendor: true,
            _count: {
              select: { monthlyRecords: true },
            },
          },
        });
        diagnostics.push(`Full query returned ${fullQuery.length} rows`);
      } catch (error) {
        diagnostics.push(`Full query FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: true,
        diagnostics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Diagnose OperatingCompany - 測試 OperatingCompany 查詢
   * 確認 OperatingCompany 表和數據是否正確
   */
  diagOpCo: publicProcedure.query(async ({ ctx }) => {
    const diagnostics: string[] = [];

    try {
      // Step 1: 檢查 OperatingCompany 是否有數據
      diagnostics.push('Step 1: Checking OperatingCompany data...');
      const opCoCount = await ctx.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM "OperatingCompany"
      `;
      diagnostics.push(`OperatingCompany has ${opCoCount[0]?.count || 0} rows`);

      // Step 2: 如果沒有數據，插入預設數據
      if (Number(opCoCount[0]?.count || 0) === 0) {
        diagnostics.push('Step 2: No OperatingCompany data found, inserting defaults...');
        await ctx.prisma.$executeRaw`
          INSERT INTO "OperatingCompany" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
          VALUES
            (gen_random_uuid()::text, 'HK', 'Hong Kong', 'Hong Kong Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid()::text, 'SG', 'Singapore', 'Singapore Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
            (gen_random_uuid()::text, 'TW', 'Taiwan', 'Taiwan Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (code) DO NOTHING
        `;
        diagnostics.push('Inserted default OperatingCompany data');
      }

      // Step 3: 嘗試通過 Prisma 查詢
      diagnostics.push('Step 3: Testing Prisma operatingCompany.findMany...');
      try {
        const opCoList = await ctx.prisma.operatingCompany.findMany({
          take: 10,
        });
        diagnostics.push(`Prisma returned ${opCoList.length} OperatingCompany rows`);
        for (const opCo of opCoList) {
          diagnostics.push(`  - ${opCo.code}: ${opCo.name}`);
        }
      } catch (error) {
        diagnostics.push(`Prisma query FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      return {
        success: true,
        diagnostics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnostics,
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Fix OMExpense schema mismatch - add missing columns
   * 修復 OMExpense 表缺失的欄位（categoryId, sourceExpenseId）
   */
  fixOmExpenseSchema: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      // Step 1: Check current columns
      results.push('Step 1: Checking current OMExpense columns...');
      const columns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'OMExpense'
      `;
      const columnNames = columns.map((c) => c.column_name);
      results.push(`Current columns: ${columnNames.join(', ')}`);

      // Step 2: Add categoryId if not exists
      if (!columnNames.includes('categoryId')) {
        results.push('Step 2: Adding categoryId column...');
        await ctx.prisma.$executeRaw`
          ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "categoryId" TEXT
        `;
        results.push('Added categoryId column');
      } else {
        results.push('Step 2: categoryId column already exists');
      }

      // Step 3: Add sourceExpenseId if not exists
      if (!columnNames.includes('sourceExpenseId')) {
        results.push('Step 3: Adding sourceExpenseId column...');
        await ctx.prisma.$executeRaw`
          ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "sourceExpenseId" TEXT
        `;
        results.push('Added sourceExpenseId column');
      } else {
        results.push('Step 3: sourceExpenseId column already exists');
      }

      // Step 4: Create indexes for the new columns
      results.push('Step 4: Creating indexes...');
      await ctx.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "OMExpense_categoryId_idx" ON "OMExpense"("categoryId")
      `;
      await ctx.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "OMExpense_sourceExpenseId_idx" ON "OMExpense"("sourceExpenseId")
      `;
      results.push('Created indexes for categoryId and sourceExpenseId');

      // Step 5: Verify the fix
      results.push('Step 5: Verifying fix...');
      const verifyColumns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'OMExpense'
        ORDER BY ordinal_position
      `;
      results.push(`Final columns: ${verifyColumns.map((c) => c.column_name).join(', ')}`);

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
   * Create all missing Post-MVP tables with full schema
   * 創建所有缺失的 Post-MVP 表格（完整 schema）
   */
  fixAllTables: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      // 1. OperatingCompany
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "OperatingCompany" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OperatingCompany_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OperatingCompany_code_key') THEN
            ALTER TABLE "OperatingCompany" ADD CONSTRAINT "OperatingCompany_code_key" UNIQUE ("code");
          END IF;
        END $$
      `;
      results.push('Created OperatingCompany table');

      // 2. BudgetCategory
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "BudgetCategory" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "BudgetCategory_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BudgetCategory_code_key') THEN
            ALTER TABLE "BudgetCategory" ADD CONSTRAINT "BudgetCategory_code_key" UNIQUE ("code");
          END IF;
        END $$
      `;
      results.push('Created BudgetCategory table');

      // 3. OMExpense (depends on OperatingCompany, Vendor, Expense)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "OMExpense" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "name" TEXT NOT NULL,
          "description" TEXT,
          "financialYear" INTEGER NOT NULL,
          "category" TEXT NOT NULL,
          "categoryId" TEXT,
          "opCoId" TEXT NOT NULL,
          "budgetAmount" DOUBLE PRECISION NOT NULL,
          "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "yoyGrowthRate" DOUBLE PRECISION,
          "vendorId" TEXT,
          "sourceExpenseId" TEXT,
          "startDate" TIMESTAMP(3) NOT NULL,
          "endDate" TIMESTAMP(3) NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OMExpense_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created OMExpense table');

      // 4. OMExpenseMonthly (depends on OMExpense, OperatingCompany)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "OMExpenseMonthly" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "omExpenseId" TEXT NOT NULL,
          "month" INTEGER NOT NULL,
          "actualAmount" DOUBLE PRECISION NOT NULL,
          "opCoId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "OMExpenseMonthly_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseId_month_key') THEN
            ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseId_month_key" UNIQUE ("omExpenseId", "month");
          END IF;
        END $$
      `;
      results.push('Created OMExpenseMonthly table');

      // 5. ChargeOut (depends on OperatingCompany)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ChargeOut" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "fiscalYear" INTEGER NOT NULL,
          "fiscalMonth" INTEGER NOT NULL,
          "opCoId" TEXT NOT NULL,
          "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
          "status" TEXT NOT NULL DEFAULT 'Draft',
          "description" TEXT,
          "chargeOutDate" TIMESTAMP(3),
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChargeOut_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created ChargeOut table');

      // 6. ChargeOutItem (depends on ChargeOut, Expense)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ChargeOutItem" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "chargeOutId" TEXT NOT NULL,
          "expenseId" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "description" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ChargeOutItem_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created ChargeOutItem table');

      // 7. PurchaseOrderItem (depends on PurchaseOrder)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "PurchaseOrderItem" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "purchaseOrderId" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "quantity" INTEGER NOT NULL DEFAULT 1,
          "unitPrice" DOUBLE PRECISION NOT NULL,
          "totalPrice" DOUBLE PRECISION NOT NULL,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "PurchaseOrderItem_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created PurchaseOrderItem table');

      // 8. ExpenseItem (depends on Expense, OperatingCompany)
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "ExpenseItem" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "expenseId" TEXT NOT NULL,
          "description" TEXT NOT NULL,
          "amount" DOUBLE PRECISION NOT NULL,
          "targetOpCoId" TEXT,
          "chargeOutPercentage" DOUBLE PRECISION,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "ExpenseItem_pkey" PRIMARY KEY ("id")
        )
      `;
      results.push('Created ExpenseItem table');

      // Insert default OperatingCompany data
      await ctx.prisma.$executeRaw`
        INSERT INTO "OperatingCompany" ("id", "code", "name", "description", "isActive", "createdAt", "updatedAt")
        VALUES
          (gen_random_uuid()::text, 'HK', 'Hong Kong', 'Hong Kong Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          (gen_random_uuid()::text, 'SG', 'Singapore', 'Singapore Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
          (gen_random_uuid()::text, 'TW', 'Taiwan', 'Taiwan Operations', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (code) DO NOTHING
      `;
      results.push('Inserted default OperatingCompany data');

      // Mark all pending migrations as complete
      await ctx.prisma.$executeRaw`
        UPDATE _prisma_migrations
        SET finished_at = NOW(), applied_steps_count = 1
        WHERE finished_at IS NULL
      `;
      results.push('Marked all pending migrations as complete');

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
});
