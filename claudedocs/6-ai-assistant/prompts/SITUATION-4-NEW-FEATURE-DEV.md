# 🆕 情況4: 新功能開發

> **使用時機**: 對話進行中,正在開發全新功能
> **目標**: 系統化開發,符合架構標準
> **適用場景**: Epic Story 實施, 新模組開發

---

## 📋 Prompt 模板

```markdown
我正在開發新功能: [功能名稱]

根據: [Epic X Story X.X / 用戶需求 / 設計文檔]

請幫我:

1. 確認規劃文檔
   - 閱讀 claudedocs/1-planning/epics/epic-X/[相關文檔]
   - 閱讀 claudedocs/2-sprints/epic-X/sprint-X/[相關文檔]
   - 確認驗收標準

2. 系統化開發
   - 後端: 數據模型 → API → 測試
   - 前端: 組件 → 頁面 → 整合
   - 使用 TodoWrite 追蹤進度

3. 遵循最佳實踐
   - 參考現有實現模式
   - 使用 shadcn/ui 組件
   - I18N 從一開始實施
   - 撰寫單元測試

4. 記錄開發過程
   - 更新每日/每週進度
   - 記錄技術決策
   - 更新 Sprint checklist

請用中文溝通。
```

---

## 🤖 AI 執行流程

### Phase 1: 後端開發
```bash
# 1. 數據模型
Edit: packages/db/prisma/schema.prisma
Bash: pnpm db:generate
Bash: pnpm db:migrate

# 2. API Router
Write: packages/api/src/routers/新功能.ts
Edit: packages/api/src/root.ts (合併 router)

# 3. API 測試
Write: packages/api/src/routers/新功能.test.ts
Bash: pnpm test --filter=api

# 4. 更新進度
TodoWrite: 標記後端任務完成
```

### Phase 2: 前端開發
```bash
# 1. 組件開發
Write: apps/web/src/components/新功能/NewComponent.tsx

# 2. 頁面開發
Write: apps/web/src/app/[locale]/新功能/page.tsx

# 3. I18N
Edit: apps/web/src/messages/zh-TW.json
Edit: apps/web/src/messages/en.json

# 4. 測試
Bash: pnpm dev (手動測試)

# 5. 更新進度
TodoWrite: 標記前端任務完成
```

### Phase 3: 整合測試
```bash
# 1. E2E 測試
Write: tests/e2e/新功能.spec.ts

# 2. 運行測試
Bash: pnpm test:e2e

# 3. 記錄測試結果
Write: claudedocs/5-status/testing/e2e/E2E-新功能-REPORT.md
```

---

## 📐 開發標準 Checklist

### 後端標準
- [ ] Prisma 模型遵循命名規範
- [ ] API 使用 Zod 驗證
- [ ] 使用 protectedProcedure 保護路由
- [ ] 錯誤處理完整
- [ ] 單元測試覆蓋率 >80%

### 前端標準
- [ ] 使用 TypeScript 嚴格模式
- [ ] 使用 shadcn/ui 組件
- [ ] 實施 I18N (繁中 + 英文)
- [ ] 響應式設計 (mobile-first)
- [ ] 無障礙性 (WCAG 2.1 AA)
- [ ] Loading 和 Error 狀態處理

### 代碼品質
- [ ] ESLint 無錯誤
- [ ] TypeScript 無錯誤
- [ ] 格式化 (Prettier)
- [ ] 註解完整 (複雜邏輯)

---

## 🔗 相關文檔
- [情況3: 舊功能進階/修正](./SITUATION-3-FEATURE-ENHANCEMENT.md)
- [情況5: 保存進度](./SITUATION-5-SAVE-PROGRESS.md)

**最後更新**: 2025-11-08
