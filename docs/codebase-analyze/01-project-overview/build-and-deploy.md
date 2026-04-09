# 建置與部署分析報告

> 分析日期：2026-04-09
> 分析範圍：Dockerfile, docker-compose, GitHub Actions, 環境變數, 開發設置

---

## 1. 建置流程

### 1.1 Turborepo 建置命令

**檔案**：根 `package.json:24-51`

| 命令 | 用途 | 底層執行 |
|------|------|----------|
| `pnpm build` | 建置所有套件 | `turbo run build`（遞迴依賴順序） |
| `pnpm dev` | 啟動開發環境 | `turbo run dev`（平行執行） |
| `pnpm lint` | 程式碼檢查 | `turbo run lint` |
| `pnpm typecheck` | 型別檢查 | `turbo run typecheck` |
| `pnpm test` | 執行測試 | `turbo run test` |
| `pnpm test:ci` | CI 測試 | `turbo run test -- --ci --coverage --maxWorkers=2` |
| `pnpm setup` | 一鍵設置 | `pnpm install && pnpm db:generate && node scripts/check-environment.js` |
| `pnpm postinstall` | 安裝後鉤子 | `pnpm db:generate` |

### 1.2 資料庫命令

| 命令 | 用途 |
|------|------|
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:migrate` | 建立並執行遷移 |
| `pnpm db:push` | 快速同步 Schema（不建立遷移） |
| `pnpm db:studio` | 開啟 Prisma Studio GUI |
| `pnpm db:seed` | 執行完整種子資料 |
| `pnpm db:seed:minimal` | 執行最小種子資料（Role, Currency） |

### 1.3 品質檢查命令

| 命令 | 用途 |
|------|------|
| `pnpm format` | Prettier 格式化 |
| `pnpm format:check` | 檢查格式 |
| `pnpm validate:i18n` | 驗證翻譯 Key 一致性 |
| `pnpm validate:jsdoc` | 驗證 JSDoc |
| `pnpm check:env` | 環境配置檢查 |
| `pnpm index:check` | 索引同步檢查 |
| `pnpm index:health` | 索引完整健康檢查 |

### 1.4 建置依賴順序

Turborepo 自動處理 `dependsOn: ["^build"]`：
```
@itpm/tsconfig → @itpm/db (prisma generate) → @itpm/auth → @itpm/api → @itpm/web (next build)
```

---

## 2. Docker 設置

### 2.1 本地開發 docker-compose.yml

**檔案**：`docker-compose.yml`

| 服務 | 映像 | 本地端口 | 容器端口 | 用途 |
|------|------|----------|----------|------|
| `postgres` | `postgres:16-alpine` | **5434** | 5432 | PostgreSQL 資料庫 |
| `pgadmin` | `dpage/pgadmin4:latest` | 5050 | 80 | 資料庫管理 GUI |
| `redis` | `redis:7-alpine` | **6381** | 6379 | 快取（預留） |
| `mailhog` | `mailhog/mailhog:latest` | 1025 / 8025 | 1025 / 8025 | Email 測試 SMTP + Web UI |
| `azurite` | `mcr.microsoft.com/azure-storage/azurite` | 10000-10002 | 10000-10002 | Azure Blob 模擬器 |

**重要**：PostgreSQL 和 Redis 使用非標準端口（5434、6381）以避免與其他專案衝突。

### 2.2 生產 Dockerfile（主要）

**檔案**：`docker/Dockerfile`（156 行）

4 階段多重建置：

| 階段 | 基礎映像 | 用途 |
|------|----------|------|
| `base` | `node:20-alpine3.17` | 基礎環境 + pnpm 安裝 |
| `deps` | `base` | 安裝所有依賴（`pnpm install --frozen-lockfile`） |
| `builder` | `base` | Prisma generate + `pnpm build --filter=@itpm/web` |
| `runner` | `base` | 生產執行環境（standalone output） |

**關鍵設計決策**：
- 使用 Alpine 3.17（OpenSSL 1.1.x，Prisma 相容）
- **Runtime Prisma 重新生成**：複製 pnpm store 並在 runtime 階段重新 generate（確保 100% 可靠性，+80MB）
- 使用 `node:20-alpine` + non-root user (`nextjs:nodejs`, UID/GID 1001)
- Next.js standalone output（`apps/web/.next/standalone`）
- 內建 HEALTHCHECK（HTTP GET `/api/health`）
- 入口點：`/app/startup.sh`（先跑遷移再啟動應用）

### 2.3 根目錄 Dockerfile

**檔案**：`Dockerfile`（121 行）

3 階段多重建置（較早版本）：

| 階段 | 用途 |
|------|------|
| `deps` | 安裝依賴 |
| `builder` | Prisma generate + build |
| `runner` | 生產環境（手動複製特定 Prisma 版本檔案） |

**差異**：使用硬編碼 Prisma 5.22.0 路徑複製，較 `docker/Dockerfile` 脆弱。入口點使用 `docker-entrypoint.sh`。

### 2.4 遷移專用 Dockerfile

**檔案**：`Dockerfile.migrate`（37 行）

- 基礎映像：`node:20-alpine`
- 全域安裝 `prisma@5.22.0` 和 `tsx@4.7.1`
- 入口點：`scripts/migrate-and-seed.sh`（執行遷移 + 種子資料）
- 使用場景：獨立容器執行資料庫遷移

### 2.5 啟動腳本

**檔案**：`docker-entrypoint.sh`（72 行）

```
1. 檢查 DATABASE_URL 環境變數
2. 執行 prisma migrate deploy
3. 啟動 node apps/web/server.js
```

### 2.6 生產 docker-compose.prod.yml

**檔案**：`docker/docker-compose.prod.yml`

| 服務 | 用途 |
|------|------|
| `web` | Next.js 應用（建置自 `docker/Dockerfile`） |
| `redis` | 本地 Redis（生產環境使用 Azure Cache for Redis） |
| `nginx` | 反向代理 + SSL 終止（可選） |

**注意**：此檔案僅用於本地模擬生產環境，實際生產部署到 Azure App Service。

---

## 3. GitHub Actions CI/CD

### 3.1 CI Pipeline

**檔案**：`.github/workflows/ci.yml`

觸發條件：`push` 到 `main`/`develop` 分支，或 PR 到這些分支

| Job | 內容 | 依賴 |
|-----|------|------|
| `lint-and-typecheck` | ESLint + TypeScript 型別檢查 | — |
| `test` | 單元測試（`pnpm test:ci`） | lint-and-typecheck |
| `build` | 建置檢查（`pnpm build`） | lint-and-typecheck |

環境：Node.js 20, pnpm 8, Ubuntu latest

### 3.2 CD Pipeline — Staging

**檔案**：`.github/workflows/cd.yml`

觸發條件：`push` 到 `main` 分支 或手動觸發

- 建置 + 部署到 Vercel（`amondnet/vercel-action@v25`）
- 執行資料庫遷移
- 別名域名：`staging-itpm.vercel.app`

### 3.3 CD Pipeline — Dev 環境

**檔案**：`.github/workflows/azure-deploy-dev.yml`

觸發條件：`push` 到 `develop` 分支 或手動觸發

| Job | 內容 | 依賴 |
|-----|------|------|
| `test-and-lint` | 測試 + 品質檢查 + pnpm 快取 | — |
| `build-and-deploy` | Docker 建置 → ACR push → Azure App Service 部署 | test-and-lint |
| `notify` | 部署結果通知 | build-and-deploy |

部署目標：`app-itpm-dev-001.azurewebsites.net`

### 3.4 CD Pipeline — Production

**檔案**：`.github/workflows/azure-deploy-prod.yml`（364 行，最完整）

觸發條件：`push` Release Tag (`v*.*.*`) 或手動觸發

| Job | 內容 | 依賴 |
|-----|------|------|
| `test-and-lint` | 完整測試 + pnpm 快取 | — |
| `build` | Docker 建置 → ACR push（3 個 tag：version, sha, latest） | test-and-lint |
| `deploy` | **Staging Slot** → Health Check → Smoke Test → **Slot Swap** → Production Health Check | build |
| `notify` | 部署摘要（成功/失敗） | deploy |

**藍綠部署策略**：
1. 部署到 Staging Slot
2. Health Check（最多 12 次重試，每次 10 秒）
3. Smoke Tests（首頁 + API 健康端點）
4. **Slot Swap**（staging → production）
5. Production Health Check
6. **失敗自動回滾**（swap 回 staging）

部署目標：`app-itpm-prod-001.azurewebsites.net`
資源群組：`rg-itpm-prod`

### 3.5 其他 Workflow

| 檔案 | 用途 |
|------|------|
| `azure-deploy-staging.yml` | Staging 環境部署 |
| `azure-deploy-example.yml` | 部署範本 |

---

## 4. 環境變數配置

### 4.1 環境變數一覽

**檔案**：`.env.example`（260 行）

| 類別 | 變數數量 | 必要程度 |
|------|----------|----------|
| 資料庫 | 2 | REQUIRED |
| NextAuth 認證 | 3 | REQUIRED |
| Azure AD | 4 | OPTIONAL（本地用密碼認證） |
| Azure Blob Storage | 5 | OPTIONAL（本地用 Azurite） |
| SendGrid Email | 3 | REQUIRED |
| Redis | 1 | OPTIONAL |
| 速率限制 | 3 | OPTIONAL |
| 前端公開變數 | 4 | OPTIONAL |
| Feature Flags | 2 | OPTIONAL |
| 開發工具 | 3 | OPTIONAL |
| 測試環境 | 2 | OPTIONAL |
| 安全性 | 2 | OPTIONAL |
| 其他設定 | 4 | OPTIONAL |

### 4.2 關鍵環境變數

```bash
# 必要 — 資料庫
DATABASE_URL="postgresql://postgres:localdev123@localhost:5434/itpm_dev"

