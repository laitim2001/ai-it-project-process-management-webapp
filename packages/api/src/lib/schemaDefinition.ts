/**
 * @fileoverview Complete Schema Definition - 完整的資料庫 Schema 定義
 *
 * @description
 * 此檔案從 schema.prisma 提取所有表格和欄位定義，作為 Schema 同步的唯一真相來源。
 * 當 schema.prisma 有任何變更時，此檔案必須同步更新。
 *
 * @usage
 * - fullSchemaCompare API 使用此定義對比實際資料庫結構
 * - fullSchemaSync API 使用此定義自動修復差異
 *
 * @lastUpdated 2025-12-15
 * @syncedWith schema.prisma
 */

// ============================================================
// 欄位類型定義
// ============================================================

export interface ColumnDefinition {
  name: string;
  type: 'TEXT' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'BIGINT';
  nullable: boolean;
  defaultValue?: string;
  isArray?: boolean;
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
}

// ============================================================
// 完整的 Schema 定義 (從 schema.prisma 提取)
// ============================================================

export const FULL_SCHEMA_DEFINITION: Record<string, string[]> = {
  // ==================================================================
  // 1. 核心使用者與權限模型 (Core User & Auth Models)
  // ==================================================================
  User: [
    'id', 'email', 'emailVerified', 'name', 'image', 'password',
    'roleId', 'createdAt', 'updatedAt'
  ],

  Account: [
    'id', 'userId', 'type', 'provider', 'providerAccountId',
    'refresh_token', 'access_token', 'expires_at', 'token_type',
    'scope', 'id_token', 'session_state'
  ],

  Session: [
    'id', 'sessionToken', 'userId', 'expires'
  ],

  VerificationToken: [
    'identifier', 'token', 'expires'
  ],

  Role: [
    'id', 'name'
  ],

  // FEAT-011: Permission Management System
  Permission: [
    'id', 'code', 'name', 'category', 'description',
    'isActive', 'sortOrder', 'createdAt', 'updatedAt'
  ],

  RolePermission: [
    'id', 'roleId', 'permissionId', 'createdAt'
  ],

  UserPermission: [
    'id', 'userId', 'permissionId', 'granted', 'createdBy',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 2. 核心業務流程模型 (Core Business Process Models)
  // ==================================================================
  BudgetPool: [
    'id', 'name', 'totalAmount', 'usedAmount', 'financialYear',
    'description', 'currencyId', 'createdAt', 'updatedAt',
    // Post-MVP 可能需要的欄位
    'isActive'
  ],

  Project: [
    'id', 'name', 'description', 'status', 'managerId', 'supervisorId',
    'budgetPoolId', 'budgetCategoryId', 'requestedBudget', 'approvedBudget',
    'startDate', 'endDate', 'chargeOutDate', 'createdAt', 'updatedAt',
    // FEAT-001: 專案欄位擴展 (4 個新欄位)
    'projectCode', 'globalFlag', 'priority', 'currencyId',
    // FEAT-006: Project Summary Tab 新增欄位 (8 個新欄位)
    'projectCategory', 'projectType', 'expenseType', 'chargeBackToOpCo',
    'chargeOutMethod', 'probability', 'team', 'personInCharge',
    // FEAT-010: Project Data Import 新增欄位 (7 個新欄位)
    'fiscalYear', 'isCdoReviewRequired', 'isManagerConfirmed',
    'payForWhat', 'payToWhom', 'isOngoing', 'lastFYActualExpense'
  ],

  BudgetProposal: [
    'id', 'title', 'amount', 'status', 'projectId',
    'proposalFilePath', 'proposalFileName', 'proposalFileSize',
    'meetingDate', 'meetingNotes', 'presentedBy',
    'approvedAmount', 'approvedBy', 'approvedAt', 'rejectionReason',
    'createdAt', 'updatedAt'
  ],

  Vendor: [
    'id', 'name', 'contactPerson', 'contactEmail', 'phone',
    'createdAt', 'updatedAt'
  ],

  Quote: [
    'id', 'filePath', 'uploadDate', 'amount', 'vendorId', 'projectId',
    'createdAt', 'updatedAt'
  ],

  PurchaseOrder: [
    'id', 'poNumber', 'name', 'description', 'date', 'totalAmount',
    'currencyId', 'status', 'projectId', 'vendorId', 'quoteId',
    'approvedDate', 'createdAt', 'updatedAt'
  ],

  Expense: [
    'id', 'name', 'description', 'totalAmount', 'currencyId', 'status',
    'invoiceNumber', 'invoiceDate', 'invoiceFilePath',
    'requiresChargeOut', 'isOperationMaint',
    'purchaseOrderId', 'budgetCategoryId', 'vendorId',
    'expenseDate', 'approvedDate', 'paidDate',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 3. 輔助模型 (Supporting Models)
  // ==================================================================
  Comment: [
    'id', 'content', 'userId', 'budgetProposalId', 'createdAt'
  ],

  History: [
    'id', 'action', 'details', 'userId', 'budgetProposalId', 'createdAt'
  ],

  // ==================================================================
  // 4. 通知系統模型 (Notification System Models)
  // ==================================================================
  Notification: [
    'id', 'userId', 'type', 'title', 'message', 'link',
    'isRead', 'emailSent', 'entityType', 'entityId',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 5. 營運公司與預算類別模型
  // ==================================================================
  OperatingCompany: [
    'id', 'code', 'name', 'description', 'isActive',
    'createdAt', 'updatedAt'
  ],

  ProjectChargeOutOpCo: [
    'id', 'projectId', 'opCoId', 'createdAt'
  ],

  UserOperatingCompany: [
    'id', 'userId', 'operatingCompanyId', 'createdAt', 'createdBy'
  ],

  BudgetCategory: [
    'id', 'budgetPoolId', 'categoryName', 'categoryCode', 'description',
    'totalAmount', 'usedAmount', 'sortOrder', 'isActive',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 6. 採購單與費用明細模型
  // ==================================================================
  PurchaseOrderItem: [
    'id', 'purchaseOrderId', 'itemName', 'description',
    'quantity', 'unitPrice', 'subtotal', 'sortOrder',
    'createdAt', 'updatedAt'
  ],

  ExpenseItem: [
    'id', 'expenseId', 'itemName', 'description', 'amount',
    'category', 'categoryId', 'chargeOutOpCoId', 'sortOrder',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 7. 操作與維護費用模型 (OM Expense Models)
  // ==================================================================
  ExpenseCategory: [
    'id', 'code', 'name', 'description', 'sortOrder', 'isActive',
    'createdAt', 'updatedAt'
  ],

  OMExpense: [
    'id', 'name', 'description', 'financialYear', 'category', 'categoryId',
    // FEAT-007: 新增匯總欄位
    'totalBudgetAmount', 'totalActualSpent', 'defaultOpCoId',
    // 舊版欄位 (DEPRECATED)
    'opCoId', 'budgetAmount', 'actualSpent', 'startDate', 'endDate',
    'yoyGrowthRate', 'vendorId', 'sourceExpenseId',
    'createdAt', 'updatedAt',
    // FEAT-007: hasItems 標記 (可能需要)
    'hasItems'
  ],

  // FEAT-007: OM費用明細項目
  OMExpenseItem: [
    'id', 'omExpenseId', 'name', 'description', 'sortOrder',
    'budgetAmount', 'actualSpent',
    // FEAT-008: 上年度實際支出
    'lastFYActualExpense',
    'currencyId', 'opCoId', 'startDate', 'endDate',
    // CHANGE-011: 持續進行中標記
    'isOngoing',
    'createdAt', 'updatedAt'
  ],

  OMExpenseMonthly: [
    'id', 'omExpenseItemId', 'omExpenseId', 'month',
    'actualAmount', 'opCoId', 'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 8. 費用轉嫁模型 (Charge Out Models)
  // ==================================================================
  ChargeOut: [
    'id', 'name', 'description', 'projectId', 'opCoId',
    'totalAmount', 'status', 'debitNoteNumber', 'issueDate',
    'paymentDate', 'confirmedBy', 'confirmedAt',
    'createdAt', 'updatedAt'
  ],

  ChargeOutItem: [
    'id', 'chargeOutId', 'expenseItemId', 'expenseId',
    'amount', 'description', 'sortOrder',
    'createdAt', 'updatedAt'
  ],

  // ==================================================================
  // 9. 貨幣管理模型 (Currency Management Models)
  // ==================================================================
  Currency: [
    'id', 'code', 'name', 'symbol', 'exchangeRate', 'active',
    'createdAt', 'updatedAt'
  ],
};

// ============================================================
// 欄位類型對照表 (用於生成 ALTER TABLE 語句)
// ============================================================

export const COLUMN_TYPE_MAP: Record<string, Record<string, { type: string; default?: string }>> = {
  Project: {
    // FEAT-001
    projectCode: { type: 'TEXT', default: "''" },
    globalFlag: { type: 'TEXT', default: "'Region'" },
    priority: { type: 'TEXT', default: "'Medium'" },
    currencyId: { type: 'TEXT' },
    // FEAT-006
    projectCategory: { type: 'TEXT' },
    projectType: { type: 'TEXT', default: "'Project'" },
    expenseType: { type: 'TEXT', default: "'Expense'" },
    chargeBackToOpCo: { type: 'BOOLEAN', default: 'false' },
    chargeOutMethod: { type: 'TEXT' },
    probability: { type: 'TEXT', default: "'Medium'" },
    team: { type: 'TEXT' },
    personInCharge: { type: 'TEXT' },
    // FEAT-010
    fiscalYear: { type: 'INTEGER' },
    isCdoReviewRequired: { type: 'BOOLEAN', default: 'false' },
    isManagerConfirmed: { type: 'BOOLEAN', default: 'false' },
    payForWhat: { type: 'TEXT' },
    payToWhom: { type: 'TEXT' },
    isOngoing: { type: 'BOOLEAN', default: 'false' },
    lastFYActualExpense: { type: 'FLOAT' },
  },
  PurchaseOrder: {
    date: { type: 'TIMESTAMP(3)', default: 'NOW()' },
    currencyId: { type: 'TEXT' },
    approvedDate: { type: 'TIMESTAMP(3)' },
  },
  BudgetPool: {
    isActive: { type: 'BOOLEAN', default: 'true' },
    description: { type: 'TEXT' },
    currencyId: { type: 'TEXT' },
  },
  Expense: {
    budgetCategoryId: { type: 'TEXT' },
    vendorId: { type: 'TEXT' },
    currencyId: { type: 'TEXT' },
    requiresChargeOut: { type: 'BOOLEAN', default: 'false' },
    isOperationMaint: { type: 'BOOLEAN', default: 'false' },
    approvedDate: { type: 'TIMESTAMP(3)' },
    paidDate: { type: 'TIMESTAMP(3)' },
  },
  ExpenseItem: {
    categoryId: { type: 'TEXT' },
    chargeOutOpCoId: { type: 'TEXT' },
  },
  OMExpense: {
    categoryId: { type: 'TEXT' },
    sourceExpenseId: { type: 'TEXT' },
    totalBudgetAmount: { type: 'FLOAT', default: '0' },
    totalActualSpent: { type: 'FLOAT', default: '0' },
    defaultOpCoId: { type: 'TEXT' },
    hasItems: { type: 'BOOLEAN', default: 'false' },
  },
  OMExpenseItem: {
    lastFYActualExpense: { type: 'FLOAT' },
    isOngoing: { type: 'BOOLEAN', default: 'false' },
  },
};

// ============================================================
// 完整欄位類型對照 (用於新表格創建)
// ============================================================

export const COMPLETE_COLUMN_TYPES: Record<string, Record<string, { type: string; nullable: boolean; default?: string }>> = {
  Permission: {
    id: { type: 'TEXT', nullable: false },
    code: { type: 'TEXT', nullable: false },
    name: { type: 'TEXT', nullable: false },
    category: { type: 'TEXT', nullable: false },
    description: { type: 'TEXT', nullable: true },
    isActive: { type: 'BOOLEAN', nullable: false, default: 'true' },
    sortOrder: { type: 'INTEGER', nullable: false, default: '0' },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
    updatedAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
  },
  RolePermission: {
    id: { type: 'TEXT', nullable: false },
    roleId: { type: 'INTEGER', nullable: false },
    permissionId: { type: 'TEXT', nullable: false },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
  },
  UserPermission: {
    id: { type: 'TEXT', nullable: false },
    userId: { type: 'TEXT', nullable: false },
    permissionId: { type: 'TEXT', nullable: false },
    granted: { type: 'BOOLEAN', nullable: false, default: 'true' },
    createdBy: { type: 'TEXT', nullable: true },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
    updatedAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
  },
  ProjectChargeOutOpCo: {
    id: { type: 'TEXT', nullable: false },
    projectId: { type: 'TEXT', nullable: false },
    opCoId: { type: 'TEXT', nullable: false },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
  },
  UserOperatingCompany: {
    id: { type: 'TEXT', nullable: false },
    userId: { type: 'TEXT', nullable: false },
    operatingCompanyId: { type: 'TEXT', nullable: false },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
    createdBy: { type: 'TEXT', nullable: true },
  },
  OMExpenseItem: {
    id: { type: 'TEXT', nullable: false },
    omExpenseId: { type: 'TEXT', nullable: false },
    name: { type: 'TEXT', nullable: false },
    description: { type: 'TEXT', nullable: true },
    sortOrder: { type: 'INTEGER', nullable: false, default: '0' },
    budgetAmount: { type: 'FLOAT', nullable: false },
    actualSpent: { type: 'FLOAT', nullable: false, default: '0' },
    lastFYActualExpense: { type: 'FLOAT', nullable: true },
    currencyId: { type: 'TEXT', nullable: true },
    opCoId: { type: 'TEXT', nullable: false },
    startDate: { type: 'TIMESTAMP(3)', nullable: true },
    endDate: { type: 'TIMESTAMP(3)', nullable: true },
    isOngoing: { type: 'BOOLEAN', nullable: false, default: 'false' },
    createdAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
    updatedAt: { type: 'TIMESTAMP(3)', nullable: false, default: 'NOW()' },
  },
};

// ============================================================
// 輔助函數
// ============================================================

/**
 * 獲取某個表格的所有預期欄位
 */
export function getExpectedColumns(tableName: string): string[] {
  return FULL_SCHEMA_DEFINITION[tableName] || [];
}

/**
 * 獲取所有表格名稱
 */
export function getAllTableNames(): string[] {
  return Object.keys(FULL_SCHEMA_DEFINITION);
}

/**
 * 獲取欄位的 SQL 類型和預設值
 */
export function getColumnTypeInfo(tableName: string, columnName: string): { type: string; default?: string } | null {
  return COLUMN_TYPE_MAP[tableName]?.[columnName] || null;
}
