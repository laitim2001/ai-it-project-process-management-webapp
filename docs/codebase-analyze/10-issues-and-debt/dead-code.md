# 死碼與未使用程式碼報告 (Dead Code Analysis)

> **分析日期**: 2026-04-09
> **分析範圍**: 未使用匯出、未使用路由、孤立腳本、未使用 Model、備份檔案、空實作
> **嚴重程度等級**: High / Medium / Low

---

## 1. 空實作與模擬功能 (Stub / Mock Implementations)

### DEAD-001: 忘記密碼頁面 — 完全模擬實作

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/[locale]/forgot-password/page.tsx`
- **行號**: 第 75-79 行
- **描述**: 忘記密碼功能完全是模擬：
  ```typescript
  // TODO: 實現密碼重設 API 調用
  // const result = await sendPasswordResetEmail({ email });

  // 模擬 API 調用
  await new Promise(resolve => setTimeout(resolve, 1000));
  ```
  - 頁面可正常訪問且有完整 UI（共 194 行）
  - JSDoc 明確標註為 "MVP 版本，使用模擬 API"（第 7 行）
  - `@todo` 列出三個未完成項目（第 39-43 行）：整合 Azure AD B2C、實作 API 端點、添加 SendGrid 郵件發送
- **建議**: 實作功能或在導航中隱藏此頁面連結

### DEAD-002: Settings 頁面 — 三個空操作 Save 函數

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/[locale]/settings/page.tsx`
- **行號**: 第 96, 105, 114 行
- **描述**: 三個儲存處理函數只顯示 toast，無實際 API 呼叫：
  ```typescript
  const handleSaveProfile = () => {
    // TODO: 實現 API 調用保存個人資料
    toast({ title: t('toast.success'), description: t('toast.profileUpdated'), variant: 'success' });
  };

  const handleSaveNotifications = () => {
    // TODO: 實現 API 調用保存通知設定
    toast({ ... });
  };

  const handleSavePreferences = () => {
    // TODO: 實現 API 調用保存顯示偏好
    toast({ ... });
  };
  ```
- **影響**: 使用者操作 Settings 頁面時，所有修改都不會實際保存

---

## 2. 可能重複的頁面 / 路由

### DEAD-003: project-data-import 頁面 — 可能為舊版或替代版

- **嚴重程度**: Medium
- **檔案**: `apps/web/src/app/[locale]/project-data-import/page.tsx`（1145 行）
- **對比**: `apps/web/src/app/[locale]/data-import/page.tsx`（1606 行）
- **描述**: 存在兩個資料匯入頁面：
  - `data-import/` — FEAT-008 的 OM Expense 匯入（較新、較大、在 middleware protectedRoutes 中有列出）
  - `project-data-import/` — FEAT-010 的 Project 匯入
- **引用情況**: 搜尋 `project-data-import` 在 `apps/web/src` 中只被 3 個檔案引用：
  - `components/layout/Sidebar.tsx`（導航連結）
  - `hooks/usePermissions.ts`（權限檢查）
  - 自己（`page.tsx`）
- **注意**: `project-data-import` 在 middleware.ts 的 `protectedRoutes` 列表中**未列出**（第 132-150 行），可能表示此路由未受認證保護
- **建議**: 確認此頁面是否仍在使用，若是則加入 protectedRoutes；若為舊版則移除

---

## 3. 孤立腳本 (Orphan Scripts)

### DEAD-004: 未在 package.json 中註冊的腳本 — 共 17 個

- **嚴重程度**: Medium
- **描述**: `scripts/` 目錄下共有 27 個腳本，但在根 `package.json` 的 `scripts` 中只有 10 個腳本被引用。以下 17 個腳本沒有對應的 pnpm 命令：

#### 一次性修復/遷移腳本（可清理）

| 腳本 | 用途 | 建議 |
|------|------|------|
| `scripts/fix-breadcrumb-routing.js` | 修復麵包屑路由 | 一次性執行，可歸檔 |
| `scripts/fix-import-semicolons.js` | 修復 import 分號 | 一次性執行，可歸檔 |
| `scripts/add-missing-link-import.js` | 添加缺失的 Link import | 一次性執行，可歸檔 |
| `scripts/add-login-errors.js` | 添加登入錯誤 | 一次性執行，可歸檔 |
| `scripts/add-page-jsdoc.js` | 批量添加 JSDoc | 一次性執行，可歸檔 |
| `scripts/remove-locale-prefix.js` | 移除 locale 前綴 | 一次性遷移，可歸檔 |
| `scripts/run-migration-feat-002.js` | FEAT-002 遷移 | 已完成，可歸檔 |
| `scripts/generate-en-translations.js` | 生成英文翻譯 | 一次性執行，可歸檔 |
| `scripts/i18n-migration-helper.js` | i18n 遷移助手 | 遷移已完成，可歸檔 |
| `scripts/inspect-user-schema.js` | 檢查 User schema | 除錯工具，可歸檔 |

