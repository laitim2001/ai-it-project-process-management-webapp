# 共享工具庫 (packages/api/src/lib/) 詳細分析

> **目錄路徑**: `packages/api/src/lib/`
> **檔案數**: 3 個（+ 1 個 CLAUDE.md）
> **總行數**: 1,211 行

---

## 1. email.ts — 郵件發送服務

> **行數**: 465 行
> **來源**: Epic 8 - Story 8.1/8.2 (Notification System)

### 類別: `EmailService` (Singleton)

單例模式的郵件發送服務，封裝 Nodemailer。

### 環境配置

| 環境 | 傳輸方式 | 說明 |
|------|----------|------|
| 開發 | Ethereal Email | 自動建立虛擬測試郵箱，console 輸出預覽 URL |
| 生產 (SMTP) | Nodemailer SMTP | 使用 SMTP_HOST/PORT/USER/PASS |
| 生產 (SendGrid) | — | TODO: 待實現 |

### 公開方法

| 方法 | 用途 | 呼叫者 |
|------|------|--------|
| `sendProposalSubmittedEmail(data)` | 提案提交通知（給主管） | budgetProposal.ts |
| `sendProposalStatusEmail(data)` | 提案審批結果通知（給 PM） | budgetProposal.ts |
| `sendExpenseSubmittedEmail(data)` | 費用提交通知（給主管） | expense.ts |
| `sendExpenseApprovedEmail(data)` | 費用已批准通知（給 PM） | expense.ts |

### Interface 定義

- `EmailOptions` — `{ to, subject, html, text? }`
- `ProposalEmailData` — `{ to, proposalTitle, proposalLink, submitterName, supervisorName? }`
- `ProposalStatusEmailData` — `{ to, proposalTitle, proposalLink, status: 'approved'|'rejected'|'more_info', comment?, reviewerName }`
- `ExpenseEmailData` — `{ to, expenseAmount, projectName, expenseLink, submitterName }`

### 匯出

```typescript
export const emailService = new EmailService();  // 單例
export type { EmailOptions, ProposalEmailData, ProposalStatusEmailData, ExpenseEmailData };
```

### 郵件模板特性

- 完整 HTML 模板（響應式 max-width 600px）
- 狀態特定顏色主題（approved=#10b981, rejected=#ef4444, more_info=#f59e0b）
- 同時提供 HTML 和純文字版本
- 錯誤處理不阻塞主流程（發送失敗僅 console.error）

---

## 2. passwordValidation.ts — 密碼驗證工具

> **行數**: 147 行
> **來源**: CHANGE-032 — 用戶密碼管理功能

### 密碼要求常數

```typescript
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,           // 最小密碼長度
  MIN_SPECIAL_CHARS: 6,     // 大寫 + 數字 + 符號的最小數量
  ALLOWED_SYMBOLS: '!@#$%^&*()_+-=[]{};\':"|,./<>?`~',
};
```

### 匯出函數

| 函數 | 簽名 | 用途 |
|------|------|------|
| `validatePasswordStrength` | `(password: string) => PasswordValidationResult` | 完整驗證，含詳細統計 |
| `isPasswordValid` | `(password: string) => boolean` | 簡單布林檢查 |
| `getPasswordValidationError` | `(password: string) => string \| null` | 獲取錯誤訊息 |

### 回傳結構 (`PasswordValidationResult`)

```typescript
{
  isValid: boolean;
  errors: string[];
  details: {
    length, minLength,
    uppercaseCount, digitCount, symbolCount,
    specialCharCount, requiredSpecialChars
  }
}
```

### 使用者

- `packages/api/src/routers/user.ts` — setPassword, create, changeOwnPassword
- `apps/web/src/app/api/auth/register/route.ts` — 註冊 API

---

## 3. schemaDefinition.ts — Schema 同步定義

> **行數**: 599 行
> **來源**: 方案 C 自動化（Schema 同步機制）

### 功能

提供 Schema 同步的唯一真相來源。支援從 Prisma DMMF 自動讀取欄位列表，或回退到靜態定義。

### 核心策略

1. **優先**: 從 `Prisma.dmmf.datamodel.models` 自動讀取
2. **備份**: 使用 `FULL_SCHEMA_DEFINITION` 靜態定義（31 個表格）
3. **覆蓋**: `COLUMN_TYPE_OVERRIDES` 只定義有特殊默認值的欄位

### Prisma -> SQL 類型映射

| Prisma 類型 | SQL 類型 |
|------------|---------|
| String | TEXT |
| Int | INTEGER |
| Float | DOUBLE PRECISION |
| Boolean | BOOLEAN |
| DateTime | TIMESTAMP(3) |
| BigInt | BIGINT |
| Decimal | DECIMAL |
| Json | JSONB |

### 匯出函數

| 函數 | 用途 |
|------|------|
| `getSchemaDefinitionFromDMMF()` | 從 DMMF 自動獲取所有表格欄位 |
| `getFieldInfoFromDMMF(table, field)` | 獲取欄位詳細資訊 |
| `prismaTypeToSqlType(type)` | Prisma -> SQL 類型轉換 |
| `generateAddColumnSQL(table, column)` | 生成 ALTER TABLE ADD COLUMN |
| `getExpectedColumns(table)` | 獲取表格預期欄位（DMMF 優先） |
| `getAllTableNames()` | 獲取所有表格名稱 |
| `getColumnTypeInfo(table, column)` | 獲取欄位類型和預設值 |
| `getFullSchemaDefinition()` | 獲取完整 Schema 定義 |

### 匯出常數

- `COLUMN_TYPE_OVERRIDES` — 特殊欄位類型覆蓋（10 個表格）
- `COMPLETE_COLUMN_TYPES` — 完整欄位定義（用於新表格建立，6 個表格）
- `FULL_SCHEMA_DEFINITION` — 靜態 Schema 定義（31 個表格，@deprecated）

### 使用者

- `packages/api/src/routers/health.ts` — schemaCompare, fixAllSchemaIssues

---

## package.json 依賴

```json
{
  "dependencies": {
    "@itpm/auth": "workspace:*",
    "@itpm/db": "workspace:*",
    "@trpc/server": "^10.45.1",
    "bcryptjs": "^2.4.3",
    "next-auth": "5.0.0-beta.30",
    "nodemailer": "^7.0.7",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@itpm/tsconfig": "workspace:*",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.11.19",
    "@types/nodemailer": "^7.0.2",
    "typescript": "^5.3.3"
  }
}
```

### 關鍵依賴說明

| 依賴 | 用途 | 使用者 |
|------|------|--------|
| `@trpc/server` | tRPC 核心 | trpc.ts, 所有 routers |
| `zod` | 輸入驗證 | 所有 routers |
| `@itpm/db` | Prisma Client | trpc.ts (ctx.prisma) |
| `@itpm/auth` | NextAuth 類型 | trpc.ts (Session type) |
| `bcryptjs` | 密碼 hash | user.ts |
| `nodemailer` | 郵件發送 | lib/email.ts |
| `next-auth` | Session 類型 | trpc.ts |
| `superjson` | 序列化 (peer dep) | trpc.ts |
