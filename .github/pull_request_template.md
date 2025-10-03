## 📝 變更摘要 (Summary)
<!-- 簡要描述這個 PR 做了什麼 (3-5 句話) -->



## 🎯 相關 Issue
<!-- 關聯的 Issue, 使用 Closes #123, Fixes #456, Refs #789 -->
Closes #

## 🛠️ 變更類型 (Type of Change)
<!-- 請勾選適用的項目 -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📝 Documentation update
- [ ] 🎨 Code refactoring (no functional changes, no API changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test updates
- [ ] 🔧 Chore (dependencies, CI/CD, tooling)

## 📋 測試 (Testing)
<!-- 描述你如何測試這些變更, 包括測試步驟和結果 -->

### 測試步驟:
1.
2.
3.

### 測試環境:
- [ ] Local Development (本地開發)
- [ ] Docker Environment (Docker 環境)
- [ ] Staging (預發布環境)

### 測試結果:
- [ ] All existing tests pass (`pnpm test`)
- [ ] New tests added (if applicable)
- [ ] Manual testing completed

## 📸 截圖或影片 (Screenshots / Videos)
<!-- 如有 UI 變更, 請附上截圖或錄製操作影片 -->

**Before:**


**After:**


## 💥 Breaking Changes
<!-- 如果這是一個 Breaking Change, 請詳細說明影響範圍和遷移指南 -->

**影響範圍:**


**遷移指南:**


## 📊 效能影響 (Performance Impact)
<!-- 如有效能相關的變更, 請說明 -->

- [ ] 無效能影響
- [ ] 效能提升 (請說明)
- [ ] 可能有效能影響 (已評估並認為可接受)

**說明:**


## 🔒 安全性考量 (Security Considerations)
<!-- 如有安全性相關的變更, 請說明 -->

- [ ] 無安全性影響
- [ ] 已檢查 - 無新增的安全風險
- [ ] 修復了安全性問題

**說明:**


## ✅ Checklist
<!-- 請確認以下所有項目都已完成 -->

### 程式碼品質
- [ ] 我的程式碼遵循專案的程式碼規範 (CONTRIBUTING.md)
- [ ] 我已執行 `pnpm lint` 且無錯誤
- [ ] 我已執行 `pnpm typecheck` 且無錯誤
- [ ] 我已進行自我審查 (Self-review)
- [ ] 我已新增對應的註解 (特別是複雜的邏輯)

### 🎨 設計系統檢查 (如包含 UI 變更)
- [ ] 使用新設計系統元件 (`button-new`, `card`, `badge` 等)
- [ ] 使用 CSS 變數而非硬編碼顏色 (`bg-primary` 而非 `bg-blue-600`)
- [ ] 使用 `cn()` 函數合併 className
- [ ] 遵循 4px 網格間距系統
- [ ] 所有新元件使用 `forwardRef` 和 `displayName`
- [ ] 移動端 (< 768px) 測試通過
- [ ] 桌面端 (≥ 1024px) 測試通過
- [ ] 互動元素可鍵盤訪問
- [ ] 參考 [設計系統指南](../DESIGN-SYSTEM-GUIDE.md)

### 測試
- [ ] 我已新增測試證明修復有效或功能正常運作
- [ ] 新舊的單元測試在本地都通過
- [ ] 我已在本地手動測試核心功能

### 文檔
- [ ] 我已更新相關文檔 (如適用)
- [ ] 我已更新 API 文檔 (如新增或修改 API)
- [ ] 我已更新 README.md (如有重要變更)

### 資料庫
- [ ] 我已創建必要的 Prisma migration (如有 schema 變更)
- [ ] Migration 已在本地測試成功
- [ ] 我已更新 seed 資料 (如適用)

### Commit 與分支
- [ ] 我的 Commit 訊息遵循 Conventional Commits 規範
- [ ] 我的分支名稱遵循專案規範 (feature/*, fix/*, etc.)
- [ ] 我已從最新的 `main` 分支創建此分支

## 🔗 其他資訊 (Additional Context)
<!-- 任何其他相關資訊, 例如: -->
<!-- - 設計決策的考量 -->
<!-- - 替代方案的評估 -->
<!-- - 已知的限制或待辦事項 -->
<!-- - 相關的 PR 或文檔連結 -->


## 📝 Review Notes
<!-- 給 Reviewer 的提示: 特別需要關注的部分或建議的審查順序 -->


---

**Reviewers**: @mention-relevant-team-members
**Labels**: <!-- 建議的標籤, 例如: enhancement, bug, documentation -->
