# Scripts - 開發工具腳本目錄

> **相關規則**: 請參閱 `.claude/rules/scripts.md` 獲取腳本開發完整規範

## 📋 目錄用途

此目錄包含所有開發、測試、維護和自動化腳本，用於提升開發效率、確保代碼質量和簡化部署流程。目前包含 **40+ 個腳本**，涵蓋環境檢查、索引維護、國際化、API 測試、代碼修復等多個領域。

## 🏗️ 目錄結構與檔案分類

```
scripts/
├── 🔧 環境與設置 (Environment & Setup)
│   ├── check-environment.js      # 環境配置檢查 (pnpm check:env) [405行]
│   ├── create-test-users.ts      # 創建 E2E 測試用戶 (Manager/Supervisor) [79行]
│   ├── check-test-users.ts       # 檢查測試用戶
│   ├── verify-test-user.ts       # 驗證測試用戶
│   ├── test-db-connection.js     # 資料庫連接測試
│   └── test-blob-storage.js      # Azure Blob Storage 測試
│
├── 📑 索引維護 (Index Maintenance)
│   └── check-index-sync.js       # 索引同步檢查 (pnpm index:check) [703行]
│
├── 🌐 國際化 (i18n)
│   ├── validate-i18n.js          # i18n 驗證 (pnpm validate:i18n) [294行]
│   ├── analyze-i18n-scope.js     # 分析 i18n 範圍
│   ├── check-i18n-messages.js    # 檢查 i18n 訊息完整性
│   ├── generate-en-translations.js    # 生成英文翻譯
│   ├── i18n-migration-helper.js       # i18n 遷移輔助
│   └── i18n-migrate-all.sh            # i18n 批量遷移
│
├── 🧪 API 測試 (API Testing)
│   └── api-health-check.ts       # API 健康檢查測試 [453行]
│
├── 🔨 代碼修復 (Code Fixes)
│   ├── add-login-errors.js       # 添加登入錯誤處理
│   ├── add-missing-link-import.js    # 添加缺失的 Link import
│   ├── add-page-jsdoc.js         # 添加頁面 JSDoc
│   ├── check-duplicate-imports.js    # 檢查重複 imports
│   ├── fix-breadcrumb-routing.js # 修復麵包屑路由
│   ├── fix-duplicate-imports.py  # Python: 修復重複 imports
│   ├── fix-import-semicolons.js  # 修復 import 分號
│   ├── remove-locale-prefix.js   # 移除 locale 前綴
│   └── validate-jsdoc.js         # 驗證 JSDoc 完整性
│
├── 🔐 認證測試 (Auth Testing)
│   ├── run-login-test.ts         # 執行登入測試
│   ├── test-auth-manually.ts     # 手動認證測試
│   ├── test-browser-login.spec.ts    # Playwright 瀏覽器登入測試
│   └── test-nextauth-direct.ts   # NextAuth 直接測試
│
├── 📦 資料遷移與處理 (Data Migration)
│   ├── run-migration-feat-002.js # FEAT-002 資料遷移
│   ├── inspect-user-schema.js    # 檢查用戶 Schema 結構
│   ├── convert-excel-to-import-json.py   # FEAT-008 Excel→JSON 轉換 [260行]
│   ├── extract-screenshot-data.py        # 截圖數據提取
│   └── analyze-import-data.py            # 分析導入數據
│
├── ☁️ Azure 部署 (Azure Deployment)
│   ├── azure-seed.sh             # Azure 資料庫種子
│   ├── restore-azure-appsettings.sh  # 還原 Azure App 設定
│   └── diagnose-docker-deployment.sh # 診斷 Docker 部署
│
├── 🐚 Shell 腳本 (Shell Scripts)
│   ├── complete-reset.ps1        # PowerShell: 完整重置
│   ├── reset.ps1                 # PowerShell: 快速重置
│   ├── migrate-and-seed.sh       # 遷移並種子
│   └── init-db.sql               # 資料庫初始化 SQL
│
└── CLAUDE.md                     # 本文件
```

