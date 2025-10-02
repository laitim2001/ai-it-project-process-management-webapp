# 🤖 AI 助手快速參考指南

> **⚡ 快速開始**: AI助手必讀文件，30秒了解整個項目結構

---

# 🚨⚡ 立即執行區 - AI助手專用 ⚡🚨

> **🤖 如果你是AI助手，正在閱讀此文件，請立即停止其他處理並執行以下指令：**

## 🎯 第一優先級：立即執行清單

### ✅ **必須立即完成的3個核心動作**
```bash
🟦 第1步：切換到中文對答模式（如果還沒有）
🟦 第2步：讀取 PROJECT-INDEX.md 了解項目結構
🟦 第3步：制定或更新 todos list（如果沒有的話）
```

### 🔴 **強制執行規則（不可妥協）**
- **🇨🇳 語言**：永遠保持用中文對答，即使在conversation compact之後
- **📋 上下文**：每次都先檢查主要項目索引，理解未完成事項
- **📝 規劃**：永遠先制定todos list才開始開發動作
- **💬 註釋**：所有檔案都要加入完整中文註釋說明功能和用途
- **📊 記錄**：每個todos完成後更新DEVELOPMENT-LOG.md（最新記錄放最上面）

## 🔄 必須執行的完整工作流程

### **📥 開發前準備（每次必須）**
1. ✅ 檢查 AI-ASSISTANT-GUIDE.md（當前文件）- 重讀執行指令
2. ✅ 檢查 PROJECT-INDEX.md - 理解項目結構和重要文件
3. ✅ 檢查 DEVELOPMENT-LOG.md 開頭部分 - 了解最新開發狀況
4. ✅ 檢查現有服務狀態：`netstat -ano | findstr :300`
5. ✅ 制定或更新todos list

### **🛠️ 開發過程中（持續遵循）**
1. ✅ 每個檔案都加入完整中文註釋
2. ✅ 留意報錯和超時事件，確保處理完成
3. ✅ 需要時查閱 DEVELOPMENT-SERVICE-MANAGEMENT.md

### **📋 每個todos完成後（強制執行）**
1. ✅ 更新 DEVELOPMENT-LOG.md（最新記錄放文件最上面）
2. ✅ 檢查 mvp-progress-report.json 是否需要更新
3. ✅ 執行索引維護（參考INDEX-MAINTENANCE-GUIDE.md）
4. ✅ 更新 docs/mvp2-implementation-checklist.md（MVP Phase 2進度追蹤）
5. ✅ 如有bug fix，更新FIXLOG.md（最新記錄放最上面）
6. ✅ 與用戶確認改動是否接受
7. ✅ 確認後同步到GitHub

**📅 最近更新 (2025-10-02 23:30)**:
- 🎉 Sprint 5 完整完成 (100%)！包含完整測試覆蓋
- Sprint 5 Week 10 完整交付：
  - Day 1-2: 通知系統完整實現 (~3,100行)
  - Day 3: 範本系統前端 (~3,590行)
  - Day 4: PDF導出功能 (~960行)
  - Day 5: 測試套件完整 (~1,500行)
  - Day 6: 版本歷史UI (~1,120行)
  - Day 7: 版本API測試 (~450行)
- Sprint 5 總計: 核心代碼 6,855行 + 測試代碼 2,350行 = 9,205行
- MVP Phase 2 總進度: 70% (38/54任務) - Sprint 1 + 2 + 4 + 5 完成
- 測試覆蓋率: 核心功能 90%+, 版本控制 95%+
- docs/mvp2-implementation-checklist.md 已更新至 70% 完成度

---

# ⚠️ 檢查點：確認你已完成上述指令 ⚠️

**🤖 AI助手，在繼續閱讀之前，請確認你已經：**
- [ ] 切換到中文對答模式
- [ ] 讀取了PROJECT-INDEX.md
- [ ] 制定了todos list或更新了現有list
- [ ] 理解了完整工作流程

