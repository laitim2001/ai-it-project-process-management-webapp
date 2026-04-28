# Phase 0 — 簡化版 Stakeholder Review

> **目的**：聚焦 2 個核心決策問題，stakeholder 只需勾選「Approve / Defer」。
> **填寫者**: Tech Lead + Management（一起 1 次會議完成）
> **預計時間**: 60-90 分鐘（含討論）
> **建立日期**: 2026-04-28
> **取代**: 原 01-05 詳細文件（保留作為日後深入參考用）

---

## 🎯 兩個核心問題

對 FEAT-013 的 77 項檢查，stakeholder 只需回答：

1. **這項實作會影響現有功能 / 用戶體驗嗎？**
   - 🟢 無影響：純後端修補、文件、流程
   - 🟡 中等影響：UI 微調、新功能但不破壞既有流程
   - 🔴 高影響：用戶必須改變使用習慣（多步驟登入、強制改密碼等）

2. **這項實作會產生額外成本嗎？**
   - 🟢 $0：純工程時間
   - 🟡 $-low：每月 < $50（SaaS / 雲服務）
   - 🟠 $-mid：每月 $50-500
   - 🔴 $-high：每年 > $5K（外部稽核 / 顧問）

---

## 📊 Group A：Easy Wins（無影響 + 無額外成本）— 41 項

> **建議**：全部一鍵 Approve，不需逐項討論。純工程時間投入，立即提升安全性。

<details>
<summary>展開 41 項清單</summary>

| Check ID | 項目 | 工程時間估 |
|----------|------|-----------|
| IAM-01 | publicProcedure 審查 | 2d |
| IAM-02 | RBAC 細粒度（FEAT-011 補強） | 2d |
| IAM-03 | Permission 一致性 | 2d |
| IAM-08 | 特權帳號管理流程 | 1d |
| IAM-10 | 資源所有權驗證 | 5d |
| DP-01 | PII 識別與分類（文件） | 2d |
| DP-02 | DB TLS 強制 | 1d |
| DP-06 | 留存政策（文件） | 1d |
| DP-10 | 跨境傳輸文件化 | 1d |
| AppSec-01 | Zod 邊界值 | 3d |
| AppSec-02 | SQL Injection 確認 | 1d |
| AppSec-04 | CSRF（已合格，補強自訂 API） | 2d |
| AppSec-06 | 反序列化檢查 | 1d |
| AppSec-07 | npm audit + Renovate | 2d |
| AppSec-08 | Headers（補 CSP report-only） | 2d |
| AppSec-11 | 統一錯誤格式 | 3d |
| Obs-02 | AuditLog 不可竄改 | 3d |
| Obs-03 | Security Event Log | 2d |
| Obs-05 | 告警規則（基於 App Insights） | 2d |
| Obs-07 | Trace ID 端到端 | 2d |
| Obs-09 | 異常偵測（基本規則） | 3d |
| Obs-10 | Security Dashboard | 3d |
| Resi-04 | Circuit Breaker | 3d |
| Resi-05 | Retry / Timeout 統一 | 2d |
| Resi-07 | 還原測試（首次） | 2d |
| Resi-08 | RTO / RPO 文件化 | 1d |
| Resi-09 | Incident Response Plan（文件） | 3d |
| Resi-10 | 災難演練 | 1d/次 |
| Resi-11 | Health Check 補強 | 1d |
| Gov-01 | Migration Runbook | 2d |
| Gov-02 | Code Review 強制（GitHub branch protection） | 0.5d |
| Gov-04 | 技術債追蹤（已有） | 0d |
| Gov-05 | 供應商風險評估（文件） | 2d |
| Gov-10 | Access Review 流程 | 2d |
| Gov-11 | 文件治理規範 | 1d |
| Gov-12 | Risk Register | 1d |
| SDLC-01 | Secret Scanning（gitleaks） | 1d |
| SDLC-02 | SAST（Semgrep OSS） | 3d |
| SDLC-03 | DAST（OWASP ZAP） | 2d |
| SDLC-05 | SBOM 生成 | 1d |
| SDLC-06 | 容器掃描（Trivy） | 1d |
| SDLC-08 | CI/CD 守門 | 2d |
| SDLC-10 | 安全 Unit Test | 5d |
| SDLC-12 | Threat Modeling（Epic 9-10 啟動時） | 2d/次 |

**總工程時間**: ~75 工作天（約 3-4 人月）

</details>

### Group A 決議

- ☐ **全部 Approve**（建議）
- ☐ 部分 Approve（請列出例外）：______
- ☐ 全部 Defer

---

## ⚠️ Group B：Has Impact（會改變現有用戶體驗）— 9 項

> **建議**：逐項討論，**確認業務可接受 UX 變化**才 Approve。

