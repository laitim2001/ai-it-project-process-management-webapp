# 04 — 預算與資源確認表（Budget Approval）

> **目的**：列出 FEAT-013 Phase 1-4 必要項目的預算估算，供 Management 簽核。
> **填寫者**: Management（CFO / CTO / IT Director）
> **預計時間**: 30 分鐘
> **建立日期**: 2026-04-28
> **貨幣單位**: USD（如需 NTD 請以 1 USD ≈ 32 NTD 換算）

---

## 1. Phase 1 必要項目（2 週內啟用）

> **目標**：所有 🔴 Critical 項目達 L2，總計約 $0-100/月

| 項目 | 用途 | 估算成本 | 必要性 | 替代方案 | 簽核 |
|------|------|---------|--------|---------|------|
| **Upstash Redis（Serverless）** | Rate Limiting (AppSec-09 / Resi-01) | $0-20/月（依 req 量） | 🔴 必要 | 自架 Redis（VM 成本 $30+/月） | ☐ 批准 ☐ 否 |
| **Azure Key Vault** | Secret 管理（DP-04） | $0.03/10K 操作（< $5/月） | 🔴 必要 | 無（合規必要） | ☐ 批准 ☐ 否 |
| **Application Insights**（Basic Tier） | APM + Log（Obs-04 / Obs-06） | $50-200/月（5GB 起） | 🟡 建議 | 純 console.log（不合規） | ☐ 批准 ☐ 否 |
| **TOTP 套件** `otplib` | MFA（IAM-06） | $0（OSS） | 🔴 必要 | 自實作（不建議） | ☐ 批准 ☐ 否 |
| **gitleaks / trufflehog** | Secret Scanning（SDLC-01） | $0（OSS） | 🔴 必要 | 無 | ☐ 批准 ☐ 否 |
| **Renovate Bot** | Dependency Update（AppSec-07） | $0（GitHub App） | 🔴 必要 | Dependabot（同樣免費） | ☐ 批准 ☐ 否 |

**Phase 1 預估**: **$50-225/月** + 一次性工程時間

---

## 2. Phase 2 必要項目（4-6 週）

| 項目 | 用途 | 估算成本 | 必要性 | 替代方案 |
|------|------|---------|--------|---------|
| **Application Insights**（持續） | Phase 1 啟動後持續使用 | 同上 | 🔴 持續 | - |
| **Azure Defender for Storage** | 上傳病毒掃描（AppSec-05） | $0.15/GB | 🟡 建議 | ClamAV 自架 |
| **Semgrep**（OSS） | SAST（SDLC-02） | $0 | 🟡 建議 | SonarCloud（$10/月）|
| **prisma-field-encryption** | 欄位加密（DP-03） | $0（OSS） | 🟡 建議 | 自實作 |
| **file-type** | Magic Byte 偵測（AppSec-05） | $0（OSS） | 🔴 必要 | - |

**Phase 2 預估增量**: **$0-50/月**

---

## 3. Phase 3 中期項目（2-3 個月）

| 項目 | 用途 | 估算成本 | 必要性 |
|------|------|---------|--------|
| **Azure Front Door**（含 WAF） | DDoS / WAF（Resi-02） | $35+/月 + per-rule | 🟡 建議（流量 > 50GB/月時） |
| **CycloneDX npm** | SBOM（SDLC-05） | $0（OSS） | 🟢 LOW |
| **Trivy** | 容器掃描（SDLC-06） | $0（OSS） | 🟡 建議 |
| **OWASP ZAP** | DAST（SDLC-03） | $0（OSS） | 🟡 建議 |
| **Azure Sentinel**（如需 SIEM） | 進階 SIEM（Obs-04） | $2/GB | 🟢 視規模 |

**Phase 3 預估增量**: **$35-200/月**

---

## 4. Phase 4 對外驗證項目（年度）

| 項目 | 用途 | 估算成本 | 必要性 |
|------|------|---------|--------|
| **第三方 Pen Test**（年度） | SDLC-11 | $10K-30K/年 | 🟡 強烈建議 |
| **SOC 2 Type II 稽核** | 合規認證 | $30K-50K/年 | 🟢 視業務需求 |
| **ISO 27001 認證** | 國際認證 | $20K-40K/年 + 顧問費 | 🟢 視業務需求 |
| **外部 Security Consultant** | 短期諮詢（Gov-08 補強） | $100-200/h × ~40h | 🟢 視需求 |
| **Bug Bounty 平台**（HackerOne / Bugcrowd） | 持續發現漏洞 | $20K+/年 + 賞金 | 🟢 規模大時 |

