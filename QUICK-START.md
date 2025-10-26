# 🚀 IT 專案流程管理平台 - 快速啟動指南

> **目的**: 為不同使用者和場景提供標準化的快速啟動流程
> **適用對象**: 新開發人員、AI 助手、回歸開發人員
> **最後更新**: 2025-10-26

---

## 📋 目錄

1. [給新開發人員（人類）](#給新開發人員15-分鐘快速上手)
2. [給 AI 助手 - 場景 1：完全重啟](#場景-1完全重啟-claude-code冷啟動)
3. [給 AI 助手 - 場景 2：Context Compact](#場景-2context-compact-後溫啟動)
4. [給 AI 助手 - 場景 3：維護提醒](#場景-3維護提醒機制)

---

## 給新開發人員（15 分鐘快速上手）

### 環境設置（10 分鐘）

1. **先決條件檢查**：
   ```bash
   # 檢查 Node.js 版本（需要 >= 20.0.0）
   node --version

   # 檢查 pnpm（需要 >= 8.0.0）
   pnpm --version

   # 檢查 Docker
   docker --version
   ```

2. **完整設置流程**（參考 DEVELOPMENT-SETUP.md）：
   ```bash
   # 1. 克隆專案
   git clone https://github.com/laitim2001/ai-it-project-process-management-webapp.git
   cd ai-it-project-process-management-webapp

   # 2. 一鍵設置（安裝 + 生成 + 檢查）
   pnpm setup

   # 3. 配置環境變數
   cp .env.example .env
   # 編輯 .env 填入必要配置

   # 4. 啟動本地服務
   docker-compose up -d

   # 5. 執行資料庫遷移
   pnpm db:migrate

   # 6. （可選）填充測試數據
   pnpm db:seed

   # 7. 啟動開發服務器
   pnpm dev
   ```

3. **驗證設置**：
   ```bash
   # 自動檢查環境配置
   pnpm check:env

   # 應該看到 10/10 檢查通過
   ```

### 理解專案（5 分鐘）

**必讀文件**（按順序）：
1. `README.md` - 專案總覽（3 分鐘）
2. `.ai-context` - 專案狀態速覽（1 分鐘）
3. `CLAUDE.md` - 技術架構和開發指南（深入閱讀時）

**核心概念速記**：
- **業務流程**: Budget Pool → Project → Proposal → Vendor/Quote → Purchase Order → Expense
- **用戶角色**: ProjectManager（專案經理）、Supervisor（主管）、Admin（管理員）
- **技術棧**: Next.js 14 + tRPC + Prisma + PostgreSQL + Azure AD B2C
- **當前狀態**: Post-MVP 完成（Epic 1-8 ✅），準備 Epic 9-10

---

## 場景 1：完全重啟 Claude Code（冷啟動）

### 🎯 使用時機
- 在 PowerShell / CMD 執行 `claude` 命令
- 新開一個 Claude Code 視窗
- 長時間（>24 小時）未開發，需要完整載入上下文

### 📝 標準 Prompt 模板（基礎版）

````markdown
你好！我正在啟動 IT 專案流程管理平台的開發工作。

請按以下步驟載入專案上下文（請確保使用繁體中文對答）：

1. 📖 **讀取核心索引文件**（按順序）：
   - .ai-context（30 秒極簡載入）
   - AI-ASSISTANT-GUIDE.md（快速參考，重點閱讀「立即執行區」）
   - DEVELOPMENT-LOG.md（只讀最新 50-100 行，了解最近進展）

2. 🎯 **確認當前狀態**：
   - 當前開發階段
   - 最近完成的任務
   - 待處理的工作

3. 📋 **準備工作**：
   - 檢查是否有未完成的 todos
   - 詢問我今天的開發目標

**重要提醒**：
- ✅ 永遠使用繁體中文對答
- ✅ 切記不要中止任何 node.js 進程
- ✅ 開始開發前先制定 todos list
````

### 📝 進階 Prompt 模板（詳細版）

**使用時機**: 需要進行大型功能開發或架構變更

````markdown
你好！我需要進行一個較大的功能開發，請完整載入專案上下文：

1. 📖 **完整上下文載入**：
   - .ai-context
   - AI-ASSISTANT-GUIDE.md（完整閱讀）
   - CLAUDE.md（了解技術架構和數據模型）
   - DEVELOPMENT-LOG.md（讀取當前季度記錄）
   - PROJECT-INDEX.md（如需要查找特定文件）

2. 🎯 **我的開發目標**：
   [描述您要開發的功能，例如：]
   - 實施 Epic 9 的智能預算建議功能
   - 修復 Quotes 頁面的性能問題
   - 重構認證系統

3. 📋 **請先制定詳細的 todos list，然後開始開發**

**補充說明**：
- 當前專案狀態: Post-MVP 完成，Epic 1-8 ✅ 100%
- 代碼規模: ~30,000+ 行
- 技術棧: Next.js 14 + tRPC + Prisma + PostgreSQL
````

### 🔍 快速檢查 Prompt（驗證載入）

**載入完成後，請 AI 助手執行以下檢查**：

````markdown
請確認您已正確載入專案上下文，回答以下問題：

1. ✅ 當前專案處於什麼開發階段？（應答：Post-MVP 完成，準備 Epic 9-10）
2. ✅ 專案使用什麼技術棧？（應答：Next.js 14 + tRPC + Prisma + PostgreSQL）
3. ✅ 最近完成了哪些工作？（應答：從 DEVELOPMENT-LOG.md 最新記錄中總結）
4. ✅ 您將使用什麼語言對答？（應答：繁體中文）

如果以上答案正確，我們可以開始開發了。
````

---

## 場景 2：Context Compact 後（溫啟動）

### 🎯 使用時機
- 對話達到 token 上限，自動 compact 後
- 新對話視窗開啟（但 Claude Code 會話未結束）
- 需要快速恢復剛才的工作

### 📝 標準 Prompt 模板（快速版）

````markdown
[對話已 compact] 請快速恢復上下文：

**我們剛才在進行**：
[簡述剛才的工作，例如：]
- 正在實施 Epic 9 的預算建議功能
- 已完成 API 層設計，正在開發前端組件
- 當前 todos: [列出未完成的 todos]

**請執行快速恢復**：
1. ✅ 切換繁體中文對答模式
2. 📖 只需讀取 DEVELOPMENT-LOG.md 最新 20-30 行（確認最新狀態）
3. 📋 顯示當前 todos list 狀態
4. 🚀 繼續未完成的工作

**重要**：
- 不需要重新讀取完整專案背景
- 保持繼續剛才的開發工作
- 切記不要中止任何 node.js 進程
````

### 📝 極簡 Prompt 模板

**使用時機**: 您清楚記得剛才的工作，只需要 AI 助手快速切換

````markdown
繼續剛才的開發（對話已 compact）：

**當前狀態**: [一句話描述，例如：正在開發 Epic 9 預算建議 API]
**待辦事項**: [列出未完成的 todos]

請繼續，保持繁體中文對答。
````

### 🔄 恢復檢查清單

**AI 助手恢復後應確認**：
- [ ] 已切換繁體中文對答
- [ ] 已了解當前工作狀態
- [ ] 已確認未完成的 todos
- [ ] 已準備繼續開發

---

## 場景 3：維護提醒機制

### 🎯 觸發時機

#### 自動觸發（AI 助手應主動檢查）

**高優先級觸發（必須執行）**：
- ✅ 完成一個完整 Epic
- ✅ 完成 5+ 個 todos
- ✅ 用戶說「今天結束」、「準備下班」等結束語
- ✅ 準備執行 `git commit` 之前

**中優先級觸發（建議執行）**：
- ⚠️ 完成 3+ 個 todos
- ⚠️ 工作時間超過 2 小時（根據 DEVELOPMENT-LOG.md 時間戳判斷）
- ⚠️ 新增 3+ 個文件

**低優先級觸發（可選執行）**：
- 💡 用戶詢問「接下來做什麼」
- 💡 完成一個較大的重構

#### 手動觸發

用戶明確使用以下 Prompt：

````markdown
請執行專案維護檢查清單
````

或

````markdown
準備同步到 GitHub，請執行完整維護流程
````

### 📝 完整維護 Prompt

````markdown
請執行專案維護檢查清單：

**1. 📝 開發記錄更新**
- [ ] 更新 DEVELOPMENT-LOG.md（最新記錄放最上面）
- [ ] 如有 bug fix，更新 FIXLOG.md
- [ ] 檢查並更新 mvp-progress-report.json（如適用）

**2. 📊 進度總結**
- [ ] 總結今天/本次完成的工作
- [ ] 確認所有 todos 狀態正確
- [ ] 更新相關 Epic 完成狀態（如適用）

**3. 🗂️ 索引維護**
- [ ] 執行 `pnpm index:check`（檢查索引同步）
- [ ] 新增的文件是否已加入 PROJECT-INDEX.md
- [ ] 更新 AI-ASSISTANT-GUIDE.md（如有重大變更）

**4. 📂 文件管理**
- [ ] 清理臨時文件（temp_*.md, *.backup）
- [ ] 檢查是否有文件需要歸檔
- [ ] claudedocs/ 新增文件是否需要分類

**5. 🔄 GitHub 同步**
- [ ] 確認所有改動符合預期
- [ ] 執行 git status 檢查狀態
- [ ] 準備 commit message（包含功能說明）
- [ ] 詢問用戶是否同意同步到 GitHub

**請逐項執行並報告結果。**
````

### 📝 快速維護 Prompt（日常小更新）

````markdown
快速維護檢查：

1. 更新 DEVELOPMENT-LOG.md（今天的工作記錄）
2. 執行 pnpm index:check
3. 準備同步到 GitHub

請執行並確認是否有問題。
````

### 🤖 AI 助手友善提醒話術

**友善提醒版（中優先級觸發）**：

```
💡 提醒：我注意到我們已經完成了 3 個任務，建議執行一次維護檢查：
   - 更新開發記錄
   - 檢查索引同步
   - 準備 GitHub 同步

   您希望現在執行還是繼續開發？
```

**緊急提醒版（高優先級觸發）**：

```
⚠️ 重要提醒：我們已經完成了一個完整的 Epic / 5 個以上的任務，
   強烈建議執行完整的維護流程，以確保專案記錄完整。

   是否現在執行維護檢查清單？
```

**結束工作提醒版**：

```
📋 結束工作檢查：

   在結束今天的開發前，建議執行以下維護：
   1. ✅ 更新開發記錄
   2. ✅ 檢查索引同步
   3. ✅ 同步到 GitHub

   是否執行完整維護流程？
```

---

## 🔗 相關文件

### 核心索引系統
- `.ai-context` - 30 秒極簡載入
- `AI-ASSISTANT-GUIDE.md` - 完整工作流程
- `PROJECT-INDEX.md` - 250+ 文件索引
- `INDEX-MAINTENANCE-GUIDE.md` - 索引維護指南

### 開發指南
- `CLAUDE.md` - 技術架構和數據模型
- `DEVELOPMENT-SETUP.md` - 環境設置指南（711 行）
- `CONTRIBUTING.md` - 貢獻指南

### 記錄文件
- `DEVELOPMENT-LOG.md` - 開發記錄（最新在上）
- `FIXLOG.md` - 問題修復記錄（最新在上）

---

## 💡 最佳實踐

### 給開發人員
1. ✅ 每次開發前執行 `pnpm check:env` 確保環境正常
2. ✅ 使用 `pnpm dev` 啟動開發服務器（不要用 npm）
3. ✅ 重大變更前先創建 feature branch
4. ✅ 定期執行 `pnpm index:check` 維護索引
5. ✅ 遇到問題先查閱 `FIXLOG.md`，避免重複踩坑

### 給 AI 助手
1. ✅ 永遠使用繁體中文對答
2. ✅ >3 步驟任務必須先創建 todos list
3. ✅ 每個 todo 完成後更新 DEVELOPMENT-LOG.md
4. ✅ 切記不要中止任何 node.js 進程
5. ✅ 定期主動觸發維護檢查

---

**最後更新**: 2025-10-26
**維護者**: AI 助手 + 開發團隊
**問題回報**: 請更新 FIXLOG.md 或創建 GitHub Issue
