# 05 — Phase 0 Review Meeting 議程與紀錄範本

> **目的**：召開 Stakeholder Review 會議，確認 FEAT-013 矩陣、風險偏好、Security Lead 指派、預算批准。
> **建議出席**: Tech Lead、Security Lead（候選/已指派）、CTO / IT Director、Business Owner、（如需）法務 / HR
> **預計時長**: 90-120 分鐘
> **建立日期**: 2026-04-28

---

## 📅 會議基本資訊（填寫）

- **日期**: _______
- **時間**: _______
- **地點 / 線上連結**: _______
- **主持人**: Tech Lead（或 Security Lead）
- **記錄員**: _______

### 出席者
| 姓名 | 角色 | 出席 / 缺席 |
|------|------|------------|
| | Tech Lead | |
| | Security Lead（候選/已指派） | |
| | CTO / IT Director | |
| | Business Owner | |
| | CFO | |
| | 法務 | |
| | HR | |

---

## 📋 會議前準備（Prerequisites）

請確認所有出席者已**會議前完成**：

- [ ] 閱讀 `claudedocs/4-changes/FEAT-013-security-hardening.md`（重點：第 4 章 7 大領域、第 8 章 4 階段）
- [ ] 預填 `01-matrix-coverage-review.md`（Tech Lead 主導）
- [ ] 預填 `02-risk-appetite-survey.md`（Management 主導）
- [ ] 預填 `03-security-lead-assignment.md`（HR + Management）
- [ ] 預填 `04-budget-approval.md`（CFO + CTO）

---

## 🎯 會議目標

完成本會議後應達成：

1. ✅ 確認 77 項檢查覆蓋度（含 N/A 項目）
2. ✅ 確認風險等級分類符合公司風險偏好
3. ✅ 正式指派 Security Lead（含 DPO 如適用）
4. ✅ 批准 Phase 1 預算與工程資源
5. ✅ 確認 Phase 1 啟動日期與里程碑

---

## 📑 議程（90-120 分鐘）

### Part 1：背景與基線（15 min）
- **主講**: Tech Lead
- **內容**:
  - FEAT-013 起源與雙目標（合規 + 技術強化）
  - 現況：77 項中 L0=37、L1=17、L2=12、L3+=0、整體 0.6/4 → 🔴 NOT READY
  - 4 階段路徑與時程

### Part 2：矩陣覆蓋度確認（30 min）
- **主講**: Tech Lead + Security Lead 候選人
- **依據**: `01-matrix-coverage-review.md`
- **討論**:
  - 7 大領域 77 項是否覆蓋本專案所有風險面
  - N/A 候選確認（IAM-09 / AppSec-10）
  - 是否需新增領域或檢查（例：是否需新增 OpenTelemetry、RUM、Tokenization 等）
  - 評估等級爭議項目逐一討論

**決議**:
- 同意 N/A 項目: ___________
- 新增項目: ___________
- 評估等級調整: ___________

### Part 3：風險偏好與分類（15 min）
- **主講**: Management
- **依據**: `02-risk-appetite-survey.md`
- **討論**:
  - 主要合規目標（ASVS / NIST / SOC 2 / ISO / GDPR）優先順序
  - 整體風險偏好（極低 / 低 / 中 / 高）
  - HIGH/MED/LOW 分類抽樣檢視（25 個 HIGH 項目）
  - 業務 vs 安全配比

**決議**:
- 主要合規目標排序: ___________
- 風險偏好: ___________
- 風險等級調整（升降級）: ___________
- 業務/安全配比: ___% / ___%

### Part 4：Security Lead 指派（15 min）
- **主講**: Management + HR
- **依據**: `03-security-lead-assignment.md`
- **討論**:
  - 候選人介紹與評估
  - 職責 RACI 確認
  - % FTE 承諾
  - DPO 是否需要 + 是否同人擔任
  - 備援人選

**決議**:
- Security Lead: ___________
- DPO（如需）: ___________
- 生效日期: ___________
- 備援: ___________

