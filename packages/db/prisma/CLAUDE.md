# Prisma Database Layer - 資料模型定義層

## 📋 目錄用途
此目錄包含 Prisma Schema 定義和資料庫遷移歷史，是整個應用的資料模型單一真相來源（Single Source of Truth）。

## 🏗️ 檔案結構

```
prisma/
├── schema.prisma           # 資料模型定義（核心檔案）
└── migrations/             # 資料庫遷移歷史
    └── [timestamp]_[name]/ # 每次遷移的 SQL 檔案
```

## 🎯 Schema 組織結構

### 1. schema.prisma 分區（共 24 個 Models）
```prisma
// 1. 核心使用者與權限模型 (5 個)
model User { ... }
model Account { ... }              // NextAuth OAuth
model Session { ... }              // NextAuth Session
model VerificationToken { ... }    // NextAuth Email 驗證
model Role { ... }

// 2. 預算管理模型 (4 個)
model BudgetPool { ... }
model BudgetCategory { ... }
model Project { ... }
model BudgetProposal { ... }

// 3. 採購與供應商模型 (4 個)
model Vendor { ... }
model Quote { ... }
model PurchaseOrder { ... }
model PurchaseOrderItem { ... }

// 4. 費用管理模型 (6 個)
model Expense { ... }
model ExpenseItem { ... }
model ChargeOut { ... }
model ChargeOutItem { ... }
model OMExpense { ... }
model OMExpenseMonthly { ... }

// 5. 系統與輔助模型 (5 個)
model OperatingCompany { ... }
model Currency { ... }             // 幣別管理 (FEAT-001)
model Comment { ... }
model History { ... }
model Notification { ... }
```

## 🎯 核心模式與約定

### 1. 欄位命名約定
```prisma
model Example {
  // ID 欄位：統一使用 UUID
  id String @id @default(uuid())

  // 時間戳：統一命名和預設值
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // 狀態欄位：使用 String 枚舉
  status String // 'Draft' | 'Active' | 'Completed'

  // 金額欄位：使用 Float 或 Decimal
  amount Float

  // 外鍵：統一後綴 Id
  budgetPoolId String
  managerId String

  // 關係：使用描述性名稱
  budgetPool BudgetPool @relation(fields: [budgetPoolId], references: [id])
  manager User @relation("ProjectManager", fields: [managerId], references: [id])
}
```

### 2. 關係定義模式

#### One-to-Many
```prisma
model BudgetPool {
  id       String    @id @default(uuid())
  projects Project[] // 一個預算池有多個專案
}

model Project {
  id           String     @id @default(uuid())
  budgetPoolId String
  budgetPool   BudgetPool @relation(fields: [budgetPoolId], references: [id])
}
```

#### Many-to-One (同一 Model 多個關係)
```prisma
model Project {
  managerId    String
  supervisorId String

  manager    User @relation("ProjectManager", fields: [managerId], references: [id])
  supervisor User @relation("Supervisor", fields: [supervisorId], references: [id])
}

model User {
  projects  Project[] @relation("ProjectManager")
  approvals Project[] @relation("Supervisor")
}
```

#### One-to-One (可選)
```prisma
model User {
  id      String   @id @default(uuid())
  profile Profile?
}

model Profile {
  id     String @id @default(uuid())
  userId String @unique
  user   User   @relation(fields: [userId], references: [id])
}
```

### 3. 索引策略
```prisma
model User {
  email String @unique  // 唯一索引（自動）

  @@index([email])      // 額外索引（查詢優化）
  @@index([roleId])
}

model Project {
  @@index([budgetPoolId])
  @@index([managerId])
  @@index([status])
}
```

### 4. 級聯刪除策略
```prisma
model User {
  accounts Account[] // Cascade: 刪除用戶時刪除關聯帳號
}

model Account {
  userId String
  user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

// 其他選項：
// onDelete: Restrict  - 禁止刪除（有關聯資料時）
// onDelete: SetNull   - 設為 null（外鍵欄位必須可選）
// onDelete: NoAction  - 不處理（資料庫預設行為）
```

### 5. 枚舉值約定
```prisma
// ❌ 不使用 Prisma enum（不夠靈活）
// enum ProjectStatus {
//   DRAFT
//   IN_PROGRESS
//   COMPLETED
// }

// ✅ 使用 String + API 層 Zod enum
model Project {
  status String // 'Draft' | 'InProgress' | 'Completed' | 'Archived'
}

// 在 API Router 中定義
// export const projectStatusEnum = z.enum(['Draft', 'InProgress', 'Completed', 'Archived']);
```

