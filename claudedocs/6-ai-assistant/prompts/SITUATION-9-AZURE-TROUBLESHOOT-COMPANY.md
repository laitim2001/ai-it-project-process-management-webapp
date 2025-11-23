# SITUATION-9: Azure 公司環境問題排查指引

**用途**: 當**公司 Azure 訂閱**部署或運行過程中遇到問題時，使用此指引進行企業級故障診斷和規範化問題解決。

**目標環境**: 公司 Azure 訂閱（Staging、Production、正式環境）

**觸發情境**:
- 生產環境故障
- 部署到公司環境失敗
- 企業級權限問題
- 網路配置問題
- 合規性相關問題
- 需要與 Azure Administrator 協作

**特點**: 企業級故障排查，結構化升級流程，合規性優先

---

## 🎯 公司環境問題排查原則

### 1. 安全和合規優先
```yaml
enterprise_troubleshooting:
  - ✅ 遵守變更管理流程
  - ✅ 記錄所有診斷操作
  - ✅ 避免破壞性操作
  - ✅ 保護生產數據
  - ✅ 及時升級和通知
  - ⚠️  不得隨意修改生產配置
```

### 2. 結構化升級路徑
```yaml
escalation_levels:
  Level_1_Self_Diagnosis: 0-30 分鐘
    - 查看監控和告警
    - 檢查日誌
    - 執行基礎診斷腳本
    - 查閱文檔

  Level_2_DevOps_Team: 30-60 分鐘
    - 聯繫內部 DevOps
    - Slack #devops-support
    - 共享診斷結果

  Level_3_Azure_Administrator: 1-2 小時
    - 權限相關問題
    - 網路配置問題
    - 訂閱配額問題

  Level_4_Microsoft_Support: 嚴重故障
    - 平台級別問題
    - 需要 Microsoft 介入
```

### 3. 變更管理
```yaml
change_management:
  診斷操作:
    - 只讀操作: 無需審批
    - 重啟服務: 需要團隊知情
    - 配置變更: 需要 CAB 批准
    - 回滾操作: 需要緊急批准

  記錄要求:
    - 記錄問題症狀
    - 記錄診斷步驟
    - 記錄修復操作
    - 更新故障知識庫
```

---

## 🔍 企業級問題診斷

### 問題 1: 生產環境無法訪問 - 嚴重故障

#### 症狀
```
🚨 Critical: https://app-itpm-company-prod-001.azurewebsites.net 返回 502/503
🚨 影響: 所有用戶無法訪問
🚨 優先級: P1 - 立即處理
```

#### 立即行動（0-5 分鐘）
```yaml
immediate_actions:
  1. 確認故障範圍:
     - 是否影響所有用戶
     - 開始時間
     - 相關症狀

  2. 通知團隊:
     - Slack #incidents 頻道
     - Email: devops@company.com
     - 緊急熱線: +886-XXX-XXXX

  3. 開始記錄:
     - 創建故障記錄
     - 記錄開始時間
     - 記錄診斷步驟
```

#### 快速診斷（5-15 分鐘）
```bash
# 1. 檢查 App Service 狀態
az webapp show \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --query "{Name:name, State:state, AvailabilityState:availabilityState}"

# 2. 查看 Application Insights 告警
az monitor metrics alert list \
  --resource-group rg-itpm-company-prod \
  --query "[?enabled==\`true\`].{Name:name, Severity:severity, State:monitorState}"

# 3. 即時日誌（最重要）
az webapp log tail \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod | head -100

# 4. 檢查最近部署
az webapp deployment list \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --query "[0].{Time:end_time, Status:status, Id:id}"
```

#### 決策樹（15-30 分鐘）

**如果是最近部署導致**:
```yaml
immediate_rollback:
  decision: 立即回滾到上一個穩定版本
  approval: DevOps Team Lead 口頭批准（記錄在案）

  rollback_steps:
    # Slot Swap 回滾
    az webapp deployment slot swap \
      --name app-itpm-company-prod-001 \
      --resource-group rg-itpm-company-prod \
      --slot staging \
      --target-slot production \
      --action swap

    # 驗證
    bash azure/tests/smoke-test.sh company-prod

    # 通知
    - 通知團隊回滾完成
    - 更新故障記錄
    - 安排事後分析 (Post-Mortem)
```

