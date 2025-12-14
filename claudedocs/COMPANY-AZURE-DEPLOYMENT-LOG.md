# 公司 Azure 環境部署日誌

> **環境**: company/dev (app-itpm-company-dev-001)
> **資源群組**: RG-RCITest-RAPO-N8N
> **URL**: https://app-itpm-company-dev-001.azurewebsites.net
> **建立日期**: 2025-12-14

---

## 部署歷史

### v25-change015-change016 (2025-12-14)

| 項目 | 內容 |
|------|------|
| **版本** | v25-change015-change016 |
| **日期** | 2025-12-14 |
| **變更內容** | CHANGE-015 + CHANGE-016 Dashboard 改進 |
| **狀態** | ✅ 成功 |

**包含變更:**
- **CHANGE-015**: Dashboard 作為通用登陸頁面
  - 移除 roleId 權限檢查，所有已登入用戶可訪問
  - 新增 Quick Actions 區塊，根據權限過濾顯示
- **CHANGE-016**: Dashboard 簡化版專業歡迎頁面
  - 採用方案 C 極簡專業風格
  - 顯示：系統名稱、用戶歡迎訊息、角色、日期、導航提示
  - 不顯示：統計數據、圖表、敏感資訊
  - 新增 i18n 翻譯鍵 (dashboard.welcome.*)
  - 備份完整版為 page-full-version.tsx.bak

**驗證結果:**
- ✅ 登入頁面: 200
- ✅ Dashboard: 200
- ✅ 專案列表: 200
- ✅ 用戶列表: 200
- ✅ OM 費用: 200
- ✅ OM 摘要: 200
- ✅ 費用分攤: 200
- ✅ 數據導入: 200

---

### v24-fix-feat008-column (2025-12-10)

| 項目 | 內容 |
|------|------|
| **版本** | v24-fix-feat008-column |
| **日期** | 2025-12-10 |
| **變更內容** | FEAT-008 欄位映射修復 |
| **狀態** | ✅ 成功 |

**包含變更:**
- 修正 EXCEL_COLUMN_MAP lastFYActualExpense 欄位映射 (Column N → Column K)
- 修復 500 錯誤 (getSummary + getById APIs)
- 更新 health.ts fixAllSchemaIssues 添加 FEAT-008 欄位修復

**驗證結果:**
- ✅ 所有頁面返回 200 OK
- ✅ OMExpenseItem 表新增 lastFYActualExpense 欄位

---

### v23-feat008-import (2025-12-10)

| 項目 | 內容 |
|------|------|
| **版本** | v23-feat008-import |
| **日期** | 2025-12-10 |
| **變更內容** | FEAT-008 OM Expense Data Import |
| **狀態** | ✅ 成功 (後續發現欄位問題，由 v24 修復) |

**包含變更:**
- 新增 data-import 頁面 (Excel 解析、預覽、批量導入)
- 支援 xlsx/xls 格式解析 (xlsx 庫)
- 表頭-明細關聯建立
- 創建 FEAT-008 資料庫 migration (lastFYActualExpense 欄位)

**遇到問題:**
- OMExpenseItem 表缺少 lastFYActualExpense 欄位 → 由 v24 修復

---

### v22-feat007-omexpenseitem (2025-12-05)

| 項目 | 內容 |
|------|------|
| **版本** | v22-feat007-omexpenseitem |
| **日期** | 2025-12-05 |
| **變更內容** | FEAT-007 OM Expense 表頭-明細架構重構 |
| **狀態** | ✅ 成功 |

**包含變更:**
- 新增 OMExpenseItem 模型 (支援多明細項目)
- 新增 6 個 API procedures (createWithItems, addItem, updateItem, removeItem, reorderItems, updateItemMonthlyRecords)
- 新增 3 個前端組件 (OMExpenseItemForm, OMExpenseItemList, OMExpenseItemMonthlyGrid)
- 支援拖曳排序 (@dnd-kit 整合)
- OMExpense → OMExpenseItem → OMExpenseMonthly 三層架構

---

### v21-schema-fix (2025-12-04)

| 項目 | 內容 |
|------|------|
| **版本** | v21-schema-fix |
| **日期** | 2025-12-04 |
| **變更內容** | FIX-007 系統化 Schema 診斷和修復工具 |
| **狀態** | ✅ 成功 |

