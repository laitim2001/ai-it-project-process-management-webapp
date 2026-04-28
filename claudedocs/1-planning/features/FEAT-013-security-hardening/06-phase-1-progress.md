---
feature: FEAT-013 Phase 1 Progress
status: 📋 Not Started
created: 2026-04-28
last_updated: 2026-04-28
---

# FEAT-013 Phase 1 Progress Tracker

> 用於追蹤 5 個子任務的執行進度。每日 standup 後更新。

---

## 📊 整體狀態

- **Phase 1 啟動日**: 待定（依 Security Lead 指派完成）
- **Phase 1 預計結案日**: 啟動日 + 13 個工作天
- **Phase 1 實際結案日**: 待定
- **整體進度**: 0% （0/5 子任務完成）

```
Track A: [⬜ 013.1 ][⬜ 013.2                    ]
Track B: [⬜ 013.3        ][⬜ 013.4        ]
Track C: [⬜ 013.5        ]
                                              [⬜ Review]
```

---

## 🎯 子任務進度

### FEAT-013.1 — IAM-01 publicProcedure 審查

- **狀態**: ⬜ Not Started
- **Owner**: 待指派
- **Branch**: `feature/feat-013-1-public-procedure-audit`（待建）
- **PR**: 待建
- **預計工時**: 2d
- **實際工時**: -
- **Blockers**: 無

#### Steps

- [ ] Step 1: 盤點 publicProcedure（產出 audit 文件）
- [ ] Step 2: 修補 procedure 類型
- [ ] Step 3: SEC-007 admin/seed GET 加 Bearer
- [ ] Step 4: ESLint 規則建立
- [ ] Step 5: PR Template 強化
- [ ] Step 6: 整合測試 + Code Review

#### DoD

- [ ] publicProcedure 數量 ≤ 5
- [ ] 所有保留項目有 `// PUBLIC: <reason>` 註解
- [ ] ESLint 規則上線
- [ ] FEAT-013 主矩陣 IAM-01 從 L1 → L3

---

### FEAT-013.2 — IAM-10 資源所有權驗證

- **狀態**: ⬜ Not Started
- **Owner**: 待指派
- **Branch**: `feature/feat-013-2-resource-ownership`（待建）
- **PR**: 待建
- **預計工時**: 5d
- **實際工時**: -
- **Blockers**: 等待 FEAT-013.1 完成（建議）

#### Steps

- [ ] Step 1: 盤點所有 mutation
- [ ] Step 2: 開發 ownership / permissions utility + unit test
- [ ] Step 3: 套用到 8 個 routers
- [ ] Step 4: 撰寫 5 個 E2E 場景

#### DoD

- [ ] 至少 27 個 mutation 加 ownership 檢查
- [ ] 5 個 E2E 場景通過
- [ ] FEAT-013 主矩陣 IAM-10 從 L1 → L3

---

### FEAT-013.3 — AppSec-09 Rate Limit (in-memory)

- **狀態**: ⬜ Not Started
- **Owner**: 待指派
- **Branch**: `feature/feat-013-3-rate-limit`（待建）
- **PR**: 待建
- **預計工時**: 3d
- **實際工時**: -
- **Blockers**: 無

#### Steps

- [ ] Step 1: 建立 limiter library + unit test
- [ ] Step 2: Next.js middleware 整合
- [ ] Step 3: tRPC middleware 整合
- [ ] Step 4: 套用敏感端點
- [ ] Step 5: 前端錯誤元件 + i18n
- [ ] Step 6: E2E 測試

#### DoD

- [ ] 全域 100 req/min/IP 上線
- [ ] tRPC mutation 50/min, query 200/min 上線
- [ ] 4 個敏感端點嚴格限制
- [ ] FEAT-013 主矩陣 AppSec-09 從 L0 → L2

---

### FEAT-013.4 — IAM-07 帳號鎖定 + 解鎖

- **狀態**: ⬜ Not Started
- **Owner**: 待指派
- **Branch**: `feature/feat-013-4-lockout-with-unlock`（待建）
- **PR**: 待建
- **預計工時**: 3d
- **實際工時**: -
- **Blockers**: 等待 FEAT-013.3 完成（建議共用 rate limit 機制）

#### Steps

- [ ] Step 1: Schema migration（User + AuditLog 雛形）
- [ ] Step 2: AuditLog helper
- [ ] Step 3: 認證流程改造（authorize + signIn callback）
- [ ] Step 4: Admin 解鎖 procedure
- [ ] Step 5: Admin UI（UnlockAccountButton）
- [ ] Step 6: Email 通知
- [ ] Step 7: E2E 測試

#### DoD

- [ ] 5 次失敗自動鎖定 15 分鐘
- [ ] 鎖定期滿自動解除
- [ ] Admin 手動解鎖介面 + 操作記錄 AuditLog
- [ ] SSO 登入自動解除本地鎖定
- [ ] Email 鎖定通知
- [ ] 5 個 E2E 場景通過
- [ ] FEAT-013 主矩陣 IAM-07 從 L0 → L3

---

### FEAT-013.5 — Resi-09 Incident Response Plan

- **狀態**: ⬜ Not Started
- **Owner**: 待指派
- **Branch**: `feature/feat-013-5-incident-response`（待建）
- **PR**: 待建
- **預計工時**: 3d
- **實際工時**: -
- **Blockers**: 無

#### Steps

- [ ] Step 1: 撰寫主 IR Plan
- [ ] Step 2: 撰寫 3 份 sub-runbooks
- [ ] Step 3: 整合與 Review

#### DoD

- [ ] `incident-response-plan.md` 完成
- [ ] 3 份 sub-runbooks 完成
- [ ] 事件分級表 + 角色 RACI + 6 階段流程
- [ ] mini-tabletop 演練紀錄
- [ ] FEAT-013 主矩陣 Resi-09 從 L0 → L3

---

## 📅 每日進度更新

> 每日 standup 後填寫，最新在最上。

### YYYY-MM-DD（範本）

**今日完成**:
- 

**進行中**:
- 

**Blockers**:
- 

**明日計畫**:
- 

---

## 🚨 Blockers / Risks Tracker

| ID | 描述 | Owner | 影響 | 狀態 | 解除日期 |
|----|------|-------|------|------|---------|
| - | - | - | - | - | - |

---

## 📝 決策紀錄（ADR Lite）

> 任何 Phase 1 期間的設計決策變更紀錄於此。

### Decision Template

```
### YYYY-MM-DD: 決策標題

**Context**: 為何需要決定？
**Options**: 考慮的選項
**Decision**: 選了哪個 + 理由
**Consequences**: 影響什麼？
**Owner**: 誰拍板
```

---

## 🎯 Phase 1 結案 DoD

完成所有子任務 DoD 後再加：

- [ ] 內部 Review Meeting（1h）
- [ ] FEAT-013 主矩陣更新（5 項 Check 等級提升）
- [ ] Risk Register 更新（記錄 Phase 1 期間發現的新風險）
- [ ] Phase 1 Closure Report 撰寫
- [ ] Phase 2 Kickoff 排定

---

## 📚 Quick Links

- Phase 1 Overview: `00-phase-1-overview.md`
- 子任務規劃：`01-iam-01-*.md` ~ `05-resi-09-*.md`
- 主矩陣：`claudedocs/4-changes/FEAT-013-security-hardening.md`
- Phase 0 結論：`docs/security-and-governance/phase-0-review/SIMPLIFIED-REVIEW.md`

---

**Last Updated**: 2026-04-28
