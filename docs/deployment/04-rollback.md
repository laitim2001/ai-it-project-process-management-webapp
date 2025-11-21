# Azure 部署回滾指南

**最後更新**: 2025-11-20
**適用環境**: Development, Staging, Production

---

## 📋 目錄

- [回滾策略概覽](#回滾策略概覽)
- [緊急回滾程序](#緊急回滾程序)
- [使用部署槽位回滾](#使用部署槽位回滾)
- [使用 Docker 鏡像版本回滾](#使用-docker-鏡像版本回滾)
- [資料庫回滾](#資料庫回滾)
- [完整系統回滾](#完整系統回滾)
- [回滾後驗證](#回滾後驗證)
- [常見回滾場景](#常見回滾場景)

---

## 🎯 回滾策略概覽

### 回滾級別

| 級別 | 影響範圍 | 回滾時間 | 適用場景 |
|------|---------|---------|---------|
| **🟢 應用層回滾** | 僅應用程式碼 | 1-3 分鐘 | 應用 Bug、性能問題 |
| **🟡 配置回滾** | 環境變數、設定 | 2-5 分鐘 | 配置錯誤 |
| **🟠 資料庫回滾** | Schema + 數據 | 5-30 分鐘 | 遷移失敗、數據損壞 |
| **🔴 完整系統回滾** | 所有組件 | 10-60 分鐘 | 重大故障 |

### 回滾決策矩陣

```
問題嚴重性？
├─ 🟢 輕微（部分功能受影響）
│   → 使用部署槽位交換回滾（1-3 分鐘）
│
├─ 🟡 中等（核心功能受影響）
│   → 使用 Docker 鏡像版本回滾（2-5 分鐘）
│
├─ 🟠 嚴重（數據完整性問題）
│   → 資料庫 + 應用一起回滾（10-30 分鐘）
│
└─ 🔴 災難性（服務完全中斷）
    → 完整系統回滾（30-60 分鐘）
```

---

## 🚨 緊急回滾程序

### 快速回滾決策（< 2 分鐘）

#### 步驟 1: 評估影響範圍
```bash
# 檢查應用狀態
az webapp show --name app-itpm-prod-001 --resource-group rg-itpm-prod \
  --query "{Name:name, State:state, HealthState:healthState}" -o table

# 查看錯誤日誌（最近 100 條）
az webapp log tail --name app-itpm-prod-001 --resource-group rg-itpm-prod --limit 100
```

#### 步驟 2: 判斷回滾類型

**應用層問題 → 使用部署槽位回滾**:
- HTTP 500 錯誤
- 應用崩潰
- 性能嚴重下降

**資料庫問題 → 需要資料庫回滾**:
- Prisma 遷移失敗
- 數據完整性錯誤
- 查詢異常

**配置問題 → 配置回滾**:
- 環境變數錯誤
- Key Vault 引用失敗
- 連接字串問題

#### 步驟 3: 執行對應回滾程序
參考本文檔對應章節。

---

## 🔄 使用部署槽位回滾

### 概覽
- **適用環境**: Staging, Production（Dev 環境無部署槽位）
- **回滾時間**: 1-3 分鐘
- **數據影響**: 無（僅應用程式碼）
- **風險等級**: 🟢 低風險

### 前置條件
- 生產環境有 `staging` 槽位
- 上一次部署使用了槽位交換

### 回滾步驟

#### 步驟 1: 確認目前槽位狀態
```bash
# 設置環境變數
ENVIRONMENT="prod"  # 或 staging
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"

# 查看生產槽位版本
az webapp deployment list --name $APP_NAME --resource-group $RG_NAME \
  --query "[0].{Status:status, Time:start_time, Version:id}" -o table

# 查看 staging 槽位版本
az webapp deployment slot list --name $APP_NAME --resource-group $RG_NAME \
  --query "[?name=='staging'].{Slot:name, State:state}" -o table
```

#### 步驟 2: 執行槽位交換回滾
```bash
# 交換槽位（將 staging 的舊版本換回 production）
az webapp deployment slot swap \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --slot staging \
  --target-slot production

# 輸出範例:
# Swapping slots "staging" and "production" for webapp "app-itpm-prod-001"...
# Swap completed successfully.
```

#### 步驟 3: 驗證回滾成功
```bash
# 等待 30 秒讓應用啟動
sleep 30

# 檢查應用健康狀態
APP_URL="https://${APP_NAME}.azurewebsites.net"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL")

if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
    echo "✅ 回滾成功！應用正常運行 (HTTP $HTTP_STATUS)"
else
    echo "❌ 回滾後應用異常 (HTTP $HTTP_STATUS)"
    echo "查看日誌: az webapp log tail --name $APP_NAME --resource-group $RG_NAME"
fi
```

#### 步驟 4: 通知團隊
```bash
# 記錄回滾操作
cat > rollback-log-$(date +%Y%m%d-%H%M%S).txt <<EOF
回滾記錄
========
環境: $ENVIRONMENT
應用: $APP_NAME
回滾時間: $(date '+%Y-%m-%d %H:%M:%S')
回滾類型: 部署槽位交換
執行者: $(az account show --query "user.name" -o tsv)
原因: [填寫回滾原因]
驗證結果: HTTP $HTTP_STATUS
EOF
```

---

## 🐳 使用 Docker 鏡像版本回滾

### 概覽
- **適用環境**: Dev, Staging, Production
- **回滾時間**: 2-5 分鐘
- **數據影響**: 無（僅應用程式碼）
- **風險等級**: 🟢 低風險

### 前置條件
- ACR 中保留了上一個版本的鏡像
- 知道上一個穩定版本的鏡像標籤

### 回滾步驟

#### 步驟 1: 查找穩定版本鏡像
```bash
# 設置環境變數
ENVIRONMENT="prod"
ACR_NAME="acritpm${ENVIRONMENT}"
IMAGE_NAME="itpm-web"
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"

# 列出最近 10 個鏡像版本（按時間倒序）
az acr repository show-tags \
  --name $ACR_NAME \
  --repository $IMAGE_NAME \
  --orderby time_desc \
  --top 10 \
  --output table

# 輸出範例:
# Result
# --------
# v1.0.5      <- 當前有問題的版本
# v1.0.4      <- 上一個穩定版本 ✅
# v1.0.3
# v1.0.2
```

#### 步驟 2: 確定回滾目標版本
```bash
# 假設我們要回滾到 v1.0.4
TARGET_VERSION="v1.0.4"
FULL_IMAGE_NAME="${ACR_NAME}.azurecr.io/${IMAGE_NAME}:${TARGET_VERSION}"

echo "準備回滾到鏡像: $FULL_IMAGE_NAME"
```

#### 步驟 3: 更新 App Service 配置
```bash
# 更新容器鏡像配置
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --docker-custom-image-name $FULL_IMAGE_NAME \
  --docker-registry-server-url "https://${ACR_NAME}.azurecr.io"

# 輸出:
# {
#   "linuxFxVersion": "DOCKER|acritpmprod.azurecr.io/itpm-web:v1.0.4"
# }
```

#### 步驟 4: 重啟應用
```bash
# 重啟 App Service
az webapp restart --name $APP_NAME --resource-group $RG_NAME

echo "⏳ 等待應用啟動（最多 2 分鐘）..."

# 等待健康檢查
MAX_RETRIES=24  # 24 x 5 秒 = 2 分鐘
RETRY_COUNT=0
APP_URL="https://${APP_NAME}.azurewebsites.net"

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$APP_URL" || echo "000")

    if [ "$HTTP_STATUS" == "200" ] || [ "$HTTP_STATUS" == "302" ]; then
        echo "✅ 回滾成功！應用已恢復正常 (HTTP $HTTP_STATUS)"
        break
    fi

    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "等待中... ($RETRY_COUNT/$MAX_RETRIES) HTTP: $HTTP_STATUS"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ 回滾後應用仍未恢復，需要進一步排查"
    echo "查看日誌: az webapp log tail --name $APP_NAME --resource-group $RG_NAME"
fi
```

#### 步驟 5: 驗證鏡像版本
```bash
# 確認當前運行的鏡像版本
az webapp config show \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --query "linuxFxVersion" -o tsv

# 預期輸出:
# DOCKER|acritpmprod.azurecr.io/itpm-web:v1.0.4
```

---

## 🗄️ 資料庫回滾

### 概覽
- **適用環境**: Dev, Staging, Production
- **回滾時間**: 5-30 分鐘（取決於數據量）
- **數據影響**: ⚠️ **高風險** - 可能丟失數據
- **風險等級**: 🔴 高風險

### ⚠️ 警告

**資料庫回滾是高風險操作**：
- 回滾會丟失回滾點之後的所有數據變更
- 必須確保應用程式碼與資料庫 schema 匹配
- 建議在非營業時間執行
- 生產環境回滾需要獲得主管批准

### 方案 A: 使用 Prisma 遷移回滾（推薦）

#### 前置條件
- Prisma 遷移歷史記錄完整
- 知道目標遷移版本

#### 步驟 1: 查看遷移歷史
```bash
# 本地查看遷移文件
ls -lt packages/db/prisma/migrations/

# 輸出範例:
# 20250115120000_add_notification_system/    <- 最新（有問題）
# 20250110100000_add_expense_approval/        <- 目標回滾點 ✅
# 20250105080000_initial_setup/
```

#### 步驟 2: 連接到資料庫並檢查遷移狀態
```bash
# 設置環境變數（生產環境需要從 Key Vault 獲取）
export DATABASE_URL="postgresql://[user]:[pass]@psql-itpm-prod-001.postgres.database.azure.com:5432/itpm_prod?sslmode=require"

# 查看已應用的遷移
npx prisma migrate status

# 輸出範例:
# Database schema is up to date!
#
# Following migration have been applied:
# 20250105080000_initial_setup
# 20250110100000_add_expense_approval
# 20250115120000_add_notification_system  <- 需要回滾
```

#### 步驟 3: 執行資料庫回滾（慎重！）

**⚠️ 重要**: Prisma 不直接支援 "undo" 遷移。需要手動處理：

**選項 1: 創建反向遷移（推薦）**
```bash
# 1. 創建反向遷移來撤銷更改
npx prisma migrate dev --name revert_notification_system --create-only

# 2. 手動編輯生成的遷移文件，撰寫反向 SQL
# 例如：packages/db/prisma/migrations/[timestamp]_revert_notification_system/migration.sql

-- 撤銷 Notification 表創建
DROP TABLE IF EXISTS "Notification";

-- 撤銷其他相關更改
-- ...

# 3. 應用反向遷移
npx prisma migrate deploy
```

**選項 2: 使用 Prisma migrate resolve（標記為已回滾）**
```bash
# 標記問題遷移為已回滾（不會真正修改資料庫）
npx prisma migrate resolve --rolled-back 20250115120000_add_notification_system

# 然後手動執行 SQL 來撤銷更改
psql "$DATABASE_URL" <<EOF
-- 手動撤銷更改
DROP TABLE IF EXISTS "Notification";
EOF
```

#### 步驟 4: 更新 Prisma Schema
```bash
# 修改 packages/db/prisma/schema.prisma
# 移除或註釋掉已回滾的模型定義

# 重新生成 Prisma Client
pnpm db:generate
```

#### 步驟 5: 驗證資料庫狀態
```bash
# 檢查遷移狀態
npx prisma migrate status

# 連接到資料庫驗證
psql "$DATABASE_URL" -c "\dt"  # 列出所有表

# 確認問題表已刪除
psql "$DATABASE_URL" -c "SELECT * FROM \"Notification\";"
# 預期: ERROR:  relation "Notification" does not exist
```

### 方案 B: 使用 Azure 備份恢復（災難恢復）

#### 前置條件
- Azure PostgreSQL 自動備份已啟用
- 知道恢復時間點（Point-in-Time）

#### 步驟 1: 查看可用備份
```bash
ENVIRONMENT="prod"
SERVER_NAME="psql-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"

# 查看備份保留策略
az postgres flexible-server show \
  --name $SERVER_NAME \
  --resource-group $RG_NAME \
  --query "{Name:name, BackupRetentionDays:backup.backupRetentionDays, EarliestRestoreDate:backup.earliestRestoreDate}" -o table

# 輸出範例:
# Name                    BackupRetentionDays    EarliestRestoreDate
# ----------------------  ---------------------  ------------------------
# psql-itpm-prod-001      35                     2025-01-01T00:00:00+00:00
```

#### 步驟 2: 執行時間點恢復（創建新伺服器）

**⚠️ 注意**: Azure PostgreSQL 時間點恢復會創建新伺服器，不會覆蓋原伺服器

```bash
# 設置恢復時間點（問題發生前的時間）
RESTORE_TIME="2025-01-14T23:59:00+00:00"  # UTC 時間
NEW_SERVER_NAME="psql-itpm-${ENVIRONMENT}-001-restored"

# 執行時間點恢復
az postgres flexible-server restore \
  --name $NEW_SERVER_NAME \
  --resource-group $RG_NAME \
  --source-server $SERVER_NAME \
  --restore-time "$RESTORE_TIME"

# 此過程需要 10-30 分鐘
```

#### 步驟 3: 驗證恢復的資料庫
```bash
# 獲取新伺服器連接字串
NEW_DB_URL=$(az postgres flexible-server show \
  --name $NEW_SERVER_NAME \
  --resource-group $RG_NAME \
  --query "fullyQualifiedDomainName" -o tsv)

echo "恢復的資料庫: $NEW_DB_URL"

# 連接並驗證數據
psql "postgresql://[user]:[pass]@${NEW_DB_URL}:5432/itpm_prod?sslmode=require" <<EOF
-- 驗證關鍵數據
SELECT COUNT(*) FROM "Project";
SELECT COUNT(*) FROM "Expense";
-- 確認問題表不存在或數據正確
SELECT COUNT(*) FROM "Notification";
EOF
```

#### 步驟 4: 切換應用到恢復的資料庫

**⚠️ 慎重**: 此操作會導致服務中斷

```bash
# 1. 停止應用（避免數據寫入）
az webapp stop --name app-itpm-${ENVIRONMENT}-001 --resource-group $RG_NAME

# 2. 更新 Key Vault 中的 DATABASE_URL
KV_NAME="kv-itpm-${ENVIRONMENT}"
NEW_DATABASE_URL="postgresql://[user]:[pass]@${NEW_DB_URL}:5432/itpm_prod?sslmode=require"

az keyvault secret set \
  --vault-name $KV_NAME \
  --name "ITPM-${ENVIRONMENT^^}-DATABASE-URL" \
  --value "$NEW_DATABASE_URL"

# 3. 重啟應用（會重新讀取 Key Vault）
az webapp start --name app-itpm-${ENVIRONMENT}-001 --resource-group $RG_NAME

# 4. 等待應用啟動並驗證
sleep 60
az webapp show --name app-itpm-${ENVIRONMENT}-001 --resource-group $RG_NAME \
  --query "{State:state, HealthState:healthState}" -o table
```

#### 步驟 5: 刪除舊伺服器（可選，建議保留 24 小時）
```bash
# 24 小時後，如果確認新伺服器正常，可刪除舊伺服器
# az postgres flexible-server delete --name $SERVER_NAME --resource-group $RG_NAME --yes
```

---

## 🔄 完整系統回滾

### 概覽
用於災難性故障，需要同時回滾應用和資料庫。

### 回滾順序（關鍵！）

```
正確順序：
1️⃣ 停止應用（避免數據寫入）
2️⃣ 回滾資料庫
3️⃣ 回滾應用程式碼
4️⃣ 驗證數據一致性
5️⃣ 啟動應用

❌ 錯誤順序：先回滾應用 → 會導致 schema 不匹配錯誤
```

### 執行步驟

#### 步驟 1: 停止應用
```bash
ENVIRONMENT="prod"
APP_NAME="app-itpm-${ENVIRONMENT}-001"
RG_NAME="rg-itpm-${ENVIRONMENT}"

# 停止 App Service
az webapp stop --name $APP_NAME --resource-group $RG_NAME

echo "✅ 應用已停止，防止數據寫入"
```

#### 步驟 2: 回滾資料庫
參考上一節「資料庫回滾」的詳細步驟。

#### 步驟 3: 回滾應用到匹配版本
```bash
# 假設資料庫回滾到 v1.0.4 的 schema，應用也需要回滾到 v1.0.4
TARGET_VERSION="v1.0.4"
ACR_NAME="acritpm${ENVIRONMENT}"
FULL_IMAGE_NAME="${ACR_NAME}.azurecr.io/itpm-web:${TARGET_VERSION}"

# 更新容器鏡像
az webapp config container set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --docker-custom-image-name $FULL_IMAGE_NAME
```

#### 步驟 4: 啟動應用
```bash
# 啟動 App Service
az webapp start --name $APP_NAME --resource-group $RG_NAME

echo "⏳ 等待應用啟動..."
sleep 60
```

#### 步驟 5: 驗證系統狀態
```bash
# 檢查應用健康狀態
az webapp show --name $APP_NAME --resource-group $RG_NAME \
  --query "{State:state, HealthState:healthState}" -o table

# 測試關鍵功能
APP_URL="https://${APP_NAME}.azurewebsites.net"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" "$APP_URL"

# 查看應用日誌
az webapp log tail --name $APP_NAME --resource-group $RG_NAME --limit 50
```

---

## ✅ 回滾後驗證

### 關鍵驗證檢查清單

#### 1. 應用健康檢查
```bash
# 檢查 App Service 狀態
az webapp show --name $APP_NAME --resource-group $RG_NAME \
  --query "{Name:name, State:state, HealthState:healthState, DefaultHostName:defaultHostName}" -o table

# HTTP 健康檢查
curl -I "https://${APP_NAME}.azurewebsites.net"
```

#### 2. 資料庫連接測試
```bash
# 測試資料庫連接
psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM \"User\";"

# 檢查關鍵表數據完整性
psql "$DATABASE_URL" <<EOF
SELECT 'Projects' AS table_name, COUNT(*) AS count FROM "Project"
UNION ALL
SELECT 'Expenses', COUNT(*) FROM "Expense"
UNION ALL
SELECT 'Users', COUNT(*) FROM "User";
EOF
```

#### 3. 功能測試（手動）
- ✅ 登入功能正常
- ✅ 項目列表可正常顯示
- ✅ 可創建新預算提案
- ✅ 可上傳文件（Blob Storage）
- ✅ 通知系統正常（如適用）

#### 4. 錯誤日誌檢查
```bash
# 查看應用日誌（最近 100 條）
az webapp log tail --name $APP_NAME --resource-group $RG_NAME --limit 100

# 檢查是否有 5xx 錯誤
az monitor metrics list \
  --resource "/subscriptions/[SUB_ID]/resourceGroups/$RG_NAME/providers/Microsoft.Web/sites/$APP_NAME" \
  --metric "Http5xx" \
  --start-time $(date -u -d '10 minutes ago' '+%Y-%m-%dT%H:%M:%S') \
  --end-time $(date -u '+%Y-%m-%dT%H:%M:%S') \
  --interval PT1M
```

#### 5. 性能監控
```bash
# 查看響應時間
az monitor metrics list \
  --resource "/subscriptions/[SUB_ID]/resourceGroups/$RG_NAME/providers/Microsoft.Web/sites/$APP_NAME" \
  --metric "HttpResponseTime" \
  --start-time $(date -u -d '10 minutes ago' '+%Y-%m-%dT%H:%M:%S') \
  --end-time $(date -u '+%Y-%m-%dT%H:%M:%S') \
  --interval PT1M
```

---

## 📝 常見回滾場景

### 場景 1: 新功能導致應用崩潰

**症狀**:
- HTTP 500 錯誤頻繁
- 應用重啟循環

**回滾方案**: 🔄 部署槽位回滾（如果有槽位）或 Docker 鏡像版本回滾

**執行時間**: 1-5 分鐘

**步驟**:
1. 使用部署槽位交換回滾（Staging/Prod）
2. 或使用上一個穩定的 Docker 鏡像
3. 驗證應用恢復正常

---

### 場景 2: Prisma 遷移失敗

**症狀**:
```
Error: P3009
migrate found failed migrations in the target database
```

**回滾方案**: 🗄️ 資料庫遷移回滾

**執行時間**: 5-15 分鐘

**步驟**:
1. 標記失敗遷移為已回滾
   ```bash
   npx prisma migrate resolve --rolled-back [migration_name]
   ```
2. 手動執行反向 SQL
3. 更新 Prisma schema
4. 重新生成 Prisma Client

---

### 場景 3: 配置錯誤（環境變數）

**症狀**:
- 資料庫連接失敗
- Key Vault 引用錯誤

**回滾方案**: ⚙️ 配置回滾

**執行時間**: 2-5 分鐘

**步驟**:
```bash
# 恢復正確的環境變數
az webapp config appsettings set \
  --name $APP_NAME \
  --resource-group $RG_NAME \
  --settings \
    DATABASE_URL="@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-DATABASE-URL)" \
    NEXTAUTH_SECRET="@Microsoft.KeyVault(VaultName=kv-itpm-prod;SecretName=ITPM-PROD-NEXTAUTH-SECRET)"

# 重啟應用
az webapp restart --name $APP_NAME --resource-group $RG_NAME
```

---

### 場景 4: 數據損壞或丟失

**症狀**:
- 關鍵數據缺失
- 數據完整性約束違反

**回滾方案**: 🗄️ Azure PostgreSQL 時間點恢復

**執行時間**: 10-30 分鐘

**步驟**:
1. 確定數據損壞前的時間點
2. 使用 Azure 時間點恢復創建新資料庫伺服器
3. 驗證恢復的數據完整性
4. 切換應用到新資料庫
5. 同步回滾應用版本

---

## 🆘 緊急聯絡

### 回滾支援團隊

| 角色 | 職責 | 聯絡方式 |
|------|------|---------|
| **DevOps Lead** | 回滾決策、資源管理 | [聯絡資訊] |
| **Database Admin** | 資料庫回滾、數據驗證 | [聯絡資訊] |
| **Tech Lead** | 應用程式碼回滾、功能驗證 | [聯絡資訊] |
| **Product Owner** | 業務影響評估 | [聯絡資訊] |

### 升級路徑

```
Level 1: DevOps Engineer（執行標準回滾）
    │
    ▼（如果回滾失敗或複雜場景）
Level 2: DevOps Lead + Database Admin
    │
    ▼（如果需要業務決策）
Level 3: Tech Lead + Product Owner
    │
    ▼（災難性故障）
Level 4: CTO + Management
```

---

## 📚 相關文檔

- [首次部署設置](./01-first-time-setup.md)
- [CI/CD 配置](./02-ci-cd-setup.md)
- [故障排除](./03-troubleshooting.md)
- [Azure 部署腳本](./../.azure/scripts/)

---

**重要提醒**:
- 🔴 **生產環境回滾前必須獲得批准**
- 📋 **詳細記錄所有回滾操作**
- ✅ **回滾後進行完整驗證**
- 📞 **保持團隊溝通暢通**

---

**最後更新**: 2025-11-20
**維護者**: DevOps Team