**如果是基礎設施問題**:
```yaml
escalate_to_azure_admin:
  scenarios:
    - 資料庫無法連接
    - 網路問題
    - Azure 平台問題

  actions:
    1. 收集診斷信息
    2. 聯繫 Azure Administrator
    3. 提供完整上下文
    4. 等待專家介入
```

---

### 問題 2: 部署到公司環境失敗

#### 症狀
```
❌ bash azure/scripts/deploy-to-company.sh prod 失敗
❌ CI/CD Pipeline 失敗
❌ 權限被拒或配額超限
```

#### 診斷步驟

**步驟 1: 檢查部署權限**
```bash
# 驗證當前帳號權限
az role assignment list \
  --assignee $(az account show --query user.name -o tsv) \
  --resource-group rg-itpm-company-prod \
  --query "[].{Role:roleDefinitionName, Scope:scope}"

# 檢查 Service Principal 權限（CI/CD）
az role assignment list \
  --assignee $AZURE_CLIENT_ID \
  --query "[].{Role:roleDefinitionName, Scope:scope}"
```

**步驟 2: 檢查配額限制**
```bash
# 查看訂閱配額使用
az vm list-usage --location eastasia -o table

# 查看資源群組配額
az group show --name rg-itpm-company-prod --query "{Tags:tags, Location:location}"
```

**步驟 3: 檢查網路配置**
```bash
# 驗證 VNet 配置（如適用）
az network vnet list --resource-group rg-itpm-company-prod

# 檢查 NSG 規則
az network nsg list --resource-group rg-itpm-company-prod

# 驗證 Private Endpoint（如適用）
az network private-endpoint list --resource-group rg-itpm-company-prod
```

#### 常見原因和解決方案

**原因 1: 權限不足**
```yaml
symptoms:
  - "Authorization failed"
  - "The client ... does not have authorization"

resolution:
  1. 確認需要的權限:
     - Contributor（資源群組層級）
     - Key Vault Secrets User
     - Storage Blob Data Contributor

  2. 聯繫 Azure Administrator:
     - 提供錯誤訊息
     - 說明需要的操作
     - 請求授予權限

  3. 權限授予後驗證:
     az role assignment list --assignee <your-principal-id>
```

**原因 2: 配額超限**
```yaml
symptoms:
  - "QuotaExceeded"
  - "Subscription has reached its quota"

resolution:
  1. 檢查配額使用情況
  2. 請求配額增加:
     - Azure Portal → Support → New support request
     - 選擇 "Service and subscription limits (quotas)"
     - 描述需求和業務理由

  3. 或清理未使用資源
```

**原因 3: 網路限制**
```yaml
symptoms:
  - "NetworkAccessDenied"
  - "Connection timeout"

resolution:
  1. 確認部署來源 IP
  2. 與 Azure Admin 確認防火牆規則
  3. 確認 VNet/Subnet 配置正確
  4. 驗證 Private Endpoint 連接
```

---

### 問題 3: 資料庫連接問題（企業級）

#### 症狀
```
❌ 應用程式無法連接 PostgreSQL
❌ Managed Identity 認證失敗
❌ Private Endpoint 連接超時
```

#### 企業環境特殊考慮

**Private Endpoint 診斷**
```bash
# 檢查 Private Endpoint 狀態
az network private-endpoint show \
  --name pe-psql-itpm-company-prod \
  --resource-group rg-itpm-company-prod \
  --query "{Name:name, ProvisioningState:provisioningState, ConnectionState:privateLinkServiceConnections[0].privateLinkServiceConnectionState}"

# 檢查 Private DNS Zone
az network private-dns zone list \
  --resource-group rg-itpm-company-prod \
  --query "[?contains(name, 'postgres')].{Name:name, RecordSets:numberOfRecordSets}"

# 測試 DNS 解析（從 App Service）
az webapp ssh --name app-itpm-company-prod-001 --resource-group rg-itpm-company-prod
# 在 SSH 會話中: nslookup psql-itpm-company-prod-001.postgres.database.azure.com
```

