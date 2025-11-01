# 📚 Claude 輔助文檔索引 (Claude Docs)

> **目的**: AI 助手生成的分析、規劃和實施文檔，用於輔助開發過程
> **特性**: 臨時性、分析性、階段性文檔
> **與 docs/ 的區別**: docs/ 是正式團隊文檔，claudedocs/ 是 AI 生成的工作文檔
> **最後更新**: 2025-11-01 (重組完成 - 新增 bug-fixes/, e2e-testing/, progress/, handoff/ 子目錄)

---

## 📋 目錄結構說明

```
claudedocs/
├── bug-fixes/         # Bug 修復文檔（11 個文件）
├── e2e-testing/       # E2E 測試文檔（12 個文件）
├── planning/          # 規劃文件（9 個文件）
├── progress/          # 進度追蹤（2 個文件）
├── analysis/          # 分析報告（2 個文件）
├── handoff/           # 交接文檔（1 個文件）
├── design-system/     # 設計系統相關（4 個文件）
├── implementation/    # 實施記錄（7 個文件）
└── archive/           # 已完成的階段性文件（待歸檔）
```

---

## 🐛 Bug 修復文檔 (bug-fixes/)

### 總覽
- **文件數**: 11 個
- **類型**: Bug 修復總結、Toast 遷移指南、問題分析報告
- **狀態**: 3 輪 Bug 修復完成（FIX-001 至 FIX-058B）

### 主要文件
- **BUG-FIX-SUMMARY.md**: 第一輪 Bug 修復總結（9 個問題）
- **BUG-FIX-ROUND-2-SUMMARY.md**: 第二輪 Bug 修復總結（4 個問題）
- **BUG-FIX-ROUND-3-SUMMARY.md**: 第三輪 Bug 修復總結（5 個問題，含子組件檢查）
- **BUG-FIX-PROGRESS-REPORT.md**: 整體 Bug 修復進度報告
- **TOAST-MIGRATION-GUIDE.md**: Toast 通知系統遷移指南
- **FIX-009-*.md** (4 個文件): NextAuth v5 升級相關修復記錄
- **FIX-PURCHASE-ORDER-FORM-2025-10-27.md**: 採購單表單修復記錄
- **ISSUE-ExpensesPage-HotReload.md**: 費用頁面熱重載問題分析

---

## 🧪 E2E 測試文檔 (e2e-testing/)

### 總覽
- **文件數**: 12 個
- **類型**: E2E 測試計劃、進度追蹤、會話總結、問題分析
- **狀態**: Stage 1-4 測試完成，工作流測試進行中

### 主要文件
- **E2E-TESTING-SETUP-GUIDE.md**: E2E 測試環境設置指南
- **E2E-TESTING-ENHANCEMENT-PLAN.md**: E2E 測試增強計劃（4 階段實施策略）
- **E2E-TESTING-FINAL-REPORT.md**: 基本功能測試最終報告（7/7 測試通過）
- **E2E-TEST-FAILURE-ANALYSIS.md**: E2E 測試失敗分析報告
- **E2E-WORKFLOW-TESTING-PROGRESS.md**: 工作流測試詳細進度追蹤（Stage 1-4）
- **E2E-WORKFLOW-TESTING-PROGRESS-UPDATE.md**: 工作流測試進度更新
- **E2E-WORKFLOW-SESSION-SUMMARY.md**: 測試配置會話完整總結（645 行）
- **E2E-WORKFLOW-SESSION-SUMMARY-2025-11-01.md**: 最新會話總結
- **E2E-BUDGET-PROPOSAL-WORKFLOW-SUCCESS.md**: 預算提案工作流成功報告
- **E2E-PROCUREMENT-WORKFLOW-SESSION-PROGRESS.md**: 採購工作流會話進度
- **E2E-LOGIN-FIX-SUCCESS-SUMMARY.md**: FIX-010 登入流程修復成功總結
- **E2E-LOGIN-ISSUE-ANALYSIS.md**: 登入認證問題深度分析

---

## 📊 進度追蹤 (progress/)

### COMPLETE-IMPLEMENTATION-PROGRESS.md
- **目的**: COMPLETE-IMPLEMENTATION-PLAN.md 實施進度追蹤
- **創建時間**: 2025-10-26
- **內容**: Post-MVP 階段完整實施進度（當前：22%）
- **狀態**: 🔄 持續更新

### TASK-COMPLETION-REPORT-2025-10-27.md
- **目的**: 2025-10-27 任務完成報告
- **創建時間**: 2025-10-27
- **內容**: 單日任務完成情況總結
- **狀態**: ✅ 報告完成

---

## 📝 交接文檔 (handoff/)

### PHASE-A-HANDOFF.md
- **目的**: Phase A 階段交接文檔
- **創建時間**: 2025-10-15
- **內容**: MVP 完成後的項目交接說明、技術債務、後續建議
- **狀態**: 📋 參考文件

