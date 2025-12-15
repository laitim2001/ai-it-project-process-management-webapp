/**
 * @fileoverview Complete Schema Definition - 完整的資料庫 Schema 定義
 *
 * @description
 * 此檔案提供 Schema 同步的唯一真相來源。
 *
 * **方案 C: 完全自動化**
 * - 欄位列表: 自動從 Prisma.dmmf 讀取 (無需手動維護)
 * - SQL 類型: 自動從 Prisma 類型推斷 + 手動覆蓋特殊情況
 *
 * **維護說明**:
 * 1. 修改 schema.prisma 後，只需執行 `pnpm db:generate`
 * 2. 欄位列表會自動更新 (從 Prisma.dmmf 讀取)
 * 3. 只有特殊默認值需要在 COLUMN_TYPE_OVERRIDES 中手動定義
 *
 * @usage
 * - fullSchemaCompare API 使用此定義對比實際資料庫結構
 * - fullSchemaSync API 使用此定義自動修復差異
 *
 * @lastUpdated 2025-12-15
 * @version 2.0.0 (方案 C 自動化版本)
 */

import { Prisma } from '@prisma/client';

// ============================================================
// 類型定義
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

export interface ColumnTypeInfo {
  type: string;
  default?: string;
  nullable?: boolean;
}

// ============================================================
// Prisma 類型 → SQL 類型 自動映射
// ============================================================

const PRISMA_TO_SQL_TYPE_MAP: Record<string, string> = {
  'String': 'TEXT',
  'Int': 'INTEGER',
  'Float': 'DOUBLE PRECISION',
  'Boolean': 'BOOLEAN',
  'DateTime': 'TIMESTAMP(3)',
  'BigInt': 'BIGINT',
  'Decimal': 'DECIMAL',
  'Json': 'JSONB',
  'Bytes': 'BYTEA',
};

// ============================================================
// 特殊欄位類型覆蓋 (只需定義有特殊默認值的欄位)
// ============================================================

/**
 * 手動覆蓋: 只需定義有特殊默認值的欄位
 * 其他欄位會自動從 Prisma.dmmf 推斷
 */
export const COLUMN_TYPE_OVERRIDES: Record<string, Record<string, ColumnTypeInfo>> = {
  Project: {
    // FEAT-001: 有特殊默認值
    projectCode: { type: 'TEXT', default: "''" },
    globalFlag: { type: 'TEXT', default: "'Region'" },
    priority: { type: 'TEXT', default: "'Medium'" },
    // FEAT-006
    projectType: { type: 'TEXT', default: "'Project'" },
    expenseType: { type: 'TEXT', default: "'Expense'" },
    chargeBackToOpCo: { type: 'BOOLEAN', default: 'false' },
    probability: { type: 'TEXT', default: "'Medium'" },
    // FEAT-010
    isCdoReviewRequired: { type: 'BOOLEAN', default: 'false' },
    isManagerConfirmed: { type: 'BOOLEAN', default: 'false' },
    isOngoing: { type: 'BOOLEAN', default: 'false' },
  },
  PurchaseOrder: {
    date: { type: 'TIMESTAMP(3)', default: 'NOW()' },
  },
  BudgetPool: {
    isActive: { type: 'BOOLEAN', default: 'true' },
  },
  Expense: {
    requiresChargeOut: { type: 'BOOLEAN', default: 'false' },
    isOperationMaint: { type: 'BOOLEAN', default: 'false' },
  },
  OMExpense: {
    totalBudgetAmount: { type: 'DOUBLE PRECISION', default: '0' },
    totalActualSpent: { type: 'DOUBLE PRECISION', default: '0' },
    hasItems: { type: 'BOOLEAN', default: 'false' },
  },
  OMExpenseItem: {
    isOngoing: { type: 'BOOLEAN', default: 'false' },
    sortOrder: { type: 'INTEGER', default: '0' },
    actualSpent: { type: 'DOUBLE PRECISION', default: '0' },
  },
  Permission: {
    isActive: { type: 'BOOLEAN', default: 'true' },
    sortOrder: { type: 'INTEGER', default: '0' },
  },
  RolePermission: {
    createdAt: { type: 'TIMESTAMP(3)', default: 'NOW()' },
  },
  UserPermission: {
    granted: { type: 'BOOLEAN', default: 'true' },
  },
};

