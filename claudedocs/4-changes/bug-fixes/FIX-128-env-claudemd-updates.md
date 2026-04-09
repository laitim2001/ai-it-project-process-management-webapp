# FIX-128: .env.example 與 CLAUDE.md 不一致修正

## 日期
2026-04-09

## 問題描述
多項文檔與配置不一致問題，包括環境變數名稱不匹配、過時的數據統計、以及 Azure AD 命名錯誤。

---

## 修正內容

### 1. `.env.example` 修正

| 項目 | 修正前 | 修正後 | 原因 |
|------|--------|--------|------|
| DATABASE_URL 端口 | `localhost:5432` | `localhost:5434` | docker-compose 映射 5432→5434 |
| TEST_DATABASE_URL 端口 | `localhost:5432` | `localhost:5434` | 同上 |
| SMTP 密碼變數名 | `SMTP_PASSWORD` | `SMTP_PASS` | 代碼 (`email.ts:122`) 使用 `process.env.SMTP_PASS` |
| REDIS_URL 端口 | `localhost:6379` | `localhost:6381` | docker-compose 映射 6379→6381 |

### 2. `CLAUDE.md` 修正

| 項目 | 修正前 | 修正後 | 來源 |
|------|--------|--------|------|
| Total Code 行數 | ~35,000+ | ~73,500 | R7-D 分析結果 |
| Prisma Models 數量 | 27 | 32 | 實際 schema.prisma 統計 |
| API Routers 數量 | 16 | 17 | 新增 permission.ts (FEAT-011) |
| CHANGE 計數 | CHANGE-001~036 (36 項) | CHANGE-001~041 (41 項) | R5-C 分析結果 |
| State 管理 | Zustand / Jotai | React Query (tRPC), useState, React Hook Form | 實際使用情況 |
| Testing 描述 | Jest + RTL, Playwright | Playwright (E2E); unit tests not yet implemented | 實際狀態 |
| Azure AD 命名 | Azure AD B2C (全文多處) | Azure AD (Entra ID) | 實際使用標準 Azure AD，非 B2C |
| SMTP 變數名 | SMTP_PASSWORD | SMTP_PASS | 與代碼一致 |
| Epic Completion | FEAT-007/008 + CHANGE-004~011 | FEAT-007~012 + CHANGE-001~041 | 最新進度 |

### 3. `apps/web/src/auth.config.ts` 修正

| 項目 | 修正前 | 修正後 |
|------|--------|--------|
| @since 註釋 | `Epic 1 - Azure AD B2C Authentication` | `Epic 1 - Azure AD (Entra ID) Authentication` |

---

## 修改的檔案
- `.env.example` — 端口修正 (DATABASE_URL, TEST_DATABASE_URL, REDIS_URL)、SMTP_PASS 變數名
- `CLAUDE.md` — 數據統計更新、Azure AD 命名修正、State/Testing 描述修正
- `apps/web/src/auth.config.ts` — @since 註釋修正

## 驗證方式
- 對照 `docker-compose.yml` 確認端口映射 (5434, 6381)
- 對照 `packages/api/src/lib/email.ts:122` 確認 `SMTP_PASS`
- 對照 `packages/db/prisma/schema.prisma` 確認 32 個 models
- 對照 `packages/api/src/routers/` 目錄確認 17 個 router 檔案
- 對照 `packages/auth/src/index.ts` 確認使用 `AzureADProvider`（非 B2C）