**✅ 如果以上都完成，請繼續閱讀下面的詳細項目信息**

---

# 📋 原有的維護檢查清單（參考）

> **注意**：上面的立即執行區已涵蓋核心要求，這裡提供詳細的操作指南

## 🎯 開發前必讀指引 (每次開始前必須執行)

### ✅ **基本要求** (永遠遵循)
- [ ] 🇨🇳 **永遠保持用中文對答**，即使在conversation compact之後
- [ ] 📋 **永遠先檢查主要項目索引**，理解上下文、跟進中或未完成的事項
- [ ] 📝 **永遠先跟隨或制定todos list**才正式開始開發動作
- [ ] 💬 **在所有檔案中加入完整中文註釋**，說明功能、用途、段落功能
- [ ] 🔍 **小心留意報錯或超時事件**，確保沒有遺留跟進動作
- [ ] 📖 **需要時查閱 DEVELOPMENT-SERVICE-MANAGEMENT.md**

### ✅ **開發服務管理** (每次開發會話必須檢查)
- [ ] 🔍 **會話開始前**：檢查現有服務狀態 (`netstat -ano | findstr :300`)
- [ ] 🛑 **停止多餘服務**：確保只有一個開發服務運行 (`taskkill /f /im node.exe`)
- [ ] 🧹 **必要時清理緩存**：`rm -rf .next` 和 `npm run dev`
- [ ] ✅ **啟動單一服務**：記錄當前使用端口
- [ ] 🔄 **重建觸發條件**：環境變數、依賴包、配置文件、Webpack錯誤

### ✅ **項目理解檢查** (首次進入項目必須完成)
- [ ] 📚 完整查閱 `AI-ASSISTANT-GUIDE.md` (當前文件)
- [ ] 🗂️ 完整查閱 `PROJECT-INDEX.md` 理解項目結構
- [ ] 📊 查閱 `DEVELOPMENT-LOG.md` 最開頭部分了解最新狀態
- [ ] 🎯 確保對項目背景、目的、內容有完整理解

### ✅ **每個todos完成後強制動作** (必須完成)
- [ ] 📝 更新 `DEVELOPMENT-LOG.md` (最新記錄放文件最上面)
- [ ] 📊 檢查 `mvp-progress-report.json` 是否需要更新
- [ ] 🗂️ 執行項目索引維護 (參考 `INDEX-MAINTENANCE-GUIDE.md`)
- [ ] 📋 更新 `docs/mvp-implementation-checklist.md` (如MVP未完成)
- [ ] 🔧 如有bug fix，更新 `FIXLOG.md` (最新記錄放最上面)
- [ ] ✅ 與用戶確認改動是否接受
- [ ] 🔄 確認後同步到GitHub

## 📊 項目狀態更新強制檢查清單

### ✅ **階段1：更新前檢查** (必須完成)
- [ ] 📋 確認當前真實的MVP完成百分比 (檢查 `mvp-progress-report.json`)
- [ ] 🔍 檢查所有相關文件中的進度信息是否一致
- [ ] 📝 確認健康檢查系統和所有服務的實際狀態

### ✅ **階段2：同步更新所有相關文件** (必須完成)
當更新MVP進度時，必須同步更新以下文件：
- [ ] `AI-ASSISTANT-GUIDE.md` - 📊 MVP開發狀態部分
- [ ] `AI-ASSISTANT-GUIDE.md` - ⚡ 30秒項目摘要
- [ ] `AI-ASSISTANT-GUIDE.md` - 🎯 項目核心信息的狀態
- [ ] `docs/mvp-implementation-checklist.md` - 總體進度和檢查清單
- [ ] `mvp-progress-report.json` - 詳細進度報告和時間戳
- [ ] `PROJECT-INDEX.md` - 如有新文件需要添加索引

### ✅ **階段3：驗證更新完整性** (必須完成)
- [ ] 🔄 確認所有文件中的進度百分比一致
- [ ] 📅 確認時間戳更新到當前日期
- [ ] 🎯 確認狀態描述反映實際完成情況
- [ ] 📁 確認新文件已添加到相應索引中