### Part 5：預算批准（15 min）
- **主講**: CFO + CTO
- **依據**: `04-budget-approval.md`
- **討論**:
  - Phase 1 SaaS 成本（$50-225/月）
  - Phase 1 工程資源（~80 工時 + Security Lead 兼職）
  - Phase 2-4 預先批准 vs 階段批准
  - 第三方 Pen Test / SOC 2 是否預先承諾

**決議**:
- Phase 1 預算: ☐ 全批准 ☐ 部分批准（_______）
- Phase 2-3 預算: ☐ 預批 ☐ 階段批
- Phase 4 預算: ☐ 預批 ☐ 階段批 ☐ 暫不承諾
- 工程資源: ___________

### Part 6：Phase 1 啟動規劃（10 min）
- **主講**: Security Lead（已指派）
- **討論**:
  - Phase 1 啟動日期
  - 11 項 Phase 1 修補的 owner 分配
  - Risk Register 啟動
  - Phase 1 結案目標日

**決議**:
- Phase 1 啟動日: ___________
- Phase 1 結案目標: ___________
- Owner 分配: ___________

### Part 7：Q&A 與結語（10 min）
- 未討論的議題彙整
- Action Items 確認
- 下次會議：Phase 1 結案 Review

---

## 📝 會議紀錄（填寫）

### 主要決議（Decisions）

#### D-01: 矩陣覆蓋度
> _______

#### D-02: 風險等級
> _______

#### D-03: Security Lead 指派
> _______

#### D-04: 預算批准
> _______

#### D-05: Phase 1 時程
> _______

### Action Items

| # | Action | Owner | Due Date | Status |
|---|--------|-------|---------|--------|
| AI-01 | 公告 Security Lead 指派（Email + Teams） | HR | | ☐ 完成 |
| AI-02 | 採購 Upstash Redis + Application Insights + Key Vault | IT 採購 | | ☐ 完成 |
| AI-03 | 建立 GitHub `Security` team 並加入 Security Lead | DevOps | | ☐ 完成 |
| AI-04 | 啟動 Risk Register（基於 FEAT-013） | Security Lead | | ☐ 完成 |
| AI-05 | Phase 1 Kickoff Meeting | Security Lead | | ☐ 完成 |
| AI-06 | 更新 FEAT-013 文件回填會議結論 | Tech Lead | | ☐ 完成 |
| AI-07 | 設定下次 Review Meeting（Phase 1 結案） | 主持人 | | ☐ 完成 |
| AI-08 | _______ | _______ | | ☐ 完成 |

### 待後續決議（Parking Lot）

> 本次會議未完成的議題：
>
> _______

### 風險與顧慮（Risks Raised）

> 出席者提出的疑慮：
>
> _______

---

## 🔚 Phase 0 Closure 檢核

完成本會議並所有 Action Items 達成後，Phase 0 即可結案：

- [ ] AI-01 ~ AI-07 全部完成
- [ ] FEAT-013 v2.0 → v2.1 更新（回填會議結論）
- [ ] 5 份 phase-0-review 文件正式簽署
- [ ] Risk Register 初版建立
- [ ] Phase 1 Kickoff 已排定

完成後撰寫 **Phase 0 Closure Report**（建議放於 `docs/governance/phase-0-review/00-closure-report.md`）並進入 Phase 1。

---

## 📎 附錄：會議材料 checklist

主持人會議前準備：

- [ ] 投影片（重點：第 4 章 7 領域 + 第 8 章 4 階段）
- [ ] 列印 5 份 phase-0-review 文件供現場填寫
- [ ] 準備白板 / 數位協作工具（Miro / Notion）
- [ ] 確認所有出席者已完成預讀
- [ ] 預訂會議室 / Teams 會議連結

---

**Last Updated**: 2026-04-28
**Status**: ☐ 未開始 ☐ 進行中 ☐ 已完成
**Next Meeting**: Phase 1 結案 Review（預計 _______）
