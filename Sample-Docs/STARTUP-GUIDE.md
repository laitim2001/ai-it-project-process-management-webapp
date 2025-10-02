# 🚀 AI 銷售賦能平台 - 服務啟動指南

> **版本**: v2.0.0 (更新至 MVP Phase 2 Sprint 5)
> **目的**: 提供開發團隊和新成員快速啟動所有服務的標準流程
> **適用**: 本地開發環境
> **最後更新**: 2025-10-02
> **變更記錄**: 新增Redis、監控系統、通知系統、工作流程引擎配置

---

## 📋 **快速啟動 (5分鐘)**

### 🎯 **一鍵啟動命令**
```bash
# 1. 複製並配置環境變數
cp .env.example .env.local
# 編輯 .env.local 填入必要配置（詳見下方）

# 2. 啟動基礎服務 (PostgreSQL + Redis)
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 3. 等待服務就緒 (約30秒)
sleep 30

# 4. 初始化資料庫
npx prisma generate
npx prisma db push

# 5. 環境配置檢查
npm run env:check

# 6. 啟動 Next.js 應用
npm run dev
```

### 🔧 **快速診斷和修復**
如遇問題，使用自動化工具：
```bash
npm run fix:diagnose    # 診斷系統問題
npm run fix:all         # 執行所有自動修復
npm run env:setup       # 互動式環境設置
```

---

## 🔧 **詳細啟動流程**

### **Step 1: 環境準備** (首次執行必須)

#### 1.1 檢查系統需求
```bash
# 檢查 Node.js 版本 (需要 18+)
node --version

# 檢查 npm 版本 (需要 8+)
npm --version

# 檢查 Docker 版本
docker --version
docker-compose --version
```

#### 1.2 安裝依賴
```bash
# 安裝 Node.js 依賴
npm install

# 安裝 POC 測試依賴
cd poc && npm install && cd ..
```

#### 1.3 環境變數配置
```bash
# 複製環境變數範例
cp .env.example .env.local

# 編輯 .env.local 填入實際值:

# ============================================
# 🔴 必需配置（核心功能）
# ============================================

# 1. 資料庫連接 (使用Docker預設值)
DATABASE_URL="postgresql://postgres:dev_password_123@localhost:5433/ai_sales_db"

# 2. JWT 認證 (至少32字符)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRES_IN="7d"

# 3. Azure OpenAI (必需)
AZURE_OPENAI_API_KEY="your-azure-openai-api-key"
AZURE_OPENAI_ENDPOINT="https://your-resource.openai.azure.com/"
AZURE_OPENAI_API_VERSION="2024-02-01"
AZURE_OPENAI_DEPLOYMENT_ID_GPT4="gpt-4"
AZURE_OPENAI_DEPLOYMENT_ID_EMBEDDINGS="text-embedding-ada-002"

# 4. Dynamics 365 CRM (必需)
DYNAMICS_365_TENANT_ID="your-azure-tenant-id"
DYNAMICS_365_CLIENT_ID="your-app-client-id"
DYNAMICS_365_CLIENT_SECRET="your-app-client-secret"
DYNAMICS_365_RESOURCE="https://your-org.crm5.dynamics.com/"

# ============================================
# 🟡 推薦配置（企業功能 - MVP Phase 2）
# ============================================

# 5. Azure AD SSO (Sprint 1實現 - 單一登入)
AZURE_AD_CLIENT_ID="your-azure-ad-client-id"
AZURE_AD_CLIENT_SECRET="your-azure-ad-client-secret"
AZURE_AD_TENANT_ID="your-azure-ad-tenant-id"

# 6. 郵件服務 (Sprint 5實現 - 通知系統)
EMAIL_SERVICE_API_KEY="your-sendgrid-api-key"
EMAIL_FROM_ADDRESS="noreply@your-domain.com"
EMAIL_FROM_NAME="AI Sales Platform"
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASS="your-sendgrid-api-key"

# ============================================
# 🟢 可選配置（開發輔助）
# ============================================

# 7. 監控系統 (Sprint 2實現 - 可選)
ENABLE_TELEMETRY="true"
OTEL_SERVICE_NAME="ai-sales-enablement-dev"

# 8. 功能開關
FEATURE_FLAG_AI_PROPOSALS="1"
FEATURE_FLAG_CRM_SYNC="1"
FEATURE_FLAG_ADVANCED_SEARCH="1"
```

