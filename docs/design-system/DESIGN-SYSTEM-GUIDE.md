# 設計系統快速參考指南

> **快速開始指南** - 確保所有開發保持一致風格

---

## 🎨 核心原則

1. **始終使用新設計系統元件**（位於 `components/ui/`）
2. **使用 CSS 變數**而非硬編碼顏色
3. **使用 cn() 函數**合併 className
4. **遵循 4px 網格系統**
5. **所有元件使用 forwardRef**

---

## 📦 元件使用

### ✅ 正確做法

```typescript
// 1. 使用新元件
import { Button } from "@/components/ui/button-new"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// 2. 使用 CSS 變數
<Button className="bg-primary text-primary-foreground">
  按鈕
</Button>

// 3. 使用 cn() 合併類別
import { cn } from "@/lib/utils"

<div className={cn(
  "base-class",
  isActive && "active-class",
  className
)} />
```

### ❌ 錯誤做法

```typescript
// ❌ 使用舊元件
import { Button } from "@/components/ui/Button"

// ❌ 硬編碼顏色
<div className="bg-blue-600 text-white" />

// ❌ 字串拼接
<div className={`base ${isActive ? 'active' : ''}`} />
```

---

## 🎨 顏色系統

### 語義化顏色（優先使用）

```typescript
bg-primary              // 主色 (#3B82F6)
bg-secondary            // 次要色
bg-destructive          // 危險/刪除
bg-muted                // 靜音/禁用
bg-accent               // 強調

text-foreground         // 主要文字
text-muted-foreground   // 次要文字

border                  // 邊框
ring                    // 聚焦環
```

### 狀態顏色

```typescript
<Badge variant="success">成功</Badge>   // 綠色
<Badge variant="warning">警告</Badge>   // 黃色
<Badge variant="error">錯誤</Badge>     // 紅色
<Badge variant="info">資訊</Badge>      // 藍色
```

---

## 📏 間距系統（4px 網格）

```typescript
// 內邊距
p-6          // 卡片內邊距 (24px)
p-4          // 小元件內邊距 (16px)
px-3 py-2    // 按鈕內邊距

// 元件間距
space-y-8    // 大區塊 (32px)
space-y-6    // 中區塊 (24px)
space-y-4    // 小區塊 (16px)
gap-6        // 網格間距 (24px)

// 頁面邊距
px-4 sm:px-6 lg:px-8  // 響應式
```

---

## 🔤 字體系統

```typescript
// 標題
text-3xl font-bold       // 頁面主標題 (30px)
text-2xl font-semibold   // 區塊標題 (24px)
text-xl font-semibold    // 卡片標題 (20px)

// 正文
text-base                // 正文 (16px)
text-sm                  // 小正文 (14px)
text-xs                  // 標籤 (12px)

// 顏色
text-gray-900            // 主要文字
text-gray-600            // 次要標題
text-gray-500            // 輔助文字
```

---

## 📐 佈局模式

### 頁面結構

```typescript
import { DashboardLayout } from "@/components/layout/DashboardLayout-new"

export default function Page() {
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold">標題</h1>
          <p className="text-gray-500 mt-1">描述</p>
        </div>

        {/* Content */}
      </div>
    </DashboardLayout>
  )
}
```

### 統計卡片網格

```typescript
<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
  {/* 4 個統計卡片 */}
</div>
```

### 2:1 內容佈局

```typescript
<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
  <div className="lg:col-span-2">
    {/* 主要內容 (2/3) */}
  </div>
  <div>
    {/* 側邊內容 (1/3) */}
  </div>
</div>
```

### 表單雙欄

```typescript
<div className="grid gap-4 md:grid-cols-2">
  {/* 表單欄位 */}
</div>
```

---

## 🧩 元件開發範本

```typescript
import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

// 1. 定義變體
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        secondary: "secondary-classes",
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

// 2. Props 介面
export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {}

// 3. forwardRef
const Component = React.forwardRef<HTMLDivElement, ComponentProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(componentVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)

// 4. displayName
Component.displayName = "Component"

// 5. 匯出
export { Component, componentVariants }
```

---

## 📱 響應式斷點

```typescript
sm: '640px'   // 手機橫屏
md: '768px'   // 平板
lg: '1024px'  // 桌面（側邊欄出現）
xl: '1280px'  // 大桌面
2xl: '1536px' // 超大螢幕
```

### 使用範例

```typescript
// 隱藏/顯示
<div className="hidden lg:block">桌面顯示</div>
<div className="lg:hidden">移動端顯示</div>

// 響應式網格
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">

// 響應式間距
<div className="px-4 sm:px-6 lg:px-8">
```

---

## ✅ 開發檢查清單

### 建立新元件時

- [ ] 使用 forwardRef
- [ ] 設定 displayName
- [ ] 使用 CVA 管理變體
- [ ] 使用 cn() 合併類別
- [ ] 完整的 TypeScript 類型
- [ ] 支援所有必要變體
- [ ] 實作 hover/focus/active 狀態

### 建立新頁面時

- [ ] 使用 DashboardLayout-new
- [ ] 使用新設計系統元件
- [ ] 遵循佈局模式
- [ ] 遵循間距規範
- [ ] 響應式測試
- [ ] 無障礙性測試

### 提交代碼前

- [ ] TypeScript 無錯誤
- [ ] ESLint 無警告
- [ ] Prettier 格式化
- [ ] 移除 console.log
- [ ] 移除註解代碼
- [ ] 測試通過

---

## 🚫 禁止事項

```typescript
// ❌ 硬編碼顏色
className="bg-blue-600"

// ❌ 內聯樣式
style={{ color: 'red' }}

// ❌ 使用舊元件
import { Button } from "@/components/ui/Button"

// ❌ 字串拼接類別
className={`base ${condition ? 'active' : ''}`}

// ❌ 任意值（除非絕對必要）
className="w-[137px]"

// ❌ 缺少類型
const Component = ({ props }: any) => {}
```

---

## 📚 參考資源

- **完整設計系統文檔：** `docs/ui-ux-redesign.md`
- **遷移計劃：** `docs/design-system-migration-plan.md`
- **原型範例：** `/dashboard-prototype`
- **Tailwind 文檔：** https://tailwindcss.com
- **CVA 文檔：** https://cva.style

---

## 🆘 常見問題

### Q: 我應該使用哪個 Button 元件？

**A:** 使用 `@/components/ui/button-new`，舊的 `Button.tsx` 將被逐步淘汰。

### Q: 如何選擇合適的顏色？

**A:** 優先使用語義化變數（`bg-primary`、`bg-destructive`），而非具體顏色（`bg-blue-600`）。

### Q: 何時使用 cn() 函數？

**A:** 任何時候需要合併或條件性應用 className 時都應該使用。

### Q: 如何確保響應式正確？

**A:** 遵循移動優先原則，使用標準斷點（md:, lg:），並在不同設備上測試。

### Q: 舊頁面要立即更新嗎？

**A:** 不需要，我們採用漸進式遷移。新功能使用新設計，舊頁面逐步更新。

---

**最後更新：** 2025-10-03
**維護者：** Development Team

記住：**一致性比完美更重要** ✨