---

## 🔍 分析報告 (analysis/)

### CLAUDE-MD-ANALYSIS-REPORT.md
- **目的**: CLAUDE.md 文件的完整分析報告
- **創建時間**: 2025-10-25
- **內容**: 識別 CLAUDE.md 與實際專案狀態的 8 大類差異
- **狀態**: ✅ 分析完成，CLAUDE.md 已同步更新

### MD-FILES-ORGANIZATION-REPORT.md
- **目的**: 專案 MD 文件組織分析報告
- **創建時間**: 2025-10-22
- **內容**: 文件分布統計、分類建議、索引系統優化建議
- **狀態**: ✅ 分析完成，已實施重組方案

---

## 📋 規劃文件 (planning/)

### 總覽
- **文件數**: 9 個
- **類型**: Epic 實施計劃、MVP 開發計劃、完整實施計劃、工作流程規範
- **狀態**: 部分已完成，部分持續參考

### 主要文件

#### MVP 階段規劃
- **mvp-development-plan.md**: MVP 完整開發路線圖和 Sprint 規劃
- **mvp-implementation-checklist.md**: MVP 詳細實施檢查清單和進度追蹤

#### Post-MVP 階段規劃
- **COMPLETE-IMPLEMENTATION-PLAN.md**: Post-MVP 階段完整實施計劃（用戶需求澄清版）
- **STAGE-3-4-IMPLEMENTATION-PLAN.md**: Stage 3-4 實施計劃

#### Epic 實施計劃
- **EPIC-5-MISSING-FEATURES.md**: Epic 5 採購與供應商管理 - 缺失功能清單（✅ 已完成 100%）
- **EPIC-6-TESTING-CHECKLIST.md**: Epic 6 費用記錄與審批 - 測試檢查清單（✅ 已完成 100%）
- **EPIC-7-IMPLEMENTATION-PLAN.md**: Epic 7 儀表板與基礎報表 - 實施計劃（✅ 已完成 100%）

#### 流程規範
- **POC-VALIDATION-EXECUTION-PLAN.md**: POC 驗證執行計劃（📋 參考文件）
- **GIT-WORKFLOW-AND-BRANCHING-STRATEGY.md**: Git 工作流程和分支策略（📋 參考文件）

---

## 🎨 設計系統相關 (design-system/)

### DESIGN-SYSTEM-MIGRATION-PLAN.md
- **目的**: shadcn/ui 設計系統遷移計劃
- **創建時間**: 2025-10-15
- **內容**: 遷移策略、4 階段實施計劃、組件清單
- **狀態**: ✅ 遷移已完成（Phase 1-4）

### DESIGN-SYSTEM-MIGRATION-PROGRESS.md
- **目的**: 設計系統遷移進度追蹤
- **創建時間**: 2025-10-16（持續更新）
- **內容**: 4 個階段的詳細進度記錄、已完成組件清單
- **狀態**: ✅ Phase 1-4 全部完成（26 個組件）

### DESIGN-SYSTEM-REFINEMENTS.md
- **目的**: 設計系統細化改進建議
- **創建時間**: 2025-10-16
- **內容**: UI/UX 優化建議、無障礙性改進、主題系統增強
- **狀態**: ✅ 已實施（Phase 4）

### MIGRATION-CHECKLIST-AND-ACCEPTANCE-CRITERIA.md
- **目的**: 遷移檢查清單和驗收標準
- **創建時間**: 2025-10-15
- **內容**: 完整的驗收標準、測試檢查清單、品質門檻
- **狀態**: ✅ 遷移驗收通過

---

## 🚀 實施記錄 (implementation/)

### PHASE-1-DETAILED-TASKS.md
- **階段**: Phase 1 - 核心組件遷移
- **創建時間**: 2025-10-15
- **內容**: 13 個核心組件的詳細實施任務
- **狀態**: ✅ Phase 1 完成（Button, Input, Card 等）

### PHASE-2-DETAILED-TASKS.md
- **階段**: Phase 2 - 表單與數據組件
- **創建時間**: 2025-10-15
- **內容**: 表單相關組件的實施任務
- **狀態**: ✅ Phase 2 完成（Form, Select, Checkbox 等）

### PHASE-3-DETAILED-TASKS.md
- **階段**: Phase 3 - 反饋與導航組件
- **創建時間**: 2025-10-15
- **內容**: 反饋和導航組件的實施任務
- **狀態**: ✅ Phase 3 完成（Toast, Alert, Dialog 等）

### PHASE-4-DETAILED-TASKS.md
- **階段**: Phase 4 - 進階功能整合
- **創建時間**: 2025-10-15
- **內容**: 主題系統、無障礙性、最終驗證
- **狀態**: ✅ Phase 4 完成（Light/Dark/System 主題）

