/**
 * @fileoverview Project Expense 模組共用型別（FEAT-015）
 * @module components/project-expense/types
 *
 * @description
 * 對應 projectExpense router 的回傳形態（ProjectExpense → Item → Monthly 三層）。
 * 金額一律以 USD 儲存；currency 僅為次要顯示幣別。
 *
 * @related
 * - packages/api/src/routers/projectExpense.ts
 * - packages/db/prisma/schema.prisma（ProjectExpense / ProjectExpenseItem / ProjectExpenseMonthly）
 */

/** 次要顯示幣別（相容 CHANGE-042 的 DualCurrency / CurrencyInfo） */
export interface ProjectExpenseCurrency {
  id: string;
  code: string;
  name?: string;
  symbol?: string | null;
  exchangeRate?: number | null;
}

/** 月度記錄：每月同時有預算與實際（皆 USD） */
export interface ProjectExpenseMonthlyData {
  month: number;
  budgetAmount: number;
  actualAmount: number;
}

/** 明細項目 */
export interface ProjectExpenseItemData {
  id: string;
  projectExpenseId: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  currencyId?: string | null;
  categoryId?: string | null;
  opCoId?: string | null;
  // 由月度加總自動維護（API 層計算，唯讀）
  totalBudgetAmount: number;
  totalActualSpent: number;
  currency?: ProjectExpenseCurrency | null;
  category?: { id: string; code: string; name: string } | null;
  opCo?: { id: string; code: string; name: string } | null;
  monthly?: ProjectExpenseMonthlyData[];
}

/** 費用表（表頭） */
export interface ProjectExpenseData {
  id: string;
  projectId: string;
  name: string;
  description?: string | null;
  financialYear: number;
  // 由所有明細加總自動維護（API 層計算，唯讀）
  totalBudgetAmount: number;
  totalActualSpent: number;
  items: ProjectExpenseItemData[];
}
