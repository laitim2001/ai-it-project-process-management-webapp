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

## 📊 測試統計

### 測試覆蓋率
- **已測試模組**: 1/18 (Budget Pools)
- **測試場景**: 2 個
- **發現問題**: 1 個 (FIX-088)
- **修復完成**: 0 個

### 問題分類
- **I18N 問題**: 1 個
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
| FIX-088 | Budget Pools | 🔴 P0 | 🔄 修復中 | I18N 缺失 5 個 translation keys |

---

## ✅ 已修復問題

_目前無已修復問題_

---

**維護者**: 開發團隊 + AI 助手
**最後更新**: 2025-11-12 23:45
**下次測試**: 修復 FIX-088 後重新測試 Budget Pools 模組
