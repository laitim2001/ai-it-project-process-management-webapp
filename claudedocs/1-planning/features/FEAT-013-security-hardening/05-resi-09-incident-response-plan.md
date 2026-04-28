---
sub_feature: FEAT-013.5
check_id: Resi-09
nature: DOC（純文件產出）
status: 📋 Planned
estimated_days: 3
dependencies: 無（可立即啟動，與 .1-.4 並行）
---

# FEAT-013.5 — Resi-09 Incident Response Plan

> **Check ID**: Resi-09（Incident Response Plan）
> **企業級基準**: 文件、聯絡名單、演練
> **目前評估**: L0 → 目標 L3
> **產出物**: 1 份主 IR Plan + 3 份 sub-runbooks（共 4 份治理文件）

---

## 1. 背景與目標

### 1.1 問題現況

無安全事件應對流程；無聯絡清單；無優先順序分類；無證據保留要求；無對外通報流程。

實際發生事件時將：
- 反應緩慢（不知該找誰）
- 證據可能被破壞（不知該保留什麼）
- 通報延誤（不知監管時程）
- 重複犯錯（無 lessons learned）

### 1.2 目標

產出 4 份治理文件，作為**事件發生時的可執行 runbook**，而非事後參考：

1. `incident-response-plan.md` — 主計畫（分級、流程、聯絡清單）
2. `runbooks/data-breach-runbook.md` — 資料洩漏應對
3. `runbooks/ddos-runbook.md` — DDoS / 大量請求應對
4. `runbooks/account-takeover-runbook.md` — 帳號接管應對

### 1.3 不在範圍

- 實際 tabletop exercise（演練）→ Phase 2
- 法務 / HR 詳細流程（如 GDPR 24h 通報）→ 暫由 plan 中 placeholder 標示，待法務確認
- 自動化告警 → Phase 2 Obs-05

---

## 2. 影響範圍

### 2.1 受影響檔案

| 檔案 | 變更類型 |
|------|---------|
| `docs/security-and-governance/governance/incident-response-plan.md` | 新建（主計畫） |
| `docs/security-and-governance/governance/runbooks/data-breach-runbook.md` | 新建 |
| `docs/security-and-governance/governance/runbooks/ddos-runbook.md` | 新建 |
| `docs/security-and-governance/governance/runbooks/account-takeover-runbook.md` | 新建 |
| `docs/security-and-governance/README.md` | 更新（指向新文件） |

### 2.2 不需 Migration / 程式變更

純文件產出。

### 2.3 i18n 影響

無（治理文件為內部使用，僅繁體中文）。

---

## 3. 文件設計

### 3.1 主計畫 `incident-response-plan.md` 結構

```markdown
# Incident Response Plan

## 1. 適用範圍與目標
## 2. 事件分級
## 3. 角色與責任
## 4. 應對流程（6 階段）
## 5. 聯絡清單
## 6. 證據保留要求
## 7. 對外通報要求
## 8. 演練計畫
## 9. 文件版本管理
```

#### 事件分級（4 級）

| 等級 | 描述 | SLA 回應 | 例 |
|------|------|---------|----|
| **P0 Critical** | 資料洩漏 / 大規模影響 | 15 min | 全部用戶 PII 外流、Admin 帳號接管 |
| **P1 High** | 認證 / 授權繞過 / 資料篡改 | 30 min | 跨用戶資料操作、權限提升 |
| **P2 Medium** | 服務中斷 / 性能異常 | 2 h | 部分功能不可用、API 大量錯誤 |
| **P3 Low** | 一致性問題 / 非緊急 | 24 h | 報表數字異常、非主要功能 |

#### 應對流程（6 階段）

依 NIST SP 800-61 框架簡化：

1. **Detection（偵測）** — 如何發現？誰回報？
2. **Triage（分級）** — Incident Commander 判斷 P0-P3
3. **Containment（圍堵）** — 阻止擴大（如停用帳號、IP 封鎖）
4. **Eradication（根除）** — 修補根本原因
5. **Recovery（復原）** — 恢復服務
6. **Lessons Learned（檢討）** — Post-Mortem 撰寫

#### 角色

- **Incident Commander（IC）**：Security Lead，總指揮
- **Tech Lead**：技術應對
- **Communications**：對內外溝通（管理層 / 用戶 / 監管）
- **Scribe**：紀錄時間軸 + 決策

### 3.2 Sub-Runbook 範本結構

每份 runbook 採用相同格式：

```markdown
# [類型] Runbook

> 適用 PXX 等級 [類型] 事件

## 偵測信號
（如何發現此類事件）

## 立即動作（前 15 分鐘）
- [ ] Step 1
- [ ] Step 2

## 升級判斷
（什麼時候升級為更高等級）

## 圍堵步驟
- [ ] Action A
- [ ] Action B

## 根除步驟
## 復原步驟
## 證據保留清單
## 對外通報判斷
## Post-Mortem 範本
```

