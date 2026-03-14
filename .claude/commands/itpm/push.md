---
description: "結束開發時提交並推送：暫存變更、品質檢查、commit、push"
---

# /itpm:push — 提交並推送到 GitHub

在結束當前電腦的開發工作時，將所有變更提交並推送到 GitHub，讓另一台電腦可以同步。

## 步驟

### 1. 檢查當前狀態
```
git status
git branch
```
- 確認當前在正確的分支
- 列出所有變更的檔案

### 2. 顯示變更內容
```
git diff --stat
```
讓使用者確認變更範圍

### 3. 敏感檔案過濾
掃描變更檔案，確保不包含：
- `.env`、`credentials.json`
- 任何含密鑰、API key 的檔案
如果發現，**停下來警告**。

### 4. 暫存相關檔案
根據變更內容，用 `git add` 暫存具體檔案（不使用 `git add .` 或 `git add -A`）。

### 5. 生成 commit message
分析變更內容，生成 conventional commit 格式的繁體中文 commit message。
格式：`type(scope): 描述`

詢問使用者是否同意此 commit message，或想要修改。

### 6. 提交
```
git commit -m "message"
```

### 7. 推送
```
git push origin <current-branch>
```

### 8. 確認推送結果
```
git log --oneline -3
```
報告推送成功，提示另一台電腦用 `git pull` 或 `/itpm:sync` 同步。
