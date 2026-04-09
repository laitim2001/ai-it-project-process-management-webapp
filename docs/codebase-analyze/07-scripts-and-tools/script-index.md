# Scripts 目錄完整索引

> **分析日期**: 2026-04-09
> **腳本總數**: 40 個檔案（不含 CLAUDE.md）
> **總行數**: 7,233 行
> **語言分佈**: JavaScript (19) / TypeScript (8) / Python (4) / Shell (5) / PowerShell (2) / SQL (1) / Markdown (1)

---

## 目錄

- [1. 環境檢查與設置 (Environment & Setup)](#1-環境檢查與設置)
- [2. 索引維護 (Index Maintenance)](#2-索引維護)
- [3. 國際化 (i18n)](#3-國際化)
- [4. 代碼修復與品質 (Code Fix & Quality)](#4-代碼修復與品質)
- [5. 認證測試 (Auth Testing)](#5-認證測試)
- [6. API 與資料庫測試 (API & DB Testing)](#6-api-與資料庫測試)
- [7. 資料遷移與處理 (Data Migration & Processing)](#7-資料遷移與處理)
- [8. Azure 部署 (Azure Deployment)](#8-azure-部署)
- [9. 環境重置 (Environment Reset)](#9-環境重置)
- [統計摘要](#統計摘要)

---

## 1. 環境檢查與設置

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 1 | `check-environment.js` | 404 | JS | 驗證開發環境是否正確配置（Node.js 版本、pnpm、Docker、.env、Prisma、端口等 9+ 項檢查） | `pnpm check:env` | fs, path, child_process |
| 2 | `create-test-users.ts` | 78 | TS | 創建 E2E 測試用戶（ProjectManager + Supervisor），使用 bcrypt 加密密碼 | `pnpm ts-node scripts/create-test-users.ts` | dotenv, @prisma/client, bcryptjs |
| 3 | `check-test-users.ts` | 52 | TS | 檢查測試用戶是否已存在於資料庫中 | `pnpm ts-node scripts/check-test-users.ts` | @itpm/db |
| 4 | `verify-test-user.ts` | 82 | TS | 驗證測試用戶密碼是否正確（使用 bcrypt 比對） | `pnpm ts-node scripts/verify-test-user.ts` | dotenv, @prisma/client, bcryptjs |
| 5 | `init-db.sql` | 32 | SQL | PostgreSQL 資料庫初始化（安裝 uuid-ossp、pg_trgm、btree_gin 擴展，設定時區） | Docker 容器啟動時自動執行 | PostgreSQL |

---

## 2. 索引維護

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 6 | `check-index-sync.js` | 702 | JS | 確保 AI 助手索引文件與實際文件結構保持同步，支援增量檢查和自動修復 | `pnpm index:check` / `pnpm index:check:incremental` / `pnpm index:fix` | fs, path |

**核心類別**: `IndexSyncChecker`
- 檢查核心索引文件是否存在（AI-ASSISTANT-GUIDE.md, PROJECT-INDEX.md 等）
- 驗證索引中的路徑有效性（broken references）
- 檢測可能遺漏的重要文件
- 支援 `--incremental` 增量模式和 `--auto-fix` 自動修復模式
- v1.2.0 新增 claudedocs 細粒度文件排除

---

## 3. 國際化

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 7 | `validate-i18n.js` | 293 | JS | 驗證翻譯文件正確性：JSON 語法、重複鍵偵測、空值檢查、en/zh-TW 結構一致性比較 | `pnpm validate:i18n` | fs, path |
| 8 | `analyze-i18n-scope.js` | 349 | JS | 掃描所有 TSX 文件，識別硬編碼中文字串，分類文本類型，統計翻譯工作量 | `node scripts/analyze-i18n-scope.js` | fs, path |
| 9 | `check-i18n-messages.js` | 126 | JS | 檢查表單組件使用的 i18n keys 是否在翻譯文件中存在 | `node scripts/check-i18n-messages.js` | fs, path |
| 10 | `generate-en-translations.js` | 221 | JS | 讀取 zh-TW.json，透過翻譯對照表自動生成 en.json 英文翻譯 | `node scripts/generate-en-translations.js` | fs, path, zh-TW.json |
| 11 | `i18n-migration-helper.js` | 242 | JS | 掃描指定文件的硬編碼繁體中文，偵測重複 import，生成遷移建議 | `node scripts/i18n-migration-helper.js <file>` | fs, path |
| 12 | `i18n-migrate-all.sh` | 207 | Shell | 批量自動遷移所有剩餘檔案到 next-intl 國際化框架 | `bash scripts/i18n-migrate-all.sh` | Node.js, i18n-migration-helper.js |
| 13 | `add-login-errors.js` | 131 | JS | 為 en.json 和 zh-TW.json 添加 auth.login.errors 翻譯鍵（13 組錯誤訊息） | `node scripts/add-login-errors.js` | fs, path |

---

## 4. 代碼修復與品質

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 14 | `fix-breadcrumb-routing.js` | 144 | JS | 修復麵包屑路由問題：將 BreadcrumbLink href 改為使用 Link 組件包裹（保留 locale） | `node scripts/fix-breadcrumb-routing.js` | fs, path |
| 15 | `fix-import-semicolons.js` | 50 | JS | 修復 import 語句的分號問題（指定文件列表） | `node scripts/fix-import-semicolons.js` | fs, path |
| 16 | `fix-duplicate-imports.py` | 139 | Python | 自動修復重複的 `import { useTranslations } from 'next-intl'` 語句 | `python scripts/fix-duplicate-imports.py` | os, sys |
| 17 | `add-missing-link-import.js` | 69 | JS | 為缺少 Link import 的頁面文件添加 `import { Link } from "@/i18n/routing"` | `node scripts/add-missing-link-import.js` | fs, path |
| 18 | `add-page-jsdoc.js` | 566 | JS | 批量為頁面組件添加標準化 JSDoc 註釋（涵蓋 Vendors、PO、OM Expenses、Charge Outs） | `node scripts/add-page-jsdoc.js` | fs, path |
| 19 | `check-duplicate-imports.js` | 77 | JS | 掃描所有 .tsx/.ts 文件，找出重複的 useTranslations import 語句 | `node scripts/check-duplicate-imports.js` | fs, path, child_process |
| 20 | `remove-locale-prefix.js` | 64 | JS | 移除 Link href 中手動拼接的 `/${locale}/` 前綴（next-intl 自動處理） | `node scripts/remove-locale-prefix.js` | fs, path |
| 21 | `validate-jsdoc.js` | 317 | JS | 掃描所有 .ts/.tsx 文件，驗證 JSDoc 註釋的完整性和正確性（必要欄位、路徑有效性） | `node scripts/validate-jsdoc.js` | fs, path |

---

## 5. 認證測試

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 22 | `run-login-test.ts` | 119 | TS | 使用 Playwright 可視化模式執行登入測試（有效/無效憑證、受保護路由、登出） | `pnpm ts-node scripts/run-login-test.ts` | playwright |
| 23 | `test-auth-manually.ts` | 164 | TS | 直接調用 NextAuth API endpoints 測試認證流程（繞過 signIn 函數），用於診斷問題 | `pnpm ts-node scripts/test-auth-manually.ts` | Node.js fetch |
| 24 | `test-browser-login.spec.ts` | 69 | TS | Playwright 瀏覽器登入流程 E2E 測試（ProjectManager 帳號登入驗證） | `npx playwright test scripts/test-browser-login.spec.ts` | @playwright/test |
| 25 | `test-nextauth-direct.ts` | 107 | TS | 直接導入 authOptions 並測試 credentials provider 的 authorize 函數 | `pnpm ts-node scripts/test-nextauth-direct.ts` | dotenv, packages/auth |

---

## 6. API 與資料庫測試

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 26 | `api-health-check.ts` | 452 | TS | 測試所有 8 個核心 API 模塊，驗證業務邏輯和數據同步（BudgetPool、Project、Proposal、PO、Expense、OMExpense、ChargeOut） | `pnpm test:api` | test-helpers.ts, test-data.ts |
| 27 | `test-db-connection.js` | 76 | JS | 測試 PostgreSQL 資料庫連接，顯示 connection info 和基本查詢結果 | `node scripts/test-db-connection.js` | packages/db (prisma) |
| 28 | `test-blob-storage.js` | 353 | JS | 驗證 Azure Blob Storage / Azurite 功能（連接、Container 建立、上傳、列表、下載、刪除） | `node scripts/test-blob-storage.js` | @azure/storage-blob |
| 29 | `inspect-user-schema.js` | 77 | JS | 查詢 PostgreSQL User 表的實際欄位定義（column_name, data_type, is_nullable 等） | `node scripts/inspect-user-schema.js` | packages/db (prisma) |

---

## 7. 資料遷移與處理

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 30 | `run-migration-feat-002.js` | 132 | JS | 手動執行 FEAT-002 BudgetPool currency 遷移（添加 currencyId 欄位） | `node scripts/run-migration-feat-002.js` | @prisma/client |
| 31 | `convert-excel-to-import-json.py` | 259 | Python | FEAT-008: 將 Excel 數據轉換為 OM Expense Data Import API 所需的 JSON 格式 | `python scripts/convert-excel-to-import-json.py <excel_file> [output]` | openpyxl, json, sys |
| 32 | `extract-screenshot-data.py` | 220 | Python | 從 OM Expense Excel 截圖中提取結構化數據（header/item/category），輸出 JSON | `python scripts/extract-screenshot-data.py` | json |
| 33 | `analyze-import-data.py` | 108 | Python | 讀取 Excel 數據並分析 OM Expense 導入數據結構（header、column mapping） | `python scripts/analyze-import-data.py` | openpyxl, json, sys |

---

## 8. Azure 部署

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 34 | `azure-seed.sh` | 168 | Shell | Azure 部署後自動執行 minimal seed data 初始化（Role、Currency 基礎資料） | `bash scripts/azure-seed.sh` | DATABASE_URL env, pnpm |
| 35 | `diagnose-docker-deployment.sh` | 224 | Shell | 系統性檢查 Docker 建置和部署流程中的所有關鍵點（本地環境、build、network、runtime） | `bash scripts/diagnose-docker-deployment.sh` | docker |
| 36 | `restore-azure-appsettings.sh` | 59 | Shell | 還原 Azure App Service 所有環境變數設定（使用單一 az 命令避免覆蓋） | `bash scripts/restore-azure-appsettings.sh` | az cli |
| 37 | `migrate-and-seed.sh` | 106 | Shell | Docker 容器中執行 Prisma 遷移 + 種子資料（generate → migrate deploy → seed-minimal） | `bash scripts/migrate-and-seed.sh` | pnpm, prisma, DATABASE_URL |

---

## 9. 環境重置

| # | 檔案名稱 | 行數 | 語言 | 用途 | 執行方式 | 依賴 |
|---|----------|------|------|------|----------|------|
| 38 | `complete-reset.ps1` | 120 | PS1 | FIX-061 完整重置：停止 Node.js 進程、清除快取、重新安裝依賴、重建 Prisma、重啟 Docker | `powershell ./scripts/complete-reset.ps1` | PowerShell |
| 39 | `reset.ps1` | 75 | PS1 | 快速重置：清除編譯快取、清除 Turborepo 快取、清除 node_modules、重新安裝 | `powershell ./scripts/reset.ps1` | PowerShell |

---

## 未分類

| # | 檔案名稱 | 行數 | 語言 | 用途 |
|---|----------|------|------|------|
| 40 | `CLAUDE.md` | 約 500 | MD | scripts 目錄的 AI 助手引導文檔，包含所有腳本的分類、用途和使用方式 |

---

## 統計摘要

### 按類別分佈

| 類別 | 腳本數量 | 總行數 |
|------|---------|--------|
| 環境檢查與設置 | 5 | 648 |
| 索引維護 | 1 | 702 |
| 國際化 | 7 | 1,569 |
| 代碼修復與品質 | 8 | 1,287 |
| 認證測試 | 4 | 459 |
| API 與資料庫測試 | 4 | 958 |
| 資料遷移與處理 | 4 | 719 |
| Azure 部署 | 4 | 557 |
| 環境重置 | 2 | 195 |
| 文檔 (CLAUDE.md) | 1 | ~500 |
| **合計** | **40** | **~7,594** |

### 按語言分佈

| 語言 | 數量 | 典型用途 |
|------|------|----------|
| JavaScript (.js) | 19 | 環境檢查、i18n 驗證、代碼修復、索引維護 |
| TypeScript (.ts) | 8 | API 測試、認證測試、用戶管理 |
| Python (.py) | 4 | 數據轉換、import 修復、截圖提取 |
| Shell (.sh) | 5 | Azure 部署、遷移、i18n 批量操作 |
| PowerShell (.ps1) | 2 | Windows 環境重置 |
| SQL (.sql) | 1 | 資料庫初始化 |
| Markdown (.md) | 1 | 文檔 |

### 已註冊 pnpm 命令

| 命令 | 對應腳本 |
|------|----------|
| `pnpm check:env` | `node scripts/check-environment.js` |
| `pnpm index:check` | `node scripts/check-index-sync.js` |
| `pnpm index:check:incremental` | `node scripts/check-index-sync.js --incremental` |
| `pnpm index:fix` | `node scripts/check-index-sync.js --auto-fix` |
| `pnpm validate:i18n` | `node scripts/validate-i18n.js` |
| `pnpm test:api` | `tsx scripts/api-health-check.ts` |
| `pnpm setup` | `pnpm install && pnpm db:generate && node scripts/check-environment.js` |

### 關鍵觀察

1. **i18n 相關腳本最多（7 個）**：反映了國際化遷移是一項重大工程，需要多個工具支援不同階段
2. **代碼修復類腳本（8 個）**：多數為一次性修復腳本，解決特定的代碼問題（重複 import、locale 前綴、麵包屑路由等）
3. **Python 腳本（4 個）**：主要用於 FEAT-008 Excel 數據導入相關的數據處理
4. **跨平台支援**：Shell (.sh) 用於 Linux/macOS/CI，PowerShell (.ps1) 用於 Windows 本地開發
5. **測試腳本豐富**：API 健康檢查 + 認證測試 + 資料庫連接測試，覆蓋了關鍵業務路徑
6. **大量腳本為「一次性」用途**：如 fix-* 系列和 add-* 系列，解決特定問題後不再需要重複執行
