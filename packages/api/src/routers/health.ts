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

  /**
   * FIX-007: 完整的 Schema 欄位比較診斷
   * 比較 schema.prisma 期望的欄位 vs Azure 資料庫實際的欄位
   */
  schemaCompare: publicProcedure.query(async ({ ctx }) => {
    // 定義 schema.prisma 中所有表格的期望欄位
    const expectedSchema: Record<string, string[]> = {
      ExpenseItem: [
        'id', 'expenseId', 'itemName', 'description', 'amount',
        'category', 'categoryId', 'chargeOutOpCoId', 'sortOrder',
        'createdAt', 'updatedAt'
      ],
      Expense: [
        'id', 'purchaseOrderId', 'name', 'description', 'totalAmount',
        'status', 'expenseDate', 'invoiceNumber', 'invoiceDate',
        'invoiceFilePath', 'budgetCategoryId', 'vendorId', 'currencyId',
        'requiresChargeOut', 'isOperationMaint', 'createdAt', 'updatedAt'
      ],
      OMExpense: [
        'id', 'name', 'description', 'financialYear', 'category',
        'categoryId', 'opCoId', 'budgetAmount', 'actualSpent',
        'yoyGrowthRate', 'vendorId', 'sourceExpenseId', 'startDate',
        'endDate', 'createdAt', 'updatedAt'
      ],
      Project: [
        'id', 'budgetPoolId', 'managerId', 'supervisorId', 'name',
        'description', 'status', 'startDate', 'endDate', 'requestedBudget',
        'approvedBudget', 'budgetCategoryId', 'globalFlag', 'priority',
        'currencyId', 'createdAt', 'updatedAt'
      ],
      PurchaseOrder: [
        'id', 'projectId', 'vendorId', 'quoteId', 'poNumber', 'name',
        'description', 'totalAmount', 'poDate', 'status', 'currencyId',
        'approvedDate', 'createdAt', 'updatedAt'
      ],
      BudgetPool: [
        'id', 'name', 'description', 'totalAmount', 'usedAmount',
        'financialYear', 'currencyId', 'isActive', 'createdAt', 'updatedAt'
      ],
    };

    const comparison: Record<string, {
      expected: string[];
      actual: string[];
      missing: string[];
      extra: string[];
    }> = {};

    try {
      for (const [tableName, expectedColumns] of Object.entries(expectedSchema)) {
        const actualColumns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
          SELECT column_name
          FROM information_schema.columns
          WHERE table_name = ${tableName}
          ORDER BY ordinal_position
        `;

        const actual = actualColumns.map(c => c.column_name);
        const missing = expectedColumns.filter(col => !actual.includes(col));
        const extra = actual.filter(col => !expectedColumns.includes(col));

        comparison[tableName] = {
          expected: expectedColumns,
          actual,
          missing,
          extra,
        };
      }

      // 計算總結
      const summary = {
        totalTables: Object.keys(expectedSchema).length,
        tablesWithMissingColumns: Object.entries(comparison)
          .filter(([, v]) => v.missing.length > 0)
          .map(([k, v]) => ({ table: k, missing: v.missing })),
        allMissingColumns: Object.entries(comparison)
          .flatMap(([table, v]) => v.missing.map(col => `${table}.${col}`)),
      };

      return {
        status: summary.allMissingColumns.length === 0 ? 'synced' : 'out_of_sync',
        summary,
        comparison,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * FIX-007: 修復 ExpenseItem 表缺失的 chargeOutOpCoId 欄位
   */
  fixExpenseItemSchema: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      // Step 1: Check current columns
      results.push('Step 1: Checking current ExpenseItem columns...');
      const columns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'ExpenseItem'
      `;
      const columnNames = columns.map((c) => c.column_name);
      results.push(`Current columns: ${columnNames.join(', ')}`);

      // Step 2: Add chargeOutOpCoId if not exists
      if (!columnNames.includes('chargeOutOpCoId')) {
        results.push('Step 2: Adding chargeOutOpCoId column...');
        await ctx.prisma.$executeRaw`
          ALTER TABLE "ExpenseItem" ADD COLUMN IF NOT EXISTS "chargeOutOpCoId" TEXT
        `;
        results.push('Added chargeOutOpCoId column');
      } else {
        results.push('Step 2: chargeOutOpCoId column already exists');
      }

      // Step 3: Add categoryId if not exists
      if (!columnNames.includes('categoryId')) {
        results.push('Step 3: Adding categoryId column...');
        await ctx.prisma.$executeRaw`
          ALTER TABLE "ExpenseItem" ADD COLUMN IF NOT EXISTS "categoryId" TEXT
        `;
        results.push('Added categoryId column');
      } else {
        results.push('Step 3: categoryId column already exists');
      }

      // Step 4: Create indexes
      results.push('Step 4: Creating indexes...');
      await ctx.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ExpenseItem_chargeOutOpCoId_idx" ON "ExpenseItem"("chargeOutOpCoId")
      `;
      await ctx.prisma.$executeRaw`
        CREATE INDEX IF NOT EXISTS "ExpenseItem_categoryId_idx" ON "ExpenseItem"("categoryId")
      `;
      results.push('Created indexes');

      // Step 5: Add foreign key constraints
      results.push('Step 5: Adding foreign key constraints...');
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_chargeOutOpCoId_fkey') THEN
            ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_chargeOutOpCoId_fkey"
            FOREIGN KEY ("chargeOutOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_categoryId_fkey') THEN
            ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('Added foreign key constraints');

      // Step 6: Verify
      results.push('Step 6: Verifying fix...');
      const verifyColumns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'ExpenseItem'
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
   * FIX-007: 一鍵修復所有 Schema 不同步問題
   * 添加所有缺失的欄位到對應的表格
   */
  fixAllSchemaIssues: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      results.push('=== 開始修復所有 Schema 不同步問題 ===');

      // 1. ExpenseItem 缺失欄位
      results.push('\n[1/4] 修復 ExpenseItem 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "ExpenseItem" ADD COLUMN IF NOT EXISTS "chargeOutOpCoId" TEXT`;
      await ctx.prisma.$executeRaw`ALTER TABLE "ExpenseItem" ADD COLUMN IF NOT EXISTS "categoryId" TEXT`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ExpenseItem_chargeOutOpCoId_idx" ON "ExpenseItem"("chargeOutOpCoId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "ExpenseItem_categoryId_idx" ON "ExpenseItem"("categoryId")`;
      results.push('ExpenseItem: 已添加 chargeOutOpCoId, categoryId');

      // 2. OMExpense 缺失欄位
      results.push('\n[2/4] 修復 OMExpense 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "categoryId" TEXT`;
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "sourceExpenseId" TEXT`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpense_categoryId_idx" ON "OMExpense"("categoryId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpense_sourceExpenseId_idx" ON "OMExpense"("sourceExpenseId")`;
      results.push('OMExpense: 已添加 categoryId, sourceExpenseId');

      // 3. Expense 缺失欄位
      results.push('\n[3/4] 修復 Expense 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "budgetCategoryId" TEXT`;
      await ctx.prisma.$executeRaw`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "vendorId" TEXT`;
      await ctx.prisma.$executeRaw`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "currencyId" TEXT`;
      await ctx.prisma.$executeRaw`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "requiresChargeOut" BOOLEAN DEFAULT false`;
      await ctx.prisma.$executeRaw`ALTER TABLE "Expense" ADD COLUMN IF NOT EXISTS "isOperationMaint" BOOLEAN DEFAULT false`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Expense_budgetCategoryId_idx" ON "Expense"("budgetCategoryId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Expense_vendorId_idx" ON "Expense"("vendorId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Expense_currencyId_idx" ON "Expense"("currencyId")`;
      results.push('Expense: 已添加 budgetCategoryId, vendorId, currencyId, requiresChargeOut, isOperationMaint');

      // 4. 添加外鍵約束（使用 DO $$ 來避免重複錯誤）
      results.push('\n[4/5] 添加外鍵約束...');
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_chargeOutOpCoId_fkey') THEN
            ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_chargeOutOpCoId_fkey"
            FOREIGN KEY ("chargeOutOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ExpenseItem_categoryId_fkey') THEN
            ALTER TABLE "ExpenseItem" ADD CONSTRAINT "ExpenseItem_categoryId_fkey"
            FOREIGN KEY ("categoryId") REFERENCES "ExpenseCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('外鍵約束: 已添加');

      // 5. FEAT-008: OMExpenseItem 缺失欄位
      results.push('\n[5/7] 修復 OMExpenseItem 表 (FEAT-008)...');
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpenseItem" ADD COLUMN IF NOT EXISTS "lastFYActualExpense" DOUBLE PRECISION`;
      results.push('OMExpenseItem: 已添加 lastFYActualExpense');

      // 6. PurchaseOrder 缺失 poDate 欄位
      results.push('\n[6/7] 修復 PurchaseOrder 表...');
      // Azure 有 date 欄位但沒有 poDate，需要重命名或添加
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          -- 如果存在 date 欄位但沒有 poDate，則重命名
          IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseOrder' AND column_name = 'date')
             AND NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseOrder' AND column_name = 'poDate') THEN
            ALTER TABLE "PurchaseOrder" RENAME COLUMN "date" TO "poDate";
          -- 如果兩個都不存在，添加 poDate
          ELSIF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'PurchaseOrder' AND column_name = 'poDate') THEN
            ALTER TABLE "PurchaseOrder" ADD COLUMN "poDate" TIMESTAMP(3);
          END IF;
        END $$
      `;
      results.push('PurchaseOrder: 已修復 poDate 欄位');

      // 7. BudgetPool 缺失 isActive 欄位
      results.push('\n[7/7] 修復 BudgetPool 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "BudgetPool" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN DEFAULT true`;
      results.push('BudgetPool: 已添加 isActive 欄位');

      results.push('\n=== Schema 修復完成 ===');

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
   * FEAT-007: 創建 OMExpenseItem 表
   * 用於 OM 費用表頭-明細架構重構
   */
  createOMExpenseItemTable: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      results.push('=== FEAT-007: 創建 OMExpenseItem 表 ===');

      // 1. 檢查表是否已存在
      const tableExists = await ctx.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'OMExpenseItem'
        )
      `;

      if (tableExists[0]?.exists) {
        results.push('OMExpenseItem 表已存在，跳過創建');
      } else {
        // 2. 創建 OMExpenseItem 表
        results.push('\n[1/5] 創建 OMExpenseItem 表...');
        await ctx.prisma.$executeRaw`
          CREATE TABLE "OMExpenseItem" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
            "omExpenseId" TEXT NOT NULL,
            "name" TEXT NOT NULL,
            "description" TEXT,
            "sortOrder" INTEGER NOT NULL DEFAULT 0,
            "budgetAmount" DOUBLE PRECISION NOT NULL,
            "actualSpent" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "currencyId" TEXT,
            "opCoId" TEXT NOT NULL,
            "startDate" TIMESTAMP(3),
            "endDate" TIMESTAMP(3) NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "OMExpenseItem_pkey" PRIMARY KEY ("id")
          )
        `;
        results.push('OMExpenseItem: 表已創建');
      }

      // 3. 創建索引
      results.push('\n[2/5] 創建索引...');
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpenseItem_omExpenseId_idx" ON "OMExpenseItem"("omExpenseId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpenseItem_opCoId_idx" ON "OMExpenseItem"("opCoId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpenseItem_currencyId_idx" ON "OMExpenseItem"("currencyId")`;
      results.push('索引: 已創建');

      // 4. 添加外鍵約束
      results.push('\n[3/5] 添加外鍵約束...');
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_omExpenseId_fkey') THEN
            ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_omExpenseId_fkey"
            FOREIGN KEY ("omExpenseId") REFERENCES "OMExpense"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_opCoId_fkey') THEN
            ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_opCoId_fkey"
            FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseItem_currencyId_fkey') THEN
            ALTER TABLE "OMExpenseItem" ADD CONSTRAINT "OMExpenseItem_currencyId_fkey"
            FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('外鍵約束: 已添加');

      // 5. 修改 OMExpenseMonthly 表支援新架構
      results.push('\n[4/5] 修改 OMExpenseMonthly 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpenseMonthly" ADD COLUMN IF NOT EXISTS "omExpenseItemId" TEXT`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpenseMonthly_omExpenseItemId_idx" ON "OMExpenseMonthly"("omExpenseItemId")`;

      // 將 omExpenseId 改為可選
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_name = 'OMExpenseMonthly'
            AND column_name = 'omExpenseId'
            AND is_nullable = 'NO'
          ) THEN
            ALTER TABLE "OMExpenseMonthly" ALTER COLUMN "omExpenseId" DROP NOT NULL;
          END IF;
        END $$
      `;

      // 添加 omExpenseItemId 外鍵
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpenseMonthly_omExpenseItemId_fkey') THEN
            ALTER TABLE "OMExpenseMonthly" ADD CONSTRAINT "OMExpenseMonthly_omExpenseItemId_fkey"
            FOREIGN KEY ("omExpenseItemId") REFERENCES "OMExpenseItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('OMExpenseMonthly: 已添加 omExpenseItemId 欄位和外鍵');

      // 6. 修改 OMExpense 表添加 hasItems 欄位
      results.push('\n[5/5] 修改 OMExpense 表...');
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "hasItems" BOOLEAN NOT NULL DEFAULT false`;
      results.push('OMExpense: 已添加 hasItems 欄位');

      results.push('\n=== FEAT-007 Schema 修復完成 ===');

      // 驗證
      const verifyTable = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'OMExpenseItem'
        ORDER BY ordinal_position
      `;
      results.push(`\n驗證 OMExpenseItem 欄位: ${verifyTable.map((c) => c.column_name).join(', ')}`);

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
   * 修復 FEAT-006 和 FEAT-007 缺失的欄位
   * - FEAT-006: Project 表的 8 個新欄位
   * - FEAT-007: OMExpense 表的 3 個新欄位
   */
  fixFeat006AndFeat007Columns: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      results.push('=== 修復 FEAT-006 & FEAT-007 缺失欄位 ===');

      // ========== FEAT-006: Project 表新增欄位 ==========
      results.push('\n[1/2] 修復 Project 表 (FEAT-006)...');

      // projectCategory - 專案類別
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectCategory" TEXT`;

      // projectType - 專案類型
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "projectType" TEXT DEFAULT 'Project'`;

      // expenseType - 費用類型
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "expenseType" TEXT DEFAULT 'Expense'`;

      // chargeBackToOpCo - 是否向 OpCo 收費
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "chargeBackToOpCo" BOOLEAN DEFAULT false`;

      // chargeOutMethod - 收費方式
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "chargeOutMethod" TEXT`;

      // probability - 成功機率
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "probability" TEXT DEFAULT 'Medium'`;

      // team - 團隊
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "team" TEXT`;

      // personInCharge - 負責人
      await ctx.prisma.$executeRaw`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "personInCharge" TEXT`;

      results.push('Project: 已添加 projectCategory, projectType, expenseType, chargeBackToOpCo, chargeOutMethod, probability, team, personInCharge');

      // ========== FEAT-007: OMExpense 表新增欄位 ==========
      results.push('\n[2/2] 修復 OMExpense 表 (FEAT-007)...');

      // totalBudgetAmount - 總預算
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "totalBudgetAmount" DOUBLE PRECISION DEFAULT 0`;

      // totalActualSpent - 總實際支出
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "totalActualSpent" DOUBLE PRECISION DEFAULT 0`;

      // defaultOpCoId - 預設 OpCo
      await ctx.prisma.$executeRaw`ALTER TABLE "OMExpense" ADD COLUMN IF NOT EXISTS "defaultOpCoId" TEXT`;

      // 添加 defaultOpCoId 索引
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "OMExpense_defaultOpCoId_idx" ON "OMExpense"("defaultOpCoId")`;

      // 添加 defaultOpCoId 外鍵約束
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'OMExpense_defaultOpCoId_fkey') THEN
            ALTER TABLE "OMExpense" ADD CONSTRAINT "OMExpense_defaultOpCoId_fkey"
            FOREIGN KEY ("defaultOpCoId") REFERENCES "OperatingCompany"("id") ON DELETE SET NULL ON UPDATE CASCADE;
          END IF;
        END $$
      `;

      results.push('OMExpense: 已添加 totalBudgetAmount, totalActualSpent, defaultOpCoId');

      // ========== FEAT-006: 創建 ProjectChargeOutOpCo 表 ==========
      results.push('\n[3/3] 創建 ProjectChargeOutOpCo 表 (FEAT-006)...');

      // 檢查表是否已存在
      const tableExists = await ctx.prisma.$queryRaw<{ exists: boolean }[]>`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'ProjectChargeOutOpCo'
        )
      `;

      if (tableExists[0]?.exists) {
        results.push('ProjectChargeOutOpCo 表已存在，跳過創建');
      } else {
        // 創建表
        await ctx.prisma.$executeRaw`
          CREATE TABLE "ProjectChargeOutOpCo" (
            "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
            "projectId" TEXT NOT NULL,
            "opCoId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "ProjectChargeOutOpCo_pkey" PRIMARY KEY ("id")
          )
        `;

        // 創建唯一約束
        await ctx.prisma.$executeRaw`
          ALTER TABLE "ProjectChargeOutOpCo"
          ADD CONSTRAINT "ProjectChargeOutOpCo_projectId_opCoId_key" UNIQUE ("projectId", "opCoId")
        `;

        // 創建索引
        await ctx.prisma.$executeRaw`CREATE INDEX "ProjectChargeOutOpCo_projectId_idx" ON "ProjectChargeOutOpCo"("projectId")`;
        await ctx.prisma.$executeRaw`CREATE INDEX "ProjectChargeOutOpCo_opCoId_idx" ON "ProjectChargeOutOpCo"("opCoId")`;

        // 創建外鍵約束
        await ctx.prisma.$executeRaw`
          ALTER TABLE "ProjectChargeOutOpCo"
          ADD CONSTRAINT "ProjectChargeOutOpCo_projectId_fkey"
          FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;

        await ctx.prisma.$executeRaw`
          ALTER TABLE "ProjectChargeOutOpCo"
          ADD CONSTRAINT "ProjectChargeOutOpCo_opCoId_fkey"
          FOREIGN KEY ("opCoId") REFERENCES "OperatingCompany"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `;

        results.push('ProjectChargeOutOpCo: 表已創建（含索引和外鍵約束）');
      }

      results.push('\n=== FEAT-006 & FEAT-007 欄位修復完成 ===');

      // 驗證 Project 欄位
      const projectCols = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'Project'
        ORDER BY ordinal_position
      `;
      results.push(`\n驗證 Project 欄位: ${projectCols.map((c) => c.column_name).join(', ')}`);

      // 驗證 OMExpense 欄位
      const omExpenseCols = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'OMExpense'
        ORDER BY ordinal_position
      `;
      results.push(`\n驗證 OMExpense 欄位: ${omExpenseCols.map((c) => c.column_name).join(', ')}`);

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
   * 診斷 project.getProjectSummary 問題
   */
  diagProjectSummary: publicProcedure.query(async ({ ctx }) => {
    const diagnostics: string[] = [];

    try {
      // Step 1: 檢查 Project 表欄位
      diagnostics.push('Step 1: Checking Project table columns...');
      const columns = await ctx.prisma.$queryRaw<{ column_name: string }[]>`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'Project'
        ORDER BY ordinal_position
      `;
      diagnostics.push(`Project has ${columns.length} columns: ${columns.map((c) => c.column_name).join(', ')}`);

      // Step 2: 簡單查詢測試
      diagnostics.push('Step 2: Testing simple Project query...');
      try {
        const simple = await ctx.prisma.project.findMany({
          take: 1,
          select: { id: true, name: true },
        });
        diagnostics.push(`Simple query returned ${simple.length} rows`);
      } catch (error) {
        diagnostics.push(`Simple query FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 3: 測試 projectCategory 排序
      diagnostics.push('Step 3: Testing orderBy projectCategory...');
      try {
        const withOrder = await ctx.prisma.project.findMany({
          take: 1,
          orderBy: { projectCategory: 'asc' },
        });
        diagnostics.push(`OrderBy projectCategory returned ${withOrder.length} rows`);
      } catch (error) {
        diagnostics.push(`OrderBy projectCategory FAILED: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 4: 測試完整查詢 (與 getProjectSummary 相同)
      diagnostics.push('Step 4: Testing full getProjectSummary query...');
      try {
        const fullQuery = await ctx.prisma.project.findMany({
          take: 1,
          where: {
            budgetPool: {
              financialYear: 2025,
            },
          },
          orderBy: [
            { projectCategory: 'asc' },
            { budgetCategory: { categoryName: 'asc' } },
            { name: 'asc' },
          ],
          include: {
            budgetPool: {
              select: {
                id: true,
                name: true,
                financialYear: true,
              },
            },
            budgetCategory: {
              select: {
                id: true,
                categoryName: true,
                categoryCode: true,
              },
            },
            currency: {
              select: {
                id: true,
                code: true,
                symbol: true,
              },
            },
            chargeOutOpCos: {
              include: {
                opCo: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                  },
                },
              },
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
   * FEAT-011: 修復 Permission 表架構
   * 創建 Permission、RolePermission、UserPermission 表並植入預設權限
   */
  fixPermissionTables: publicProcedure.mutation(async ({ ctx }) => {
    const results: string[] = [];

    try {
      results.push('=== FEAT-011: 修復 Permission 表架構 ===');

      // 1. 創建 Permission 表
      results.push('\n[1/4] 創建 Permission 表...');
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "Permission" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "code" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "category" TEXT NOT NULL,
          "description" TEXT,
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "sortOrder" INTEGER NOT NULL DEFAULT 0,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "Permission_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "Permission_code_key" ON "Permission"("code")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Permission_category_idx" ON "Permission"("category")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "Permission_isActive_idx" ON "Permission"("isActive")`;
      results.push('Permission 表: 已創建');

      // 2. 創建 RolePermission 表
      results.push('\n[2/4] 創建 RolePermission 表...');
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "RolePermission" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "roleId" INTEGER NOT NULL,
          "permissionId" TEXT NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_roleId_permissionId_key" ON "RolePermission"("roleId", "permissionId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "RolePermission_roleId_idx" ON "RolePermission"("roleId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "RolePermission_permissionId_idx" ON "RolePermission"("permissionId")`;

      // 添加外鍵
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_roleId_fkey') THEN
            ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_roleId_fkey"
            FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'RolePermission_permissionId_fkey') THEN
            ALTER TABLE "RolePermission" ADD CONSTRAINT "RolePermission_permissionId_fkey"
            FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('RolePermission 表: 已創建');

      // 3. 創建 UserPermission 表
      results.push('\n[3/4] 創建 UserPermission 表...');
      await ctx.prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "UserPermission" (
          "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
          "userId" TEXT NOT NULL,
          "permissionId" TEXT NOT NULL,
          "granted" BOOLEAN NOT NULL DEFAULT true,
          "createdBy" TEXT,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UserPermission_pkey" PRIMARY KEY ("id")
        )
      `;
      await ctx.prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "UserPermission_userId_permissionId_key" ON "UserPermission"("userId", "permissionId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserPermission_userId_idx" ON "UserPermission"("userId")`;
      await ctx.prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "UserPermission_permissionId_idx" ON "UserPermission"("permissionId")`;

      // 添加外鍵
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPermission_userId_fkey') THEN
            ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      await ctx.prisma.$executeRaw`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'UserPermission_permissionId_fkey') THEN
            ALTER TABLE "UserPermission" ADD CONSTRAINT "UserPermission_permissionId_fkey"
            FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
          END IF;
        END $$
      `;
      results.push('UserPermission 表: 已創建');

      // 4. 植入預設菜單權限
      results.push('\n[4/4] 植入預設菜單權限...');

      // 菜單權限定義
      const menuPermissions = [
        { code: 'menu:dashboard', name: '儀表板', category: 'menu', sortOrder: 1 },
        { code: 'menu:projects', name: '專案管理', category: 'menu', sortOrder: 2 },
        { code: 'menu:proposals', name: '預算提案', category: 'menu', sortOrder: 3 },
        { code: 'menu:budget-pools', name: '預算池', category: 'menu', sortOrder: 4 },
        { code: 'menu:vendors', name: '供應商', category: 'menu', sortOrder: 5 },
        { code: 'menu:quotes', name: '報價單', category: 'menu', sortOrder: 6 },
        { code: 'menu:purchase-orders', name: '採購單', category: 'menu', sortOrder: 7 },
        { code: 'menu:expenses', name: '費用記錄', category: 'menu', sortOrder: 8 },
        { code: 'menu:charge-outs', name: '費用分攤', category: 'menu', sortOrder: 9 },
        { code: 'menu:om-expenses', name: 'OM 費用', category: 'menu', sortOrder: 10 },
        { code: 'menu:om-summary', name: 'OM 摘要', category: 'menu', sortOrder: 11 },
        { code: 'menu:data-import', name: '數據導入', category: 'menu', sortOrder: 12 },
        { code: 'menu:project-data-import', name: '專案導入', category: 'menu', sortOrder: 13 },
        { code: 'menu:operating-companies', name: '營運公司', category: 'menu', sortOrder: 14 },
        { code: 'menu:users', name: '用戶管理', category: 'menu', sortOrder: 15 },
        { code: 'menu:settings', name: '系統設定', category: 'menu', sortOrder: 16 },
      ];

      // 插入權限 (如果不存在)
      for (const perm of menuPermissions) {
        await ctx.prisma.$executeRaw`
          INSERT INTO "Permission" ("id", "code", "name", "category", "sortOrder", "isActive", "createdAt", "updatedAt")
          VALUES (gen_random_uuid()::text, ${perm.code}, ${perm.name}, ${perm.category}, ${perm.sortOrder}, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT ("code") DO NOTHING
        `;
      }
      results.push(`已植入 ${menuPermissions.length} 個菜單權限`);

      // 5. 為所有角色分配預設菜單權限 (Admin 獲得全部)
      results.push('\n[5/5] 分配角色預設權限...');

      // 獲取所有權限 ID
      const permissions = await ctx.prisma.$queryRaw<{ id: string; code: string }[]>`
        SELECT id, code FROM "Permission" WHERE category = 'menu'
      `;

      // 獲取所有角色
      const roles = await ctx.prisma.$queryRaw<{ id: number; name: string }[]>`
        SELECT id, name FROM "Role"
      `;

      // Admin (roleId=1 通常是 Admin) 獲得所有權限
      for (const role of roles) {
        for (const perm of permissions) {
          // Admin 獲得全部，其他角色獲得基本菜單
          const shouldGrant = role.name === 'Admin' ||
            ['menu:dashboard', 'menu:projects', 'menu:proposals', 'menu:expenses'].includes(perm.code);

          if (shouldGrant) {
            await ctx.prisma.$executeRaw`
              INSERT INTO "RolePermission" ("id", "roleId", "permissionId", "createdAt")
              VALUES (gen_random_uuid()::text, ${role.id}, ${perm.id}, CURRENT_TIMESTAMP)
              ON CONFLICT ("roleId", "permissionId") DO NOTHING
            `;
          }
        }
      }
      results.push('已分配角色預設權限');

      results.push('\n=== FEAT-011 Permission 表修復完成 ===');

      // 驗證
      const permCount = await ctx.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "Permission"`;
      const rolePermCount = await ctx.prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "RolePermission"`;
      results.push(`\n驗證: Permission ${permCount[0]?.count} 筆, RolePermission ${rolePermCount[0]?.count} 筆`);

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