---

## 🔑 核心腳本詳解

### 1. `check-environment.js` (環境檢查)

**用途**: 驗證開發環境是否正確配置，確保項目可以正常啟動。

**檢查項目** (共 9 項):
| 檢查項 | 說明 |
|--------|------|
| Node.js 版本 | >= 20.0.0 |
| pnpm 安裝 | >= 8.0.0 |
| Docker 運行 | Docker daemon 狀態 |
| .env 文件 | 存在且包含關鍵變數 |
| 環境變數 | DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL |
| node_modules | 依賴已安裝 |
| Prisma Client | 已生成 |
| Docker 服務 | postgres, redis, mailhog |
| 資料庫連接 | PostgreSQL 可連接 |
| 端口檢查 | 3000, 5434, 6381, 1025, 8025 |

**使用方式**:
```bash
pnpm check:env
# 或
node scripts/check-environment.js
```

**輸出格式**:
```
╔════════════════════════════════════════════════════════════════╗
║    IT 專案流程管理平台 - 環境檢查                              ║
╚════════════════════════════════════════════════════════════════╝

✓ Node.js version ... PASSED
✓ pnpm package manager ... PASSED
✓ Docker daemon running ... PASSED
✓ .env file exists ... PASSED
...

╔════════════════════════════════════════════════════════════════╗
║    檢查總結                                                     ║
╚════════════════════════════════════════════════════════════════╝

✓ 通過: 9
✗ 失敗: 0
⚠ 警告: 0

✅ 環境檢查完成！您可以開始開發了。
   執行 pnpm dev 啟動開發服務器
```

---

### 2. `check-index-sync.js` (索引同步檢查)

**用途**: 確保項目索引文件 (AI-ASSISTANT-GUIDE.md, PROJECT-INDEX.md) 與實際文件結構保持同步。

**版本**: v1.2.0 (2025-12-08)

**核心類別**: `IndexSyncChecker`

```typescript
class IndexSyncChecker {
  // 主要功能
  async runCheck(options)              // 主檢查流程
  async checkCoreIndexFiles()          // 檢查核心索引文件
  async validateIndexPaths()           // 驗證路徑有效性
  async detectMissingFiles()           // 檢測遺漏文件
  async checkObsoleteReferences()      // 檢查過期引用
  generateReport()                     // 生成報告

  // 輔助方法
  isImportantFile(fileName, ext)       // 判斷重要文件
  isClaudedocsGranularFile(path)       // claudedocs 細粒度排除
  getFileImportance(filePath)          // 獲取文件重要程度
  async performAutoFix()               // 自動修復功能
}
```

**檢查流程**:
```
1. 檢查核心索引文件是否存在
   └── .ai-context, AI-ASSISTANT-GUIDE.md, PROJECT-INDEX.md,
       INDEX-MAINTENANCE-GUIDE.md, DEVELOPMENT-LOG.md, FIXLOG.md

2. 驗證索引文件中的路徑有效性
   └── 檢測 broken references

3. 檢測可能遺漏的重要文件
   └── 掃描 docs/, src/, lib/, components/, apps/, packages/, scripts/, claudedocs/

4. 檢查過期引用

5. 生成報告 (JSON + Console)
```

**使用方式**:
```bash
# 基本檢查
pnpm index:check

# 增量檢查 (只檢查最近變更)
pnpm index:check:incremental
node scripts/check-index-sync.js --incremental

# 自動修復模式
node scripts/check-index-sync.js --auto-fix

# 完整健康檢查
pnpm index:health

# 組合使用
node scripts/check-index-sync.js -i -f  # 增量 + 自動修復
```

**特殊功能: claudedocs 細粒度文件排除**

