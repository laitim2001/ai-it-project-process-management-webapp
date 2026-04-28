---
document_type: governance / incident-response-plan
check_id: Resi-09
version: 0.1.0 (DRAFT)
status: 🚧 Draft（Phase 1 產出，含 placeholder 待業務確認）
owner: Security Lead（待指派）
reviewed_at: -
next_review: Phase 1 完成後 + 季度 review
---

# Incident Response Plan（事件應對計畫）

> **適用範圍**：本專案 ITPM Web Application（含 Azure 部署環境）
> **目標讀者**：Security Lead、Tech Lead、On-call、Management
> **使用情境**：當偵測到（或合理懷疑）安全事件時，本文件應作為**直接執行的 runbook**，而非概念性參考

---

## 1. 適用範圍與目標

### 1.1 範圍
- ✅ ITPM Web App（apps/web）
- ✅ tRPC API（packages/api）
- ✅ PostgreSQL 資料庫（個人環境 + 公司環境）
- ✅ Azure App Service / Blob Storage / AD
- ✅ 認證系統（NextAuth + Azure AD）

### 1.2 不在範圍
- ❌ 公司其他系統（HR、ERP 等）— 屬該系統 owner
- ❌ 員工個人裝置安全 — 屬 IT 內務

### 1.3 目標
- **快速應對**：依 SLA 限時回應
- **限制影響**：圍堵事件，避免擴大
- **保留證據**：事後調查、合規通報
- **學習改善**：每次事件 Post-Mortem

---

## 2. 事件分級

| 等級 | 描述 | 回應 SLA | 例子 |
|------|------|---------|-----|
| **🔴 P0 Critical** | 大規模影響 / 不可逆損害 | **15 min** 內回應 | 全部用戶 PII 外流；Admin 帳號被接管；資料庫遭刪除 |
| **🟠 P1 High** | 認證/授權繞過 / 資料完整性 | **30 min** 內回應 | 跨用戶資料操作；權限提升；少量 PII 洩漏 |
| **🟡 P2 Medium** | 服務中斷 / 性能異常 | **2 h** 內回應 | 部分功能不可用；API 大量 5xx；登入功能不穩 |
| **🟢 P3 Low** | 一致性問題 / 非緊急 | **24 h** 內回應 | 報表數字異常；非主流程功能異常 |

> **分級原則**：發現者依此表初步判斷，由 Incident Commander（IC）正式裁定。**寧可高估不可低估**。

---

## 3. 角色與責任（RACI）

| 角色 | 主要職責 | 預設指派 |
|------|---------|---------|
| **Incident Commander (IC)** | 總指揮、分級裁定、對外發言 | Security Lead（如未指派 → Tech Lead） |
| **Tech Lead** | 技術應對、修補實作 | Tech Lead |
| **Communications** | 對內外溝通（管理層 / 用戶 / 監管） | Security Lead 或指定人 |
| **Scribe** | 紀錄時間軸、決策、行動 | 任一可用人員 |
| **Legal/HR** | 法律 / 員工面影響評估 | _placeholder_ — **待業務確認** |

| 行動 | IC | Tech Lead | Comms | Scribe | Legal |
|------|----|-----------|-------|--------|-------|
| 分級裁定 | **A** | C | I | I | - |
| 圍堵決策 | **A** | R | I | I | C（如涉法） |
| 對外通報 | **A** | I | R | I | **C** |
| Post-Mortem | A | R | C | R | I |
| Lessons learned 落地 | A | **R** | I | I | - |

> R=Responsible, A=Accountable, C=Consulted, I=Informed

---

## 4. 應對流程（6 階段）

依 NIST SP 800-61 簡化。

### 4.1 Detection（偵測）

**信號來源**：
- 自動：Azure Monitor 告警（待 Phase 2 Obs-05 建立）
- 手動：用戶回報、Tech Lead 巡檢、AuditLog 異常
- 外部：客戶 / 監管 / 媒體

**Action**：發現者立即聯絡 IC（聯絡方式見 §5）

### 4.2 Triage（分級）

IC 在 SLA 時限內：
1. 依 §2 表格初步分級
2. 召集核心團隊（依 §3）
3. 判斷是否需要：
   - 通知 Management（P0/P1 必要）
   - 法務介入（涉外通報）
   - 切換到圍堵模式（避免擴大）

### 4.3 Containment（圍堵）

**目的**：阻止擴大，**不一定立即根除**。

**通用步驟**：
- [ ] 識別受影響系統 / 帳號 / 資料
- [ ] 隔離（停用帳號、IP 封鎖、停用功能）
- [ ] 保留現場（snapshot DB、保留 log）
- [ ] 監控擴散

**選擇 sub-runbook**：
- 資料洩漏 → `runbooks/data-breach-runbook.md`
- DDoS / 大量請求 → `runbooks/ddos-runbook.md`
- 帳號接管 → `runbooks/account-takeover-runbook.md`

### 4.4 Eradication（根除）

修補根本原因：
- 程式碼修補（patch）
- 設定變更
- 撤銷遭破壞的 credentials
- 確認攻擊者無持久性存取

### 4.5 Recovery（復原）

恢復正常運行：
- 部署修補
- 解除臨時管制（如 IP 封鎖）
- 監控 24-72h 確認穩定
- 通知用戶恢復

### 4.6 Lessons Learned（檢討）

