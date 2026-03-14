---
description: "快速檢查專案狀態：Git、Docker、資料庫、開發服務器"
---

# /itpm:status — 專案狀態總覽

快速檢查所有服務和開發環境的狀態，不做任何修改。

## 同時執行以下檢查（並行）

### 1. Git 狀態
```
git status
git log --oneline -3
git diff --stat origin/main..HEAD
```
報告：當前分支、是否有未提交變更、是否領先/落後 remote

### 2. Docker 容器狀態
```
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```
報告：哪些容器在運行、哪些容器停止

### 3. 開發服務器狀態
```
netstat -ano | grep -E ":300[0-9]" | grep LISTENING
```
報告：Next.js 是否在運行、使用哪個 Port

### 4. 資料庫連線
```
docker exec itpm-postgres-dev psql -U postgres -d itpm_dev -c "SELECT 1;" 2>&1
```
報告：資料庫是否可連線

### 5. .env 一致性
檢查 NEXTAUTH_URL 的 Port 與實際運行的 Port 是否一致

## 輸出格式

用簡潔的狀態表格呈現：

| 項目 | 狀態 | 備註 |
|------|------|------|
| Git | ✅/⚠️/❌ | 分支、未提交數 |
| Docker | ✅/⚠️/❌ | N/5 容器運行 |
| 資料庫 | ✅/❌ | 連線狀態 |
| Dev Server | ✅/❌ | Port XXXX |
| .env | ✅/⚠️ | NEXTAUTH_URL 一致性 |