v1.2.0 新增 `isClaudedocsGranularFile()` 方法，自動排除已在目錄結構中組織的文件：
- `claudedocs/1-planning/architecture/*.md`
- `claudedocs/1-planning/features/FEAT-*/**.md`
- `claudedocs/4-changes/bug-fixes/*.md`
- `claudedocs/4-changes/i18n/*.md`
- `claudedocs/3-progress/daily/*.md`
- 等等...

---

### 3. `validate-i18n.js` (i18n 驗證)

**用途**: 驗證國際化翻譯文件的正確性和一致性。

**驗證項目**:
| 驗證項 | 說明 |
|--------|------|
| JSON 語法 | 檢查 JSON 格式正確性 |
| 重複鍵檢測 | 逐行解析檢測同路徑重複鍵 |
| 空值檢查 | 檢測空字符串、null、undefined |
| 多語言一致性 | 比較 en.json 和 zh-TW.json 的鍵結構 |

**驗證算法**:
```javascript
// 重複鍵檢測 (逐行解析法)
function checkDuplicateKeys(filePath) {
  const keyMap = new Map();
  let currentPath = [];  // 追蹤當前 JSON 路徑

  for (const line of lines) {
    const match = line.match(/^\s*"([^"]+)"\s*:/);
    if (match) {
      const key = match[1];
      const indent = line.match(/^\s*/)[0].length;

      // 計算層級並構建完整路徑
      while (currentPath.length > 0 &&
             currentPath[currentPath.length - 1].indent >= indent) {
        currentPath.pop();
      }

      const fullKey = [...currentPath.map(p => p.key), key].join('.');

      if (keyMap.has(fullKey)) {
        // 發現重複！
        duplicates.push({ key: fullKey, firstLine, secondLine });
      }
    }
  }
}
```

**使用方式**:
```bash
pnpm validate:i18n
# 或
node scripts/validate-i18n.js
```

**輸出格式**:
```
═══════════════════════════════════════════════════
   I18N 翻譯文件驗證工具
═══════════════════════════════════════════════════

檢查 en.json 的 JSON 語法...
  ✅ JSON 語法正確

檢查 en.json 的重複鍵...
  ✅ 沒有發現重複鍵

檢查 en.json 的空值...
  ✅ 沒有發現空值

比較 en.json 和 zh-TW.json 的鍵一致性...
  ✅ 鍵結構完全一致 (1523 個鍵)

═══════════════════════════════════════════════════
✅ 所有檢查通過!翻譯文件完全正確。
═══════════════════════════════════════════════════
```

---

### 4. `api-health-check.ts` (API 健康檢查)

**用途**: 測試所有 8 個核心 API 模塊，驗證業務邏輯和數據同步。

**測試模塊**:
```
Module 1: BudgetPool API    - 預算池 CRUD + Categories
Module 2: Project API       - 專案 CRUD + BudgetUsage
Module 3: BudgetProposal API - 提案提交/審批流程
Module 4: PurchaseOrder API  - 採購單 CRUD + 明細
Module 5: Expense API       - 費用 CRUD + 審批 + 預算同步 ⭐
Module 6: OMExpense API     - OM 費用 + 12 月度記錄 ⭐
Module 7-8: ChargeOut API   - 費用轉嫁全流程
```

**關鍵驗證點** (標記為 ⭐):
1. **BudgetPool.totalAmount 自動計算** - 從 Categories 總和
2. **BudgetProposal 批准 → Project.approvedBudget 同步**
3. **Expense 批准 → BudgetCategory.usedAmount 更新**
4. **OMExpense 創建 → 自動初始化 12 個月度記錄**

**使用方式**:
```bash
pnpm test:api
# 或
pnpm ts-node scripts/api-health-check.ts
```

**測試流程**:
```
1. 清理舊測試數據 (TEST_ 前綴)
2. 依序執行 8 個模塊測試
3. 驗證數據同步正確性
4. 清理測試數據
5. 生成測試報告
```

---

### 5. `convert-excel-to-import-json.py` (FEAT-008)

**用途**: 將 Excel 數據轉換為 OM Expense Data Import API 所需的 JSON 格式。