### ✅ **階段4：文檔維護** (建議完成)
- [ ] 📝 更新 `DEVELOPMENT-LOG.md` 記錄重要變更
- [ ] 🔧 如有修復問題，更新 `FIXLOG.md`
- [ ] 📋 考慮是否需要創建新的FIX記錄

## 🎯 重要文件分類標準檢查

### 🔴 最重要文件標準
必須滿足以下條件之一：
- [ ] 理解項目核心業務邏輯必需
- [ ] 技術架構基礎設置
- [ ] 日常開發頻繁使用

### 🟡 重要文件標準
必須滿足以下條件之一：
- [ ] 功能實現經常參考
- [ ] 開發流程相關
- [ ] 測試和部署相關

### 🟢 參考文件標準
- [ ] 特定場景才需要
- [ ] 深入配置文件
- [ ] 環境和工具配置

## 🚀 簡化的用戶指令

現在您只需要說：
> **"請先檢查 @AI-ASSISTANT-GUIDE.md 的最上面的指引，再繼續開發"**

AI助手將自動執行所有必要的檢查和準備工作！

---

## 🎯 項目核心信息

**項目名稱**: AI 銷售賦能平台
**目標市場**: 馬來西亞/新加坡
**技術棧**: Next.js 14 + PostgreSQL + Azure OpenAI + Puppeteer + OpenTelemetry
**狀態**: ✅ MVP Phase 1 完成，🔄 MVP Phase 2 進行中 (70%)，Sprint 1+2+4+5 完成 🎉

---

## 📁 重要文件快速索引

> **📋 分類標準說明**：
> - **🔴 最重要 (必看)**: 理解項目核心業務和技術架構的關鍵文件，AI助手必須熟悉
> - **🟡 重要 (常用)**: 日常開發和功能實現經常需要參考的文件
> - **🟢 參考 (需要時查看)**: 特定場景或深入配置時才需要的專門文件

### 🔴 最重要 (必看)
```
docs/prd.md                     # 產品需求 (業務核心)
docs/architecture.md            # 技術架構 (Next.js 14 全棧)
docs/mvp-development-plan.md     # 12週開發計劃
docs/api-specification.md       # API 端點規格
prisma/schema.prisma            # 資料庫設計
package.json                    # 依賴包與腳本配置 (已修復tRPC v10兼容性，新增ioredis/@radix-ui/@clerk)
next.config.js                  # Next.js 配置
tailwind.config.js              # Tailwind CSS 配置
```

### 🟡 重要 (常用)
```
docs/user-stories/MVP-PRIORITIES.md    # 24個用戶故事優先級
docs/mvp-implementation-checklist.md   # 逐週執行清單
docs/testing-strategy.md               # 測試策略
docs/api/knowledge-base-api.md          # Knowledge Base API 完整文檔
docs/NEW-DEVELOPER-SETUP-GUIDE.md      # 新開發者環境自動化設置指南
STARTUP-GUIDE.md                       # 服務啟動完整指南
DEVELOPMENT-LOG.md                     # 開發討論和決策記錄
DEPLOYMENT-GUIDE.md                    # 生產環境部署指南
FIXLOG.md                              # 問題修復記錄和解決方案庫
scripts/health-check.js               # 服務健康檢查腳本
scripts/sync-mvp-checklist.js         # MVP進度自動同步腳本
scripts/run-integration-tests.ts       # 系統整合測試執行腳本
poc/run-all-tests.js                  # 技術驗證腳本
README.md                              # 項目說明
app/layout.tsx                         # Next.js 根布局
app/dashboard/page.tsx                 # 主儀表板頁面
app/dashboard/customers/page.tsx       # 客戶管理頁面
app/dashboard/search/page.tsx          # 全局AI智能搜索頁面
app/dashboard/proposals/page.tsx       # 提案管理頁面
app/dashboard/tasks/page.tsx           # 任務管理頁面
app/dashboard/settings/page.tsx        # 系統設置頁面
lib/auth.ts                            # JWT 認證系統
lib/db.ts                              # 資料庫連接配置
lib/middleware.ts                      # 認證與速率限制中間件系統
lib/middleware/rate-limiter.ts         # API速率限制核心實現
lib/monitoring/connection-monitor.ts   # 系統連接狀態監控服務
lib/monitoring/monitor-init.ts         # 監控系統初始化與生命周期管理
lib/pdf/pdf-generator.ts               # PDF生成核心引擎 (Puppeteer整合)
lib/pdf/proposal-pdf-template.ts       # 提案PDF專業範本系統
lib/pdf/index.ts                       # PDF模組統一導出
tests/integration/crm-integration.test.ts    # CRM整合測試套件
tests/integration/system-integration.test.ts # 系統級整合測試套件
types/ai.ts                            # AI 服務 TypeScript 類型定義
types/index.ts                         # 統一類型導出入口
.eslintrc.json                         # ESLint 配置
postcss.config.js                      # PostCSS 配置
```

