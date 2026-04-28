---
feature: FEAT-013 Phase 1
parent: claudedocs/4-changes/FEAT-013-security-hardening.md
status: 📋 Ready to Start
created: 2026-04-28
phase_lead: Security Lead（待指派）/ Tech Lead（暫代）
---

# FEAT-013 Phase 1 Overview — 安全強化首階段

> **目標**：4 週內完成 5 個 Critical 修補，將最高風險項目從 L0/L1 提升至 L2，奠定 Phase 2-3 基礎。
> **總工程時間**: ~13 工作天（單人 ~3 週，含 review）
> **新增成本**: $0（純工程時間，所有工具皆 OSS / 既有 Azure 資源）

---

## 🎯 Phase 1 範圍（5 個子任務）

| Sub-Feature | Check ID | 主題 | 性質 | 估時 | 依賴 | 文件 |
|-------------|----------|------|------|------|------|------|
| **FEAT-013.1** | IAM-01 | publicProcedure 審查 | FIX | 2d | 無 | `01-iam-01-public-procedure-audit.md` |
| **FEAT-013.2** | IAM-10 | 資源所有權驗證 | CHANGE | 5d | FEAT-013.1 | `02-iam-10-resource-ownership.md` |
| **FEAT-013.3** | AppSec-09 | Rate Limit（in-memory） | FEAT | 3d | 無 | `03-appsec-09-rate-limit.md` |
| **FEAT-013.4** | IAM-07 | 帳號鎖定 + 解鎖 | CHANGE | 3d | FEAT-013.3 | `04-iam-07-lockout-with-unlock.md` |
| **FEAT-013.5** | Resi-09 | Incident Response Plan | DOC | 3d | 無 | `05-resi-09-incident-response-plan.md` |

> **總計**: 16d 名目 / **13d 實際**（並行節省）

---

## 🔗 依賴關係與並行排程

```
Week 1                Week 2                Week 3                Week 4
┌───────────────┐
│ FEAT-013.1    │ → 修補 publicProcedure
│ IAM-01 (2d)   │
└───────┬───────┘
        │
        ▼
┌───────────────────────┐
│ FEAT-013.2            │ → 加 ownership
│ IAM-10 (5d)           │
└───────────────────────┘

┌───────────────┐  ┌───────────────┐
│ FEAT-013.3    │→ │ FEAT-013.4    │ → IAM-07 依賴 .3 的 rate limit 機制
│ AppSec-09(3d) │  │ IAM-07 (3d)   │
└───────────────┘  └───────────────┘

┌───────────────┐
│ FEAT-013.5    │ ← 純文件，可任何時間並行
│ Resi-09 (3d)  │
└───────────────┘
                                                      ┌───────────────┐
                                                      │ Phase 1 DoD   │
                                                      │ Review (1d)   │
                                                      └───────────────┘
```

**並行策略**：Track A（.1 → .2）+ Track B（.3 → .4）+ Track C（.5）三線並行 → 最快 ~13d 完成。

---

## 📋 Phase 1 整體 DoD

完成以下 5 項即視為 Phase 1 結案：