**Feature 來源**: FEAT-008 - OM Expense Data Import

**Excel 格式要求**:
```
Column A (0): Row number
Column B (1): Header Name        ← 必填
Column C (2): Header Description
Column D (3): Item Name          ← 必填
Column E (4): Item Description
Column F (5): Category           ← 必填
Column G (6): Budget (USD)       ← 預算金額
Column H (7): Budget (HKD)
Column I (8): Budget (MOP)
Column J (9): OpCo               ← 必填
Column K (10): Start Date
Column L (11): Contact
Column M (12): End Date
Column N (13): Last FY Actual Expense (optional)
```

**輸出 JSON 格式**:
```json
[
  {
    "headerName": "Network Infrastructure",
    "headerDescription": "...",
    "category": "Infrastructure",
    "itemName": "Firewall Renewal",
    "itemDescription": "...",
    "budgetAmount": 50000,
    "opCoName": "HK",
    "endDate": "2025-12-31",
    "lastFYActualExpense": 45000
  }
]
```

**使用方式**:
```bash
# 基本使用
python scripts/convert-excel-to-import-json.py "docs/OM Expense.xlsx"

# 指定輸出文件
python scripts/convert-excel-to-import-json.py "docs/OM Expense.xlsx" "output.json"
```

**功能特點**:
- 自動跳過空行
- 日期格式自動轉換 (YYYY-MM-DD)
- 重複記錄檢測和去重 (header + item + opco)
- 詳細的統計報告

---

### 6. `create-test-users.ts` (E2E 測試用戶)

**用途**: 創建 E2E 測試所需的測試用戶。

**創建的用戶**:
| 角色 | Email | 密碼 |
|------|-------|------|
| ProjectManager | test-manager@example.com | testpassword123 |
| Supervisor | test-supervisor@example.com | testpassword123 |

**使用方式**:
```bash
pnpm ts-node scripts/create-test-users.ts
```

**實現細節**:
- 使用 `prisma.user.upsert` 確保冪等性
- 密碼使用 bcrypt 加密 (salt rounds: 10)
- 自動創建角色 (如果不存在)
- emailVerified 自動設為當前時間

---

## 📊 常用命令速查表

### 環境管理
```bash
# 環境檢查 (必須在開發前執行)
pnpm check:env

# 一鍵設置 (install + generate + check)
pnpm setup
```

### 索引維護
```bash
# 基本同步檢查
pnpm index:check

# 增量檢查 (只檢查變更文件)
pnpm index:check:incremental

# 自動修復
pnpm index:fix

# 完整健康檢查
pnpm index:health
```

### 國際化驗證
```bash
# 驗證翻譯文件
pnpm validate:i18n
```

### API 測試
```bash
# API 健康檢查
pnpm test:api

# 或直接執行
pnpm ts-node scripts/api-health-check.ts
```

### 測試用戶管理
```bash
# 創建測試用戶
pnpm ts-node scripts/create-test-users.ts

# 檢查測試用戶
pnpm ts-node scripts/check-test-users.ts

# 驗證測試用戶
pnpm ts-node scripts/verify-test-user.ts
```

### 資料處理
```bash
# Excel 轉 JSON (FEAT-008)
python scripts/convert-excel-to-import-json.py <excel_file> [output_file]
```

---

## 🎨 腳本開發約定

### 命名規則

```
動詞前綴 + 描述詞 + 擴展名

動詞前綴:
├── check-*     檢查類腳本 (驗證、檢測)
├── fix-*       修復類腳本 (自動修復問題)
├── add-*       添加類腳本 (添加內容)
├── generate-*  生成類腳本 (生成文件)
├── validate-*  驗證類腳本 (驗證正確性)
├── test-*      測試類腳本 (執行測試)
├── run-*       執行類腳本 (執行任務)
├── convert-*   轉換類腳本 (格式轉換)
├── analyze-*   分析類腳本 (數據分析)
├── diagnose-*  診斷類腳本 (問題診斷)
└── restore-*   還原類腳本 (還原設定)

擴展名:
├── .js         Node.js 腳本
├── .ts         TypeScript 腳本
├── .py         Python 腳本
├── .sh         Shell 腳本 (Linux/macOS)
├── .ps1        PowerShell 腳本 (Windows)
└── .sql        SQL 腳本
```

