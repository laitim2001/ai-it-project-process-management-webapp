# Security & Governance（安全與治理）

> **目的**：本目錄集中管理本專案所有安全與治理（Security & Governance）相關文件，作為 FEAT-013 企業級安全強化專案的工作空間。
> **建立日期**: 2026-04-28
> **負責人**: Security Lead（待 Phase 0 完成後正式指派）

---

## 📂 目錄結構

```
docs/security-and-governance/
├── README.md                          ← 本檔案
├── session-log-20260428.md            ← Session 對話紀錄（保留歷史脈絡）
├── phase-0-review/                    ← Phase 0 Stakeholder Review 工作文件
│   ├── README.md
│   ├── 01-matrix-coverage-review.md
│   ├── 02-risk-appetite-survey.md
│   ├── 03-security-lead-assignment.md
│   ├── 04-budget-approval.md
│   └── 05-review-meeting-template.md
└── references/                        ← 外部參考資料
    └── enterprise-security-governance-sample.md  ← 公司內部企業級評估矩陣 v1.0
```

---

## 🔗 主文件位置

主矩陣文件依專案慣例放於：

- **`claudedocs/4-changes/FEAT-013-security-hardening.md`**（v2.0，7 領域 × 77 檢查項）

> 本目錄存放所有**配套作業文件**（review 工作表、會議紀錄、未來的 governance runbooks 等），主修補規劃文件仍留在 `claudedocs/4-changes/`（依專案 FEAT/CHANGE/FIX 慣例）。

---

## 📋 後續預計新增的文件（Phase 1-3 產出）

依 FEAT-013 規劃，以下 14+ 份治理文件將陸續寫入本目錄：

### Phase 1 啟動後（governance 子目錄）
- `governance/database-migration-runbook.md`（Gov-01）
- `governance/incident-response-plan.md`（Resi-09）
- `governance/disaster-recovery-plan.md`（Resi-06/07/08）
- `governance/access-review-process.md`（Gov-10）
- `governance/risk-register.md`（Gov-12）
- `governance/security-roles-and-responsibilities.md`（Gov-08）

### Phase 2 中（policies 子目錄）
- `policies/data-classification.md`（DP-01）
- `policies/log-retention-policy.md`（DP-06）
- `policies/gdpr-data-subject-rights.md`（DP-07/08）
- `policies/vendor-risk-assessment.md`（Gov-05）
- `policies/dpa-register.md`（Gov-06）
- `policies/document-governance.md`（Gov-11）
- `policies/llm-security-policy.md`（AppSec-12）

### Phase 3 中
- `threat-models/`（SDLC-12，每個重大功能一份）
- `runbooks/`（IR sub-runbooks）

### 部署相關（仍放於 `docs/deployment/`，非本目錄）
- `key-vault-setup.md`（DP-04）
- `network-security.md`（Resi-02）
- `observability-stack.md`（Obs-04）

---

## 📌 文件規範

放入本目錄的文件應：

1. **對應到 FEAT-013 的某個 Check ID**（例：IAM-06、DP-04），於 frontmatter 註明
2. **frontmatter 含 owner / reviewedAt / nextReview**（依 Gov-11 文件治理）
3. **不放於 `docs/development-log/`**（development-log 僅放開發歷程紀錄，不放安全/治理文件）
4. **不放於 `docs/codebase-analyze/`**（該目錄為自動掃描分析報告）

---

## 🔄 與其他目錄的關係

| 目錄 | 用途 | 與本目錄關係 |
|------|------|--------------|
| `claudedocs/4-changes/` | FEAT/CHANGE/FIX 規劃文件 | 主文件 FEAT-013 在此 |
| `docs/codebase-analyze/10-issues-and-debt/` | 自動掃描的安全 / 技術債報告 | 提供基線（17 項 SEC + 技術債清單） |
| `docs/development-log/` | 開發歷程紀錄（Daily / Weekly） | **不放本目錄文件** |
| `docs/deployment/` | 部署與基礎設施配置 | 安全部署相關文件（如 Key Vault setup）放此 |

---

## 📅 進度追蹤

- **2026-04-28**: 建立 FEAT-013 v2.0 + Phase 0 Review Package
- **2026-05-05**: Phase 0 進度檢查（已排程 remote agent）
- **Phase 1 預計啟動**: Phase 0 Closure 後

詳見 `claudedocs/4-changes/FEAT-013-security-hardening.md` 第 8 章「分階段實施計畫」。

---

**Maintained By**: Security Lead（待指派）/ Tech Lead（暫代）
**Last Updated**: 2026-04-28