事件結束後 5 個工作天內：
- IC 召集 Post-Mortem
- 撰寫報告（範本見 §8）
- 識別系統性改善（不是怪罪個人）
- 更新本 IR Plan / runbook
- 加入演練情境

---

## 5. 聯絡清單（待業務填具體名單）

### 5.1 內部聯絡

| 角色 | 姓名 | Email | 電話 | 備援 |
|------|------|-------|------|------|
| Security Lead | _placeholder_ | _placeholder_ | _placeholder_ | _placeholder_ |
| Tech Lead | _placeholder_ | _placeholder_ | _placeholder_ | _placeholder_ |
| CTO / IT Director | _placeholder_ | _placeholder_ | _placeholder_ | _placeholder_ |
| Legal | _placeholder_ | _placeholder_ | _placeholder_ | _placeholder_ |
| HR | _placeholder_ | _placeholder_ | _placeholder_ | _placeholder_ |

> 🚨 **Phase 1 Action**：Security Lead 指派完成後 1 週內填具體名單。

### 5.2 外部聯絡

| 對象 | 用途 | 聯絡方式 |
|------|------|---------|
| Microsoft Azure Support | 雲服務問題 | Azure Portal → Support |
| 個資法主管機關（台灣）| GDPR / 個資洩漏通報 | _placeholder_（法務確認） |
| 主要客戶（如有客戶 SLA）| 通知 | _placeholder_（業務維護） |

---

## 6. 證據保留要求

事件期間**禁止**：
- ❌ 刪除 log
- ❌ 修改受影響資料（必要時用 read replica）
- ❌ 重啟受影響系統（除非為圍堵）

**必須保留**：
- ✅ 應用 log（App Service）—— 至少 90 天
- ✅ DB AuditLog —— 永久保留（事件相關 row）
- ✅ Azure Activity Log —— 系統層操作
- ✅ Network log（如有 WAF / Front Door）—— Phase 3 才會有
- ✅ 用戶回報內容（截圖 / 信件）

**證據打包**：
- 建立 `incidents/INC-YYYY-NNN/` 目錄（Azure Blob，immutable container）
- 包含：時間軸、log、影響範圍、修補措施、Post-Mortem

---

## 7. 對外通報要求

> ⚠️ **本章節需法務 / 合規確認**，目前為初步草案。

### 7.1 GDPR（涉歐盟自然人資料）
- **24 小時內**通知監管機關（除非可證明無風險）
- **不延遲**通知資料主體（高風險時）
- 文件化：`runbooks/data-breach-runbook.md` 含通報範本

### 7.2 台灣個資法
- **72 小時內**通知主管機關（個資外洩時）
- 通知資料主體
- 補救措施

### 7.3 客戶 SLA
- 依個別客戶合約（_placeholder_）
- 通知時程通常 4-24h

### 7.4 媒體 / PR
- IC 統一發言口徑
- 不做未經確認的揣測
- Comms 角色協調

---

## 8. Post-Mortem 範本

事件結束後撰寫於 `incidents/INC-YYYY-NNN/post-mortem.md`：

```markdown
# Post-Mortem: INC-YYYY-NNN

## 摘要
- 等級: P0/P1/P2/P3
- 影響時間: YYYY-MM-DD HH:MM ~ YYYY-MM-DD HH:MM
- 影響範圍: ___ 用戶 / ___ 資料

## 時間軸
| 時間 | 事件 | 行動 |
|------|------|------|
| HH:MM | 偵測 | 用戶 X 回報異常 |
| HH:MM | 分級 | IC 判定 P1 |
| HH:MM | 圍堵 | 停用帳號 Y |
| ... | | |
| HH:MM | 結案 | 服務恢復 |

## 根本原因
（5 Whys 分析）

## 直接原因
（什麼觸發了事件）

## 影響範圍
（多少用戶 / 資料 / 服務時間）

## 行動項目
| # | 行動 | Owner | Due Date |
|---|------|-------|---------|
| 1 | 修補程式碼 X | | |
| 2 | 加 monitoring | | |
| 3 | 更新 runbook | | |

## What went well
（做對的事，要保留）

## What went poorly
（做錯的事，要改進，不怪罪個人）

## Lessons Learned
（系統性改善建議）
```

---

## 9. 演練計畫

| 頻率 | 類型 | 範圍 |
|------|------|------|
| 季度 | Tabletop（桌面） | 30-60 min，使用 sub-runbook 走流程 |
| 年度 | Functional | 半天，含實際技術操作（如撤銷 token、隔離系統） |
| 年度 | 全公司 | 含通報流程、媒體應對 |

> **Phase 1 Action**：Phase 2 Kickoff 後安排第一次桌面演練。

---

## 10. 文件版本管理

| 版本 | 日期 | 變更 | Owner |
|------|------|------|-------|
| 0.1.0 | 2026-04-28 | 初版（FEAT-013.5）— 含 placeholder | Tech Lead 暫代 |

> **下次 Review**：Phase 1 完成 + 第一次演練後

---

## 📎 相關文件

- `runbooks/data-breach-runbook.md`
- `runbooks/ddos-runbook.md`
- `runbooks/account-takeover-runbook.md`
- 主矩陣：`claudedocs/4-changes/FEAT-013-security-hardening.md`
- 規劃：`claudedocs/1-planning/features/FEAT-013-security-hardening/05-resi-09-incident-response-plan.md`

---

**最後更新**: 2026-04-28
**狀態**: 🚧 Draft — 待 Security Lead 指派 + 業務填聯絡清單後正式發布