| # | Check ID | 項目 | 對使用者的具體影響 | 緩解 / 替代 | 決議 |
|---|----------|------|------------------|-------------|------|
| B1 | **IAM-04** | Session 24h 過期 | 隔天需重新登入；超過 3 個 device 最舊的會被踢 | 可調整 maxAge，或限制更寬鬆 | ☐ Approve ☐ Defer ☐ 修改 |
| B2 | **IAM-05** | 密碼 90 天過期 + 不可重用 | 用戶每季強制改密碼，最近 5 次不可重複 | 可改 180 天或關閉過期（保留歷史檢查） | ☐ Approve ☐ Defer ☐ 修改 |
| B3 | **IAM-06** | MFA 強制（Admin） | Admin 每次登入需輸入 TOTP（手機驗證碼） | 可先 opt-in 一段時間再強制 | ☐ Approve ☐ Defer ☐ 修改 |
| B4 | **IAM-07** | 帳號鎖定 5 次失敗 / 15 分鐘 | 連續輸錯 5 次後等 15 分鐘才能再試 | 可調整次數 / 鎖定時長 | ☐ Approve ☐ Defer ☐ 修改 |
| B5 | **AppSec-03** | CSP 啟用 | 若有未列入白名單的 inline script 會被擋 | 先 Report-Only 模式 1-2 週觀察 | ☐ Approve ☐ Defer |
| B6 | **AppSec-09** | Rate Limit 100 req/min | 重度使用者（如批量 API 呼叫）可能被擋 | 可針對特定用戶提高上限 | ☐ Approve ☐ Defer ☐ 修改 |
| B7 | **DP-03** | 欄位級加密（email、name 等 PII） | DB 直查看不到明文；性能略下降；既有資料需 backfill | 可只加密最敏感欄位（如手機） | ☐ Approve ☐ Defer ☐ 修改 |
| B8 | **DP-07/08** | GDPR 資料匯出 / 刪除 | 設定頁多兩個按鈕；刪除帳號流程變嚴 | 視業務範圍是否真需要（內部工具可不做） | ☐ Approve ☐ Defer |
| B9 | **Gov-03 + Gov-07** | SoD + Cookie Consent | dev 失去 prod DB 直接存取；登入頁多 Privacy Policy 同意 | SoD 可漸進；Cookie 為合規必要 | ☐ Approve ☐ Defer |

**Group B 額外備註**:
> ______

---

## 💰 Group C：Has Cost（產生額外金錢成本）— 8 項

> **建議**：依預算與業務需求逐項決定。

| # | Check ID | 項目 | 一次性成本 | 持續成本 | 業務驅動因素 | 決議 |
|---|----------|------|-----------|---------|-------------|------|
| C1 | **DP-04** | Azure Key Vault | $0 | **~$5/月** | 必要（合規） | ☐ Approve ☐ Defer |
| C2 | **AppSec-09** | Upstash Redis（Rate Limit 後端） | $0 | **$0-20/月** | 必要（防暴力破解） | ☐ Approve ☐ Defer |
| C3 | **Obs-04/06** | Application Insights（APM + SIEM） | $0 | **$50-200/月** | 強烈建議（無法看到問題） | ☐ Approve ☐ Defer ☐ 試用 |
| C4 | **Obs-08** | Azure Blob Cool tier（Log 留存） | $0 | **~$10/月**（隨量增） | 若做 Obs-01 必須一起做 | ☐ Approve ☐ Defer |
| C5 | **Resi-02** | Azure Front Door + WAF | $0 | **$300+/月** | 視流量規模（內部工具可省） | ☐ Approve ☐ Defer |
| C6 | **DP-09** | Azure PostgreSQL Geo-Redundant Backup | $0 | **+50% DB 成本** | 業務 RTO/RPO 決定 | ☐ Approve ☐ Defer |
| C7 | **Gov-09** | 員工資安培訓（外部講師） | $0 | **$1K-5K/年** | 合規要求 | ☐ Approve ☐ Defer ☐ 改內訓 |
| C8 | **SDLC-11** | 第三方滲透測試（年度） | $10K-30K | $0 | 客戶/合規要求 | ☐ Approve ☐ Defer |

**未列入：SOC 2 / ISO 27001 認證**（$30K-50K/年）— 屬獨立決策，待 Phase 3 完成後再評估。

**Group C 預算上限**:
> 月度上限: $______
> 年度一次性: $______

---

## 🚫 Group D：N/A 或暫緩 — 3 項

| Check ID | 項目 | 為何不做 |
|----------|------|---------|
| IAM-09 | Service Account / API Key | 目前無 M2M 場景，Epic 10 整合時重評估 |
| AppSec-10 | SSRF 防護 | 本專案無外部 URL fetch / proxy |
| AppSec-12 | LLM Prompt Injection | Epic 9 規劃時納入，現在不需 |

- ☐ 同意 N/A
- ☐ 不同意（請說明）：______

---

## 📋 Security Lead 指派

最少版（不需 RACI / KPI）：

- **指派人**: ______
- **% FTE 承諾**: ______ %（建議 20-30%）
- **是否同任 DPO**: ☐ 是 ☐ 否 ☐ 不需 DPO
- **接受期限**: 1 年（可續）
- **同意**: ☐ 接受 ☐ 拒絕

---

## ✅ 結論

### 一句話決議

```
[ ] Group A 全部 Approve
[ ] Group B Approve _____ 項，Defer _____ 項
[ ] Group C Approve _____ 項，預算上限 $_____ /月
[ ] Group D N/A 確認
[ ] Security Lead = _____
```

### 優先 4 項（建議 Phase 1，4 週內完成）

從 Group B/C 中選出最高優先：

1. **AppSec-09 + C2**: Rate Limiting（防暴力破解，$20/月）
2. **DP-04 + C1**: Key Vault（合規必要，$5/月）
3. **IAM-06**: Admin MFA（最高風險帳號保護，$0）
4. **Resi-09**: IR Plan（事件發生時的應對，$0 文件）

其餘 Group A 41 項可在 Phase 2-3 滾動處理。

---

## 簽核

| 角色 | 姓名 | 同意 | 簽署日期 |
|------|------|------|---------|
| Tech Lead | ______ | ☐ | ______ |
| Management（CTO/IT Director）| ______ | ☐ | ______ |
| Security Lead（指派後）| ______ | ☐ | ______ |

---

**Last Updated**: 2026-04-28
**取代**: 原 01-05 詳細文件（移至 `deep-dive/` 子目錄供日後深入參考）
**Next Step**: 簽核完成後啟動 Phase 1（依「優先 4 項」順序）