#### 測試/除錯腳本（保留或移入 e2e）

| 腳本 | 用途 | 建議 |
|------|------|------|
| `scripts/create-test-users.ts` | 建立測試用戶 | 保留，加入 pnpm 命令 |
| `scripts/check-test-users.ts` | 檢查測試用戶 | 保留 |
| `scripts/verify-test-user.ts` | 驗證測試用戶 | 與上重複？ |
| `scripts/test-auth-manually.ts` | 手動測試認證 | 保留 |
| `scripts/test-blob-storage.js` | 測試 Blob Storage | 保留 |
| `scripts/test-db-connection.js` | 測試 DB 連線 | 保留，加入 pnpm 命令 |
| `scripts/test-nextauth-direct.ts` | 測試 NextAuth | 保留 |
| `scripts/run-login-test.ts` | 登入測試 | 保留 |
| `scripts/test-browser-login.spec.ts` | 瀏覽器登入測試 | 應移入 e2e 目錄 |
| `scripts/check-duplicate-imports.js` | 檢查重複 import | 保留 |
| `scripts/analyze-i18n-scope.js` | 分析 i18n 範圍 | 保留 |

---

## 4. 未使用或低使用率的 Prisma Models

### DEAD-005: NextAuth 相關 Models 未直接使用（JWT 模式）

- **嚴重程度**: Low
- **描述**: 以下 Models 在 API Routers 中未被直接引用（搜尋結果為 0 個 router 檔案引用）：
  - **Account**（0 筆引用）— NextAuth OAuth 帳號模型
  - **Session**（0 筆引用）— NextAuth Session 模型
  - **VerificationToken**（0 筆引用）— NextAuth 驗證 token 模型
- **說明**: 這些 Models 是 NextAuth 內部使用的。但由於系統使用 JWT 策略（`session: { strategy: 'jwt' }`，見 `packages/auth/src/index.ts` 第 179 行），Session 和 VerificationToken 模型可能完全不需要。Account 模型在 Azure AD B2C 流程中由 NextAuth 自動使用。
- **建議**: 如果確認完全使用 JWT 策略，可考慮移除 Session 和 VerificationToken 模型（但需謹慎，因為 NextAuth 可能仍會嘗試存取）

### DEAD-006: ProjectBudgetCategory Model 使用率低

- **嚴重程度**: Low
- **描述**: `ProjectBudgetCategory` 模型只在 2 個 router 檔案中被引用：
  - `packages/api/src/routers/project.ts`
  - `packages/api/src/routers/health.ts`（schema 同步用途）
- **說明**: 這個 Model 可能是過渡性的實作，用於 Project 和 BudgetCategory 的多對多關係。確認是否有替代方案。

---

## 5. 可能未使用的 UI 組件

### DEAD-007: Toast.tsx (自製 Toast Provider) — 疑似被 shadcn/ui Toast 取代

- **嚴重程度**: Medium
- **檔案**: `apps/web/src/components/ui/Toast.tsx`（6103 bytes）
- **描述**: 如 tech-debt.md DEBT-003 所述，存在兩套 Toast 系統。`Toast.tsx` 使用 Context API 實作，而 `toaster.tsx` + `use-toast.tsx` 是 shadcn/ui 標準 Toast。根據 `useToast` 在 51 個檔案中被引用的情況，主要系統使用的是 shadcn/ui 版本。
- **驗證方式**: 檢查 `Toast.tsx` 中的 `ToastProvider` 或 `useToast`（from Toast.tsx）是否仍被匯入
- **建議**: 確認無使用後移除

### DEAD-008: StatCard.tsx vs StatsCard.tsx — 重複的統計卡片組件

- **嚴重程度**: Low
- **檔案**:
  - `apps/web/src/components/dashboard/StatCard.tsx`
  - `apps/web/src/components/dashboard/StatsCard.tsx`
- **描述**: 兩個名稱幾乎相同的統計卡片元件，可能其中一個已被另一個取代。
- **建議**: 確認使用情況，移除未使用的版本

---

## 6. 備份 / 過時檔案

### DEAD-009: 專案中無發現 .backup / .old / .bak 檔案

- **嚴重程度**: Low (資訊性)
- **描述**: 搜尋 `.backup`、`.old`、`.bak`、`.tmp` 在 .ts/.tsx/.js 檔案中未發現典型的備份檔案。但在一些檔案中有 `template` 關鍵字的引用（`add-page-jsdoc.js` 中使用 template 作為變數名）。
- **說明**: 程式碼庫在這方面維護良好，沒有明顯的備份檔案殘留。

