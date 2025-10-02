# 🚀 AI 銷售賦能平台 - 服務啟動指南

## ✅ 當前狀態

- ✅ Next.js 開發服務器：**已啟動** (http://localhost:3000)
- ❌ PostgreSQL 數據庫：**未運行**
- ✅ 環境變數：**已配置** (.env.local)
- ✅ 測試用戶：**已創建** (test@example.com / test123456)

## 🔧 啟動步驟

### 步驟 1: 啟動 Docker Desktop

1. 打開 **Docker Desktop** 應用程序
2. 等待 Docker Desktop 完全啟動（圖標變綠）
3. 確認 Docker 正在運行

### 步驟 2: 啟動 PostgreSQL 數據庫

打開新的終端窗口，執行：

```bash
# 選項 A: 如果已有 Docker 容器
docker start postgres-ai-sales

# 選項 B: 如果沒有容器，創建新容器
docker run -d \
  --name postgres-ai-sales \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=ai_sales_db \
  -p 5433:5432 \
  postgres:15-alpine
```

### 步驟 3: 驗證數據庫連接

```bash
# 測試數據庫連接
docker exec postgres-ai-sales psql -U postgres -d ai_sales_db -c "SELECT 1;"
```

應該看到：
```
 ?column?
----------
        1
(1 row)
```

### 步驟 4: 驗證服務

Next.js 服務器已經在運行，訪問：
- **應用首頁**: http://localhost:3000
- **登入頁面**: http://localhost:3000/login

## 🔐 測試登入憑證

```
Email: test@example.com
Password: test123456
```

## 🐛 故障排除

### 問題 1: Docker Desktop 無法啟動

**解決方案**:
1. 重啟電腦
2. 檢查 WSL 2 是否正確安裝：`wsl --list --verbose`
3. 更新 Docker Desktop 到最新版本

### 問題 2: PostgreSQL 容器無法啟動

**解決方案**:
```bash
# 查看容器日誌
docker logs postgres-ai-sales

# 刪除並重建容器
docker rm -f postgres-ai-sales
docker run -d \
  --name postgres-ai-sales \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=dev_password_123 \
  -e POSTGRES_DB=ai_sales_db \
  -p 5433:5432 \
  postgres:15-alpine

# 等待 5 秒讓數據庫啟動
sleep 5

# 應用數據庫 schema
npx prisma db push
```

### 問題 3: 端口 5433 被佔用

**解決方案**:
```bash
# 查找佔用端口的進程
netstat -ano | findstr :5433

# 如果是其他 PostgreSQL，停止它或使用不同端口
# 修改 .env.local 中的 DATABASE_URL 端口號
```

### 問題 4: 登入失敗 500 錯誤

**原因**: 數據庫未運行

**解決方案**:
1. 確認 Docker Desktop 正在運行
2. 確認 PostgreSQL 容器正在運行：`docker ps | grep postgres`
3. 重啟 Next.js 服務器

## 📝 快速重啟所有服務

### Windows PowerShell:
```powershell
# 停止服務
Get-Process -Name "node" | Stop-Process -Force
docker stop postgres-ai-sales

# 啟動服務
docker start postgres-ai-sales
Start-Sleep -Seconds 3
npm run dev
```

### Windows CMD:
```cmd
# 停止 Node 進程
taskkill /F /IM node.exe

# 啟動 PostgreSQL
docker start postgres-ai-sales

# 等待 3 秒
timeout /t 3 /nobreak

# 啟動 Next.js
npm run dev
```

## ✨ 一鍵啟動腳本

使用提供的腳本：

```bash
# Windows
scripts\restart-services.bat

# 或手動執行
docker start postgres-ai-sales && timeout /t 3 /nobreak && npm run dev
```

## 🎯 驗證所有服務正常

執行以下檢查：

```bash
# 1. 檢查 PostgreSQL
docker ps | findstr postgres

# 2. 檢查 Next.js
curl http://localhost:3000

# 3. 測試登入 API
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"test@example.com\",\"password\":\"test123456\"}"
```

## 📚 相關文檔

- [環境配置指南](.env.example)
- [數據庫設置指南](docs/database-setup.md)
- [開發指南](docs/development-guide.md)

---

**最後更新**: 2025-10-01