### PHASE-4-ACCESSIBILITY-ENHANCEMENTS.md
- **階段**: Phase 4 - 無障礙性增強
- **創建時間**: 2025-10-16
- **內容**: WCAG 2.1 AA 合規性改進、鍵盤導航、螢幕閱讀器支援
- **狀態**: ✅ 無障礙性改進完成

### USER-FEEDBACK-ENHANCEMENTS-2025-10-16-PHASE-2.md
- **類型**: 用戶反饋增強
- **創建時間**: 2025-10-16
- **內容**: Phase 2 用戶反饋實施記錄（List 視圖優化、新增頁面）
- **狀態**: ✅ Phase 2 完成（Quotes, Settings, Register, Forgot Password）

### USER-FEEDBACK-FIXES-2025-10-16.md
- **類型**: 用戶反饋問題修復
- **創建時間**: 2025-10-16
- **內容**: FIX-003, FIX-004, FIX-005 修復記錄
- **狀態**: ✅ 所有問題已解決

---

## 📂 歸檔策略 (archive/)

### 歸檔原則
- **觸發條件**: 文檔對應的階段/Epic/任務已完成且不再需要頻繁查閱
- **歸檔時機**: 每季度末或重大階段完成後
- **保留原則**: 保留索引引用，便於未來查閱

### 待歸檔文件（建議）
當前所有實施記錄（implementation/ 下的 PHASE-*.md）都可考慮歸檔，因為：
- ✅ 設計系統遷移已 100% 完成
- ✅ 所有 Phase 1-4 任務已完成
- ✅ Post-MVP 增強階段已結束

**建議操作**: 在 Epic 9-10 開始前，將 Phase 1-4 文件移至 archive/design-system-migration/

---

## 🔗 與 docs/ 的區別

| 特性 | claudedocs/ | docs/ |
|------|-------------|-------|
| **性質** | AI 生成的工作文檔 | 正式團隊文檔 |
| **目的** | 輔助開發過程、分析問題、規劃任務 | 長期保存、團隊協作、正式文檔 |
| **生命週期** | 臨時性、階段性 | 永久性、持續維護 |
| **受眾** | AI 助手、開發者（短期參考） | 全體團隊、新成員、外部協作者 |
| **維護頻率** | 任務完成後可歸檔 | 持續更新 |
| **示例** | Phase 實施計劃、分析報告 | PRD、技術架構、API 文檔 |

---

## 📊 統計數據

- **總文件數**: 48 個
- **Bug 修復文檔**: 11 個
- **E2E 測試文檔**: 12 個
- **規劃文件**: 9 個
- **進度追蹤**: 2 個
- **分析報告**: 2 個
- **交接文檔**: 1 個
- **設計系統**: 4 個
- **實施記錄**: 7 個
- **總大小**: ~1.2MB

---

## 🔄 維護建議

### 日常維護
1. ✅ 新增 AI 生成文檔時，根據內容分類放入對應目錄
2. ✅ 階段完成後及時更新狀態標記
3. ✅ 定期檢查是否有文件可以歸檔

### 季度維護
1. 📋 每季度末檢查已完成文檔
2. 📋 將不再需要的文檔移至 archive/
3. 📋 更新本 README.md 索引

### 歸檔檢查清單
- [ ] 文檔對應的任務/Epic 已 100% 完成
- [ ] 文檔內容不再需要頻繁查閱
- [ ] 已在 PROJECT-INDEX.md 中更新引用路徑
- [ ] 移動到 archive/[category]/ 對應子目錄

---

## 🎯 快速導航

### 需要了解 Bug 修復歷史？
→ 查看 `bug-fixes/BUG-FIX-*.md` 和 `bug-fixes/FIX-*.md`

### 需要了解 E2E 測試進度？
→ 查看 `e2e-testing/E2E-WORKFLOW-TESTING-PROGRESS.md`

### 需要查閱實施計劃？
→ 查看 `planning/COMPLETE-IMPLEMENTATION-PLAN.md` 或 `planning/mvp-development-plan.md`

### 需要追蹤實施進度？
→ 查看 `progress/COMPLETE-IMPLEMENTATION-PROGRESS.md`

### 需要了解專案狀態？
→ 查看 `analysis/CLAUDE-MD-ANALYSIS-REPORT.md`

### 需要查閱 Epic 實施計劃？
→ 查看 `planning/EPIC-*.md`

### 需要了解設計系統遷移過程？
→ 查看 `design-system/DESIGN-SYSTEM-MIGRATION-*.md`

### 需要查看實施細節？
→ 查看 `implementation/PHASE-*.md`

### 需要了解用戶反饋處理？
→ 查看 `implementation/USER-FEEDBACK-*.md`

### 需要查閱交接文檔？
→ 查看 `handoff/PHASE-A-HANDOFF.md`

---

**維護者**: AI 助手 + 開發團隊
**問題回報**: 請更新 FIXLOG.md 或 DEVELOPMENT-LOG.md
