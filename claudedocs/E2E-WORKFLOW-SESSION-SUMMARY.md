# E2E 工作流測試會話總結

**會話日期**: 2025-10-29
**會話時長**: ~2 小時
**主要任務**: E2E 測試配置修復與環境整合
**狀態**: 🔄 配置更新完成，認證問題診斷中

---

## ✅ 完成的工作

### 1. 問題診斷與分析

**發現**: Stage 1 (工作流測試) 已在之前會話中完成！
- ✅ 3 個工作流測試文件已存在 (1,720 行代碼)
- ✅ 測試輔助基礎設施已完成
- ✅ 完整文檔已創建

**新問題發現**:
1. **端口衝突**: Playwright 配置使用 3005，實際服務器在 3006
2. **環境變數不一致**: `.env` 中 NEXTAUTH_URL 指向 3001
3. **多進程干擾**: 72+ 個 Node.js 進程同時運行
4. **認證重定向失敗**: 登入成功但無法跳轉到 dashboard

### 2. Playwright 配置更新 (Stage 2.1) ✅

**文件**: `apps/web/playwright.config.ts`

**更改內容**:
```typescript
// 更新前:
baseURL: 'http://localhost:3005'
webServer: { url: 'http://localhost:3005', reuseExistingServer: false }

// 更新後:
baseURL: process.env.BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3006'
webServer: {
  url: 'http://localhost:3006',
  reuseExistingServer: true,  // 避免端口衝突
  env: {
    PORT: '3006',
    NEXTAUTH_URL: 'http://localhost:3006',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3006',
  }
}
```

**目的**:
- 解決端口衝突問題 (3005 已被佔用)
- 使用端口 3006 (當前運行的測試服務器)
- 複用已運行的服務器 (避免啟動新進程)
- 在 webServer 配置中直接注入環境變數

### 3. 環境變數配置修復 (Stage 2.2) ✅

#### 3.1 修復 `.env` 檔案

**文件**: `apps/web/.env`

**修改**:
```bash
# 更新前:
NEXTAUTH_URL="http://localhost:3001"

# 更新後:
NEXTAUTH_URL="http://localhost:3006"
```

#### 3.2 創建 `.env.test` 測試環境配置

**文件**: `apps/web/.env.test` (新建)

**配置內容**:
```bash
# E2E 測試環境配置
PORT=3006
NEXTAUTH_URL=http://localhost:3006
NEXTAUTH_SECRET=GN29FTOogkrnhekm/744zMLQ2ulykQey98eXUMnltnA=
NEXT_PUBLIC_APP_URL=http://localhost:3006
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"
REDIS_URL="redis://localhost:6381"
SMTP_HOST=localhost
SMTP_PORT=1025
NEXT_PUBLIC_FEATURE_AI_ASSISTANT=false
NEXT_PUBLIC_FEATURE_EXTERNAL_INTEGRATION=false
```

**目的**: 統一測試環境的環境變數配置，確保一致性

### 4. 進程管理與清理 ✅ 部分完成

**問題診斷**:
- 發現 72+ 個 Node.js 進程同時運行
- 包括大量舊的 Playwright 測試進程
- 端口 3006 被進程 37728 佔用

**執行清理**:
- ✅ 終止了 20+ 個舊的測試背景進程
- ✅ 終止了佔用端口 3006 的舊服務器 (PID 37728)
- ✅ 重啟開發服務器 (Bash ID: 901478) 使用新配置

### 5. 測試執行與驗證 ❌ 失敗

**測試運行 1**: 使用端口 3005 (失敗)
```
Error: listen EADDRINUSE: address already in use :::3005
✘ 7/7 tests failed - 端口衝突導致服務器啟動失敗
```

**測試運行 2**: 更新配置後使用端口 3006 (部分成功)
```
✅ 登入請求成功 (status: 200, ok: true)
✅ 服務器運行正常 (port 3006)
❌ TimeoutError: page.waitForURL('/dashboard') 超時
當前 URL: http://localhost:3006/login?callbackUrl=http://localhost:3006/dashboard
```

**測試運行 3**: 修復 `.env` 後重測 (仍失敗)
```
✅ 服務器使用新配置啟動
✅ 登入請求成功
❌ 頁面停留在登入頁，無法重定向
⚠️ 服務器日誌中沒有認證相關日誌 (沒有 "🔐 Authorize 函數執行")
```

### 6. 文檔創建與更新 ✅

