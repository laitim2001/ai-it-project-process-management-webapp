# Phase 0 — 簡化版 Stakeholder Review

> **目的**：聚焦 2 個核心決策問題，stakeholder 只需勾選「Approve / Defer」。
> **填寫者**: Tech Lead + Management（一起 1 次會議完成）
> **預計時間**: 60-90 分鐘（含討論）
> **建立日期**: 2026-04-28
> **更新**: 2026-04-28 v2 — 依 stakeholder 確認簡化（SSO 主導 + 成本最小化）
> **取代**: 原 01-05 詳細文件（移至 `deep-dive/` 供日後參考）

---

## 🔑 重要前提（依 stakeholder 確認 2026-04-28）

本次 Review 在以下假設下執行，影響多個項目的處置：

1. **生產登入主要走 Azure SSO** — 密碼 / MFA 類項目大幅縮減（由 Azure AD Conditional Access 統一管控）
2. **本地密碼僅供開發 / 緊急 fallback** — 影響範圍極小（admin@itpm.local 等少量帳號）
3. **本系統屬內部工具（Internal）** — DDoS / WAF / Pen Test / SOC 2 等對外暴露面才需要的項目暫緩
4. **既有 Azure 基礎設施已涵蓋大部分基礎需求** — Key Vault 已採用，PostgreSQL 標準備份已足夠
5. **任何「鎖定」類功能必須同步設計「解鎖」流程** — 防止支援負擔

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

## ⚠️ Group B：Has Impact（會改變現有用戶體驗）— 7 項

> **前提假設（依 stakeholder 確認 2026-04-28）**：
> - 生產環境**主要使用 Azure SSO 登入**，本地密碼僅用於開發/緊急 fallback 帳號
> - 因此密碼/MFA 相關項目大幅縮減（SSO 已內建 MFA 由 Azure AD 控管）
>
> **建議**：逐項討論，**確認業務可接受 UX 變化**才 Approve。

| # | Check ID | 項目 | 對使用者的具體影響 | 緩解 / 替代 | 決議 |
|---|----------|------|------------------|-------------|------|
| B1 | **IAM-04** | Session 24h 過期 | 隔天需重新登入；超過 3 個 device 最舊的會被踢 | 可調整 maxAge，或限制更寬鬆 | ☐ Approve ☐ Defer ☐ 修改 |
| B2 | **IAM-05** | 密碼歷史 / 過期（**僅本地 fallback 帳號**） | 影響範圍小：僅 admin@itpm.local 等少量本地帳號；主流程走 SSO 不受影響 | 可只做密碼歷史（不重用），不做 90 天過期 | ☐ Approve ☐ Defer ☐ 修改 |
| B3 | **IAM-07** | 帳號鎖定 + **解鎖機制** | 連續輸錯 5 次後等 15 分鐘；**Admin 需有手動解鎖介面** | 必須同步設計解鎖功能（見下方說明） | ☐ Approve ☐ Defer ☐ 修改 |
| B4 | **AppSec-03** | CSP 啟用 | 若有未列入白名單的 inline script 會被擋 | 先 Report-Only 模式 1-2 週觀察 | ☐ Approve ☐ Defer |
| B5 | **AppSec-09** | Rate Limit 100 req/min | 重度使用者（如批量 API 呼叫）可能被擋 | 可針對特定用戶提高上限；in-memory 版本不需 Redis | ☐ Approve ☐ Defer ☐ 修改 |
| B6 | **DP-03** | 欄位級加密（email、name 等 PII） | DB 直查看不到明文；性能略下降；既有資料需 backfill | 可只加密最敏感欄位（如手機） | ☐ Approve ☐ Defer ☐ 修改 |
| B7 | **DP-07/08** | GDPR 資料匯出 / 刪除 | 設定頁多兩個按鈕；刪除帳號流程變嚴 | 視業務範圍是否真需要（內部工具可不做） | ☐ Approve ☐ Defer |
| ~~B8~~ | ~~Gov-03 + Gov-07~~ | ~~SoD + Cookie Consent~~ | （SSO 主導 + 內部工具 → 拆出獨立評估，暫不放入此次決議）| | - |

### B3 IAM-07 解鎖機制設計要求（必含）

僅做「鎖定」會造成支援負擔，必須同步設計以下解鎖路徑：

1. **自動解鎖**：鎖定 15 分鐘後自動恢復（最低限度）
2. **Admin 手動解鎖**：`/admin/users/[id]` 頁面提供「解鎖」按鈕，操作記錄到 AuditLog
3. **使用者自助解鎖**（可選）：透過 SSO 登入成功後自動解除本地鎖定狀態
4. **鎖定通知**：被鎖定時 email 通知用戶（讓真正的用戶知道有人在嘗試）
5. **錯誤訊息**：不洩漏「密碼錯誤」vs「帳號鎖定」差異

