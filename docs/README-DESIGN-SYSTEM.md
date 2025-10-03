# 🎨 設計系統文檔導航

> **快速找到您需要的資訊**

---

## 📚 文檔結構

### 🚀 快速開始

**我是新手，想快速上手：**
→ 閱讀 [設計系統快速參考指南](../DESIGN-SYSTEM-GUIDE.md) (10分鐘)

**我想看實際效果：**
→ 訪問 http://localhost:3000/dashboard-prototype

**我需要建立新元件：**
→ 參考 [元件開發範本](#元件開發範本)

---

## 📖 完整文檔列表

| 文檔 | 用途 | 閱讀時間 | 優先級 |
|------|------|----------|--------|
| [DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md) | 日常開發快速參考 | 10分鐘 | ⭐⭐⭐ 必讀 |
| [ui-ux-redesign.md](./ui-ux-redesign.md) | 完整設計系統規範 | 60分鐘 | ⭐⭐ 深入了解 |
| [design-system-migration-plan.md](./design-system-migration-plan.md) | 遷移策略和時間表 | 30分鐘 | ⭐⭐ 項目管理 |
| [prototype-guide.md](./prototype-guide.md) | 原型使用說明 | 5分鐘 | ⭐ 參考 |
| [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) | 實作進度總結 | 15分鐘 | ⭐ 進度追蹤 |

---

## 🎯 按角色導航

### 👨‍💻 前端開發者

**必讀：**
1. [DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md) - 快速參考
2. 查看 `/dashboard-prototype` 頁面代碼

**參考：**
- [ui-ux-redesign.md](./ui-ux-redesign.md) - 第3章：設計階段
- ESLint 配置：`.eslintrc.design-system.js`

### 🎨 UI/UX 設計師

**必讀：**
1. [ui-ux-redesign.md](./ui-ux-redesign.md) - 完整設計規範
2. 訪問原型頁面查看實際效果

**參考：**
- 顏色系統：[ui-ux-redesign.md](./ui-ux-redesign.md#311-顏色系統)
- 字體系統：[ui-ux-redesign.md](./ui-ux-redesign.md#312-字體系統)

### 📊 項目經理

**必讀：**
1. [IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md) - 進度總結
2. [design-system-migration-plan.md](./design-system-migration-plan.md) - 遷移計劃

**參考：**
- 時間表：[design-system-migration-plan.md](./design-system-migration-plan.md#71-整體時間表)
- 風險管理：[design-system-migration-plan.md](./design-system-migration-plan.md#8-風險與應對)

---

## 🔧 常見任務指南

### 建立新元件

1. 閱讀 [DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md#-元件開發範本)
2. 複製範本代碼
3. 參考 `button-new.tsx` 或 `card.tsx` 的實作
4. 確保通過設計系統檢查清單

### 遷移現有頁面

1. 查看 [design-system-migration-plan.md](./design-system-migration-plan.md#32-階段-2頁面遷移week-3-5)
2. 參考 `/dashboard-prototype/page.tsx` 的結構
3. 使用 `DashboardLayout-new` 包裹頁面
4. 替換所有舊元件為新元件

### 提交 PR

1. 填寫 `.github/pull_request_template.md` 中的設計系統檢查清單
2. 確保通過 ESLint 檢查
3. 附上桌面和移動端截圖

---

## 📦 元件庫狀態

### ✅ 已完成

- **UI 元件：** Button, Card, Badge
- **佈局元件：** Sidebar, TopBar, DashboardLayout
- **工具：** cn() 函數

### ⏳ 進行中

- Input, Select, Textarea, Label
- Table, Dialog, DropdownMenu
- Progress, Skeleton, Toast

### 📋 計劃中

- Avatar, Tabs, Pagination
- Breadcrumb, Tooltip, Popover

詳細進度：[IMPLEMENTATION-SUMMARY.md](./IMPLEMENTATION-SUMMARY.md#-統計數據)

---

## 🎨 設計資源

### 顏色參考

```typescript
// 主要顏色
bg-primary              // #3B82F6 (藍色)
bg-secondary            // 灰色
bg-destructive          // 紅色

// 狀態顏色
variant="success"       // 綠色
variant="warning"       // 黃色
variant="error"         // 紅色
variant="info"          // 藍色
```

### 間距參考

```typescript
p-6      // 24px - 卡片內邊距
gap-6    // 24px - 網格間距
space-y-8 // 32px - 大區塊間距
```

### 字體參考

```typescript
text-3xl font-bold       // 頁面標題
text-2xl font-semibold   // 區塊標題
text-base                // 正文
text-sm                  // 小文字
```

完整規範：[DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md)

---

## 🔗 快速連結

### 在線資源

- **原型頁面：** http://localhost:3000/dashboard-prototype
- **Tailwind 文檔：** https://tailwindcss.com
- **CVA 文檔：** https://cva.style
- **Lucide Icons：** https://lucide.dev

### 項目文件

- **元件代碼：** `apps/web/src/components/`
- **頁面代碼：** `apps/web/src/app/`
- **樣式配置：** `apps/web/tailwind.config.ts`
- **全局樣式：** `apps/web/src/app/globals.css`

---

## ❓ 需要幫助？

### 遇到問題時

1. **查閱文檔：** 先查看本 README 找到相關文檔
2. **查看範例：** 參考 `/dashboard-prototype` 的實作
3. **檢查規範：** 閱讀 [DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md)
4. **尋求協助：** 在 Slack #design-system 頻道提問

### 常見問題

| 問題 | 解答文檔 |
|------|----------|
| 應該使用哪個按鈕元件？ | [DESIGN-SYSTEM-GUIDE.md FAQ](../DESIGN-SYSTEM-GUIDE.md#-常見問題) |
| 如何選擇顏色？ | [DESIGN-SYSTEM-GUIDE.md 顏色系統](../DESIGN-SYSTEM-GUIDE.md#-顏色系統) |
| 什麼時候用 cn()？ | [DESIGN-SYSTEM-GUIDE.md 元件使用](../DESIGN-SYSTEM-GUIDE.md#-元件使用) |
| 如何確保響應式？ | [DESIGN-SYSTEM-GUIDE.md 響應式](../DESIGN-SYSTEM-GUIDE.md#-響應式斷點) |

---

## 📝 文檔維護

- **負責人：** Development Team
- **更新頻率：** 每週五
- **版本：** 1.0
- **最後更新：** 2025-10-03

---

## 🎯 下一步

**立即行動：**
1. ✅ 閱讀 [DESIGN-SYSTEM-GUIDE.md](../DESIGN-SYSTEM-GUIDE.md)
2. ✅ 查看 `/dashboard-prototype` 原型
3. ✅ 開始建立或遷移頁面

**本週目標：**
- 完成 Input, Select, Label 元件
- 遷移 Dashboard 頁面
- 團隊成員熟悉新規範

---

**記住：一致性比完美更重要** ✨

有問題隨時查閱文檔或尋求協助！