// ============================================================
// 完整欄位類型定義 (用於新表格創建)
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
    budgetAmount: { type: 'DOUBLE PRECISION', nullable: false },
    actualSpent: { type: 'DOUBLE PRECISION', nullable: false, default: '0' },
    lastFYActualExpense: { type: 'DOUBLE PRECISION', nullable: true },
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
// 自動化函數 - 從 Prisma.dmmf 讀取 Schema 定義
// ============================================================

/**
 * 從 Prisma.dmmf 自動獲取所有表格的欄位列表
 * 這是方案 C 的核心 - 無需手動維護欄位列表
 */
export function getSchemaDefinitionFromDMMF(): Record<string, string[]> {
  const definition: Record<string, string[]> = {};

  try {
    // 從 Prisma DMMF 讀取所有模型定義
    for (const model of Prisma.dmmf.datamodel.models) {
      // 過濾掉關聯欄位 (只保留實際的數據庫欄位)
      const columns = model.fields
        .filter(field => field.kind === 'scalar' || field.kind === 'enum')
        .map(field => field.name);

      definition[model.name] = columns;
    }
  } catch (error) {
    console.error('[schemaDefinition] 從 Prisma.dmmf 讀取失敗:', error);
    // 返回空對象，讓調用方處理
  }

  return definition;
}

/**
 * 從 Prisma.dmmf 獲取欄位的詳細信息
 */
export function getFieldInfoFromDMMF(tableName: string, fieldName: string): {
  type: string;
  isRequired: boolean;
  hasDefaultValue: boolean;
  default?: unknown;
} | null {
  try {
    const model = Prisma.dmmf.datamodel.models.find(m => m.name === tableName);
    if (!model) return null;

    const field = model.fields.find(f => f.name === fieldName);
    if (!field) return null;

    return {
      type: field.type,
      isRequired: field.isRequired,
      hasDefaultValue: field.hasDefaultValue,
      default: field.default,
    };
  } catch (error) {
    console.error(`[schemaDefinition] 獲取欄位信息失敗: ${tableName}.${fieldName}`, error);
    return null;
  }
}

/**
 * 將 Prisma 類型轉換為 SQL 類型
 */
export function prismaTypeToSqlType(prismaType: string): string {
  return PRISMA_TO_SQL_TYPE_MAP[prismaType] || 'TEXT';
}

/**
 * 生成 ALTER TABLE ADD COLUMN 語句
 * 自動從 Prisma.dmmf 推斷類型，支援手動覆蓋
 */
export function generateAddColumnSQL(tableName: string, columnName: string): string | null {
  // 1. 檢查是否有手動覆蓋
  const override = COLUMN_TYPE_OVERRIDES[tableName]?.[columnName];
  if (override) {
    const defaultClause = override.default ? ` DEFAULT ${override.default}` : '';
    return `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${override.type}${defaultClause}`;
  }

  // 2. 從 Prisma.dmmf 自動推斷
  const fieldInfo = getFieldInfoFromDMMF(tableName, columnName);
  if (!fieldInfo) {
    console.warn(`[schemaDefinition] 找不到欄位定義: ${tableName}.${columnName}`);
    return null;
  }

  const sqlType = prismaTypeToSqlType(fieldInfo.type);
  let defaultClause = '';

  // 處理默認值
  if (fieldInfo.hasDefaultValue && fieldInfo.default !== undefined) {
    const defaultVal = fieldInfo.default;
    if (typeof defaultVal === 'object' && defaultVal !== null) {
      // Prisma 默認值對象 (如 { name: 'now', args: [] })
      const defaultObj = defaultVal as { name?: string };
      if (defaultObj.name === 'now') {
        defaultClause = ' DEFAULT NOW()';
      } else if (defaultObj.name === 'uuid') {
        defaultClause = ' DEFAULT gen_random_uuid()';
      } else if (defaultObj.name === 'autoincrement') {
        // autoincrement 通常用於 SERIAL 類型，不需要 DEFAULT
      }
    } else if (typeof defaultVal === 'string') {
      defaultClause = ` DEFAULT '${defaultVal}'`;
    } else if (typeof defaultVal === 'number') {
      defaultClause = ` DEFAULT ${defaultVal}`;
    } else if (typeof defaultVal === 'boolean') {
      defaultClause = ` DEFAULT ${defaultVal}`;
    }
  }

  return `ALTER TABLE "${tableName}" ADD COLUMN IF NOT EXISTS "${columnName}" ${sqlType}${defaultClause}`;
}

// ============================================================
// 向後兼容的靜態定義 (作為 DMMF 的備份)
// ============================================================