**💡 提示**:
- 運行 `npm run env:check` 檢查配置完整性
- 運行 `npm run env:setup` 進行自動配置引導
- 運行 `npm run env:auto-fix` 自動修復常見配置問題

### **Step 2: 啟動基礎服務** (必須按順序)

#### 2.1 同時啟動資料庫和快取服務
```bash
# 啟動 PostgreSQL + pgvector + Redis
docker-compose -f docker-compose.dev.yml up -d postgres redis

# 等待服務啟動 (約30秒)
echo "等待服務啟動..."
sleep 30

# 查看服務日誌
docker-compose -f docker-compose.dev.yml logs postgres redis
```

#### 2.2 驗證服務狀態
```bash
# 驗證 PostgreSQL + pgvector 擴展
docker exec ai-sales-postgres-dev \
  psql -U postgres -d ai_sales_db -c "SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';"
# 期望輸出: vector | 0.5.1 (或更高版本)

# 驗證 Redis 連接
docker exec ai-sales-redis-dev redis-cli ping
# 期望輸出: PONG

# 驗證 Redis 版本
docker exec ai-sales-redis-dev redis-cli INFO server | grep redis_version
# 期望輸出: redis_version:7.x.x
```

**📝 Redis 用途說明** (MVP Phase 2):
- 🔐 用戶會話管理
- ⚡ API響應緩存 (Sprint 4 - 性能優化)
- 🚦 速率限制記錄 (Sprint 1 - API Gateway)
- 🔔 通知系統臨時存儲 (Sprint 5)

#### 2.3 初始化資料庫
```bash
# 生成 Prisma Client
npx prisma generate

# 推送 schema 到資料庫
npx prisma db push

# 驗證表創建
npx prisma studio &
```

### **Step 3: 驗證外部服務**

#### 3.1 執行 POC 測試
```bash
# 進入 POC 目錄
cd poc

# 運行所有測試
node run-all-tests.js

# 檢查測試結果
cat poc-test-report.json
```

**期望結果**:
- ✅ Dynamics 365: 模擬模式通過
- ✅ PostgreSQL + pgvector: 連接和性能測試通過
- ✅ Azure OpenAI: 基本連接通過

### **Step 4: 啟動應用服務**

#### 4.1 啟動 Next.js 開發服務器
```bash
# 返回根目錄
cd ..

# 啟動開發服務器
npm run dev
```

#### 4.2 驗證服務運行狀態
```bash
# 檢查健康狀態
curl http://localhost:3000/api/health

# 測試認證 API
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPassword123!","firstName":"Test","lastName":"User"}'
```

### **Step 5: 啟動監控系統（可選 - MVP Phase 2 Sprint 2）**

> **💡 提示**：監控系統對生產環境強烈推薦，開發環境可選

#### 5.1 啟動監控堆棧
```bash
# 啟動完整監控服務
docker-compose -f docker-compose.monitoring.yml up -d

# 等待服務啟動（約20秒）
sleep 20

# 驗證監控服務狀態
docker-compose -f docker-compose.monitoring.yml ps
```

#### 5.2 驗證監控服務
```bash
# Grafana 健康檢查
curl http://localhost:3001/api/health
# 期望輸出: {"database":"ok",...}

# Prometheus 健康檢查
curl http://localhost:9090/-/healthy
# 期望輸出: Prometheus is Healthy.

# Jaeger 健康檢查
curl -I http://localhost:16686/
# 期望輸出: HTTP/1.1 200 OK

# Alertmanager 健康檢查
curl http://localhost:9093/-/healthy
# 期望輸出: OK
```

