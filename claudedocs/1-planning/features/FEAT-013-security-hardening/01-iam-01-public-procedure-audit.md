---
sub_feature: FEAT-013.1
check_id: IAM-01
nature: FIX（修補既有暴露）
status: 📋 Planned
estimated_days: 2
dependencies: 無（可立即啟動）
---

# FEAT-013.1 — IAM-01 publicProcedure 審查

> **Check ID**: IAM-01（API 路由認證覆蓋率）
> **企業級基準**: ≥ 95%，公開 API 白名單
> **目前評估**: L1 → 目標 L3
> **對應既有發現**: SEC-001、SEC-002、SEC-007（部分由 FIX-101~103 修復，需驗證殘餘）

---

## 1. 背景與目標

### 1.1 問題現況

依 2026-04-28 Explore agent 統計，本專案共 244 個 tRPC procedure，其中 `publicProcedure` 占 **24 個（10%）**：

- **Health Router**：12 個（含 `diag*`、`schemaCompare`、`fix*`、`debugUserPermissions`）
- **Auth Router**：少量註冊 / 密碼重設相關
- **其他**：少量健康檢查端點

部分 publicProcedure 在 FIX-102 中已改為 adminProcedure，但**完整盤點與修補尚未完成**。

### 1.2 目標

- 將 publicProcedure 數量從 24 個降至 **≤ 5 個**（白名單明列）
- 建立 ESLint 規則防止未經審核的新 publicProcedure
- 補強審計：所有 publicProcedure 在 PR template 中需填「公開理由」

### 1.3 不在範圍

- 重寫 health router 邏輯（屬獨立技術債）
- 移除 raw SQL 端點（屬 AppSec-02 / AppSec-04 範疇）

---

## 2. 影響範圍

### 2.1 受影響檔案

| 檔案 | 變更類型 | 行數估 |
|------|---------|--------|
| `packages/api/src/routers/health.ts` | 修改 procedure 類型 | ~12 處 |
| `packages/api/src/routers/auth.ts`（如有） | 審查 | 視情況 |
| `apps/web/src/app/api/admin/seed/route.ts` | 加 GET 認證（SEC-007） | ~10 行 |
| `packages/eslint-config/index.js`（或新建 plugin） | 新增規則 | ~30 行 |
| `packages/api/src/trpc.ts` | 註解強化（無代碼變動） | ~5 行 |
| `.github/PULL_REQUEST_TEMPLATE.md` | 加「publicProcedure 理由」欄位 | ~5 行 |

### 2.2 不需 Migration

無 schema 變更。

### 2.3 i18n 影響

無（純後端）。

---

## 3. 技術設計

### 3.1 publicProcedure 分類矩陣

逐一審視 24 個 procedure，依用途分為 4 類：

| 類別 | 處理 | 範例 |
|------|------|------|
| **A. 真正公開**（保留 publicProcedure） | ≤ 5 個白名單 | `health.ping`、`health.dbCheck`、`auth.csrf`（NextAuth） |
| **B. 診斷 / Debug**（改 protectedProcedure） | 認證後可用 | `health.diag*`、`debugUserPermissions` |
| **C. Schema 操作**（改 adminProcedure） | 僅 Admin | `health.schemaCompare`、`health.fix*` |
| **D. 應全面禁用**（生產 throw NOT_FOUND） | env-gated | `health.fixAllSchemaIssues` 等危險 DDL |

### 3.2 ESLint 規則設計

新增自訂規則 `no-unaudited-public-procedure`：

```typescript
// packages/eslint-config/rules/no-unaudited-public-procedure.js
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Disallow new publicProcedure without explicit allowlist comment' },
  },
  create(context) {
    return {
      MemberExpression(node) {
        if (
          node.object?.name === 'publicProcedure' ||
          node.property?.name === 'publicProcedure'
        ) {
          // 檢查上方 5 行內是否有 // PUBLIC: <reason> 註解
          const comments = context.getSourceCode().getCommentsBefore(node);
          const hasJustification = comments.some(c =>
            c.value.includes('PUBLIC:')
          );
          if (!hasJustification) {
            context.report({
              node,
              message: 'publicProcedure 須在前方加 // PUBLIC: <reason> 註解說明公開理由',
            });
          }
        }
      },
    };
  },
};
```

### 3.3 PR Template 強化

`.github/PULL_REQUEST_TEMPLATE.md` 新增區塊：

```markdown
## Security Checklist

- [ ] 本 PR 是否新增 / 修改 `publicProcedure`？
  - 若是：
    - [ ] 已加 `// PUBLIC: <reason>` 註解
    - [ ] 已在 description 說明公開理由
    - [ ] 已通過 Security Lead review（@security-lead）