**Managed Identity 診斷**
```bash
# 確認 Managed Identity 已啟用
az webapp identity show \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod

# 檢查 PostgreSQL AAD 管理員配置
az postgres flexible-server ad-admin list \
  --server-name psql-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod

# 測試 Managed Identity 連接
# 確認資料庫用戶已創建並授權
```

#### 升級路徑
```yaml
if_private_endpoint_issue:
  escalate_to: Azure Network Administrator
  provide:
    - Private Endpoint 名稱和狀態
    - DNS 解析結果
    - VNet/Subnet 配置
    - 錯誤日誌

if_managed_identity_issue:
  escalate_to: Azure AD Administrator
  provide:
    - Managed Identity Principal ID
    - 所需的資料庫權限
    - 錯誤訊息（認證失敗）
```

---

### 問題 4: Key Vault 訪問問題（企業級）

#### 症狀
```
❌ Access denied to Key Vault
❌ The user, group or application does not have secrets get permission
❌ 共用 Key Vault 權限配置問題
```

#### 企業環境診斷

**檢查 Key Vault 訪問策略**
```bash
# 如果使用共用企業 Key Vault
VAULT_NAME="kv-company-shared"  # 替換為實際名稱

# 檢查訪問策略
az keyvault show \
  --name $VAULT_NAME \
  --query "properties.accessPolicies[?objectId=='<APP_PRINCIPAL_ID>'].{Permissions:permissions}"

# 檢查 RBAC 模式（如果啟用）
az role assignment list \
  --scope /subscriptions/$(az account show --query id -o tsv)/resourceGroups/rg-itpm-company-prod/providers/Microsoft.KeyVault/vaults/$VAULT_NAME \
  --assignee <APP_PRINCIPAL_ID>
```

**檢查網路限制**
```bash
# Key Vault 防火牆規則
az keyvault network-rule list \
  --name $VAULT_NAME \
  --query "{DefaultAction:defaultAction, IPRules:ipRules, VnetRules:virtualNetworkRules}"

# 如果使用 Private Endpoint
az network private-endpoint list \
  --resource-group rg-itpm-company-prod \
  --query "[?contains(name, 'keyvault')].{Name:name, State:privateLinkServiceConnections[0].privateLinkServiceConnectionState}"
```

#### 權限申請流程
```yaml
key_vault_access_request:
  1. 準備信息:
     application_name: "IT Project Management Platform"
     environment: "Production"
     managed_identity_principal_id: "<from az webapp identity show>"
     required_permissions: "secrets: get, list"
     business_justification: "Access production secrets for app configuration"

  2. 提交申請:
     to: Azure Administrator
     via: Email或內部工單系統
     include: 所有準備的信息

  3. 等待批准:
     typical_time: 1-2 工作日
     follow_up: 如緊急，聯繫 DevOps Team Lead

  4. 驗證訪問:
     # 批准後測試
     az keyvault secret show \
       --vault-name $VAULT_NAME \
       --name ITPM-PROD-DATABASE-URL \
       --query "value"
```

---

## 📊 監控和告警管理

### Application Insights 診斷

**查看實時監控**
```bash
# 查看最近錯誤
az monitor app-insights query \
  --app app-itpm-company-prod-insights \
  --resource-group rg-itpm-company-prod \
  --analytics-query "exceptions | where timestamp > ago(1h) | summarize count() by type, outerMessage | order by count_ desc"

# 查看性能指標
az monitor app-insights query \
  --app app-itpm-company-prod-insights \
  --resource-group rg-itpm-company-prod \
  --analytics-query "requests | where timestamp > ago(1h) | summarize avg(duration) by bin(timestamp, 5m)"

# 查看可用性測試結果
az monitor app-insights query \
  --app app-itpm-company-prod-insights \
  --resource-group rg-itpm-company-prod \
  --analytics-query "availabilityResults | where timestamp > ago(1h) | summarize successRate = count(success==true)*100.0/count() by bin(timestamp, 5m)"
```

### 告警規則管理
```bash
# 查看活動告警
az monitor metrics alert list \
  --resource-group rg-itpm-company-prod \
  --query "[?enabled==\`true\`].{Name:name, Severity:severity, Condition:criteria}"

# 查看告警歷史
az monitor activity-log alert list \
  --resource-group rg-itpm-company-prod

# 臨時禁用告警（維護窗口）
# 需要 CAB 批准
az monitor metrics alert update \
  --name alert-high-cpu \
  --resource-group rg-itpm-company-prod \
  --enabled false
```

