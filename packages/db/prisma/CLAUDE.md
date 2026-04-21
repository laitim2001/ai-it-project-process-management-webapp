# Prisma Database Layer - 資料模型定義層

> **Last Updated**: 2026-04-21
> **相關規則**: 請參閱 `.claude/rules/database.md` 獲取 Prisma 資料庫完整開發規範
> **深度分析參考**:
> - `docs/codebase-analyze/05-database/schema-overview.md` — 32 Models, 94 索引, 16 級聯策略
> - `docs/codebase-analyze/05-database/model-detail.md` — 每個 Model 的完整欄位規格
> - `docs/codebase-analyze/05-database/migration-history.md` — 7 個遷移 + Seed 數據
> - `docs/codebase-analyze/09-diagrams/er-diagram.md` — 7 個 ER 關聯圖（Mermaid）

## 📋 目錄用途

此目錄包含 Prisma Schema 定義和資料庫遷移歷史，是整個應用的資料模型單一真相來源（Single Source of Truth）。

## 🏗️ 檔案結構

```
prisma/
├── schema.prisma           # 資料模型定義（核心檔案，919 行）
├── seed.ts                 # 完整種子資料
├── seed-minimal.ts         # 最小種子資料
├── CLAUDE.md               # 本文件
└── migrations/             # 資料庫遷移歷史
    ├── migration_lock.toml
    ├── 20251126100000_add_currency/
    ├── 20251202100000_add_feat001_project_fields/
    ├── 20251202110000_add_postmvp_tables/
    ├── 20251208100000_feat007_om_expense_item/
    ├── 20251210100000_feat008_lastfy_actual_expense/
    └── 20251214100000_feat011_permission_tables/
```

---

## 🎯 Schema 組織結構

### 總覽：32 個 Prisma Models，分為 9 個區塊

```
┌─────────────────────────────────────────────────────────────────────┐
│                    IT 專案管理平台 - 資料模型架構                    │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 1. 核心使用者與權限 (5 + 3 個)                               │   │
│  │    User, Account, Session, VerificationToken, Role          │   │
│  │    Permission, RolePermission, UserPermission (FEAT-011)    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 2. 核心業務流程 (7 個)                                       │   │
│  │    BudgetPool → BudgetCategory → Project → BudgetProposal   │   │
│  │    Vendor → Quote → PurchaseOrder → Expense                 │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 3. 輔助模型 (3 個)                                           │   │
│  │    Comment, History, Notification                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 4-5. 營運公司與預算類別 (4 個)                                │   │
│  │    OperatingCompany, ProjectChargeOutOpCo                    │   │
│  │    UserOperatingCompany (FEAT-009), BudgetCategory           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 6. 採購單與費用明細 (2 個)                                    │   │
│  │    PurchaseOrderItem, ExpenseItem                            │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 7. OM 費用模型 (4 個) - FEAT-007 重構                        │   │
│  │    ExpenseCategory, OMExpense (表頭)                         │   │
│  │    OMExpenseItem (明細), OMExpenseMonthly (月份)             │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 8. 費用轉嫁模型 (2 個)                                       │   │
│  │    ChargeOut (表頭), ChargeOutItem (明細)                    │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                              ↓                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ 9. 貨幣管理 (1 個) - FEAT-001                                │   │
│  │    Currency                                                  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📊 Model 詳細分區

### Section 1: 核心使用者與權限模型 (8 個)

```prisma
// NextAuth.js 整合
model User {
  id            String    @id @default(uuid())
  email         String    @unique
  emailVerified DateTime?
  name          String?
  image         String?
  password      String?   // bcrypt hash，Azure AD B2C 用戶為 null
  roleId        Int       @default(1)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // 關聯
  role          Role
  projects      Project[]  @relation("ProjectManager")
  approvals     Project[]  @relation("Supervisor")
  notifications Notification[]
  accounts      Account[]
  sessions      Session[]
  permissions   UserPermission[]  // FEAT-011
  operatingCompanyPermissions UserOperatingCompany[]  // FEAT-009
}

model Account { ... }           // NextAuth OAuth
model Session { ... }           // NextAuth Session
model VerificationToken { ... } // NextAuth Email 驗證
model Role { id, name }         // 角色：ProjectManager, Supervisor, Admin

