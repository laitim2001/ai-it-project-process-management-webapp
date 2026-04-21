---
description: "提交前檢查：確保代碼品質、i18n 一致性、無遺漏檔案"
---

# /itpm:pre-commit — 提交前品質檢查

在 git commit 之前執行品質檢查，確保代碼可以安全提交和推送。

## 步驟

### 1. 查看變更範圍
```
git status
git diff --stat
git diff --cached --stat
```
報告：哪些檔案被修改/新增/刪除

### 2. 敏感檔案檢查
確認以下檔案**沒有**被意外 staged：
- `.env`（環境變數，含密鑰）
- `credentials.json`、`*.pem`、`*.key`
- 任何含 API key、password、secret 的檔案

如果發現，**停下來警告**使用者。

### 3. i18n 一致性檢查（如果翻譯檔案有變更）
```
pnpm validate:i18n
```
- 檢查 en.json 和 zh-TW.json 的 key 結構是否一致
- 檢查是否有重複 key
- 檢查是否有空值

### 4. TypeScript 類型檢查
```
pnpm typecheck
```

### 5. Lint 檢查
```
pnpm lint
```

### 5.5. CLAUDE.md ↔ codebase-analyze 同步檢查
```
pnpm check:claude-sync
```
- 比對 CLAUDE.md 中的統計數字與 `docs/codebase-analyze/SUMMARY.md` 權威值
- 漂移 > 5% 或絕對差 > 2 時會在 stderr 警告（不阻斷提交）
- 若警告頻繁，建議執行 `/itpm:refresh-stats` 更新權威統計

### 6. 建議 commit message
根據變更內容，使用 conventional commit 格式建議 commit message：
- `feat(scope):` 新功能
- `fix(scope):` 修復
- `docs(scope):` 文檔
- `refactor(scope):` 重構
- `style(scope):` 樣式
- `chore(scope):` 維護

message 使用繁體中文，scope 使用英文。

### 7. 輸出檢查結果摘要

| 檢查項目 | 狀態 |
|---------|------|
| 敏感檔案 | ✅/❌ |
| i18n | ✅/⏭️ (跳過) |
| TypeScript | ✅/❌ |
| Lint | ✅/❌ |
| CLAUDE.md 同步 | ✅/⚠️ (warn) |

如果全部通過，提示使用者可以安全 commit。