---

## 🔄 企業級回滾程序

### Production 回滾審批流程

```yaml
rollback_approval_process:
  severity_p1_critical:
    approval: DevOps Team Lead 口頭批准（5分鐘內）
    notification: 即時通知 CAB（事後補充）
    documentation: 創建緊急變更記錄

  severity_p2_high:
    approval: 需要 CAB 快速審批（30分鐘）
    notification: Slack + Email
    documentation: 標準變更流程

  severity_p3_medium:
    approval: 需要完整 CAB 審批
    notification: 正常變更請求流程
    documentation: 完整變更文檔
```

### Slot Swap 回滾（推薦）
```bash
# 生產環境回滾（需要批准）
echo "⚠️  準備回滾到 Staging Slot"
echo "當前 Production Slot: $(az webapp config show --name app-itpm-company-prod-001 --resource-group rg-itpm-company-prod --query linuxFxVersion -o tsv)"

# 執行 Swap
az webapp deployment slot swap \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --slot staging \
  --target-slot production \
  --action swap

# 驗證
bash azure/tests/smoke-test.sh company-prod

# 通知
echo "回滾完成，通知團隊和利益相關者"
```

### 版本回滾
```bash
# 部署舊版本（需要批准）
STABLE_VERSION="v1.5.2"  # 最後已知穩定版本

az webapp config container set \
  --name app-itpm-company-prod-001 \
  --resource-group rg-itpm-company-prod \
  --docker-custom-image-name acritpmcompany.azurecr.io/itpm-web:$STABLE_VERSION

# 重啟
az webapp restart --name app-itpm-company-prod-001 --resource-group rg-itpm-company-prod

# 監控 15 分鐘
az webapp log tail --name app-itpm-company-prod-001 --resource-group rg-itpm-company-prod
```

---

## 📞 升級和協作流程

### Level 1: 自助診斷（0-30 分鐘）

```yaml
self_diagnosis:
  actions:
    - 查看 Application Insights
    - 檢查告警歷史
    - 查看應用程式日誌
    - 執行基礎診斷腳本
    - 查閱內部文檔和知識庫

  tools:
    - bash azure/tests/test-azure-connectivity.sh company-prod
    - az webapp log tail
    - Application Insights 查詢
```

### Level 2: DevOps Team（30-60 分鐘）

```yaml
devops_escalation:
  contact:
    - Slack: #devops-support
    - Email: devops@company.com
    - Phone: +886-XXX-XXXX（緊急）

  provide:
    - 問題症狀描述
    - 影響範圍
    - 已執行的診斷步驟
    - 日誌和錯誤訊息
    - 環境信息（company/prod）

  response_time:
    - P1 Critical: 15 分鐘內
    - P2 High: 30 分鐘內
    - P3 Medium: 2 小時內
```

### Level 3: Azure Administrator（1-2 小時）

```yaml
azure_admin_escalation:
  scenarios:
    - 權限問題
    - 網路配置問題
    - Key Vault 訪問問題
    - 訂閱配額問題
    - Private Endpoint 問題

  contact:
    - Email: azure-admin@company.com
    - 內部工單系統

  prepare:
    - 完整錯誤訊息
    - 資源 ID 和名稱
    - 所需的權限或配置
    - 業務影響說明
```

### Level 4: Microsoft Azure Support（嚴重故障）

```yaml
microsoft_support:
  when_to_escalate:
    - Azure 平台問題
    - 服務中斷
    - 數據丟失風險
    - 無法通過內部資源解決

  how_to_create_ticket:
    1. Azure Portal → Help + support → New support request
    2. 選擇 Issue type: Technical
    3. 選擇 Severity:
       - Severity A (Critical): 生產系統完全中斷
       - Severity B (High): 生產系統嚴重降級
       - Severity C (Moderate): 次要影響
    4. 提供詳細問題描述和診斷資訊
    5. 附上日誌、截圖、錯誤訊息

  response_time:
    - Severity A: < 1 小時
    - Severity B: < 4 小時
    - Severity C: < 8 小時（工作時間）
```