### 3.3 三份 sub-runbook 內容重點

#### `data-breach-runbook.md`
- 信號：AuditLog 大量異常 SELECT、Azure Defender 告警、外部回報
- 立即：隔離受影響系統、保留 DB snapshot、停用相關 API token
- 通報：GDPR 24h 內通知監管機關（個資若涉歐盟）、台灣個資法 72h
- 證據：DB query log、AuditLog、Azure App Service log

#### `ddos-runbook.md`
- 信號：rate limit 大量觸發、App Service CPU/Memory 飆升、異常 IP 集中
- 立即：啟用 Azure DDoS Protection、IP 封鎖、調低 rate limit 閾值
- 升級：通報 Azure Support
- 復原：監控 24h 後解除臨時封鎖

#### `account-takeover-runbook.md`
- 信號：帳號鎖定告警、用戶回報「我沒登入」、AuditLog 異常登入位置
- 立即：強制該帳號登出（撤銷 session）、停用帳號、通知用戶
- 圍堵：檢查該帳號近 30 天 AuditLog 是否有異常操作
- 復原：用戶重設密碼、Admin 解鎖、必要時撤銷該帳號修改的資料

---

## 4. 實作步驟

### Step 1: 撰寫主 IR Plan（1.5d）

1. 起草 §3.1 結構各章節
2. 與 Tech Lead + Management 確認：
   - 聯絡清單（含 escalation 路徑）
   - SLA 是否符合業務需求
   - 對外通報判斷準則（涉法務）
3. 標示 placeholder（如「法務聯絡人」「監管機關」）供業務確認後填入

### Step 2: 撰寫 3 份 sub-runbook（1d）

依 §3.2 範本，分別產出：
- `data-breach-runbook.md`
- `ddos-runbook.md`
- `account-takeover-runbook.md`

每份 runbook：
- 至少含 5 個立即動作步驟（含 checkbox）
- 至少含 3 個圍堵 / 根除步驟
- 含證據保留清單
- 含 Post-Mortem 範本（連結回主 plan）

### Step 3: 整合與 Review（0.5d）

- 更新 `docs/security-and-governance/README.md` 指向新文件
- 內部 Review：Tech Lead + Security Lead 確認可執行性
- 標示「Phase 2 待補充項目」（如自動化告警）

---

## 5. 驗收標準（DoD）

- [ ] `incident-response-plan.md` 完成（≥ 600 行）
- [ ] 3 份 sub-runbook 完成（每份 ≥ 200 行）
- [ ] 事件分級表（P0-P3）含具體例子
- [ ] 角色與責任 RACI 表完成
- [ ] 6 階段應對流程含時間 SLA
- [ ] 聯絡清單格式定義（待業務填具體名單）
- [ ] 證據保留要求清單
- [ ] 對外通報時程（GDPR / 個資法）
- [ ] `docs/security-and-governance/README.md` 更新
- [ ] Tech Lead + Security Lead 簽核
- [ ] FEAT-013 主矩陣 Resi-09 等級從 L0 → L3

---

## 6. 驗證計畫

### 6.1 文件審查

- [ ] 主 plan 是否可作為「打開來照做」的 runbook，而非概念性文件
- [ ] 每個 sub-runbook 是否在「凌晨 2 點壓力下能照做」
- [ ] 聯絡清單格式是否便於 Phase 2 演練時實際填入

### 6.2 桌面演練（mini）

完成文件後，內部進行 30 min mini-tabletop：
- 給定情境：「今天早上發現 1 個 admin 帳號 last login IP 在俄羅斯」
- 用 `account-takeover-runbook.md` 走完一次流程
- 紀錄哪些步驟模糊 / 缺漏 → 修訂

### 6.3 Phase 2 完整 tabletop（不在本 sub-feature DoD）

由 Security Lead 主導，2 小時模擬。

---

## 7. 風險與取捨

| 風險 | 緩解 |
|------|------|
| 文件寫了沒人看 / 用 | 在 onboarding 加閱讀 IR Plan；季度演練（Phase 2）|
| 法務 / 通報要求未確認 | placeholder 標示，加入 Phase 0 後續行動清單 |
| Runbook 過於僵化，實際情境不同 | 含「升級判斷」與「彈性條款」；Post-Mortem 中持續優化 |
| 缺乏實際聯絡人填入 | 與業務同步，列為 Phase 2 啟動前置條件 |

---

## 8. 後續延伸（不在本 sub-feature 範圍）

- Phase 2：實際 tabletop exercise
- Phase 2：自動化告警（Obs-05）整合到 IR Plan 觸發機制
- Phase 3：年度演練 + Post-Mortem 知識庫累積

---

**Last Updated**: 2026-04-28
**Owner**: 待指派
**Reviewer**: Security Lead + Tech Lead