// FEAT-011: 權限管理系統
model Permission {
  id          String   @id @default(uuid())
  code        String   @unique  // 如 "menu:dashboard", "project:create"
  name        String
  category    String             // 如 "menu", "project", "proposal"
  description String?
  isActive    Boolean  @default(true)
  sortOrder   Int      @default(0)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model RolePermission { ... }    // 角色預設權限（多對多）
model UserPermission { ... }    // 用戶自訂權限（覆蓋角色預設）
```

### Section 2: 核心業務流程模型 (7 個)

```prisma
model BudgetPool {
  id            String   @id @default(uuid())
  name          String
  totalAmount   Float    // DEPRECATED: 改由 categories 計算
  usedAmount    Float    @default(0)
  financialYear Int
  description   String?
  currencyId    String?  // FEAT-002
  isActive      Boolean  @default(true)
  // ...關聯
}

model Project {
  id               String    @id @default(uuid())
  name             String
  description      String?
  status           String    @default("Draft")
  managerId        String
  supervisorId     String
  budgetPoolId     String
  budgetCategoryId String?
  requestedBudget  Float?
  approvedBudget   Float?
  startDate        DateTime
  endDate          DateTime?
  chargeOutDate    DateTime?

  // FEAT-001: 專案欄位擴展
  projectCode      String   @unique
  globalFlag       String   @default("Region")
  priority         String   @default("Medium")
  currencyId       String?

  // FEAT-006: Project Summary Tab
  projectCategory  String?
  projectType      String   @default("Project")
  expenseType      String   @default("Expense")
  chargeBackToOpCo Boolean  @default(false)
  chargeOutMethod  String?  @db.Text
  probability      String   @default("Medium")
  team             String?
  personInCharge   String?

  // FEAT-010: Project Data Import
  fiscalYear          Int?
  isCdoReviewRequired Boolean @default(false)
  isManagerConfirmed  Boolean @default(false)
  payForWhat          String?
  payToWhom           String?
  isOngoing           Boolean @default(false)
  lastFYActualExpense Float?
  // ... 27+ 欄位
}

model BudgetProposal { ... }
model Vendor { ... }
model Quote { ... }
model PurchaseOrder { ... }
model Expense { ... }
```

### Section 3: 輔助模型 (3 個)

```prisma
model Comment {
  id               String   @id @default(uuid())
  content          String
  userId           String
  budgetProposalId String
  createdAt        DateTime @default(now())
  // 關聯
}

model History {
  id               String   @id @default(uuid())
  action           String   // "SUBMITTED", "APPROVED", "REJECTED", "MORE_INFO_REQUIRED"
  details          String?
  userId           String
  budgetProposalId String
  createdAt        DateTime @default(now())
}

// Epic 8
model Notification {
  id         String   @id @default(uuid())
  userId     String
  type       String   // "PROPOSAL_SUBMITTED", "EXPENSE_APPROVED", etc.
  title      String
  message    String
  link       String?
  isRead     Boolean  @default(false)
  emailSent  Boolean  @default(false)
  entityType String?
  entityId   String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Section 4-5: 營運公司與預算類別 (4 個)

```prisma
model OperatingCompany {
  id          String   @id @default(uuid())
  code        String   @unique  // 如 "OpCo-HK"
  name        String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  // 多個關聯...
}

// FEAT-006: 專案與 OpCo 多對多
model ProjectChargeOutOpCo {
  id        String   @id @default(uuid())
  projectId String
  opCoId    String
  createdAt DateTime @default(now())
  @@unique([projectId, opCoId])
}

// FEAT-009: 用戶 OpCo 數據權限
model UserOperatingCompany {
  id                 String   @id @default(uuid())
  userId             String
  operatingCompanyId String
  createdAt          DateTime @default(now())
  createdBy          String?
  @@unique([userId, operatingCompanyId])
}

model BudgetCategory {
  id           String @id @default(uuid())
  budgetPoolId String
  categoryName String
  categoryCode String?
  description  String?
  totalAmount  Float
  usedAmount   Float  @default(0)
  sortOrder    Int    @default(0)
  isActive     Boolean @default(true)
  @@unique([budgetPoolId, categoryName])
}
```

### Section 6: 採購單與費用明細 (2 個)

```prisma
// 表頭-明細模式 (Header-Detail Pattern)
model PurchaseOrderItem {
  id              String @id @default(uuid())
  purchaseOrderId String
  itemName        String
  description     String? @db.Text
  quantity        Int
  unitPrice       Float
  subtotal        Float   // quantity * unitPrice
  sortOrder       Int     @default(0)
}

model ExpenseItem {
  id              String  @id @default(uuid())
  expenseId       String
  itemName        String
  description     String? @db.Text
  amount          Float
  category        String? // 舊欄位
  categoryId      String? // CHANGE-003: FK 到 ExpenseCategory
  chargeOutOpCoId String? // CHANGE-002: 費用轉嫁目標
  sortOrder       Int     @default(0)
}
```

### Section 7: OM 費用模型 (4 個) - FEAT-007 重構

```prisma
// 統一費用類別
model ExpenseCategory {
  id          String   @id @default(uuid())
  code        String   @unique  // HW, SW, MAINT, LICENSE
  name        String
  description String?
  sortOrder   Int      @default(0)
  isActive    Boolean  @default(true)
}

// OM 費用表頭
model OMExpense {
  id String @id @default(uuid())

  // 基本信息
  name          String
  description   String?   @db.Text
  financialYear Int
  category      String    // 舊欄位
  categoryId    String?

  // FEAT-007: 匯總欄位
  totalBudgetAmount Float @default(0)  // = SUM(items.budgetAmount)
  totalActualSpent  Float @default(0)  // = SUM(items.actualSpent)
  defaultOpCoId     String?

  // @deprecated 欄位 (保留向後兼容)
  opCoId       String?
  budgetAmount Float?
  actualSpent  Float @default(0)
  startDate    DateTime?
  endDate      DateTime?
  hasItems     Boolean @default(false)

  // 關聯
  items           OMExpenseItem[]
  monthlyRecords  OMExpenseMonthly[] @relation("LegacyOMExpenseMonthly")
}

// FEAT-007: OM 費用明細項目
model OMExpenseItem {
  id          String  @id @default(uuid())
  omExpenseId String
  name        String
  description String? @db.Text
  sortOrder   Int     @default(0)

  // 財務欄位
  budgetAmount        Float
  actualSpent         Float   @default(0)
  lastFYActualExpense Float?  // FEAT-008

  // 其他欄位
  currencyId String?
  opCoId     String
  startDate  DateTime?
  endDate    DateTime?
  isOngoing  Boolean  @default(false)  // CHANGE-011

  // 關聯
  monthlyRecords OMExpenseMonthly[]
}

// OM 費用月度記錄
model OMExpenseMonthly {
  id              String  @id @default(uuid())
  omExpenseItemId String? // FEAT-007 新增
  omExpenseId     String? // @deprecated
  month           Int     // 1-12
  actualAmount    Float
  opCoId          String

  @@unique([omExpenseItemId, month])
  @@unique([omExpenseId, month])  // 向後兼容
}
```

### Section 8: 費用轉嫁模型 (2 個)

```prisma
model ChargeOut {
  id String @id @default(uuid())

  name        String
  description String? @db.Text
  projectId   String
  opCoId      String
  totalAmount Float   // 由明細自動計算
  status      String  @default("Draft")  // Draft, Submitted, Confirmed, Paid, Rejected

  debitNoteNumber String?   @unique
  issueDate       DateTime?
  paymentDate     DateTime?
  confirmedBy     String?
  confirmedAt     DateTime?

  // 關聯
  items ChargeOutItem[]
}

model ChargeOutItem {
  id          String  @id @default(uuid())
  chargeOutId String
  expenseItemId String?  // CHANGE-002: 關聯費用明細
  expenseId     String?  // 向後兼容
  amount        Float
  description   String?  @db.Text
  sortOrder     Int      @default(0)
}
```

### Section 9: 貨幣管理 (1 個)

```prisma
// FEAT-001
model Currency {
  id           String   @id @default(uuid())
  code         String   @unique  // ISO 4217: TWD, USD, EUR
  name         String
  symbol       String   // NT$, $, €
  exchangeRate Float?
  active       Boolean  @default(true)

  // 關聯到多個模型
  projects       Project[]
  budgetPools    BudgetPool[]
  purchaseOrders PurchaseOrder[]
  expenses       Expense[]
  omExpenseItems OMExpenseItem[]
}
```

---

## 🔄 Feature 與 Model 對照表

| Feature | 影響的 Models | 說明 |
|---------|---------------|------|
| **FEAT-001** | Project, Currency | 專案欄位擴展 + 多幣別支援 |
| **FEAT-002** | BudgetPool, PurchaseOrder, Expense | 貨幣 ID 關聯 |
| **FEAT-006** | Project, ProjectChargeOutOpCo | Project Summary Tab |
| **FEAT-007** | OMExpense, OMExpenseItem, OMExpenseMonthly | OM 費用表頭-明細重構 |
| **FEAT-008** | OMExpenseItem | lastFYActualExpense 欄位 |
| **FEAT-009** | UserOperatingCompany | OpCo 數據權限 |
| **FEAT-010** | Project | Data Import 欄位 |
| **FEAT-011** | Permission, RolePermission, UserPermission | 權限管理系統 |
| **CHANGE-002** | ExpenseItem, ChargeOutItem | 費用明細轉嫁 |
| **CHANGE-003** | ExpenseItem, ExpenseCategory | 統一費用類別 |
| **CHANGE-011** | OMExpenseItem | isOngoing 欄位增強 |

---

## 🎯 核心模式與約定

### 1. ID 與時間戳約定

```prisma
model Example {
  // ID：統一使用 UUID
  id        String   @id @default(uuid())

  // 時間戳：統一命名
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt  // 自動更新
}
```

### 2. 狀態欄位約定

```prisma
// ✅ 使用 String + API 層 Zod enum
model Project {
  status String @default("Draft")
  // 可能值: 'Draft' | 'InProgress' | 'Completed' | 'Archived'
}

// API Router 中定義
// const projectStatusEnum = z.enum(['Draft', 'InProgress', 'Completed', 'Archived']);

// ❌ 不使用 Prisma enum（不夠靈活，遷移困難）
// enum ProjectStatus { DRAFT, IN_PROGRESS }
```

### 3. 外鍵命名約定

```prisma
// 外鍵：統一使用 [modelName]Id 格式
model Project {
  budgetPoolId     String
  managerId        String
  supervisorId     String
  budgetCategoryId String?

  budgetPool     BudgetPool     @relation(fields: [budgetPoolId], references: [id])
  manager        User           @relation("ProjectManager", fields: [managerId], references: [id])
  supervisor     User           @relation("Supervisor", fields: [supervisorId], references: [id])
  budgetCategory BudgetCategory? @relation(fields: [budgetCategoryId], references: [id])
}
```

### 4. 關係命名（同一 Model 多個關係）

```prisma
model User {
  // 使用具名關係區分
  projects  Project[] @relation("ProjectManager")
  approvals Project[] @relation("Supervisor")
}

model Project {
  manager    User @relation("ProjectManager", fields: [managerId], references: [id])
  supervisor User @relation("Supervisor", fields: [supervisorId], references: [id])
}
```

### 5. 索引策略

```prisma
model Project {
  // 唯一索引
  projectCode String @unique

  // 複合索引
  @@index([budgetPoolId])
  @@index([managerId])
  @@index([supervisorId])
  @@index([status])
  @@index([projectCode])
  @@index([globalFlag])
  @@index([priority])
  @@index([fiscalYear])
}

model ProjectChargeOutOpCo {
  // 複合唯一約束
  @@unique([projectId, opCoId])
}
```

### 6. 級聯刪除策略

```prisma
// Cascade: 主記錄刪除時一同刪除
model Account {
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// SetNull: 主記錄刪除時設為 null（外鍵必須可選）
model Project {
  currency Currency? @relation(fields: [currencyId], references: [id], onDelete: SetNull)
}

// Restrict: 有關聯資料時禁止刪除（預設行為）
// NoAction: 不處理（資料庫預設）
```

### 7. 長文本欄位

```prisma
model Example {
  // 短文本: String (varchar)
  name String

  // 長文本: @db.Text (text)
  description String? @db.Text
  notes       String? @db.Text
}
```

---

## 🔄 資料庫遷移流程

### 開發環境

```bash
# 1. 修改 schema.prisma

# 2. 創建並應用遷移
pnpm db:migrate
# 這會：
# - 生成 SQL 遷移檔案
# - 應用到開發資料庫
# - 重新生成 Prisma Client

# 3. 或快速同步（不創建遷移，僅開發用）
pnpm db:push

# 4. 查看當前狀態
pnpm prisma migrate status
```

### 生產環境

```bash
# 1. CI/CD 中運行
pnpm prisma migrate deploy

# 2. 確保 Client 已生成
pnpm db:generate
```

### 重置資料庫（僅開發）

```bash
# 警告：會刪除所有資料！
pnpm db:reset   # 重置 + 重新應用所有遷移 + 執行 seed
```

### 遷移歷史

| 日期 | 遷移名稱 | 說明 |
|------|----------|------|
| 2025-11-26 | add_currency | FEAT-001 貨幣支援 |
| 2025-12-02 | add_feat001_project_fields | Project 欄位擴展 |
| 2025-12-02 | add_postmvp_tables | Post-MVP 表格 |
| 2025-12-08 | feat007_om_expense_item | FEAT-007 OM Expense 重構 |
| 2025-12-10 | feat008_lastfy_actual_expense | FEAT-008 上年度支出欄位 |
| 2025-12-14 | feat011_permission_tables | FEAT-011 權限系統 |

---

## 🔍 Prisma Client 使用模式

### 基本查詢

```typescript
// 查詢所有
const projects = await prisma.project.findMany();

// 查詢單一（唯一欄位）
const project = await prisma.project.findUnique({
  where: { id },
});

// 查詢第一筆
const project = await prisma.project.findFirst({
  where: { status: 'Draft' },
});

// 包含關聯
const project = await prisma.project.findUnique({
  where: { id },
  include: {
    budgetPool: true,
    manager: { select: { id: true, name: true, email: true } },
    proposals: { orderBy: { createdAt: 'desc' } },
  },
});
```

### 分頁與過濾

```typescript
// 分頁 + 模糊搜尋 + 排序
const projects = await prisma.project.findMany({
  where: {
    status: 'InProgress',
    name: { contains: 'ERP', mode: 'insensitive' },
    budgetPoolId,
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});

// 計數
const count = await prisma.project.count({
  where: { status: 'InProgress' },
});
```

### 寫入操作

```typescript
// 建立
const project = await prisma.project.create({
  data: {
    name: 'New Project',
    status: 'Draft',
    managerId: userId,
    // ...
  },
});

// 更新
const project = await prisma.project.update({
  where: { id },
  data: { status: 'Completed' },
});

// Upsert
const project = await prisma.project.upsert({
  where: { projectCode },
  update: { name: 'Updated' },
  create: { name: 'New', projectCode, ... },
});

// 刪除
await prisma.project.delete({ where: { id } });
```

### Transaction

```typescript
// 批次 Transaction
const result = await prisma.$transaction([
  prisma.project.update({ where: { id }, data: { status: 'Completed' } }),
  prisma.budgetPool.update({
    where: { id: poolId },
    data: { usedAmount: { increment: 1000 } },
  }),
]);

// 互動式 Transaction（可包含條件邏輯）
const result = await prisma.$transaction(async (tx) => {
  const project = await tx.project.update({ ... });
  await tx.history.create({
    data: { action: 'STATUS_CHANGED', ... },
  });
  return project;
});
```

### 選擇性載入

```typescript
// ✅ 只載入需要的欄位（效能優化）
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
    manager: { select: { name: true } },
  },
});

// ❌ 避免載入所有欄位
const projects = await prisma.project.findMany(); // 載入全部
```

---

## ⚠️ 重要約定

### Schema 維護
1. **永不直接修改 migrations/**（遷移檔案是不可變的）
2. **修改 schema.prisma 後必須 `pnpm db:generate`**
3. **生產環境遷移必須可回滾**（設計時考慮向後兼容）

### 欄位設計
4. **外鍵關係必須有索引**（效能優化）
5. **敏感資料欄位考慮加密**（如 password 用 bcrypt）
6. **大型文字欄位使用 @db.Text**
7. **金額欄位使用 Float**（不用 Decimal 除非需要高精度）
8. **時區統一使用 UTC**（應用層轉換顯示）

### 向後兼容
9. **@deprecated 欄位保留直到下個大版本**
10. **新增欄位優先設為可選或有預設值**

---

## 📊 模型統計

| 類別 | 模型數量 | 主要模型 |
|------|----------|----------|
| 核心使用者與權限 | 8 | User, Role, Permission |
| 核心業務流程 | 7 | Project, BudgetProposal, Expense |
| 輔助模型 | 3 | Comment, History, Notification |
| 營運公司與預算類別 | 4 | OperatingCompany, BudgetCategory |
| 採購單與費用明細 | 2 | PurchaseOrderItem, ExpenseItem |
| OM 費用模型 | 4 | OMExpense, OMExpenseItem |
| 費用轉嫁模型 | 2 | ChargeOut, ChargeOutItem |
| 貨幣管理 | 1 | Currency |
| **總計** | **31** | |

---

## 相關文件

### 使用 Prisma 的程式碼
- `packages/api/src/routers/*.ts` - 所有 tRPC Router 使用 Prisma Client
- `packages/api/src/trpc.ts` - Prisma Client 注入到 tRPC Context
- `packages/api/src/lib/schemaDefinition.ts` - Schema 同步定義

### Schema 同步
- `claudedocs/SCHEMA-SYNC-MECHANISM.md` - Azure 環境 Schema 同步機制

### 文檔
- [Prisma 官方文檔](https://www.prisma.io/docs)
- [Prisma Schema 參考](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)

### 規則文件
- `.claude/rules/database.md` - Prisma 資料庫規範
- `.claude/rules/backend-api.md` - tRPC 後端 API 規範
