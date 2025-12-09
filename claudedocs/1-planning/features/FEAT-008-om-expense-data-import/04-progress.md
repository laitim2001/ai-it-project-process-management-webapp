# FEAT-008: OM Expense 資料導入 - 開發進度

> **建立日期**: 2025-12-09
> **最後更新**: 2025-12-09
> **狀態**: 📋 規劃完成

---

## 📊 整體進度

- [x] Phase 0: 規劃準備
- [ ] Phase 1: 準備工作
- [ ] Phase 2: 後端 API 開發
- [ ] Phase 3: 前端頁面開發
- [ ] Phase 4: 資料準備
- [ ] Phase 5: 測試驗證

---

## 📝 開發日誌

### 2025-12-09 (更新)

**完成項目:**
- 分析導入資料 Excel 檔案結構
- 確認 500 行資料，69 個 Header，160 個 Item，9 個 Category，42 個 OpCo
- 建立 FEAT-008 功能規劃文檔
  - 01-requirements.md
  - 02-technical-design.md
  - 03-implementation-plan.md
  - 04-progress.md
- **更新規劃文檔，加入用戶最終確認的設計決策**

**用戶確認事項:**
1. 唯一性規則：`header 名稱 + item 名稱 + Charge to OpCos`
2. OpCo 處理：保留原始名稱（方案 A）
3. Financial Year：固定 2026 (FY26)
4. **Rollback 策略**：全部 Rollback（任何失敗就全部回滾）✅
5. 空預算金額：設為 0
6. **導入方式**：tRPC API endpoint + 獨立 Data Import 頁面 (`/data-import`) ✅
7. **月度記錄**：導入時建立 12 個月度記錄（actualAmount = 0）✅
8. **新增欄位**：`lastFYActualExpense` (Float?) - 上年度實際支出 ✅
9. **表單更新**：OM Expense Item 表單新增 "Last year actual expense" 輸入欄位 ✅

**下一步:**
- 開始 Phase 2 後端 API 開發
- 實作 `omExpense.importData` procedure
- 開始 Phase 3 前端頁面開發
- 建立 `/data-import` 頁面

---

## 🎯 設計決策摘要

| 項目 | 決策 | 說明 |
|------|------|------|
| UI 方案 | 獨立 Data Import 頁面 | `/data-import` 路由 |
| Rollback 策略 | 全部 Rollback | 任何失敗就全部回滾，確保資料一致性 |
| 月度記錄 | 導入時建立 | 每個 Item 建立 12 個 Monthly 記錄，actualAmount = 0 |
| 唯一性檢查 | Header + Item + OpCo | 重複時觸發 Rollback |
| OpCo 處理 | 保留原始名稱 | 不進行規範化，保留括號標記 |
| 新增欄位 | lastFYActualExpense | Float? 類型，用於 Summary 年度比較 |
| 表單更新 | Last year actual expense | 在 OM Expense Item 表單中新增輸入欄位 |

---

## 🐛 問題追蹤

| 問題 | 狀態 | 解決方案 |
|------|------|----------|
| (暫無) | - | - |

---

## ✅ 測試結果

### Phase 5 測試（待執行）

- [ ] 小批量導入測試（10 筆）
- [ ] 完整導入測試（500 筆）
- [ ] 重複導入測試（確認 Rollback）
- [ ] 前端頁面測試

---

## 📈 統計資訊

### 導入資料統計

| 項目 | 數量 |
|------|------|
| 總資料行數 | 500 |
| 唯一 Headers | 69 |
| 唯一 Items | 160 |
| Categories | 9 |
| Operating Companies | 42 |
| 預計 Monthly 記錄 | 6,000 (500 × 12) |

### 9 個 Expense Categories

1. Application System
2. Cloud
3. Computer Room Maintenance
4. Datalines
5. Hardware
6. IT Security
7. Network
8. Others
9. Software

---

## 📁 文件變更清單

### 新增文件

| 文件 | 狀態 | 說明 |
|------|------|------|
| `apps/web/src/app/[locale]/data-import/page.tsx` | ⏳ 待建立 | Data Import 頁面 |
| `apps/web/src/app/[locale]/data-import/components/*.tsx` | ⏳ 待建立 | 頁面組件 |
| `scripts/convert-import-excel-to-json.py` | ⏳ 待建立 | Excel 轉 JSON 腳本 |

### 修改文件

| 文件 | 狀態 | 說明 |
|------|------|------|
| `packages/db/prisma/schema.prisma` | ⏳ 待修改 | OMExpenseItem 新增 lastFYActualExpense 欄位 |
| `packages/api/src/routers/omExpense.ts` | ⏳ 待修改 | 新增 `importData` procedure，更新 addItem/updateItem |
| `apps/web/src/components/om-expense/OMExpenseItemForm.tsx` | ⏳ 待修改 | 新增 "Last year actual expense" 輸入欄位 |
| `apps/web/src/components/layout/Sidebar.tsx` | ⏳ 待修改 | 新增 Data Import 導航 |
| `apps/web/src/messages/en.json` | ⏳ 待修改 | 新增 dataImport 翻譯，更新 omExpense |
| `apps/web/src/messages/zh-TW.json` | ⏳ 待修改 | 新增 dataImport 翻譯，更新 omExpense |

---

## 🔗 相關文檔

- [01-requirements.md](./01-requirements.md) - 需求規格
- [02-technical-design.md](./02-technical-design.md) - 技術設計
- [03-implementation-plan.md](./03-implementation-plan.md) - 實施計劃
- [docs/import-data-analysis.json](../../../../docs/import-data-analysis.json) - 導入資料分析結果
