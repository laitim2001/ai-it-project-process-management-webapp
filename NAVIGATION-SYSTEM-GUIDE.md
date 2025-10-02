# 📚 AI助手導航系統使用指南

> **快速開始**: 5分鐘了解如何使用完整的AI助手導航系統

---

## 🎯 系統概述

本專案已建立完整的AI助手導航系統，包含：
- **4層索引架構** - 從極簡到完整的漸進式導航
- **自動化檢查工具** - 確保索引與文件保持同步
- **Git Hooks集成** - 自動驗證索引更新
- **完整文檔記錄** - 開發和問題修復的完整追蹤

---

## 📂 系統架構

### 🏗️ 4層索引結構

```
L0: .ai-context                    ⚡ 極簡上下文載入 (30秒快速了解)
├── 專案身份、核心路徑、立即執行指令
│
L1: AI-ASSISTANT-GUIDE.md          📋 AI助手快速參考 (5分鐘掌握全局)
├── 立即執行區、工作流程、重要文件快速索引
│
L2: PROJECT-INDEX.md               🗂️ 完整專案索引 (詳細文件地圖)
├── 140+ 個文件的完整分類索引
│
L3: INDEX-MAINTENANCE-GUIDE.md     🔧 索引維護指南 (維護規範)
└── 維護時機、操作手冊、最佳實踐
```

### 📝 記錄系統

```
DEVELOPMENT-LOG.md                 📊 開發記錄 (倒序記錄)
├── 重要決策、功能開發、架構變更
│
FIXLOG.md                          🔧 問題修復記錄 (倒序記錄)
└── Bug修復、解決方案、預防措施
```

### 🛠️ 自動化工具

```
scripts/check-index-sync.js        🔍 索引同步檢查工具
├── 驗證索引準確性、檢測遺漏文件
│
.husky/pre-commit                  🎣 Git Hook
└── 自動檢查新增文件是否更新索引
```

---

## 🚀 快速開始

### 對於 AI 助手

#### 第一次進入專案
```bash
1. 讀取 .ai-context               # 30秒快速載入
2. 閱讀 AI-ASSISTANT-GUIDE.md     # 5分鐘了解結構
3. 制定 todos list                # 規劃工作
4. 開始開發                       # 參考 PROJECT-INDEX.md 查找文件
```

#### 日常開發流程
```bash
# 開發前
1. 檢查 AI-ASSISTANT-GUIDE.md 最上面的指引
2. 檢查 DEVELOPMENT-LOG.md 了解最新狀況
3. 制定或更新 todos list

# 開發中
- 每個檔案加入完整中文註釋
- 參考 PROJECT-INDEX.md 查找需要的文件

# 開發後（每個 todo 完成）
1. 更新 DEVELOPMENT-LOG.md（最新記錄放最上面）
2. 如有 bug fix，更新 FIXLOG.md
3. 執行索引維護（如有新增文件）
4. 與用戶確認
5. 同步到 GitHub
```

### 對於開發團隊

#### 新成員入職
```bash
# Step 1: 快速了解專案
cat .ai-context                     # 30秒了解核心信息

# Step 2: 深入理解
cat AI-ASSISTANT-GUIDE.md          # 5分鐘掌握全局

# Step 3: 文件導航
cat PROJECT-INDEX.md               # 完整文件地圖
```

#### 新增重要文件時
```bash
# Step 1: 創建文件
touch docs/new-feature.md

# Step 2: 更新索引
# 編輯 PROJECT-INDEX.md 或 AI-ASSISTANT-GUIDE.md
# 根據文件重要性選擇適當的索引

# Step 3: 驗證
npm run index:check                # 檢查索引同步狀態

# Step 4: 提交
git add .
git commit -m "feat: 新增功能文檔"
# Git hook 會自動檢查索引是否更新
```

#### 定期維護
```bash
# 每週檢查
npm run index:check                # 檢查索引同步

# 每月深度檢查
npm run index:health               # 完整健康檢查

# 查看建議
cat index-sync-report.json         # 查看詳細報告
```

