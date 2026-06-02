# 封存：Baseline 前的舊 Migration（FIX-141）

> 建立日期：2026-06-02

此資料夾保存 **squash baseline（FIX-141）之前** 的 7 個 Prisma migration，僅供歷史對照，**Prisma 不會掃描此目錄**。

## 背景

原 base schema 是用 `prisma db push` 建立、未捕捉成 migration，導致最早的 `20251126100000_add_currency` 直接 ALTER 不存在於 migration 歷史中的 `BudgetPool` 等表，使 `prisma migrate dev` 在 shadow DB 重放時失敗（P3006 / P1014）。

修復方式為 squash 成單一 `00000000000000_init`（代表 baseline 時 git HEAD 的 schema：32 模型、pre-FEAT-015），並將這 7 個舊 migration 封存於此。完整說明見 `claudedocs/4-changes/bug-fixes/FIX-141-prisma-migration-baseline.md`。

## 內容

| 檔案 | 說明 |
|------|------|
| `20251126100000_add_currency/` | FEAT-001 貨幣支援（非冪等） |
| `20251202100000_add_feat001_project_fields/` | Project 欄位擴展（冪等） |
| `20251202110000_add_postmvp_tables/` | Post-MVP 表格（冪等） |
| `20251208100000_feat007_om_expense_item/` | FEAT-007 OM Expense 重構（冪等） |
| `20251210100000_feat008_lastfy_actual_expense/` | FEAT-008 上年度支出欄位（冪等） |
| `20251214100000_feat011_permission_tables/` | FEAT-011 權限系統（非冪等） |
| `20260127100000_change038_project_budget_category/` | CHANGE-038 專案預算類別（非冪等） |
| `_prisma_migrations_backup.sql` | baseline 前 dev DB `_prisma_migrations` 的備份（dump，gitignored，僅本機保存） |

> ⚠️ 請勿把這些檔案移回 `migrations/`——會使 `migrate dev` 的 shadow 重放再次失敗。
