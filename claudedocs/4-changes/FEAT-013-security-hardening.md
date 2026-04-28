# FEAT-013: 企業級安全與治理強化（Security & Governance Hardening）

> **建立日期**: 2026-04-28
> **版本**: 2.0.0（重構：採用 7 領域框架 + L0-L4 成熟度模型）
> **負責人**: Development Team + Security Lead（待指派）
> **預計完成**: 2026-Q3（分 4 階段）
> **狀態**: 📋 Phase 1 規劃中（矩陣 Review）
> **參考標準**: OWASP ASVS L2、NIST CSF v2.0、SOC2 Type II、ISO 27001、CIS Controls v8、GDPR
> **參考來源**: `docs/development-log/enterprise-security-governance-sample.md`（公司內部企業級評估矩陣 v1.0）

---

## 📑 目錄

1. [概述與雙目標](#1-概述與雙目標)
2. [評分模型 L0-L4](#2-評分模型-l0-l4)
3. [基線盤點](#3-基線盤點)
4. [七大領域檢查矩陣](#4-七大領域檢查矩陣)
   - [4.1 IAM — 身份與存取管理](#41-iam--身份與存取管理10-項)
   - [4.2 DP — 資料保護](#42-dp--資料保護10-項)
   - [4.3 AppSec — 應用安全](#43-appsec--應用安全12-項)
   - [4.4 Obs — 可觀測性與監控](#44-obs--可觀測性與監控10-項)
   - [4.5 Resi — 韌性與災備](#45-resi--韌性與災備11-項)
   - [4.6 Gov — 治理與合規](#46-gov--治理與合規12-項)
   - [4.7 SDLC — 開發生命週期安全](#47-sdlc--開發生命週期安全12-項)
5. [對標框架對應表](#5-對標框架對應表)
6. [評分匯總範本（Phase 2 填寫）](#6-評分匯總範本phase-2-填寫)
7. [風險矩陣與企業就緒度](#7-風險矩陣與企業就緒度)
8. [分階段實施計畫](#8-分階段實施計畫)
9. [影響範圍](#9-影響範圍)
10. [風險與取捨](#10-風險與取捨)
11. [驗收標準](#11-驗收標準)

---

## 1. 概述與雙目標

### 1.1 雙目標

依使用者需求（2026-04-28），本 Feature 同時追求：

- **對外宣稱企業級**：對標 OWASP ASVS L2、NIST CSF、SOC 2 TSC、ISO 27001、GDPR
- **技術上更穩**：純風險降低，覆蓋 OWASP Top 10、CWE Top 25、Azure Security Baseline

### 1.2 評估範圍

七大領域共 **77 個檢查項**（採用公司內部 sample matrix），對映：
- 既有 17 項 SEC（`security-review.md`，部分已由 FIX-101~137 修復）
- 新增 32 項 GAP（2026-04-28 Explore agent 補齊）
- 部分項目首次納入（GDPR、LLM 安全、APM、SIEM、SDLC 工具鏈等）

### 1.3 不在本次範圍

- 第三方滲透測試正式委託（屬 Phase 4 完成後）
- SOC 2 / ISO 27001 正式認證（需先補齊技術控制項，認證走獨立 6-12 個月流程）
- Bug Bounty 計畫（屬營運層決策）
- NextAuth → Auth.js v5 升級（獨立技術債）

---

## 2. 評分模型 L0-L4

每個檢查項依以下 5 級評分：

| 等級 | 名稱 | 描述 |
|------|------|------|
| **L0** | Absent（不存在） | 完全未實作或無相關控制 |
| **L1** | Initial（初始） | 有基礎機制但不完整、不一致、無文件 |
| **L2** | Managed（已管理） | 主要場景已覆蓋、有部分文件、可重複執行 |
| **L3** | Defined（已定義） | **企業級基準** — 全面覆蓋、文件化、流程化、自動化 |
| **L4** | Optimized（已優化） | 持續改善、量化指標、整合稽核 |

**企業就緒門檻**：
- 🔴 風險項：必須 ≥ L3
- 🟡 風險項：建議 ≥ L2
- 🟢 風險項：可接受 L1+

---

## 3. 基線盤點

### 3.1 已有資產

| 資產 | 內容 | 引用 |
|------|------|------|
| Codebase 安全審查 | 17 項發現（SEC-001~017） | `docs/codebase-analyze/10-issues-and-debt/security-review.md` |
| 既有修補記錄 | FIX-101~137（34 項已修復） | `claudedocs/4-changes/bug-fixes/FIX-101-103-security-auth-fixes.md` |
| 技術債清單 | DEBT-001~005+ | `docs/codebase-analyze/10-issues-and-debt/tech-debt.md` |
| Azure 部署規格 | 個人 + 公司環境已部署 | `docs/codebase-analyze/01-project-overview/azure-infrastructure.md` |
| 企業矩陣 sample | 公司內部 v1.0 | `docs/development-log/enterprise-security-governance-sample.md` |

### 3.2 不適用項目（N/A）

| 項目 | 原因 |
|------|------|
| AppSec-10 SSRF 防護 | 本專案無外部 URL fetch / proxy 行為（待 Epic 10 整合 ERP/HR 時重新評估） |
| IAM-09 Service Account / API Key | 目前無 M2M 場景；Epic 10 整合時納入 |

---

## 4. 七大領域檢查矩陣

> **格式說明**：每項檢查含 ID、名稱、企業級基準（L3+）、風險等級、本專案目前評估、對應既有 SEC/GAP、修補步驟、驗收標準。

---

### 4.1 IAM — 身份與存取管理（10 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **IAM-01** | API 路由認證覆蓋率 | ≥ 95%，公開 API 白名單 | 🔴 HIGH | **L1** | SEC-001/002, GAP-2-1 |
| **IAM-02** | RBAC 角色細粒度 | ≥ 5 角色 + 細粒度 permission | 🔴 HIGH | **L2** | FEAT-011 已部分 |
| **IAM-03** | Permission 檢查一致性 | 統一 middleware/decorator | 🟡 MED | **L1** | GAP-2-2, GAP-2-4 |
| **IAM-04** | Session 管理 | JWT ≤ 24h、refresh、logout 失效 | 🔴 HIGH | **L1** | GAP-1-2 |
| **IAM-05** | 密碼政策 | 12+ 字元、複雜度、bcrypt cost ≥ 12、歷史 | 🟡 MED | **L2** | SEC-005, GAP-1-1 |
| **IAM-06** | MFA / SSO | Admin 強制 MFA、SSO 整合 | 🟡 MED | **L1** | GAP-1-3 |
| **IAM-07** | 帳號鎖定 | N 次失敗鎖定、防 brute force | 🟡 MED | **L0** | GAP-1-4 |
| **IAM-08** | 特權帳號管理 | Admin 額外驗證、定期審查、最小權限 | 🔴 HIGH | **L1** | GAP-8-5 |
| **IAM-09** | 服務帳號 / API Key | M2M 獨立憑證、可輪替 | 🟡 MED | **N/A** | （Epic 10 重評估） |
| **IAM-10** | 跨租戶隔離 / 資源所有權 | RLS / query filter 強制 | 🔴 HIGH | **L1** | SEC-008, GAP-2-2, GAP-2-3 |

**IAM 重點修補步驟**

#### IAM-01 修補（達 L3）
1. 列舉現有 24 個 publicProcedure（Health Router 12 個 + Auth + Health.ping/dbCheck）
2. 所有 `diag*` → protectedProcedure；`fix*` / `schema*` → adminProcedure
3. 新增 ESLint plugin 阻止未審核的新 publicProcedure
4. 自訂 procedure 統計腳本，CI 報告覆蓋率 ≥ 95%

#### IAM-04 修補（達 L3）
1. 新增 UserSession model（userId、deviceFingerprint、ip、userAgent、expiresAt）
2. NextAuth 配置：JWT 24h，refresh token 7d
3. Settings 頁顯示登入裝置清單 + 撤銷
4. 提供 `user.revokeAllSessions` API（密碼變更時自動觸發）

#### IAM-06 修補（達 L3）
1. User model 增 mfaEnabled、mfaSecret（加密）、backupCodes
2. 整合 `otplib` TOTP；Google Authenticator / Authy 相容
3. Admin / Supervisor 強制 MFA（signIn callback 拒絕未啟用者）
4. Backup Codes 一次性使用機制

#### IAM-07 修補（達 L3）
1. User 增 failedLoginAttempts、lockedUntil
2. authorize callback 失敗時 increment；5 次後鎖 15 min
3. 鎖定事件記錄到 AuditLog
4. 不洩漏「密碼錯誤」vs「帳號鎖定」差異訊息

#### IAM-10 修補（達 L3）
1. 建立 `packages/api/src/lib/ownership.ts` middleware
2. 所有 update/delete mutation 加 `where: { ..., createdById: ctx.session.user.id }`
3. 建立 `getAuthorizedOpCoIds(userId)` utility，所有列表強制過濾
4. Playwright E2E：跨用戶/跨 OpCo 操作回 403

---

### 4.2 DP — 資料保護（10 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **DP-01** | PII 識別與分類 | 標籤、文件、禁止 log | 🔴 HIGH | **L0** | GAP-3-3 |
| **DP-02** | 資料加密（傳輸） | HTTPS 強制、TLS 1.2+、HSTS | 🔴 HIGH | **L2** | GAP-3-2（部分） |
| **DP-03** | 資料加密（靜態） | TDE、Blob 加密、欄位級加密 | 🔴 HIGH | **L1** | GAP-3-3 |
| **DP-04** | Secret 管理 | Key Vault / 環境變數，禁硬編碼 | 🔴 HIGH | **L1** | GAP-3-1 |
| **DP-05** | 資料遮罩 | UI/log/報表 PII 遮罩 | 🟡 MED | **L0** | （新增） |
| **DP-06** | 資料保留政策 | 文件化、自動清理 | 🟡 MED | **L0** | GAP-5-3 |
| **DP-07** | GDPR Right to Erasure | 支援用戶資料刪除請求 | 🟡 MED | **L0** | （新增） |
| **DP-08** | GDPR Data Portability | 支援用戶資料匯出 | 🟢 LOW | **L0** | （新增） |
| **DP-09** | 備份加密 | 加密、異地、定期還原測試 | 🔴 HIGH | **L1** | GAP-8-3 |
| **DP-10** | 跨境資料傳輸 | 資料流向文件化 | 🟡 MED | **L0** | （新增，APAC 多國） |

**DP 重點修補步驟**

#### DP-01 修補（達 L3）
1. 建立 `docs/governance/data-classification.md`（涵蓋 32 個 model）
2. Schema 加 `/// @pii` JSDoc 標記（email、name、phone、address）
3. ESLint 規則：禁止 `console.log` 直接輸出 User / sensitive entity
4. 認證模組移除 SEC-004 的 18+ 處 console.log

#### DP-04 修補（達 L3）
1. 新增 `packages/config/src/keyVault.ts` 整合 `@azure/identity` + `@azure/keyvault-secrets`
2. App Service 啟用 Managed Identity，授予 Key Vault `Secrets User`
3. Startup 從 Key Vault 載入：NEXTAUTH_SECRET、AZURE_AD_CLIENT_SECRET、SENDGRID_API_KEY、AZURE_STORAGE_ACCOUNT_KEY
4. `.env.production` 移除所有 plaintext 密鑰（改 Key Vault reference）
5. 文件 `docs/deployment/key-vault-setup.md`

#### DP-05 修補（達 L3，**新增需求**）
1. 建立 `packages/utils/src/masking.ts` 提供 `maskEmail()` / `maskPhone()` / `maskName()` 函數
2. 後台稽核日誌頁面（/admin/audit-log）顯示 PII 時遮罩
3. 匯出報表時依角色決定是否遮罩
4. Logger 中介層自動偵測 PII pattern 並遮罩

#### DP-06 修補（達 L3）
1. 文件化保留政策：操作日誌 2 年、認證日誌 1 年、附件 7 年（依稅務法規）
2. Azure Function（Timer trigger）每月歸檔 AuditLog 到 Blob Cool tier
3. 歸檔後資料不可修改（isArchived = true）

#### DP-07 / DP-08 修補（達 L3，**新增需求**）
1. 新增 `user.exportMyData` procedure（GDPR Portability，回傳 JSON）
2. 新增 `user.requestErasure` procedure（建立刪除請求 → 30 天等待 → Admin 確認 → 軟刪除 + 匿名化）
3. 文件 `docs/governance/gdpr-data-subject-rights.md`
4. UI：Settings → 隱私 → 「下載我的資料」/「刪除我的帳號」

#### DP-10 修補（達 L3，**新增需求**）
1. 文件化資料流向圖（哪些資料存在哪個 region）
2. Azure 確認 PostgreSQL / Blob region（個人 / 公司環境分別記錄）
3. 評估是否觸及 GDPR Chapter V（歐盟資料）或台灣個資法跨境傳輸要求

#### DP-09 修補（達 L3）
1. RPO = 1h、RTO = 4h（文件化於 disaster-recovery-plan.md）
2. Azure PostgreSQL：啟用 Geo-redundant backup、保留 35 天、PITR
3. 月度還原測試（在 staging 還原 prod backup 並驗證資料完整性）
4. AuditLog 額外 export 到 immutable Blob

---

### 4.3 AppSec — 應用安全（12 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **AppSec-01** | 輸入驗證（Zod） | POST/PATCH/PUT ≥ 95% 有 schema | 🔴 HIGH | **L2** | SEC-009, GAP-4-1 |
| **AppSec-02** | SQL Injection 防護 | 禁 `$executeRawUnsafe`，全參數化 | 🔴 HIGH | **L2** | SEC-010, GAP-4-4 |
| **AppSec-03** | XSS 防護 | React 自動轉義、CSP 啟用 | 🔴 HIGH | **L2** | SEC-015, GAP-4-3, GAP-7-4 |
| **AppSec-04** | CSRF 防護 | NextAuth CSRF token、SameSite | 🟡 MED | **L2** | SEC-014, GAP-7-3 |
| **AppSec-05** | 檔案上傳安全 | MIME、大小、病毒掃描、隔離 | 🔴 HIGH | **L1** | SEC-011, SEC-006, GAP-4-2 |
| **AppSec-06** | 反序列化安全 | JSON.parse 包裝、禁危險反序列化 | 🟡 MED | **L1** | （未深入評估） |
| **AppSec-07** | 相依套件漏洞掃描 | npm audit / Dependabot，HIGH/CRITICAL 0 容忍 | 🔴 HIGH | **L1** | GAP-6-1 |
| **AppSec-08** | Headers 安全 | HSTS、X-Frame-Options、CSP | 🟡 MED | **L2** | FIX-109, GAP-7-4 |
| **AppSec-09** | API Rate Limiting | 全域 + 端點級 | 🔴 HIGH | **L0** | SEC-003, SEC-016, GAP-7-1 |
| **AppSec-10** | SSRF 防護 | 外部 URL 白名單 | 🟡 MED | **N/A** | （Epic 10 重評估） |
| **AppSec-11** | 統一錯誤格式 | RFC 7807 / 內部標準 | 🟢 LOW | **L1** | （新增） |
| **AppSec-12** | LLM Prompt Injection 防護 | 用戶輸入隔離、系統 prompt 保護、輸出驗證 | 🔴 HIGH | **N/A → Epic 9 必備** | （新增） |

**AppSec 重點修補步驟**

#### AppSec-01 修補（達 L3）
1. 撰寫 `scripts/check-zod-coverage.js` 統計 mutation/query 的 Zod 覆蓋率
2. CI 加 step：覆蓋率低於 95% 失敗
3. 全 codebase 補加邊界值：`z.string().max(255)`、`z.number().max(999999999).min(0)`、`z.array(...).max(100)`

#### AppSec-05 修補（達 L3）
1. 安裝 `file-type` 套件做 magic byte 偵測
2. 三重驗證：副檔名 + Content-Type + Magic Byte（白名單：PDF、XLSX、PNG、JPG）
3. 所有 `/api/upload/*` 加認證檢查（SEC-006）
4. 拒絕事件記錄 AuditLog
5. （可選）整合 Azure Defender for Storage 病毒掃描

#### AppSec-07 修補（達 L3）
1. 建立 `.github/renovate.json`（每週掃描、auto-merge patch）
2. CI 加 `pnpm audit --audit-level=high`，失敗 block merge
3. 移除重複依賴（bcrypt vs bcryptjs，SEC-017）
4. 新增 `SECURITY.md`（揭露漏洞回報流程 + 24h 回應 SLA）

#### AppSec-09 修補（達 L3，**Critical**）
1. 安裝 `@upstash/ratelimit` + `@upstash/redis`（或自架 Redis）
2. 全域 middleware：100 req/min/IP
3. 敏感端點嚴格限制：
   - `/api/auth/register`: 5/min/IP
   - `/api/auth/[...nextauth]/callback/credentials`: 10/min/IP
   - `/api/upload/*`: 20/min/user
4. tRPC middleware：mutation 50/min/user、query 200/min/user
5. 超限回 429 + `Retry-After` header；觸發紀錄 AuditLog

#### AppSec-11 修補（達 L3，**新增需求**）
1. 建立統一錯誤格式（基於 RFC 7807 ProblemDetails）
2. tRPC error formatter 套用統一格式
3. /api/* 自訂路由也套用（透過 wrapper）
4. 確保不洩漏堆疊 / 內部路徑 / DB 結構訊息

#### AppSec-12 修補（達 L3，**Epic 9 規劃時必備**）
1. **規劃階段先文件化**：`docs/governance/llm-security-policy.md`
2. AI Assistant 模組（Epic 9）開發時：
   - 用戶輸入與系統 prompt 嚴格分離（structured input）
   - Prompt template 版本控制（防止注入修改）
   - 輸出驗證（如金額建議須在合理區間）
   - 拒絕讓 LLM 直接執行 mutation（必須走 user confirmation）
3. 建立 LLM Red Team 測試清單（OWASP LLM Top 10）

---

### 4.4 Obs — 可觀測性與監控（10 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **Obs-01** | Audit Log 覆蓋率 | 敏感操作 100% | 🔴 HIGH | **L1** | GAP-5-1 |
| **Obs-02** | Audit Log 不可竄改 | Append-only、雜湊鏈 | 🟡 MED | **L0** | GAP-5-4 |
| **Obs-03** | Security Event Log | 失敗 login、權限拒絕、異常 API 獨立記錄 | 🔴 HIGH | **L1** | GAP-5-2 |
| **Obs-04** | 集中式 Log（SIEM） | Application Insights / Sentinel | 🟡 MED | **L0** | （新增） |
| **Obs-05** | 告警機制 | 高風險事件即時告警 | 🔴 HIGH | **L0** | （新增，搭配 IR） |
| **Obs-06** | 應用效能監控 (APM) | Response time、error rate、資源 | 🟡 MED | **L0** | （新增） |
| **Obs-07** | Trace ID 端到端 | 每 request 有 trace ID | 🟡 MED | **L0** | （新增） |
| **Obs-08** | Log 保留期 | ≥ 90 天熱備、1 年冷備 | 🟡 MED | **L0** | GAP-5-3 |
| **Obs-09** | 異常偵測 | 異常 access pattern、批量下載偵測 | 🟢 LOW | **L0** | （新增） |
| **Obs-10** | 安全 Dashboard | auth 失敗率、API 錯誤率指標 | 🟢 LOW | **L0** | （新增） |

**Obs 重點修補步驟**

#### Obs-01 修補（達 L3）
1. Migration：新增通用 AuditLog model（取代僅涵蓋 BudgetProposal 的 History）
   ```prisma
   model AuditLog {
     id            String   @id @default(uuid())
     entityType    String
     entityId      String
     action        String
     userId        String?
     changedFields Json?
     ipAddress     String?
     userAgent     String?
     timestamp     DateTime @default(now())
     @@index([entityType, entityId])
     @@index([userId, timestamp])
   }
   ```
2. `packages/api/src/lib/auditLog.ts` 提供 `logAudit()` helper
3. tRPC middleware 自動記錄敏感 routers 的 mutation
4. 涵蓋：User CRUD、Permission 變更、Project 狀態、Expense 核准、ChargeOut 確認、檔案上傳、登入登出
5. /admin/audit-log 頁面提供查詢 UI

#### Obs-02 修補（達 L3）
1. 應用層：移除所有 auditLog.update / auditLog.delete 呼叫
2. DB 層：PostgreSQL Row-Level Security 阻止 UPDATE/DELETE
3. （可選）pgAudit extension 啟用
4. （高階）每日批次 HMAC SHA256 簽章鏈 + 寫入 immutable Blob

#### Obs-04 修補（達 L3，**新增需求**）
1. 整合 Azure Application Insights（前後端）
2. 設定 sampling rate（dev 100%、prod 10%）
3. 規劃 Azure Sentinel（如組織已有 SIEM）
4. 文件 `docs/governance/observability-stack.md`

#### Obs-05 修補（達 L3，**新增需求，Critical**）
1. Application Insights 設定告警規則：
   - 5 分鐘內 ≥ 50 次登入失敗 → P1 告警
   - 5xx 錯誤率 > 5% → P2 告警
   - AuditLog 寫入失敗 → P1 告警
2. 告警通道：Email（必）+ Microsoft Teams Webhook（建議）
3. 與 IR Plan（Gov-08）聯動

#### Obs-06 修補（達 L3，**新增需求**）
1. Application Insights APM 啟用
2. 自訂指標：tRPC procedure 平均響應時間、Prisma query 慢查詢
3. Dashboard：Top 10 慢端點、錯誤率、流量

#### Obs-07 修補（達 L3，**新增需求**）
1. 中介層注入 `x-correlation-id` header（uuid）
2. tRPC context 傳遞 correlationId
3. Prisma logger 加 correlationId 標籤
4. Application Insights 自動關聯（已支援）

---

### 4.5 Resi — 韌性與災備（11 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **Resi-01** | Rate Limiting（多實例） | Redis 集中式 | 🔴 HIGH | **L0** | AppSec-09 / GAP-7-1 |
| **Resi-02** | DDoS 防護 | Azure Front Door / WAF / CDN | 🟡 MED | **L0** | （新增） |
| **Resi-03** | 服務隔離 | 微服務獨立 fault domain | 🟡 MED | **L1** | （單體 monorepo，部分） |
| **Resi-04** | Circuit Breaker | 外部依賴斷路器 | 🟡 MED | **L0** | （新增） |
| **Resi-05** | Retry / Timeout | 所有外部呼叫 | 🟡 MED | **L1** | （新增，部分有） |
| **Resi-06** | 資料庫備份 | 每日全備 + 增備、3-2-1 | 🔴 HIGH | **L1** | GAP-8-3 / DP-09 |
| **Resi-07** | 還原測試 | 每季實際還原 | 🔴 HIGH | **L0** | GAP-8-3 |
| **Resi-08** | RTO / RPO 文件化 | 業務需求對齊 | 🟡 MED | **L0** | GAP-8-3 |
| **Resi-09** | Incident Response Plan | 文件、聯絡名單、演練 | 🔴 HIGH | **L0** | GAP-8-2 |
| **Resi-10** | 災難演練 | 每年 ≥ 1 次 | 🟡 MED | **L0** | （新增） |
| **Resi-11** | Health Check | /health、liveness/readiness | 🟢 LOW | **L1** | （新增，部分有） |

**Resi 重點修補步驟**

#### Resi-02 修補（達 L3，**新增需求**）
1. 評估 Azure Front Door + WAF（適用 enterprise SKU）
2. 至少啟用 Azure App Service 的內建 IP 限制 + DDoS Protection Basic
3. CDN（Cloudflare 或 Azure CDN）緩衝靜態資源
4. 文件 `docs/deployment/network-security.md`

#### Resi-04 修補（達 L3，**新增需求**）
1. 安裝 `cockatiel` 或 `opossum` 斷路器套件
2. 包裝外部呼叫：
   - Azure AD（已有 NextAuth 處理）
   - SendGrid / Mailhog
   - Azure Blob Storage
   - 未來 OpenAI / Azure OpenAI（Epic 9）
3. 失敗閾值（5 次 / 30s）→ 開斷路器 60s

#### Resi-05 修補（達 L3，**新增需求**）
1. 統一外部呼叫 wrapper（含 retry exponential backoff + timeout）
2. 預設 3 次 retry、30s timeout
3. 失敗記錄 AuditLog

#### Resi-09 修補（達 L3，**Critical**）
1. 建立 `docs/governance/incident-response-plan.md`：
   - 事件分級（P0 資料洩漏、P1 認證繞過、P2 服務中斷、P3 一致性）
   - 聯絡清單（on-call、Security Lead、業務 owner）
   - SLA：P0 15min、P1 30min、P2 2h、P3 24h
   - 證據保留（GDPR 24h 通知）
2. 建立 sub-runbooks：
   - `data-breach-runbook.md`
   - `ddos-runbook.md`
   - `account-takeover-runbook.md`
3. 每季 tabletop exercise，紀錄結果

#### Resi-11 修補（達 L3，**新增需求**）
1. 確認現有 `health.ping` / `health.dbCheck`（保留為 publicProcedure）
2. App Service 設定 health check path
3. K8s（如使用）區分 liveness（程序存活）vs readiness（可接流量）

---

### 4.6 Gov — 治理與合規（12 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **Gov-01** | 變更管理流程 | PR + Review + Approval | 🔴 HIGH | **L2** | GAP-8-1 |
| **Gov-02** | Code Review 強制 | main 保護、≥ 1 reviewer、CI 通過 | 🔴 HIGH | **L2** | GAP-8-4 |
| **Gov-03** | 職責分離 (SoD) | 開發 ≠ 部署 ≠ 審計 | 🟡 MED | **L0** | GAP-8-4 |
| **Gov-04** | 技術債追蹤 | 文件、回顧、優先級 | 🟡 MED | **L2** | tech-debt.md 已有 |
| **Gov-05** | 第三方風險評估 | 供應商風險評估 | 🟡 MED | **L0** | （新增） |
| **Gov-06** | DPA / 合約 | 處理 PII 的 SaaS 簽 DPA | 🔴 HIGH | **L0** | （新增） |
| **Gov-07** | 隱私政策 | 用戶知情同意、文件化 | 🔴 HIGH | **L0** | （新增） |
| **Gov-08** | 安全責任人 | Security Officer / DPO | 🟡 MED | **L0** | （新增） |
| **Gov-09** | 員工資安培訓 | 每年 ≥ 1 次 | 🟡 MED | **L0** | （新增） |
| **Gov-10** | Access Review | 每季審查 admin 帳號 | 🔴 HIGH | **L0** | GAP-8-5 |
| **Gov-11** | 文件治理 | 版本、審查週期、所有權 | 🟢 LOW | **L1** | （新增） |
| **Gov-12** | Risk Register | 所有已知風險文件化 | 🟡 MED | **L1** | （新增，本文件即雛形） |

**Gov 重點修補步驟**

#### Gov-03 修補（達 L3）
1. 定義角色與權限：
   - **Developer**：code commit，無 prod DB / 密鑰存取
   - **DevOps**：部署審批，有 prod 存取但無 code 變更權
   - **Security**：唯讀 audit log + 權限管理
2. GitHub branch protection：main 不可直接 push（含 admin），需 1+ reviewer + CI 通過
3. 生產 Environment：4-eye approval（GitHub Environment 規則）
4. 所有敏感操作（seed、schema fix、role 變更）記錄 AuditLog

#### Gov-05 修補（達 L3，**新增需求**）
1. 建立 `docs/governance/vendor-risk-assessment.md`
2. 評估供應商：Azure（PostgreSQL、Blob、AD、App Service）、SendGrid、未來 OpenAI
3. 每個供應商紀錄：服務類型、SOC 2 / ISO 27001 認證、處理 PII？、DPA 簽署狀態
4. 年度 review

#### Gov-06 修補（達 L3，**新增需求**）
1. 列出處理 PII 的 SaaS 清單
2. 簽署 DPA（Azure：標準 DPA 已含於 MCA；SendGrid 需單獨簽）
3. 文件 `docs/governance/dpa-register.md`
4. （視業務）法務確認跨境傳輸條款

#### Gov-07 修補（達 L3，**新增需求**）
1. 撰寫 Privacy Policy（中英）
2. 登入 / 註冊頁面同意點擊（Cookie consent + Privacy Policy）
3. 文件用途：身份驗證、業務操作、稽核日誌、（未來）AI 建議
4. 用戶可請求查詢 / 刪除（連動 DP-07）

#### Gov-08 修補（達 L3，**新增需求**）
1. 指派 Security Officer（建議：技術主管或 CTO）
2. 視業務需要指派 DPO（GDPR Art.37：規模大或核心業務涉 PII 時必要）
3. 文件 `docs/governance/security-roles-and-responsibilities.md`

#### Gov-09 修補（達 L3，**新增需求**）
1. 年度 security awareness training（OWASP Top 10、phishing、密碼管理、社工）
2. 新進員工 onboarding 必修
3. 紀錄完成名單

#### Gov-10 修補（達 L3）
1. 建立 `docs/governance/access-review-process.md`
2. 季度審查所有 Admin / Supervisor → 業務 owner 確認
3. 自動 script：90 天未活躍用戶標記 → Admin 確認後 disable
4. 離職 SOP：HR 通知 → 24h 內 disable + 轉移資料 owner

#### Gov-11 修補（達 L3，**新增需求**）
1. 文件 `docs/governance/document-governance.md`：
   - 安全文件分類（policy / procedure / runbook / standard）
   - 審查週期（policy 年度、runbook 季度）
   - 所有權（誰負責更新）
2. 每份治理文件 frontmatter 加 `owner` / `reviewedAt` / `nextReview`

#### Gov-12 修補（達 L3，**新增需求**）
1. 本 FEAT-013 即為初版 Risk Register
2. 後續單獨拉出 `docs/governance/risk-register.md`
3. 每項風險：ID、描述、機率、影響、處置（mitigate / accept / transfer / avoid）、owner、due date
4. 季度 review + update

---

### 4.7 SDLC — 開發生命週期安全（12 項）

| ID | 檢查項 | 企業級基準 (L3+) | 風險 | 目前評估 | 對應 |
|----|--------|-----------------|------|---------|------|
| **SDLC-01** | Secret Scanning | Pre-commit + CI（gitleaks） | 🔴 HIGH | **L0** | （新增） |
| **SDLC-02** | SAST | Semgrep / SonarQube | 🟡 MED | **L0** | （新增） |
| **SDLC-03** | DAST | OWASP ZAP / Burp 對 staging | 🟢 LOW | **L0** | （新增） |
| **SDLC-04** | SCA（相依套件） | npm audit / Snyk / Dependabot | 🔴 HIGH | **L0** | AppSec-07 |
| **SDLC-05** | SBOM 生成 | CycloneDX / SPDX | 🟢 LOW | **L0** | GAP-6-2 |
| **SDLC-06** | 容器掃描 | Trivy / Snyk | 🟡 MED | **L0** | （新增） |
| **SDLC-07** | 程式碼簽章 | Commit GPG、release 簽章 | 🟢 LOW | **L0** | （新增） |
| **SDLC-08** | CI/CD 守門 | 安全測試失敗則 block | 🔴 HIGH | **L1** | （部分） |
| **SDLC-09** | 環境隔離 | dev / staging / prod 完全隔離 | 🔴 HIGH | **L2** | （個人 + 公司環境已分） |
| **SDLC-10** | 安全測試（單元） | auth、permission、validation 有測試 | 🟡 MED | **L0** | （新增） |
| **SDLC-11** | 滲透測試 | 每年 ≥ 1 次第三方 | 🟡 MED | **L0** | （新增） |
| **SDLC-12** | Threat Modeling | 重大功能設計階段 | 🟢 LOW | **L0** | （新增） |

**SDLC 重點修補步驟**

#### SDLC-01 修補（達 L3，**新增需求**）
1. Pre-commit hook：`gitleaks` 或 `trufflehog`（透過 husky）
2. CI step：每個 PR 掃描全 history
3. 已洩漏密鑰自動撤銷流程（runbook）

#### SDLC-02 修補（達 L3，**新增需求**）
1. 評估 Semgrep（OSS、規則豐富）vs SonarCloud
2. CI 整合：每 PR 掃描，HIGH/CRITICAL 阻擋 merge
3. 自訂規則：禁 publicProcedure（搭配 IAM-01）、禁 `as any`、禁 dangerouslySetInnerHTML

#### SDLC-04 修補（達 L3）
1. `.github/renovate.json`（每週掃描、auto-merge patch）
2. CI 加 `pnpm audit --audit-level=high`，失敗 block
3. SECURITY.md 漏洞回報流程

#### SDLC-08 修補（達 L3）
1. CI 整合所有安全 step：lint、typecheck、audit、SAST、Zod 覆蓋率、validate:i18n
2. main 分支保護：所有 step 通過才能 merge
3. 部署 workflow：staging 自動部署 + smoke test，prod 需 approval

#### SDLC-10 修補（達 L3，**新增需求**）
1. 為認證模組（packages/auth）撰寫 unit test（Jest + ts-mock）
2. tRPC permission middleware 撰寫整合 test
3. Zod schema 撰寫驗證 test（成功 + 失敗 case）
4. 目標覆蓋率：認證 / 授權邏輯 ≥ 80%

#### SDLC-11 修補（達 L3，**新增需求**）
1. Phase 1-3 完成後，年度委託第三方滲透測試
2. 範圍：Web App + Auth + Azure 配置
3. 報告分級：Critical / High 30 日內修復；Medium / Low 90 日

#### SDLC-12 修補（達 L3，**新增需求**）
1. Epic 9（AI Assistant）+ Epic 10（外部整合）設計階段執行 STRIDE 威脅建模
2. 文件 `docs/governance/threat-models/epic-9-ai-assistant.md`
3. 範本：assets、threats（STRIDE）、mitigations、residual risks

---

## 5. 對標框架對應表

### 5.1 OWASP ASVS Level 2

| ASVS 章節 | 涵蓋 Check |
|-----------|-----------|
| V2 Authentication | IAM-04, 05, 06, 07 |
| V3 Session Management | IAM-04 |
| V4 Access Control | IAM-01, 02, 03, 08, 10 |
| V5 Validation, Sanitization | AppSec-01, 02, 03, 05 |
| V6 Stored Cryptography | DP-03, 04 |
| V7 Error Handling, Logging | Obs-01, 02, 03, AppSec-11 |
| V11 Business Logic | AppSec-09 |
| V13 API and Web Service | AppSec-04 |
| V14 Configuration | AppSec-08 |

### 5.2 NIST CSF v2.0

| 職能 | 涵蓋 |
|------|------|
| **Identify (ID)** | DP-01, Gov-04, 05, 12 |
| **Protect (PR)** | IAM-*, DP-*, AppSec-* |
| **Detect (DE)** | Obs-* |
| **Respond (RS)** | Resi-09, Gov-08 |
| **Recover (RC)** | Resi-06, 07, 08, 10 |

### 5.3 SOC 2 Trust Service Criteria

| TSC | 涵蓋 |
|-----|------|
| CC1.3 SoD | Gov-03 |
| CC1.4 Training | Gov-09 |
| CC4.1 Pen Test | SDLC-11 |
| CC6.1 Logical Access | IAM-* |
| CC6.3 特權帳號 | IAM-08, Gov-10 |
| CC6.6 Encryption | DP-02, 03, 04, 09 |
| CC7.2 Audit | Obs-01, 02 |
| CC7.3 Monitoring | Obs-* |
| CC8.1 Change Mgmt | Gov-01, 02 |
| CC9.2 Vendor Risk | Gov-05 |

### 5.4 GDPR

| Article | 涵蓋 |
|---------|------|
| Art.5 Data Minimization | DP-01, 06 |
| Art.13 透明度 | Gov-07 |
| Art.17 Right to Erasure | DP-07 |
| Art.20 Portability | DP-08 |
| Art.28 Processor | Gov-06 |
| Art.32 Security | DP-02, 03, 05 |
| Art.37 DPO | Gov-08 |
| Ch.V 跨境傳輸 | DP-10 |

### 5.5 OWASP Top 10 (2021) + LLM Top 10

| 項目 | 涵蓋 |
|------|------|
| A01 Broken Access Control | IAM-01, 10 |
| A02 Cryptographic Failures | DP-02, 03, 04 |
| A03 Injection | AppSec-01, 02, 03 |
| A04 Insecure Design | IAM-06, AppSec-09 |
| A05 Security Misconfiguration | AppSec-08, DP-04 |
| A06 Vulnerable Components | AppSec-07, SDLC-04 |
| A07 AuthN Failures | IAM-04, 07 |
| A08 Integrity Failures | Obs-02, SDLC-05 |
| A09 Logging Failures | Obs-* |
| A10 SSRF | AppSec-10（N/A） |
| LLM01 Prompt Injection | AppSec-12 |

---

## 6. 評分匯總範本（Phase 2 填寫）

### 6.1 領域成熟度總覽（暫評估，待 Phase 2 確認）

| 領域 | 檢查項 | L0 | L1 | L2 | L3 | L4 | N/A | 平均分 | 企業就緒？ |
|------|--------|----|----|----|----|----|-----|--------|-----------|
| IAM | 10 | 1 | 4 | 2 | 0 | 0 | 1 | **0.9/4** | 🔴 NOT READY |
| DP | 10 | 6 | 2 | 1 | 0 | 0 | 0 | **0.5/4** | 🔴 NOT READY |
| AppSec | 12 | 1 | 3 | 5 | 0 | 0 | 1 | **1.4/4** | 🔴 NOT READY |
| Obs | 10 | 7 | 2 | 0 | 0 | 0 | 0 | **0.2/4** | 🔴 NOT READY |
| Resi | 11 | 7 | 3 | 0 | 0 | 0 | 0 | **0.3/4** | 🔴 NOT READY |
| Gov | 12 | 7 | 2 | 2 | 0 | 0 | 0 | **0.6/4** | 🔴 NOT READY |
| SDLC | 12 | 8 | 1 | 2 | 0 | 0 | 0 | **0.5/4** | 🔴 NOT READY |
| **總計** | **77** | **37** | **17** | **12** | **0** | **0** | **2** | **0.6/4** | 🔴 **NOT READY** |

> **解讀**：本專案目前在企業級成熟度上整體為 **L0-L1 之間**，距離 L3 企業就緒約需 18-24 個月持續投入。但 Phase 1 修完 Critical 後即可達 L2 基本可上線。

---

## 7. 風險矩陣與企業就緒度

### 7.1 風險矩陣

```
            │ 影響度 LOW   │ MED                   │ HIGH                                       │
────────────┼─────────────┼───────────────────────┼────────────────────────────────────────────┤
機率 HIGH   │ 觀察        │ 計劃修復              │ 立即修復                                   │
            │             │                       │ AppSec-09(rate limit), IAM-01(auth cov),   │
            │             │                       │ Resi-09(IR plan), DP-04(Key Vault)         │
────────────┼─────────────┼───────────────────────┼────────────────────────────────────────────┤
機率 MED    │ 接受        │ 計劃修復              │ 計劃修復                                   │
            │             │ Obs-04(SIEM),         │ IAM-06(MFA), IAM-10(ownership),            │
            │             │ Gov-05(vendor)        │ Obs-01(audit log), Resi-06(backup)         │
────────────┼─────────────┼───────────────────────┼────────────────────────────────────────────┤
機率 LOW    │ 接受        │ 接受                  │ 計劃修復                                   │
            │             │                       │ SDLC-11(pen test), Gov-06(DPA)             │
```

### 7.2 企業就緒度判定

依 sample matrix 標準：
- 🔴 **NOT READY**: HIGH 風險項 ≥ 1 個低於 L2
- 🟡 **PARTIALLY READY**: HIGH 全部 L2+，MEDIUM 部分低於 L2
- 🟢 **READY**: HIGH ≥ L3，MEDIUM ≥ L2，LOW 無重大缺口

**目前判定**: 🔴 **NOT READY**

**達 🟡 預計**: Phase 1 + Phase 2 完成後（約 6-8 週）
**達 🟢 預計**: Phase 1-3 完成後（約 12-16 週）

---

## 8. 分階段實施計畫

### Phase 0：矩陣 Review（1 週，**目前位置**）
- [ ] Stakeholder review 本矩陣 77 項覆蓋度
- [ ] 確認 N/A 項（IAM-09、AppSec-10）
- [ ] 確認風險偏好（HIGH/MED/LOW 分類是否符合公司）
- [ ] 確認預算與資源（Redis、Key Vault、Pen Test）
- [ ] 指派 Security Lead（Gov-08）

### Phase 1：立即（2 週，HIGH 風險 L0/L1 → L2）

| Check ID | 項目 | 估時 |
|----------|------|------|
| AppSec-09 | Rate Limiting（Critical） | 3 d |
| DP-04 | Azure Key Vault 整合 | 5 d |
| IAM-06 | MFA（Admin 強制） | 5 d |
| IAM-01 | publicProcedure 審查 | 2 d |
| Resi-09 | Incident Response Plan（文件） | 3 d |
| Resi-06 / DP-09 | 備份 + DR 設定 | 2 d |
| DP-02 | DB TLS 強制 | 1 d |
| AppSec-07 / SDLC-04 | Renovate + CI audit | 2 d |
| SDLC-01 | Secret Scanning（gitleaks） | 1 d |
| Gov-08 | 指派 Security Officer | 1 d |
| Gov-12 | Risk Register（本文件持續維護） | 持續 |

**Phase 1 DoD**：所有 Critical（🔴）項目 ≥ L2；HIGH 項目 50% 以上 ≥ L2。

### Phase 2：短期（4-6 週，HIGH 全部到 L3，MED 到 L2）

| Check ID | 項目 | 估時 |
|----------|------|------|
| IAM-04 | JWT Session 強化 | 5 d |
| IAM-05 | 密碼歷史 / 過期 | 3 d |
| IAM-07 | 帳號鎖定 | 2 d |
| IAM-10 | Resource ownership | 5 d |
| DP-01 | PII 分類文件 | 3 d |
| DP-03 | 欄位級加密 | 5 d |
| DP-05 | 資料遮罩 | 3 d |
| AppSec-05 | 檔案上傳 MIME + Magic | 3 d |
| AppSec-01 | Zod 邊界值 | 3 d |
| Obs-01 | 通用 AuditLog | 5 d |
| Obs-02 | 不可竄改 | 3 d |
| Obs-03 | 認證日誌持久化 | 2 d |
| Obs-04 | Application Insights 整合 | 3 d |
| Obs-05 | 告警規則 | 2 d |
| Resi-07 | 還原測試（首次） | 2 d |
| Gov-01 | Migration Runbook | 2 d |
| Gov-03 | SoD（GitHub Environment） | 2 d |
| Gov-10 | Access Review 流程 | 2 d |
| SDLC-02 | SAST（Semgrep） | 3 d |

### Phase 3：中期（2-3 個月，MED 全部到 L2，LOW 評估）

剩餘 28 項，包含：DP-06/07/08/10、AppSec-03/08/11/12、Obs-06/07/08/09/10、Resi-02/04/05/10/11、Gov-04/05/06/07/09/11、SDLC-03/05/06/07/10。

### Phase 4：對外宣稱企業級（外部驗證）

完成 Phase 1-3 後：
1. SDLC-11 委託第三方 Penetration Testing
2. SOC 2 Type II 稽核準備啟動（6-12 個月觀察期）
3. ISO 27001 控制項對應文件化

---

## 9. 影響範圍

### 9.1 受影響的 Models（需 Migration）

| Model | 變更 | 對應 Check |
|-------|------|----------|
| User | +passwordLastChangedAt, passwordExpiryAt, mfaEnabled, mfaSecret, backupCodes, failedLoginAttempts, lockedUntil | IAM-05, 06, 07 |
| PasswordHistory | 新增 | IAM-05 |
| UserSession | 新增 | IAM-04 |
| AuditLog | 新增（取代 History） | Obs-01 |
| ErasureRequest | 新增 | DP-07 |

### 9.2 受影響的 Routers / Procedures

- 全 17 個 router 評估（ownership middleware、permission 同步）
- `health.ts`：所有 fix*/schema* 改 adminProcedure 或生產禁用
- `auth/[...nextauth]`：MFA、鎖定、AuditLog 鉤子
- `/api/upload/*`：MIME + Magic Byte 驗證 + 認證
- 新增 `user.exportMyData`、`user.requestErasure`

### 9.3 受影響的 Pages

- `/login`：MFA 步驟 UI
- `/settings`：Sessions 管理、MFA 設定、Backup Codes、隱私（GDPR）
- `/admin/audit-log`（新）：AuditLog 查詢
- `/admin/users`：強制 MFA toggle、鎖定狀態
- `/admin/access-review`（新）：季度審查清單
- `/admin/risk-register`（新）：Risk Register UI

### 9.4 文件產出（共 14 份）

| 文件 | 對應 |
|------|------|
| `docs/governance/data-classification.md` | DP-01 |
| `docs/governance/log-retention-policy.md` | DP-06 |
| `docs/governance/gdpr-data-subject-rights.md` | DP-07, 08 |
| `docs/governance/database-migration-runbook.md` | Gov-01 |
| `docs/governance/incident-response-plan.md` | Resi-09 |
| `docs/governance/disaster-recovery-plan.md` | Resi-06, 07, 08 |
| `docs/governance/access-review-process.md` | Gov-10 |
| `docs/governance/vendor-risk-assessment.md` | Gov-05 |
| `docs/governance/dpa-register.md` | Gov-06 |
| `docs/governance/security-roles-and-responsibilities.md` | Gov-08 |
| `docs/governance/document-governance.md` | Gov-11 |
| `docs/governance/risk-register.md` | Gov-12 |
| `docs/governance/llm-security-policy.md` | AppSec-12 |
| `docs/governance/threat-models/*.md` | SDLC-12 |
| `docs/deployment/key-vault-setup.md` | DP-04 |
| `docs/deployment/network-security.md` | Resi-02 |
| `docs/deployment/observability-stack.md` | Obs-04 |
| `SECURITY.md`（root） | AppSec-07 |

### 9.5 i18n 影響

新增約 100-150 個翻譯 key（MFA、鎖定、Session、AuditLog、隱私頁、Privacy Policy、Cookie consent）。

### 9.6 預算（粗估）

| 項目 | 預估 |
|------|------|
| Upstash Redis Serverless（Rate limit） | < $20/月 |
| Azure Key Vault | < $5/月 |
| Application Insights / Sentinel | $50-200/月（依量） |
| Azure Front Door + WAF（可選） | $300+/月 |
| 第三方 Pen Test（年度） | $10K-30K |
| SOC 2 Type II 稽核（年度） | $30K-50K |

---

## 10. 風險與取捨

### 10.1 技術風險

| 風險 | 緩解 |
|------|------|
| MFA 強制鎖死既有 Admin | Phase 1 先 opt-in，全員啟用後再 enforce |
| AuditLog 表成長過快 | Phase 2-3 同步部署留存策略（DP-06） |
| Key Vault cold start 延遲 | Startup 載入 + 記憶體快取 |
| Application Insights 成本 | Sampling rate 調控（prod 10%） |
| Renovate 大量 PR 噪音 | 設定 grouping + auto-merge patch |

### 10.2 業務風險

- **使用者體驗下降**：MFA、密碼過期、Session 強制登出 → 需 Change Management + 教育
- **開發節奏**：本 Feature 預計 3-4 人月，需與 Epic 9-10 協調
- **外部稽核成本**：Pen Test + SOC 2 約 $40K-80K/年

### 10.3 不做的取捨

- 不做 Auth.js v5 升級（獨立技術債）
- 不做完整 SOC 2 認證（先補技術控制項）
- 不做 Zero Trust 重構（規模不符）
- 不採用 Snyk（成本考量，先用 npm audit + Renovate）

---

## 11. 驗收標準

### Phase 0 DoD（矩陣 Review）
- [ ] 7 大領域 77 項通過 review，無漏項
- [ ] N/A 項目確認（目前 2 項：IAM-09、AppSec-10）
- [ ] HIGH/MED/LOW 風險分類確認
- [ ] Security Lead 指派
- [ ] 預算批准

### Phase 1 DoD（Critical 修復）
- [ ] 所有 🔴 HIGH 風險項 ≥ L2
- [ ] 所有 Admin 帳號啟用 MFA
- [ ] Rate limiting 上線且觸發紀錄可查
- [ ] DR plan 第一次還原測試通過
- [ ] 內部安全評估報告無 Critical 發現

### Phase 2-3 DoD
- [ ] 🔴 HIGH 全部 L3、🟡 MED 全部 L2、🟢 LOW 評估完成
- [ ] 14 份 governance 文件全部完成
- [ ] CI 強制執行 audit / SBOM / SAST / Zod 覆蓋率
- [ ] 內部安全訓練完成

### 整體 Feature DoD（達 🟢 READY）
- [ ] 矩陣總分 ≥ 2.5/4（即整體達 L2-L3 之間）
- [ ] 第三方 Pen Test 無 High 以上發現
- [ ] OWASP ASVS L2 自評 ≥ 90%
- [ ] SOC 2 Type II 稽核準備就緒（控制項對應完成）

---

## 附錄 A：與 sample matrix 的對應

本文件採用 `docs/development-log/enterprise-security-governance-sample.md`（公司 v1.0）的 7 領域 77 檢查項框架，並：
1. **完全保留** 77 項檢查 ID 與描述（便於跨專案比對）
2. **填入** 本專案目前評估等級（L0-L4）與對應的既有 SEC / GAP 編號
3. **新增** 本專案特有的修補步驟與驗收標準
4. **新增** 不在 sample 中但本專案需要的條目（無，77 項已涵蓋）

## 附錄 B：與既有 17 項 SEC 的對應

| SEC 編號 | 對應 Check |
|---------|-----------|
| SEC-001 User Router 公開漏洞 | IAM-01 |
| SEC-002 Health Router 公開 | IAM-01 |
| SEC-003 註冊無 rate limit | AppSec-09 |
| SEC-004 認證日誌敏感資訊 | DP-01, Obs-03 |
| SEC-005 密碼強度不一致 | IAM-05 |
| SEC-006 檔案上傳無認證 | AppSec-05, IAM-01 |
| SEC-007 Admin Seed GET 無認證 | IAM-01 |
| SEC-008 無資源所有權 | IAM-10 |
| SEC-009 Zod 驗證合格 | AppSec-01 |
| SEC-010 Raw SQL | AppSec-02 |
| SEC-011 檔案路徑遍歷 | AppSec-05 |
| SEC-012 User 含密碼 hash | DP-01, IAM-01 |
| SEC-013 上傳 console.log | DP-01 |
| SEC-014 CSRF 合格 | AppSec-04 |
| SEC-015 dangerouslySetInnerHTML | AppSec-03 |
| SEC-016 無全域 rate limit | AppSec-09 |
| SEC-017 bcrypt + bcryptjs | AppSec-07 |

---

**Last Updated**: 2026-04-28
**Version**: 2.0.0
**Maintained By**: Development Team
**Next Review**: Phase 0 完成後（預計 2026-05-05）
