# UI Design System - shadcn/ui 組件層

> **Last Updated**: 2026-04-21
> **Total Components**: **43 個 .tsx 檔案**（~7,387 行）
> **技術基礎**: shadcn/ui + Radix UI + Tailwind CSS
> **設計系統版本**: Post-MVP Design System Migration
> **深度分析參考**: `docs/codebase-analyze/04-components/detail/ui-components.md`

## 📋 目錄用途

此目錄包含專案的 **設計系統組件（Design System Components）**，基於 [shadcn/ui](https://ui.shadcn.com/) 建構。這些組件是**原子級、無業務邏輯**的 UI 元素，為整個應用提供統一的視覺體驗和無障礙設計。

**核心原則**：
1. **無業務邏輯** - 所有組件必須是純展示性的
2. **高度可配置** - 通過 props 控制外觀和行為
3. **無障礙優先** - 完整的 ARIA 屬性支援
4. **主題感知** - 支援 Light/Dark/System 三種主題模式

## 🏗️ 完整目錄結構

```
ui/                              # 共 41+ 個 .tsx 檔案
│
├── 表單控件組件 (14 個)
│   ├── button.tsx              # 按鈕（6 變體 × 4 尺寸）
│   ├── input.tsx               # 文字輸入框
│   ├── textarea.tsx            # 多行文字框
│   ├── select.tsx              # 原生下拉選單
│   ├── combobox.tsx            # 可搜尋下拉選單（FIX-093 重寫）
│   ├── command.tsx             # 命令選單（搜尋框基礎）
│   ├── checkbox.tsx            # 複選框
│   ├── radio-group.tsx         # 單選按鈕組
│   ├── switch.tsx              # 開關按鈕
│   ├── slider.tsx              # 滑桿
│   ├── form.tsx                # 表單包裝器（react-hook-form 整合）
│   ├── label.tsx               # 表單標籤
│   ├── password-input.tsx      # 密碼輸入框（CHANGE-032）
│   └── password-strength-indicator.tsx  # 密碼強度指示器（CHANGE-032）
│
├── 資料顯示組件 (10 個)
│   ├── table.tsx               # 資料表格（8 個子組件）
│   ├── card.tsx                # 卡片容器
│   ├── badge.tsx               # 徽章標籤
│   ├── avatar.tsx              # 用戶頭像
│   ├── separator.tsx           # 分隔線
│   ├── skeleton.tsx            # 載入骨架
│   ├── loading-skeleton.tsx    # 載入骨架（擴展版）
│   ├── progress.tsx            # 進度條
│   ├── tabs.tsx                # 標籤頁
│   └── accordion.tsx           # 手風琴面板
│
├── 導航與回饋組件 (10 個)
│   ├── breadcrumb.tsx          # 麵包屑導航
│   ├── pagination.tsx          # 分頁控制
│   ├── dropdown-menu.tsx       # 下拉選單
│   ├── context-menu.tsx        # 右鍵選單
│   ├── sheet.tsx               # 側邊抽屜
│   ├── dialog.tsx              # 對話框
│   ├── alert-dialog.tsx        # 警告對話框
│   ├── popover.tsx             # 彈出框
│   ├── tooltip.tsx             # 工具提示
│   └── alert.tsx               # 警告框
│
├── Toast 通知系統 (3 個)
│   ├── toast.tsx               # Toast 單個通知組件
│   ├── toaster.tsx             # Toast 渲染容器
│   └── use-toast.tsx           # Toast Hook（Pub/Sub 模式）
│
└── 載入特效系統 (4 個) - FEAT-012
    └── loading/
        ├── index.ts            # 統一導出入口
        ├── Spinner.tsx         # 旋轉載入指示器（5 尺寸 × 4 顏色）
        ├── LoadingButton.tsx   # 按鈕載入狀態組件
        ├── LoadingOverlay.tsx  # 區域載入遮罩
        └── GlobalProgress.tsx  # 頂部導航進度條（NProgress 風格）
```

## 🎨 組件分類詳解

### 1. 表單控件組件

| 組件 | 用途 | 關鍵特性 |
|------|------|----------|
| `button.tsx` | 所有按鈕交互 | 6 變體 × 4 尺寸、asChild 模式、CVA 管理 |
| `input.tsx` | 單行文字輸入 | forwardRef、主題樣式 |
| `textarea.tsx` | 多行文字輸入 | 自動調整高度 |
| `select.tsx` | 原生下拉選單 | Radix UI Select |
| `combobox.tsx` | 可搜尋下拉 | useMemo 優化、UUID 值支援 |
| `checkbox.tsx` | 複選框 | Radix UI Checkbox |
| `form.tsx` | 表單管理 | react-hook-form + zod 整合 |
| `password-input.tsx` | 密碼輸入 | 顯示/隱藏切換 |

**Button 變體系統**：
```typescript
// 6 種視覺變體
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"

// 4 種尺寸變體
size: "default" | "sm" | "lg" | "icon"

// 使用範例
<Button variant="destructive" size="sm">刪除</Button>
<Button variant="outline" size="lg">取消</Button>
<Button variant="ghost" size="icon"><IconSettings /></Button>

// asChild 模式（將樣式應用到子組件）
<Button asChild>
  <Link href="/projects">前往專案</Link>
</Button>
```

### 2. 資料顯示組件

| 組件 | 用途 | 子組件 |
|------|------|--------|
| `table.tsx` | 資料表格 | Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption |
| `card.tsx` | 卡片容器 | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| `badge.tsx` | 徽章標籤 | 多種變體（default, secondary, destructive, outline） |
| `tabs.tsx` | 標籤頁 | Tabs, TabsList, TabsTrigger, TabsContent |
| `accordion.tsx` | 手風琴 | Accordion, AccordionItem, AccordionTrigger, AccordionContent |

**Table 使用模式**：
```typescript
<Table>
  <TableCaption>專案列表</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>專案名稱</TableHead>
      <TableHead>狀態</TableHead>
      <TableHead className="text-right">預算</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {projects.map((project) => (
      <TableRow key={project.id}>
        <TableCell>{project.name}</TableCell>
        <TableCell>{project.status}</TableCell>
        <TableCell className="text-right">{formatCurrency(project.budget)}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 3. Toast 通知系統

**架構設計**：基於 Pub/Sub 模式的全域狀態管理，不依賴 React Context。

| 組件/Hook | 用途 |
|-----------|------|
| `use-toast.tsx` | Toast 狀態管理 Hook（核心） |
| `toaster.tsx` | Toast 渲染容器（放在 layout 中） |
| `toast.tsx` | Toast 單個通知的視覺組件 |

**4 種變體**：
```typescript
// Toast 變體
variant: "default" | "destructive" | "success" | "warning"

// 使用範例
const { toast } = useToast();

// 成功通知
toast({
  title: "儲存成功",
  description: "專案已成功更新",
  variant: "success",
});

// 錯誤通知
toast({
  title: "操作失敗",
  description: error.message,
  variant: "destructive",
});

// 警告通知
toast({
  title: "注意",
  description: "此操作無法撤銷",
  variant: "warning",
});
```

**特性**：
- 自動過期（預設 5 秒）
- 最多同時顯示 5 個
- 支援操作按鈕（action）
- 退出動畫（300ms）

### 4. 載入特效系統（FEAT-012）

**統一的載入狀態處理方案**，提供一致的視覺體驗。

| 組件 | 用途 | 特性 |
|------|------|------|
| `Spinner` | 通用載入指示器 | 5 尺寸 × 4 顏色、無障礙 |
| `LoadingButton` | 按鈕載入狀態 | 整合 Button、自動禁用 |
| `LoadingOverlay` | 區域載入遮罩 | 覆蓋內容、背景模糊 |
| `GlobalProgress` | 頂部進度條 | NProgress 風格、路由切換 |

**Spinner 尺寸和顏色**：
```typescript
// 5 種尺寸
size: "xs" | "sm" | "md" | "lg" | "xl"
// xs=12px, sm=16px, md=24px, lg=32px, xl=48px

// 4 種顏色
color: "primary" | "secondary" | "white" | "muted"

// 使用範例
<Spinner size="lg" color="primary" />
<Spinner size="sm" color="white" srLabel="載入中" />
```

**LoadingButton 使用模式**：
```typescript
<LoadingButton
  isLoading={mutation.isLoading}
  loadingText={t('saving')}
  variant="default"
>
  {t('save')}
</LoadingButton>
```

**LoadingOverlay 使用模式**：
```typescript
<LoadingOverlay isLoading={isLoading} text="正在載入資料...">
  <Card>
    {/* 內容區域 */}
  </Card>
</LoadingOverlay>
```

### 5. 密碼組件（CHANGE-032）

| 組件 | 用途 |
|------|------|
| `password-input.tsx` | 密碼輸入框（含顯示/隱藏切換） |
| `password-strength-indicator.tsx` | 密碼強度視覺指示器 |

**使用範例**：
```typescript
import { PasswordInput } from '@/components/ui/password-input';
import { PasswordStrengthIndicator } from '@/components/ui/password-strength-indicator';

<PasswordInput
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="請輸入密碼"
/>
<PasswordStrengthIndicator password={password} />
```

## 📝 技術模式與約定

### 組件結構標準

所有 UI 組件遵循以下結構：

```typescript
/**
 * @fileoverview [Component Name] - [簡短描述]
 * @component [ComponentName]
 * @features - 列出主要功能點
 * @example - 使用範例
 * @dependencies - 依賴套件
 * @related - 相關檔案
 * @since [版本/功能名稱]
 * @lastModified YYYY-MM-DD
 */

import * as React from "react";
import { cn } from "@/lib/utils";

// 使用 forwardRef 支援 ref 轉發
const ComponentName = React.forwardRef<
  HTMLElementType,
  React.HTMLAttributes<HTMLElementType>
>(({ className, ...props }, ref) => (
  <element
    ref={ref}
    className={cn("base-styles", className)}
    {...props}
  />
));
ComponentName.displayName = "ComponentName";

export { ComponentName };
```

### class-variance-authority (CVA) 模式

用於管理組件的多變體樣式：

```typescript
import { cva, type VariantProps } from "class-variance-authority";

const componentVariants = cva(
  // 基礎樣式
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input bg-background",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ComponentProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof componentVariants> {}
```

### Form 整合模式（react-hook-form + zod）

```typescript
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

// 1. 定義 Schema
const formSchema = z.object({
  name: z.string().min(2, "名稱至少 2 個字符"),
  email: z.string().email("無效的電子郵件"),
});

// 2. 建立表單
const form = useForm<z.infer<typeof formSchema>>({
  resolver: zodResolver(formSchema),
  defaultValues: { name: "", email: "" },
});

// 3. 使用 FormField
<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)}>
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>名稱</FormLabel>
          <FormControl>
            <Input placeholder="請輸入名稱" {...field} />
          </FormControl>
          <FormDescription>這是您的公開顯示名稱</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  </form>