#### 5.3 訪問監控儀表板
```bash
# Grafana（監控儀表板）
open http://localhost:3001
# 預設登入: admin / admin
# 首次登入後會要求修改密碼

# Prometheus（指標查詢）
open http://localhost:9090

# Jaeger（分散式追蹤）
open http://localhost:16686

# Alertmanager（告警管理）
open http://localhost:9093
```

#### 5.4 配置 Grafana 儀表板
```bash
# 1. 登入 Grafana (admin/admin)
# 2. 添加 Prometheus 數據源
#    - Configuration → Data Sources → Add data source
#    - 選擇 Prometheus
#    - URL: http://prometheus:9090
#    - 點擊 "Save & Test"

# 3. 導入預設儀表板
#    - Dashboards → Import
#    - 上傳 monitoring/grafana/dashboards/*.json
#    - 或使用儀表板 ID: 1860 (Node Exporter Full)
```

**📊 監控系統功能**：
- ✅ 應用程式性能指標（響應時間、請求量、錯誤率）
- ✅ 資料庫查詢統計和連接池狀態
- ✅ Redis 緩存命中率和記憶體使用
- ✅ API Gateway 速率限制和安全事件
- ✅ 通知系統發送統計（Sprint 5）
- ✅ 工作流程引擎狀態轉換追蹤（Sprint 5）
- ✅ 分散式請求鏈路追蹤
- ✅ 告警規則和通知配置

---

## 📊 **服務端口分配**

### 核心服務 (必需)
| 服務 | 端口 | 用途 | 健康檢查 | 狀態 |
|------|------|------|----------|------|
| **Next.js App** | 3000 | 主應用程式 | `http://localhost:3000/api/health` | ✅ MVP1+2 |
| **PostgreSQL** | 5433 | 主資料庫 + pgvector | `docker exec ai-sales-postgres-dev pg_isready` | ✅ MVP1+2 |
| **Redis** | 6379 | 快取/會話服務 | `docker exec ai-sales-redis-dev redis-cli ping` | ✅ MVP2 Sprint 1 |

### 監控服務 (可選 - Sprint 2實現)
| 服務 | 端口 | 用途 | 健康檢查 | 狀態 |
|------|------|------|----------|------|
| **Grafana** | 3001 | 監控儀表板 | `http://localhost:3001/api/health` | ✅ MVP2 Sprint 2 |
| **Prometheus** | 9090 | 指標收集 | `http://localhost:9090/-/healthy` | ✅ MVP2 Sprint 2 |
| **Jaeger** | 16686 | 分散式追蹤 | `http://localhost:16686/` | ✅ MVP2 Sprint 2 |
| **Alertmanager** | 9093 | 告警管理 | `http://localhost:9093/-/healthy` | ✅ MVP2 Sprint 2 |

### 開發工具 (可選)
| 服務 | 端口 | 用途 | 健康檢查 | 狀態 |
|------|------|------|----------|------|
| **Prisma Studio** | 5555 | 資料庫 GUI | `http://localhost:5555` | ✅ 開發工具 |
| **pgAdmin** | 8080 | 資料庫管理 | `http://localhost:8080` | 🟡 可選配置 |

**💡 快速訪問連結**:
- 主應用: http://localhost:3000
- API健康: http://localhost:3000/api/health
- Grafana監控: http://localhost:3001 (admin/admin)
- Prometheus: http://localhost:9090
- Jaeger追蹤: http://localhost:16686
- Prisma Studio: http://localhost:5555

---

## 🔍 **問題排除指南**

### 常見問題 1: 端口衝突
```bash
# 檢查端口使用情況
netstat -an | grep :5433
netstat -an | grep :3000

# 強制停止服務
docker-compose -f docker-compose.dev.yml down
fuser -k 3000/tcp  # Linux/Mac
# Windows: netstat -ano | findstr :3000
```

