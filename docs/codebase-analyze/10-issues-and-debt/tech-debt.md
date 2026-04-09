# 技術債務評估報告 (Technical Debt Assessment)

> **評估日期**: 2026-04-09
> **評估範圍**: 程式碼重複、TODO/FIXME、不一致模式、超大檔案、硬編碼值、依賴管理、文件準確性
> **嚴重程度等級**: Critical / High / Medium / Low

---

## 1. TODO / FIXME 註解

### DEBT-001: 未完成的 TODO 項目 — 共 15 處

- **嚴重程度**: Medium
- **描述**: 在 `.ts` 和 `.tsx` 檔案中搜尋到 15 個 TODO/FIXME 註解，分佈在 8 個檔案中。

#### 功能性 TODO（影響使用者體驗）

| 檔案 | 行號 | 內容 | 嚴重程度 |
|------|------|------|----------|
| `apps/web/src/app/[locale]/forgot-password/page.tsx` | 75 | `// TODO: 實現密碼重設 API 調用` — 目前使用 `setTimeout` 模擬，功能完全不可用 | High |
| `apps/web/src/app/[locale]/settings/page.tsx` | 96 | `// TODO: 實現 API 調用保存個人資料` — 儲存按鈕僅顯示 toast，不實際保存 | High |
| `apps/web/src/app/[locale]/settings/page.tsx` | 105 | `// TODO: 實現 API 調用保存通知設定` — 同上 | High |
| `apps/web/src/app/[locale]/settings/page.tsx` | 114 | `// TODO: 實現 API 調用保存顯示偏好` — 同上 | High |
| `apps/web/src/app/[locale]/projects/page.tsx` | 343, 346 | `// TODO: Add toast notification` — 缺少操作回饋 | Low |

#### 後端 TODO（功能缺失）

| 檔案 | 行號 | 內容 | 嚴重程度 |
|------|------|------|----------|
| `packages/api/src/routers/chargeOut.ts` | 501 | `// TODO: 發送通知給主管` | Medium |
| `packages/api/src/routers/chargeOut.ts` | 560 | `// TODO: 發送通知給創建者` | Medium |
| `packages/api/src/routers/chargeOut.ts` | 623 | `// TODO: 發送通知給創建者` | Medium |
| `packages/api/src/routers/quote.ts` | 479 | `// TODO: 同時刪除關聯的檔案（從文件系統或 Azure Blob Storage）` — 刪除報價時不清理已上傳檔案 | Medium |
| `packages/api/src/lib/email.ts` | 112 | `// TODO: 整合 SendGrid (Story 8.1 後期優化)` | Low |

#### 測試 TODO

| 檔案 | 行號 | 內容 |
|------|------|------|
| `apps/web/e2e/workflows/procurement-workflow.spec.ts` | 362 | `// TODO: 需要修復 ExpensesPage 的 HotReload 根本問題` |
| `apps/web/e2e/workflows/procurement-workflow.spec.ts` | 615 | `// TODO: 實現費用拒絕流程測試` |

#### 導航 TODO

| 檔案 | 行號 | 內容 |
|------|------|------|
| `apps/web/src/components/layout/Sidebar.tsx` | 265 | `// TODO: 待實現 Help 頁面後恢復` |

---

## 2. 不一致模式 (Inconsistent Patterns)

### DEBT-002: 表單處理模式混用 — react-hook-form vs useState

- **嚴重程度**: Medium
- **描述**: 專案中同時存在兩種表單處理方式：
  - **react-hook-form**: 7 個檔案使用（搜尋 `react-hook-form|useForm` 找到 7 個匹配）
    - `OMExpenseItemForm.tsx`
    - `OMExpenseForm.tsx`
    - `BudgetPoolForm.tsx`
    - `ExpenseForm.tsx`
    - `ChargeOutForm.tsx`
    - `PurchaseOrderForm.tsx`
    - `ui/form.tsx`（shadcn/ui 整合元件）
  - **useState**: 其餘表單使用（如 `VendorForm.tsx`、`UserForm.tsx`、`ProjectForm.tsx`）
- **影響**: 增加維護成本，新開發者不確定該用哪種方式
- **建議**: 統一使用 react-hook-form + zod resolver，逐步遷移 useState 表單

### DEBT-003: Toast 通知系統存在兩套

