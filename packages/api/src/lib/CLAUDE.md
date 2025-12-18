# API Libraries - API 工具層

> **相關規則**: 請參閱 `.claude/rules/backend-api.md` 獲取 tRPC 後端 API 完整開發規範

## 📋 目錄用途

此目錄包含 API 層使用的工具和服務模組，為 tRPC Routers 提供可重用的業務邏輯和基礎設施服務。

## 🏗️ 檔案結構

```
lib/
├── email.ts              # EmailService (Nodemailer + Ethereal/SendGrid)
├── passwordValidation.ts # 密碼驗證邏輯 (CHANGE-032)
└── schemaDefinition.ts   # Schema 同步定義 (方案 C 自動化)
```

---

## 📧 EmailService (`email.ts`)

### 概述
統一的郵件發送服務，支援開發環境和生產環境，用於提案和費用審批通知。

**Story 來源**: Epic 8 - Story 8.1 & 8.2 (Notification System - Email)

### 技術架構

```
┌─────────────────────────────────────────────────────────────────┐
│                     EmailService (Singleton)                     │
├─────────────────────────────────────────────────────────────────┤
│ Development                    │ Production                      │
│ ├── Nodemailer                │ ├── Nodemailer                  │
│ └── Ethereal Email (虛擬郵箱) │ └── SMTP / SendGrid             │
│     ↓                         │     ↓                            │
│ console.log + Preview URL     │ Real Email Delivery             │
└─────────────────────────────────────────────────────────────────┘
```

### 類別定義

```typescript
class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    this.initializeTransporter();
  }

  // 開發環境: Ethereal Email (虛擬測試郵箱)
  // 生產環境: SMTP 或 SendGrid
  private async initializeTransporter(): Promise<void>;

  // 核心發送方法
  private async sendEmail(options: EmailOptions): Promise<boolean>;

  // 公開方法 - 提案相關
  async sendProposalSubmittedEmail(data: ProposalEmailData): Promise<boolean>;
  async sendProposalStatusEmail(data: ProposalStatusEmailData): Promise<boolean>;

  // 公開方法 - 費用相關
  async sendExpenseSubmittedEmail(data: ExpenseEmailData): Promise<boolean>;
  async sendExpenseApprovedEmail(data: ExpenseEmailData): Promise<boolean>;
}
```

### Interface 定義

```typescript
// 基礎郵件選項
interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

// 提案提交通知數據
interface ProposalEmailData {
  to: string;
  proposalTitle: string;
  proposalLink: string;
  submitterName: string;
  supervisorName?: string;
}

// 提案狀態變更通知數據
interface ProposalStatusEmailData {
  to: string;
  proposalTitle: string;
  proposalLink: string;
  status: 'approved' | 'rejected' | 'more_info';
  comment?: string;
  reviewerName: string;
}

// 費用通知數據
interface ExpenseEmailData {
  to: string;
  expenseAmount: number;
  projectName: string;
  expenseLink: string;
  submitterName: string;
}
```

### 郵件模板設計

每個郵件方法都包含完整的 HTML 模板，支援：
- 響應式設計 (max-width: 600px)
- 狀態特定的顏色主題
- 專業的郵件排版 (header → content → footer)

```typescript
// 狀態顏色配置
const statusConfig = {
  approved: { emoji: '✅', title: '提案已批准', color: '#10b981' },
  rejected: { emoji: '❌', title: '提案被拒絕', color: '#ef4444' },
  more_info: { emoji: 'ℹ️', title: '需要補充資訊', color: '#f59e0b' }
};
```

### 使用範例

```typescript
// packages/api/src/routers/budgetProposal.ts
import { emailService } from '../lib/email';

// 提案提交時通知主管
await emailService.sendProposalSubmittedEmail({
  to: supervisor.email,
  proposalTitle: proposal.title,
  proposalLink: `${process.env.NEXTAUTH_URL}/proposals/${proposal.id}`,
  submitterName: user.name,
  supervisorName: supervisor.name,
});

// 提案審批後通知專案經理
await emailService.sendProposalStatusEmail({
  to: manager.email,
  proposalTitle: proposal.title,
  proposalLink: `${process.env.NEXTAUTH_URL}/proposals/${proposal.id}`,
  status: 'approved',
  reviewerName: ctx.session.user.name,
});
```