### DEAD-010: OMExpense Model 中大量 @deprecated 欄位

- **嚴重程度**: Low
- **檔案**: `packages/db/prisma/schema.prisma`（OMExpense 模型區塊）
- **描述**: OMExpense 模型包含多個標註為 `@deprecated` 的欄位（根據 CLAUDE.md 記載），保留用於向後兼容：
  - `opCoId` — 已被 `defaultOpCoId` 取代
  - `budgetAmount` — 已被 `totalBudgetAmount` 取代
  - `actualSpent` — 已被 `totalActualSpent` 取代
  - OMExpenseMonthly 的 `omExpenseId` — 已被 `omExpenseItemId` 取代
- **建議**: 制定遷移計劃，在下個大版本中移除這些欄位

---

## 7. 導航中未列出但存在的路由

### DEAD-011: project-data-import 未在 middleware protectedRoutes 中

- **嚴重程度**: Medium
- **檔案**: `apps/web/src/middleware.ts` 第 132-150 行
- **描述**: middleware.ts 的 `protectedRoutes` 列表中包含 `/data-import` 但未包含 `/project-data-import`。這表示 `project-data-import` 頁面可能在未登入狀態下也能存取。
- **protectedRoutes 列表**:
  ```typescript
  const protectedRoutes = [
    '/dashboard', '/projects', '/budget-pools', '/budget-proposals',
    '/vendors', '/purchase-orders', '/expenses', '/users',
    '/om-expenses', '/om-summary', '/charge-outs', '/quotes',
    '/notifications', '/settings', '/data-import', '/operating-companies',
    '/om-expense-categories',
  ];
  ```
  缺少: `/project-data-import`、`/proposals`（注意：列表有 `/budget-proposals` 但路由目錄名是 `proposals`）
- **建議**: 將 `project-data-import` 加入 protectedRoutes，或確認 `/proposals` 是否需要保護

### DEAD-012: ChargeOut 的通知功能完全缺失

- **嚴重程度**: Medium
- **檔案**: `packages/api/src/routers/chargeOut.ts`
- **行號**: 第 501, 560, 623 行
- **描述**: ChargeOut Router 中有三個 TODO 標註通知發送應該實作但尚未完成：
  - 第 501 行：`// TODO: 發送通知給主管`（submit 操作後）
  - 第 560 行：`// TODO: 發送通知給創建者`（confirm 操作後）
  - 第 623 行：`// TODO: 發送通知給創建者`（reject 操作後）
- **影響**: 費用轉嫁的狀態變更不會通知相關人員，與其他模組（如 BudgetProposal、Expense）的行為不一致

### DEAD-013: Quote 刪除不清理已上傳檔案

- **嚴重程度**: Medium
- **檔案**: `packages/api/src/routers/quote.ts` 第 479 行
- **描述**: 
  ```typescript
  // TODO: 同時刪除關聯的檔案（從文件系統或 Azure Blob Storage）
  ```
  刪除 Quote 記錄時，已上傳到 Azure Blob Storage 的報價單檔案不會被刪除，造成儲存空間浪費。
- **建議**: 在刪除 Quote 記錄前，先呼叫 Azure Blob Storage API 刪除對應的檔案

---

## 統計摘要

| 類別 | 數量 |
|------|------|
| **空實作 / 模擬功能** | 2 處（影響 4 個使用者功能） |
| **可能重複的頁面** | 1 組 |
| **孤立腳本（無 pnpm 命令）** | 17 個 |
| **低使用率 Prisma Models** | 4 個 |
| **可能未使用的 UI 組件** | 2 個 |
| **@deprecated 欄位** | 4+ 個 |
| **未受保護的路由** | 1-2 個 |
| **缺失的功能（TODO）** | 4 處 |

| 嚴重程度 | 數量 |
|----------|------|
| **High** | 2 (DEAD-001, DEAD-002) |
| **Medium** | 6 (DEAD-003, DEAD-004, DEAD-007, DEAD-011, DEAD-012, DEAD-013) |
| **Low** | 5 (DEAD-005, DEAD-006, DEAD-008, DEAD-009, DEAD-010) |

## 建議優先處理順序

1. **DEAD-001 + DEAD-002**: 實作或隱藏空操作功能（Settings Save、Forgot Password）
2. **DEAD-011**: 修復 middleware protectedRoutes 遺漏
3. **DEAD-004**: 清理孤立腳本（至少歸檔一次性腳本）
4. **DEAD-007**: 移除重複的 Toast 系統
5. **DEAD-013**: 實作 Quote 檔案清理功能
