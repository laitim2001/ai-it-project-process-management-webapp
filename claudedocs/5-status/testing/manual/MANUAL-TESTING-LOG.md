# 手動測試記錄 (Manual Testing Log)

> **目的**: 記錄手動測試過程、發現的問題和修復結果
> **開始日期**: 2025-11-12
> **測試人員**: 開發團隊
> **測試環境**: Local Development (localhost:3000)

---

## 📋 測試記錄格式

每次測試包含以下信息：
- **日期時間**: 測試執行時間
- **測試模組**: 被測試的功能模組
- **測試場景**: 具體測試步驟
- **預期結果**: 應該出現的行為
- **實際結果**: 實際觀察到的行為
- **問題記錄**: 發現的 Bug 或異常
- **修復狀態**: 已修復 / 進行中 / 待修復

---

## 🧪 測試記錄

### 2025-11-12 23:45 | 預算池模組 (Budget Pools) 測試

**測試人員**: 開發團隊
**測試環境**: Local Development (localhost:3000)
**測試版本**: Commit 581a514

#### 測試場景 1: 新增預算池 (Create Budget Pool)

**測試步驟**:
1. 訪問 `http://localhost:3000/zh-TW/budget-pools/new`
2. 填寫預算池表單
3. 提交表單
4. 查看新建的預算池詳情頁

**預期結果**:
- 表單提交成功
- 顯示成功訊息
- 跳轉到預算池詳情頁
- 無控制台錯誤

**實際結果**: ❌ 失敗
- 預算池創建成功 ✅
- 但控制台出現多個 I18N 錯誤 ❌

**發現問題 - FIX-088**: I18N 缺失 translation keys (Budget Pool 模組)

**錯誤詳情**:
```
IntlError: MISSING_MESSAGE: Could not resolve `common.actions.saving` in messages for locale `en`.
IntlError: MISSING_MESSAGE: Could not resolve `common.messages.success` in messages for locale `en`.
IntlError: MISSING_MESSAGE: Could not resolve `budgetPools.messages.createSuccess` in messages for locale `en`.
IntlError: MISSING_MESSAGE: Could not resolve `budgetPools.detail.projects.empty` in messages for locale `en`.
```

**影響範圍**:
- 繁體中文 (zh-TW) 和英文 (en) 都缺失相同的 keys
- 新增預算池頁面 (new)
- 預算池詳情頁面 ([id])
- 預算池編輯頁面 ([id]/edit)

**缺失的 Keys**:
1. `common.actions.saving` - "Saving..." 按鈕文字
2. `common.messages.success` - 成功訊息標題
3. `budgetPools.messages.createSuccess` - 創建成功訊息
4. `budgetPools.messages.updateSuccess` - 更新成功訊息
5. `budgetPools.detail.projects.empty` - 無專案時的空狀態文字

**修復狀態**: 🔄 進行中

---

#### 測試場景 2: 更新預算池 (Update Budget Pool)

**測試步驟**:
1. 訪問 `http://localhost:3000/zh-TW/budget-pools/4da1640f-b6c2-4820-b4e3-5143683477d5/edit`
2. 修改預算池資料
3. 提交表單
4. 查看更新後的預算池詳情頁

**預期結果**:
- 表單提交成功
- 資料更新到資料庫
- 顯示成功訊息
- 跳轉到預算池詳情頁
- 無控制台錯誤

**實際結果**: ❌ 失敗
- 表單提交但資料未更新 ❌
- 控制台出現 I18N 錯誤 ❌

**發現問題 - FIX-088 (相同問題)**:

**錯誤詳情**:
```
IntlError: MISSING_MESSAGE: Could not resolve `common.actions.saving` in messages for locale `zh-TW`.
IntlError: MISSING_MESSAGE: Could not resolve `common.messages.success` in messages for locale `zh-TW`.
IntlError: MISSING_MESSAGE: Could not resolve `budgetPools.messages.updateSuccess` in messages for locale `zh-TW`.
IntlError: MISSING_MESSAGE: Could not resolve `budgetPools.detail.projects.empty` in messages for locale `zh-TW`.
```

**根本原因**:
- 翻譯檔案 (`apps/web/src/messages/zh-TW.json` 和 `en.json`) 缺失必要的 keys
- 導致 next-intl 無法解析翻譯
- 可能影響功能邏輯執行

**修復優先級**: 🔴 P0 (高優先級) - 影響核心功能

---

### 2025-11-12 14:30 | 專案模組 (Projects) 測試

**測試人員**: 用戶
**測試環境**: Local Development (localhost:3000)
**測試版本**: Commit 2481503 (FIX-088 修復後)

#### 測試場景 3: 訪問專案詳情頁 (View Project Detail)

**測試步驟**:
1. 訪問 `http://localhost:3000/zh-TW/projects/93736072-97e2-4d9e-ac4c-615cfc335308`
2. 查看專案詳細資訊

**預期結果**:
- 專案詳情頁正常顯示
- 預算池資訊正常顯示 (包含總金額)
- 無控制台錯誤

**實際結果**: ❌ 失敗
- 頁面崩潰,無法渲染 ❌
- 控制台出現致命錯誤 ❌