### 環境變數配置

```bash
# 開發環境 - 自動使用 Ethereal Email（無需配置）
# 郵件會顯示 Preview URL 在 console

# 生產環境 - SMTP 配置
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-user
SMTP_PASS=your-password
EMAIL_FROM="IT專案管理平台 <noreply@example.com>"

# 生產環境 - SendGrid（待實現）
SENDGRID_API_KEY=SG.xxx
```

---

## 🔐 Password Validation (`passwordValidation.ts`)

### 概述
密碼強度驗證模組，提供詳細的驗證結果和錯誤訊息。

**Feature 來源**: CHANGE-032 - 用戶密碼管理功能

### 密碼要求

```typescript
export const PASSWORD_REQUIREMENTS = {
  /** 最小密碼長度 */
  MIN_LENGTH: 12,
  /** 最少需要的特殊字符數（大寫、數字、符號的總和） */
  MIN_SPECIAL_CHARS: 6,
  /** 允許的符號字符 */
  ALLOWED_SYMBOLS: '!@#$%^&*()_+-=[]{};\':"|,./<>?`~',
} as const;
```

### 驗證結果結構

```typescript
interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  details: {
    length: number;           // 實際長度
    minLength: number;        // 最小長度要求
    uppercaseCount: number;   // 大寫字母數量
    digitCount: number;       // 數字數量
    symbolCount: number;      // 符號數量
    specialCharCount: number; // 特殊字符總數
    requiredSpecialChars: number; // 要求的特殊字符數
  };
}
```

### 導出函數

```typescript
/**
 * 完整驗證 - 返回詳細結果
 */
export function validatePasswordStrength(password: string): PasswordValidationResult;

/**
 * 簡單驗證 - 返回布林值
 */
export function isPasswordValid(password: string): boolean;

/**
 * 獲取錯誤訊息 - 返回單一字符串
 */
export function getPasswordValidationError(password: string): string | null;
```

### 使用範例

```typescript
// packages/api/src/routers/user.ts - setPassword procedure
import { validatePasswordStrength } from '../lib/passwordValidation';

export const userRouter = createTRPCRouter({
  setPassword: protectedProcedure
    .input(z.object({
      currentPassword: z.string().optional(),
      newPassword: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // 驗證新密碼強度
      const validation = validatePasswordStrength(input.newPassword);
      if (!validation.isValid) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: validation.errors.join('；'),
        });
      }

      // 加密並儲存密碼...
    }),
});
```

```typescript
// 前端密碼強度顯示 (PasswordStrengthIndicator 組件)
const result = validatePasswordStrength(password);
const strengthPercent = Math.min(100,
  (result.details.length / result.details.minLength * 50) +
  (result.details.specialCharCount / result.details.requiredSpecialChars * 50)
);
```

---

## 🔄 Schema Definition (`schemaDefinition.ts`)

### 概述
Schema 同步的唯一真相來源，實現 **方案 C: 完全自動化** - 從 Prisma DMMF 自動讀取欄位列表。

**用途**: 支援 Health API 的 `fullSchemaCompare` 和 `fullSchemaSync` 功能，用於 Azure 環境 Schema 同步。

### 自動化架構

```
┌───────────────────────────────────────────────────────────────────┐
│                    Schema 同步自動化流程                           │
├───────────────────────────────────────────────────────────────────┤
│                                                                    │
│  修改 schema.prisma                                               │
│         ↓                                                         │
│  pnpm db:generate                                                 │
│         ↓                                                         │
│  Prisma.dmmf 自動更新                                             │
│         ↓                                                         │
│  部署到 Azure                                                     │
│         ↓                                                         │
│  Health API 自動讀取最新 schema (getSchemaDefinitionFromDMMF)     │
│         ↓                                                         │
│  fullSchemaSync 自動修復差異                                      │
│                                                                    │
└───────────────────────────────────────────────────────────────────┘
```

### 核心類型定義

```typescript
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
```

### Prisma → SQL 類型映射

```typescript
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
```

### 特殊欄位覆蓋

只需定義有特殊默認值的欄位，其他欄位自動從 DMMF 推斷：

```typescript
export const COLUMN_TYPE_OVERRIDES: Record<string, Record<string, ColumnTypeInfo>> = {
  Project: {
    projectCode: { type: 'TEXT', default: "''" },
    globalFlag: { type: 'TEXT', default: "'Region'" },
    priority: { type: 'TEXT', default: "'Medium'" },
    projectType: { type: 'TEXT', default: "'Project'" },
    expenseType: { type: 'TEXT', default: "'Expense'" },
    chargeBackToOpCo: { type: 'BOOLEAN', default: 'false' },
    probability: { type: 'TEXT', default: "'Medium'" },
    isCdoReviewRequired: { type: 'BOOLEAN', default: 'false' },
    isManagerConfirmed: { type: 'BOOLEAN', default: 'false' },
    isOngoing: { type: 'BOOLEAN', default: 'false' },
  },
  // ... 其他表格的特殊欄位
};
```

### 核心函數

```typescript
/**
 * 從 Prisma.dmmf 自動獲取所有表格的欄位列表
 * 這是方案 C 的核心 - 無需手動維護欄位列表
 */