### 🟢 參考 (需要時查看)
```
docs/security-standards.md     # 安全要求
docs/front-end-spec.md         # UI/UX 規格
components/admin/system-monitor.tsx   # 系統監控管理界面
app/api/health/route.ts               # 系統健康檢查API
app/api/[...slug]/route.ts           # API catch-all路由，處理404錯誤返回JSON格式
lib/api/response-helper.ts           # 統一API響應格式助手模組
app/api/proposal-templates/           # 提案範本管理API群組
app/api/templates/[id]/export-pdf/    # 提案範本PDF導出API
app/api/templates/export-pdf-test/    # 提案範本PDF測試API (創建頁面實時預覽)
app/dashboard/proposals/              # 提案管理前端頁面群組
app/dashboard/templates/[id]/preview/ # 提案範本預覽頁面 (含PDF導出)
.env.example                   # 環境配置範例
.env.production.example        # 生產環境配置範例
docker-compose.dev.yml         # 開發環境容器配置
docker-compose.prod.yml        # 生產環境容器配置
Dockerfile.prod                # 生產環境 Docker 配置
.github/workflows/ci.yml       # CI 持續整合流程
.github/workflows/deploy.yml   # 部署工作流程
nginx/nginx.conf               # Nginx 反向代理配置
monitoring/prometheus.yml      # Prometheus 監控配置
healthcheck.js                 # 容器健康檢查腳本
```

---

## 🚫 避免查找的目錄

```
.bmad-core/              # BMad 開發工具框架 (非項目內容)
.bmad-infrastructure-devops/  # DevOps 工具 (非項目內容)
web-bundles/             # 前端工具擴展 (非項目內容)
.claude/ .cursor/        # IDE 配置 (非項目內容)
.git/                    # Git 內部文件 (系統文件)
```

---

## 📋 如何使用索引系統

### 🎯 索引系統架構 (4層)

這個項目使用多層級索引系統，AI 助手應該按以下順序查找：

```
🔄 AI 助手查找流程
├── L0: .ai-context                    # ⚡ 極簡上下文載入
├── L1: AI-ASSISTANT-GUIDE.md          # 📋 當前文件 - 快速導航
├── L2: PROJECT-INDEX.md               # 🗂️ 完整文件索引
└── L3: indexes/[專門].md              # 🎯 特定領域專門索引
```

### 🚀 AI 助手標準工作流程

#### 1. **首次進入項目** (必須執行)
```bash
1️⃣ 讀取 .ai-context                    # 快速載入項目身份和核心路徑
2️⃣ 閱讀 AI-ASSISTANT-GUIDE.md (當前)   # 30秒了解項目結構
3️⃣ 需要詳細導航時查看 PROJECT-INDEX.md  # 完整文件地圖
```

