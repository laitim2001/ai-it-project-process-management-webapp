# i18n 遷移狀態報告

> **更新日期**: 2025-11-03
> **階段**: Batch 3 進行中 (Vendors 模組完成)
> **完成度**: 約 52% (28/54 核心文件)

---

## ✅ 已完成的工作

### Phase 2: 翻譯文件架構 (100%)

**文件位置**: `apps/web/src/messages/`

- ✅ `zh-TW.json` - 1015 行,19 個 namespace
- ✅ `en.json` - 1014 行,19 個 namespace

**Namespaces**:
```
common, navigation, auth, dashboard, projects, proposals,
budgetPools, vendors, quotes, purchaseOrders, expenses,
omExpenses, chargeOuts, users, notifications, settings,
validation, toast, status
```

---

### Batch 1: Layout + Dashboard + Auth (100% 完成)

#### 1. Layout 組件 (3 個)
- ✅ `components/layout/sidebar.tsx`
- ✅ `components/layout/TopBar.tsx`
- ✅ `components/layout/dashboard-layout.tsx` (無需遷移)

#### 2. Dashboard 組件 (3 個)
- ✅ `app/[locale]/dashboard/page.tsx`
- ✅ `components/dashboard/StatsCard.tsx` (props 驅動,無需遷移)
- ✅ `components/dashboard/BudgetPoolOverview.tsx`

#### 3. Auth 組件 (3 個)
- ✅ `app/[locale]/login/page.tsx`
- ✅ `app/[locale]/register/page.tsx`
- ✅ `app/[locale]/forgot-password/page.tsx`

**測試狀態**:
- ✅ 語言切換正常 (zh-TW ↔ en)
- ✅ 所有翻譯 key 正確顯示
- ✅ 無 TypeScript 錯誤

---

### Batch 2: Projects 模組 (4/5 完成 = 80%)

#### 已完成 (4 個)
- ✅ `app/[locale]/projects/page.tsx` - 列表頁
- ✅ `app/[locale]/projects/new/page.tsx` - 新增頁
- ✅ `app/[locale]/projects/[id]/edit/page.tsx` - 編輯頁
- ✅ `components/project/ProjectForm.tsx` - 表單組件

#### 部分完成 (1 個)
- 🔄 `app/[locale]/projects/[id]/page.tsx` - 詳情頁 (30% 完成)
  - ✅ Hooks 和狀態映射函數
  - ✅ Toast 訊息
  - ✅ 確認對話框
  - ✅ 載入和錯誤狀態
  - ⏳ 主要內容區域 (約 300 行硬編碼文字)

#### 需要修復 (1 個)
- ⚠️ `app/[locale]/projects/[id]/quotes/page.tsx` - 重複 import 問題
  - 14 次重複的 `import { useTranslations } from 'next-intl'`
  - 需要清理 imports 後才能遷移內容

---

## ⏳ 剩餘工作

### Batch 2: 剩餘模組 (11 個文件)

#### Proposals 模組 (6 個)
- ⏳ `app/[locale]/proposals/page.tsx` - 列表頁 (已修復重複 import)
- ⏳ `app/[locale]/proposals/[id]/page.tsx` - 詳情頁
- ⏳ `app/[locale]/proposals/new/page.tsx` - 新增頁
- ⏳ `app/[locale]/proposals/[id]/edit/page.tsx` - 編輯頁
- ⏳ `components/proposal/BudgetProposalForm.tsx` - 表單組件
- ⏳ `components/proposal/ProposalActions.tsx` - 操作按鈕
- ⏳ `components/proposal/CommentSection.tsx` - 評論區

#### BudgetPools 模組 (5 個)
- ⏳ `app/[locale]/budget-pools/page.tsx` - 列表頁
- ⏳ `app/[locale]/budget-pools/[id]/page.tsx` - 詳情頁
- ⏳ `app/[locale]/budget-pools/new/page.tsx` - 新增頁
- ⏳ `app/[locale]/budget-pools/[id]/edit/page.tsx` - 編輯頁
- ⏳ `components/budget-pool/BudgetPoolForm.tsx` - 表單組件

---

### Batch 3: 所有剩餘模組 (23 個文件)

按模組分類:

#### Vendors 模組 (4 個) ✅
- ✅ `app/[locale]/vendors/page.tsx` (列表頁)
- ✅ `app/[locale]/vendors/[id]/page.tsx` (詳情頁)
- ✅ `app/[locale]/vendors/new/page.tsx` (新建頁)
- ✅ `components/vendor/VendorForm.tsx` (表單組件)

#### Quotes 模組 (3 個)
- `app/[locale]/quotes/page.tsx`
- `app/[locale]/quotes/new/page.tsx`
- `components/quote/QuoteUploadForm.tsx`

#### PurchaseOrders 模組 (5 個)
- `app/[locale]/purchase-orders/page.tsx`
- `app/[locale]/purchase-orders/[id]/page.tsx`
- `app/[locale]/purchase-orders/new/page.tsx`
- `components/purchase-order/PurchaseOrderForm.tsx`
- `components/purchase-order/PurchaseOrderActions.tsx`

#### Expenses 模組 (5 個)
- `app/[locale]/expenses/page.tsx`
- `app/[locale]/expenses/[id]/page.tsx`
- `app/[locale]/expenses/new/page.tsx`
- `components/expense/ExpenseForm.tsx`
- `components/expense/ExpenseActions.tsx`

#### 其他模組 (6 個)
- `app/[locale]/notifications/page.tsx`
- `app/[locale]/settings/page.tsx`
- `components/notification/NotificationBell.tsx`
- `components/notification/NotificationDropdown.tsx` (已完成)
- `components/theme/ThemeToggle.tsx`
- (其他輔助組件)