---

## 🔧 工具使用

### 索引同步檢查工具

#### 基本檢查
```bash
npm run index:check
# 輸出：
# - 核心索引文件狀態
# - 路徑引用驗證
# - 遺漏文件建議
# - 詳細報告（index-sync-report.json）
```

#### 增量檢查（只檢查最近變更）
```bash
npm run index:check:incremental
# 只檢查自上次檢查後修改的文件
```

#### 自動修復（謹慎使用）
```bash
npm run index:fix
# 自動將建議的文件加入索引
# ⚠️ 建議先手動檢查再使用
```

#### 健康檢查
```bash
npm run index:health
# 完整的索引系統健康檢查
```

### Git Hook

#### Pre-commit Hook 運作方式
```bash
# 當執行 git commit 時：
1. 檢測新增的重要文件（.md, .ts, .tsx, .js, etc.）
2. 檢查 PROJECT-INDEX.md 或 AI-ASSISTANT-GUIDE.md 是否也被更新
3. 如果沒有更新索引，拒絕提交並提示

# 如何修復：
git add PROJECT-INDEX.md    # 更新索引
git commit                   # 重新提交
```

---

## 📊 文件分類標準

### 🔴 極高重要性
**標準**：理解項目核心業務和技術架構的關鍵文件
**索引位置**：AI-ASSISTANT-GUIDE.md + PROJECT-INDEX.md
**例子**：
- README.md
- docs/prd/index.md
- packages/db/prisma/schema.prisma
- apps/web/next.config.mjs

### 🟡 高重要性
**標準**：日常開發和功能實現經常需要參考
**索引位置**：PROJECT-INDEX.md
**例子**：
- API 路由文件
- UI 元件
- Next.js 頁面
- 配置文件

### 🟢 中重要性
**標準**：特定場景或深入配置時才需要
**索引位置**：PROJECT-INDEX.md
**例子**：
- 工具腳本
- 測試文件
- 開發配置

---

## 🎯 常見場景

### 場景 1: AI助手首次進入專案
```bash
✅ 正確流程：
1. 讀取 .ai-context
2. 閱讀 AI-ASSISTANT-GUIDE.md
3. 檢查 PROJECT-INDEX.md 中的文件位置
4. 制定 todos list
5. 開始開發

❌ 錯誤做法：
- 直接搜索文件而不查索引
- 忽略 AI-ASSISTANT-GUIDE.md 的指引
- 不制定 todos list
```

### 場景 2: 新增功能開發
```bash
✅ 正確流程：
1. 創建功能文件
2. 根據重要性更新對應索引
3. 運行 npm run index:check 驗證
4. 提交時 Git hook 自動檢查
5. 更新 DEVELOPMENT-LOG.md

❌ 錯誤做法：
- 創建文件後不更新索引
- 批次累積多個文件後才更新索引
- 忽略 Git hook 的提示
```

### 場景 3: Bug 修復
```bash
✅ 正確流程：
1. 在 FIXLOG.md 頂部創建新記錄
2. 詳細描述問題和根本原因
3. 記錄解決方案和預防措施
4. 修復代碼
5. 更新記錄狀態為已完成

❌ 錯誤做法：
- 修復後不記錄
- 只記錄表面問題不分析根本原因
- 不記錄預防措施
```

### 場景 4: 專案重構
```bash
✅ 正確流程：
1. 備份當前索引
2. 執行重構
3. 批次更新所有索引中的路徑
4. 運行 npm run index:check 驗證
5. 更新 DEVELOPMENT-LOG.md

❌ 錯誤做法：
- 重構後忘記更新索引
- 沒有驗證所有路徑引用
- 不記錄重構決策
```

---

## 📝 維護檢查清單

### 每日檢查（開發時）
- [ ] 新增文件是否更新索引
- [ ] 完成的 todo 是否更新 DEVELOPMENT-LOG.md
- [ ] Bug 修復是否記錄到 FIXLOG.md