export function getSchemaDefinitionFromDMMF(): Record<string, string[]>;

/**
 * 從 Prisma.dmmf 獲取欄位的詳細信息
 */
export function getFieldInfoFromDMMF(tableName: string, fieldName: string): {
  type: string;
  isRequired: boolean;
  hasDefaultValue: boolean;
  default?: unknown;
} | null;

/**
 * 將 Prisma 類型轉換為 SQL 類型
 */
export function prismaTypeToSqlType(prismaType: string): string;

/**
 * 生成 ALTER TABLE ADD COLUMN 語句
 * 自動從 Prisma.dmmf 推斷類型，支援手動覆蓋
 */
export function generateAddColumnSQL(tableName: string, columnName: string): string | null;

/**
 * 獲取某個表格的所有預期欄位
 * 優先從 DMMF 讀取，失敗則使用靜態定義
 */
export function getExpectedColumns(tableName: string): string[];

/**
 * 獲取所有表格名稱
 */
export function getAllTableNames(): string[];

/**
 * 獲取欄位的 SQL 類型和預設值
 */
export function getColumnTypeInfo(tableName: string, columnName: string): ColumnTypeInfo | null;

/**
 * 獲取完整的 Schema 定義（用於 fullSchemaCompare）
 */
export function getFullSchemaDefinition(): Record<string, string[]>;
```

### 靜態備份定義

當 DMMF 讀取失敗時使用的靜態 Schema 定義，包含所有 31 個 Prisma 模型：

```typescript
export const FULL_SCHEMA_DEFINITION: Record<string, string[]> = {
  // 1. 核心使用者與權限模型
  User: ['id', 'email', 'emailVerified', 'name', 'image', 'password', 'roleId', 'createdAt', 'updatedAt'],
  Account: ['id', 'userId', 'type', 'provider', 'providerAccountId', ...],
  Session: ['id', 'sessionToken', 'userId', 'expires'],
  VerificationToken: ['identifier', 'token', 'expires'],
  Role: ['id', 'name'],
  Permission: ['id', 'code', 'name', 'category', 'description', 'isActive', 'sortOrder', ...],
  RolePermission: ['id', 'roleId', 'permissionId', 'createdAt'],
  UserPermission: ['id', 'userId', 'permissionId', 'granted', 'createdBy', ...],

  // 2. 核心業務流程模型
  BudgetPool: ['id', 'name', 'totalAmount', 'usedAmount', 'financialYear', ...],
  Project: ['id', 'name', 'description', 'status', 'managerId', 'supervisorId', ...], // 27+ 欄位
  BudgetProposal: ['id', 'title', 'amount', 'status', 'projectId', ...],
  Vendor: ['id', 'name', 'contactPerson', 'contactEmail', 'phone', ...],
  Quote: ['id', 'filePath', 'uploadDate', 'amount', 'vendorId', 'projectId', ...],
  PurchaseOrder: ['id', 'poNumber', 'name', 'description', 'date', 'totalAmount', ...],
  Expense: ['id', 'name', 'description', 'totalAmount', 'currencyId', 'status', ...],

  // 3. 輔助模型
  Comment: ['id', 'content', 'userId', 'budgetProposalId', 'createdAt'],
  History: ['id', 'action', 'details', 'userId', 'budgetProposalId', 'createdAt'],
  Notification: ['id', 'userId', 'type', 'title', 'message', 'link', ...],

  // 4. 營運公司與預算類別模型
  OperatingCompany: ['id', 'code', 'name', 'description', 'isActive', ...],
  ProjectChargeOutOpCo: ['id', 'projectId', 'opCoId', 'createdAt'],
  UserOperatingCompany: ['id', 'userId', 'operatingCompanyId', 'createdAt', 'createdBy'],
  BudgetCategory: ['id', 'budgetPoolId', 'categoryName', 'categoryCode', ...],

  // 5. 採購單與費用明細模型
  PurchaseOrderItem: ['id', 'purchaseOrderId', 'itemName', 'description', ...],
  ExpenseItem: ['id', 'expenseId', 'itemName', 'description', 'amount', ...],

  // 6. OM 費用模型
  ExpenseCategory: ['id', 'code', 'name', 'description', 'sortOrder', 'isActive', ...],
  OMExpense: ['id', 'name', 'description', 'financialYear', 'category', ...], // FEAT-007 重構
  OMExpenseItem: ['id', 'omExpenseId', 'name', 'description', 'sortOrder', ...], // FEAT-007 新增
  OMExpenseMonthly: ['id', 'omExpenseItemId', 'omExpenseId', 'month', ...],

  // 7. 費用轉嫁模型
  ChargeOut: ['id', 'name', 'description', 'projectId', 'opCoId', ...],
  ChargeOutItem: ['id', 'chargeOutId', 'expenseItemId', 'expenseId', 'amount', ...],

  // 8. 貨幣管理模型
  Currency: ['id', 'code', 'name', 'symbol', 'exchangeRate', 'active', ...],
};
```

### 相關 Health API Procedures

```typescript
// packages/api/src/routers/health.ts