#### 2. **日常查找策略**
```
查詢類型 → 建議路徑
├─ 快速了解 → 當前文件的常見查詢表
├─ 技術細節 → PROJECT-INDEX.md
├─ 專門領域 → 當項目規模達到觸發條件時建立
└─ 索引維護 → INDEX-MAINTENANCE-GUIDE.md
```

#### 3. **檢查索引健康狀態** (推薦)
```bash
# 當懷疑索引可能過期時執行
npm run index:check
```

### ⚠️ 重要索引使用規則

#### ✅ 推薦做法
- **按層級查找**: L0→L1→L2→L3 漸進深入
- **信任索引**: 索引中的文件路徑都是準確的
- **避免盲目搜索**: 先查索引再搜索文件
- **尊重分類**: 不在工具目錄中找業務文件

#### ❌ 避免做法
- **跳過索引**: 直接搜索文件而不查看索引
- **忽略避免目錄**: 在 `.bmad-core/` 等目錄中查找項目內容
- **過度依賴單一索引**: 所有查詢都只用一個索引文件

### 🔧 索引系統維護

#### AI 助手的維護責任
- **檢測不一致**: 發現索引與實際文件不符時提醒用戶
- **建議更新**: 發現重要新文件未納入索引時建議用戶添加
- **報告問題**: 發現斷掉的引用或過期信息時報告

#### 使用檢查工具
```bash
# AI 助手可以建議用戶運行
npm run index:check        # 檢查索引同步狀態
npm run index:health       # 完整健康檢查
npm run test:integration   # 執行完整系統整合測試
npm run test:integration:crm    # 執行CRM整合測試
npm run test:integration:system # 執行系統級整合測試
```

### 📊 索引擴展觸發條件

當項目達到以下規模時，AI 助手應建議啟用專門索引：

| 領域 | 觸發條件 | 建議動作 | 當前狀態 |
|------|----------|----------|----------|
| **API 端點** | > 20 個 | 建議建立 API 專門索引 | 📊 未達標 |
| **UI 組件** | > 50 個 | 建議建立 UI 組件專門索引 | 📊 未達標 |
| **資料表** | > 15 個 | 建議建立資料庫專門索引 | 📊 未達標 |
| **測試文件** | > 100 個 | 建議建立測試專門索引 | 📊 未達標 |

---

## 🔍 常見查詢快速指南

| 想了解什麼？ | 直接查看這個文件 |
|-------------|-----------------|
| 項目是什麼？ | `README.md` |
| 業務需求？ | `docs/prd.md` |
| 技術架構？ | `docs/architecture.md` |
| 開發計劃？ | `docs/mvp-development-plan.md` |
| 用戶故事？ | `docs/user-stories/MVP-PRIORITIES.md` |
| API 設計？ | `docs/api-specification.md` |
| Knowledge Base API？ | `docs/api/knowledge-base-api.md` |
| 資料庫？ | `prisma/schema.prisma` |
| 如何測試？ | `docs/testing-strategy.md` |
| 如何部署？ | `DEPLOYMENT-GUIDE.md` |
| CI/CD 流程？ | `.github/workflows/ci.yml`, `.github/workflows/deploy.yml` |
| 服務啟動？ | `STARTUP-GUIDE.md` |
| 技術驗證？ | `poc/README.md` |
| 環境設置？ | `.env.example` |
| 開發記錄？ | `DEVELOPMENT-LOG.md` |
| **TypeScript 類型？** | `types/ai.ts`, `types/index.ts` |
| **完整文件索引？** | `PROJECT-INDEX.md` |
| **索引維護方法？** | `INDEX-MAINTENANCE-GUIDE.md` |
| **索引提醒設置？** | `docs/INDEX-REMINDER-SETUP.md` |
| **檢查索引狀態？** | `npm run index:check` |
| **Claude Code 規則？** | `CLAUDE.md` |

---

## 📊 MVP 開發狀態