- **嚴重程度**: Medium
- **檔案**: 
  - `apps/web/src/components/ui/Toast.tsx`（自製 Toast Provider，Context API 實作，6103 bytes）
  - `apps/web/src/components/ui/toaster.tsx` + `use-toast.tsx`（shadcn/ui Toast，Pub/Sub 模式，6265 bytes）
- **描述**: 存在兩個完全獨立的 Toast 通知系統：
  1. **Toast.tsx** — 自製的 Context API-based Toast Provider（基於 `createContext` + `useContext`）
  2. **toaster.tsx + use-toast.tsx** — shadcn/ui 標準 Toast 系統（基於 Pub/Sub 模式）
- **驗證**: 搜尋 `useToast` 在 51 個檔案中使用，表示主要使用的是 shadcn/ui 版本
- **建議**: 移除 `Toast.tsx`（自製版本），統一使用 shadcn/ui 的 toast 系統

### DEBT-004: authOptions 類型定義使用 `any`

- **嚴重程度**: Low
- **檔案**: `packages/auth/src/index.ts` 第 175 行
- **描述**: `export const authOptions: any = { ... }` — NextAuth 配置使用 `any` 類型，遺失了所有型別安全。搭配 `// eslint-disable-next-line @typescript-eslint/no-explicit-any` 註解。
- **建議**: 使用 `NextAuthConfig` 或 `AuthOptions` 正確的類型定義

### DEBT-005: `as any` 類型斷言散布在前端程式碼中

- **嚴重程度**: Medium
- **描述**: 在 `apps/web/src` 中搜尋到 13+ 處 `as any` 使用，主要集中在 session 物件存取：
  - `(session?.user as any)?.role?.name` — 出現在 `TopBar.tsx`（第 260 行）、`Sidebar.tsx`（第 337 行）、`settings/page.tsx`（第 209 行）、`users/[id]/page.tsx`（第 99 行）、`charge-outs/[id]/page.tsx`（第 215 行）
  - `t('...' as any)` — Dashboard 頁面中的動態翻譯 key
  - `locale as any` — i18n routing 中的 locale 類型不匹配
- **根本原因**: NextAuth session 的 TypeScript 類型定義在 `packages/auth/src/index.ts` 中擴展了 `Session` 類型，但前端的 `useSession()` 回傳值沒有正確推斷擴展後的類型
- **建議**: 修正 NextAuth 的類型定義，確保 session.user.role 不需要 `as any`

---

## 3. 超大檔案 (Oversized Files)

### DEBT-006: 超過 500 行的 .ts/.tsx 檔案 — 共 29 個

- **嚴重程度**: Medium
- **描述**: 以下檔案超過 500 行，增加閱讀和維護難度。

#### 超過 1000 行（應拆分）

| 檔案 | 行數 | 說明 |
|------|------|------|
| `packages/api/src/routers/omExpense.ts` | 2762 | OM 費用 Router，包含 15+ procedures |
| `packages/api/src/routers/project.ts` | 2634 | 專案 Router，包含 FEAT-001/006/010 擴展 |
| `packages/api/src/routers/health.ts` | 2421 | 健康檢查 + Schema 同步（應為獨立工具） |
| `apps/web/src/app/[locale]/data-import/page.tsx` | 1606 | Excel 匯入頁面 |
| `packages/api/src/routers/expense.ts` | 1382 | 費用 Router |
| `apps/web/src/app/[locale]/projects/[id]/page.tsx` | 1223 | 專案詳情頁 |
| `apps/web/src/app/[locale]/project-data-import/page.tsx` | 1145 | 另一個匯入頁面（可能是重複） |
| `packages/api/src/routers/chargeOut.ts` | 1040 | 費用轉嫁 Router |
| `apps/web/src/components/om-summary/OMSummaryDetailGrid.tsx` | 1032 | OM Summary 詳情網格 |
| `apps/web/src/app/[locale]/expenses/page.tsx` | 1008 | 費用列表頁 |
| `packages/api/src/routers/purchaseOrder.ts` | 1004 | 採購單 Router |

#### 500-999 行（建議拆分）

