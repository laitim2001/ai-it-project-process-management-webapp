# ClaudeDocs - AI 助手文檔目錄

## 目錄用途
此目錄包含所有 AI 助手（Claude）生成和維護的項目文檔，採用結構化組織方式管理開發過程中的各類文檔。

## 目錄結構

```
claudedocs/
├── 1-planning/              # 規劃文檔
│   ├── architecture/        # 架構設計文檔
│   ├── epics/               # Epic 規劃
│   ├── features/            # Feature 規劃 (FEAT-*)
│   └── roadmap/             # 產品路線圖
│
├── 2-sprints/               # Sprint 文檔
│   └── testing-validation/  # 測試驗證記錄
│
├── 3-progress/              # 進度追蹤
│   ├── daily/               # 每日進度
│   └── weekly/              # 每週進度報告
│
├── 4-changes/               # 變更記錄
│   ├── bug-fixes/           # Bug 修復記錄 (FIX-*)
│   ├── feature-changes/     # Feature 變更 (CHANGE-*)
│   └── i18n/                # 國際化變更
│
├── 5-analysis/              # 分析報告
│   └── code-review/         # 代碼審查
│
└── 6-ai-assistant/          # AI 助手相關
    ├── prompts/             # 提示詞範本
    └── workflows/           # 工作流程指南
```

## 文檔命名約定

### 規劃文檔
```
FEAT-{NNN}-{feature-name}.md           # 功能規劃
FEAT-{NNN}-{feature-name}-PLAN.md      # 實施計劃
FEAT-{NNN}-{feature-name}-PROGRESS.md  # 進度追蹤
```

### 變更記錄
```
FIX-{NNN}-{description}.md             # Bug 修復
CHANGE-{NNN}-{description}.md          # 功能變更
```

### 進度報告
```
{YYYY}-W{WW}.md                        # 週報 (例: 2025-W49.md)
{YYYY}-{MM}-{DD}.md                    # 日報
```

## 文檔格式範本

### Feature 規劃 (FEAT-*)
```markdown
# FEAT-{NNN}: {Feature Name}

## 概述
{功能描述}

## 需求
- [ ] 需求 1
- [ ] 需求 2

## 技術設計
{設計細節}

## 影響範圍
- 模型: {models}
- API: {routers}
- 頁面: {pages}
- 組件: {components}

## 進度
- [ ] Phase 1: ...
- [ ] Phase 2: ...
```

### 週報格式
```markdown
# {YYYY}-W{WW} 週報

## 本週完成
- {完成項目列表}

## 進行中
- {進行中項目}

## 下週計劃
- {計劃項目}

## 問題與阻礙
- {問題列表}
```

## 重要文檔

### 當前活躍
- `1-planning/features/FEAT-007-*` - OM Expense 重構
- `3-progress/weekly/2025-W49.md` - 當前週報
- `4-changes/feature-changes/CHANGE-004-*` - OM Summary 變更

### 參考文檔
- `6-ai-assistant/prompts/SITUATION-*.md` - 情境提示詞
- `6-ai-assistant/workflows/*.md` - 工作流程指南

## 使用指南

### 查找文檔
1. 功能規劃 → `1-planning/features/`
2. Bug 修復記錄 → `4-changes/bug-fixes/`
3. 週報 → `3-progress/weekly/`
4. AI 工作流程 → `6-ai-assistant/`

### 創建新文檔
1. 確定文檔類型和目錄
2. 使用正確的命名約定
3. 遵循格式範本
4. 更新相關索引文件

## 相關文件
- `AI-ASSISTANT-GUIDE.md` - AI 助手指南
- `PROJECT-INDEX.md` - 項目索引
- `DEVELOPMENT-LOG.md` - 開發日誌