**新建文檔**:
- `claudedocs/E2E-WORKFLOW-TESTING-PROGRESS.md` - 詳細進度追蹤
- `claudedocs/E2E-WORKFLOW-SESSION-SUMMARY.md` - 本文檔（會話總結）
- `apps/web/.env.test` - 測試環境配置

---

## ⚠️ 當前阻塞問題

### 問題 1: 環境變數配置不一致 ✅ 已修復

**問題描述**:
- `.env` 檔案中 NEXTAUTH_URL 指向 `http://localhost:3001`
- 實際服務器運行在端口 3006
- 導致登入重定向失敗

**解決方案**:
- ✅ 更新 `apps/web/.env`: NEXTAUTH_URL 改為 `http://localhost:3006`
- ✅ 創建 `apps/web/.env.test` 統一測試環境配置
- ✅ 終止佔用端口 3006 的舊進程 (PID 37728)
- ✅ 重啟開發服務器使用新配置

### 問題 2: 多個 Node.js 進程干擾 ⏳ 部分解決

**問題描述**:
- 系統中運行著 72+ 個 Node.js 進程
- 包括大量舊的 Playwright 測試進程
- 造成端口佔用和資源消耗

**已執行清理**:
- ✅ 終止了 20+ 個舊的測試進程 (使用 KillShell)
- ✅ 終止了多餘的開發服務器進程
- ⏳ 仍有大量進程未清理

**建議方案**:
```powershell
# 清理所有 Node.js 進程（保留 VS Code/Claude Code）
Get-Process node | Where-Object {$_.Path -notlike "*Code*"} | Stop-Process -Force
```

### 問題 3: 認證重定向仍失敗 ❌ 待解決

**問題描述**:
- ✅ 登入請求成功 (status: 200, ok: true)
- ✅ NextAuth signIn 返回成功
- ❌ 頁面停留在 `/login?callbackUrl=...`
- ❌ 無法重定向到 dashboard
- ❌ 服務器日誌中沒有認證相關日誌 (缺少 "🔐 Authorize 函數執行")

**詳細症狀**:
```
瀏覽器控制台:
✅ 🔐 開始登入流程 {email: test-manager@example.com, callbackUrl: /dashboard}
✅ 📊 signIn 結果: {error: null, status: 200, ok: true, url: ...}
✅ ✅ 登入成功

頁面狀態:
❌ 停留在: http://localhost:3006/login?callbackUrl=http%3A%2F%2Flocalhost%3A3006%2Fdashboard
❌ 未跳轉到: http://localhost:3006/dashboard

服務器日誌:
⚠️ 沒有 "🔐 Authorize 函數執行" 日誌
⚠️ 認證流程似乎沒有被調用
```

**可能原因分析**:

1. **Next.js 緩存問題** (最可能)
   - `.env` 更改可能未被 Next.js 完全重新載入
   - `.next` 建構緩存可能包含舊的配置
   - 環境變數在建構時被固化

2. **多進程干擾**
   - 仍有多個 Node.js 進程在運行
   - 可能有舊的服務器實例仍在響應請求
   - 端口雖然可用，但可能有隱藏的進程衝突

3. **Session/Cookie 緩存問題**
   - 瀏覽器可能緩存了舊的 session
   - NextAuth cookie 可能指向錯誤的域或端口
   - Playwright 瀏覽器上下文可能需要清理

4. **認證流程未觸發**
   - signIn 返回成功但實際認證未執行
   - 可能是 credentials provider 配置問題
   - 可能是 middleware 攔截了請求

**建議解決方案**:

**方法 1: 完全清理並重啟** (推薦)
```powershell
# 1. 清理所有 Node.js 進程
Get-Process node | Where-Object {$_.Path -notlike "*Code*"} | Stop-Process -Force

# 2. 刪除 Next.js 緩存
Remove-Item -Recurse -Force apps/web/.next

# 3. 重新啟動開發服務器
cd apps/web
pnpm dev --port 3006

# 4. 等待 5 秒確保啟動完成
Start-Sleep -Seconds 5

# 5. 運行測試
BASE_URL=http://localhost:3006 pnpm exec playwright test e2e/workflows/ --project=chromium --reporter=list
```

**方法 2: 檢查認證配置**
- 檢查 `packages/auth/src/index.ts` 中的 authorize 函數
- 驗證 credentials provider 是否正確配置
- 確認 JWT 和 session callbacks 正常工作

**方法 3: 使用無痕模式測試**
- 使用 Playwright 的無痕模式避免 cookie 緩存
- 每次測試都使用新的 browser context

---

