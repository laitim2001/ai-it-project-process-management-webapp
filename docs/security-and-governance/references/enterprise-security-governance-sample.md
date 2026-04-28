# 企業級安全與治理評估矩陣

> **目的**: 定義本項目達到**企業級**水平所需的完整檢查項清單，作為後續現狀盤點與差距分析的基準。
> **參考標準**: OWASP ASVS L2、NIST CSF v2.0、SOC2 Type II、ISO 27001、CIS Controls v8
> **評分模型**: L0 (Absent) → L1 (Initial) → L2 (Managed) → L3 (Defined) → L4 (Optimized)

---

## 📑 目錄

1. [IAM — 身份與存取管理](#1-iam--身份與存取管理)
2. [DP — 資料保護](#2-dp--資料保護)
3. [AppSec — 應用安全](#3-appsec--應用安全)
4. [Obs — 可觀測性與監控](#4-obs--可觀測性與監控)
5. [Resi — 韌性與災備](#5-resi--韌性與災備)
6. [Gov — 治理與合規](#6-gov--治理與合規)
7. [SDLC — 開發生命週期安全](#7-sdlc--開發生命週期安全)
8. [評分匯總範本](#評分匯總範本)

---

## 1. IAM — 身份與存取管理

> 控管「誰可以做什麼」，是企業級系統的第一道防線。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **IAM-01** | API 路由認證覆蓋率 | ≥ 95%（公開 API 須白名單明列） | 🔴 HIGH | OWASP A01 |
| **IAM-02** | RBAC 角色細粒度 | 至少 5 種角色 + 細粒度 permission（非僅 admin/user） | 🔴 HIGH | NIST AC-2 |
| **IAM-03** | Permission 檢查一致性 | 所有 API 使用統一 middleware/decorator，禁止 inline 檢查 | 🟡 MED | — |
| **IAM-04** | Session 管理 | JWT/Session 有效期 ≤ 24h、refresh token、logout 失效機制 | 🔴 HIGH | OWASP A07 |
| **IAM-05** | 密碼政策 | 最小長度 12、複雜度、bcrypt cost ≥ 12、密碼歷史 | 🟡 MED | NIST IA-5 |
| **IAM-06** | MFA / SSO | 對 admin 強制 MFA、支援 SSO（Azure AD 已整合） | 🟡 MED | NIST IA-2 |
| **IAM-07** | 帳號鎖定 | N 次失敗後鎖定（防 brute force） | 🟡 MED | OWASP A07 |
| **IAM-08** | 特權帳號管理 | Admin 操作有額外驗證、定期審查、最小權限原則 | 🔴 HIGH | SOC2 CC6.3 |
| **IAM-09** | 服務帳號 / API Key | 機器對機器認證有獨立憑證、可輪替 | 🟡 MED | — |
| **IAM-10** | 跨租戶隔離 | RLS (Row Level Security) 或 query filter 強制執行 | 🔴 HIGH | — |

**目前已知狀態**:
- ✅ Auth 覆蓋率 60-73%（200/331 routes，**不足 95%**）
- ⚠️ `/companies/*` 0%、`/cost/*` 0% 完全未保護
- ✅ Azure AD SSO 已整合

---

## 2. DP — 資料保護

> 保護敏感資料（PII、業務機密）的儲存、傳輸、處理。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **DP-01** | PII 識別與分類 | 所有 PII 欄位有標籤、文檔化、禁止 log | 🔴 HIGH | GDPR Art.5 |
| **DP-02** | 資料加密（傳輸） | HTTPS 強制、TLS 1.2+、HSTS | 🔴 HIGH | OWASP A02 |
| **DP-03** | 資料加密（靜態） | 資料庫加密（TDE）、Blob 加密、敏感欄位欄位級加密 | 🔴 HIGH | NIST SC-28 |
| **DP-04** | Secret 管理 | 所有 secret 在 Key Vault / 環境變數，禁止硬編碼 | 🔴 HIGH | OWASP A05 |
| **DP-05** | 資料遮罩 | UI / log / 報表中的 PII 遮罩（e.g., email → a***@x.com） | 🟡 MED | GDPR Art.32 |
| **DP-06** | 資料保留政策 | 文檔化保留期、自動清理過期資料 | 🟡 MED | GDPR Art.5(1)(e) |
| **DP-07** | 資料刪除（GDPR Right to Erasure） | 支援用戶資料刪除請求 | 🟡 MED | GDPR Art.17 |
| **DP-08** | 資料匯出 | 支援用戶資料匯出（GDPR Portability） | 🟢 LOW | GDPR Art.20 |
| **DP-09** | 備份加密 | 備份檔案加密、異地備份、定期還原測試 | 🔴 HIGH | NIST CP-9 |
| **DP-10** | 跨境資料傳輸 | 文檔化資料流向、合規（APAC 涉及多國） | 🟡 MED | GDPR Ch.V |

**目前已知狀態**:
- ✅ FIX-050 修復 PII 洩漏（auth.config.ts）
- ⚠️ console.log 仍有 279 處待逐步清理
- ⚠️ 資料保留政策未文檔化

---

## 3. AppSec — 應用安全

> 防禦 OWASP Top 10 與相依套件漏洞。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **AppSec-01** | 輸入驗證（Zod） | 所有 POST/PATCH/PUT API ≥ 95% 有 Zod schema | 🔴 HIGH | OWASP A03 |
| **AppSec-02** | SQL Injection 防護 | 禁止 `$executeRawUnsafe`，全部使用參數化查詢 | 🔴 HIGH | OWASP A03 |
| **AppSec-03** | XSS 防護 | React 自動轉義、`dangerouslySetInnerHTML` 審查、CSP 啟用 | 🔴 HIGH | OWASP A03 |
| **AppSec-04** | CSRF 防護 | NextAuth CSRF token、SameSite cookie | 🟡 MED | OWASP A01 |
| **AppSec-05** | 檔案上傳安全 | MIME 驗證、大小限制、病毒掃描、隔離儲存 | 🔴 HIGH | OWASP A04 |
| **AppSec-06** | 反序列化安全 | JSON.parse 包裝錯誤處理、禁用危險反序列化 | 🟡 MED | OWASP A08 |
| **AppSec-07** | 相依套件漏洞掃描 | npm audit / Dependabot / Snyk 啟用，HIGH/CRITICAL 零容忍 | 🔴 HIGH | OWASP A06 |
| **AppSec-08** | Headers 安全 | HSTS、X-Frame-Options、X-Content-Type-Options、CSP | 🟡 MED | OWASP A05 |
| **AppSec-09** | API Rate Limiting | 全域 + 端點級 rate limit、防濫用 | 🔴 HIGH | OWASP A04 |
| **AppSec-10** | SSRF 防護 | 外部 URL 白名單、禁止內網存取 | 🟡 MED | OWASP A10 |
| **AppSec-11** | RFC 7807 錯誤格式統一 | 所有 API 統一錯誤格式，避免資訊洩漏 | 🟢 LOW | RFC 7807 |
| **AppSec-12** | LLM Prompt Injection 防護 | 用戶輸入隔離、系統 prompt 保護、輸出驗證 | 🔴 HIGH | OWASP LLM01 |

**目前已知狀態**:
- ⚠️ Zod 驗證覆蓋率 60-65%（不足 95%）
- ✅ FIX-051 修復 SQL Injection（cityCodes 白名單）
- ✅ FIX-052 修復 Rate Limit（Redis + fallback）
- ⚠️ LLM Prompt Injection 未審查

---

## 4. Obs — 可觀測性與監控

> 「看得見」才能「守得住」。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **Obs-01** | Audit Log 覆蓋率 | 所有敏感操作（CRUD on PII、權限變更、Login）100% 記錄 | 🔴 HIGH | SOC2 CC7.2 |
| **Obs-02** | Audit Log 不可竄改 | Append-only、雜湊鏈、獨立儲存 | 🟡 MED | NIST AU-9 |
| **Obs-03** | Security Event Log | 失敗 login、權限拒絕、異常 API 呼叫獨立記錄 | 🔴 HIGH | NIST AU-2 |
| **Obs-04** | 集中式 Log（SIEM） | Application Insights / Sentinel 整合 | 🟡 MED | — |
| **Obs-05** | 告警機制 | 高風險事件即時告警（email / Slack / PagerDuty） | 🔴 HIGH | NIST IR-6 |
| **Obs-06** | 應用效能監控 (APM) | Response time、error rate、資源使用率 | 🟡 MED | — |
| **Obs-07** | Trace ID 端到端 | 每個 request 有 trace ID，貫穿 Node.js + Python | 🟡 MED | — |
| **Obs-08** | Log 保留期 | 至少 90 天熱備、1 年冷備（合規要求） | 🟡 MED | SOC2 CC7.3 |
| **Obs-09** | 異常偵測 | 異常 access pattern、批量下載、權限濫用偵測 | 🟢 LOW | — |
| **Obs-10** | Dashboard | 安全指標儀表板（auth 失敗率、API 錯誤率） | 🟢 LOW | — |

**目前已知狀態**:
- ✅ Audit log 機制存在（`/api/audit/*` 7 個 endpoint）
- ⚠️ 覆蓋率未驗證
- ⚠️ Application Insights 整合狀態未知

---

## 5. Resi — 韌性與災備

> 故障時能撐住、災難後能恢復。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **Resi-01** | Rate Limiting（多實例） | Redis 集中式 rate limit，支援橫向擴展 | 🔴 HIGH | — |
| **Resi-02** | DDoS 防護 | Azure Front Door / WAF / CDN | 🟡 MED | — |
| **Resi-03** | 服務隔離 | 微服務獨立 fault domain（Python OCR / Node.js / DB） | 🟡 MED | — |
| **Resi-04** | Circuit Breaker | 外部依賴（Azure OCR、OpenAI）斷路器保護 | 🟡 MED | — |
| **Resi-05** | Retry / Timeout | 所有外部呼叫有 retry + timeout 策略 | 🟡 MED | — |
| **Resi-06** | 資料庫備份 | 每日全備 + 每小時增備、3-2-1 原則 | 🔴 HIGH | NIST CP-9 |
| **Resi-07** | 還原測試 | 每季實際還原測試，驗證 RTO/RPO | 🔴 HIGH | NIST CP-4 |
| **Resi-08** | RTO / RPO 文檔化 | 業務需求對齊 RTO ≤ 4h、RPO ≤ 1h | 🟡 MED | — |
| **Resi-09** | Incident Response Plan | 文檔化 IR 流程、聯絡名單、演練 | 🔴 HIGH | NIST IR-8 |
| **Resi-10** | 災難演練 | 每年至少一次 DR 演練 | 🟡 MED | — |
| **Resi-11** | Health Check | `/health` 端點、liveness/readiness probe | 🟢 LOW | — |

**目前已知狀態**:
- ✅ FIX-052 修復多實例 rate limit
- ⚠️ DR plan、還原測試、IR plan 未確認

---

## 6. Gov — 治理與合規

> 流程化、可審計、可問責。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **Gov-01** | 變更管理流程 | 所有 prod 變更走 PR + Review + Approval | 🔴 HIGH | SOC2 CC8.1 |
| **Gov-02** | Code Review 強制 | main 分支保護、至少 1 reviewer、CI 必須通過 | 🔴 HIGH | — |
| **Gov-03** | 職責分離 (SoD) | 開發者 ≠ 部署者 ≠ 審計者 | 🟡 MED | SOC2 CC1.3 |
| **Gov-04** | 技術債追蹤 | 文檔化技術債、定期回顧、優先級排序 | 🟡 MED | — |
| **Gov-05** | 第三方風險評估 | Azure / OpenAI / n8n 等供應商風險評估 | 🟡 MED | SOC2 CC9.2 |
| **Gov-06** | DPA / 合約 | 處理 PII 的 SaaS 簽署 Data Processing Agreement | 🔴 HIGH | GDPR Art.28 |
| **Gov-07** | 隱私政策 | 用戶知情同意、文檔化資料用途 | 🔴 HIGH | GDPR Art.13 |
| **Gov-08** | 安全責任人 | 指定 Security Officer / DPO | 🟡 MED | GDPR Art.37 |
| **Gov-09** | 員工資安培訓 | 每年至少一次 security awareness training | 🟡 MED | SOC2 CC1.4 |
| **Gov-10** | Access Review | 每季審查所有 admin 帳號權限 | 🔴 HIGH | SOC2 CC6.3 |
| **Gov-11** | 文檔治理 | 安全相關文檔有版本、審查週期、所有權 | 🟢 LOW | — |
| **Gov-12** | 風險登記簿 | Risk Register 文檔化所有已知風險 | 🟡 MED | NIST RA-3 |

**目前已知狀態**:
- ✅ Conventional Commits + PR 流程
- ⚠️ 職責分離、Access Review、Risk Register 未確認

---

## 7. SDLC — 開發生命週期安全

> 把安全左移到開發階段。

| ID | 檢查項 | 企業級基準 (L3+) | 風險等級 | 參考 |
|----|--------|-----------------|----------|------|
| **SDLC-01** | Secret Scanning | Pre-commit hook + CI 掃描（gitleaks / trufflehog） | 🔴 HIGH | OWASP A05 |
| **SDLC-02** | SAST（靜態掃描） | CI 整合 SAST 工具（Semgrep / SonarQube） | 🟡 MED | — |
| **SDLC-03** | DAST（動態掃描） | 對 staging 環境定期 OWASP ZAP / Burp 掃描 | 🟢 LOW | — |
| **SDLC-04** | SCA（相依套件掃描） | npm audit / Snyk / Dependabot 自動 PR | 🔴 HIGH | OWASP A06 |
| **SDLC-05** | SBOM 生成 | 每次 build 產生 SBOM（CycloneDX / SPDX） | 🟢 LOW | EO 14028 |
| **SDLC-06** | 容器掃描 | Docker image 掃描（Trivy / Snyk） | 🟡 MED | — |
| **SDLC-07** | 程式碼簽章 | Commit GPG 簽章、release artifact 簽章 | 🟢 LOW | — |
| **SDLC-08** | CI/CD 守門 | 安全測試失敗則 block deploy | 🔴 HIGH | — |
| **SDLC-09** | 環境隔離 | dev / staging / prod 完全隔離（網路、憑證、資料） | 🔴 HIGH | NIST SC-7 |
| **SDLC-10** | 安全測試（單元） | 安全相關邏輯有測試（auth、permission、validation） | 🟡 MED | — |
| **SDLC-11** | 滲透測試 | 每年至少一次第三方滲透測試 | 🟡 MED | SOC2 CC4.1 |
| **SDLC-12** | Threat Modeling | 重大功能設計階段做威脅建模 | 🟢 LOW | — |

**目前已知狀態**:
- ⚠️ Secret scanning、SAST、SCA、Pen test 全部未確認
- ✅ Conventional Commits + PR review 流程存在

---

## 評分匯總範本

> Phase 2 現狀盤點時填寫此表。

### 領域成熟度總覽

| 領域 | 檢查項數 | L0 | L1 | L2 | L3 | L4 | 平均分 | 企業就緒？ |
|------|----------|----|----|----|----|----|--------|-----------|
| IAM — 身份與存取 | 10 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| DP — 資料保護 | 10 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| AppSec — 應用安全 | 12 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| Obs — 可觀測性 | 10 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| Resi — 韌性災備 | 11 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| Gov — 治理合規 | 12 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| SDLC — 開發安全 | 12 | ? | ? | ? | ? | ? | ?/4 | ⚠️ / ✅ |
| **總計** | **77** | — | — | — | — | — | **?/4** | — |

### 風險矩陣（Phase 3 產出）

```
          │ 影響度 LOW │ MED        │ HIGH       │
──────────┼───────────┼────────────┼────────────┤
機率 HIGH │ 觀察      │ 計劃修復   │ 立即修復   │
機率 MED  │ 接受      │ 計劃修復   │ 計劃修復   │
機率 LOW  │ 接受      │ 接受      │ 計劃修復   │
```

### 企業就緒度判定

- **🔴 NOT READY**: HIGH 風險項 ≥ 1 個低於 L2
- **🟡 PARTIALLY READY**: HIGH 全部 L2+，MEDIUM 部分低於 L2
- **🟢 READY**: HIGH ≥ L3，MEDIUM ≥ L2，LOW 無重大缺口

---

## 📌 Phase 1 完成標準

Review 此矩陣時請確認：

- [ ] 7 大領域是否覆蓋本項目所有風險面（無漏項）
- [ ] 77 個檢查項中是否有不適用本項目的（標註為 N/A）
- [ ] 企業級基準（L3+）門檻是否符合預期（過嚴 / 過鬆？）
- [ ] 是否有額外要納入的領域（e.g., AI/LLM 治理、跨境資料）
- [ ] 風險等級分類（HIGH/MED/LOW）是否符合公司風險偏好

確認後即進入 **Phase 2: 現狀盤點**。

---

*建立日期: 2026-04-28*
*版本: 1.0.0*
*下一步: Review 此矩陣 → 進入 Phase 2*
