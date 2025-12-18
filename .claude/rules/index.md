# .claude/rules/ - AI 助手代碼規範索引

## 概述
此目錄包含專案的代碼規範和指引，用於指導 AI 助手產出高質量的代碼。每個規則文件都使用 YAML frontmatter 指定適用的路徑範圍。

## 規則文件結構

```
.claude/rules/
├── index.md              # 本索引文件
├── frontend.md           # Next.js App Router 頁面規範
├── components.md         # React 組件規範
├── ui-design-system.md   # shadcn/ui 設計系統規範
├── backend-api.md        # tRPC 後端 API 規範
├── database.md           # Prisma 資料庫規範
├── i18n.md               # 國際化規範
├── typescript.md         # TypeScript 約定
├── scripts.md            # 開發腳本規範
└── documentation.md      # 文檔規範
```

## 規則適用範圍

| 規則文件 | 適用路徑 | 主要內容 |
|----------|----------|----------|
| `frontend.md` | `apps/web/src/app/**` | Next.js 頁面、路由、Metadata |
| `components.md` | `apps/web/src/components/**` | React 組件模式、Props、狀態管理 |
| `ui-design-system.md` | `apps/web/src/components/ui/**` | shadcn/ui 組件使用規範 |
| `backend-api.md` | `packages/api/src/**` | tRPC Router、Zod Schema、權限控制 |
| `database.md` | `packages/db/prisma/**` | Prisma Schema、遷移、查詢模式 |
| `i18n.md` | `apps/web/src/messages/**` | 翻譯 Key 命名、驗證流程 |
| `typescript.md` | `**/*.ts`, `**/*.tsx` | 類型定義、命名約定、泛型使用 |
| `scripts.md` | `scripts/**` | 腳本命名、輸出格式、錯誤處理 |
| `documentation.md` | `claudedocs/**`, `docs/**` | 文檔結構、格式範本、語言規範 |

## 規則優先級

當多個規則適用於同一檔案時，按以下優先級：

1. **路徑特定規則** > 通用規則
2. **TypeScript 規則**（基礎約定）
3. **領域規則**（frontend/backend/database）
4. **文檔規則**（輔助說明）

## 快速查找

### 開發前端頁面
1. `frontend.md` - 頁面結構、路由保護
2. `components.md` - 組件模式
3. `ui-design-system.md` - UI 組件使用
4. `i18n.md` - 國際化整合

### 開發 API
1. `backend-api.md` - tRPC Router 模式
2. `database.md` - Prisma 查詢
3. `typescript.md` - Zod Schema 類型

### 修改資料庫
1. `database.md` - Schema 約定
2. `backend-api.md` - API 調整

### 新增翻譯
1. `i18n.md` - Key 命名、驗證流程

### 編寫文檔
1. `documentation.md` - 格式範本

## 規則格式說明

每個規則文件使用以下格式：

```markdown
# 規則標題

---
applies_to:
  - "path/pattern/**"
  - "another/pattern/**"
---

## 概述
{規則說明}

## 核心約定
{具體規範}

## 範例
{代碼範例}

## 禁止事項
{不可做的事項}

## 相關規則
{連結到其他規則}
```

## 使用指南

### AI 助手使用
當處理特定路徑的檔案時，AI 助手應：
1. 檢查 `applies_to` 匹配的規則文件
2. 遵循規則中的約定和模式
3. 避免「禁止事項」中列出的做法
4. 參考「範例」產出一致的代碼

### 人工開發者使用
開發者可將這些規則作為：
1. 代碼審查標準
2. 新人入職指南
3. 重構參考規範

## 更新規則

當需要更新規則時：
1. 修改對應的規則文件
2. 更新 `applies_to` 路徑（如需要）
3. 同步更新「相關規則」連結
4. 通知團隊成員

## 相關文件
- 根目錄 `CLAUDE.md` - 專案總體指南
- `AI-ASSISTANT-GUIDE.md` - AI 助手工作流程
- `PROJECT-INDEX.md` - 專案文件索引
