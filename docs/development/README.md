# 🛠️ 開發指南文檔

> **目的**: 開發環境設置、服務管理和常用命令參考
> **最後更新**: 2025-10-26

---

## 📋 文件索引

| 文件名稱 | 說明 | 用途 |
|---------|------|------|
| [DEVELOPMENT-SERVICE-MANAGEMENT.md](./DEVELOPMENT-SERVICE-MANAGEMENT.md) | 開發服務管理指南 | 服務啟動、停止、監控 |
| [INSTALL-COMMANDS.md](./INSTALL-COMMANDS.md) | 常用安裝命令快速參考 | 快速查找安裝指令 |
| [SETUP-COMPLETE.md](./SETUP-COMPLETE.md) | 環境設置完成檢查清單 | 驗證開發環境 |

---

## 🎯 文檔概覽

### DEVELOPMENT-SERVICE-MANAGEMENT.md
**內容**: 開發服務的啟動、停止和管理指南
- Docker 容器管理
- PostgreSQL 服務管理
- Redis 服務管理
- Mailhog 郵件測試服務
- Next.js 開發服務器管理

**常用場景**:
```bash
# 啟動所有服務
docker-compose up -d
pnpm dev

# 停止所有服務
docker-compose down
```

---

### INSTALL-COMMANDS.md
**內容**: 快速命令參考
- Node.js 和 pnpm 安裝
- Docker 安裝
- 專案依賴安裝
- 常用開發工具安裝

**快速查找**:
```bash
# 一鍵設置
pnpm setup

# 完整安裝流程
pnpm install
pnpm db:generate
pnpm db:migrate
```

---

### SETUP-COMPLETE.md
**內容**: 環境設置完成後的驗證檢查清單
- 環境變數檢查
- 服務連接測試
- 資料庫遷移驗證
- 依賴完整性檢查

**驗證命令**:
```bash
# 自動檢查環境
pnpm check:env

# 預期結果：10/10 檢查通過
```

---

## 🚀 快速開始

### 首次設置（新開發者）

**完整指南**: 參見根目錄 [DEVELOPMENT-SETUP.md](../../DEVELOPMENT-SETUP.md)（711 行完整設置指南）

**快速版本**:
```bash
# 1. 克隆專案
git clone https://github.com/laitim2001/ai-it-project-process-management-webapp.git
cd ai-it-project-process-management-webapp

# 2. 一鍵設置（推薦）
pnpm setup

# 3. 配置環境變數
cp .env.example .env
# 編輯 .env 填入必要配置

# 4. 啟動本地服務
docker-compose up -d

# 5. 執行資料庫遷移
pnpm db:migrate

# 6. (可選) 填充測試數據
pnpm db:seed

# 7. 啟動開發服務器
pnpm dev
```

---

### 日常開發工作流程

**啟動開發環境**:
```bash
# 1. 啟動 Docker 服務（如果未運行）
docker-compose up -d

# 2. 檢查服務狀態
docker-compose ps

# 3. 啟動 Next.js 開發服務器
pnpm dev

# 4. 驗證環境（可選）
pnpm check:env
```

**開發過程中**:
```bash
# 資料庫操作
pnpm db:studio          # 打開 Prisma Studio GUI
pnpm db:migrate         # 執行資料庫遷移
pnpm db:generate        # 重新生成 Prisma Client

# 程式碼檢查
pnpm lint               # ESLint 檢查
pnpm typecheck          # TypeScript 類型檢查
pnpm format             # Prettier 格式化

# 測試
pnpm test               # 執行所有測試
pnpm test --filter=api  # 只測試 API 層
```

**結束開發**:
```bash
# 停止開發服務器（Ctrl+C）

# 停止 Docker 服務（可選）
docker-compose down
```

---

## 🔧 服務管理

### Docker 容器服務

| 服務 | 端口 | 用途 |
|------|------|------|
| **PostgreSQL** | 5434 | 主資料庫 |
| **Redis** | 6381 | 快取 & Session |
| **Mailhog SMTP** | 1025 | 郵件發送測試 |
| **Mailhog UI** | 8025 | 郵件查看界面 |

**⚠️ 重要**: 本地 Docker 服務使用非標準端口以避免衝突。

### Next.js 開發服務器

| 服務 | 端口 | URL |
|------|------|-----|
| **Web App** | 3000 | http://localhost:3000 |

---

## 🐛 常見問題排查

### 問題 1: 端口被占用
```bash
# Windows: 查找占用端口的進程
netstat -ano | findstr :3000

# 終止進程
taskkill /PID <進程ID> /F
```

### 問題 2: Docker 服務無法啟動
```bash
# 檢查 Docker 是否運行
docker --version
docker ps

# 重啟 Docker Desktop
# 重新啟動服務
docker-compose down
docker-compose up -d
```

### 問題 3: 資料庫連接失敗
```bash
# 檢查 DATABASE_URL 配置
# 本地開發應為：
# DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"

# 測試連接
pnpm db:studio
```

### 問題 4: Prisma Client 同步問題
```bash
# 清理並重新生成
rm -rf node_modules/.prisma
pnpm db:generate
```

---

## 📚 相關文檔

### 根目錄開發文檔
- [DEVELOPMENT-SETUP.md](../../DEVELOPMENT-SETUP.md) - 711 行完整環境設置指南
- [CONTRIBUTING.md](../../CONTRIBUTING.md) - 貢獻指南
- [README.md](../../README.md) - 專案總覽

### 技術架構文檔
- [docs/fullstack-architecture/](../fullstack-architecture/) - 完整技術架構
- [docs/infrastructure/](../infrastructure/) - 基礎設施設置

---

## 🎯 開發最佳實踐

1. ✅ 每次開發前執行 `pnpm check:env` 確保環境正常
2. ✅ 使用 `pnpm dev` 啟動開發服務器（不要用 npm）
3. ✅ 重大變更前先創建 feature branch
4. ✅ 定期執行 `pnpm index:check` 維護索引
5. ✅ 遇到問題先查閱 `FIXLOG.md`，避免重複踩坑

---

**維護者**: 開發團隊
**問題回報**: 請更新 FIXLOG.md 或創建 GitHub Issue