- [ ] FEAT-013.1 完成：publicProcedure 數量 ≤ 5（白名單明列）+ ESLint 規則建立
- [ ] FEAT-013.2 完成：所有 update/delete mutation 加 ownership 檢查 + Playwright E2E 通過
- [ ] FEAT-013.3 完成：tRPC 與 /api/* 全面套用 rate limit + 觸發 metrics 可查
- [ ] FEAT-013.4 完成：鎖定 + 解鎖 + email 通知 + Admin 介面 + AuditLog 記錄
- [ ] FEAT-013.5 完成：`docs/security-and-governance/governance/incident-response-plan.md` + 3 sub-runbooks 產出

加上：

- [ ] 內部 Review Meeting（1h）：Tech Lead + Security Lead 確認所有 DoD 達成
- [ ] FEAT-013 主文件矩陣更新：5 項 Check 等級從 L0/L1 → L2
- [ ] Phase 2 Kickoff 排定

---

## 🚀 Kickoff Checklist

啟動 Phase 1 前確認：

- [ ] Phase 0 SIMPLIFIED-REVIEW.md 已 Approve（2026-04-28 已完成）
- [ ] Security Lead 指派完成（Phase 0 結論）
- [ ] 開發環境準備：
  - [ ] Node.js 20.11 / pnpm 8.15.3 環境就緒
  - [ ] Docker 服務運行（PostgreSQL / Redis / Mailhog）
  - [ ] `pnpm check:env` 通過
  - [ ] 確認 `pnpm db:generate` 可正常產出 Prisma Client
- [ ] Git 工作流：
  - [ ] 建立 feature branch `feature/feat-013-phase-1`
  - [ ] 每個子任務一個 PR，title 含 `[FEAT-013.X]` prefix
- [ ] Risk Register 啟動（追蹤 Phase 1 內可能新增風險）

---

## 📊 影響範圍總覽

### 受影響的 Models（需 migration）

| Model | 變更 | Sub-Feature |
|-------|------|-------------|
| User | +failedLoginAttempts、lockedUntil、lastFailedLoginAt | FEAT-013.4 |
| AuditLog | 新增（如尚未存在），記錄鎖定/解鎖事件 | FEAT-013.4 |
| RateLimitMetric | 新增（可選，記錄觸發） | FEAT-013.3 |

### 受影響的 Routers / Procedures

- 全 17 個 router：FEAT-013.1（publicProcedure）+ FEAT-013.2（ownership）
- `auth/[...nextauth]`：FEAT-013.4（鎖定邏輯）
- `user.ts`：FEAT-013.4（解鎖 procedure）

### 受影響的 Pages / UI

- `/admin/users/[id]`：FEAT-013.4 加「解鎖」按鈕 + 顯示鎖定狀態
- `/login`：FEAT-013.4 加帳號鎖定錯誤訊息（不洩漏差異）

### 受影響的 Middleware / 共用

- `apps/web/src/middleware.ts`：FEAT-013.3 加全域 rate limit
- `packages/api/src/trpc.ts`：FEAT-013.3 加 mutation/query rate limit
- `packages/api/src/lib/ownership.ts`（新建）：FEAT-013.2

### 治理文件產出

放於 `docs/security-and-governance/governance/`：

- `incident-response-plan.md`（FEAT-013.5）
- `runbooks/data-breach-runbook.md`（FEAT-013.5）
- `runbooks/ddos-runbook.md`（FEAT-013.5）
- `runbooks/account-takeover-runbook.md`（FEAT-013.5）

### i18n 影響

新增約 15-20 個翻譯 key（鎖定錯誤訊息、Admin 解鎖介面、Rate limit 提示）。

---

## ⚠️ Phase 1 風險與緩解

| 風險 | 機率 | 影響 | 緩解 |
|------|------|------|------|
| FEAT-013.2 ownership 改動範圍過大，產生 regression | 中 | 高 | 每個 router 改完立即跑 Playwright + 針對性 unit test |
| FEAT-013.4 鎖定機制 lock 住既有 admin 帳號 | 低 | 高 | 部署前先在 staging 測試；生產部署時 Tech Lead + Security Lead 雙人在場 |
| FEAT-013.3 in-memory rate limit 在多實例下不一致 | 中 | 中 | 文件化此限制；單實例使用即可，多實例擴展時再升級為 Redis |
| FEAT-013.5 IR Plan 缺乏實際運行驗證 | 高 | 中 | Phase 2 安排第一次 tabletop exercise |
| Security Lead 未及時指派，Phase 1 Review 卡關 | 中 | 中 | Tech Lead 暫代直到指派完成 |

---

## 📅 預期里程碑

| 時間點 | 里程碑 | 對應任務 |
|--------|-------|---------|
| Day 0 | Kickoff Meeting | Phase 1 啟動 |
| Day 2 | FEAT-013.1 完成 | publicProcedure 修補 |
| Day 3 | FEAT-013.3 完成 | Rate limit 上線 |
| Day 6 | FEAT-013.4 完成 | 鎖定+解鎖 |
| Day 7 | FEAT-013.2 完成 | Ownership |
| Day 8 | FEAT-013.5 完成 | IR Plan 文件 |
| Day 13 | Phase 1 Review + DoD 驗證 | 結案 |

---

## 🔄 與其他工作流的關係

- **Epic 9-10**：Phase 1 完成前**不啟動** Epic 9 AI Assistant 開發，避免 LLM 安全議題（AppSec-12）混入
- **既有 FIX/CHANGE**：Phase 1 期間其他 PR **可繼續 merge**，但需確保通過新增的 ownership / rate limit 規則
- **CI/CD**：Phase 1 結束後將新增 lint 規則（禁未審 publicProcedure）強制執行

---

## 📚 參考文件

- 主矩陣：`claudedocs/4-changes/FEAT-013-security-hardening.md`
- Phase 0 結論：`docs/security-and-governance/phase-0-review/SIMPLIFIED-REVIEW.md`
- 既有安全審查：`docs/codebase-analyze/10-issues-and-debt/security-review.md`
- Karpathy guidelines：`.claude/rules/karpathy-guidelines.md`

---

**Last Updated**: 2026-04-28
**Next Review**: Phase 1 Day 13（結案 Review）