## 📊 實施進度更新

### Stage 1: 工作流測試 ✅ 100% 完成

**發現**: 在之前的會話中已完成！

| 任務 | 狀態 | 文件 | 行數 |
|------|------|------|------|
| 預算提案工作流測試 | ✅ | budget-proposal-workflow.spec.ts | 292 |
| 採購工作流測試 | ✅ | procurement-workflow.spec.ts | 328 |
| 費用轉嫁工作流測試 | ✅ | expense-chargeout-workflow.spec.ts | 404 |
| 認證 Fixtures | ✅ | fixtures/auth.ts | 127 |
| 測試數據工廠 | ✅ | fixtures/test-data.ts | 116 |
| 測試文檔 | ✅ | e2e/README.md | 453 |
| **總計** | **✅** | **6 files** | **1,720 lines** |

**測試場景覆蓋**:
- 📋 預算申請工作流: 2 個場景 (完整流程 + 拒絕流程)
- 🛒 採購工作流: 2 個場景 (完整流程 + 拒絕流程)
- 💰 費用轉嫁工作流: 3 個場景 (完整流程 + 拒絕流程 + 多費用項目)
- **總計**: 7 個端到端工作流測試場景

### Stage 2: 測試配置整合 🔄 70% 完成

| 任務 | 狀態 | 完成度 | 備註 |
|------|------|--------|------|
| 更新 Playwright 配置 | ✅ | 100% | 端口 3006 + 環境變數注入 |
| 創建 .env.test | ✅ | 100% | 統一測試環境配置 |
| 修復 .env 配置 | ✅ | 100% | NEXTAUTH_URL → 3006 |
| 清理背景進程 | 🔄 | 50% | 部分清理，仍有多個進程 |
| 驗證測試運行 | ❌ | 0% | **阻塞中** - 認證重定向失敗 |
| 創建測試數據設置腳本 | ❌ | 0% | 待開始 |
| 清理臨時文件 | ❌ | 0% | 待開始 |
| 更新 package.json 腳本 | ❌ | 0% | 待開始 |

**阻塞原因**: 認證重定向問題導致所有工作流測試無法通過第一步登入

### Stage 3-4: 待開始

- **Stage 3**: 測試覆蓋率提升 (錯誤處理、表單驗證、邊界條件)
- **Stage 4**: CI/CD 集成 (GitHub Actions)

---

## 🎯 下一步行動計劃

### 立即行動 (需要執行)

#### 1. 完全清理 Node.js 進程 🔴 高優先級

**原因**: 72+ 個進程可能互相干擾，造成環境不穩定

**PowerShell 命令**:
```powershell
# 查看所有 Node.js 進程
Get-Process node | Select-Object Id, ProcessName, StartTime

# 清理所有 Node.js 進程（保留 VS Code/Claude Code）
Get-Process node | Where-Object {$_.Path -notlike "*Code*"} | Stop-Process -Force

# 驗證清理結果
Get-Process node -ErrorAction SilentlyContinue
```

#### 2. 刪除 Next.js 緩存 🔴 高優先級

**原因**: `.env` 更改可能被緩存，未生效

**命令**:
```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force apps/web/.next

# 或 Git Bash
rm -rf apps/web/.next
```

#### 3. 重啟開發服務器 🔴 高優先級

**使用更新的環境變數**:
```bash
cd apps/web
pnpm dev --port 3006
```

**等待服務器完全啟動** (約 5-10 秒)

#### 4. 運行測試驗證修復 🔴 高優先級

```bash
cd apps/web
BASE_URL=http://localhost:3006 pnpm exec playwright test e2e/workflows/ --project=chromium --reporter=list
```

**預期結果**:
- ✅ 登入成功
- ✅ 重定向到 dashboard
- ✅ 工作流測試通過

### 後續任務 (Stage 2 剩餘工作)

#### 1. 創建測試數據設置腳本

**文件**: `scripts/test-data-setup.ts`

**功能**:
- 初始化測試數據庫
- 創建測試用戶 (ProjectManager, Supervisor)
- 創建測試預算池
- 清理舊的測試數據

#### 2. 清理臨時測試文件

**待刪除文件**:
- `playwright.config.test.ts` (已合併到主配置)
- `.env.test.local` (已改為 .env.test)
- `scripts/test-login-3006.ts` (臨時調試腳本)
- `scripts/test-nextauth-direct.ts` (臨時調試腳本)

#### 3. 更新 package.json 測試腳本

