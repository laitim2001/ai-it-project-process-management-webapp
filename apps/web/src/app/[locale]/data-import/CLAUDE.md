# Data Import Page - OM 費用資料導入

## 📋 目錄用途
此目錄包含 OM 費用批量數據導入功能（FEAT-008），提供 Excel 和 JSON 格式的資料匯入支援。

## 🏗️ 檔案結構

```
data-import/
└── page.tsx          # 資料導入頁面 (62KB, v1.3)
```

## 🎯 功能概述

### 三步驟導入流程
1. **上傳** - Excel (.xlsx/.xls) 或 JSON 資料上傳
2. **預覽確認** - 檢視解析結果、錯誤行、重複行
3. **導入結果** - 顯示成功/失敗統計

### 核心功能
- **Excel 解析**: 客戶端使用 `xlsx` 庫解析
- **JSON 輸入**: 支援貼上或檔案上傳
- **自動建立**: 不存在的 OpCo 和 Header 自動建立
- **唯一性驗證**: 檢測重複數據組合
- **錯誤報告**: 詳細的問題行報告（行號、欄位、原因）

### 權限要求
- **Admin/Supervisor**: 可執行資料導入

## 📊 Excel 欄位映射

| Excel 欄位 | 系統欄位 | 必填 | 說明 |
|-----------|---------|------|------|
| Header Name | headerName | ✅ | OM Expense 表頭名稱 |
| Header Description | headerDescription | ❌ | 表頭描述 |
| Category | category | ✅ | 費用類別 |
| Item Name | itemName | ✅ | 明細項目名稱 |
| Item Description | itemDescription | ❌ | 項目描述 |
| Budget Amount | budgetAmount | ✅ | 預算金額 |
| OpCo Name | opCoName | ✅ | 營運公司名稱 |
| End Date | endDate | ❌ | 結束日期 |
| Last FY Actual Expense | lastFYActualExpense | ❌ | 上年度實際支出 |
| Is Ongoing | isOngoing | ❌ | 是否持續進行中 |

## 🔧 技術實現

### 客戶端解析
```typescript
// xlsx 庫客戶端解析
import * as XLSX from 'xlsx';

const workbook = XLSX.read(data, { type: 'array' });
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const jsonData = XLSX.utils.sheet_to_json(worksheet);
```

### API 整合
```typescript
// tRPC API 呼叫
const importMutation = api.omExpense.importData.useMutation();

// 執行導入
importMutation.mutate(validatedData);
```

### 狀態管理
```typescript
// 導入流程狀態
const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload');
const [parseResult, setParseResult] = useState<ParseResult | null>(null);
const [importResult, setImportResult] = useState<ImportResult | null>(null);
```

## 📝 版本歷程

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.0 | 2025-12-09 | 初始版本 - 基本 Excel/JSON 導入 |
| v1.1 | 2025-12-10 | CHANGE-010: 欄位映射優化 |
| v1.2 | 2025-12-10 | CHANGE-011: isOngoing 欄位支援 |
| v1.3 | 2025-12-11 | Bug 修復: lastFYActualExpense 傳遞 |

## ⚠️ 重要約定

1. **客戶端解析**: Excel 解析在瀏覽器端執行，不上傳檔案到伺服器
2. **驗證優先**: 必須通過預覽確認後才能執行導入
3. **錯誤處理**: 所有錯誤行會在預覽階段顯示
4. **重複檢測**: 相同 Header + Item + OpCo 組合視為重複
5. **權限控制**: 僅 Admin/Supervisor 角色可使用

## 相關文件
- `packages/api/src/routers/omExpense.ts` - importData API
- `apps/web/src/messages/` - i18n 翻譯 (dataImport namespace)
- `claudedocs/1-planning/features/FEAT-008-*` - 功能規劃文檔
- `claudedocs/4-changes/feature-changes/CHANGE-010-*` - 變更記錄
- `claudedocs/4-changes/feature-changes/CHANGE-011-*` - 變更記錄
