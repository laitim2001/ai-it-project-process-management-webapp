# API Router 總覽索引

> **分析日期**: 2026-04-09
> **總計**: 17 個 Routers, 200 個 Procedures, ~16,979 行程式碼

---

## Router 清單

| # | Router | 檔案 | 行數 | Procedures | 主要功能 |
|---|--------|------|------|------------|----------|
| 1 | budgetPool | budgetPool.ts | 689 | 11 | 預算池 CRUD + 統計 + 類別管理 |
| 2 | budgetProposal | budgetProposal.ts | 963 | 12 | 預算提案 CRUD + 審批工作流 (FIX-105/112) |
| 3 | chargeOut | chargeOut.ts | 1,045 | 13 | 費用轉嫁 CRUD + 狀態機 |
| 4 | currency | currency.ts | 353 | 7 | 幣別 CRUD + 啟用/停用 |
| 5 | dashboard | dashboard.ts | 527 | 4 | PM/Supervisor 儀表板 + CSV 導出 |
| 6 | expense | expense.ts | 1,387 | 15 | 費用 CRUD + 審批 + 預算扣減 |
| 7 | expenseCategory | expenseCategory.ts | 337 | 7 | 費用類別 CRUD |
| 8 | health | health.ts | 2,421 | 21 | 健康檢查 + Schema 診斷修復 (FIX-102) |
| 9 | notification | notification.ts | 382 | 7 | 通知 CRUD + 已讀管理 |
| 10 | omExpense | omExpense.ts | 2,762 | 19 | OM 費用表頭-明細 CRUD |
| 11 | operatingCompany | operatingCompany.ts | 439 | 9 | 營運公司 CRUD |
| 12 | permission | permission.ts | 451 | 7 | 權限管理 |
| 13 | project | project.ts | 2,640 | 25 | 專案 CRUD + 預算類別 + 匯入 |
| 14 | purchaseOrder | purchaseOrder.ts | 1,004 | 13 | 採購單 CRUD + 品項管理 |
| 15 | quote | quote.ts | 712 | 11 | 報價 CRUD + 文件上傳 |
| 16 | user | user.ts | 520 | 13 | 用戶 CRUD + 密碼管理 (FIX-101) |
| 17 | vendor | vendor.ts | 347 | 6 | 供應商 CRUD |

**基礎設施檔案**:
- `root.ts` — 合併 17 個 routers 為 appRouter
- `trpc.ts` — tRPC 初始化, 4 種 procedure 類型, JWT session context
- `lib/email.ts` — EmailService singleton (466 行)
- `lib/passwordValidation.ts` — 密碼驗證規則 (147 行)
- `lib/schemaDefinition.ts` — Schema 定義工具 (599 行)

---

## 權限分佈

| Procedure 類型 | 數量 | 說明 |
|---------------|------|------|
| protectedProcedure | 149 | 需登入 |
| supervisorProcedure | 18 | 需主管角色 |
| adminProcedure | 23 | 需管理員角色 (health 11 + currency 4 + permission 4 + user 4) |
| publicProcedure | 10 | 無需登入 (health 診斷查詢 only) |

> **FIX-101**: user.ts 全部改為 protectedProcedure / adminProcedure（原先 10 個 publicProcedure）
> **FIX-102**: health.ts 所有 mutation 改為 adminProcedure（原先 21 個全為 publicProcedure）

---

## 狀態機總覽

| 實體 | 狀態流 |
|------|--------|
| BudgetProposal | Draft → PendingApproval → Approved / Rejected / MoreInfoRequired |
| Expense | Draft → Submitted → Approved → Paid |
| ChargeOut | Draft → Submitted → Confirmed → Paid / Rejected |

---

## 關鍵發現

1. **✅ 已修復 (FIX-101)**: ~~`user.ts` 大部分操作使用 `publicProcedure`~~ → 已改為 protectedProcedure (查詢) + adminProcedure (CUD + setPassword)
2. **✅ 已修復 (FIX-102)**: ~~`health.ts` 全部 publicProcedure~~ → mutation 已改為 adminProcedure，查詢保留 publicProcedure
3. **📋 通知內聯**: budgetProposal 和 expense 在 transaction 中直接建立通知
4. **📋 向後兼容**: omExpense 同時維護舊單一結構和新表頭-明細 API
5. **📋 預算會計**: expense.approve 自動扣減 BudgetPool/BudgetCategory，revert 操作含 Math.max(0,...) 安全保護
6. **✅ 已修復 (FIX-105)**: budgetProposal submit/approve 移除前端傳入的 userId，改用 ctx.session.user.id
7. **✅ 已修復 (FIX-112)**: budgetProposal.getAll 新增分頁支援（page/limit）

---

## 詳細分析文件

每個 Router 的完整分析見 `detail/` 目錄：
- [budgetPool.md](detail/budgetPool.md)
- [budgetProposal.md](detail/budgetProposal.md)
- [chargeOut.md](detail/chargeOut.md)
- [currency.md](detail/currency.md)
- [dashboard.md](detail/dashboard.md)
- [expense.md](detail/expense.md)
- [expenseCategory.md](detail/expenseCategory.md)
- [health.md](detail/health.md)
- [notification.md](detail/notification.md)
- [omExpense.md](detail/omExpense.md)
- [operatingCompany.md](detail/operatingCompany.md)
- [permission.md](detail/permission.md)
- [project.md](detail/project.md)
- [purchaseOrder.md](detail/purchaseOrder.md)
- [quote.md](detail/quote.md)
- [user.md](detail/user.md)
- [vendor.md](detail/vendor.md)
- [root-and-trpc.md](detail/root-and-trpc.md)
- [shared-libs.md](detail/shared-libs.md)
