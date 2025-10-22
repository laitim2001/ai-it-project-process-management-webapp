# 🚀 IT 專案流程管理平台 - 開發環境設置指引

> **完整的新機器開發環境配置指南** - 從零開始到成功運行項目

---

## 📋 目錄

1. [前置需求](#前置需求)
2. [系統環境準備](#系統環境準備)
3. [項目安裝步驟](#項目安裝步驟)
4. [常見問題排查](#常見問題排查)
5. [驗證環境](#驗證環境)
6. [進階配置](#進階配置)

---

## 🔧 前置需求

在開始之前，請確保您的機器滿足以下條件：

### 最低硬件要求

| 項目 | 最低要求 | 建議配置 |
|------|----------|----------|
| **CPU** | 雙核心 2.0 GHz | 四核心 3.0 GHz+ |
| **記憶體** | 8 GB RAM | 16 GB RAM+ |
| **硬碟空間** | 10 GB 可用空間 | 20 GB+ SSD |
| **作業系統** | Windows 10, macOS 10.15, Ubuntu 20.04 | 最新穩定版 |

### 必需軟件

| 軟件 | 版本要求 | 用途 | 下載連結 |
|------|----------|------|----------|
| **Node.js** | >= 20.0.0 | JavaScript 運行環境 | [nodejs.org](https://nodejs.org/) |
| **pnpm** | >= 8.0.0 | 套件管理器 | `npm install -g pnpm` |
| **Docker Desktop** | 最新穩定版 | 容器化服務（PostgreSQL, Redis, MailHog） | [docker.com](https://www.docker.com/products/docker-desktop) |
| **Git** | >= 2.30 | 版本控制 | [git-scm.com](https://git-scm.com/) |

### 可選軟件（推薦）

| 軟件 | 用途 | 下載連結 |
|------|------|----------|
| **VS Code** | 代碼編輯器 | [code.visualstudio.com](https://code.visualstudio.com/) |
| **nvm (Node Version Manager)** | Node.js 版本管理 | [github.com/nvm-sh/nvm](https://github.com/nvm-sh/nvm) |
| **pgAdmin** | PostgreSQL 管理工具 | [pgadmin.org](https://www.pgadmin.org/) |

---

## 🛠️ 系統環境準備

### 步驟 1: 安裝 Node.js

#### Windows

1. 下載 Node.js LTS 安裝包: [https://nodejs.org/](https://nodejs.org/)
2. 執行安裝程序，勾選 "Add to PATH"
3. 重啟命令提示符，驗證安裝:
   ```bash
   node --version  # 應顯示 v20.x.x 或更高版本
   npm --version
   ```

#### macOS (使用 Homebrew)

```bash
# 安裝 Homebrew (如果尚未安裝)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安裝 Node.js
brew install node@20

# 驗證安裝
node --version
```

#### Linux (Ubuntu/Debian)

```bash
# 使用 NodeSource 倉庫
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 驗證安裝
node --version
```

#### 使用 nvm (推薦 - 跨平台)

```bash
# 安裝 nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# 重新載入 shell 配置
source ~/.bashrc  # 或 ~/.zshrc

# 安裝 Node.js 20
nvm install 20
nvm use 20
nvm alias default 20

# 驗證安裝
node --version
```

### 步驟 2: 安裝 pnpm

```bash
# 全局安裝 pnpm
npm install -g pnpm

# 驗證安裝
pnpm --version  # 應顯示 8.x.x 或更高版本
```

**為什麼使用 pnpm?**
- ⚡ 比 npm 快 2-3 倍
- 💾 節省硬碟空間 (符號連結機制)
- 🔒 嚴格的依賴管理

### 步驟 3: 安裝 Docker Desktop

#### Windows

1. 下載 Docker Desktop: [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. 執行安裝程序
3. 啟動 Docker Desktop
4. 確保 Docker 設定中勾選:
   - ✅ "Start Docker Desktop when you log in"
   - ✅ "Use WSL 2 based engine" (Windows)

#### macOS

```bash
# 使用 Homebrew Cask
brew install --cask docker

# 或手動下載安裝包
# https://www.docker.com/products/docker-desktop
```

#### Linux (Ubuntu)

```bash
# 安裝 Docker Engine
sudo apt-get update
sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 將當前用戶加入 docker 組
sudo usermod -aG docker $USER

# 重新登入以使更改生效
```

#### 驗證 Docker 安裝

```bash
docker --version        # Docker version 24.x.x+
docker-compose --version # Docker Compose version v2.x.x+
docker ps               # 應顯示空列表（無錯誤）
```

### 步驟 4: 安裝 Git

#### Windows

下載並安裝: [https://git-scm.com/download/win](https://git-scm.com/download/win)

#### macOS

```bash
brew install git
```

#### Linux

```bash
sudo apt-get install git
```

#### 配置 Git（首次使用）

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
git config --global core.autocrlf input  # 跨平台換行符處理
```

---

## 📦 項目安裝步驟

### 步驟 1: 克隆項目

```bash
# 克隆 Git 倉庫
git clone https://github.com/your-org/ai-it-project-process-management-webapp.git

# 進入項目目錄
cd ai-it-project-process-management-webapp
```

**重要提示**: 確保項目路徑中**沒有中文字符**或特殊符號，避免潛在問題。

### 步驟 2: 配置環境變數

```bash
# 複製環境變數樣板
cp .env.example .env

# Windows (命令提示符)
copy .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

#### 編輯 .env 檔案

打開 `.env` 檔案，**必須** 修改以下變數：

```env
# 1. 資料庫連接 (本地開發使用 Docker)
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"
# ⚠️ 注意: Docker Compose 使用 port 5434 避免與其他項目衝突

# 2. NextAuth 密鑰 (使用以下命令生成)
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET_HERE"
NEXTAUTH_URL="http://localhost:3000"

# 3. Azure AD B2C (如需使用 Azure 認證)
AZURE_AD_B2C_TENANT_NAME="your-tenant-name"
AZURE_AD_B2C_CLIENT_ID="your-client-id"
AZURE_AD_B2C_CLIENT_SECRET="your-client-secret"
# 注意: 開發環境可以使用預設值，生產環境必須配置真實 Azure 憑證
```

#### 生成 NEXTAUTH_SECRET

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
# 使用線上工具: https://generate-secret.now.sh/32
# 或使用 Node.js:
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

將生成的密鑰複製到 `.env` 檔案的 `NEXTAUTH_SECRET` 變數。

### 步驟 3: 啟動 Docker 服務

```bash
# 啟動所有服務 (PostgreSQL, Redis, MailHog, pgAdmin)
docker-compose up -d

# 查看服務狀態
docker-compose ps

# 預期輸出:
# NAME                  IMAGE                      STATUS
# itpm-postgres-dev     postgres:16-alpine         Up 30 seconds (healthy)
# itpm-redis-dev        redis:7-alpine             Up 30 seconds (healthy)
# itpm-mailhog          mailhog/mailhog:latest     Up 30 seconds
# itpm-pgadmin          dpage/pgadmin4:latest      Up 30 seconds
```

**驗證服務**:

| 服務 | 訪問地址 | 用途 |
|------|----------|------|
| PostgreSQL | `localhost:5434` | 資料庫 |
| pgAdmin | `http://localhost:5050` | 資料庫管理 (登入: `admin@itpm.local` / `admin123`) |
| Redis | `localhost:6381` | 緩存 |
| MailHog UI | `http://localhost:8025` | 查看測試郵件 |

**常見問題**:
- ❌ **Port 已被佔用**: 修改 `docker-compose.yml` 中的端口映射
- ❌ **Docker daemon 未啟動**: 確保 Docker Desktop 正在運行

### 步驟 4: 安裝項目依賴

```bash
# 安裝所有工作區的依賴
pnpm install

# 這個命令會:
# 1. 安裝 root package.json 的依賴
# 2. 安裝 apps/* 和 packages/* 的依賴
# 3. 自動執行 postinstall 腳本 (生成 Prisma Client)
```

**預期輸出**:
```
 WARN  deprecated packages...
Packages: +1234
+++++++++++++++++++++++++++++++++++++++
Progress: resolved 1234, reused 0, downloaded 1234, added 1234
Done in 45s

> it-project-management-platform@0.1.0 postinstall
> pnpm db:generate

Environment variables loaded from .env
Prisma schema loaded from packages/db/prisma/schema.prisma

✔ Generated Prisma Client (v5.x.x) to .../@prisma/client in 234ms
```

### 步驟 5: 生成 Prisma Client（如未自動執行）

```bash
# 手動生成 Prisma Client
pnpm db:generate
```

### 步驟 6: 執行資料庫遷移

```bash
# 創建資料庫表結構
pnpm db:migrate

# 或使用 db:push (開發環境快速同步)
pnpm db:push
```

**預期輸出**:
```
Environment variables loaded from .env
Prisma schema loaded from packages/db/prisma/schema.prisma
Datasource "db": PostgreSQL database "itpm_dev", schema "public" at "localhost:5434"

Applying migration `20240101000000_init`
... (migration logs)

✔ Database synchronized with schema
```

### 步驟 7: 種子資料庫（可選）

```bash
# 填充測試數據
pnpm db:seed
```

這會創建:
- 👤 測試用戶 (各種角色)
- 💰 預算池
- 📊 測試項目

### 步驟 8: 驗證環境配置

```bash
# 執行自動環境檢查
pnpm check:env
```

**預期輸出**:
```
╔════════════════════════════════════════════════════════════════╗
║    IT 專案流程管理平台 - 環境檢查                              ║
╚════════════════════════════════════════════════════════════════╝

✓ Node.js version ... PASSED
  當前版本: v20.11.0, 需要: >= v20.0.0
✓ pnpm package manager ... PASSED
  當前版本: 8.15.3, 需要: >= 8.0.0
✓ Docker daemon running ... PASSED
✓ .env file exists ... PASSED
✓ Required environment variables ... PASSED
✓ Dependencies installed ... PASSED
✓ Prisma Client generated ... PASSED
✓ Docker Compose configuration ... PASSED
✓ Docker services running ... PASSED
  運行中的服務: postgres, redis, mailhog
✓ Database connection ... PASSED
  PostgreSQL 正在運行

╔════════════════════════════════════════════════════════════════╗
║    檢查總結                                                     ║
╚════════════════════════════════════════════════════════════════╝

✓ 通過: 10
✗ 失敗: 0
⚠ 警告: 0

✅ 環境檢查完成！您可以開始開發了。
   執行 pnpm dev 啟動開發服務器
```

### 步驟 9: 啟動開發服務器

```bash
# 啟動開發模式
pnpm dev
```

**預期輸出**:
```
• Packages in scope: @itpm/api, @itpm/auth, @itpm/db, @itpm/web
• Running dev in 5 packages

@itpm/web:dev:  ▲ Next.js 14.1.0
@itpm/web:dev:  - Local:        http://localhost:3000
@itpm/web:dev:  - Environments: .env
@itpm/web:dev:  ✓ Ready in 2.1s
```

### 步驟 10: 訪問應用

打開瀏覽器訪問: **http://localhost:3000**

🎉 **恭喜！環境配置完成！**

---

## 🧩 完整安裝流程總結

```bash
# 1. 克隆項目
git clone https://github.com/your-org/ai-it-project-process-management-webapp.git
cd ai-it-project-process-management-webapp

# 2. 配置環境變數
cp .env.example .env
# 編輯 .env 填入必要變數

# 3. 啟動 Docker 服務
docker-compose up -d

# 4. 一鍵安裝與檢查
pnpm setup

# 5. 執行資料庫遷移
pnpm db:migrate

# 6. (可選) 填充測試數據
pnpm db:seed

# 7. 啟動開發服務器
pnpm dev
```

**預計總時間**: 15-30 分鐘（取決於網速和硬件性能）

---

## ❗ 常見問題排查

### 問題 1: Docker 服務無法啟動

**症狀**: `docker-compose up -d` 失敗

**可能原因**:
- Docker Desktop 未啟動
- 端口被佔用（5432, 6379, 1025, 8025）
- WSL 2 未啟用（Windows）

**解決方案**:

```bash
# 檢查 Docker 狀態
docker ps

# 檢查端口佔用 (Windows)
netstat -ano | findstr "5434 6381 1025 8025"

# 檢查端口佔用 (macOS/Linux)
lsof -i :5434 -i :6381 -i :1025 -i :8025

# 如果端口被佔用，修改 docker-compose.yml:
# postgres:
#   ports:
#     - '5435:5432'  # 改為 5435
```

### 問題 2: pnpm install 失敗

**症狀**: 依賴安裝時報錯

**可能原因**:
- Node.js 版本不符合要求
- 網絡問題（防火牆、代理）
- pnpm 緩存損壞

**解決方案**:

```bash
# 檢查 Node.js 版本
node --version  # 必須 >= 20.0.0

# 清除 pnpm 緩存
pnpm store prune

# 使用淘寶鏡像（中國大陸）
pnpm config set registry https://registry.npmmirror.com/

# 重新安裝
pnpm install
```

### 問題 3: Prisma Client 生成失敗

**症狀**: `pnpm db:generate` 錯誤

**可能原因**:
- DATABASE_URL 配置錯誤
- Prisma schema 語法錯誤

**解決方案**:

```bash
# 檢查 .env 中的 DATABASE_URL
cat .env | grep DATABASE_URL

# 應該是:
# DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"

# 手動生成
cd packages/db
pnpm prisma generate
```

### 問題 4: 資料庫連接失敗

**症狀**: 應用無法連接資料庫

**可能原因**:
- PostgreSQL 容器未啟動
- DATABASE_URL 端口錯誤
- Docker 網絡問題

**解決方案**:

```bash
# 檢查 PostgreSQL 容器狀態
docker ps | grep postgres

# 測試資料庫連接
docker exec itpm-postgres-dev pg_isready -U postgres

# 預期輸出: /var/run/postgresql:5432 - accepting connections

# 重啟 PostgreSQL 容器
docker-compose restart postgres

# 查看容器日誌
docker-compose logs postgres
```

### 問題 5: Next.js 端口被佔用

**症狀**: `Port 3000 is already in use`

**解決方案**:

Next.js 會**自動嘗試其他端口** (3001, 3002, 3003...)，這是正常行為。

或手動指定端口:

```bash
# 修改 apps/web/package.json
"dev": "next dev -p 3001"

# 更新 .env
NEXTAUTH_URL="http://localhost:3001"
APP_URL="http://localhost:3001"
```

### 問題 6: Windows 換行符問題

**症狀**: Git 提示 `LF will be replaced by CRLF`

**解決方案**:

```bash
# 配置 Git 自動處理換行符
git config --global core.autocrlf input

# 或在項目中使用 .gitattributes (已包含在項目中)
```

### 問題 7: TypeScript 類型錯誤

**症狀**: VSCode 顯示大量類型錯誤

**解決方案**:

```bash
# 重新生成 Prisma Client
pnpm db:generate

# 重啟 TypeScript 服務器 (VSCode)
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# 清除 Turbo 緩存
pnpm clean
pnpm install
```

---

## ✅ 驗證環境

### 自動驗證腳本

```bash
pnpm check:env
```

### 手動驗證清單

- [ ] Node.js >= 20.0.0: `node --version`
- [ ] pnpm >= 8.0.0: `pnpm --version`
- [ ] Docker 正在運行: `docker ps`
- [ ] PostgreSQL 容器健康: `docker-compose ps postgres`
- [ ] .env 檔案存在且配置正確: `cat .env`
- [ ] 依賴已安裝: `ls node_modules`
- [ ] Prisma Client 已生成: `ls node_modules/.prisma/client`
- [ ] 資料庫已遷移: 訪問 `http://localhost:5050` (pgAdmin)
- [ ] 開發服務器啟動: `pnpm dev`
- [ ] 應用可訪問: 打開 `http://localhost:3000`

---

## 🚀 進階配置

### 使用 nvm 管理 Node.js 版本

項目包含 `.nvmrc` 檔案，可自動切換到正確的 Node.js 版本：

```bash
# 安裝項目指定的 Node.js 版本
nvm install

# 使用項目版本
nvm use

# 設為預設版本
nvm alias default $(cat .nvmrc)
```

### pgAdmin 資料庫管理

1. 訪問: `http://localhost:5050`
2. 登入: `admin@itpm.local` / `admin123`
3. 添加伺服器:
   - **Name**: ITPM Dev
   - **Host**: `host.docker.internal` (Windows/Mac) 或 `172.17.0.1` (Linux)
   - **Port**: `5432` (容器內部端口)
   - **Database**: `itpm_dev`
   - **Username**: `postgres`
   - **Password**: `localdev123`

### VS Code 推薦擴展

創建 `.vscode/extensions.json` (已包含):

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "ms-azuretools.vscode-docker"
  ]
}
```

### Prisma Studio (資料庫 GUI)

```bash
# 啟動 Prisma Studio
pnpm db:studio

# 訪問: http://localhost:5555
```

### MailHog (測試郵件)

1. 訪問 UI: `http://localhost:8025`
2. 應用會將所有郵件發送到 MailHog（不會真正發送）
3. 查看提案審批通知、密碼重設等郵件

---

## 📚 相關文檔

- [README.md](./README.md) - 項目概述
- [CLAUDE.md](./CLAUDE.md) - AI 助手開發指南
- [AI-ASSISTANT-GUIDE.md](./AI-ASSISTANT-GUIDE.md) - AI 助手工作流程
- [FIXLOG.md](./FIXLOG.md) - 問題修復記錄
- [docs/](./docs/) - 完整技術文檔

---

## 🆘 獲取幫助

如果您在設置過程中遇到問題:

1. **查看 [FIXLOG.md](./FIXLOG.md)** - 記錄了已知問題和解決方案
2. **執行環境檢查**: `pnpm check:env`
3. **查看 Docker 日誌**: `docker-compose logs`
4. **提交 Issue**: [GitHub Issues](https://github.com/your-org/ai-it-project-process-management-webapp/issues)

---

**Last Updated**: 2025-10-22
**Document Version**: 1.0.0
