/**
 * @fileoverview OM Expense Router - 操作與維護費用管理 API
 *
 * @description
 * 提供 O&M (Operations & Maintenance) 費用的完整管理功能，支援表頭-明細架構。
 * FEAT-007: 重構為 OMExpense (表頭) → OMExpenseItem (明細) → OMExpenseMonthly (月度記錄) 架構。
 * 表頭記錄年度基本資訊，明細項目記錄各項目預算和 OpCo 歸屬，月度記錄追蹤實際支出。
 * 支援跨年度比較和年增長率（YoY）計算，用於預算追蹤和趨勢分析。
 *
 * @module api/routers/omExpense
 *
 * @features
 * - FEAT-007: 表頭-明細架構（一個 OMExpense 可有多個 OMExpenseItem）
 * - 每個明細項目獨立管理 OpCo 歸屬、預算金額、日期範圍
 * - 每個明細項目獨立管理 12 個月度記錄
 * - 表頭匯總數據自動計算（totalBudgetAmount, totalActualSpent）
 * - 明細項目支援拖曳排序（sortOrder）
 * - 計算年度增長率（YoY Growth Rate）與歷史比較
 * - 查詢 OM 費用列表（支援年度、OpCo、類別過濾）
 * - 查詢月度支出匯總（用於儀表板統計圖表）
 * - 級聯刪除檢查（刪除時自動刪除明細和月度記錄）
 *
 * @procedures
 * - create: 建立 OM 費用（表頭 + 明細項目 + 月度記錄）
 * - update: 更新 OM 費用表頭資訊
 * - addItem: 新增明細項目（自動建立 12 個月度記錄）
 * - updateItem: 更新明細項目資訊
 * - removeItem: 刪除明細項目（級聯刪除月度記錄）
 * - reorderItems: 調整明細項目排序
 * - updateItemMonthlyRecords: 更新明細項目的月度記錄
 * - calculateYoYGrowth: 計算年度增長率
 * - getById: 查詢單一 OM 費用詳情（含明細項目和月度記錄）
 * - getAll: 查詢 OM 費用列表（支援分頁和過濾）
 * - getBySourceExpenseId: 查詢由指定費用衍生的 OM 費用列表
 * - delete: 刪除 OM 費用（級聯刪除所有明細和月度記錄）
 * - getCategories: 獲取所有 OM 類別列表
 * - getMonthlyTotals: 獲取指定年度的月度支出匯總
 * - getSummary: 獲取 O&M Summary 數據
 *
 * @dependencies
 * - Prisma Client: 資料庫操作和交易管理
 * - Zod: 輸入驗證和類型推斷
 * - tRPC: API 框架和類型安全
 *
 * @related
 * - packages/db/prisma/schema.prisma - OMExpense, OMExpenseItem, OMExpenseMonthly 資料模型
 * - packages/api/src/routers/operatingCompany.ts - 營運公司 Router
 * - packages/api/src/routers/vendor.ts - 供應商 Router
 * - apps/web/src/app/[locale]/om-expenses/page.tsx - OM 費用列表頁面
 *
 * @author IT Department
 * @since Module 3 - OM Expense Management
 * @lastModified 2025-12-05 (FEAT-007 表頭-明細架構重構)
 */

import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure } from '../trpc';

// ============================================================
// FEAT-007: Zod Schemas - 表頭-明細架構
// ============================================================

// ========== 月度記錄 Schema ==========
const monthlyRecordSchema = z.object({
  month: z.number().int().min(1).max(12),
  actualAmount: z.number().nonnegative(),
});

// ========== FEAT-007: 明細項目 Schema ==========
const omExpenseItemSchema = z.object({
  name: z.string().min(1, '項目名稱不能為空').max(200),
  description: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
  budgetAmount: z.number().nonnegative('預算金額不能為負'),
  lastFYActualExpense: z.number().optional().nullable(), // FEAT-008: 上年度實際支出
  opCoId: z.string().min(1, 'OpCo 不能為空'),
  currencyId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().min(1, '結束日期不能為空'),
});

// ========== FEAT-007: 建立 OM Expense (含明細) Schema ==========
const createOMExpenseWithItemsSchema = z.object({
  // 表頭資訊
  name: z.string().min(1, 'OM費用名稱不能為空').max(200),
  description: z.string().optional(),
  financialYear: z.number().int().min(2000).max(2100),
  category: z.string().min(1, '類別不能為空').max(100),
  vendorId: z.string().optional(),
  sourceExpenseId: z.string().optional(),
  defaultOpCoId: z.string().optional(), // 預設 OpCo（用於明細項目）
  // FEAT-007: 明細項目（至少一項）
  items: z.array(omExpenseItemSchema).min(1, '至少需要一個明細項目'),
});

// ========== 舊版 create schema（向後兼容）==========
const createOMExpenseSchema = z.object({
  name: z.string().min(1, 'OM費用名稱不能為空').max(200),
  description: z.string().optional(),
  financialYear: z.number().int().min(2000).max(2100),
  category: z.string().min(1, '類別不能為空').max(100),
  opCoId: z.string().min(1, 'OpCo 不能為空'),
  budgetAmount: z.number().positive('預算金額必須大於 0'),
  vendorId: z.string().optional(),
  sourceExpenseId: z.string().optional(),
  startDate: z.string().min(1, '開始日期不能為空'),
  endDate: z.string().min(1, '結束日期不能為空'),
});

