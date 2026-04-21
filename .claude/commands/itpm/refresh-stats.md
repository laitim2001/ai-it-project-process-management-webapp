---
description: "輕量模式更新 codebase-analyze SUMMARY.md 統計數字（不重跑完整分析）"
---

# /itpm:refresh-stats — 輕量統計刷新

快速重新計算 codebase 當前的關鍵統計數字（routers、models、pages、i18n keys 等），並更新 `docs/codebase-analyze/SUMMARY.md` 的 `machine-readable-stats` 區塊。

**適用時機**：
- 完成一個 Feature/Fix，想快速校正 SUMMARY.md 的數字
- `pnpm check:claude-sync` 頻繁警告，想確認是否 codebase 真的變了
- 不想花時間跑完整 `/itpm:refresh-codebase-analysis`（B.2）

**不適用時機**：
- 新增了整個 Router / Module → 應執行完整重跑（B.2）更新分析文件
- 架構重大變更 → 應執行完整重跑並手動更新文檔敘述

## 步驟

### 1. 執行輕量掃描與比對（乾跑模式）
```bash
pnpm refresh:stats
```

**輸出範例**：
```
📊 [refresh-stats] 掃描 codebase 中...

📋 實測 vs SUMMARY.md 聲稱：
──────────────────────────────────────────────────────────────────────────────
指標                            聲稱          實測          差異        狀態
──────────────────────────────────────────────────────────────────────────────
prisma_models                 32          33          +1 (3.1%) 🔵
api_procedures                200         208         +8 (4.0%) 🔵
pages                         60          62          +2 (3.3%) 🔵
...
```

狀態圖示：
- ✅ 一致
- 🔵 輕微漂移（< 10%）
- ⚠️ 顯著漂移（≥ 10%）
- 🆕 SUMMARY.md 尚未聲稱的新指標

### 2. 審視差異 → 決定是否 apply

**判斷原則**：
- 只有 🔵 輕微漂移 → 可直接 apply
- 有 ⚠️ 顯著漂移 → 先確認是否合理：
  - 真的多了 Router / Model / Page → apply，但也建議排程完整重跑
  - 看起來像腳本掃描範圍有誤 → 先 debug 腳本，不要 apply

### 3. 實際寫入 SUMMARY.md
```bash
pnpm refresh:stats:apply
```

此命令會：
- 更新 `docs/codebase-analyze/SUMMARY.md` 的 `machine-readable-stats` 區塊
- 更新 `last_refresh_date` 為今日
- **不會**更新 SUMMARY.md 的人類可讀表格（Codebase 規模概覽），也不會動各子 CLAUDE.md

### 4. 同步人類可讀區塊（手動）

如 apply 後差異顯著，請：
1. 手動更新 `docs/codebase-analyze/SUMMARY.md` 的 Codebase 規模概覽表格
2. 更新根 `CLAUDE.md` 的 `Project Metrics` 區塊
3. 依影響範圍更新對應子 CLAUDE.md（如新增 Router → `packages/api/src/routers/CLAUDE.md`）

執行 `pnpm check:claude-sync` 確認 CLAUDE.md 與新的 SUMMARY.md 一致。

### 5. 清除 drift 冷卻記錄（可選）

若想讓 Stop hook 立即重新偵測：
```bash
rm -f .claude/.drift-cooldown.json
```

## 掃描的指標清單

本輕量模式只掃描以下「可程式化計算」的指標：

| 類別 | 指標 | 計算方式 |
|------|------|---------|
| 源碼 | core_source_files, ts_files, tsx_files, js_files | 遞迴計算指定目錄中的副檔名 |
| API | api_routers, api_procedures, api_lines | 掃 `packages/api/src/routers/*.ts`，計 `.query(/.mutation(/.subscription(` |
| DB | prisma_models | grep `^model \w+` 於 `schema.prisma` |
| 路由 | route_modules, pages | 掃 `apps/web/src/app/[locale]/` 子目錄數與 `page.tsx` 檔案數 |
| 組件 | ui_components, business_components（含行數） | 掃 `components/ui/` 與 `components/` 的 `.tsx` |
| i18n | i18n_keys, i18n_namespaces | 遞迴 JSON leaf 計數 |
| 工具 | scripts, mermaid_diagrams, total_md_docs | 對應副檔名與 ` ```mermaid` 計數 |

**不會掃描的內容**（需完整重跑 B.2 才會更新）：
- 架構模式、技術債、安全問題
- 路由保護、認證流程
- 各模組的詳細分析文件（`02-api-layer/detail/*.md` 等）

## 注意事項

1. **腳本位置**: `scripts/refresh-stats.js`
2. **權威來源**: `docs/codebase-analyze/SUMMARY.md` 的 `machine-readable-stats` HTML 註解
3. **與 check-claude-md-sync 的關係**: refresh-stats 更新權威值；check-claude-md-sync 用權威值去校驗各 CLAUDE.md
4. **與完整重跑的關係**: 建議每 3 個月或 Epic 結束時執行一次 `/itpm:refresh-codebase-analysis`（B.2），因為輕量模式不會更新分析文檔的文字敘述