</Form>
```

### Combobox 使用模式（FIX-093 重寫版）

```typescript
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";

// 選項格式
const options: ComboboxOption[] = [
  { value: "uuid-1", label: "選項一" },
  { value: "uuid-2", label: "選項二" },
];

// 使用
<Combobox
  options={options}
  value={selectedValue}
  onChange={setSelectedValue}
  placeholder="請選擇..."
  searchPlaceholder="搜尋..."
  emptyText="找不到結果"
  disabled={isLoading}
/>

// 特性：
// - 支援 UUID 值（FIX-093 修復）
// - 客戶端過濾（useMemo 優化）
// - 鍵盤導航（上下鍵、Enter、Esc）
// - 清除選取（再次點擊相同選項）
```

### cn() 工具函數

用於合併 Tailwind CSS 類名，處理條件樣式：

```typescript
import { cn } from "@/lib/utils";

// 基本用法
<div className={cn("base-class", className)} />

// 條件樣式
<div className={cn(
  "base-class",
  isActive && "active-class",
  isError && "error-class",
  className
)} />
```

## ⚠️ 重要約定

### 必須遵守

1. **不可修改 ui/ 組件的核心邏輯**
   - 這些是 shadcn/ui 標準組件
   - 只能通過 `className` prop 調整樣式
   - 如需新功能，創建包裝組件

2. **使用 cn() 合併類名**
   ```typescript
   // ✅ 正確
   <Button className={cn("custom-class", className)} />

   // ❌ 錯誤
   <Button className={"custom-class " + className} />
   ```

3. **所有組件支援 Light/Dark 主題**
   - 使用 CSS 變數（`--primary`, `--background` 等）
   - 不要硬編碼顏色值

4. **ARIA 屬性不可刪除**
   - 保持無障礙設計完整性
   - 確保 `aria-label`, `aria-expanded`, `aria-describedby` 等屬性

5. **forwardRef 必須保留**
   - 所有組件必須支援 ref 轉發
   - 確保 `displayName` 設定正確

### 推薦做法

- 使用 Radix UI 原語作為基礎
- 使用 CVA 管理多變體組件
- 使用 `React.useId()` 生成無障礙 ID
- 使用 `lucide-react` 作為圖示庫

### 禁止事項

- ❌ 在 ui/ 組件中添加業務邏輯
- ❌ 使用硬編碼的顏色值（如 `#ff0000`）
- ❌ 刪除或修改 ARIA 屬性
- ❌ 移除 forwardRef 支援
- ❌ 直接修改 shadcn/ui 標準組件結構