// 完整對比所有 31 個表格
health.fullSchemaCompare.query()

// 一鍵修復所有 Schema 差異
health.fullSchemaSync.mutation()
```

---

## ⚠️ 重要約定

### EmailService
1. **開發環境使用 Ethereal Email**（自動創建測試郵箱，無需配置）
2. **生產環境使用 SMTP/SendGrid**（需設置環境變數）
3. **Email 模板必須使用 HTML**（支援 fallback text）
4. **錯誤處理不阻塞主流程**（郵件發送失敗僅記錄日誌）

### Password Validation
1. **密碼最小長度 12 字符**
2. **需包含至少 6 個特殊字符**（大寫、數字、符號的總和）
3. **前端和後端都應驗證**（雙重驗證）

### Schema Definition
1. **優先使用 DMMF 自動讀取**（無需手動維護欄位列表）
2. **修改 schema.prisma 後必須 `pnpm db:generate`**
3. **特殊默認值在 COLUMN_TYPE_OVERRIDES 中定義**
4. **靜態定義僅作為 DMMF 失敗時的備份**

---

## 📊 模組統計

| 模組 | 行數 | 功能 | Feature 來源 |
|------|------|------|--------------|
| `email.ts` | 466 | 郵件發送服務 | Epic 8 - Story 8.1/8.2 |
| `passwordValidation.ts` | 148 | 密碼驗證 | CHANGE-032 |
| `schemaDefinition.ts` | 600 | Schema 同步 | 方案 C 自動化 |
| **總計** | **1,214** | | |

---

## 相關文件

### 使用這些工具的 Routers
- `packages/api/src/routers/budgetProposal.ts` - 使用 EmailService (提案通知)
- `packages/api/src/routers/expense.ts` - 使用 EmailService (費用通知)
- `packages/api/src/routers/notification.ts` - 使用 EmailService
- `packages/api/src/routers/user.ts` - 使用 passwordValidation (CHANGE-032)
- `packages/api/src/routers/health.ts` - 使用 schemaDefinition (Schema 同步)

### 相關前端組件
- `apps/web/src/components/ui/password-input.tsx` - 密碼輸入組件
- `apps/web/src/components/ui/password-strength-indicator.tsx` - 密碼強度指示器

### 文檔
- `claudedocs/SCHEMA-SYNC-MECHANISM.md` - Schema 同步機制詳細說明
- `.env.example` - 環境變數配置範例

### 規則文件
- `.claude/rules/backend-api.md` - tRPC 後端 API 規範