---

## 📝 故障記錄和事後分析

### 故障記錄模板
```markdown
# 故障記錄 - [故障簡述]

## 基本信息
- **故障時間**: 2025-XX-XX XX:XX
- **發現時間**: 2025-XX-XX XX:XX
- **恢復時間**: 2025-XX-XX XX:XX
- **總持續時間**: X 小時 X 分鐘
- **環境**: company/prod
- **嚴重級別**: P1/P2/P3
- **影響範圍**: 所有用戶 / 部分功能

## 症狀描述
[詳細描述問題症狀]

## 根本原因
[經診斷確認的根本原因]

## 診斷過程
1. [診斷步驟 1]
2. [診斷步驟 2]
...

## 修復操作
1. [修復步驟 1]
2. [修復步驟 2]
...

## 影響評估
- 受影響用戶數: XX
- 業務損失: XX
- SLA 影響: XX%

## 後續行動
- [ ] 更新監控告警
- [ ] 更新文檔
- [ ] 技術改進
- [ ] 流程優化

## 參與人員
- 發現: XXX
- 診斷: XXX
- 修復: XXX
```

### Post-Mortem 流程
```yaml
post_mortem_meeting:
  timing: 故障恢復後 48 小時內
  participants:
    - DevOps Team
    - 開發團隊
    - Azure Administrator（如相關）
    - 產品負責人

  agenda:
    1. 時間線回顧（5 分鐘）
    2. 根本原因分析（10 分鐘）
    3. 影響評估（5 分鐘）
    4. 改進措施討論（20 分鐘）
    5. 行動項分配（10 分鐘）

  outputs:
    - Post-Mortem 報告
    - 改進措施清單
    - 更新的 Runbook
    - 知識庫文章
```

---

## ✅ 企業環境問題排查檢查清單

### 診斷前準備
- [ ] 確認問題環境（company/dev|staging|prod）
- [ ] 確認問題開始時間
- [ ] 評估影響範圍和嚴重性
- [ ] 創建故障記錄
- [ ] 通知相關團隊

### 診斷階段
- [ ] 查看 Application Insights
- [ ] 檢查告警歷史
- [ ] 查看應用程式日誌
- [ ] 執行自動化診斷腳本
- [ ] 檢查最近的變更記錄
- [ ] 驗證基礎設施狀態

### 升級決策
- [ ] 30 分鐘內未解決 → 升級到 DevOps Team
- [ ] 涉及權限/網路 → 升級到 Azure Admin
- [ ] 平台級別問題 → 升級到 Microsoft Support

### 修復後驗證
- [ ] 執行煙霧測試
- [ ] 監控 30 分鐘穩定性
- [ ] 驗證所有功能正常
- [ ] 檢查 Application Insights 指標恢復正常
- [ ] 更新故障記錄
- [ ] 通知團隊問題已解決

### 後續行動
- [ ] 安排 Post-Mortem 會議
- [ ] 更新知識庫
- [ ] 更新監控告警
- [ ] 實施預防措施
- [ ] 更新 Runbook

---

## 🎓 參考資源

### 內部文檔
- `SITUATION-7-AZURE-DEPLOY-COMPANY.md` - 公司環境部署指引
- `azure/environments/company/README.md` - 公司環境配置說明
- `claudedocs/AZURE-DEPLOYMENT-FILE-STRUCTURE-GUIDE.md` - 目錄結構指引

### 企業流程文檔
- 變更管理流程（內部鏈接）
- CAB 審批流程（內部鏈接）
- 故障升級流程（內部鏈接）
- Post-Mortem 模板（內部鏈接）

### Azure 官方文檔
- [Azure App Service 企業級診斷](https://docs.microsoft.com/azure/app-service/troubleshoot-diagnostic-logs)
- [Application Insights 故障排查](https://docs.microsoft.com/azure/azure-monitor/app/troubleshoot)
- [Azure Support 指南](https://azure.microsoft.com/support/options/)

---

**版本**: 1.0.0
**最後更新**: 2025-11-23
**維護者**: DevOps Team + Azure Administrator
**適用環境**: 公司 Azure 訂閱（Staging、Production、正式環境）
**審批**: 需要 DevOps Team Lead 和 Azure Administrator 批准
