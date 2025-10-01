# 9. 開發工作流程 (Development Workflow)

### 9.1. 本地開發設置

#### 9.1.1. 先決條件
*   Node.js (建議版本: v20.x LTS)
*   pnpm (套件管理器)
*   Docker Desktop (用於運行本地 PostgreSQL 資料庫)
*   Git
*   Azure CLI

#### 9.1.2. 首次安裝
```bash
# 1. 克隆儲存庫
git clone <repository-url>
cd <repository-name>

# 2. 安裝所有相依套件
pnpm install

# 3. 設置環境變數
# 複製 .env.example 為 .env，並填寫所有必要的密鑰
cp .env.example .env

# 4. 登入 Azure CLI
az login

# 5. 啟動本地資料庫 (使用 Docker)
docker-compose up -d

# 6. 執行資料庫遷移，創建資料庫表格
pnpm prisma migrate dev

# 7. (可選) 填充種子資料
pnpm prisma db seed
```

#### 9.1.3. 日常開發指令
```bash
# 啟動所有服務 (前端 Web)
pnpm dev

# 只啟動 Next.js 應用
pnpm dev --filter=web

# 執行所有測試
pnpm test
```

### 9.2. 環境變數配置

#### `.env`
```bash
# Azure
AZURE_TENANT_ID="..."
AZURE_CLIENT_ID="..."
AZURE_CLIENT_SECRET="..."

# Azure AD B2C
AZURE_AD_B2C_CLIENT_ID="..."
AZURE_AD_B2C_CLIENT_SECRET="..."
AZURE_AD_B2C_TENANT_NAME="..."
AZURE_AD_B2C_PRIMARY_USER_FLOW="..."

# Database (本地 Docker 或 Azure)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@[HOST]:5432/postgres"

# NextAuth.js
NEXTAUTH_SECRET="..." # run `openssl rand -base64 32` to generate
NEXTAUTH_URL="http://localhost:3000"

# 其他服務
SENDGRID_API_KEY="..."
```