## 🔄 資料庫遷移流程

### 開發環境
```bash
# 1. 修改 schema.prisma

# 2. 創建遷移（會生成 SQL）
pnpm db:migrate

# 3. 重新生成 Prisma Client
pnpm db:generate

# 4. 應用遷移到資料庫
# （db:migrate 已自動應用）
```

### 生產環境
```bash
# 1. 部署前運行
pnpm prisma migrate deploy

# 2. 確保 Prisma Client 已生成
pnpm db:generate
```

### 重置資料庫（僅開發）
```bash
# 警告：會刪除所有資料
pnpm db:push    # 快速同步（不創建遷移）
pnpm db:reset   # 重置 + 重新應用所有遷移 + seed
```

## 📝 常見操作模式

### 新增欄位
```prisma
model Project {
  // 新增可選欄位（安全）
  newField String?

  // 新增必填欄位（需要預設值或遷移腳本）
  requiredField String @default("default_value")
}
```

### 重命名欄位
```bash
# Prisma 會自動檢測並提示
pnpm db:migrate
# 選擇 "Yes" 當提示是否為重命名
```

### 修改關係
```prisma
// 舊版本
model Project {
  budgetPoolId String?  // 可選

// 新版本（遷移需處理現有 null 值）
model Project {
  budgetPoolId String   // 必填
```

## ⚠️ 重要約定

1. **永不直接修改 migrations/**（遷移是不可變的）
2. **生產環境遷移必須可回滾**（設計時考慮向後兼容）
3. **外鍵關係必須有索引**（性能優化）
4. **敏感資料欄位考慮加密**（如 password）
5. **大型文字欄位使用 @db.Text**（如 description）
6. **金額欄位考慮精度**（Float vs Decimal）
7. **時區統一使用 UTC**（應用層轉換顯示）

## 🔍 Prisma Client 使用模式

### 基本查詢
```typescript
// 查詢所有
const projects = await prisma.project.findMany();

// 查詢單一
const project = await prisma.project.findUnique({ where: { id } });

// 查詢第一筆
const project = await prisma.project.findFirst({ where: { status: 'Draft' } });

// 查詢並包含關聯
const project = await prisma.project.findUnique({
  where: { id },
  include: { budgetPool: true, manager: true },
});
```

### 複雜查詢
```typescript
// 分頁 + 過濾 + 排序
const projects = await prisma.project.findMany({
  where: {
    status: 'InProgress',
    name: { contains: 'ERP', mode: 'insensitive' }, // 模糊搜尋（不區分大小寫）
  },
  orderBy: { createdAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});

// 計數
const count = await prisma.project.count({ where: { status: 'InProgress' } });
```

### 寫入操作
```typescript
// 建立
const project = await prisma.project.create({ data: { ... } });

// 更新
const project = await prisma.project.update({
  where: { id },
  data: { status: 'Completed' },
});

// 刪除
await prisma.project.delete({ where: { id } });

// Upsert（更新或建立）
const project = await prisma.project.upsert({
  where: { id },
  update: { ... },
  create: { ... },
});
```

### Transaction
```typescript
const result = await prisma.$transaction([
  prisma.project.update({ where: { id }, data: { status: 'Completed' } }),
  prisma.budgetPool.update({ where: { id: poolId }, data: { usedAmount: { increment: 1000 } } }),
]);

// 互動式 Transaction
const result = await prisma.$transaction(async (tx) => {
  const project = await tx.project.update({ ... });
  await tx.history.create({ ... });
  return project;
});
```

## 📊 效能優化

### 選擇性欄位載入
```typescript
// ✅ 只載入需要的欄位
const projects = await prisma.project.findMany({
  select: {
    id: true,
    name: true,
    status: true,
  },
});

// ❌ 避免載入所有欄位（如果不需要）
const projects = await prisma.project.findMany(); // 載入所有欄位
```

### 批次操作
```typescript
// createMany
await prisma.project.createMany({
  data: [{ ... }, { ... }],
});

// updateMany
await prisma.project.updateMany({
  where: { status: 'Draft' },
  data: { status: 'Archived' },
});
```

## 相關文件
- `packages/api/src/routers/*.ts` - 使用 Prisma Client 的 API Routers
- `packages/api/src/trpc.ts` - Prisma Client 注入到 tRPC Context
- [Prisma 官方文檔](https://www.prisma.io/docs)