## 🔗 相關資源

### 代碼規範
- `.claude/rules/ui-design-system.md` - UI 設計系統詳細規範
- `.claude/rules/components.md` - React 組件通用規範
- `.claude/rules/typescript.md` - TypeScript 約定

### 相關檔案
- `apps/web/src/lib/utils.ts` - cn() 工具函數定義
- `apps/web/tailwind.config.ts` - Tailwind CSS 配置（CSS 變數定義）
- `apps/web/src/app/globals.css` - 全域樣式和 CSS 變數

### 外部文檔
- [shadcn/ui 官方文檔](https://ui.shadcn.com/)
- [Radix UI 文檔](https://www.radix-ui.com/)
- [Tailwind CSS 文檔](https://tailwindcss.com/)
- [class-variance-authority 文檔](https://cva.style/docs)

## 📊 功能版本追蹤

| 功能 | 相關組件 | 版本 | 說明 |
|------|----------|------|------|
| Design System Migration | 全部 37 個基礎組件 | Post-MVP | shadcn/ui 遷移 |
| FIX-093 | combobox.tsx | 2025-11 | 移除 cmdk，修復 UUID 選取 |
| FEAT-012 | loading/* (4 個) | 2025-12 | 統一載入特效系統 |
| CHANGE-032 | password-input, password-strength-indicator | 2025-12 | 密碼管理組件 |

## 📁 導入路徑

```typescript
// 單一組件導入
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

// 載入組件導入（推薦）
import { Spinner, LoadingButton, LoadingOverlay } from "@/components/ui/loading";

// 表格組件（多個子組件）
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

// 卡片組件（多個子組件）
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
```