| 檔案 | 行數 |
|------|------|
| `apps/web/src/app/[locale]/projects/page.tsx` | 980 |
| `apps/web/src/components/om-expense/OMExpenseForm.tsx` | 969 |
| `packages/api/src/routers/budgetProposal.ts` | 941 |
| `apps/web/src/components/project/ProjectForm.tsx` | 813 |
| `apps/web/src/app/[locale]/purchase-orders/page.tsx` | 813 |
| `apps/web/src/components/expense/ExpenseForm.tsx` | 800 |
| `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` | 744 |
| `apps/web/src/app/[locale]/quotes/page.tsx` | 726 |
| `packages/api/src/routers/quote.ts` | 712 |
| `packages/api/src/routers/budgetPool.ts` | 688 |
| `apps/web/src/app/[locale]/om-expenses/page.tsx` | 677 |
| `apps/web/src/components/charge-out/ChargeOutForm.tsx` | 652 |
| `apps/web/src/components/purchase-order/PurchaseOrderForm.tsx` | 640 |
| `apps/web/src/app/[locale]/proposals/page.tsx` | 617 |
| `apps/web/src/components/om-expense/OMExpenseItemList.tsx` | 615 |
| `apps/web/src/app/[locale]/charge-outs/page.tsx` | 601 |
| `packages/api/src/lib/schemaDefinition.ts` | 599 |
| `apps/web/src/components/om-expense/OMExpenseItemForm.tsx` | 599 |

---

## 4. 依賴管理問題

### DEBT-007: bcrypt 和 bcryptjs 重複安裝

- **嚴重程度**: Low
- **檔案**: `apps/web/package.json` 第 55-56 行
- **描述**: 同時安裝：
  - `bcrypt` (^6.0.0) + `@types/bcrypt` (^6.0.0) — native C++ 模組
  - `bcryptjs` (^2.4.3) + `@types/bcryptjs` (^2.4.6) — 純 JavaScript 實作
- **驗證**: 搜尋 `from 'bcrypt'`（不含 bcryptjs）在 .ts/.tsx 中無結果，確認只使用 `bcryptjs`
- **建議**: 移除 `bcrypt` 和 `@types/bcrypt`

### DEBT-008: Zustand / Jotai 在 CLAUDE.md 提及但未實際使用

- **嚴重程度**: Low
- **描述**: `CLAUDE.md` 在多處提到「State: Zustand / Jotai」和「使用 Zustand 或 Jotai 為 client state（prefer over Redux）」，但搜尋 `zustand` 和 `jotai` 在所有 .ts/.tsx 檔案中均無結果（0 筆匹配）。package.json 中也沒有這兩個依賴。
- **影響**: 文件誤導開發者
- **建議**: 更新 CLAUDE.md 移除 Zustand/Jotai 的提及，或如確實計劃使用則標註為「規劃中」

---

## 5. CLAUDE.md 不準確之處

### DEBT-009: Prisma Model 數量不一致

- **嚴重程度**: Low
- **描述**: 
  - `CLAUDE.md` 宣稱 "Prisma Models: 27"
  - `packages/db/prisma/CLAUDE.md` 宣稱 "31 個 Prisma Models"
  - **實際計數**: schema.prisma 中 `model` 關鍵字出現 **32 次**
  
  32 個 Model 完整列表：User, Account, Session, VerificationToken, Role, Permission, RolePermission, UserPermission, BudgetPool, Project, BudgetProposal, Vendor, Quote, PurchaseOrder, Expense, Comment, History, Notification, OperatingCompany, ProjectChargeOutOpCo, UserOperatingCompany, BudgetCategory, ProjectBudgetCategory, PurchaseOrderItem, ExpenseItem, ExpenseCategory, OMExpense, OMExpenseItem, OMExpenseMonthly, ChargeOut, ChargeOutItem, Currency

- **建議**: 更新 CLAUDE.md 中的 model 數量為 32

### DEBT-010: 其他 CLAUDE.md 不準確事項

- **嚴重程度**: Low
- **描述**:
  - CLAUDE.md 提到 "Next.js 14.1.0"，但 `package.json` 顯示 `next: "14.2.33"`
  - CLAUDE.md 提到 "16 routers"，但 routers 目錄下的 CLAUDE.md 提到 "17 個"
  - CLAUDE.md 提到 "75+ components"，但 components CLAUDE.md 提到 "89+ 個 .tsx 檔案"
  - CLAUDE.md 的 `lastUpdated` 為 2025-12-18，但專案持續有更新（最新 commit 為 CHANGE-041）
  - CLAUDE.md 提到 "Prisma 5.22.0"，需驗證是否已更新