// ========== FEAT-007: 更新表頭 Schema ==========
const updateOMExpenseSchema = z.object({
  id: z.string().min(1, 'ID 不能為空'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  category: z.string().min(1).max(100).optional(),
  vendorId: z.string().optional().nullable(),
  sourceExpenseId: z.string().optional().nullable(),
  defaultOpCoId: z.string().optional().nullable(),
});

// ========== FEAT-007: 新增明細項目 Schema ==========
const addItemSchema = z.object({
  omExpenseId: z.string().min(1, 'OM費用 ID 不能為空'),
  item: omExpenseItemSchema,
});

// ========== FEAT-007: 更新明細項目 Schema ==========
const updateItemSchema = z.object({
  id: z.string().min(1, 'Item ID 不能為空'),
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional().nullable(),
  sortOrder: z.number().int().min(0).optional(),
  budgetAmount: z.number().nonnegative().optional(),
  lastFYActualExpense: z.number().optional().nullable(), // FEAT-008: 上年度實際支出
  opCoId: z.string().optional(),
  currencyId: z.string().optional().nullable(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional(),
});

// ========== FEAT-007: 調整排序 Schema ==========
const reorderItemsSchema = z.object({
  omExpenseId: z.string().min(1, 'OM費用 ID 不能為空'),
  itemIds: z.array(z.string()), // 按新順序排列的 ID 陣列
});

// ========== FEAT-007: 更新 Item 月度記錄 Schema ==========
const updateItemMonthlyRecordsSchema = z.object({
  omExpenseItemId: z.string().min(1, 'Item ID 不能為空'),
  monthlyData: z.array(monthlyRecordSchema).length(12, '必須提供 12 個月的數據'),
});

// ========== 舊版月度記錄 Schema（向後兼容）==========
const updateMonthlyRecordsSchema = z.object({
  omExpenseId: z.string().min(1, 'OM費用 ID 不能為空'),
  monthlyData: z.array(monthlyRecordSchema).length(12, '必須提供 12 個月的數據'),
});

// ========== Summary API Schema ==========

const getSummarySchema = z.object({
  currentYear: z.number().int().min(2000).max(2100),
  previousYear: z.number().int().min(2000).max(2100),
  opCoIds: z.array(z.string()).optional(),
  categories: z.array(z.string()).optional(),
});

// ========== FEAT-008: Import Data Schema ==========
const importOMExpenseItemSchema = z.object({
  // Header 資訊
  headerName: z.string().min(1, 'Header 名稱不能為空'),
  headerDescription: z.string().nullable().optional(),
  category: z.string().min(1, '類別不能為空'),

  // Item 資訊
  itemName: z.string().min(1, '項目名稱不能為空'),
  itemDescription: z.string().nullable().optional(),
  budgetAmount: z.number().nonnegative().default(0),
  opCoName: z.string().min(1, 'OpCo 名稱不能為空'),
  endDate: z.string().nullable().optional(),
  lastFYActualExpense: z.number().nullable().optional(), // 上年度實際支出
});

const importOMExpenseDataSchema = z.object({
  financialYear: z.number().int().min(2000).max(2100),
  items: z.array(importOMExpenseItemSchema).min(1, '至少需要一筆導入資料'),
});

// ========== FEAT-008: Import Result Type ==========
export interface ImportResult {
  success: boolean;
  statistics: {
    totalItems: number;
    createdOpCos: number;
    createdCategories: number; // FEAT-008: 自動建立的 ExpenseCategory 數量
    createdHeaders: number;
    createdItems: number;
    createdMonthlyRecords: number;
    skippedDuplicates: number; // 跳過的重複項目數量
  };
  details: {
    opCos: string[];
    categories: string[]; // FEAT-008: 自動建立的 ExpenseCategory 名稱
    headers: string[];
    skippedItems?: Array<{ headerName: string; itemName: string; opCoName: string }>; // 被跳過的項目清單
  };
  error?: {
    message: string;
    duplicateItem?: {
      headerName: string;
      itemName: string;
      opCoName: string;
    };
  };
}

// ========== FEAT-008: Helper Functions ==========
/**
 * 生成 OpCo Code
 * 規則：移除括號內容，轉大寫，移除非字母數字，取前10字符 + 時間戳
 */
function generateOpCoCode(name: string): string {
  // 移除括號內容，取前綴
  const base = name.replace(/\s*\([^)]*\)/g, '').trim();
  // 轉為大寫，移除非字母數字
  const cleaned = base.toUpperCase().replace(/[^A-Z0-9]/g, '');
  // 取前 10 個字符
  const code = cleaned.substring(0, 10) || 'OPCO';
  // 加上時間戳避免重複
  return `${code}-${Date.now().toString(36).toUpperCase()}`;
}

/**
 * 生成 Category Code
 * 規則：取名稱的首字母縮寫 + 時間戳
 * @example "Hardware Maintenance" -> "HM-XXXX"
 */
function generateCategoryCode(name: string): string {
  // 取每個單詞的首字母
  const words = name.trim().split(/\s+/);
  const initials = words.map(w => w.charAt(0).toUpperCase()).join('');
  // 取前 5 個字符
  const code = initials.substring(0, 5) || 'CAT';
  // 加上時間戳避免重複
  return `${code}-${Date.now().toString(36).toUpperCase()}`;
}

// ========== TypeScript Types for Summary ==========

export interface CategorySummaryItem {
  category: string;
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

export interface ItemDetail {
  id: string;
  name: string;
  description: string | null;
  currentYearBudget: number;
  previousYearActual: number | null;
  changePercent: number | null;
  endDate: Date;
  /** CHANGE-004: 關聯的 OM Expense ID（用於導航和識別） */
  omExpenseId?: string;
  /** CHANGE-004: 是否為 OMExpenseItem（新架構）或舊 OMExpense */
  isNewArchitecture?: boolean;
}

export interface OpCoSubTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

/**
 * CHANGE-004: OM Expense 表頭分組
 * 用於在 OM Summary 頁面顯示 OMExpense 表頭及其明細項目
 */
export interface OMExpenseHeaderGroup {
  omExpenseId: string;
  omExpenseName: string;
  omExpenseDescription: string | null;
  createdByName: string;
  createdAt: Date;
  items: ItemDetail[];
  headerTotal: {
    currentYearBudget: number;
    previousYearActual: number;
    changePercent: number | null;
  };
}

export interface OpCoGroup {
  opCoId: string;
  opCoCode: string;
  opCoName: string;
  /** 舊架構：直接項目列表（用於沒有 OMExpenseItem 的記錄） */
  items: ItemDetail[];
  /** CHANGE-004: 新架構：按表頭分組的項目列表 */
  omExpenseHeaders?: OMExpenseHeaderGroup[];
  subTotal: OpCoSubTotal;
}

export interface CategoryTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
}

export interface CategoryDetailGroup {
  category: string;
  opCoGroups: OpCoGroup[];
  categoryTotal: CategoryTotal;
}

export interface GrandTotal {
  currentYearBudget: number;
  previousYearActual: number;
  changePercent: number | null;
  itemCount: number;
}

export interface SummaryMeta {
  currentYear: number;
  previousYear: number;
  selectedOpCos: string[];
  selectedCategories: string[];
}

export interface OMSummaryResponse {
  categorySummary: CategorySummaryItem[];
  detailData: CategoryDetailGroup[];
  grandTotal: GrandTotal;
  meta: SummaryMeta;
}

// ========== Router ==========

export const omExpenseRouter = createTRPCRouter({
  // ============================================================
  // FEAT-008: 資料導入 Procedure
  // ============================================================

  /**
   * FEAT-008: 批量導入 OM Expense 資料
   *
   * @description
   * 從 JSON 資料批量導入 OM Expense，支援：
   * - 自動建立不存在的 Operating Company
   * - 自動建立不存在的 OM Expense Header
   * - 為每個 Item 建立 OMExpenseItem + 12 個月度記錄
   * - 唯一性檢查：Header name + Item name + OpCo
   * - 完整 Rollback 策略：任何錯誤都會回滾所有變更
   *
   * @input importOMExpenseDataSchema
   * - financialYear: 財務年度
   * - items: 導入項目陣列
   *
   * @returns ImportResult - 導入結果統計
   */
  importData: protectedProcedure
    .input(importOMExpenseDataSchema)
    .mutation(async ({ ctx, input }): Promise<ImportResult> => {
      const { financialYear, items } = input;

      try {
        // 使用 Prisma Transaction - 全部成功或全部回滾
        // 增加超時時間：預設 5 秒太短，導入大量資料需要更長時間
        const result = await ctx.prisma.$transaction(async (tx) => {
          // ========== Step 1: 收集所有唯一的 OpCo 名稱 ==========
          const opCoNames = [...new Set(items.map((i) => i.opCoName))];

          // ========== Step 2: 查詢現有 OpCo，建立缺失的 OpCo ==========
          const existingOpCos = await tx.operatingCompany.findMany({
            where: { name: { in: opCoNames } },
          });
          const existingOpCoMap = new Map(existingOpCos.map((o) => [o.name, o]));

          // 建立缺失的 OpCo
          const missingOpCoNames = opCoNames.filter((n) => !existingOpCoMap.has(n));
          const createdOpCos: string[] = [];

          for (const name of missingOpCoNames) {
            const opCo = await tx.operatingCompany.create({
              data: {
                code: generateOpCoCode(name),
                name: name,
                isActive: true,
              },
            });
            existingOpCoMap.set(name, opCo);
            createdOpCos.push(name);
          }

          // ========== Step 2.5: 收集所有唯一的 Category 名稱，建立缺失的 ExpenseCategory ==========
          const categoryNames = [...new Set(items.map((i) => i.category))];
          const existingCategories = await tx.expenseCategory.findMany({
            where: { name: { in: categoryNames } },
          });
          const categoryMap = new Map(existingCategories.map((c) => [c.name, c]));

          // 建立缺失的 Category
          const missingCategoryNames = categoryNames.filter((n) => !categoryMap.has(n));
          const createdCategories: string[] = [];

          for (const name of missingCategoryNames) {
            const category = await tx.expenseCategory.create({
              data: {
                code: generateCategoryCode(name),
                name: name,
                description: `Auto-created from data import`,
                sortOrder: 0,
                isActive: true,
              },
            });
            categoryMap.set(name, category);
            createdCategories.push(name);
          }

          // ========== CHANGE-010: 查詢 USD 幣別作為默認值 ==========
          const usdCurrency = await tx.currency.findFirst({
            where: { code: 'USD' },
          });

          // ========== Step 3: 收集唯一 Header (name + category + financialYear) ==========
          const headerKeys = [
            ...new Set(
              items.map((i) => `${i.headerName}|${i.category}|${financialYear}`)
            ),
          ];

          // ========== Step 4: 查詢現有 Header ==========
          const existingHeaders = await tx.oMExpense.findMany({
            where: { financialYear },
          });
          const headerMap = new Map(
            existingHeaders.map((h) => [
              `${h.name}|${h.category}|${financialYear}`,
              h,
            ])
          );

          // ========== Step 5: 建立缺失的 Header ==========
          const createdHeaders: string[] = [];
          const processedHeaderKeys = new Set<string>();

          for (const item of items) {
            const headerKey = `${item.headerName}|${item.category}|${financialYear}`;

            if (!headerMap.has(headerKey) && !processedHeaderKeys.has(headerKey)) {
              // 獲取第一個 item 的 OpCo 作為 Header 的 defaultOpCoId
              const firstOpCo = existingOpCoMap.get(item.opCoName);
              // FEAT-008: 獲取對應的 ExpenseCategory
              const expenseCategory = categoryMap.get(item.category);

              const header = await tx.oMExpense.create({
                data: {
                  name: item.headerName,
                  description: item.headerDescription ?? null,
                  financialYear,
                  category: item.category,
                  // FEAT-008: 設置 categoryId 關聯
                  categoryId: expenseCategory?.id ?? null,
                  // FEAT-007: 設置預設值
                  totalBudgetAmount: 0, // 之後會更新
                  totalActualSpent: 0,
                  // 舊欄位（向後兼容）
                  opCoId: firstOpCo?.id ?? null,
                  defaultOpCoId: firstOpCo?.id ?? null,
                  budgetAmount: 0,
                  actualSpent: 0,
                  startDate: new Date(),
                  endDate: item.endDate ? new Date(item.endDate) : new Date(`${financialYear}-12-31`),
                },
              });
              headerMap.set(headerKey, header);
              createdHeaders.push(item.headerName);
              processedHeaderKeys.add(headerKey);
            }
          }

          // ========== Step 6: 逐筆處理 Item 資料 ==========
          let sortOrderCounter = 0;
          let createdItemsCount = 0;
          let createdMonthlyRecordsCount = 0;
          let skippedDuplicatesCount = 0;
          const skippedItems: Array<{ headerName: string; itemName: string; opCoName: string }> = [];

          // 按 Header 分組以便更新 sortOrder 和 totalBudgetAmount
          const headerItemsMap = new Map<string, { headerId: string; items: typeof items }>();

          for (const item of items) {
            const headerKey = `${item.headerName}|${item.category}|${financialYear}`;
            const header = headerMap.get(headerKey)!;
            const opCo = existingOpCoMap.get(item.opCoName)!;

            // ========== 唯一性檢查 (6 欄位完整唯一鍵) ==========
            // 與前端重複檢測邏輯一致：
            // 1. headerName (via omExpenseId)
            // 2. itemName
            // 3. itemDescription
            // 4. category (via omExpenseId)
            // 5. opCoName (via opCoId)
            // 6. budgetAmount
            const existingItem = await tx.oMExpenseItem.findFirst({
              where: {
                omExpenseId: header.id,
                name: item.itemName,
                description: item.itemDescription ?? null,
                opCoId: opCo.id,
                budgetAmount: item.budgetAmount ?? 0,
              },
            });

            if (existingItem) {
              // 發現重複資料，跳過該筆並記錄
              skippedDuplicatesCount++;
              skippedItems.push({
                headerName: item.headerName,
                itemName: item.itemName,
                opCoName: item.opCoName,
              });
              continue; // 跳過此項目，處理下一筆
            }

            // 追蹤每個 header 的 items 用於計算 sortOrder
            if (!headerItemsMap.has(header.id)) {
              // 查詢現有 items 的最大 sortOrder
              const existingMaxSortOrder = await tx.oMExpenseItem.findFirst({
                where: { omExpenseId: header.id },
                orderBy: { sortOrder: 'desc' },
                select: { sortOrder: true },
              });
              headerItemsMap.set(header.id, {
                headerId: header.id,
                items: [],
              });
              sortOrderCounter = (existingMaxSortOrder?.sortOrder ?? -1) + 1;
            }

            // 建立 OMExpenseItem
            const newItem = await tx.oMExpenseItem.create({
              data: {
                omExpenseId: header.id,
                name: item.itemName,
                description: item.itemDescription ?? null,
                budgetAmount: item.budgetAmount ?? 0,
                actualSpent: 0,
                lastFYActualExpense: item.lastFYActualExpense ?? 0, // CHANGE-010: 默認 0 而非 null
                currencyId: usdCurrency?.id ?? null, // CHANGE-010: 默認 USD 幣別
                opCoId: opCo.id,
                endDate: item.endDate
                  ? new Date(item.endDate)
                  : new Date(`${financialYear}-12-31`),
                sortOrder: sortOrderCounter++,
              },
            });
            createdItemsCount++;

            // 建立 12 個月度記錄
            const monthlyRecords = Array.from({ length: 12 }, (_, monthIndex) => ({
              omExpenseItemId: newItem.id,
              month: monthIndex + 1,
              actualAmount: 0,
              opCoId: opCo.id,
            }));

            await tx.oMExpenseMonthly.createMany({
              data: monthlyRecords,
            });
            createdMonthlyRecordsCount += 12;
          }

          // ========== Step 7: 更新所有受影響的 Header 的 totalBudgetAmount ==========
          const affectedHeaderIds = [...new Set(items.map((item) => {
            const headerKey = `${item.headerName}|${item.category}|${financialYear}`;
            return headerMap.get(headerKey)!.id;
          }))];

          for (const headerId of affectedHeaderIds) {
            const allItems = await tx.oMExpenseItem.findMany({
              where: { omExpenseId: headerId },
            });

            const totalBudgetAmount = allItems.reduce(
              (sum, item) => sum + item.budgetAmount,
              0
            );

            await tx.oMExpense.update({
              where: { id: headerId },
              data: {
                totalBudgetAmount,
                budgetAmount: totalBudgetAmount, // 向後兼容
              },
            });
          }

          // ========== Step 8: 返回成功結果 ==========
          return {
            success: true,
            statistics: {
              totalItems: items.length,
              createdOpCos: createdOpCos.length,
              createdCategories: createdCategories.length, // FEAT-008: 自動建立的 ExpenseCategory 數量
              createdHeaders: createdHeaders.length,
              createdItems: createdItemsCount,
              createdMonthlyRecords: createdMonthlyRecordsCount,
              skippedDuplicates: skippedDuplicatesCount,
            },
            details: {
              opCos: createdOpCos,
              categories: createdCategories, // FEAT-008: 自動建立的 ExpenseCategory 名稱
              headers: createdHeaders,
              skippedItems: skippedItems.length > 0 ? skippedItems : undefined,
            },
          };
        }, {
          // 增加 transaction 超時時間：導入大量資料需要更長時間
          // maxWait: 等待資料庫連接的最大時間 (預設 2000ms)
          // timeout: transaction 執行的最大時間 (預設 5000ms)
          maxWait: 10000,   // 10 秒等待連接
          timeout: 300000,  // 5 分鐘執行超時（足夠導入 500+ 筆資料）
        });

        return result;
      } catch (error) {
        // Transaction 自動 Rollback
        if (error instanceof TRPCError) {
          // 重新拋出 tRPC 錯誤，附加 duplicateItem 資訊
          const cause = error.cause as { headerName?: string; itemName?: string; opCoName?: string } | undefined;
          return {
            success: false,
            statistics: {
              totalItems: items.length,
              createdOpCos: 0,
              createdCategories: 0,
              createdHeaders: 0,
              createdItems: 0,
              createdMonthlyRecords: 0,
              skippedDuplicates: 0,
            },
            details: {
              opCos: [],
              categories: [],
              headers: [],
            },
            error: {
              message: error.message,
              duplicateItem: cause
                ? {
                    headerName: cause.headerName ?? '',
                    itemName: cause.itemName ?? '',
                    opCoName: cause.opCoName ?? '',
                  }
                : undefined,
            },
          };
        }

        // 其他錯誤
        return {
          success: false,
          statistics: {
            totalItems: items.length,
            createdOpCos: 0,
            createdCategories: 0,
            createdHeaders: 0,
            createdItems: 0,
            createdMonthlyRecords: 0,
            skippedDuplicates: 0,
          },
          details: {
            opCos: [],
            categories: [],
            headers: [],
          },
          error: {
            message: error instanceof Error ? error.message : '導入失敗，所有資料已回滾',
          },
        };
      }
    }),

  // ============================================================
  // FEAT-007: 新版表頭-明細架構 Procedures
  // ============================================================

  /**
   * FEAT-007: 建立 OM 費用（新版表頭-明細架構）
   *
   * @description
   * 使用新的表頭-明細架構建立 OM 費用：
   * - 建立 OMExpense 表頭（自動計算 totalBudgetAmount 和 totalActualSpent）
   * - 為每個明細項目建立 OMExpenseItem
   * - 為每個明細項目自動初始化 12 個月度記錄（OMExpenseMonthly）
   *
   * @input createOMExpenseWithItemsSchema
   * - name: 表頭名稱
   * - description: 描述（可選）
   * - financialYear: 財務年度
   * - category: 類別
   * - vendorId: 供應商 ID（可選）
   * - sourceExpenseId: 來源費用 ID（可選）
   * - defaultOpCoId: 預設 OpCo ID（可選）
   * - items: 明細項目陣列（至少一項）
   *
   * @returns 完整的 OMExpense 資料（含明細項目和月度記錄）
   */
  createWithItems: protectedProcedure
    .input(createOMExpenseWithItemsSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證所有明細項目的 OpCo 是否存在
      const opCoIds = [...new Set(input.items.map((item) => item.opCoId))];
      const opCos = await ctx.prisma.operatingCompany.findMany({
        where: { id: { in: opCoIds } },
      });

      if (opCos.length !== opCoIds.length) {
        const foundIds = opCos.map((oc) => oc.id);
        const missingIds = opCoIds.filter((id) => !foundIds.includes(id));
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `以下 OpCo 不存在: ${missingIds.join(', ')}`,
        });
      }

      // 如果提供了 defaultOpCoId，驗證是否存在
      if (input.defaultOpCoId) {
        const defaultOpCo = await ctx.prisma.operatingCompany.findUnique({
          where: { id: input.defaultOpCoId },
        });
        if (!defaultOpCo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '預設 OpCo 不存在',
          });
        }
      }

      // 如果提供了 vendorId，驗證 vendor 是否存在
      if (input.vendorId) {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { id: input.vendorId },
        });
        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '供應商不存在',
          });
        }
      }

      // 如果提供了 sourceExpenseId，驗證 expense 是否存在
      if (input.sourceExpenseId) {
        const sourceExpense = await ctx.prisma.expense.findUnique({
          where: { id: input.sourceExpenseId },
        });
        if (!sourceExpense) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '來源費用記錄不存在',
          });
        }
      }

      // 如果提供了 currencyId，驗證 currency 是否存在
      const currencyIds = input.items
        .map((item) => item.currencyId)
        .filter((id): id is string => !!id);
      if (currencyIds.length > 0) {
        const currencies = await ctx.prisma.currency.findMany({
          where: { id: { in: currencyIds } },
        });
        if (currencies.length !== new Set(currencyIds).size) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '部分幣別不存在',
          });
        }
      }

      // 驗證所有明細項目的日期邏輯
      for (const item of input.items) {
        if (item.startDate) {
          const startDate = new Date(item.startDate);
          const endDate = new Date(item.endDate);
          if (startDate >= endDate) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: `明細項目 "${item.name}": 結束日期必須晚於開始日期`,
            });
          }
        }
      }

      // 計算表頭匯總數據
      const totalBudgetAmount = input.items.reduce(
        (sum, item) => sum + item.budgetAmount,
        0
      );

      // 獲取第一個項目（Zod 已驗證至少有一項）
      const firstItem = input.items[0]!;

      // 使用 transaction 創建完整的表頭-明細架構
      const omExpense = await ctx.prisma.$transaction(async (tx) => {
        // 1. 創建 OMExpense 表頭
        const newOMExpense = await tx.oMExpense.create({
          data: {
            name: input.name,
            description: input.description,
            financialYear: input.financialYear,
            category: input.category,
            vendorId: input.vendorId,
            sourceExpenseId: input.sourceExpenseId,
            defaultOpCoId: input.defaultOpCoId,
            // FEAT-007: 新欄位
            totalBudgetAmount,
            totalActualSpent: 0,
            // 舊欄位（向後兼容，使用第一個 item 的值或預設值）
            opCoId: firstItem.opCoId,
            budgetAmount: totalBudgetAmount,
            actualSpent: 0,
            startDate: firstItem.startDate
              ? new Date(firstItem.startDate)
              : new Date(),
            endDate: new Date(firstItem.endDate),
          },
        });

        // 2. 創建所有明細項目和對應的月度記錄
        for (let i = 0; i < input.items.length; i++) {
          const itemInput = input.items[i]!;

          // 創建 OMExpenseItem
          const newItem = await tx.oMExpenseItem.create({
            data: {
              omExpenseId: newOMExpense.id,
              name: itemInput.name,
              description: itemInput.description,
              sortOrder: itemInput.sortOrder ?? i,
              budgetAmount: itemInput.budgetAmount,
              actualSpent: 0,
              lastFYActualExpense: itemInput.lastFYActualExpense ?? null, // FEAT-008
              opCoId: itemInput.opCoId,
              currencyId: itemInput.currencyId,
              startDate: itemInput.startDate
                ? new Date(itemInput.startDate)
                : null,
              endDate: new Date(itemInput.endDate),
            },
          });

          // 為每個 item 創建 12 個月度記錄
          // FEAT-007 修復: 移除 omExpenseId 避免舊版唯一約束衝突
          // 因為 @@unique([omExpenseId, month]) 仍然存在，多個 items 會造成重複
          const monthlyRecords = Array.from({ length: 12 }, (_, monthIndex) => ({
            omExpenseItemId: newItem.id,
            // omExpenseId: 不設置，避免舊版唯一約束衝突
            month: monthIndex + 1,
            actualAmount: 0,
            opCoId: itemInput.opCoId,
          }));

          await tx.oMExpenseMonthly.createMany({
            data: monthlyRecords,
          });
        }

        // 3. 返回完整的 OMExpense（包含明細項目和月度記錄）
        return tx.oMExpense.findUnique({
          where: { id: newOMExpense.id },
          include: {
            opCo: true,
            vendor: true,
            sourceExpense: {
              include: {
                purchaseOrder: {
                  include: {
                    project: true,
                  },
                },
              },
            },
            // FEAT-007: 包含明細項目
            items: {
              orderBy: { sortOrder: 'asc' },
              include: {
                opCo: true,
                currency: true,
                monthlyRecords: {
                  orderBy: { month: 'asc' },
                },
              },
            },
            // 舊版月度記錄（向後兼容）
            monthlyRecords: {
              orderBy: { month: 'asc' },
            },
          },
        });
      });

      return omExpense;
    }),

  /**
   * FEAT-007: 新增明細項目
   *
   * @description
   * 為現有的 OM 費用新增一個明細項目：
   * - 驗證 OM 費用存在
   * - 驗證 OpCo 和 Currency 存在
   * - 創建 OMExpenseItem
   * - 自動創建 12 個月度記錄
   * - 更新表頭的 totalBudgetAmount
   *
   * @input addItemSchema
   * - omExpenseId: OM費用 ID
   * - item: 明細項目資訊
   *
   * @returns 更新後的完整 OMExpense 資料
   */
  addItem: protectedProcedure
    .input(addItemSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: { items: true },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 驗證 OpCo 是否存在
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.item.opCoId },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OpCo 不存在',
        });
      }

      // 如果提供了 currencyId，驗證 currency 是否存在
      if (input.item.currencyId) {
        const currency = await ctx.prisma.currency.findUnique({
          where: { id: input.item.currencyId },
        });
        if (!currency) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '幣別不存在',
          });
        }
      }

      // 驗證日期邏輯
      if (input.item.startDate) {
        const startDate = new Date(input.item.startDate);
        const endDate = new Date(input.item.endDate);
        if (startDate >= endDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '結束日期必須晚於開始日期',
          });
        }
      }

      // 計算新的 sortOrder（放在最後）
      const maxSortOrder = omExpense.items.reduce(
        (max, item) => Math.max(max, item.sortOrder),
        -1
      );
      const newSortOrder = input.item.sortOrder ?? maxSortOrder + 1;

      // 使用 transaction 創建明細項目和月度記錄
      const _result = await ctx.prisma.$transaction(async (tx) => {
        // 1. 創建 OMExpenseItem
        const newItem = await tx.oMExpenseItem.create({
          data: {
            omExpenseId: input.omExpenseId,
            name: input.item.name,
            description: input.item.description,
            sortOrder: newSortOrder,
            budgetAmount: input.item.budgetAmount,
            actualSpent: 0,
            lastFYActualExpense: input.item.lastFYActualExpense ?? null, // FEAT-008
            opCoId: input.item.opCoId,
            currencyId: input.item.currencyId,
            startDate: input.item.startDate
              ? new Date(input.item.startDate)
              : null,
            endDate: new Date(input.item.endDate),
          },
        });

        // 2. 創建 12 個月度記錄
        // FEAT-007 修復: 移除 omExpenseId 避免舊版唯一約束衝突
        const monthlyRecords = Array.from({ length: 12 }, (_, monthIndex) => ({
          omExpenseItemId: newItem.id,
          // omExpenseId: 不設置，避免舊版唯一約束衝突
          month: monthIndex + 1,
          actualAmount: 0,
          opCoId: input.item.opCoId,
        }));

        await tx.oMExpenseMonthly.createMany({
          data: monthlyRecords,
        });

        // 3. 更新表頭的 totalBudgetAmount
        const newTotalBudgetAmount =
          omExpense.totalBudgetAmount + input.item.budgetAmount;

        await tx.oMExpense.update({
          where: { id: input.omExpenseId },
          data: {
            totalBudgetAmount: newTotalBudgetAmount,
            // 同時更新舊欄位（向後兼容）
            budgetAmount: newTotalBudgetAmount,
          },
        });

        return newItem;
      });

      // 返回更新後的完整 OMExpense
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * FEAT-007: 更新明細項目
   *
   * @description
   * 更新現有的明細項目資訊：
   * - 驗證明細項目存在
   * - 如果更改 budgetAmount，自動更新表頭的 totalBudgetAmount
   * - 如果更改 OpCo，驗證新 OpCo 存在
   *
   * @input updateItemSchema
   * - id: 明細項目 ID
   * - 其他可選更新欄位
   *
   * @returns 更新後的完整 OMExpense 資料
   */
  updateItem: protectedProcedure
    .input(updateItemSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 驗證明細項目是否存在
      const existingItem = await ctx.prisma.oMExpenseItem.findUnique({
        where: { id },
        include: { omExpense: true },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '明細項目不存在',
        });
      }

      // 如果更改 OpCo，驗證新 OpCo 存在
      if (updateData.opCoId) {
        const opCo = await ctx.prisma.operatingCompany.findUnique({
          where: { id: updateData.opCoId },
        });
        if (!opCo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'OpCo 不存在',
          });
        }
      }

      // 如果更改 currencyId，驗證 currency 存在
      if (updateData.currencyId) {
        const currency = await ctx.prisma.currency.findUnique({
          where: { id: updateData.currencyId },
        });
        if (!currency) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '幣別不存在',
          });
        }
      }

      // 驗證日期邏輯
      if (updateData.startDate || updateData.endDate) {
        const startDate = updateData.startDate
          ? new Date(updateData.startDate)
          : existingItem.startDate;
        const endDate = updateData.endDate
          ? new Date(updateData.endDate)
          : existingItem.endDate;

        if (startDate && startDate >= endDate) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: '結束日期必須晚於開始日期',
          });
        }
      }

      // 準備更新資料
      const dataToUpdate: Record<string, unknown> = {};
      if (updateData.name !== undefined) dataToUpdate.name = updateData.name;
      if (updateData.description !== undefined)
        dataToUpdate.description = updateData.description;
      if (updateData.sortOrder !== undefined)
        dataToUpdate.sortOrder = updateData.sortOrder;
      if (updateData.budgetAmount !== undefined)
        dataToUpdate.budgetAmount = updateData.budgetAmount;
      // FEAT-008: 支援 lastFYActualExpense 更新
      if (updateData.lastFYActualExpense !== undefined)
        dataToUpdate.lastFYActualExpense = updateData.lastFYActualExpense;
      if (updateData.opCoId !== undefined)
        dataToUpdate.opCoId = updateData.opCoId;
      if (updateData.currencyId !== undefined)
        dataToUpdate.currencyId = updateData.currencyId;
      if (updateData.startDate !== undefined)
        dataToUpdate.startDate = updateData.startDate
          ? new Date(updateData.startDate)
          : null;
      if (updateData.endDate !== undefined)
        dataToUpdate.endDate = new Date(updateData.endDate);

      // 使用 transaction 更新
      await ctx.prisma.$transaction(async (tx) => {
        // 1. 更新明細項目
        await tx.oMExpenseItem.update({
          where: { id },
          data: dataToUpdate,
        });

        // 2. 如果更新了 budgetAmount，重新計算表頭的 totalBudgetAmount
        if (updateData.budgetAmount !== undefined) {
          const allItems = await tx.oMExpenseItem.findMany({
            where: { omExpenseId: existingItem.omExpenseId },
          });

          const newTotalBudgetAmount = allItems.reduce(
            (sum, item) =>
              sum +
              (item.id === id ? updateData.budgetAmount! : item.budgetAmount),
            0
          );

          await tx.oMExpense.update({
            where: { id: existingItem.omExpenseId },
            data: {
              totalBudgetAmount: newTotalBudgetAmount,
              budgetAmount: newTotalBudgetAmount, // 向後兼容
            },
          });
        }

        // 3. 如果更新了 OpCo，同步更新該項目的月度記錄的 opCoId
        if (updateData.opCoId !== undefined) {
          await tx.oMExpenseMonthly.updateMany({
            where: { omExpenseItemId: id },
            data: { opCoId: updateData.opCoId },
          });
        }
      });

      // 返回更新後的完整 OMExpense
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: existingItem.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * FEAT-007: 刪除明細項目
   *
   * @description
   * 刪除現有的明細項目：
   * - 驗證明細項目存在
   * - 檢查是否為最後一個項目（不允許刪除最後一項）
   * - 級聯刪除相關的月度記錄
   * - 更新表頭的 totalBudgetAmount 和 totalActualSpent
   *
   * @input { id: string } - 明細項目 ID
   * @returns 更新後的完整 OMExpense 資料
   */
  removeItem: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 驗證明細項目是否存在
      const existingItem = await ctx.prisma.oMExpenseItem.findUnique({
        where: { id: input.id },
        include: {
          omExpense: {
            include: { items: true },
          },
        },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '明細項目不存在',
        });
      }

      // 檢查是否為最後一個項目
      if (existingItem.omExpense.items.length <= 1) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '不能刪除最後一個明細項目，OM 費用至少需要一個明細項目',
        });
      }

      const omExpenseId = existingItem.omExpenseId;

      // 使用 transaction 刪除
      await ctx.prisma.$transaction(async (tx) => {
        // 1. 刪除明細項目的月度記錄
        await tx.oMExpenseMonthly.deleteMany({
          where: { omExpenseItemId: input.id },
        });

        // 2. 刪除明細項目
        await tx.oMExpenseItem.delete({
          where: { id: input.id },
        });

        // 3. 重新計算表頭的匯總數據
        const remainingItems = await tx.oMExpenseItem.findMany({
          where: { omExpenseId },
        });

        const newTotalBudgetAmount = remainingItems.reduce(
          (sum, item) => sum + item.budgetAmount,
          0
        );
        const newTotalActualSpent = remainingItems.reduce(
          (sum, item) => sum + item.actualSpent,
          0
        );

        await tx.oMExpense.update({
          where: { id: omExpenseId },
          data: {
            totalBudgetAmount: newTotalBudgetAmount,
            totalActualSpent: newTotalActualSpent,
            budgetAmount: newTotalBudgetAmount, // 向後兼容
            actualSpent: newTotalActualSpent, // 向後兼容
          },
        });
      });

      // 返回更新後的完整 OMExpense
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * FEAT-007: 調整明細項目排序
   *
   * @description
   * 批量更新明細項目的排序順序：
   * - 接收按新順序排列的項目 ID 陣列
   * - 驗證所有項目屬於同一 OM 費用
   * - 批量更新 sortOrder
   *
   * @input reorderItemsSchema
   * - omExpenseId: OM費用 ID
   * - itemIds: 按新順序排列的明細項目 ID 陣列
   *
   * @returns 更新後的完整 OMExpense 資料
   */
  reorderItems: protectedProcedure
    .input(reorderItemsSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: { items: true },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 驗證所有項目 ID 都屬於此 OM 費用
      const existingItemIds = omExpense.items.map((item) => item.id);
      const invalidIds = input.itemIds.filter(
        (id) => !existingItemIds.includes(id)
      );

      if (invalidIds.length > 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: `以下項目 ID 不屬於此 OM 費用: ${invalidIds.join(', ')}`,
        });
      }

      // 批量更新 sortOrder
      await ctx.prisma.$transaction(
        input.itemIds.map((itemId, index) =>
          ctx.prisma.oMExpenseItem.update({
            where: { id: itemId },
            data: { sortOrder: index },
          })
        )
      );

      // 返回更新後的完整 OMExpense
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * FEAT-007: 更新明細項目的月度記錄
   *
   * @description
   * 批量更新指定明細項目的 12 個月度記錄：
   * - 驗證明細項目存在
   * - 接收完整的 12 個月數據
   * - 更新或創建月度記錄
   * - 自動重算明細項目的 actualSpent
   * - 自動更新表頭的 totalActualSpent
   *
   * @input updateItemMonthlyRecordsSchema
   * - omExpenseItemId: 明細項目 ID
   * - monthlyData: 12 個月的數據陣列
   *
   * @returns 更新後的完整 OMExpense 資料
   */
  updateItemMonthlyRecords: protectedProcedure
    .input(updateItemMonthlyRecordsSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證明細項目是否存在
      const existingItem = await ctx.prisma.oMExpenseItem.findUnique({
        where: { id: input.omExpenseItemId },
        include: { omExpense: true },
      });

      if (!existingItem) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '明細項目不存在',
        });
      }

      // 驗證月份是否完整（1-12）
      const months = input.monthlyData.map((d) => d.month).sort((a, b) => a - b);
      const expectedMonths = Array.from({ length: 12 }, (_, i) => i + 1);

      if (JSON.stringify(months) !== JSON.stringify(expectedMonths)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '必須提供完整的 1-12 月數據',
        });
      }

      // 使用 transaction 更新月度記錄和匯總數據
      await ctx.prisma.$transaction(async (tx) => {
        // 1. 批量更新或創建月度記錄
        for (const monthData of input.monthlyData) {
          await tx.oMExpenseMonthly.upsert({
            where: {
              omExpenseItemId_month: {
                omExpenseItemId: input.omExpenseItemId,
                month: monthData.month,
              },
            },
            update: {
              actualAmount: monthData.actualAmount,
            },
            create: {
              omExpenseItemId: input.omExpenseItemId,
              omExpenseId: existingItem.omExpenseId,
              month: monthData.month,
              actualAmount: monthData.actualAmount,
              opCoId: existingItem.opCoId,
            },
          });
        }

        // 2. 計算此明細項目的總實際支出
        const itemActualSpent = input.monthlyData.reduce(
          (sum, record) => sum + record.actualAmount,
          0
        );

        // 3. 更新明細項目的 actualSpent
        await tx.oMExpenseItem.update({
          where: { id: input.omExpenseItemId },
          data: { actualSpent: itemActualSpent },
        });

        // 4. 重新計算表頭的 totalActualSpent
        const allItems = await tx.oMExpenseItem.findMany({
          where: { omExpenseId: existingItem.omExpenseId },
        });

        // 計算新的 totalActualSpent（其他項目的 actualSpent + 本項目新的 actualSpent）
        const newTotalActualSpent = allItems.reduce(
          (sum, item) =>
            sum +
            (item.id === input.omExpenseItemId ? itemActualSpent : item.actualSpent),
          0
        );

        // 5. 更新表頭的 totalActualSpent
        await tx.oMExpense.update({
          where: { id: existingItem.omExpenseId },
          data: {
            totalActualSpent: newTotalActualSpent,
            actualSpent: newTotalActualSpent, // 向後兼容
          },
        });
      });

      // 返回更新後的完整 OMExpense
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: existingItem.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  // ============================================================
  // 舊版 Procedures（向後兼容，將在下一版本移除）
  // ============================================================

  /**
   * @deprecated 請使用 createWithItems 代替
   * 創建 OM 費用（舊版單一結構）
   * 自動初始化 12 個月度記錄（actualAmount = 0）
   */
  create: protectedProcedure
    .input(createOMExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OpCo 是否存在
      const opCo = await ctx.prisma.operatingCompany.findUnique({
        where: { id: input.opCoId },
      });

      if (!opCo) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OpCo 不存在',
        });
      }

      // 如果提供了 vendorId，驗證 vendor 是否存在
      if (input.vendorId) {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { id: input.vendorId },
        });

        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '供應商不存在',
          });
        }
      }

      // CHANGE-001: 如果提供了 sourceExpenseId，驗證 expense 是否存在
      if (input.sourceExpenseId) {
        const sourceExpense = await ctx.prisma.expense.findUnique({
          where: { id: input.sourceExpenseId },
        });

        if (!sourceExpense) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '來源費用記錄不存在',
          });
        }
      }

      // 驗證日期邏輯
      const startDate = new Date(input.startDate);
      const endDate = new Date(input.endDate);

      if (startDate >= endDate) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '結束日期必須晚於開始日期',
        });
      }

      // 使用 transaction 創建 OM 費用和月度記錄
      const omExpense = await ctx.prisma.$transaction(async (tx) => {
        // 1. 創建 OM 費用表頭
        const newOMExpense = await tx.oMExpense.create({
          data: {
            name: input.name,
            description: input.description,
            financialYear: input.financialYear,
            category: input.category,
            opCoId: input.opCoId,
            budgetAmount: input.budgetAmount,
            actualSpent: 0, // 初始為 0
            vendorId: input.vendorId,
            sourceExpenseId: input.sourceExpenseId, // CHANGE-001: 來源費用追蹤
            startDate,
            endDate,
          },
        });

        // 2. 自動創建 12 個月度記錄（初始 actualAmount = 0）
        const monthlyRecords = Array.from({ length: 12 }, (_, i) => ({
          omExpenseId: newOMExpense.id,
          month: i + 1,
          actualAmount: 0,
          opCoId: input.opCoId,
        }));

        await tx.oMExpenseMonthly.createMany({
          data: monthlyRecords,
        });

        // 3. 返回完整的 OM 費用（包含月度記錄）
        return tx.oMExpense.findUnique({
          where: { id: newOMExpense.id },
          include: {
            opCo: true,
            vendor: true,
            sourceExpense: {
              // CHANGE-001: 包含來源費用詳情
              include: {
                purchaseOrder: {
                  include: {
                    project: true,
                  },
                },
              },
            },
            monthlyRecords: {
              orderBy: { month: 'asc' },
            },
          },
        });
      });

      return omExpense;
    }),

  /**
   * FEAT-007: 更新 OM 費用表頭資訊
   *
   * @description
   * 只更新表頭層級的欄位，不影響明細項目。
   * 日期欄位已移至明細項目層級，表頭只管理基本資訊。
   * 匯總數據（totalBudgetAmount, totalActualSpent）由系統自動維護。
   *
   * @input updateOMExpenseSchema
   * - id: OM費用 ID（必填）
   * - name: 表頭名稱（可選）
   * - description: 描述（可選）
   * - category: 類別（可選）
   * - vendorId: 供應商 ID（可選）
   * - sourceExpenseId: 來源費用 ID（可選）
   * - defaultOpCoId: 預設 OpCo ID（可選）
   */
  update: protectedProcedure
    .input(updateOMExpenseSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // 驗證 OM 費用是否存在
      const existing = await ctx.prisma.oMExpense.findUnique({
        where: { id },
        include: {
          items: true,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 如果提供了 vendorId，驗證 vendor 是否存在
      if (updateData.vendorId) {
        const vendor = await ctx.prisma.vendor.findUnique({
          where: { id: updateData.vendorId },
        });

        if (!vendor) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '供應商不存在',
          });
        }
      }

      // CHANGE-001: 如果提供了 sourceExpenseId，驗證 expense 是否存在
      if (updateData.sourceExpenseId) {
        const sourceExpense = await ctx.prisma.expense.findUnique({
          where: { id: updateData.sourceExpenseId },
        });

        if (!sourceExpense) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '來源費用記錄不存在',
          });
        }
      }

      // FEAT-007: 如果提供了 defaultOpCoId，驗證 OpCo 是否存在
      if (updateData.defaultOpCoId) {
        const defaultOpCo = await ctx.prisma.operatingCompany.findUnique({
          where: { id: updateData.defaultOpCoId },
        });

        if (!defaultOpCo) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: '預設 OpCo 不存在',
          });
        }
      }

      // 更新 OM 費用表頭
      const updated = await ctx.prisma.oMExpense.update({
        where: { id },
        data: updateData,
        include: {
          opCo: true,
          vendor: true,
          sourceExpense: {
            include: {
              purchaseOrder: {
                include: {
                  project: true,
                },
              },
            },
          },
          // FEAT-007: 包含明細項目
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          // 舊版月度記錄（向後兼容）
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 批量更新月度記錄
   * 接收 12 個月的數據，自動重算 actualSpent
   */
  updateMonthlyRecords: protectedProcedure
    .input(updateMonthlyRecordsSchema)
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 驗證月份是否完整（1-12）
      const months = input.monthlyData.map((d) => d.month).sort((a, b) => a - b);
      const expectedMonths = Array.from({ length: 12 }, (_, i) => i + 1);

      if (JSON.stringify(months) !== JSON.stringify(expectedMonths)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: '必須提供完整的 1-12 月數據',
        });
      }

      // FEAT-007: 向後兼容 - opCoId 現在可能為 null
      // 如果沒有 opCoId，從第一個 item 獲取或使用空字串（不應該發生）
      const legacyOpCoId = omExpense.opCoId ?? omExpense.defaultOpCoId ?? '';

      // 使用 transaction 更新月度記錄和 actualSpent
      const _result = await ctx.prisma.$transaction(async (tx) => {
        // 1. 批量更新月度記錄
        for (const monthData of input.monthlyData) {
          await tx.oMExpenseMonthly.upsert({
            where: {
              omExpenseId_month: {
                omExpenseId: input.omExpenseId,
                month: monthData.month,
              },
            },
            update: {
              actualAmount: monthData.actualAmount,
            },
            create: {
              omExpenseId: input.omExpenseId,
              month: monthData.month,
              actualAmount: monthData.actualAmount,
              opCoId: legacyOpCoId,
            },
          });
        }

        // 2. 計算總實際支出
        const monthlyRecords = await tx.oMExpenseMonthly.findMany({
          where: { omExpenseId: input.omExpenseId },
        });

        const actualSpent = monthlyRecords.reduce(
          (sum, record) => sum + record.actualAmount,
          0
        );

        // 3. 更新 OM 費用的 actualSpent
        await tx.oMExpense.update({
          where: { id: input.omExpenseId },
          data: { actualSpent },
        });

        return { success: true, actualSpent };
      });

      // 返回更新後的完整資料
      const updated = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.omExpenseId },
        include: {
          opCo: true,
          vendor: true,
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      return updated;
    }),

  /**
   * 計算年度增長率（YoY Growth Rate）
   * 對比上一年度相同名稱、類別、OpCo 的記錄
   */
  calculateYoYGrowth: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const currentOMExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
      });

      if (!currentOMExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 查找上年度同類別同名稱的 OM 費用
      const previousYear = currentOMExpense.financialYear - 1;
      const previousOMExpense = await ctx.prisma.oMExpense.findFirst({
        where: {
          name: currentOMExpense.name,
          category: currentOMExpense.category,
          opCoId: currentOMExpense.opCoId,
          financialYear: previousYear,
        },
      });

      // 如果沒有上年度數據或上年度實際支出為 0，無法計算增長率
      if (!previousOMExpense || previousOMExpense.actualSpent === 0) {
        return {
          yoyGrowthRate: null,
          message: '無上年度數據可比較，或上年度實際支出為 0',
          currentYear: currentOMExpense.financialYear,
          currentAmount: currentOMExpense.actualSpent,
          previousYear: null,
          previousAmount: null,
        };
      }

      // 計算增長率 = (本年 - 上年) / 上年 * 100
      const yoyGrowthRate =
        ((currentOMExpense.actualSpent - previousOMExpense.actualSpent) /
          previousOMExpense.actualSpent) *
        100;

      // 更新增長率
      await ctx.prisma.oMExpense.update({
        where: { id: input.id },
        data: { yoyGrowthRate },
      });

      return {
        yoyGrowthRate,
        currentYear: currentOMExpense.financialYear,
        currentAmount: currentOMExpense.actualSpent,
        previousYear,
        previousAmount: previousOMExpense.actualSpent,
      };
    }),

  /**
   * FEAT-007: 獲取 OM 費用詳情
   *
   * @description
   * 查詢單一 OM 費用的完整詳情，包含：
   * - 表頭資訊（含 totalBudgetAmount, totalActualSpent）
   * - 明細項目（按 sortOrder 排序，含 OpCo 和 Currency）
   * - 每個明細項目的月度記錄（12 個月）
   * - 舊版月度記錄（向後兼容）
   *
   * @input { id: string } - OM費用 ID
   * @returns 完整的 OMExpense 資料（含明細項目和月度記錄）
   */
  getById: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
        include: {
          // FEAT-007: Include both defaultOpCo and legacy opCo
          defaultOpCo: true,
          opCo: true,
          vendor: true,
          sourceExpense: {
            include: {
              purchaseOrder: {
                include: {
                  project: true,
                },
              },
            },
          },
          // FEAT-007: 包含明細項目
          items: {
            orderBy: { sortOrder: 'asc' },
            include: {
              opCo: true,
              currency: true,
              monthlyRecords: {
                orderBy: { month: 'asc' },
              },
            },
          },
          // 舊版月度記錄（向後兼容）
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      return omExpense;
    }),

  /**
   * FEAT-007: 獲取 OM 費用列表
   *
   * @description
   * 查詢 OM 費用列表，支援：
   * - 按財務年度、OpCo、類別過濾
   * - 分頁查詢
   * - 包含表頭匯總數據（totalBudgetAmount, totalActualSpent）
   * - 包含明細項目計數
   *
   * @input
   * - financialYear: 財務年度過濾（可選）
   * - opCoId: OpCo 過濾（可選）
   * - category: 類別過濾（可選）
   * - page: 頁碼（預設 1）
   * - limit: 每頁筆數（預設 20，最大 100）
   *
   * @returns { items, total, page, limit, totalPages }
   */
  getAll: protectedProcedure
    .input(
      z
        .object({
          financialYear: z.number().int().optional(),
          opCoId: z.string().optional(),
          category: z.string().optional(),
          page: z.number().int().min(1).optional().default(1),
          limit: z.number().int().min(1).max(100).optional().default(20),
        })
        .optional()
    )
    .query(async ({ ctx, input }) => {
      const page = input?.page ?? 1;
      const limit = input?.limit ?? 20;
      const skip = (page - 1) * limit;

      const where: Record<string, unknown> = {};

      if (input?.financialYear) {
        where.financialYear = input.financialYear;
      }

      if (input?.opCoId) {
        where.opCoId = input.opCoId;
      }

      if (input?.category) {
        where.category = input.category;
      }

      // 獲取總數
      const total = await ctx.prisma.oMExpense.count({ where });

      // 獲取列表
      const items = await ctx.prisma.oMExpense.findMany({
        where,
        include: {
          // FEAT-007: Include both defaultOpCo and legacy opCo
          defaultOpCo: true,
          opCo: true,
          vendor: true,
          // FEAT-007: 包含明細項目計數
          _count: {
            select: {
              items: true,
              monthlyRecords: true,
            },
          },
        },
        orderBy: [{ financialYear: 'desc' }, { category: 'asc' }, { name: 'asc' }],
        skip,
        take: limit,
      });

      return {
        items,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * 刪除 OM 費用
   * 會同時刪除關聯的月度記錄（onDelete: Cascade）
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // 驗證 OM 費用是否存在
      const omExpense = await ctx.prisma.oMExpense.findUnique({
        where: { id: input.id },
      });

      if (!omExpense) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'OM 費用不存在',
        });
      }

      // 刪除 OM 費用（會自動刪除月度記錄，因為設置了 onDelete: Cascade）
      await ctx.prisma.oMExpense.delete({
        where: { id: input.id },
      });

      return { success: true, message: 'OM 費用已刪除' };
    }),

  /**
   * CHANGE-005: 批量刪除 OM 費用
   * 使用事務處理確保數據一致性，按正確順序刪除關聯數據
   * @input ids - 要刪除的 OM 費用 ID 陣列
   * @returns 刪除結果（成功數量）
   */
  deleteMany: protectedProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()).min(1, '至少選擇一筆記錄'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { ids } = input;

      // 驗證所有 OM 費用是否存在
      const existingRecords = await ctx.prisma.oMExpense.findMany({
        where: { id: { in: ids } },
        select: { id: true },
      });

      if (existingRecords.length === 0) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: '找不到任何要刪除的 OM 費用記錄',
        });
      }

      const existingIds = existingRecords.map((r) => r.id);

      // 使用事務處理批量刪除（因為有 cascade 設定，直接刪除 OMExpense 即可）
      // Prisma cascade 會自動處理：OMExpenseItem → OMExpenseMonthly
      const result = await ctx.prisma.$transaction(async (tx) => {
        // 刪除所有選中的 OM 費用（cascade 會自動刪除關聯的 Item 和 Monthly）
        const deleteResult = await tx.oMExpense.deleteMany({
          where: { id: { in: existingIds } },
        });

        return deleteResult;
      });

      return {
        success: true,
        deletedCount: result.count,
        message: `成功刪除 ${result.count} 筆 OM 費用記錄`,
      };
    }),

  /**
   * 獲取所有費用類別列表（用於下拉選單）
   * CHANGE-003: 改為從統一的 ExpenseCategory 表讀取
   * @deprecated 建議改用 expenseCategory.getActive
   */
  getCategories: protectedProcedure.query(async ({ ctx }) => {
    const categories = await ctx.prisma.expenseCategory.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
      select: { name: true },
    });

    return categories.map((c) => c.name);
  }),

  /**
   * 獲取指定年度的月度支出匯總
   * 用於儀表板統計
   */
  getMonthlyTotals: protectedProcedure
    .input(
      z.object({
        financialYear: z.number().int().min(2000).max(2100),
        opCoId: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: Record<string, unknown> = {
        financialYear: input.financialYear,
      };

      if (input.opCoId) {
        where.opCoId = input.opCoId;
      }

      // 獲取所有符合條件的 OM 費用 ID
      const omExpenses = await ctx.prisma.oMExpense.findMany({
        where,
        select: { id: true },
      });

      const omExpenseIds = omExpenses.map((om) => om.id);

      // 如果沒有 OM 費用，返回 12 個月的 0
      if (omExpenseIds.length === 0) {
        return Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          totalAmount: 0,
        }));
      }

      // 獲取月度記錄，按月份分組加總
      const monthlyRecords = await ctx.prisma.oMExpenseMonthly.findMany({
        where: {
          omExpenseId: { in: omExpenseIds },
        },
        select: {
          month: true,
          actualAmount: true,
        },
      });

      // 按月份分組加總
      const monthlyTotals = Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        const records = monthlyRecords.filter((r) => r.month === month);
        const totalAmount = records.reduce((sum, r) => sum + r.actualAmount, 0);

        return {
          month,
          totalAmount,
        };
      });

      return monthlyTotals;
    }),

  /**
   * 獲取 O&M Summary 數據
   * 支援跨年度比較和多層級分組（Category → OpCo → Items）
   *
   * @description
   * 此 API 提供 O&M 費用的匯總視圖，用於 O&M Summary 頁面。
   * - 類別匯總：按 O&M Category 分組，顯示預算、實際支出和變化百分比
   * - 明細數據：按 Category → OpCo → Items 階層結構組織
   * - 支援多選 OpCo 和 Category 過濾
   *
   * @param currentYear - 當前財務年度（用於 Budget 數據）
   * @param previousYear - 上一財務年度（用於 Actual 數據）
   * @param opCoIds - 可選的 OpCo ID 過濾陣列
   * @param categories - 可選的 Category 過濾陣列
   *
   * @returns OMSummaryResponse - 包含類別匯總、明細數據和總計
   */
  getSummary: protectedProcedure
    .input(getSummarySchema)
    .query(async ({ ctx, input }): Promise<OMSummaryResponse> => {
      const { currentYear, previousYear, opCoIds, categories } = input;

      // 構建查詢條件
      // FIX: OpCo 過濾需要同時支援舊架構（表頭 opCoId）和新架構（明細 items.opCoId）
      const hasOpCoFilter = opCoIds && opCoIds.length > 0;
      const hasCategoryFilter = categories && categories.length > 0;

      // 當前年度查詢條件
      const currentYearWhere: Record<string, unknown> = {
        financialYear: currentYear,
      };

      // 上年度查詢條件（舊架構，直接過濾表頭 opCoId）
      const previousYearWhere: Record<string, unknown> = {
        financialYear: previousYear,
      };

      // OpCo 過濾 - 上年度（舊架構）
      if (hasOpCoFilter) {
        previousYearWhere.opCoId = { in: opCoIds };
      }

      // Category 過濾
      if (hasCategoryFilter) {
        currentYearWhere.category = { in: categories };
        previousYearWhere.category = { in: categories };
      }

      // FIX: 對於當前年度，OpCo 過濾需要使用 OR 條件：
      // - 舊架構：表頭的 opCoId 匹配（沒有 items 的 OMExpense）
      // - 新架構：有 items 且至少有一個 item 的 opCoId 匹配
      if (hasOpCoFilter) {
        currentYearWhere.OR = [
          // 舊架構：表頭 opCoId 匹配且沒有 items
          { opCoId: { in: opCoIds }, items: { none: {} } },
          // 新架構：有 items 且至少有一個 item 的 opCoId 匹配
          { items: { some: { opCoId: { in: opCoIds } } } },
        ];
      }

      // 查詢當前年度數據（Budget）
      // CHANGE-004: 包含 items（OMExpenseItem）以支援表頭-明細架構
      // FIX: items 也需要過濾 opCoId（新架構）
      const currentYearData = await ctx.prisma.oMExpense.findMany({
        where: currentYearWhere,
        include: {
          opCo: true,
          vendor: true,
          // CHANGE-004: 新增 items 關聯（用於表頭-明細結構）
          // FIX: 當有 OpCo 過濾時，只返回匹配的 items
          items: {
            where: hasOpCoFilter ? { opCoId: { in: opCoIds } } : undefined,
            include: {
              opCo: true,
              currency: true,
            },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: [{ category: 'asc' }, { name: 'asc' }],
      });

      // 查詢上年度數據（Actual）
      const previousYearData = await ctx.prisma.oMExpense.findMany({
        where: previousYearWhere,
        select: {
          id: true,
          name: true,
          category: true,
          opCoId: true,
          actualSpent: true,
        },
      });

      // 建立上年度數據的查找映射（按 name + category + opCoId）
      const previousYearMap = new Map<string, number>();
      for (const item of previousYearData) {
        const key = `${item.name}|${item.category}|${item.opCoId}`;
        previousYearMap.set(key, item.actualSpent);
      }

      // 計算變化百分比的輔助函數
      const calculateChangePercent = (
        currentBudget: number,
        previousActual: number | null
      ): number | null => {
        if (previousActual === null || previousActual === 0) {
          return null;
        }
        return ((currentBudget - previousActual) / previousActual) * 100;
      };

      // ========== 1. 計算類別匯總 ==========
      // CHANGE-004: 更新以支援新架構（OMExpenseItem）和舊架構（OMExpense）
      const categoryMap = new Map<
        string,
        {
          currentYearBudget: number;
          previousYearActual: number;
          itemCount: number;
        }
      >();

      for (const omExpense of currentYearData) {
        const hasItems = omExpense.items && omExpense.items.length > 0;

        if (hasItems) {
          // CHANGE-004: 新架構 - 使用 OMExpenseItem 的數據
          for (const expenseItem of omExpense.items) {
            if (!expenseItem.opCoId || !expenseItem.opCo) continue;

            const existing = categoryMap.get(omExpense.category) || {
              currentYearBudget: 0,
              previousYearActual: 0,
              itemCount: 0,
            };

            // CHANGE-007: 優先使用 lastFYActualExpense (FEAT-008 用戶輸入欄位)
            // 如果沒有則回退到 previousYearMap (自動查詢上年度資料)
            const prevKey = `${expenseItem.name}|${omExpense.category}|${expenseItem.opCoId}`;
            const prevActual = expenseItem.lastFYActualExpense ?? previousYearMap.get(prevKey) ?? 0;

            categoryMap.set(omExpense.category, {
              currentYearBudget: existing.currentYearBudget + expenseItem.budgetAmount,
              previousYearActual: existing.previousYearActual + prevActual,
              itemCount: existing.itemCount + 1,
            });
          }
        } else {
          // 舊架構 - 使用 OMExpense 的數據
          // 跳過沒有必要欄位的記錄
          if (!omExpense.opCoId || !omExpense.opCo || omExpense.budgetAmount === null || !omExpense.endDate) {
            continue;
          }

          const existing = categoryMap.get(omExpense.category) || {
            currentYearBudget: 0,
            previousYearActual: 0,
            itemCount: 0,
          };

          const prevKey = `${omExpense.name}|${omExpense.category}|${omExpense.opCoId}`;
          const prevActual = previousYearMap.get(prevKey) || 0;

          categoryMap.set(omExpense.category, {
            currentYearBudget: existing.currentYearBudget + omExpense.budgetAmount,
            previousYearActual: existing.previousYearActual + prevActual,
            itemCount: existing.itemCount + 1,
          });
        }
      }

      const categorySummary: CategorySummaryItem[] = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          currentYearBudget: data.currentYearBudget,
          previousYearActual: data.previousYearActual,
          changePercent: calculateChangePercent(data.currentYearBudget, data.previousYearActual),
          itemCount: data.itemCount,
        }))
        .sort((a, b) => a.category.localeCompare(b.category));

      // ========== 2. 計算明細數據（Category → OpCo → OMExpense Header → Items） ==========
      // CHANGE-004: 重構分組邏輯以支援表頭-明細架構
      // 新結構：Category → OpCo → OMExpense Headers → Items

      // 定義中間數據結構
      interface OpCoDetailData {
        opCoId: string;
        opCoCode: string;
        opCoName: string;
        items: ItemDetail[];  // 舊架構的直接項目
        omExpenseHeaders: Map<string, {
          omExpenseId: string;
          omExpenseName: string;
          omExpenseDescription: string | null;
          createdAt: Date;
          items: ItemDetail[];
        }>;
      }

      const categoryDetailMap = new Map<string, Map<string, OpCoDetailData>>();

      for (const omExpense of currentYearData) {
        const hasItems = omExpense.items && omExpense.items.length > 0;

        if (hasItems) {
          // ========== 新架構：處理 OMExpenseItem ==========
          for (const expenseItem of omExpense.items) {
            if (!expenseItem.opCoId || !expenseItem.opCo) continue;

            // 確保 Category 存在
            if (!categoryDetailMap.has(omExpense.category)) {
              categoryDetailMap.set(omExpense.category, new Map());
            }
            const opCoMap = categoryDetailMap.get(omExpense.category)!;

            // 確保 OpCo 存在（基於 item 的 opCoId）
            if (!opCoMap.has(expenseItem.opCoId)) {
              opCoMap.set(expenseItem.opCoId, {
                opCoId: expenseItem.opCoId,
                opCoCode: expenseItem.opCo.code,
                opCoName: expenseItem.opCo.name,
                items: [],
                omExpenseHeaders: new Map(),
              });
            }
            const opCoData = opCoMap.get(expenseItem.opCoId)!;

            // 確保 OMExpense Header 存在
            if (!opCoData.omExpenseHeaders.has(omExpense.id)) {
              opCoData.omExpenseHeaders.set(omExpense.id, {
                omExpenseId: omExpense.id,
                omExpenseName: omExpense.name,
                omExpenseDescription: omExpense.description,
                createdAt: omExpense.createdAt,
                items: [],
              });
            }
            const headerGroup = opCoData.omExpenseHeaders.get(omExpense.id)!;

            // CHANGE-007: 優先使用 lastFYActualExpense (FEAT-008 用戶輸入欄位)
            // 如果沒有則回退到 previousYearMap (自動查詢上年度資料)
            const prevKey = `${expenseItem.name}|${omExpense.category}|${expenseItem.opCoId}`;
            const previousYearActual = expenseItem.lastFYActualExpense ?? previousYearMap.get(prevKey) ?? null;

            // 添加明細項目到表頭
            headerGroup.items.push({
              id: expenseItem.id,
              name: expenseItem.name,
              description: expenseItem.description,
              currentYearBudget: expenseItem.budgetAmount,
              previousYearActual,
              changePercent: calculateChangePercent(expenseItem.budgetAmount, previousYearActual),
              endDate: expenseItem.endDate,
              omExpenseId: omExpense.id,
              isNewArchitecture: true,
            });
          }
        } else {
          // ========== 舊架構：處理沒有 items 的 OMExpense ==========
          // 跳過沒有必要欄位的記錄
          if (!omExpense.opCoId || !omExpense.opCo || omExpense.budgetAmount === null || !omExpense.endDate) {
            continue;
          }

          // 確保 Category 存在
          if (!categoryDetailMap.has(omExpense.category)) {
            categoryDetailMap.set(omExpense.category, new Map());
          }
          const opCoMap = categoryDetailMap.get(omExpense.category)!;

          // 確保 OpCo 存在
          if (!opCoMap.has(omExpense.opCoId)) {
            opCoMap.set(omExpense.opCoId, {
              opCoId: omExpense.opCoId,
              opCoCode: omExpense.opCo.code,
              opCoName: omExpense.opCo.name,
              items: [],
              omExpenseHeaders: new Map(),
            });
          }
          const opCoData = opCoMap.get(omExpense.opCoId)!;

          // 獲取上年度實際支出
          const prevKey = `${omExpense.name}|${omExpense.category}|${omExpense.opCoId}`;
          const previousYearActual = previousYearMap.get(prevKey) ?? null;

          // 添加為舊架構項目
          opCoData.items.push({
            id: omExpense.id,
            name: omExpense.name,
            description: omExpense.description,
            currentYearBudget: omExpense.budgetAmount,
            previousYearActual,
            changePercent: calculateChangePercent(omExpense.budgetAmount, previousYearActual),
            endDate: omExpense.endDate,
            omExpenseId: omExpense.id,
            isNewArchitecture: false,
          });
        }
      }

      // 轉換為最終結構並計算小計
      const detailData: CategoryDetailGroup[] = [];
      const sortedCategories = Array.from(categoryDetailMap.keys()).sort();

      for (const category of sortedCategories) {
        const opCoMap = categoryDetailMap.get(category)!;
        const opCoGroups: OpCoGroup[] = [];

        let categoryBudgetTotal = 0;
        let categoryActualTotal = 0;

        // 按 OpCo Code 排序
        const sortedOpCos = Array.from(opCoMap.values()).sort((a, b) =>
          a.opCoCode.localeCompare(b.opCoCode)
        );

        for (const opCoData of sortedOpCos) {
          // 收集所有項目（包括舊架構和新架構）用於計算小計
          const allItems: ItemDetail[] = [...opCoData.items];

          // CHANGE-004: 轉換 omExpenseHeaders 為 OMExpenseHeaderGroup 陣列
          const omExpenseHeaders: OMExpenseHeaderGroup[] = [];

          for (const [, headerData] of opCoData.omExpenseHeaders) {
            // 按項目名稱排序
            headerData.items.sort((a, b) => a.name.localeCompare(b.name));

            // 計算表頭小計
            const headerBudgetTotal = headerData.items.reduce(
              (sum, item) => sum + item.currentYearBudget,
              0
            );
            const headerActualTotal = headerData.items.reduce(
              (sum, item) => sum + (item.previousYearActual || 0),
              0
            );

            omExpenseHeaders.push({
              omExpenseId: headerData.omExpenseId,
              omExpenseName: headerData.omExpenseName,
              omExpenseDescription: headerData.omExpenseDescription,
              createdByName: '', // OMExpense 沒有 createdBy 欄位，使用空字串
              createdAt: headerData.createdAt,
              items: headerData.items,
              headerTotal: {
                currentYearBudget: headerBudgetTotal,
                previousYearActual: headerActualTotal,
                changePercent: calculateChangePercent(headerBudgetTotal, headerActualTotal),
              },
            });

            // 加入所有項目以計算 OpCo 小計
            allItems.push(...headerData.items);
          }

          // 按表頭名稱排序
          omExpenseHeaders.sort((a, b) => a.omExpenseName.localeCompare(b.omExpenseName));

          // 按項目名稱排序舊架構項目
          opCoData.items.sort((a, b) => a.name.localeCompare(b.name));

          // 計算 OpCo 小計
          const opCoBudgetTotal = allItems.reduce(
            (sum, item) => sum + item.currentYearBudget,
            0
          );
          const opCoActualTotal = allItems.reduce(
            (sum, item) => sum + (item.previousYearActual || 0),
            0
          );

          categoryBudgetTotal += opCoBudgetTotal;
          categoryActualTotal += opCoActualTotal;

          opCoGroups.push({
            opCoId: opCoData.opCoId,
            opCoCode: opCoData.opCoCode,
            opCoName: opCoData.opCoName,
            items: opCoData.items,  // 舊架構項目
            omExpenseHeaders: omExpenseHeaders.length > 0 ? omExpenseHeaders : undefined,  // CHANGE-004: 新架構表頭
            subTotal: {
              currentYearBudget: opCoBudgetTotal,
              previousYearActual: opCoActualTotal,
              changePercent: calculateChangePercent(opCoBudgetTotal, opCoActualTotal),
            },
          });
        }

        detailData.push({
          category,
          opCoGroups,
          categoryTotal: {
            currentYearBudget: categoryBudgetTotal,
            previousYearActual: categoryActualTotal,
            changePercent: calculateChangePercent(categoryBudgetTotal, categoryActualTotal),
          },
        });
      }

      // ========== 3. 計算總計 ==========
      const grandTotal: GrandTotal = {
        currentYearBudget: categorySummary.reduce((sum, c) => sum + c.currentYearBudget, 0),
        previousYearActual: categorySummary.reduce((sum, c) => sum + c.previousYearActual, 0),
        changePercent: null,
        itemCount: categorySummary.reduce((sum, c) => sum + c.itemCount, 0),
      };

      grandTotal.changePercent = calculateChangePercent(
        grandTotal.currentYearBudget,
        grandTotal.previousYearActual
      );

      // ========== 4. 返回結果 ==========
      return {
        categorySummary,
        detailData,
        grandTotal,
        meta: {
          currentYear,
          previousYear,
          selectedOpCos: opCoIds || [],
          selectedCategories: categories || [],
        },
      };
    }),

  /**
   * CHANGE-001: 查詢由指定費用衍生的 OM 費用列表
   * 用於追蹤 Expense 轉換為 OM 費用的歷史
   */
  getBySourceExpenseId: protectedProcedure
    .input(z.object({ sourceExpenseId: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const omExpenses = await ctx.prisma.oMExpense.findMany({
        where: { sourceExpenseId: input.sourceExpenseId },
        include: {
          opCo: true,
          vendor: true,
          monthlyRecords: {
            orderBy: { month: 'asc' },
          },
        },
        orderBy: { financialYear: 'desc' },
      });

      return omExpenses;
    }),
});