**發現問題 - FIX-089**: budgetPool.totalAmount undefined 錯誤

**錯誤詳情**:
```
Unhandled Runtime Error
TypeError: Cannot read properties of undefined (reading 'toLocaleString')

Source: src\app\[locale]\projects\[id]\page.tsx (532:58)
> 532 |  ${project.budgetPool.totalAmount.toLocaleString()}
```

**影響範圍**:
- 專案詳情頁面 (`/projects/[id]`)
- 新增專案頁面 (`/projects/new`)
- 可能影響 Project list 和 Dashboard

---

#### 測試場景 4: 新增專案 (Create Project)

**測試步驟**:
1. 訪問 `http://localhost:3000/zh-TW/projects/new`
2. 填寫專案表單

**預期結果**:
- 新增頁面正常顯示
- 表單可以填寫
- 無控制台錯誤

**實際結果**: ❌ 失敗
- 頁面崩潰,無法顯示 ❌
- 相同的 `budgetPool.totalAmount` undefined 錯誤 ❌

**根本原因分析**:
在 commit `14815bf` (FIX-094) 時,surgical-task-executor agent 執行 "清理 Budget Pool export API 遺留程式碼" 時過度清理:

1. **任務範圍擴張**: 任務是清理 "Budget Pool export API",但執行了 "清理整個專案中的 totalAmount"
2. **缺乏影響分析**: 未檢查 `totalAmount` 在其他 routers (如 project.ts) 中的使用
3. **誤解 Deprecated**: 將 "DEPRECATED: 保留以向後兼容" 理解為 "可以立即移除"
4. **驗證範圍不足**: 只測試了 Budget Pool export,未測試 Project 相關頁面

**被移除的位置**:
- `project.getAll` (Line 171) - 影響 Project list
- `project.getById` (Line 242) - **影響 Project detail** ← 導致本次問題
- `project.getStats` (Line 501) - 影響 Dashboard
- `project.export` (Line 617) - 影響 CSV 匯出

**修復方案**:
恢復 `packages/api/src/routers/project.ts` 中所有 4 個位置的 `budgetPool.totalAmount` 欄位

**修復狀態**: ✅ 已修復 (待驗證)

**詳細分析**: `claudedocs/5-status/testing/manual/FIX-089-ROOT-CAUSE-ANALYSIS.md`

---

## 📊 測試統計

### 測試覆蓋率
- **已測試模組**: 2/18 (Budget Pools, Projects 部分)
- **測試場景**: 4 個
- **發現問題**: 2 個 (FIX-088, FIX-089)
- **修復完成**: 2 個 (待驗證)

### 問題分類
- **I18N 問題**: 1 個 (FIX-088)
- **API/後端問題**: 1 個 (FIX-089 - Surgical Agent 過度清理)
- **功能性問題**: 0 個
- **UI/UX 問題**: 0 個
- **效能問題**: 0 個

---

## 🔧 待測試模組

### 高優先級 (P0)
- [ ] Projects (專案管理)
- [ ] Budget Proposals (預算提案)
- [ ] Expenses (費用記錄)
- [ ] Notifications (通知系統)

### 中優先級 (P1)
- [ ] Vendors (供應商管理)
- [ ] Quotes (報價單)
- [ ] Purchase Orders (採購訂單)
- [ ] Charge-Outs (費用轉嫁)
- [ ] OM Expenses (營運支出)

### 低優先級 (P2)
- [ ] Dashboard (儀表板)
- [ ] Users (用戶管理)
- [ ] Settings (系統設定)
- [ ] Authentication (登入/註冊)

---

## 📝 測試檢查清單

### Budget Pools 模組
- [x] 新增預算池 - 發現 I18N 問題
- [x] 更新預算池 - 發現 I18N 問題
- [ ] 刪除預算池 - 待測試
- [ ] 查看預算池列表 - 待測試
- [ ] 查看預算池詳情 - 部分測試 (發現 I18N 問題)
- [ ] 預算池搜尋/過濾 - 待測試
- [ ] 預算池排序 - 待測試

---

## 🐛 已發現問題清單

| ID | 模組 | 嚴重程度 | 狀態 | 描述 |
|----|------|----------|------|------|
| FIX-089 | Projects | 🔴 P0 | ✅ 已修復 | budgetPool.totalAmount undefined - Surgical Agent 過度清理 |
| FIX-088 | Budget Pools | 🔴 P0 | ✅ 已修復 | I18N 缺失 5 個 translation keys |

---

## ✅ 已修復問題

| ID | 修復日期 | 描述 | 驗證狀態 |
|----|----------|------|----------|
| FIX-089 | 2025-11-12 | Project API 恢復 budgetPool.totalAmount 欄位 (4 個 procedures) | ⏳ 待驗證 |
| FIX-088 | 2025-11-12 | Budget Pool 模組新增 5 個 I18N translation keys | ⏳ 待驗證 |

---

**維護者**: 開發團隊 + AI 助手
**最後更新**: 2025-11-12 14:45
**下次測試**: 修復 FIX-088 和 FIX-089 後重新測試 Budget Pools 和 Projects 模組