---

## 🔧 已知問題和修復

### 問題 1: proposals/page.tsx Nested Links 警告 (✅ 已修復)
- **描述**: `<Link>` 組件嵌套 `<a>` 標籤導致 React 警告
- **修復**: 改用 onClick + stopPropagation 模式
- **狀態**: 已解決 (FIX-056)
- **詳細記錄**: 見 `I18N-ISSUES-LOG.md` FIX-056 章節

### 問題 2: 大規模重複 import (✅ 已解決)
- **描述**: 39 個文件,327 個重複 `import { useTranslations } from 'next-intl'` 語句
- **影響**: 阻止應用程式編譯,阻塞開發流程
- **根本原因**: Surgical-task-executor 代理在批量操作時錯誤地重複添加 import 語句
- **修復方案**: 創建批量修復工具
  - `check-duplicate-imports.js` (檢測工具)
  - `fix-duplicate-imports.py` (修復工具)
- **修復結果**: 100% 成功 (39/39 文件)
- **移除重複**: 327 個語句
- **執行時間**: < 5 秒
- **優先級**: P0 (已解決) ✅
- **解決時間**: 2025-11-03 16:00
- **詳細記錄**: 見 `I18N-ISSUES-LOG.md` FIX-057 章節

### 預防措施 (新增)
- [ ] 集成 `check-duplicate-imports.js` 到 CI/CD 流程
- [ ] 建立 pre-commit hook 防止重複 import
- [ ] 更新開發規範文檔,添加批量操作安全指引
- [ ] 為團隊提供工具使用培訓

---

## 📊 進度統計

| 階段 | 總數 | 已完成 | 進行中 | 待處理 | 完成率 |
|------|------|--------|--------|--------|--------|
| **Phase 2** | 2 | 2 | 0 | 0 | 100% |
| **Batch 1** | 9 | 9 | 0 | 0 | 100% |
| **Batch 2** | 11 | 11 | 0 | 0 | 100% |
| **Batch 3** | 34 | 8 | 0 | 26 | 24% |
| **總計** | 54 | 28 | 0 | 26 | 52% |

**文件統計**:
- 核心頁面文件: 54 個 (頁面 + 組件)
- 已完成: 28 個 (52%)
- 進行中: 0 個 (0%)
- 待處理: 26 個 (48%)

---

## 🎯 下一步建議

### 立即行動 (P0)
1. **修復 quotes/page.tsx 重複 import**
   - 清理 14 次重複的 `useTranslations` import
   - 驗證文件可正常編譯

2. **完成 projects/[id]/page.tsx**
   - 遷移主要內容區域 (約 300 行)
   - 測試詳情頁所有功能

3. **完成 Batch 2 - Proposals 模組**
   - 使用已建立的遷移模式
   - 估計工作量: 2-3 小時

### 短期計劃 (P1)
4. **完成 Batch 2 - BudgetPools 模組**
   - 5 個文件遷移
   - 估計工作量: 1.5 小時

5. **測試 Batch 2 完整功能**
   - 語言切換測試
   - 完整 CRUD 流程測試
   - 表單驗證測試

### 中期計劃 (P2)
6. **創建遷移工具腳本**
   - 自動化硬編碼文字識別
   - 自動化翻譯 key 替換建議
   - 減少手動工作量

7. **完成 Batch 3 所有模組**
   - 34 個文件遷移
   - 可分多次完成,每次 5-10 個文件

---

## 🛠️ 遷移工具和資源

### 已創建的工具
- ✅ 翻譯文件 (zh-TW.json, en.json)
- ✅ 翻譯 key 結構文檔 (STAGE-3-4-IMPLEMENTATION-PLAN.md)
- ✅ 遷移技術指引 (STAGE-3-4-IMPLEMENTATION-PLAN.md §3.3)

### 需要創建的工具
- ⏳ i18n 遷移腳本 (自動化硬編碼文字替換)
- ⏳ TypeScript 類型檢查腳本
- ⏳ 翻譯 key 完整性檢查工具
- ⏳ 語言切換測試腳本

---

## 📝 遷移模式參考

### 頁面組件遷移
```typescript
// 1. 引入 hooks
import { useTranslations } from 'next-intl';

// 2. 使用 hooks
const t = useTranslations('namespace');
const tCommon = useTranslations('common');

// 3. 替換硬編碼文字
<h1>{t('title')}</h1>
<button>{tCommon('actions.save')}</button>
```

### 表單組件遷移
```typescript
const tForm = useTranslations('namespace.form');
const tValidation = useTranslations('validation');

<label>{tForm('fields.name.label')}</label>
<input placeholder={tForm('fields.name.placeholder')} />
{error && <p>{tValidation('required')}</p>}
```

### Toast 訊息遷移
```typescript
const tToast = useTranslations('toast');

toast({
  title: tToast('success.title'),
  description: tToast('success.created', { entity: t('entityName') }),
  variant: 'success',
});
```

---

## 🔍 質量檢查清單

每個遷移完成後需檢查:

### 編譯檢查
- [ ] 無 TypeScript 類型錯誤
- [ ] 無 ESLint 警告
- [ ] 無重複 import

### 功能檢查
- [ ] zh-TW 語言顯示正確
- [ ] en 語言顯示正確
- [ ] 表單驗證訊息翻譯
- [ ] Toast 訊息翻譯
- [ ] 狀態標籤翻譯

### UI 檢查
- [ ] 無 UI 破損
- [ ] 文字長度適配
- [ ] 布局保持一致

---

**維護者**: Development Team + AI Assistant
**最後更新**: 2025-11-03
**版本**: 1.0