### 每週檢查
- [ ] 運行 `npm run index:check` 檢查同步狀態
- [ ] 檢查索引文件的時間戳是否更新
- [ ] 清理過期的臨時文件

### 每月檢查
- [ ] 運行 `npm run index:health` 完整健康檢查
- [ ] 評估文件重要性是否需要調整
- [ ] 優化索引結構
- [ ] 檢查記錄文件是否需要歸檔

---

## 🚨 故障排除

### 問題 1: Git Hook 阻止提交
```bash
# 錯誤信息
❌ 錯誤：新增了重要文件但未更新索引！

# 解決方案
1. 檢查提示的文件列表
2. 更新 PROJECT-INDEX.md 或 AI-ASSISTANT-GUIDE.md
3. git add [索引文件]
4. 重新提交
```

### 問題 2: 索引檢查工具報告路徑失效
```bash
# 錯誤信息
索引文件中的路徑引用失效: docs/old-file.md

# 解決方案
1. 確認文件是否真的被刪除或移動
2. 從索引中移除該引用
3. 如果文件被移動，更新為新路徑
4. 重新運行檢查
```

### 問題 3: 新文件未被檢測到
```bash
# 可能原因
- 文件在排除目錄中（.bmad-core/, node_modules/ 等）
- 文件類型不在重要文件模式中
- Git 未追蹤該文件

# 解決方案
1. 確認文件位置是否正確
2. 檢查 scripts/check-index-sync.js 的文件模式
3. git add 該文件
4. 手動添加到索引
```

---

## 🎉 成功指標

### 索引系統健康指標
- ✅ **索引準確率** > 98%（索引中的引用都存在）
- ✅ **覆蓋率** > 95%（重要文件都在索引中）
- ✅ **同步延遲** < 1天（新文件24小時內加入索引）
- ✅ **記錄完整度** > 90%（重要變更都有記錄）

### 使用效率指標
- ✅ AI 助手文件查找時間 < 30秒
- ✅ 新成員入職理解時間 < 30分鐘
- ✅ 索引維護時間 < 5分鐘/週

---

## 🔗 相關資源

### 核心文檔
- [.ai-context](./.ai-context) - 極簡上下文
- [AI-ASSISTANT-GUIDE.md](./AI-ASSISTANT-GUIDE.md) - AI助手快速參考
- [PROJECT-INDEX.md](./PROJECT-INDEX.md) - 完整專案索引
- [INDEX-MAINTENANCE-GUIDE.md](./INDEX-MAINTENANCE-GUIDE.md) - 索引維護指南

### 記錄文檔
- [DEVELOPMENT-LOG.md](./DEVELOPMENT-LOG.md) - 開發記錄
- [FIXLOG.md](./FIXLOG.md) - 問題修復記錄

### 工具
- [scripts/check-index-sync.js](./scripts/check-index-sync.js) - 索引同步檢查工具
- [.husky/pre-commit](./.husky/pre-commit) - Git Hook

---

## 💡 最佳實踐總結

### ✅ DO（推薦做法）
1. **提交時同步更新索引** - 養成習慣，避免遺漏
2. **使用分層索引系統** - 按層級查找，提升效率
3. **定期運行檢查工具** - 每週至少一次
4. **詳細記錄開發過程** - 方便追溯和分享
5. **信任並維護索引** - 索引是最可靠的導航

### ❌ DON'T（避免做法）
1. **跳過索引直接搜索** - 浪費時間且可能找錯
2. **批次累積後才更新** - 容易遺漏和錯誤
3. **忽略 Git Hook 提示** - 失去自動保護
4. **不記錄重要決策** - 重複踩坑
5. **過度或不足索引** - 保持適度平衡

---

**🎯 記住：良好的導航系統是團隊效率的倍增器！**

**最後更新**: 2025-10-02 23:30