### MVP Phase 1 (12週計劃) - ✅ 100% 完成
```
🎯 目標: 11個核心功能
📅 時程: 12週 (6個Sprint)
👥 團隊: 5-7人
🚀 狀態: ✅ 所有Sprint 100% 完成！系統已達生產就緒狀態

✅ Sprint 1 (週1-2): 基礎架構設置 - 100% 完成
✅ Sprint 2 (週3-4): 認證與知識庫 - 100% 完成
✅ Sprint 3 (週5-6): AI 搜索引擎 - 100% 完成，包含：
    - 高性能向量搜索引擎
    - 智能搜索建議系統
    - 向量嵌入緩存系統
    - 性能監控和優化驗證
✅ Sprint 4 (週7-8): CRM 整合 - 100% 完成，包含：
    - Dynamics 365 完整整合
    - 客戶360度視圖組件
    - CRM搜索適配器
    - 模擬環境支持
✅ Sprint 5 (週9-10): AI 提案生成 - 100% 完成，包含：
    - AI提案生成引擎
    - 提案範本管理
    - 提案工作流程
✅ Sprint 6 (週11-12): 統一介面與品質優化 - 100% 完成，包含：
    - 前端渲染優化 ✅
    - API穩定性改善 ✅
    - 系統健康檢查優化 ✅ (2025-09-30完成)
    - 監控系統初始化機制 ✅
    - 5/5服務健康狀態達成 ✅
```

### MVP Phase 2 (企業級強化) - 🔄 進行中 (70%)
```
🎯 目標: 企業級功能強化 (54個任務)
📅 時程: 8週 (4個Sprint)
🚀 狀態: Sprint 1 + Sprint 2 + Sprint 4 + Sprint 5 完成 🎉 | Sprint 3 暫時跳過

✅ Sprint 1 (週1-2): API 網關與安全層 - 100% 完成 (6/6 任務)
    - 高級中間件系統 (10個核心中間件, 4,884行代碼)
    - Request Transformer + Response Cache
    - 335個測試全通過

✅ Sprint 2 (週3-4): 監控告警系統 - 100% 完成 (8/8 任務)
    - OpenTelemetry 零遷移成本架構
    - Prometheus + Grafana + Jaeger + Alertmanager 監控棧
    - 4個 Grafana 儀表板 (系統概覽/API性能/業務指標/資源使用)
    - 46個告警規則 (P1-P4四級告警系統)
    - 12個業務指標分類追蹤
    - 完整可觀測性 (Metrics + Traces + Logs)
    - 4個綜合文檔 (27,000+ 行)

⏭️ Sprint 3 (週5-6): 安全加固與合規 - 暫時跳過 (0/8 任務)
    ⚠️ 開發順序調整: 優先實施 Sprint 4 性能優化
    📝 詳細說明請參考 DEVELOPMENT-LOG.md (2025-10-01 23:50)
    🔜 未來實施: 資料加密、RBAC、GDPR/PDPA合規、災難恢復

✅ Sprint 4 (週7-8): 性能優化與高可用性 - 100% 完成 (6/6 任務)
    - API 響應緩存 (ETag + Cache-Control, 30 tests)
    - DataLoader 查詢優化 (防 N+1, 26 tests)
    - 性能監控系統 (8種指標, 36 tests)
    - 熔斷器模式 (3-state, 43 tests)
    - 健康檢查系統 (依賴管理, 34 tests)
    - 智能重試策略 (4種退避算法, 29 tests)
    - 總計: 3,086行代碼, 198個測試 100%通過

✅ Sprint 5 (週9-10): 提案生成工作流程 - 100% 完成 🎉 (2025-10-02完成)
    - ✅ Week 9: 工作流程引擎核心 (2,035行, 400行測試)
      - 工作流程狀態機 (420行, 12狀態, 30+轉換)
      - 版本控制系統 (370行, 快照/差異/回滾)
      - 評論系統 (370行, @mentions, 樹狀結構)
      - 審批管理器 (430行, 多級審批, 委派)
      - 測試框架 (400行, 工作流程引擎測試)

    - ✅ Week 10: 提案範本與通知系統 (4,820行, 1,950行測試)
      - Day 1-2: 通知系統完整 (~3,100行)
        * 通知引擎 + API (5個REST端點)
        * 通知中心前端 (5個React組件)
        * 工作流程整合 (engine/comment/approval)

      - Day 3: 範本系統前端 (~3,590行)
        * 範本管理API (6個REST API, 1,220行後端)
        * 範本前端頁面 (4個完整CRUD頁面, 2,370行)
        * Handlebars引擎 (25個Helper函數)

      - Day 4: PDF導出功能 (~960行)
        * PDF生成引擎 (270行, Puppeteer, 單例模式)
        * 專業PDF範本 (350行, 封面+內容頁, CSS)
        * PDF API (2個端點, 270行)
        * 前端整合 (預覽頁PDF導出, 70行)

      - Day 5: 測試套件完整 (~1,500行)
        * 範本管理器測試 (15+ tests, ~350行)
        * 範本引擎測試 (28+ tests, ~300行)
        * PDF生成器測試 (16+ tests, ~450行)
        * PDF範本測試 (21+ tests, ~400行)

      - Day 6: 版本歷史UI (~1,120行)
        * 版本API路由 (5個完整REST API, ~740行)
        * 版本歷史頁面 (完整UI整合, ~380行)
        * 權限控制 + 安全回滾機制

      - Day 7: 版本API測試 (~450行)
        * 版本操作測試 (20+ tests)
        * 並發測試 + 性能測試
        * 覆蓋率 95%+

    - 📊 Sprint 5 最終統計:
      * 核心代碼: 6,855行
      * 測試代碼: 2,350行
      * 總計: 9,205行
      * 測試覆蓋率: 核心 90%+, 版本控制 95%+
      * 設計模式: 6個 (State/Observer/Strategy/Factory/Command/Memento)
```

