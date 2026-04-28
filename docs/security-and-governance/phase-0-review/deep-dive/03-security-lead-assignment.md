# 03 — Security Lead 指派表（Security Lead Assignment）

> **目的**：依 Gov-08（安全責任人）要求，正式指派 Security Lead，並視業務需要指派 DPO。
> **填寫者**: Management（CTO / IT Director / HR）
> **預計時間**: 30 分鐘
> **建立日期**: 2026-04-28
> **依據**: NIST CSF GV.RR、SOC 2 CC1.3、GDPR Art.37、ISO 27001 A.6.1.1

---

## 1. Security Lead 職責 JD（Job Description）

### 1.1 角色定位
- **Reports to**: CTO / IT Director
- **承諾投入**: 兼職 30-50%（依 FEAT-013 階段需求）→ Phase 1-3 後可降為 20%
- **任期**: 1 年起，年度續聘

### 1.2 主要職責（RACI）

| 職責 | R | A | C | I |
|------|---|---|---|---|
| 維護 FEAT-013 矩陣（77 項評估等級） | ✅ | | | |
| 維護 Risk Register（Gov-12） | ✅ | | | |
| 主持季度 Access Review（Gov-10） | ✅ | | | |
| 主持季度 Incident Response 演練（Resi-10） | ✅ | | | |
| 審核 Security 相關 PR（IAM / Auth / Permission） | ✅ | | | |
| 審查 npm audit / SAST / Pen Test 結果 | ✅ | | | |
| 制定與更新 Governance 文件（14 份） | | ✅ | | |
| Phase 1-4 階段批准 | | | ✅ | |
| 第三方 Pen Test 對接（年度） | ✅ | | | |
| Security Awareness 培訓籌辦（Gov-09） | | ✅ | ✅ | |
| Vendor Risk Assessment（Gov-05） | | ✅ | | |
| 安全事件 Incident Commander | ✅ | | | |
| 月度安全報告（給 Management） | ✅ | | | |
| 參與重大功能 Threat Modeling（SDLC-12） | ✅ | | | |

> R = Responsible（執行）, A = Accountable（負責）, C = Consulted（諮詢）, I = Informed（告知）

### 1.3 必要資格（Must Have）
- 熟悉 OWASP Top 10、ASVS、NIST CSF
- 熟悉 Next.js / tRPC / Prisma 技術棧
- 至少 3 年軟體開發經驗
- 良好溝通能力（需與 Management、法務、業務協作）

### 1.4 加分項目（Nice to Have）
- CISSP / CISM / CEH 認證
- SOC 2 / ISO 27001 稽核經驗
- Azure 安全配置經驗
- Pen Test / Red Team 經驗

### 1.5 授權範圍
- ✅ 可獨立決定：MED / LOW 風險項目修補方式
- ✅ 可獨立批准：Security 工具採購（≤ $1K/月）
- ⚠️ 需 CTO 共同決定：HIGH 風險項目延後、整體時程調整
- ❌ 必須 Management 批准：年度預算 > $5K、外部顧問聘用、SOC 2 稽核啟動

---

## 2. DPO（Data Protection Officer）職責 JD

> 視業務範疇是否觸發 GDPR Art.37 / 台灣個資法第 18 條

### 2.1 是否需要 DPO？

請依以下檢查決定（任一為 Yes 則需指派 DPO）：

- [ ] 公司核心業務是大規模、系統性監控資料主體？
- [ ] 公司核心業務是大規模處理特殊類別資料（健康、政治、宗教等）？
- [ ] 公司是公部門 / 公務機關？
- [ ] 公司處理超過 5,000 筆歐盟自然人資料？
- [ ] 客戶 / 投標方明確要求設置 DPO？

**結論**: ☐ 需要指派 DPO ☐ 不需要（理由：______）

### 2.2 DPO 職責（如需指派）
- GDPR / 個資法合規監督
- 資料主體權利（DSR）請求處理（DP-07 / DP-08）
- 個資外洩通報窗口（72h 內通知主管機關）
- DPIA（資料保護影響評估）
- 員工個資意識訓練（Gov-09 部分）
- 與監管機關溝通