### 常見問題 2: 資料庫連接失敗
```bash
# 檢查環境變數
echo $DATABASE_URL

# 重新生成 Prisma Client
rm -rf node_modules/.prisma
npx prisma generate

# 重置資料庫
npx prisma db push --force-reset
```

### 常見問題 3: Azure OpenAI 連接失敗
```bash
# 檢查 API 密鑰配置
echo $AZURE_OPENAI_API_KEY

# 測試基本連接
cd poc && node azure-openai-cost-test.js
```

### 常見問題 4: Redis 連接問題（MVP Phase 2）
```bash
# 檢查 Redis 容器狀態
docker ps | grep redis

# 測試 Redis 連接
docker exec ai-sales-redis-dev redis-cli ping
# 期望輸出: PONG

# 檢查 Redis 記憶體使用
docker exec ai-sales-redis-dev redis-cli INFO memory

# 清空 Redis 緩存（開發環境）
docker exec ai-sales-redis-dev redis-cli FLUSHALL

# 重啟 Redis 容器
docker-compose -f docker-compose.dev.yml restart redis
```

### 常見問題 5: 監控系統啟動失敗（Sprint 2）
```bash
# 檢查監控容器狀態
docker-compose -f docker-compose.monitoring.yml ps

# 查看 Grafana 日誌
docker-compose -f docker-compose.monitoring.yml logs grafana

# 查看 Prometheus 日誌
docker-compose -f docker-compose.monitoring.yml logs prometheus

# 重啟監控堆棧
docker-compose -f docker-compose.monitoring.yml down
docker-compose -f docker-compose.monitoring.yml up -d

# 檢查端口衝突
netstat -an | grep -E ":(3001|9090|16686|9093)"
```

### 常見問題 6: 通知系統錯誤（Sprint 5）
```bash
# 檢查郵件服務配置
npm run env:check | grep EMAIL

# 測試 SendGrid 連接
curl -X POST http://localhost:3000/api/notifications/email/test

# 檢查通知系統日誌
docker-compose -f docker-compose.dev.yml logs app | grep notification

# 驗證通知資料表
npx prisma studio
# 導航到 Notification 表檢查數據
```

### 常見問題 7: 工作流程引擎問題（Sprint 5）
```bash
# 檢查工作流程狀態機配置
npm run test:workflow

# 查看工作流程日誌
docker-compose -f docker-compose.dev.yml logs app | grep workflow

# 重置工作流程測試數據
npm run db:seed -- --only-workflows

# 驗證工作流程資料表
npx prisma studio
# 檢查 Workflow、WorkflowVersion、WorkflowComment 表
```

### 常見問題 8: TypeScript 編譯錯誤
```bash
# 清理並重新生成類型
rm -rf node_modules/.cache
rm -rf .next
npx prisma generate
npm run build

# 檢查類型錯誤
npx tsc --noEmit

# 修復 ESLint 問題
npm run lint -- --fix
```

---

## 🚨 **緊急重啟流程**

當服務出現問題時，按以下順序重啟：

```bash
# 1. 停止所有服務
docker-compose -f docker-compose.dev.yml down
pkill -f "npm run dev"

# 2. 清理容器和緩存
docker system prune -f
npm cache clean --force

# 3. 重新啟動 (按順序)
docker-compose -f docker-compose.dev.yml up -d postgres redis
sleep 30
npm run dev
```

---

## 📋 **服務狀態檢查清單**

### 每日開發啟動檢查
- [ ] ✅ PostgreSQL 容器運行且健康
- [ ] ✅ Redis 容器運行且響應
- [ ] ✅ pgvector 擴展已安裝
- [ ] ✅ Prisma Client 已生成
- [ ] ✅ 環境變數正確配置
- [ ] ✅ Azure OpenAI API 可連接
- [ ] ✅ Next.js 應用正常啟動
- [ ] ✅ 健康檢查 API 返回 200