/**
 * 靜態 Schema 定義 - 作為 DMMF 讀取失敗時的備份
 *
 * @deprecated 優先使用 getSchemaDefinitionFromDMMF()
 */
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
    'isActive'
  ],

  Project: [
    'id', 'name', 'description', 'status', 'managerId', 'supervisorId',
    'budgetPoolId', 'budgetCategoryId', 'requestedBudget', 'approvedBudget',
    'startDate', 'endDate', 'chargeOutDate', 'createdAt', 'updatedAt',
    // FEAT-001
    'projectCode', 'globalFlag', 'priority', 'currencyId',
    // FEAT-006
    'projectCategory', 'projectType', 'expenseType', 'chargeBackToOpCo',
    'chargeOutMethod', 'probability', 'team', 'personInCharge',
    // FEAT-010
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
    'totalBudgetAmount', 'totalActualSpent', 'defaultOpCoId',
    'opCoId', 'budgetAmount', 'actualSpent', 'startDate', 'endDate',
    'yoyGrowthRate', 'vendorId', 'sourceExpenseId',
    'createdAt', 'updatedAt', 'hasItems'
  ],

  OMExpenseItem: [
    'id', 'omExpenseId', 'name', 'description', 'sortOrder',
    'budgetAmount', 'actualSpent', 'lastFYActualExpense',
    'currencyId', 'opCoId', 'startDate', 'endDate', 'isOngoing',
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
// 向後兼容別名
// ============================================================

/** @deprecated 使用 COLUMN_TYPE_OVERRIDES */
export const COLUMN_TYPE_MAP = COLUMN_TYPE_OVERRIDES;

// ============================================================
// 輔助函數
// ============================================================

/**
 * 獲取某個表格的所有預期欄位
 * 優先從 DMMF 讀取，失敗則使用靜態定義
 */
export function getExpectedColumns(tableName: string): string[] {
  // 優先嘗試從 DMMF 獲取
  try {
    const dmmfDefinition = getSchemaDefinitionFromDMMF();
    if (dmmfDefinition[tableName] && dmmfDefinition[tableName].length > 0) {
      return dmmfDefinition[tableName];
    }
  } catch (error) {
    console.warn(`[schemaDefinition] DMMF 讀取失敗，使用靜態定義: ${tableName}`);
  }

  // 備份: 使用靜態定義
  return FULL_SCHEMA_DEFINITION[tableName] || [];
}

/**
 * 獲取所有表格名稱
 * 優先從 DMMF 讀取，失敗則使用靜態定義
 */
export function getAllTableNames(): string[] {
  try {
    const dmmfDefinition = getSchemaDefinitionFromDMMF();
    const dmmfTables = Object.keys(dmmfDefinition);
    if (dmmfTables.length > 0) {
      return dmmfTables;
    }
  } catch (error) {
    console.warn('[schemaDefinition] DMMF 讀取失敗，使用靜態定義');
  }

  return Object.keys(FULL_SCHEMA_DEFINITION);
}

/**
 * 獲取欄位的 SQL 類型和預設值
 * 優先使用手動覆蓋，否則自動推斷
 */
export function getColumnTypeInfo(tableName: string, columnName: string): ColumnTypeInfo | null {
  // 1. 檢查手動覆蓋
  const override = COLUMN_TYPE_OVERRIDES[tableName]?.[columnName];
  if (override) {
    return override;
  }

  // 2. 從 DMMF 自動推斷
  const fieldInfo = getFieldInfoFromDMMF(tableName, columnName);
  if (fieldInfo) {
    return {
      type: prismaTypeToSqlType(fieldInfo.type),
      nullable: !fieldInfo.isRequired,
    };
  }

  return null;
}

/**
 * 獲取完整的 Schema 定義（用於 fullSchemaCompare）
 * 優先從 DMMF 讀取
 */
export function getFullSchemaDefinition(): Record<string, string[]> {
  try {
    const dmmfDefinition = getSchemaDefinitionFromDMMF();
    if (Object.keys(dmmfDefinition).length > 0) {
      console.log(`[schemaDefinition] 從 DMMF 讀取成功: ${Object.keys(dmmfDefinition).length} 個表格`);
      return dmmfDefinition;
    }
  } catch (error) {
    console.warn('[schemaDefinition] DMMF 讀取失敗，使用靜態定義');
  }

  return FULL_SCHEMA_DEFINITION;
}
