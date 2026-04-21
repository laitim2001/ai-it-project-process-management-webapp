# Translation Messages - 翻譯資源層

> **Last Updated**: 2026-04-21
> **翻譯規模**: **2,706 keys** / **29 namespaces** / en + zh-TW 完全同步
> **相關規則**: `.claude/rules/i18n.md`
> **深度分析參考**:
> - `docs/codebase-analyze/08-i18n/translation-analysis.md` — 完整 namespace 結構與鍵值統計
> - `docs/codebase-analyze/11-verification/round-6-i18n-exhaustive.md` — i18n 窮盡驗證報告

## 📋 目錄用途
此目錄包含所有國際化翻譯鍵值對，支援繁體中文和英文。

## 🏗️ 檔案結構

```
messages/
├── en.json      # 英文翻譯
├── zh-TW.json   # 繁體中文翻譯
└── index.ts     # 統一導出
```

## 🎯 核心模式與約定

### 1. 翻譯鍵命名約定
```
namespace.category.subcategory.field.property

範例：
projects.list.title
projects.form.name.label
projects.form.name.placeholder
projects.form.name.error
common.actions.create
common.actions.save
common.status.draft
```

### 2. JSON 結構範例
```json
{
  "common": {
    "actions": {
      "create": "Create",
      "edit": "Edit",
      "delete": "Delete",
      "save": "Save",
      "cancel": "Cancel"
    },
    "status": {
      "draft": "Draft",
      "active": "Active",
      "completed": "Completed"
    }
  },
  "projects": {
    "list": {
      "title": "Projects",
      "empty": "No projects found",
      "loading": "Loading projects..."
    },
    "form": {
      "name": {
        "label": "Project Name",
        "placeholder": "Enter project name",
        "error": "Project name is required"
      },
      "description": {
        "label": "Description",
        "placeholder": "Enter description"
      }
    }
  }
}
```

### 3. 使用模式
```typescript
'use client';
import { useTranslations } from 'next-intl';

export function ProjectForm() {
  const t = useTranslations('projects.form');
  const tCommon = useTranslations('common');

  return (
    <div>
      <label>{t('name.label')}</label>
      <input placeholder={t('name.placeholder')} />
      <button>{tCommon('actions.save')}</button>
    </div>
  );
}
```

## ⚠️ 重要約定（CRITICAL）

### 1. 避免重複鍵問題
```json
// ❌ 錯誤：JSON 不允許重複鍵（後者會覆蓋前者）
{
  "form": { "name": "Name" },
  "form": { "description": "Description" }  // 覆蓋了第一個 form
}

// ✅ 正確：合併為單一物件
{
  "form": {
    "name": "Name",
    "description": "Description"
  }
}
```

### 2. 兩個檔案必須結構一致
```
en.json 和 zh-TW.json 必須有完全相同的鍵結構
只有值（翻譯文字）不同
```

### 3. 驗證工作流程
```bash
# 添加或修改翻譯後，必須執行驗證
pnpm validate:i18n

# 檢查項目：
# ✅ JSON 語法正確
# ✅ 無重複鍵
# ✅ 無空值
# ✅ 兩個檔案結構一致
```

### 4. 添加新翻譯鍵流程
```
1. 在 zh-TW.json 中添加鍵
2. 在 en.json 中添加相同路徑的鍵
3. 執行 pnpm validate:i18n
4. 清除 .next/ 快取（如需要）
5. 在組件中使用
```

## 📝 常見翻譯模式

### 表單欄位
```json
{
  "[field]": {
    "label": "...",
    "placeholder": "...",
    "error": "...",
    "hint": "..."
  }
}
```

### 列表頁面
```json
{
  "list": {
    "title": "...",
    "empty": "...",
    "loading": "...",
    "search": "...",
    "filter": "..."
  }
}
```

### 操作訊息
```json
{
  "messages": {
    "createSuccess": "...",
    "createError": "...",
    "updateSuccess": "...",
    "deleteConfirm": "..."
  }
}
```

## 🔍 除錯技巧

### 檢查翻譯鍵是否存在
```typescript
// 開發環境會顯示缺失的鍵
const t = useTranslations('projects');
console.log(t('nonexistent.key')); // [Missing: projects.nonexistent.key]
```

### 驗證腳本
```bash
pnpm validate:i18n
# 輸出：
# ✅ JSON syntax: OK
# ✅ Duplicate keys: None
# ✅ Empty values: None
# ✅ Structure consistency: OK
```

## 相關文件
- `apps/web/src/i18n/` - i18n 配置
- `scripts/validate-i18n.js` - 驗證腳本
- `claudedocs/I18N-TRANSLATION-KEY-GUIDE.md` - 完整指南