### 新環境設置檢查
- [ ] ✅ Node.js 18+ 已安裝
- [ ] ✅ Docker 和 Docker Compose 已安裝
- [ ] ✅ 環境變數已配置
- [ ] ✅ POC 測試全部通過
- [ ] ✅ 資料庫 schema 已部署
- [ ] ✅ 所有服務端口正常

---

## 🚀 **常用開發命令參考**

### 環境管理與診斷
```bash
# 環境配置檢查和修復 (MVP Phase 2 新增)
npm run env:check                # 檢查環境配置完整性
npm run env:setup                # 互動式環境設置引導
npm run env:auto-fix             # 自動修復常見配置問題

# 快速問題診斷和修復 (MVP Phase 2 新增)
npm run fix:diagnose             # 診斷系統問題
npm run fix:all                  # 執行所有自動修復
npm run fix:deps                 # 修復npm依賴問題
npm run fix:restart              # 重啟所有服務
```

### 資料庫操作
```bash
# Prisma 資料庫管理
npm run db:generate              # 生成Prisma Client
npm run db:push                  # 推送schema到資料庫（開發用）
npm run db:migrate               # 創建和應用遷移（生產用）
npm run db:studio                # 啟動Prisma Studio GUI
npm run db:seed                  # 載入種子數據

# 直接資料庫操作
docker exec ai-sales-postgres-dev psql -U postgres -d ai_sales_db
```

### 應用程式開發
```bash
# Next.js 開發
npm run dev                      # 啟動開發服務器
npm run build                    # 構建生產版本
npm run start                    # 啟動生產服務器
npm run lint                     # ESLint檢查
npm run type-check               # TypeScript類型檢查
```

### 測試執行
```bash
# 單元測試
npm run test                     # 執行所有單元測試
npm run test:watch               # 監視模式執行測試
npm run test:coverage            # 生成測試覆蓋率報告

# 工作流程測試 (Sprint 5實現)
npm run test:workflow            # 工作流程引擎測試
npm run test:workflow:watch      # 監視模式
npm run test:workflow:coverage   # 覆蓋率報告

# 端到端測試
npm run test:e2e                 # 執行E2E測試
npm run test:e2e:ui              # Playwright UI模式
npm run test:e2e:knowledge       # 知識庫功能E2E測試

# 整合測試
npm run test:integration         # 所有整合測試
npm run test:integration:crm     # CRM整合測試
npm run test:integration:system  # 系統整合測試
```

### Docker 容器管理
```bash
# 開發環境
npm run docker:dev               # 啟動開發環境（= docker-compose up）
docker-compose -f docker-compose.dev.yml up -d        # 背景啟動
docker-compose -f docker-compose.dev.yml down         # 停止並移除
docker-compose -f docker-compose.dev.yml restart      # 重啟服務
docker-compose -f docker-compose.dev.yml logs -f      # 查看即時日誌

# 生產環境
npm run docker:prod              # 啟動生產環境
npm run docker:build             # 構建Docker鏡像

# 監控堆棧 (Sprint 2實現 - 可選)
docker-compose -f docker-compose.monitoring.yml up -d     # 啟動監控服務
docker-compose -f docker-compose.monitoring.yml down      # 停止監控服務
```

### 服務健康檢查
```bash
# 應用程式健康
curl http://localhost:3000/api/health

# 資料庫健康
docker exec ai-sales-postgres-dev pg_isready -U postgres

# Redis健康
docker exec ai-sales-redis-dev redis-cli ping

# 所有容器狀態
docker-compose -f docker-compose.dev.yml ps

# 查看特定服務日誌
docker-compose -f docker-compose.dev.yml logs postgres
docker-compose -f docker-compose.dev.yml logs redis
docker-compose -f docker-compose.dev.yml logs -f app  # 即時日誌
```

### POC 測試 (外部服務驗證)
```bash
# 進入POC目錄執行測試
cd poc

# 執行所有POC測試
node run-all-tests.js

# 單獨測試各服務
node azure-openai-basic-test.js       # Azure OpenAI連接
node dynamics-365-test.js             # Dynamics 365整合
node pgvector-performance-test.js     # pgvector性能

# 返回項目根目錄
cd ..
```

