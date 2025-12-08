# 📋 索引維護指南

> **目的**: 確保項目索引文件在開發過程中保持同步更新
> **重要性**: 防止 AI 助手因過期索引而找不到正確文件

---

## 🎯 索引維護策略

### 📅 維護時機

#### 🔴 必須更新 (立即執行)
- 新增重要項目文檔 (*.md)
- 新增主要代碼模組 (src/, lib/, components/)
- **新增Next.js頁面文件** (app/**/page.tsx, layout.tsx, route.ts)
- **新增 Azure 部署文件** (azure/, claudedocs/AZURE-*.md, docker/Dockerfile)
- **新增 AI 助手場景化指引** (claudedocs/6-ai-assistant/prompts/SITUATION-*.md)
- **新增目錄級 CLAUDE.md** (為新目錄提供 AI 助手上下文)
- 重構項目結構
- 新增 API 端點或資料庫表
- 新增自動化腳本 (azure/scripts/*.sh, scripts/*.js)

#### 🟡 建議更新 (Sprint 結束時)
- 新增配置文件
- 新增測試文件
- 新增工具腳本
- 更新依賴或環境配置

#### 🟢 定期檢查 (每月一次)
- 清理過期引用
- 優化索引結構
- 更新文件重要性評級

---

## 🔄 維護工作流程

### 1. 開發過程中的即時維護

#### 當新增重要文件時
```bash
# 1. 新增文件到項目
# 2. 立即更新相關索引
# 3. 提交時包含索引更新

git add new-important-file.md
# 同時更新索引
nano PROJECT-INDEX.md  # 或 AI-ASSISTANT-GUIDE.md
git add PROJECT-INDEX.md
git commit -m "feat: 新增功能文檔並更新索引"
```

#### 當重構目錄結構時
```bash
# 1. 執行重構
# 2. 同步更新所有索引文件
# 3. 檢查路徑引用

# 更新順序:
# - .ai-context (簡要路徑)
# - AI-ASSISTANT-GUIDE.md (重要文件路徑)
# - PROJECT-INDEX.md (完整路徑表)
```

### 2. Sprint 結束時的批次維護

#### 檢查清單
- [ ] 新增的文件都已加入適當索引
- [ ] 移除或重命名的文件已從索引中移除
- [ ] 路徑引用都是正確的
- [ ] 重要性標記符合現狀
- [ ] 快速指南仍然準確

### 3. 定期深度維護

#### 月度檢查清單
- [ ] 執行索引同步檢查工具
- [ ] 評估文件重要性變化
- [ ] 優化索引結構
- [ ] 更新 AI 助手使用指南

---

## 🚀 Azure 部署文件維護專項

### 🎯 目的
Azure 部署架構重組完成後(2025-11-24),新增了 43+ 個部署相關文件,需要建立專門的維護策略確保這些文件的組織性和可追溯性。

### 📁 Azure 文件結構

#### 1. 執行層 (`azure/` 目錄)
**優先級**: ⭐⭐⭐⭐⭐ 最高 - 部署時必須查閱

| 目錄/文件 | 用途 | 維護時機 |
|---------|------|----------|
| `azure/README.md` | 部署主入口文檔 | 架構變更時 |
| `azure/scripts/01-06.sh` | 6 個自動化部署腳本 | 資源配置變更時 |
| `azure/scripts/deploy-to-personal.sh` | 個人環境部署入口 | 環境流程變更時 |
| `azure/scripts/deploy-to-company.sh` | 公司環境部署入口 | 環境流程變更時 |
| `azure/scripts/helper/` | 5 個輔助工具腳本 | 工具邏輯變更時 |
| `azure/environments/personal/` | 個人環境配置範本 | 變數新增/修改時 |
| `azure/environments/company/` | 公司環境配置範本 | 變數新增/修改時 |
| `azure/templates/` | 3 個 Bicep IaC 模板 | 基礎設施變更時 |
| `azure/tests/` | 3 個測試腳本 | 驗證邏輯變更時 |

#### 2. 文檔層 (`docs/deployment/` 目錄)
**優先級**: ⭐⭐⭐⭐ 高 - 了解流程時必須閱讀

| 文件 | 用途 | 維護時機 |
|------|------|----------|
| `AZURE-DEPLOYMENT-GUIDE.md` | 完整部署指南 | 流程變更時 |
| `00-prerequisites.md` | 前置需求 | 依賴變更時 |
| `01-first-time-setup.md` | 首次部署指南 | 初始化流程變更時 |
| `02-ci-cd-setup.md` | CI/CD 配置 | Pipeline 變更時 |
| `03-troubleshooting.md` | 故障排查 | 新問題發現時 |
| `04-rollback.md` | 回滾程序 | 回滾策略變更時 |

#### 3. 記錄層 (`claudedocs/` Azure 文檔)
**優先級**: ⭐⭐⭐ 中 - 參考價值,了解歷史和問題分析

| 文件 | 用途 | 維護時機 |
|------|------|----------|
| `AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` | 文件結構指引 | 目錄結構變更時 |
| `AZURE-DEPLOYMENT-CHECKLIST.md` | 部署檢查清單 | 檢查項目變更時 |
| `AZURE-*-DEPLOYMENT.md` | 部署記錄文檔 | 部署完成後記錄 |
| `COMPLETE-DEPLOYMENT-DIAGNOSIS-AND-FIX.md` | 診斷和修復記錄 | 問題解決後記錄 |

#### 4. AI 助手指引 (`claudedocs/6-ai-assistant/prompts/`)
**優先級**: ⭐⭐⭐⭐ 高 - AI 助手部署和排查必讀

| 文件 | 用途 | 維護時機 |
|------|------|----------|
| `SITUATION-6-AZURE-DEPLOY-PERSONAL.md` | 個人環境部署指引 | 流程/工具變更時 |
| `SITUATION-7-AZURE-DEPLOY-COMPANY.md` | 公司環境部署指引 | 流程/安全策略變更時 |
| `SITUATION-8-AZURE-TROUBLESHOOT-PERSONAL.md` | 個人環境排查指引 | 新問題模式發現時 |
| `SITUATION-9-AZURE-TROUBLESHOOT-COMPANY.md` | 公司環境排查指引 | 新問題模式發現時 |

### 🔄 Azure 文件維護流程

#### 觸發維護的場景
1. **Azure 資源配置變更** (Resource Group, App Service, Database, etc.)
   - 必須更新: `azure/scripts/01-06.sh`, `azure/environments/*.env.example`
   - 建議更新: `docs/deployment/`, AI 助手指引

2. **Docker 建置流程變更** (Dockerfile, 建置參數, 依賴版本)
   - 必須更新: `docker/Dockerfile`
   - 建議更新: `docs/deployment/01-first-time-setup.md`, 部署記錄文檔

3. **環境變數新增或修改** (DATABASE_URL, NEXTAUTH_SECRET, 新服務 API key)
   - 必須更新: `azure/environments/*.env.example`, `docs/deployment/environment-variables-map.md`
   - 建議更新: AI 助手指引 (SITUATION-6, SITUATION-7)

4. **新問題發現和解決** (Prisma Client, 數據庫連線, I18N 等)
   - 必須更新: `docs/deployment/03-troubleshooting.md`
   - 記錄到: `claudedocs/AZURE-*-DEPLOYMENT.md` (新建或更新)
   - 建議更新: AI 助手故障排查指引 (SITUATION-8, SITUATION-9)

5. **CI/CD Pipeline 變更** (.github/workflows/, Azure DevOps Pipelines)
   - 必須更新: `docs/deployment/02-ci-cd-setup.md`
   - 建議更新: `.github/workflows/azure-deploy-example.yml`

#### Azure 文件同步檢查清單
- [ ] `azure/` 腳本是否反映最新配置?
- [ ] `docs/deployment/` 文檔是否與實際流程同步?
- [ ] `claudedocs/6-ai-assistant/prompts/` 指引是否包含最新排查方法?
- [ ] 環境變數範本 (*.env.example) 是否完整?
- [ ] `AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` 是否更新目錄結構?
- [ ] `PROJECT-INDEX.md` 和 `AI-ASSISTANT-GUIDE.md` 是否索引所有 Azure 文件?

### 💡 Azure 文件維護最佳實踐

#### ✅ DO (推薦做法)
1. **部署前更新文檔** - 確保文檔與即將部署的配置同步
2. **部署後記錄問題** - 立即記錄遇到的問題和解決方案到 `claudedocs/`
3. **定期審查 AI 指引** - 每月檢查 SITUATION-6 到 SITUATION-9 是否需要更新
4. **保持環境變數範本完整** - 新增環境變數時同步更新所有 .env.example
5. **版本標記** - 重大變更時在文檔中標註日期和版本號

#### ❌ DON'T (避免做法)
1. **直接修改執行層腳本而不更新文檔** - 導致文檔與實際不符
2. **忘記更新 AI 助手指引** - AI 助手會根據過時信息給出錯誤建議
3. **刪除歷史部署記錄** - 應移至 `claudedocs/archive/azure-deployments/` 保留
4. **混淆不同環境的配置** - 個人/公司環境配置要分開維護
5. **忽略索引更新** - Azure 文件變更後必須更新 PROJECT-INDEX.md

---

## 📂 檔案歸檔策略

### 🎯 歸檔目的
- 保持根目錄和核心文檔目錄的清潔
- 避免索引文件過於龐大
- 保留歷史記錄的可追溯性
- 優化 AI 助手的上下文載入效率

### 📋 歸檔分類

#### 1. 開發記錄歸檔（archive/development-logs/）
**觸發條件**：
- 季度結束（每年 1/4/7/10 月 1 日）
- DEVELOPMENT-LOG.md 超過 5,000 行

**歸檔流程**：
```bash
# 1. 創建季度歸檔文件
archive/development-logs/DEVELOPMENT-LOG-2025-Q3.md

# 2. 移動當季記錄到歸檔文件

# 3. 在當前 DEVELOPMENT-LOG.md 頂部添加歷史摘要索引
## 📚 歷史記錄索引
- 2025-Q3: Epic 6-8 完成，設計系統遷移 → [查看詳情](../archive/development-logs/DEVELOPMENT-LOG-2025-Q3.md)
- 2025-Q2: Epic 3-5 完成，採購與費用系統 → [查看詳情](../archive/development-logs/DEVELOPMENT-LOG-2025-Q2.md)

# 4. 保留當前季度記錄
```

**優化效果**：
- Token 使用減少 80-85%（從 ~40,000 tokens 降至 ~6,000 tokens）
- AI 助手載入速度提升 5-10 倍
- 保留完整歷史可追溯性

#### 2. 問題修復記錄歸檔（archive/fix-logs/）
**觸發條件**：
- 季度結束
- FIXLOG.md 超過 2,000 行

**歸檔流程**：與 DEVELOPMENT-LOG.md 相同

#### 3. 臨時文檔歸檔（claudedocs/archive/）
**觸發條件**：
- Epic/階段完成且不再需要頻繁查閱
- 文檔對應的功能已上線穩定運行 > 1 個月

**歸檔範圍**：
- 階段性實施計劃（PHASE-*.md）
- 已完成的 Epic 規劃文件
- 過時的分析報告

**歸檔流程**：
```bash
# 移動到 claudedocs/archive/[category]/
claudedocs/archive/design-system-migration/
  ├── PHASE-1-DETAILED-TASKS.md
  ├── PHASE-2-DETAILED-TASKS.md
  ├── PHASE-3-DETAILED-TASKS.md
  └── PHASE-4-DETAILED-TASKS.md
```

### 🔄 歸檔工作流程

#### 季度歸檔標準流程（每季度末）

**準備階段**：
1. ✅ 確認當前季度結束日期
2. ✅ 檢查 DEVELOPMENT-LOG.md 和 FIXLOG.md 行數
3. ✅ 評估 claudedocs/ 中可歸檔的文件

**執行階段**：
1. ✅ 創建 `archive/development-logs/DEVELOPMENT-LOG-[YYYY-QX].md`
2. ✅ 將當季記錄移動到歸檔文件
3. ✅ 為當季記錄創建 3 行摘要（主要成就、Epic 完成、重要決策）
4. ✅ 更新當前 DEVELOPMENT-LOG.md 頂部歷史索引
5. ✅ 對 FIXLOG.md 重複相同流程
6. ✅ 評估並歸檔 claudedocs/ 中的完成文件

**驗證階段**：
1. ✅ 檢查歷史摘要索引是否正確
2. ✅ 驗證歸檔文件路徑可訪問
3. ✅ 確認當前記錄文件大小已顯著減少
4. ✅ 更新 PROJECT-INDEX.md 引用

### 📊 歸檔效果監控

**關鍵指標**：
- ✅ DEVELOPMENT-LOG.md 行數 < 2,000 行（目標）
- ✅ FIXLOG.md 行數 < 1,000 行（目標）
- ✅ AI 助手載入時間 < 5 秒（從 15-30 秒降至 3-5 秒）
- ✅ 歷史記錄可追溯性 = 100%

**監控方法**：
```bash
# 檢查記錄文件行數
wc -l DEVELOPMENT-LOG.md FIXLOG.md

# 檢查歸檔文件數量
ls -la archive/development-logs/
ls -la archive/fix-logs/
```

### 📝 歸檔檢查清單

#### 季度歸檔檢查清單
- [ ] 創建 archive/development-logs/ 和 archive/fix-logs/ 目錄（如不存在）
- [ ] 移動當季 DEVELOPMENT-LOG.md 記錄到歸檔文件
- [ ] 移動當季 FIXLOG.md 記錄到歸檔文件
- [ ] 為每個季度創建 3 行摘要
- [ ] 更新當前記錄文件頂部歷史索引
- [ ] 評估 claudedocs/ 中可歸檔文件
- [ ] 移動已完成階段文件到 claudedocs/archive/
- [ ] 更新 PROJECT-INDEX.md 引用路徑
- [ ] 執行 `pnpm index:check` 驗證索引同步
- [ ] 更新 DEVELOPMENT-LOG.md 記錄歸檔操作

### 💡 歸檔最佳實踐

#### ✅ DO（推薦做法）
1. **定期歸檔** - 每季度末執行，不要拖延
2. **保留摘要** - 每個歸檔季度至少 3 行摘要
3. **完整引用** - 確保歷史記錄可通過索引訪問
4. **驗證路徑** - 歸檔後檢查所有引用路徑
5. **記錄操作** - 歸檔操作本身也要記錄到 DEVELOPMENT-LOG.md

#### ❌ DON'T（避免做法）
1. **過早歸檔** - 當前季度記錄不要提前歸檔
2. **直接刪除** - 永遠不要刪除歷史記錄，只歸檔
3. **忽略摘要** - 不創建摘要會降低可追溯性
4. **忘記索引** - 歸檔後必須更新 PROJECT-INDEX.md
5. **批量操作** - 避免一次歸檔多個季度，分步執行

---

## 🏗️ 多層級索引架構設計

### 當前四層架構

```
📁 索引層級結構
├── .ai-context                    # L0: 極簡載入 (核心信息)
├── AI-ASSISTANT-GUIDE.md          # L1: 快速導航 (常用文件)
├── PROJECT-INDEX.md               # L2: 完整索引 (全部文件)
└── INDEX-MAINTENANCE-GUIDE.md     # L3: 維護指南 (索引管理)
```

### 📊 索引分層原則

| 層級 | 文件 | 目標受眾 | 更新頻率 | 內容範圍 |
|------|------|----------|----------|----------|
| **L0** | `.ai-context` | AI 助手快速載入 | 低 | 核心信息 |
| **L1** | `AI-ASSISTANT-GUIDE.md` | AI 助手日常使用 | 中 | 常用文件 |
| **L2** | `PROJECT-INDEX.md` | AI 助手完整導航 | 高 | 全部文件 |
| **L3** | `INDEX-MAINTENANCE-GUIDE.md` | 索引維護指南 | 低 | 維護策略 |

---

## 🛠️ 自動化維護工具

### 1. 索引同步檢查腳本

```bash
# 運行索引同步檢查
npm run index:check

# 或手動執行
node scripts/check-index-sync.js
```

### 2. Git Hook 自動化

#### Pre-commit Hook
```bash
#!/bin/sh
# .git/hooks/pre-commit

# 檢查是否有重要文件變更但索引未更新
echo "🔍 檢查索引同步狀態..."

# 檢查是否有新增 .md 文件但索引未更新
NEW_MD_FILES=$(git diff --cached --name-only --diff-filter=A | grep '\.md$')
if [ ! -z "$NEW_MD_FILES" ]; then
    echo "⚠️ 檢測到新增 .md 文件，請確認索引已更新："
    echo "$NEW_MD_FILES"

    # 檢查 PROJECT-INDEX.md 是否也在此次提交中
    INDEX_UPDATED=$(git diff --cached --name-only | grep 'PROJECT-INDEX.md\|AI-ASSISTANT-GUIDE.md')
    if [ -z "$INDEX_UPDATED" ]; then
        echo "❌ 請更新相關索引文件後再提交"
        exit 1
    fi
fi

echo "✅ 索引同步檢查通過"
```

### 3. CI/CD 管道檢查

```yaml
# .github/workflows/index-sync-check.yml
name: Index Sync Check

on: [push, pull_request]

jobs:
  check-index-sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check Index Synchronization
        run: |
          echo "🔍 檢查索引文件同步狀態"
          node scripts/check-index-sync.js
```

---

## 📝 維護操作手冊

### 新增重要文件時

#### 步驟 1: 識別文件重要性
```
🔴 極高重要性：核心業務文檔、主要配置
🟡 高重要性：功能模組、API 文檔、測試
🟢 中重要性：工具腳本、輔助文檔
⚪ 低重要性：臨時文件、日誌
```

#### 步驟 2: 更新對應索引
```
極高重要性 → 更新 AI-ASSISTANT-GUIDE.md + PROJECT-INDEX.md
高重要性   → 更新 PROJECT-INDEX.md
中重要性   → 更新 PROJECT-INDEX.md
低重要性   → 不納入索引
```

#### 步驟 3: 驗證更新
```bash
# 檢查路徑是否正確
ls -la path/to/new/file

# 檢查索引引用是否正確
grep -r "new-file-name" *.md
```

### 重構目錄結構時

#### 準備階段
1. 備份當前索引文件
2. 記錄將要變更的路徑
3. 準備批次替換腳本

#### 執行階段
1. 執行目錄重構
2. 批次更新索引文件中的路徑
3. 驗證所有引用都已更新

#### 驗證階段
```bash
# 檢查是否有斷掉的引用
node scripts/check-index-sync.js

# 手動驗證關鍵路徑
ls -la $(grep -o '`[^`]*`' AI-ASSISTANT-GUIDE.md | tr -d '`')
```

---

## 🎯 索引更新示例

### 示例 1: 新增頁面文件

假設新增了 `apps/web/src/app/projects/page.tsx`

#### 更新 PROJECT-INDEX.md
```markdown
#### App Router 頁面

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Projects 列表** | `apps/web/src/app/projects/page.tsx` | 專案列表頁面 | 🔴 極高 |
```

#### 更新 AI-ASSISTANT-GUIDE.md
```markdown
### 🟡 重要 (常用)
```
apps/web/src/app/projects/page.tsx       # 專案列表頁面
```
```

### 示例 2: 新增 API 路由

假設新增了 `packages/api/src/routers/project.ts`

#### 更新 PROJECT-INDEX.md
```markdown
### API 層 (packages/api)

| 文件名稱 | 路徑 | 說明 | 重要性 |
|---------|------|------|--------|
| **Project 路由** | `packages/api/src/routers/project.ts` | 專案 API 路由 | 🔴 極高 |
```

### 示例 3: 移除過期文件

假設移除了 `docs/old-design.md`

#### 從 PROJECT-INDEX.md 中移除
```diff
- | **舊設計文檔** | `docs/old-design.md` | 已過期的設計文檔 | 🟢 中 |
```

---

## 📊 維護效果監控

### 關鍵指標

1. **索引準確率**: 索引中引用的文件實際存在比例
2. **覆蓋率**: 重要文件被索引覆蓋的比例
3. **使用效率**: AI 助手通過索引找到正確文件的比例
4. **維護成本**: 索引維護所需的時間和工作量

### 監控方法

```bash
# 定期運行檢查報告
npm run index:health

# 輸出示例:
# ✅ 索引準確率: 98% (2/100 引用失效)
# ✅ 覆蓋率: 95% (190/200 重要文件已索引)
# ⚠️ 建議: 3 個新文件待加入索引
```

---

## 🎉 最佳實踐總結

### ✅ 推薦做法

1. **提交時同步**: 每次提交重要文件時同時更新索引
2. **分層維護**: 根據文件重要性選擇適當的索引層級
3. **自動化檢查**: 設置 Git Hook 和 CI/CD 檢查
4. **定期清理**: 月度檢查過期引用和重要性變化
5. **文檔先行**: 先更新索引再開發新功能

### ❌ 避免做法

1. **批次延遲更新**: 累積大量變更後才更新索引
2. **忽略小文件**: 認為小文件不重要而不納入索引
3. **路徑硬編碼**: 在索引中使用絕對路徑或環境特定路徑
4. **重複索引**: 在多個索引文件中重複相同信息
5. **過度索引**: 將所有文件都納入索引導致信息過載

---

## 🔧 常見問題與解決方案

### Q1: 如何判斷文件是否應該加入索引？

**A**: 使用重要性評估標準：
- 🔴 **極高**: 核心業務邏輯、主要配置、日常必用
- 🟡 **高**: 功能實現參考、開發流程、測試部署
- 🟢 **中**: 特定場景、深入配置、環境工具
- ⚪ **低**: 臨時文件、日誌、不納入索引

### Q2: 索引文件本身也需要維護嗎？

**A**: 是的，索引文件的元信息需要定期更新：
- 更新「最後更新」時間戳
- 更新文件統計數字
- 檢查索引結構是否需要優化

### Q3: 如何處理重構後的路徑更新？

**A**: 使用以下步驟：
1. 記錄舊路徑和新路徑的映射關係
2. 使用查找替換工具批次更新所有索引
3. 運行 `npm run index:check` 驗證
4. 手動檢查關鍵路徑

### Q4: 多人協作時如何避免索引衝突？

**A**: 最佳實踐：
1. 在 PR 中包含索引更新
2. 在 merge 前運行索引檢查
3. 使用 Git Hook 防止遺漏
4. 指定專人定期審核索引

### Q5: 索引文件過大怎麼辦？

**A**: 考慮建立分層索引：
- 保持核心索引簡潔
- 建立領域專門索引（API、UI、測試等）
- 使用工具自動生成子索引

---

**🎯 記住：索引系統的價值在於幫助 AI 助手快速找到正確文件。保持索引的準確性和時效性比完整性更重要！**

---

**最後更新**: 2025-12-08