**Group B 額外備註**:
> ______

---

## 💰 Group C：Has Cost（產生額外金錢成本）— 重新分類

> **依 stakeholder 回饋 2026-04-28 簡化**：
> - 大部分「需新採購雲服務」項目於此階段**暫緩**（內部工具規模 + 既有 Azure 基礎已足夠）
> - 僅保留無法迴避的成本項目

### C-Done：已完成（無需此階段決議）

| Check ID | 項目 | 狀態 |
|----------|------|------|
| **DP-04** | Azure Key Vault | ✅ **已採用**（公司 Azure 環境已使用） |

### C-Active：本階段建議 Approve（低成本必要項）

| # | Check ID | 項目 | 持續成本 | 決議 |
|---|----------|------|---------|------|
| C1 | **Obs-08** | Azure Blob Cool tier（Log 留存） | **~$10/月**（隨量增） | ☐ Approve ☐ Defer |
| C2 | **Gov-09** | 員工資安培訓（內訓 / 線上免費課程） | **$0**（改內訓） | ☐ Approve ☐ Defer |

### C-Defer：此階段暫緩（規模未到 / 替代方案已足夠）

| Check ID | 項目 | 原規劃成本 | 替代方案 | 重評時機 |
|----------|------|-----------|---------|---------|
| **AppSec-09** | Upstash Redis（Rate Limit 後端） | $0-20/月 | 改用 **in-memory rate limit**（單實例足夠，內部工具流量不大） | 多實例擴展 / 流量上升時 |
| **Obs-04/06** | Application Insights（APM + SIEM） | $50-200/月 | 沿用 **App Service 內建 logs + Azure Monitor 基本指標** | 出現需深度排查的事件時 |
| **Resi-02** | Azure Front Door + WAF | $300+/月 | **App Service IP 限制 + Azure Defender Basic** 已足夠 | 對外開放或客戶要求時 |
| **DP-09** | PostgreSQL Geo-Redundant Backup | +50% DB 成本 | 標準 backup（35 天 + PITR）已足夠 | 業務 RTO/RPO 變嚴時 |
| **SDLC-11** | 第三方滲透測試 | $10K-30K/年 | 內部 SAST/DAST 工具（OSS）+ 自我測試 | 客戶要求 / 上市準備 |

> **Group C 摘要**：原 8 項中 **1 項已完成、2 項 Active、5 項 Defer**。本階段年度新增成本上限約 **$120-150/年**（僅 C1 Blob 留存）。

**Group C 額外備註**:
> ______

---

## 🚫 Group D：N/A 或暫緩 — 4 項

| Check ID | 項目 | 為何不做 |
|----------|------|---------|
| IAM-06 | MFA 強制（本地帳號） | **生產環境主要走 Azure SSO，MFA 由 Azure AD 統一管控（Conditional Access）**；內部工具無需在應用層額外實作 TOTP |
| IAM-09 | Service Account / API Key | 目前無 M2M 場景，Epic 10 整合時重評估 |
| AppSec-10 | SSRF 防護 | 本專案無外部 URL fetch / proxy |
| AppSec-12 | LLM Prompt Injection | Epic 9 規劃時納入，現在不需 |

> **IAM-06 補充**：若未來開放外部 / 客戶使用，或本地 fallback 帳號（admin@itpm.local）權限提升至能修改生產資料，**屆時應重新評估**是否在應用層加 MFA。

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
[ ] Group A 全部 Approve（41 項，純工程時間）
[ ] Group B Approve _____ 項，Defer _____ 項（共 7 項 UX 影響）
[ ] Group C-Active Approve（C1 Blob 留存 + C2 內訓）
[ ] Group C-Defer 確認暫緩（5 項，$0 新增）
[ ] Group D N/A 確認（4 項，含 IAM-06 MFA）
[ ] Security Lead = _____
```

### 優先 5 項（建議 Phase 1，4 週內完成）

依 SSO 主導 + 成本最小化原則重新排序：

1. **IAM-01**: publicProcedure 審查（修補既有暴露端點，$0，2d）
2. **IAM-10**: 資源所有權驗證（防止跨用戶操作，$0，5d）
3. **AppSec-09**: Rate Limiting（**改用 in-memory 版本，$0**）
4. **IAM-07 + 解鎖機制**: 帳號鎖定 + Admin 解鎖介面 + email 通知（$0，3d）
5. **Resi-09**: Incident Response Plan（事件發生時的應對，$0 文件）

> **變化說明**：
> - 移除「DP-04 Key Vault」（已採用）、「IAM-06 MFA」（SSO 已涵蓋）
> - 加入「IAM-01 publicProcedure 審查」（既有 Critical 漏洞修補）、「IAM-10 資源所有權」（高 ROI）
> - 「IAM-07 帳號鎖定」**必須含解鎖機制**才算完成

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