### 輸出格式標準

```javascript
// 狀態標記
console.log('✅ Check passed');     // 成功
console.log('❌ Error found');      // 錯誤
console.log('⚠️ Warning');          // 警告
console.log('📋 Info');             // 資訊
console.log('🔧 Processing...');    // 處理中
console.log('🚀 Starting...');      // 開始
console.log('✨ Complete!');        // 完成

// ANSI 顏色碼
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};
```

### 錯誤處理模式

```javascript
// 主函數結構
async function main() {
  try {
    // 執行邏輯
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// 執行主函數
main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
```

### JSDoc 標準

```javascript
/**
 * 腳本用途簡述
 *
 * 功能:
 * - 功能 1
 * - 功能 2
 *
 * 使用方式:
 *   node scripts/script-name.js [options]
 *
 * @since FEAT-XXX 或 FIX-XXX
 * @lastModified YYYY-MM-DD
 */
```

---

## ⚠️ 重要約定

### 腳本執行環境
1. **所有腳本從項目根目錄執行** (不要 cd 到 scripts/)
2. **TypeScript 腳本使用 `pnpm ts-node`** 或 `npx ts-node`
3. **Python 腳本需要 openpyxl** (`pip install openpyxl`)
4. **Shell 腳本需要適當的權限** (`chmod +x script.sh`)

### 腳本開發流程
1. **命名遵循約定** (動詞前綴 + 描述詞)
2. **包含 JSDoc 頭部文檔**
3. **使用標準輸出格式** (emoji + 顏色)
4. **正確處理錯誤** (try-catch + exit code)
5. **測試後再提交**

### 與 package.json 整合
所有常用腳本應在 `package.json` 中定義別名：
```json
{
  "scripts": {
    "check:env": "node scripts/check-environment.js",
    "index:check": "node scripts/check-index-sync.js",
    "index:check:incremental": "node scripts/check-index-sync.js --incremental",
    "index:fix": "node scripts/check-index-sync.js --auto-fix",
    "index:health": "node scripts/check-index-sync.js && node scripts/check-index-sync.js --incremental",
    "validate:i18n": "node scripts/validate-i18n.js"
  }
}
```

---

## 📊 腳本統計

| 類別 | 數量 | 主要語言 |
|------|------|----------|
| 環境與設置 | 6 | JavaScript, TypeScript |
| 索引維護 | 1 | JavaScript |
| 國際化 | 6 | JavaScript, Shell |
| API 測試 | 1 | TypeScript |
| 代碼修復 | 9 | JavaScript, Python |
| 認證測試 | 4 | TypeScript |
| 資料遷移 | 5 | JavaScript, Python |
| Azure 部署 | 3 | Shell |
| Shell 腳本 | 4 | Shell, PowerShell, SQL |
| **總計** | **~40** | |

---

## 相關文件

### 使用這些腳本的文檔
- `DEVELOPMENT-SETUP.md` - 環境設置指南 (使用 check-environment.js)
- `INDEX-MAINTENANCE-GUIDE.md` - 索引維護指南 (使用 check-index-sync.js)
- `claudedocs/I18N-TRANSLATION-KEY-GUIDE.md` - i18n 指南 (使用 validate-i18n.js)

### 腳本測試相關
- `scripts/test-helpers.ts` - API 測試輔助函數 (api-health-check.ts 依賴)
- `scripts/test-data.ts` - API 測試數據生成 (api-health-check.ts 依賴)

### 規則文件
- `.claude/rules/scripts.md` - 腳本開發規範

### package.json 腳本定義
- 根目錄 `package.json` - 腳本別名定義