# 必要 — 認證
NEXTAUTH_SECRET="..."
NEXTAUTH_URL="http://localhost:3000"

# 必要 — Azure AD（僅雲端環境）
AZURE_AD_TENANT_ID="..."
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."

# 必要 — Email
SENDGRID_API_KEY="..."
SENDGRID_FROM_EMAIL="..."
```

### 4.3 Turborepo 全域環境變數

**檔案**：`turbo.json:4-12`

```json
"globalEnv": [
  "NODE_ENV",
  "DATABASE_URL",
  "NEXTAUTH_SECRET",
  "NEXTAUTH_URL",
  "AZURE_AD_B2C_TENANT_NAME",
  "AZURE_AD_B2C_CLIENT_ID",
  "AZURE_AD_B2C_CLIENT_SECRET"
]
```

**注意**：`turbo.json` 中的環境變數名使用 `AZURE_AD_B2C_*` 前綴，但實際 auth 配置使用 `AZURE_AD_*`（無 B2C）。這是一處**不一致**。

---

## 5. 開發環境設置

### 5.1 系統要求

| 工具 | 版本要求 | 來源 |
|------|----------|------|
| Node.js | >= 20.0.0（固定 20.11.0） | `.nvmrc` |
| pnpm | >= 8.0.0（固定 8.15.3） | `package.json:69` |
| Docker | 需要安裝 | 用於本地服務 |

### 5.2 首次設置流程

```bash
1. pnpm install                    # 安裝依賴
2. cp .env.example .env            # 配置環境變數
3. docker-compose up -d            # 啟動本地服務（PG, Redis, Mailhog, Azurite）
4. pnpm db:migrate                 # 建立資料庫表結構
5. pnpm db:generate                # 生成 Prisma Client
6. pnpm db:seed                    # 種子資料（可選）
7. pnpm check:env                  # 環境檢查（驗證 15+ 項）
8. pnpm dev                        # 啟動開發伺服器
```

或使用一鍵設置：
```bash
pnpm setup                         # install + generate + check:env
```

### 5.3 本地服務端口映射

| 服務 | 本地端口 | 標準端口 | 訪問 URL |
|------|----------|----------|----------|
| Next.js App | 3000 | 3000 | http://localhost:3000 |
| PostgreSQL | **5434** | 5432 | localhost:5434 |
| pgAdmin | 5050 | 80 | http://localhost:5050 |
| Redis | **6381** | 6379 | localhost:6381 |
| Mailhog SMTP | 1025 | 1025 | — |
| Mailhog UI | 8025 | 8025 | http://localhost:8025 |
| Azurite Blob | 10000 | 10000 | http://127.0.0.1:10000 |

### 5.4 自動環境檢查

**檔案**：`scripts/check-environment.js`（`pnpm check:env`）

檢查項目（共 15+ 項）：
- Node.js 版本
- pnpm 安裝
- Docker daemon 狀態
- `.env` 檔案存在
- 必要環境變數
- 依賴安裝狀態
- Prisma Client 生成
- Docker 服務健康（PostgreSQL, Redis, Mailhog）
- 資料庫連線
- 端口可用性

---

## 6. 部署架構總覽

### 6.1 Azure 基礎架構

| 資源 | 用途 |
|------|------|
| Azure App Service | Next.js 應用託管 |
| Azure Container Registry (ACR) | Docker 映像儲存 |
| Azure Database for PostgreSQL 16 | 管理式資料庫 |
| Azure Blob Storage | 檔案上傳（報價單、發票、提案） |
| Azure Cache for Redis | 快取（預留） |
| Azure Application Insights | 監控（可選） |

### 6.2 環境配置

| 環境 | 觸發 | App Service 名稱 | 部署方式 |
|------|------|-------------------|----------|
| Dev | push `develop` | `app-itpm-dev-001` | Docker → ACR → 直接部署 |
| Staging | push `main` | Vercel staging | Vercel Action |
| Production | tag `v*.*.*` | `app-itpm-prod-001` | Docker → ACR → Staging Slot → Swap |

### 6.3 Production 部署安全機制

1. **GitHub Environment Protection**：Production 環境需要手動審批
2. **藍綠部署**：先部署到 Staging Slot，通過檢查後再 Swap
3. **Health Check**：部署後自動檢查（12 次重試 x 10 秒）
4. **Smoke Tests**：首頁可訪問性 + API 健康端點
5. **自動回滾**：Health Check 失敗時自動 Swap 回去
6. **版本追蹤**：3 個 Docker tag（version, commit SHA, latest）