---

## 🎭 項目角色說明

**你是誰？** AI 開發助手
**項目類型？** 企業級 SaaS 平台
**主要用戶？** 銷售團隊 (B2B)
**核心價值？** AI 驅動的銷售效率提升

---

## ⚡ 30秒項目摘要

這是一個為馬來西亞/新加坡市場開發的 AI 銷售賦能平台，使用 Next.js 14 全棧架構，整合 Dynamics 365 CRM 和 Azure OpenAI + Puppeteer，幫助銷售團隊通過 AI 搜索、智能提案生成和客戶360度視圖提升成交率。**✅ MVP Phase 1 已 100% 完成**，**🔄 MVP Phase 2 進行中 (70%)**：已完成 Sprint 1 API 網關安全層（10個核心中間件，335測試）、Sprint 2 企業級監控告警系統（OpenTelemetry + Prometheus + Grafana，46告警規則）、Sprint 4 性能優化與高可用性（API緩存、熔斷器、健康檢查、智能重試，198測試）、**🎉 Sprint 5 完整完成（100%）**：工作流程引擎（2,035行，12狀態機，版本控制，評論，審批）+ 通知系統（3,100行）+ 範本系統（3,590行，Handlebars引擎，25 Helper）+ PDF導出（960行，Puppeteer，專業範本）+ 完整測試套件（2,350行，95%+覆蓋率），總計9,205行代碼。包含完整可觀測性（Metrics + Traces + Logs），系統已達企業級生產就緒狀態。⚠️ Sprint 3 (安全加固) 因優先級調整暫時跳過。

**🤖 AI 助手重要提醒**:
- 這個項目有完整的4層索引系統，按 L0→L1→L2→L3 順序查找
- 避免在 `.bmad-core/`, `web-bundles/` 等工具目錄中查找項目內容
- 使用 `npm run index:check` 檢查索引健康狀態
- 詳細導航指南請查看 `PROJECT-INDEX.md`
- ⚠️ Sprint 3 暫時跳過說明請參考 `DEVELOPMENT-LOG.md` (2025-10-01 23:50)