**Phase 4 預估**: **$10K-100K/年**（依範圍）

---

## 5. 工程資源（人力成本）

### 5.1 Phase 1（2 週）
- 1 FTE × 2 週 = ~80 工時
- Security Lead 兼職 ~20 工時
- 預估折算成本: 依公司 cost rate

### 5.2 Phase 2（4-6 週）
- 1.5 FTE × 6 週 = ~360 工時
- Security Lead ~60 工時

### 5.3 Phase 3（2-3 個月）
- 1 FTE × 12 週 = ~480 工時
- Security Lead ~80 工時

### 5.4 Phase 4 + 持續維運
- 0.3 FTE 持續

**總工程資源估算**: ~920 工時 + Security Lead ~160 工時（4-6 個月內）

---

## 6. 投資回報分析（ROI）

### 6.1 成本（Best Case → Worst Case）

| 階段 | SaaS 成本（年度） | 工程成本 | 外部稽核 | 總計 |
|------|------------------|---------|---------|------|
| Phase 1-3（年度） | $1K-5K | 視 cost rate | $0 | $1K-5K + 工程 |
| Phase 4（年度） | $1K-5K | 0.3 FTE | $10K-100K | $11K-105K + 0.3 FTE |

### 6.2 預期效益

| 效益 | 量化 |
|------|------|
| 避免資料洩漏事件 | 單次事件平均 $4M（Ponemon 2024 報告） |
| 法規罰款避免 | GDPR 最高 €20M 或營收 4% |
| 取得 SOC 2 認證後解鎖客戶 | 視業務（如 enterprise 客戶投標必備） |
| 員工 / 客戶信任 | 難量化但長期價值 |
| 保險費下降 | Cyber insurance 可降 10-30% |

### 6.3 風險

| 風險 | 機率 | 影響 |
|------|------|------|
| 不投入：被駭客 | 中 | 極高（$4M+ 事件成本） |
| 投入不足（僅 Phase 1）：滿足基本但不可宣稱企業級 | 高 | 中（影響投標） |
| 過度投入（Phase 4 全做但業務未需要） | 低 | 中（資源錯配） |

---

## 7. 預算批准（Approval）

### 7.1 Phase 1 預算批准（必要）

**請批准 Phase 1 預算: $50-225/月（持續）+ ~80 工時（一次性）**

- ☐ 全部批准
- ☐ 部分批准（請刪除不批准項目）
- ☐ 退回（請說明）：______

### 7.2 Phase 2-3 預算批准（視 Phase 1 結果決定）

- ☐ 預先批准 Phase 2-3 全部預算（$50-250/月增量）
- ☐ Phase 1 完成後重新評估
- ☐ 退回

### 7.3 Phase 4 預算批准（年度決策）

- ☐ 預先承諾年度第三方 Pen Test（$10K-30K）
- ☐ 預先承諾 SOC 2 Type II 稽核準備
- ☐ 暫不承諾，視業務需求決定

### 7.4 工程資源批准

- ☐ 批准 1 FTE × 6 個月 + Security Lead 30% 投入
- ☐ 批准減量資源（請說明）：______
- ☐ 退回

---

## 8. 簽核（Sign-off）

| 角色 | 姓名 | 同意 / 不同意 | 條件 | 簽署日期 |
|------|------|---------------|------|---------|
| CFO | _______ | ☐ ☐ | | _______ |
| CTO | _______ | ☐ ☐ | | _______ |
| IT Director | _______ | ☐ ☐ | | _______ |
| Security Lead（已指派） | _______ | ☐ ☐ | | _______ |

---

## 9. 後續行動

預算批准後：
- [ ] IT 採購：Upstash Redis、Application Insights、Azure Key Vault
- [ ] HR：核算工程資源分配
- [ ] Finance：建立預算追蹤項目
- [ ] Security Lead：啟動 Phase 1 Kickoff（用 `05-review-meeting-template.md`）

---

**Last Updated**: 2026-04-28
**Next Step**: 與 `03-security-lead-assignment.md` 簽核完成後，召開 Review Meeting