---

## 🔄 **服務依賴關係圖** (MVP Phase 2 完整架構)

```
┌─────────────────────────────────────────────────────────────────┐
│                     外部服務 (雲端)                              │
│                                                                  │
│  Azure OpenAI API ────┐                                         │
│  (GPT-4 + Embeddings) │                                         │
│                       │                                         │
│  Dynamics 365 CRM ────┤                                         │
│  (客戶資料)            │                                         │
│                       │                                         │
│  Azure AD (SSO) ──────┤                                         │
│  (單一登入)            │                                         │
│                       │                                         │
│  SendGrid (Email) ────┤                                         │
│  (郵件通知)            │                                         │
└───────────────────────┼─────────────────────────────────────────┘
                        │
                        ▼
         ┌──────────────────────────────────┐
         │   Next.js App (port 3000)        │
         │   ✅ MVP Phase 1 + 2 完成         │
         │                                  │
         │  ┌─────────────────────────┐    │
         │  │ API Gateway (Sprint 1)  │    │
         │  │ - 10個核心中間件         │    │
         │  │ - 速率限制/CORS/安全     │    │
         │  └─────────────────────────┘    │
         │  ┌─────────────────────────┐    │
         │  │ 通知系統 (Sprint 5)     │    │
         │  │ - 站內/郵件通知          │    │
         │  │ - 工作流程整合          │    │
         │  └─────────────────────────┘    │
         │  ┌─────────────────────────┐    │
         │  │ 工作流程引擎 (Sprint 5) │    │
         │  │ - 12狀態機              │    │
         │  │ - 版本控制/評論/審批     │    │
         │  └─────────────────────────┘    │
         │  ┌─────────────────────────┐    │
         │  │ 性能優化 (Sprint 4)     │    │
         │  │ - API緩存/DataLoader    │    │
         │  │ - 熔斷器/重試策略        │    │
         │  └─────────────────────────┘    │
         └──────────┬───────────┬───────────┘
                    │           │
            ┌───────▼───┐   ┌──▼──────────┐
            │  Redis    │   │  Prisma     │
            │ (port     │   │  Client     │
            │  6379)    │   │             │
            │           │   └──────┬──────┘
            │ ✅ MVP2   │          │
            │ - 會話    │          │
            │ - 緩存    │          ▼
            │ - 速率    │   ┌─────────────────┐
            │   限制    │   │  PostgreSQL     │
            └───────────┘   │  + pgvector     │
                            │  (port 5433)    │
                            │                 │
                            │  ✅ MVP1+2      │
                            │  - 用戶/知識庫  │
                            │  - 工作流程     │
                            │  - 通知         │
                            └─────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              監控系統 (可選 - Sprint 2)                          │
│                                                                  │
│  Grafana (3001) ───┬─── Prometheus (9090) ─── 指標收集          │
│  儀表板/告警       │                                             │
│                    └─── Jaeger (16686) ────── 分散式追蹤        │
│                                                                  │
│  Alertmanager (9093) ────────────────────── 告警管理            │
└─────────────────────────────────────────────────────────────────┘

開發工具 (可選):
  - Prisma Studio (5555) - 資料庫 GUI
  - pgAdmin (8080) - PostgreSQL 管理
```

**📝 說明**:
- ✅ 表示已實現並穩定運行
- 🔄 表示開發中
- 監控系統為可選配置，適合完整開發體驗

---

## 📞 **支援和文檔**

- **技術問題**: 檢查 `poc/README.md` 的故障排除章節
- **API 文檔**: 查看 `docs/api-specification.md`
- **資料庫 Schema**: 查看 `prisma/schema.prisma`
- **環境配置**: 查看 `.env.example` 的詳細說明

---

**🎯 此文檔應在每次服務配置變更後更新，確保團隊成員都能快速啟動開發環境！**