---

## 6. 程式碼重複

### DEBT-011: 兩個 Data Import 頁面可能重複

- **嚴重程度**: Medium
- **檔案**: 
  - `apps/web/src/app/[locale]/data-import/page.tsx`（1606 行）
  - `apps/web/src/app/[locale]/project-data-import/page.tsx`（1145 行）
- **描述**: 存在兩個資料匯入頁面。`data-import` 是 FEAT-008 的 OM Expense 匯入頁面，`project-data-import` 是 FEAT-010 的 Project 匯入頁面。雖然功能不同，但都是 Excel 匯入流程，可能有大量重複的匯入邏輯（解析、驗證、預覽、批量操作）。
- **建議**: 抽取共用的 Excel 匯入邏輯為共用 hook 或元件

### DEBT-012: 上傳 API 的程式碼高度重複

- **嚴重程度**: Medium
- **檔案**:
  - `apps/web/src/app/api/upload/quote/route.ts`（243 行）
  - `apps/web/src/app/api/upload/invoice/route.ts`（170 行）
  - `apps/web/src/app/api/upload/proposal/route.ts`（174 行）
- **描述**: 三個上傳 API 的程式碼結構幾乎完全相同：
  - 相同的檔案驗證邏輯（MIME type 白名單、大小限制）
  - 相同的 Azure Blob Storage 上傳流程
  - 相同的錯誤處理模式
  - 相同的 console.log 日誌格式
- **建議**: 抽取共用的 `validateAndUploadFile` 工具函數

### DEBT-013: Dashboard 統計卡片組件重複

- **嚴重程度**: Low
- **檔案**:
  - `apps/web/src/components/dashboard/StatCard.tsx`
  - `apps/web/src/components/dashboard/StatsCard.tsx`
- **描述**: 存在兩個名稱幾乎相同的統計卡片元件（`StatCard` vs `StatsCard`），可能是不同時期建立的重複版本。
- **建議**: 確認使用情況，合併或移除其中一個

---

## 7. 其他技術債務

### DEBT-014: 忘記密碼功能完全是模擬實作

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/[locale]/forgot-password/page.tsx` 第 78-79 行
- **描述**: 
  ```typescript
  // 模擬 API 調用
  await new Promise(resolve => setTimeout(resolve, 1000));
  ```
  忘記密碼功能使用 `setTimeout` 模擬 API 呼叫，點擊發送後顯示「成功」頁面，但實際上沒有發送任何郵件。使用者會以為重設郵件已發送，但永遠收不到。
- **建議**: 實作實際的密碼重設流程或暫時隱藏此功能

### DEBT-015: Settings 頁面的三個 Save 按鈕都是空操作

- **嚴重程度**: High
- **檔案**: `apps/web/src/app/[locale]/settings/page.tsx` 第 96, 105, 114 行
- **描述**: 三個儲存處理函數（handleSaveProfile、handleSaveNotifications、handleSavePreferences）都只顯示成功 toast，沒有實際的 API 呼叫。使用者以為設定已儲存，但下次進入頁面會恢復預設值。
- **建議**: 實作對應的 API 或明確標示為「開發中」

### DEBT-016: 生產環境中保留大量 Debug 日誌

- **嚴重程度**: Medium
- **描述**: `packages/auth/src/index.ts` 中有 18 條 console.log（認證相關），上傳 API 中有 12+ 條 console.log，seed API 中有 7 條。這些在生產環境會產生大量日誌輸出，影響效能和日誌可讀性。

---

## 統計摘要

| 類別 | 數量 |
|------|------|
| **TODO/FIXME** | 15 處（8 個檔案） |
| **不一致模式** | 5 項 |
| **超大檔案（>500 行）** | 29 個 |
| **超大檔案（>1000 行）** | 11 個 |
| **依賴問題** | 2 項 |
| **文件不準確** | 5+ 項 |
| **程式碼重複** | 3 組 |
| **空操作 / 模擬功能** | 2 處（影響 4 個使用者功能） |

| 嚴重程度 | 數量 |
|----------|------|
| **High** | 4 (DEBT-001 部分, DEBT-014, DEBT-015) |
| **Medium** | 8 |
| **Low** | 6 |