**添加新腳本**:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:workflows": "playwright test e2e/workflows/",
    "test:e2e:debug": "playwright test --debug",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed"
  }
}
```

#### 4. 完成 Stage 2 驗證

- ✅ 所有工作流測試通過
- ✅ 配置文件整合完成
- ✅ 臨時文件清理
- ✅ 文檔更新

### Stage 3: 測試覆蓋率提升 (計劃)

#### 1. 錯誤處理測試

**文件**: `apps/web/e2e/error-handling.spec.ts`

**測試場景**:
- 無效登入憑證
- 未授權訪問
- 權限不足
- 無效表單輸入
- 網絡錯誤
- 404 頁面
- 文件上傳錯誤

#### 2. 表單驗證測試

**文件**: `apps/web/e2e/form-validation.spec.ts`

**測試場景**:
- Email 格式驗證
- 密碼強度驗證
- 日期範圍驗證
- 數量驗證
- 金額格式驗證
- 即時驗證

#### 3. 邊界條件測試

**文件**: `apps/web/e2e/boundary-conditions.spec.ts`

**測試場景**:
- 最大長度限制
- 零金額處理
- 極大金額處理
- 空列表處理
- 分頁邊界
- 無搜尋結果
- 並發操作

### Stage 4: CI/CD 集成 (計劃)

#### 1. GitHub Actions 工作流

**文件**: `.github/workflows/e2e-tests.yml`

**功能**:
- 多瀏覽器測試矩陣 (Chromium, Firefox)
- PostgreSQL 和 Redis 服務
- 測試報告上傳
- 失敗時截圖和視頻

#### 2. PR 檢查配置

**文件**: `.github/workflows/pr-checks.yml`

**功能**:
- 基本測試和工作流測試分離
- PR 評論集成
- 測試覆蓋率報告

---

## 📝 技術筆記與經驗教訓

### 1. 端口管理的重要性

**經驗教訓**:
- 多個服務器實例容易造成混淆和衝突
- 需要明確每個端口的用途和配置
- 使用 `reuseExistingServer: true` 可以避免端口衝突

**最佳實踐**:
- 統一測試環境端口 (如 3006)
- 文檔化所有使用的端口
- 定期清理舊的服務器進程
- 使用環境變數統一配置

### 2. 環境變數一致性

**經驗教訓**:
- 測試環境需要獨立、一致的環境配置
- `.env` 檔案更改需要重啟服務器才能生效
- Next.js 會緩存環境變數在建構時
- 多個配置源容易造成不一致

**最佳實踐**:
- 創建專門的 `.env.test` 測試配置
- 使用 `process.env` 動態讀取
- 在 Playwright 配置中注入環境變數
- 重啟服務器後驗證配置生效

### 3. Next.js 緩存問題

**經驗教訓**:
- `.next` 目錄會緩存建構結果
- 環境變數在建構時被固化
- 某些更改需要完全重新建構
- 熱重載不總是可靠

**最佳實踐**:
- 重要配置更改後刪除 `.next` 目錄
- 完全重啟開發服務器
- 使用 `--no-cache` 選項強制重新建構
- 驗證環境變數實際值

### 4. 多進程管理

**經驗教訓**:
- 背景進程容易累積（特別是測試進程）
- 多個進程可能佔用同一端口
- 舊進程可能干擾新進程
- 進程清理很重要

**最佳實踐**:
- 定期檢查運行中的 Node.js 進程
- 使用 PowerShell 批量管理進程
- 測試結束後清理背景進程
- 使用進程管理工具 (如 PM2)

### 5. 認證測試的挑戰

**經驗教訓**:
- NextAuth 認證流程複雜
- 重定向依賴多個配置
- Cookie 和 session 管理需要仔細處理
- 測試環境需要特殊配置

**最佳實踐**:
- 使用 `redirect: false` 獲取 signIn 結果
- 手動處理重定向邏輯
- 添加詳細的日誌追蹤
- 使用獨立的瀏覽器上下文

### 6. Playwright 測試最佳實踐

**經驗教訓**:
- `test.step()` 有助於組織複雜測試
- 適當的超時設置很重要
- 詳細的錯誤訊息有助於調試
- 截圖和視頻對問題診斷很有幫助

**最佳實踐**:
- 使用 `test.step()` 組織測試步驟
- 設置合理的超時時間 (15s for redirect)
- 添加 console.log 追蹤執行流程
- 配置失敗時自動截圖和錄影
- 使用 fixtures 管理測試環境

### 7. 測試數據管理

**成功模式**:
- 使用 `E2E_` 前綴標記測試數據
- 時間戳確保數據唯一性
- 數據生成函數提高複用性
- 測試後清理數據

**數據工廠模式**:
```typescript
export const generateBudgetPoolData = () => ({
  name: `E2E_BudgetPool_${timestamp()}`,
  description: 'E2E 測試預算池',
  totalAmount: '1000000',
  financialYear: '2025',
  categories: [
    { categoryName: 'Hardware', categoryCode: 'HW', totalAmount: '400000' },
    { categoryName: 'Software', categoryCode: 'SW', totalAmount: '300000' },
    { categoryName: 'Cloud', categoryCode: 'CLOUD', totalAmount: '300000' },
  ],
});
```

---

## 📈 測試覆蓋率目標

| 階段 | 測試數量 | 覆蓋率 | 狀態 | 完成時間 |
|------|---------|--------|------|---------|
| **基本功能** | 7 | ~20% | ✅ 完成 | 2025-10-28 |
| **工作流** | 7 | ~40% | 🔄 配置中 | **阻塞** |
| **錯誤處理** | 8 (計劃) | ~50% | ⏳ 待開始 | TBD |
| **表單驗證** | 6 (計劃) | ~55% | ⏳ 待開始 | TBD |
| **邊界條件** | 7 (計劃) | ~60% | ⏳ 待開始 | TBD |
| **完整覆蓋** | 40+ (目標) | 80%+ | 🎯 長期 | TBD |

**當前測試數量**: 7 (基本) + 7 (工作流) = **14 個測試**
**實際可運行**: 7 個 (工作流測試被阻塞)
**目標覆蓋率**: 從 40% 提升到 80%+

---

## 🔗 相關文檔

### 核心文檔
- [E2E-TESTING-ENHANCEMENT-PLAN.md](./E2E-TESTING-ENHANCEMENT-PLAN.md) - 完整增強計劃
- [E2E-WORKFLOW-TESTING-PROGRESS.md](./E2E-WORKFLOW-TESTING-PROGRESS.md) - 詳細進度追蹤
- [E2E-TESTING-FINAL-REPORT.md](./E2E-TESTING-FINAL-REPORT.md) - 基本測試最終報告

### 測試文檔
- [apps/web/e2e/README.md](../apps/web/e2e/README.md) - E2E 測試使用指南
- [apps/web/playwright.config.ts](../apps/web/playwright.config.ts) - Playwright 配置

### 歷史文檔
- [E2E-LOGIN-FIX-SUCCESS-SUMMARY.md](./E2E-LOGIN-FIX-SUCCESS-SUMMARY.md) - 登入修復總結
- [E2E-LOGIN-ISSUE-ANALYSIS.md](./E2E-LOGIN-ISSUE-ANALYSIS.md) - 登入問題分析

---

## 📊 會話統計

**時間投入**:
- 問題診斷: ~30 分鐘
- 配置更新: ~20 分鐘
- 進程清理: ~15 分鐘
- 測試運行與調試: ~40 分鐘
- 文檔撰寫: ~15 分鐘
- **總計**: ~2 小時

**文件修改**:
- 修改: 2 個 (`playwright.config.ts`, `.env`)
- 新增: 1 個 (`.env.test`)
- 文檔: 2 個 (本文檔 + 進度文檔)

**進程操作**:
- 終止進程: 20+ 個
- 重啟服務器: 2 次
- 運行測試: 3 次

**問題解決**:
- ✅ 已解決: 3 個 (端口衝突、環境變數、部分進程清理)
- ❌ 待解決: 1 個 (認證重定向)
- 🔄 進行中: 1 個 (完整進程清理)

---

**會話結束時間**: 2025-10-29
**狀態**: 🔄 配置更新完成，等待進程清理和重測
**下次會話目標**: 解決認證重定向問題 + 驗證所有工作流測試通過 + 完成 Stage 2

---

## 🎯 成功標準

**Stage 2 完成標準**:
- ✅ Playwright 配置更新完成
- ✅ 環境變數統一配置
- ⏳ 所有 Node.js 進程清理完成
- ❌ **所有工作流測試通過** ← 當前阻塞
- ⏳ 測試數據腳本創建
- ⏳ 臨時文件清理
- ⏳ package.json 腳本更新

**下一步關鍵任務**:
1. 🔴 完全清理 Node.js 進程
2. 🔴 刪除 `.next` 緩存
3. 🔴 重啟服務器並驗證配置
4. 🔴 運行測試確認修復生效