```

### 3.4 SEC-007 Admin Seed GET 修補

`apps/web/src/app/api/admin/seed/route.ts` 的 GET 端點加 Bearer token 驗證（與 POST 一致）：

```typescript
export async function GET(request: NextRequest) {
  // 驗證 Bearer token（與 POST 一致）
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.SEED_API_TOKEN || process.env.NEXTAUTH_SECRET;

  if (!authHeader?.startsWith('Bearer ') || authHeader.slice(7) !== expectedToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ... 原有邏輯
}
```

---

## 4. 實作步驟

### Step 1: 盤點 publicProcedure（0.5d）

```bash
# 列出所有 publicProcedure 使用點
grep -rn "publicProcedure" packages/api/src/routers/ > /tmp/public-procs.txt
```

依 §3.1 矩陣分類，產出 `claudedocs/1-planning/features/FEAT-013-security-hardening/audit-public-procs.md`：

| Procedure | 檔案:行號 | 分類 | 處置 |
|-----------|----------|------|------|
| `health.ping` | health.ts:42 | A | 保留 |
| `health.diagOpCo` | health.ts:288 | B | → protectedProcedure |
| `health.fixMigration` | health.ts:82 | C | → adminProcedure |
| ... | | | |

### Step 2: 修補 procedure 類型（0.5d）

依分類逐一修改 import 與用法：

```typescript
// Before
diagOpCo: publicProcedure.query(async ({ ctx }) => { ... }),

// After
diagOpCo: protectedProcedure.query(async ({ ctx }) => { ... }),
```

驗證：
```bash
pnpm typecheck
pnpm test --filter=api
```

### Step 3: 補強 SEC-007（0.25d）

依 §3.4 修改 admin/seed/route.ts 的 GET。

### Step 4: 建立 ESLint 規則（0.5d）

依 §3.2 新增 lint 規則並整合到 `eslint-config`。

驗證：
```bash
pnpm lint
# 對既有 publicProcedure 加 // PUBLIC: <reason> 註解直到通過
```

### Step 5: PR Template 強化（0.25d）

依 §3.3 更新 template。

### Step 6: 整合測試（0.25d）

跑 Playwright E2E（特別是 health 端點與 admin seed），確認沒有 regression。

---

## 5. 驗收標準（DoD）

- [ ] `grep -c "publicProcedure" packages/api/src/routers/*.ts` 結果 ≤ 5
- [ ] 所有保留的 publicProcedure 都有 `// PUBLIC: <reason>` 註解
- [ ] ESLint 規則 `no-unaudited-public-procedure` 上線且 CI 強制執行
- [ ] PR Template 含 Security Checklist 區塊
- [ ] `apps/web/src/app/api/admin/seed/route.ts` GET 加 Bearer token 驗證
- [ ] Playwright E2E 全部通過（無 regression）
- [ ] FEAT-013 主矩陣 IAM-01 等級從 L1 → L3

---

## 6. 驗證計畫

### 6.1 自動測試

```bash
# Type check
pnpm typecheck

# Lint（含新規則）
pnpm lint

# Unit test
pnpm test --filter=api

# E2E
pnpm test --filter=web
```

### 6.2 手動驗證

- [ ] curl 未認證打 `/api/trpc/health.diagOpCo` 預期回 401
- [ ] curl 已認證但非 admin 打 `/api/trpc/health.fixMigration` 預期回 403
- [ ] curl 未帶 token 打 `GET /api/admin/seed` 預期回 401

### 6.3 Security Lead Review

- [ ] 5 個保留的 publicProcedure 白名單由 Security Lead 簽核

---

## 7. 風險與取捨

| 風險 | 緩解 |
|------|------|
| 改錯 procedure 類型導致前端某些查詢失敗 | 每改一個 router 立即跑該 router 的 E2E |
| ESLint 規則對既有代碼產生大量 warning | 第一次套用時用 `// PUBLIC: existing-pre-feat-013` 暫時標記，後續逐一審查 |
| `health.ping` 改動破壞 Azure App Service health check | 保留 `ping` 為 publicProcedure（白名單第 1 項） |

---

## 8. 後續延伸（不在本 sub-feature 範圍）

- 完全重構 health router（移除 60+ 處 raw SQL）→ 屬獨立技術債
- AuditLog 記錄所有 publicProcedure 呼叫 → Phase 2 Obs-01 處理

---

**Last Updated**: 2026-04-28
**Owner**: 待指派
**Reviewer**: Security Lead