**包含變更:**
- 新增診斷 API：health.schemaCompare
- 新增修復 API：health.fixExpenseItemSchema, health.fixAllSchemaIssues
- 修復 Azure 資料庫缺失欄位：
  - ExpenseItem: categoryId, chargeOutOpCoId
  - OMExpense: categoryId, sourceExpenseId
  - Expense: budgetCategoryId, vendorId, currencyId, requiresChargeOut, isOperationMaint

**根本原因分析:**
- 本地環境使用 `db push` 同步
- Azure 環境只執行 migrations
- 導致 Schema 不同步

---

### v20-fix-expense-category (2025-12-04)

| 項目 | 內容 |
|------|------|
| **版本** | v20-fix-expense-category |
| **日期** | 2025-12-04 |
| **變更內容** | FIX-006 Expense budgetCategoryId 驗證修復 |
| **狀態** | ✅ 成功 |

**包含變更:**
- 修復創建 Expense 時的 Foreign key constraint violated 錯誤
- 在 expense.ts 創建前驗證 budgetCategoryId 是否有效

**問題描述:**
- 繼承的 budgetCategoryId 指向不存在的 BudgetCategory 記錄

---

### 初始部署 (2025-11-26)

| 項目 | 內容 |
|------|------|
| **版本** | latest (初始版本) |
| **日期** | 2025-11-26 |
| **變更內容** | 公司 Azure 環境首次部署 |
| **狀態** | ✅ 成功 |

**資源建立:**
- PostgreSQL: psql-itpm-company-dev-001
- 儲存帳戶: stitpmcompanydev001
- Container Registry: acritpmcompany
- App Service: app-itpm-company-dev-001

**修正歷史:**
| 時間 | 問題 | 修正 |
|------|------|------|
| 07:47 | DATABASE_URL 缺少主機名 | 添加完整連接字符串 |
| 07:55 | Role 表為空，導致註冊失敗 | 執行 POST /api/admin/seed |

**詳細配置:**
- 參考：`claudedocs/AZURE-DEPLOYMENT-COMPLETION-COMPANY.md`

---

## 部署流程 SOP

### 部署前檢查清單
- [ ] 本地代碼已提交並推送到 GitHub
- [ ] TypeScript 編譯通過 (`pnpm exec tsc --noEmit`)
- [ ] i18n 驗證通過 (`pnpm validate:i18n`)
- [ ] 確認要部署的變更內容

### 部署步驟
```bash
# 1. 登入 Azure
az login

# 2. 登入 ACR
az acr login --name acritpmcompany

# 3. 設定版本號
VERSION="vXX-feature-name"

# 4. 建置 Docker 映像
docker build -t acritpmcompany.azurecr.io/itpm-web:$VERSION .

# 5. 推送到 ACR
docker push acritpmcompany.azurecr.io/itpm-web:$VERSION

# 6. 更新 App Service
az webapp config container set \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N \
  --docker-custom-image-name acritpmcompany.azurecr.io/itpm-web:$VERSION

# 7. 重啟應用
az webapp restart \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N
```

### 部署後驗證
- [ ] 應用 URL 可訪問
- [ ] 登入頁面正常顯示
- [ ] 主要功能頁面正常 (Dashboard, Projects, OM Expenses 等)
- [ ] API Health Check 返回 200

### 問題排查
```bash
# 查看應用日誌
az webapp log tail \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N

# 檢查容器配置
az webapp config container show \
  --name app-itpm-company-dev-001 \
  --resource-group RG-RCITest-RAPO-N8N

# Health API 診斷
curl https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.check
curl https://app-itpm-company-dev-001.azurewebsites.net/api/trpc/health.schemaCompare
```

---

## 相關文件

- **部署指引**: `claudedocs/6-ai-assistant/prompts/SITUATION-7-AZURE-DEPLOY-COMPANY.md`
- **故障排查**: `claudedocs/6-ai-assistant/prompts/SITUATION-9-AZURE-TROUBLESHOOT-COMPANY.md`
- **初始部署報告**: `claudedocs/AZURE-DEPLOYMENT-COMPLETION-COMPANY.md`
- **資源清單**: `AZURE-RESOURCES-INVENTORY.md`

---

**最後更新**: 2025-12-14
**維護者**: AI 助手