### 2.3 DPO 與 Security Lead 的關係
- **可同一人擔任**（小型組織常見）
- **不可同一人**（GDPR 要求 DPO 須獨立、無利益衝突 — 例：DPO 不可同時是 IT Director）

---

## 3. 候選人提名（Candidate Nomination）

### 3.1 Security Lead 候選人

| # | 姓名 | 現職 | 經驗 | 是否願意 | 建議 % FTE |
|---|------|------|------|---------|-----------|
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |

### 3.2 提名理由與評估

**候選人 1 評估**:
> 優勢：
> 顧慮：
> 適配度：☐ 高 ☐ 中 ☐ 低

**候選人 2 評估**:
> 優勢：
> 顧慮：
> 適配度：☐ 高 ☐ 中 ☐ 低

### 3.3 DPO 候選人（如需）

| # | 姓名 | 現職 | 是否同 Security Lead | 是否願意 |
|---|------|------|---------------------|---------|
| 1 | | | ☐ 是 ☐ 否 | |
| 2 | | | ☐ 是 ☐ 否 | |

---

## 4. 正式指派（Formal Assignment）

### 4.1 Security Lead 指派

- **姓名**: _______
- **現職**: _______
- **生效日期**: _______
- **任期至**: _______（建議 1 年起）
- **% FTE 承諾**: ____%
- **直屬上級**: _______（建議 CTO / IT Director）

### 4.2 DPO 指派（如適用）

- **姓名**: _______
- **是否同 Security Lead**: ☐ 是 ☐ 否
- **生效日期**: _______
- **直屬上級**: _______

### 4.3 備援人選（Backup）
若 Security Lead 不在，誰是代理？

- **備援姓名**: _______
- **代理範圍**: ☐ 全部職責 ☐ 僅事件處理 ☐ 僅日常

---

## 5. 績效指標（KPI）

Security Lead 任期內需達成以下指標：

### 5.1 Phase 1（第 1-2 個月）
- [ ] 11 項 Phase 1 修補全部 ≥ L2
- [ ] 14 份 Governance 文件啟動 ≥ 4 份
- [ ] Risk Register 建立並維護
- [ ] 月報送出（每月 1 次）

### 5.2 Phase 2（第 3-6 個月）
- [ ] HIGH 項目全部 ≥ L3
- [ ] MED 項目 ≥ 50% ≥ L2
- [ ] Governance 文件完成 14 份
- [ ] 第一次 Access Review 完成（Gov-10）
- [ ] 第一次 IR Tabletop Exercise（Resi-10）

### 5.3 Phase 3-4（第 7-12 個月）
- [ ] 整體成熟度 ≥ 2.5/4
- [ ] 第三方 Pen Test 啟動 + 報告無 High 以上
- [ ] SOC 2 / ISO 27001 控制項對應完成 ≥ 90%

### 5.4 持續性
- [ ] 季度 Risk Register Review
- [ ] 季度 Access Review
- [ ] 年度 Pen Test
- [ ] 年度 Security Awareness Training

---

## 6. 簽核（Approval）

### 6.1 指派同意

| 角色 | 姓名 | 同意 / 不同意 | 簽署日期 |
|------|------|---------------|---------|
| Management（批准）| _______ | ☐ 同意 ☐ 條件同意 ☐ 不同意 | _______ |
| 被指派人（接受）| _______ | ☐ 接受 ☐ 條件接受 ☐ 拒絕 | _______ |
| HR（資源確認）| _______ | ☐ 同意 ☐ 不同意 | _______ |
| 法務（如指派 DPO）| _______ | ☐ 同意 ☐ 不適用 | _______ |

### 6.2 條件 / 備註
> 若有條件同意或拒絕，請說明：
>
> _______

---

## 7. 後續行動

指派完成後 1 週內：
- [ ] Security Lead 加入 GitHub `Security` team（Read 權限到全部 repo）
- [ ] Security Lead 加入 Azure Subscription `Reader` 角色（含日誌存取）
- [ ] Security Lead 加入 Risk Register / FEAT-013 相關 calendar invites
- [ ] 公告（Email / Teams）告知全公司
- [ ] Security Lead 主導 Phase 0 Closure 會議

---

**Last Updated**: 2026-04-28
**Next Step**: 完成後同步至 `04-budget-approval.md` 的「Security Lead 確認」欄位
