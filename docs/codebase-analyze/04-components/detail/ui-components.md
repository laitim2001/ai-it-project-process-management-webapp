# UI 組件庫完整清冊

> **分析日期**: 2026-04-09
> **目錄路徑**: `apps/web/src/components/ui/`
> **檔案總數**: 43 個檔案 (38 個根層級 + 5 個 loading/ 子目錄)
> **總行數**: 7,387 行 (根層級 6,850 + loading/ 子目錄 537)
> **技術基礎**: shadcn/ui + Radix UI + Tailwind CSS + class-variance-authority

---

## 總覽表

| # | 組件名稱 | 檔案名 | 行數 | 基礎庫 | 變體數 | 匯出數 |
|---|---------|--------|------|--------|-------|-------|
| 1 | Accordion | accordion.tsx | 241 | Radix UI | 0 | 4 |
| 2 | Alert | alert.tsx | 163 | CVA | 4 | 3 |
| 3 | AlertDialog | alert-dialog.tsx | 211 | Radix UI | 0 | 11 |
| 4 | Avatar | avatar.tsx | 150 | CVA | 4 (size) | 4 |
| 5 | Badge | badge.tsx | 92 | CVA | 8 | 2 |
| 6 | Breadcrumb | breadcrumb.tsx | 191 | 自訂 (React) | 0 | 7 |
| 7 | Button | button.tsx | 114 | CVA + Radix Slot | 6+4 | 2 |
| 8 | Card | card.tsx | 143 | 自訂 (React) | 0 | 6 |
| 9 | Checkbox | checkbox.tsx | 100 | Radix UI | 0 | 1 |
| 10 | Combobox | combobox.tsx | 213 | 自訂 (React + Popover) | 0 | 1 |
| 11 | Command | command.tsx | 217 | cmdk | 0 | 9 |
| 12 | ContextMenu | context-menu.tsx | 246 | Radix UI | 0 | 15 |
| 13 | Dialog | dialog.tsx | 266 | 自訂 (React Context) | 0 | 7 |
| 14 | DropdownMenu | dropdown-menu.tsx | 405 | 自訂 (React Context) | 0 | 13 |
| 15 | Form | form.tsx | 248 | react-hook-form + Radix | 0 | 8 |
| 16 | Input | input.tsx | 57 | 自訂 (React) | 0 | 1 |
| 17 | Label | label.tsx | 84 | Radix UI + CVA | 0 | 1 |
| 18 | LoadingSkeleton | loading-skeleton.tsx | 73 | 自訂 (React) | 0 | 2 |
| 19 | Pagination | pagination.tsx | 301 | 自訂 (React) | 0 | 8 |
| 20 | PasswordInput | password-input.tsx | 88 | 自訂 (React) | 0 | 1 |
| 21 | PasswordStrengthIndicator | password-strength-indicator.tsx | 261 | 自訂 (React + next-intl) | 0 | 1 |
| 22 | Popover | popover.tsx | 115 | Radix UI | 0 | 4 |
| 23 | Progress | progress.tsx | 151 | CVA | 3+5 | 3 |
| 24 | RadioGroup | radio-group.tsx | 132 | Radix UI | 0 | 2 |
| 25 | Select | select.tsx | 303 | Radix UI | 0 | 11 |
| 26 | Separator | separator.tsx | 86 | Radix UI | 0 | 1 |
| 27 | Sheet | sheet.tsx | 181 | Radix UI Dialog + CVA | 4 (side) | 10 |
| 28 | Skeleton | skeleton.tsx | 198 | CVA | 3 | 7 |
| 29 | Slider | slider.tsx | 93 | Radix UI | 0 | 1 |
| 30 | Switch | switch.tsx | 95 | Radix UI | 0 | 1 |
| 31 | Table | table.tsx | 192 | 自訂 (React) | 0 | 8 |
| 32 | Tabs | tabs.tsx | 215 | 自訂 (React Context) | 0 | 4 |
| 33 | Textarea | textarea.tsx | 87 | 自訂 (React) | 0 | 1 |
| 34 | Toast (簡易版) | Toast.tsx | 222 | 自訂 (React Context) | 3 | 2 |
| 35 | Toaster | toaster.tsx | 216 | 自訂 (React) | 4 | 1 |
| 36 | Tooltip | tooltip.tsx | 121 | Radix UI | 0 | 4 |
| 37 | use-toast | use-toast.tsx | 322 | 自訂 (Pub/Sub) | 4 | 3 |
| 38 | Index (匯出入口) | index.ts | 257 | - | - | ~120 |
| 39 | Spinner | loading/Spinner.tsx | 96 | 自訂 (lucide-react) | 5+4 | 1 |
| 40 | LoadingButton | loading/LoadingButton.tsx | 120 | 自訂 (擴展 Button) | 0 | 1 |
| 41 | LoadingOverlay | loading/LoadingOverlay.tsx | 99 | 自訂 (React) | 0 | 1 |
| 42 | GlobalProgress | loading/GlobalProgress.tsx | 176 | 自訂 (Next.js) | 0 | 1 |
| 43 | Loading Index | loading/index.ts | 46 | - | - | 8 |

---

## 輔助工具與 Hooks

### cn() 工具函數

- **檔案**: `apps/web/src/lib/utils.ts` (104 行)
- **匯出**: `cn(...inputs: ClassValue[]): string`
- **依賴**: `clsx` + `tailwind-merge`
- **用途**: 合併 Tailwind CSS 類別名稱，處理條件樣式和衝突解決
- **使用頻率**: 幾乎所有 UI 組件都使用

### 自訂 Hooks (`apps/web/src/hooks/`)

| Hook | 檔案 | 行數 | 用途 |
|------|------|------|------|
| useTheme | use-theme.ts | 207 | 主題管理 (light/dark/system)，localStorage 持久化 |
| useDebounce | useDebounce.ts | 128 | 泛型防抖 Hook，預設 500ms 延遲 |
| usePermissions | usePermissions.ts | 239 | 前端權限檢查，tRPC 整合，Set-based O(1) 查詢 |

---

## 各組件詳細分析

### 1. Accordion (`accordion.tsx`)

- **行數**: 241
- **基礎庫**: Radix UI (`@radix-ui/react-accordion`)
- **匯出**: `Accordion`, `AccordionItem`, `AccordionTrigger`, `AccordionContent`
- **Props 介面**:
  - `Accordion` (Root): `type: "single" | "multiple"`, `collapsible`, `defaultValue`, `value`, `onValueChange`, `disabled`, `orientation`
  - `AccordionItem`: `value: string` (必填), `disabled`, `className`
  - `AccordionTrigger`: `className`, `children`
  - `AccordionContent`: `className`, `children`
- **無障礙**: role/aria-expanded 自動處理 (Radix UI)，鍵盤導航 (方向鍵、Home、End、Enter、Space)
- **主題支援**: 是 (使用 CSS 變數 `ring`, `ring-offset`)
- **依賴**: `@radix-ui/react-accordion`, `lucide-react` (ChevronDown), `cn()`
- **動畫**: Chevron 旋轉 180 度，data-state 控制 accordion-up/down 動畫

### 2. Alert (`alert.tsx`)

- **行數**: 163
- **基礎庫**: CVA (`class-variance-authority`)
- **匯出**: `Alert`, `AlertTitle`, `AlertDescription`
- **變體** (4 個):
  - `default`: `bg-background text-foreground border-border`
  - `destructive`: `border-destructive/50 text-destructive`
  - `success`: `border-green-500/50 bg-green-50 text-green-900` (含 dark mode)
  - `warning`: `border-yellow-500/50 bg-yellow-50 text-yellow-900` (含 dark mode)
- **Props 介面**: `React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>`
- **無障礙**: `role="alert"` 自動設定，語義化 `<h5>` 標題
- **主題支援**: 是 (CSS 變數 + dark: modifier)

### 3. AlertDialog (`alert-dialog.tsx`)

- **行數**: 211
- **基礎庫**: Radix UI (`@radix-ui/react-alert-dialog`)
- **匯出** (11 個): `AlertDialog`, `AlertDialogPortal`, `AlertDialogOverlay`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogHeader`, `AlertDialogFooter`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, `AlertDialogCancel`
- **Props 介面**: 繼承自 Radix UI AlertDialog 各原語元件
- **無障礙**: `role="alertdialog"` 自動處理，`aria-labelledby`/`aria-describedby` 自動連結，焦點陷阱 (Focus Trap)，ESC 鍵關閉
- **主題支援**: 是 (bg-background, text-muted-foreground 等 CSS 變數)
- **動畫**: fade-in/out + zoom-in/out + slide 動畫
- **依賴**: `@radix-ui/react-alert-dialog`, `cn()`

### 4. Avatar (`avatar.tsx`)

- **行數**: 150
- **基礎庫**: CVA (`class-variance-authority`)
- **匯出**: `Avatar`, `AvatarImage`, `AvatarFallback`, `avatarVariants`
- **型別匯出**: `AvatarProps`
- **變體** (4 個 size):
  - `sm`: `h-8 w-8`
  - `default`: `h-10 w-10`
  - `lg`: `h-12 w-12`
  - `xl`: `h-16 w-16`
- **Props 介面**: `AvatarProps` 繼承 `React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof avatarVariants>`，額外 `src?`, `alt?`, `fallback?`
- **特殊功能**: 圖片載入失敗自動 fallback 至首字母縮寫 (getInitials)
- **無障礙**: `alt` 屬性用於圖片描述
- **主題支援**: 是 (bg-muted, text-muted-foreground)

### 5. Badge (`badge.tsx`)

- **行數**: 92
- **基礎庫**: CVA (`class-variance-authority`)
- **匯出**: `Badge`, `badgeVariants`
- **型別匯出**: `BadgeProps`
- **變體** (8 個):
  - `default`: `bg-primary text-primary-foreground`
  - `secondary`: `bg-secondary text-secondary-foreground`
  - `destructive`: `bg-destructive text-destructive-foreground`
  - `outline`: `text-foreground`
  - `success`: `bg-green-100 text-green-800` (含 dark mode)
  - `warning`: `bg-yellow-100 text-yellow-800` (含 dark mode)
  - `error`: `bg-red-100 text-red-800` (含 dark mode)
  - `info`: `bg-blue-100 text-blue-800` (含 dark mode)
- **無障礙**: `focus:ring-2 focus:ring-ring focus:ring-offset-2`
- **主題支援**: 是 (CSS 變數 + dark: modifier)

### 6. Breadcrumb (`breadcrumb.tsx`)

- **行數**: 191
- **基礎庫**: 自訂 React 組件
- **匯出** (7 個): `Breadcrumb`, `BreadcrumbList`, `BreadcrumbItem`, `BreadcrumbLink`, `BreadcrumbPage`, `BreadcrumbSeparator`, `BreadcrumbEllipsis`
- **Props 介面**:
  - `Breadcrumb`: `React.ComponentPropsWithoutRef<"nav"> & { separator?: React.ReactNode }`
  - `BreadcrumbLink`: `React.ComponentPropsWithoutRef<"a"> & { asChild?: boolean }`
- **無障礙**: `<nav aria-label="breadcrumb">`，`BreadcrumbPage` 有 `role="link" aria-disabled="true" aria-current="page"`，`BreadcrumbSeparator` 有 `role="presentation" aria-hidden="true"`，`BreadcrumbEllipsis` 有 `<span class="sr-only">More</span>`
- **主題支援**: 是 (text-muted-foreground, text-foreground)
- **依賴**: `lucide-react` (ChevronRight, MoreHorizontal), `cn()`

### 7. Button (`button.tsx`)

- **行數**: 114
- **基礎庫**: CVA + Radix UI Slot (`@radix-ui/react-slot`)
- **匯出**: `Button`, `buttonVariants`
- **型別匯出**: `ButtonProps`
- **視覺變體** (6 個):
  - `default`: `bg-primary text-primary-foreground hover:bg-primary/90`
  - `destructive`: `bg-destructive text-destructive-foreground hover:bg-destructive/90`
  - `outline`: `border border-input bg-background hover:bg-accent`
  - `secondary`: `bg-secondary text-secondary-foreground hover:bg-secondary/80`
  - `ghost`: `hover:bg-accent hover:text-accent-foreground`
  - `link`: `text-primary underline-offset-4 hover:underline`
- **尺寸變體** (4 個):
  - `default`: `h-10 px-4 py-2`
  - `sm`: `h-9 rounded-md px-3`
  - `lg`: `h-11 rounded-md px-8`
  - `icon`: `h-10 w-10`
- **Props 介面**: `ButtonProps` 繼承 `React.ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants>`，額外 `asChild?: boolean`
- **無障礙**: focus-visible:ring-2, disabled:pointer-events-none disabled:opacity-50
- **主題支援**: 是 (所有顏色使用 CSS 變數)

### 8. Card (`card.tsx`)

- **行數**: 143
- **基礎庫**: 自訂 React 組件 (純 Tailwind CSS)
- **匯出** (6 個): `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent`
- **Props 介面**: 各子組件繼承對應的 HTML 元素屬性
- **無障礙**: 語義化 `<h3>` 用於 CardTitle
- **主題支援**: 是 (`bg-card text-card-foreground`, `text-muted-foreground`)
- **無外部依賴**: 僅 React + `cn()`

### 9. Checkbox (`checkbox.tsx`)

- **行數**: 100
- **基礎庫**: Radix UI (`@radix-ui/react-checkbox`)
- **匯出**: `Checkbox`
- **Props 介面**: 繼承 `React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>` (包含 `checked`, `onCheckedChange`, `disabled` 等)
- **特殊功能**: 支援三態 (unchecked, checked, indeterminate)
- **無障礙**: `role="checkbox"` 自動處理，`aria-checked` 自動同步，Space 鍵切換
- **主題支援**: 是 (border-primary, data-[state=checked]:bg-primary)
- **依賴**: `@radix-ui/react-checkbox`, `lucide-react` (Check), `cn()`

### 10. Combobox (`combobox.tsx`)

- **行數**: 213
- **基礎庫**: 自訂 React (使用 Popover + 原生 input)，FIX-093 完全重寫
- **匯出**: `Combobox`
- **型別匯出**: `ComboboxOption`
- **Props 介面**:
  ```typescript
  interface ComboboxProps {
    options: ComboboxOption[];  // { value: string; label: string }[]
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    className?: string;
    disabled?: boolean;
  }
  ```
- **特殊功能**: `useMemo` 優化過濾性能，支援 UUID 值選取，客戶端過濾
- **無障礙**: `role="combobox"`, `aria-expanded`
- **主題支援**: 是 (text-muted-foreground, hover:bg-accent)
- **依賴**: `lucide-react` (Check, ChevronsUpDown), `Button`, `Popover`, `cn()`

### 11. Command (`command.tsx`)

- **行數**: 217
- **基礎庫**: cmdk 庫 + Radix UI Dialog
- **匯出** (9 個): `Command`, `CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, `CommandSeparator`, `CommandShortcut`
- **Props 介面**: 繼承 cmdk CommandPrimitive 各子元件，`CommandDialogProps extends DialogProps`
- **無障礙**: cmdk 內建完整鍵盤導航 (上下鍵、Enter)，aria-selected 自動處理
- **主題支援**: 是 (bg-popover, text-popover-foreground, text-muted-foreground)
- **依賴**: `cmdk`, `@radix-ui/react-dialog` (間接), `@radix-ui/react-icons` (MagnifyingGlassIcon), `Dialog`, `cn()`

### 12. ContextMenu (`context-menu.tsx`)

- **行數**: 246
- **基礎庫**: Radix UI (`@radix-ui/react-context-menu`)
- **匯出** (15 個): `ContextMenu`, `ContextMenuTrigger`, `ContextMenuContent`, `ContextMenuItem`, `ContextMenuCheckboxItem`, `ContextMenuRadioItem`, `ContextMenuLabel`, `ContextMenuSeparator`, `ContextMenuShortcut`, `ContextMenuGroup`, `ContextMenuPortal`, `ContextMenuSub`, `ContextMenuSubContent`, `ContextMenuSubTrigger`, `ContextMenuRadioGroup`
- **Props 介面**: 繼承 Radix UI ContextMenu 各原語，`inset?: boolean` 用於縮進項目
- **無障礙**: Radix UI 內建完整 ARIA 支援，鍵盤導航 (方向鍵、Enter、ESC)
- **主題支援**: 是 (bg-popover, text-popover-foreground, bg-accent)
- **動畫**: fade-in/out + zoom-in/out + slide 動畫
- **依賴**: `@radix-ui/react-context-menu`, `lucide-react` (Check, ChevronRight, Circle), `cn()`

### 13. Dialog (`dialog.tsx`)

- **行數**: 266
- **基礎庫**: 自訂 React Context 實作 (非 Radix UI)
- **匯出** (7 個): `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`
- **Props 介面**:
  - `DialogProps`: `{ open?: boolean; onOpenChange?: (open: boolean) => void; children: ReactNode }`
  - `DialogContentProps`: `React.HTMLAttributes<HTMLDivElement> & { onEscapeKeyDown?: (event: KeyboardEvent) => void; onPointerDownOutside?: (event: PointerEvent) => void }`
- **特殊功能**: 支援受控/非受控模式，背景遮罩 (bg-black/50 backdrop-blur-sm)，ESC 鍵關閉，背景點擊關閉，X 關閉按鈕
- **無障礙**: `<span class="sr-only">Close</span>` 用於關閉按鈕
- **主題支援**: 是 (bg-background, border)
- **依賴**: `lucide-react` (X), `cn()`

### 14. DropdownMenu (`dropdown-menu.tsx`)

- **行數**: 405
- **基礎庫**: 自訂 React Context 實作 (非 Radix UI)
- **匯出** (13 個): `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuShortcut`, `DropdownMenuGroup`, `DropdownMenuSub`, `DropdownMenuSubTrigger`, `DropdownMenuSubContent`
- **Props 介面**:
  - `DropdownMenuContentProps`: `React.HTMLAttributes<HTMLDivElement> & { align?: "start" | "center" | "end"; sideOffset?: number }`
  - `DropdownMenuItem`: 額外 `inset?: boolean`, `asChild?: boolean`, `disabled?: boolean`
  - `DropdownMenuCheckboxItem`: 額外 `checked?: boolean`
  - `DropdownMenuRadioItem`: 額外 `value: string`
- **特殊功能**: 點擊外部關閉 (mousedown listener)，ESC 鍵關閉，asChild 模式，巢狀子選單支援
- **無障礙**: hover/focus 效果，disabled 狀態
- **主題支援**: 是 (bg-popover, text-popover-foreground, bg-accent, bg-muted)
- **依賴**: `lucide-react` (Check, ChevronRight), `cn()`

### 15. Form (`form.tsx`)

- **行數**: 248
- **基礎庫**: react-hook-form + Radix UI Label + Radix UI Slot
- **匯出** (8 個): `useFormField` (hook), `Form`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`, `FormField`
- **Props 介面**: `FormField` 使用 react-hook-form 的 `ControllerProps<TFieldValues, TName>` 泛型
- **特殊功能**: Context-based API，自動 ID 生成 (`React.useId()`)，自動錯誤訊息關聯 (`aria-describedby`, `aria-invalid`)
- **無障礙**: `aria-describedby` 連結 description 和 message，`aria-invalid` 自動設定，`htmlFor` 自動關聯
- **主題支援**: 是 (text-destructive, text-muted-foreground)
- **依賴**: `react-hook-form`, `@radix-ui/react-label`, `@radix-ui/react-slot`, `Label`, `cn()`

### 16. Input (`input.tsx`)

- **行數**: 57
- **基礎庫**: 自訂 React 組件 (純 Tailwind CSS)
- **匯出**: `Input`
- **型別匯出**: `InputProps` (繼承 `React.InputHTMLAttributes<HTMLInputElement>`)
- **特殊功能**: 檔案上傳樣式優化 (`file:border-0 file:bg-transparent`)
- **無障礙**: focus-visible:ring-2, disabled:cursor-not-allowed
- **主題支援**: 是 (border-input, bg-background, text-muted-foreground)
- **依賴**: `cn()`

### 17. Label (`label.tsx`)

- **行數**: 84
- **基礎庫**: Radix UI (`@radix-ui/react-label`) + CVA
- **匯出**: `Label`
- **型別匯出**: 透過 index.ts 匯出 `LabelProps`
- **Props 介面**: 繼承 `React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>`
- **無障礙**: 語義化 `<label>` 元素，htmlFor 自動關聯，peer-disabled 狀態
- **主題支援**: 是
- **依賴**: `@radix-ui/react-label`, `class-variance-authority`, `cn()`

### 18. LoadingSkeleton (`loading-skeleton.tsx`)

- **行數**: 73
- **基礎庫**: 自訂 React 組件 (純 Tailwind CSS)
- **匯出**: `BudgetPoolCardSkeleton`, `BudgetPoolListSkeleton`
- **特殊功能**: 預算池專用骨架，animate-pulse 動畫，響應式網格 (md:2col, lg:3col)，列表版渲染 6 個卡片
- **無障礙**: 無特殊 ARIA (純視覺佔位)
- **主題支援**: 否 (硬編碼 gray-200, bg-white)
- **依賴**: 無外部依賴

### 19. Pagination (`pagination.tsx`)

- **行數**: 301
- **基礎庫**: 自訂 React 組件
- **匯出** (8 個): `Pagination`, `PaginationContent`, `PaginationEllipsis`, `PaginationItem`, `PaginationLink`, `PaginationNext`, `PaginationPrevious`, `PaginationControls`
- **Props 介面**:
  - `PaginationLink`: `{ isActive?: boolean } & Pick<ButtonProps, "size"> & React.ComponentProps<"a">`
  - `PaginationControls`: `{ currentPage: number; totalPages: number; onPageChange: (page: number) => void; className?: string }`
- **特殊功能**: `PaginationControls` 高階組件內建智能頁碼顯示邏輯 (總頁數 <= 7 全顯示，否則省略)
- **無障礙**: `<nav role="navigation" aria-label="pagination">`，`aria-current="page"`，`aria-label` (Go to previous/next page)，`aria-hidden` (省略號)，`<span class="sr-only">More pages</span>`
- **主題支援**: 是 (bg-primary, text-primary-foreground, hover:bg-accent)
- **依賴**: `lucide-react` (ChevronLeft, ChevronRight, MoreHorizontal), `Button`, `cn()`

### 20. PasswordInput (`password-input.tsx`)

- **行數**: 88
- **基礎庫**: 自訂 React 組件 (擴展 Input 樣式)
- **匯出**: `PasswordInput`
- **型別匯出**: `PasswordInputProps` (繼承 `Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>` + `showStrengthIndicator?: boolean`)
- **特殊功能**: 顯示/隱藏密碼切換按鈕 (Eye/EyeOff 圖示)
- **無障礙**: `aria-label` 在切換按鈕上 ("隱藏密碼" / "顯示密碼")，`aria-hidden="true"` 在圖示上，`tabIndex={-1}` 避免 Tab 焦點
- **主題支援**: 是 (border-input, bg-background, text-muted-foreground)
- **依賴**: `lucide-react` (Eye, EyeOff), `Button`, `cn()`
- **來源**: CHANGE-032

### 21. PasswordStrengthIndicator (`password-strength-indicator.tsx`)

- **行數**: 261
- **基礎庫**: 自訂 React 組件 + next-intl
- **匯出**: `PasswordStrengthIndicator`
- **型別匯出**: `PasswordStrengthIndicatorProps` (`{ password: string; className?: string }`)
- **特殊功能**:
  - 密碼驗證邏輯: 最小 12 字符 + 至少 6 個特殊字符 (大寫+數字+符號)
  - 進度條百分比計算 (長度 50% + 複雜度 50%)
  - 強度分級: weak (<40%) / fair (<70%) / good (<100%) / strong (100%)
  - 詳細統計顯示 (大寫/數字/符號數量)
  - 國際化支援 (`useTranslations('users.password')`)
- **無障礙**: 視覺化進度條 + 文字標籤 + Check/X 圖示
- **主題支援**: 是 (text-muted-foreground, dark: modifier)
- **依賴**: `lucide-react` (Check, X), `next-intl`, `cn()`
- **來源**: CHANGE-032

### 22. Popover (`popover.tsx`)

- **行數**: 115
- **基礎庫**: Radix UI (`@radix-ui/react-popover`)
- **匯出** (4 個): `Popover`, `PopoverTrigger`, `PopoverContent`, `PopoverAnchor`
- **Props 介面**: PopoverContent 繼承 Radix UI Popover.Content，包含 `align` (`"center" | "start" | "end"`) 和 `sideOffset` (預設 4)
- **無障礙**: Radix UI 內建 role="dialog"，鍵盤導航 (Tab, ESC)，焦點管理，Portal 渲染
- **主題支援**: 是 (bg-popover, text-popover-foreground, border)
- **動畫**: fade-in/out + zoom-in/out + slide 動畫
- **依賴**: `@radix-ui/react-popover`, `cn()`

### 23. Progress (`progress.tsx`)

- **行數**: 151
- **基礎庫**: CVA (`class-variance-authority`)
- **匯出**: `Progress`, `progressVariants`, `progressIndicatorVariants`
- **型別匯出**: `ProgressProps`
- **尺寸變體** (3 個): `sm` (h-2), `default` (h-4), `lg` (h-6)
- **顏色變體** (5 個): `default` (bg-primary), `success` (bg-green-500), `warning` (bg-yellow-500), `error` (bg-red-500), `info` (bg-blue-500)
- **Props 介面**: `ProgressProps` 繼承 HTMLDivElement + 兩組 CVA 變體，額外 `value?: number` (預設 0), `max?: number` (預設 100), `showLabel?: boolean`
- **特殊功能**: 百分比自動計算並限制 0-100 範圍，可選百分比標籤
- **主題支援**: 是 (bg-secondary, text-muted-foreground)
- **依賴**: `class-variance-authority`, `cn()`

### 24. RadioGroup (`radio-group.tsx`)

- **行數**: 132
- **基礎庫**: Radix UI (`@radix-ui/react-radio-group`)
- **匯出**: `RadioGroup`, `RadioGroupItem`
- **Props 介面**: 繼承 Radix UI RadioGroup.Root/Item
- **無障礙**: role="radiogroup"/"radio"，aria-checked 自動同步，方向鍵導航，Space/Enter 選擇
- **主題支援**: 是 (border-primary, text-primary, ring-offset-background)
- **依賴**: `@radix-ui/react-radio-group`, `lucide-react` (Circle), `cn()`

### 25. Select (`select.tsx`)

- **行數**: 303
- **基礎庫**: Radix UI (`@radix-ui/react-select`)
- **匯出** (11 個): `Select`, `SelectGroup`, `SelectValue`, `SelectTrigger`, `SelectContent`, `SelectLabel`, `SelectItem`, `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`, `NativeSelect`
- **型別匯出**: `NativeSelectProps`
- **Props 介面**: 繼承 Radix UI Select 各原語
- **特殊功能**: 包含 `NativeSelect` 向後兼容元件 (原生 HTML select)
- **無障礙**: Radix UI 內建完整 ARIA，鍵盤導航 (方向鍵、Enter、Space、ESC)
- **主題支援**: 是 (border-input, bg-background, bg-popover, text-popover-foreground)
- **動畫**: fade-in/out + zoom-in/out + slide 動畫
- **依賴**: `@radix-ui/react-select`, `lucide-react` (Check, ChevronDown, ChevronUp), `cn()`

### 26. Separator (`separator.tsx`)

- **行數**: 86
- **基礎庫**: Radix UI (`@radix-ui/react-separator`)
- **匯出**: `Separator`
- **Props 介面**: 繼承 Radix UI Separator.Root，`orientation: "horizontal" | "vertical"` (預設 horizontal)，`decorative: boolean` (預設 true)
- **無障礙**: decorative=true 時隱藏於螢幕閱讀器，decorative=false 使用 role="separator"，aria-orientation 自動設定
- **主題支援**: 是 (bg-border)
- **依賴**: `@radix-ui/react-separator`, `cn()`

### 27. Sheet (`sheet.tsx`)

- **行數**: 181
- **基礎庫**: Radix UI Dialog (`@radix-ui/react-dialog`) + CVA
- **匯出** (10 個): `Sheet`, `SheetPortal`, `SheetOverlay`, `SheetTrigger`, `SheetClose`, `SheetContent`, `SheetHeader`, `SheetFooter`, `SheetTitle`, `SheetDescription`
- **方向變體** (4 個 side):
  - `top`: inset-x-0 top-0 border-b
  - `bottom`: inset-x-0 bottom-0 border-t
  - `left`: inset-y-0 left-0 h-full w-3/4 sm:max-w-sm
  - `right` (預設): inset-y-0 right-0 h-full w-3/4 sm:max-w-sm
- **Props 介面**: `SheetContentProps` 繼承 Radix Dialog.Content + `VariantProps<typeof sheetVariants>`
- **無障礙**: Radix UI 內建，ESC 鍵關閉，`<span class="sr-only">關閉</span>`
- **主題支援**: 是 (bg-background, text-foreground, text-muted-foreground)
- **動畫**: slide-in/out 方向動畫，duration 300ms (close) / 500ms (open)
- **依賴**: `@radix-ui/react-dialog`, `class-variance-authority`, `lucide-react` (X), `cn()`

### 28. Skeleton (`skeleton.tsx`)

- **行數**: 198
- **基礎庫**: CVA (`class-variance-authority`)
- **匯出** (7 個): `Skeleton`, `SkeletonText`, `SkeletonCard`, `SkeletonAvatar`, `SkeletonButton`, `SkeletonTable`, `skeletonVariants`
- **型別匯出**: `SkeletonProps`
- **變體** (3 個):
  - `default`: `bg-muted`
  - `lighter`: `bg-muted/50`
  - `darker`: `bg-muted/80`
- **Props 介面**:
  - `SkeletonText`: `{ lines?: number; className?: string }`
  - `SkeletonAvatar`: `{ size?: "sm" | "default" | "lg"; className?: string }`
  - `SkeletonTable`: `{ rows?: number; columns?: number; className?: string }`
- **特殊功能**: 多種預設骨架 (Text、Card、Avatar、Button、Table)，animate-pulse 動畫
- **主題支援**: 是 (bg-muted)
- **依賴**: `class-variance-authority`, `cn()`

### 29. Slider (`slider.tsx`)

- **行數**: 93
- **基礎庫**: Radix UI (`@radix-ui/react-slider`)
- **匯出**: `Slider`
- **Props 介面**: 繼承 Radix UI Slider.Root (包含 `defaultValue`, `value`, `onValueChange`, `min`, `max`, `step`, `disabled`)
- **無障礙**: role="slider"，aria-valuemin/max/now 自動設定，鍵盤導航 (方向鍵、Page Up/Down、Home/End)
- **主題支援**: 是 (bg-secondary, bg-primary, bg-background, border-primary)
- **依賴**: `@radix-ui/react-slider`, `cn()`

### 30. Switch (`switch.tsx`)

- **行數**: 95
- **基礎庫**: Radix UI (`@radix-ui/react-switch`)
- **匯出**: `Switch`
- **Props 介面**: 繼承 Radix UI Switch.Root (包含 `defaultChecked`, `checked`, `onCheckedChange`, `disabled`)
- **特殊功能**: 滑動動畫 (translate-x-5/translate-x-0)
- **無障礙**: role="switch"，aria-checked 自動同步，Space/Enter 切換
- **主題支援**: 是 (data-[state=checked]:bg-primary, data-[state=unchecked]:bg-input)
- **依賴**: `@radix-ui/react-switch`, `cn()`

### 31. Table (`table.tsx`)

- **行數**: 192
- **基礎庫**: 自訂 React 組件 (純 Tailwind CSS)
- **匯出** (8 個): `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableHead`, `TableRow`, `TableCell`, `TableCaption`
- **Props 介面**: 各子組件繼承對應的 HTML 元素屬性 (HTMLTableElement, HTMLTableSectionElement, HTMLTableRowElement, HTMLTableCellElement, HTMLTableCaptionElement)
- **特殊功能**: 自動響應式設計 (overflow-auto 外層 div)，row hover 效果，selected 狀態 (data-[state=selected]:bg-muted)，checkbox 列特殊樣式 ([&:has([role=checkbox])]:pr-0)
- **無障礙**: 語義化 HTML table 結構 (table, thead, tbody, tfoot, tr, th, td, caption)
- **主題支援**: 是 (hover:bg-muted/50, bg-muted/50, text-muted-foreground)
- **依賴**: `cn()`

### 32. Tabs (`tabs.tsx`)

- **行數**: 215
- **基礎庫**: 自訂 React Context 實作 (非 Radix UI)
- **匯出** (4 個): `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`
- **Props 介面**:
  - `TabsProps`: `React.HTMLAttributes<HTMLDivElement> & { defaultValue?: string; value?: string; onValueChange?: (value: string) => void }`
  - `TabsTriggerProps`: `React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }`
  - `TabsContentProps`: `React.HTMLAttributes<HTMLDivElement> & { value: string }`
- **特殊功能**: 受控/非受控模式，Context-based 狀態管理
- **無障礙**: `role="tab"`, `aria-selected`, `role="tabpanel"`, focus-visible:ring
- **主題支援**: 是 (bg-muted, text-muted-foreground, bg-background, text-foreground)
- **依賴**: `cn()`

### 33. Textarea (`textarea.tsx`)

- **行數**: 87
- **基礎庫**: 自訂 React 組件 (純 Tailwind CSS)
- **匯出**: `Textarea`
- **型別匯出**: `TextareaProps` (繼承 `React.TextareaHTMLAttributes<HTMLTextAreaElement>`)
- **特殊功能**: 最小高度 80px
- **無障礙**: focus-visible:ring-2, disabled:cursor-not-allowed
- **主題支援**: 是 (border-input, bg-background, text-muted-foreground)
- **依賴**: `cn()`

### 34. Toast 簡易版 (`Toast.tsx`)

- **行數**: 222
- **基礎庫**: 自訂 React Context API
- **匯出**: `ToastProvider`, `useToast` (Context 版)
- **變體** (3 個 type):
  - `success`: `bg-green-600 text-white`
  - `error`: `bg-red-600 text-white`
  - `info`: `bg-blue-600 text-white`
- **Props 介面**: `ToastProvider`: `{ children: ReactNode }`
- **特殊功能**: 5 秒自動移除，手動關閉按鈕，固定右下角，通知堆疊
- **注意**: 此為 MVP 時期的簡易實作，新版使用 `use-toast.tsx` + `toaster.tsx` 的 Pub/Sub 模式
- **主題支援**: 否 (硬編碼顏色)
- **依賴**: React Context API

### 35. Toaster (`toaster.tsx`)

- **行數**: 216
- **基礎庫**: 自訂 React 組件
- **匯出**: `Toaster`
- **變體** (4 個 variant 樣式映射):
  - `default`: `bg-background text-foreground border-border`
  - `destructive`: `bg-destructive text-destructive-foreground border-destructive`
  - `success`: `bg-green-600 text-white border-green-700`
  - `warning`: `bg-yellow-500 text-white border-yellow-600`
- **特殊功能**: 圖示映射 (Info, AlertCircle, CheckCircle2, AlertTriangle)，退出動畫 (300ms slide-out-to-right)，操作按鈕支援，固定右下角 z-[100]
- **無障礙**: `role="alert"`, `aria-live="polite"`, `aria-atomic="true"`, `aria-label="關閉通知"`, `aria-label="通知區域"` (容器)
- **主題支援**: 是 (CSS 變數 + dark: modifier)
- **依賴**: `lucide-react` (X, CheckCircle2, AlertCircle, Info, AlertTriangle), `use-toast`, `cn()`

### 36. Tooltip (`tooltip.tsx`)

- **行數**: 121
- **基礎庫**: Radix UI (`@radix-ui/react-tooltip`)
- **匯出** (4 個): `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider`
- **Props 介面**: TooltipContent 繼承 Radix UI Tooltip.Content，`sideOffset` 預設 4
- **無障礙**: role="tooltip"，aria-describedby 自動關聯，ESC 關閉，Portal 渲染
- **主題支援**: 是 (bg-primary, text-primary-foreground)
- **動畫**: fade-in/out + zoom-in/out + slide 方向動畫
- **依賴**: `@radix-ui/react-tooltip`, `cn()`

### 37. use-toast Hook (`use-toast.tsx`)

- **行數**: 322
- **基礎庫**: 自訂 Pub/Sub 模式 (React Hooks + 全域狀態)
- **匯出**: `useToast` (hook), `toast` (函數)
- **型別匯出**: `Toast`, `ToastOptions`, `ToastActionElement`
- **變體** (4 個 ToastVariant type): `"default" | "destructive" | "success" | "warning"`
- **Toast 型別**:
  ```typescript
  interface Toast {
    id: string;
    title?: React.ReactNode;
    description?: React.ReactNode;
    action?: ToastActionElement;  // { altText, onClick, label }
    variant?: ToastVariant;
    duration?: number;
  }
  ```
- **特殊功能**:
  - 不依賴 React Context 的全域狀態管理
  - Reducer 模式 (ADD_TOAST, UPDATE_TOAST, DISMISS_TOAST, REMOVE_TOAST)
  - 最多 5 個通知
  - 自動過期 (預設 5000ms)
  - 300ms 退出動畫等待
  - toast() 返回 `{ id, dismiss, update }`
- **依賴**: React

### 38. Index (`index.ts`)

- **行數**: 257
- **用途**: 統一匯出入口，集中式組件匯入
- **匯出約 120 個**: 涵蓋所有 UI 組件、型別、變體函數
- **分類**:
  - Base Components (Button, Input, Card, Badge, Label, Textarea, Select, Avatar, Progress, Skeleton, Breadcrumb, Pagination)
  - Dialog/Dropdown/Popover/Tooltip/Sheet/AlertDialog/ContextMenu
  - Form (Checkbox, RadioGroup, Switch, Slider, Form)
  - Feedback (Alert, Separator, Toast/Toaster)
  - Advanced (Tabs, Table, Accordion)
  - Password (PasswordInput, PasswordStrengthIndicator)
  - Loading (Spinner, LoadingButton, LoadingOverlay, GlobalProgress)
  - Business (BudgetPoolListSkeleton)

---

### Loading 子系統 (`loading/`)

#### 39. Spinner (`loading/Spinner.tsx`)

- **行數**: 96
- **基礎庫**: 自訂 React 組件 (lucide-react Loader2)
- **匯出**: `Spinner`
- **型別匯出**: `SpinnerProps`
- **尺寸變體** (5 個): `xs` (h-3 w-3), `sm` (h-4 w-4), `md` (h-6 w-6), `lg` (h-8 w-8), `xl` (h-12 w-12)
- **顏色變體** (4 個): `primary` (text-primary), `secondary` (text-secondary), `white` (text-white), `muted` (text-muted-foreground)
- **Props 介面**: `{ size?, color?, className?, srLabel? }`
- **無障礙**: `aria-hidden="true"` 在圖示，`<span class="sr-only">` 用於螢幕閱讀器
- **主題支援**: 是 (CSS 變數 primary/secondary/muted-foreground)
- **依賴**: `lucide-react` (Loader2), `cn()`
- **來源**: FEAT-012

#### 40. LoadingButton (`loading/LoadingButton.tsx`)

- **行數**: 120
- **基礎庫**: 自訂 React 組件 (擴展 Button)
- **匯出**: `LoadingButton`
- **型別匯出**: `LoadingButtonProps` (繼承 `ButtonProps` + `{ isLoading?, loadingText?, spinnerPosition? }`)
- **Props 介面**:
  ```typescript
  interface LoadingButtonProps extends ButtonProps {
    isLoading?: boolean;
    loadingText?: string;
    spinnerPosition?: 'left' | 'right';
  }
  ```
- **特殊功能**: 載入時自動禁用，Spinner 位置可選 (左/右)，根據 Button variant 決定 Spinner 顏色
- **無障礙**: `aria-busy={isLoading}`
- **主題支援**: 是 (繼承 Button 主題)
- **依賴**: `Button`, `Spinner`, `cn()`
- **來源**: FEAT-012

#### 41. LoadingOverlay (`loading/LoadingOverlay.tsx`)

- **行數**: 99
- **基礎庫**: 自訂 React 組件
- **匯出**: `LoadingOverlay`
- **型別匯出**: `LoadingOverlayProps`
- **Props 介面**:
  ```typescript
  interface LoadingOverlayProps {
    isLoading: boolean;
    children: React.ReactNode;
    blur?: boolean;
    spinnerSize?: 'sm' | 'md' | 'lg';
    className?: string;
    overlayClassName?: string;
  }
  ```
- **特殊功能**: 相對定位容器 + 絕對定位遮罩，可選背景模糊 (backdrop-blur-sm)，半透明背景 (bg-background/60)
- **無障礙**: `aria-busy={isLoading}`
- **主題支援**: 是 (bg-background/60, dark:bg-background/70)
- **依賴**: `Spinner`, `cn()`
- **來源**: FEAT-012

#### 42. GlobalProgress (`loading/GlobalProgress.tsx`)

- **行數**: 176
- **基礎庫**: 自訂 React 組件 + Next.js (usePathname, useSearchParams)
- **匯出**: `GlobalProgress`
- **型別匯出**: `GlobalProgressProps`
- **Props 介面**:
  ```typescript
  interface GlobalProgressProps {
    color?: string;       // CSS 值，預設 'hsl(var(--primary))'
    height?: number;      // 像素，預設 3
    showSpinner?: boolean;
    className?: string;
  }
  ```
- **特殊功能**: NProgress 風格頂部進度條，路由變化自動觸發 (usePathname + useSearchParams)，模擬進度動畫 (0 -> 30 -> 60 -> 80 -> 100)，防重複觸發 (ref 比對)，可選角落 Spinner，發光效果 (boxShadow)
- **無障礙**: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label="頁面載入中"`
- **主題支援**: 是 (使用 CSS 變數 --primary)
- **依賴**: `next/navigation`, `Spinner`, `cn()`
- **注意**: 必須在 `<Suspense>` 內使用 (useSearchParams 要求)
- **來源**: FEAT-012

#### 43. Loading Index (`loading/index.ts`)

- **行數**: 46
- **匯出** (8 個): `Spinner`, `SpinnerProps`, `LoadingButton`, `LoadingButtonProps`, `LoadingOverlay`, `LoadingOverlayProps`, `GlobalProgress`, `GlobalProgressProps`

---

## 依賴統計

### Radix UI 原語使用

| Radix UI 套件 | 使用組件 |
|---------------|---------|
| `@radix-ui/react-accordion` | Accordion |
| `@radix-ui/react-alert-dialog` | AlertDialog |
| `@radix-ui/react-checkbox` | Checkbox |
| `@radix-ui/react-context-menu` | ContextMenu |
| `@radix-ui/react-dialog` | Sheet |
| `@radix-ui/react-label` | Label, Form |
| `@radix-ui/react-popover` | Popover, Combobox |
| `@radix-ui/react-radio-group` | RadioGroup |
| `@radix-ui/react-select` | Select |
| `@radix-ui/react-separator` | Separator |
| `@radix-ui/react-slider` | Slider |
| `@radix-ui/react-slot` | Button, Form |
| `@radix-ui/react-switch` | Switch |
| `@radix-ui/react-tooltip` | Tooltip |
| `@radix-ui/react-icons` | Command |

**總計**: 15 個 Radix UI 套件

### 自訂 React Context 實作

以下組件使用自訂 React Context 而非 Radix UI:

| 組件 | 原因/說明 |
|------|----------|
| Dialog | 自訂 Context 實作 (非 @radix-ui/react-dialog) |
| DropdownMenu | 自訂 Context 實作 (非 @radix-ui/react-dropdown-menu) |
| Tabs | 自訂 Context 實作 (非 @radix-ui/react-tabs) |
| Toast 簡易版 | MVP 時期的 Context 實作 |

### CVA (class-variance-authority) 使用

| 組件 | 變體維度 |
|------|---------|
| Alert | variant: 4 |
| Avatar | size: 4 |
| Badge | variant: 8 |
| Button | variant: 6, size: 4 |
| Label | (無變體，僅基礎樣式) |
| Progress | size: 3, variant: 5 |
| Sheet | side: 4 |
| Skeleton | variant: 3 |

### lucide-react 圖示使用

| 圖示 | 使用組件 |
|------|---------|
| Check | Checkbox, Combobox, ContextMenu, DropdownMenu, Select, PasswordStrengthIndicator |
| ChevronDown | Accordion, Select, NativeSelect |
| ChevronLeft | Pagination |
| ChevronRight | Breadcrumb, ContextMenu, DropdownMenu, Pagination |
| ChevronsUpDown | Combobox |
| Circle | ContextMenu, RadioGroup |
| Eye / EyeOff | PasswordInput |
| Info | Toaster |
| AlertCircle | Toaster |
| AlertTriangle | Toaster |
| CheckCircle2 | Toaster |
| Loader2 | Spinner |
| MoreHorizontal | Breadcrumb, Pagination |
| X | Dialog, Sheet, Toaster, PasswordStrengthIndicator |

---

## 組件分類統計

| 分類 | 數量 | 組件 |
|------|------|------|
| 表單控件 | 14 | Button, Input, Textarea, Select, Combobox, Command, Checkbox, RadioGroup, Switch, Slider, Form, Label, PasswordInput, PasswordStrengthIndicator |
| 資料顯示 | 10 | Table, Card, Badge, Avatar, Separator, Skeleton, LoadingSkeleton, Progress, Tabs, Accordion |
| 導航與回饋 | 10 | Breadcrumb, Pagination, DropdownMenu, ContextMenu, Sheet, Dialog, AlertDialog, Popover, Tooltip, Alert |
| Toast 通知系統 | 3 | Toast (簡易版), Toaster, use-toast |
| 載入特效系統 | 4 | Spinner, LoadingButton, LoadingOverlay, GlobalProgress |
| 基礎設施 | 2 | index.ts, loading/index.ts |

---

## 無障礙 (Accessibility) 總覽

### ARIA 角色使用

| ARIA 角色 | 組件 |
|-----------|------|
| `role="alert"` | Alert, Toaster |
| `role="alertdialog"` | AlertDialog |
| `role="checkbox"` | Checkbox |
| `role="combobox"` | Combobox |
| `role="dialog"` | Popover |
| `role="link"` | BreadcrumbPage |
| `role="navigation"` | Pagination |
| `role="presentation"` | BreadcrumbSeparator, BreadcrumbEllipsis |
| `role="progressbar"` | GlobalProgress |
| `role="radio"` | RadioGroup |
| `role="separator"` | Separator |
| `role="slider"` | Slider |
| `role="switch"` | Switch |
| `role="tab"` | Tabs |
| `role="tabpanel"` | Tabs |
| `role="tooltip"` | Tooltip |

### 螢幕閱讀器支援

| 技術 | 使用組件 |
|------|---------|
| `sr-only` (screen reader only) | Breadcrumb, Dialog, Pagination, Sheet, Spinner |
| `aria-label` | Breadcrumb, Dialog, GlobalProgress, PasswordInput, Pagination, Toaster |
| `aria-hidden="true"` | Accordion (Chevron), Breadcrumb (Separator/Ellipsis), Pagination (Ellipsis), PasswordInput (Icon), Spinner (Icon) |
| `aria-live="polite"` | Toaster |
| `aria-busy` | LoadingButton, LoadingOverlay |
| `aria-current="page"` | Breadcrumb, Pagination |
| `aria-expanded` | Combobox |
| `aria-selected` | Tabs |
| `aria-describedby` | Form |
| `aria-invalid` | Form |

---

## 主題支援總覽

### 使用 CSS 變數 (完整主題支援)

**幾乎所有組件都使用 CSS 變數**: `--primary`, `--primary-foreground`, `--secondary`, `--secondary-foreground`, `--background`, `--foreground`, `--muted`, `--muted-foreground`, `--accent`, `--accent-foreground`, `--destructive`, `--destructive-foreground`, `--border`, `--input`, `--ring`, `--popover`, `--popover-foreground`, `--card`, `--card-foreground`

### 例外 (硬編碼顏色)

| 組件 | 說明 |
|------|------|
| LoadingSkeleton | 硬編碼 `gray-200`, `bg-white` (不支援 dark mode) |
| Toast 簡易版 | 硬編碼 `bg-green-600`, `bg-red-600`, `bg-blue-600` |
| Badge (success/warning/error/info) | 使用 Tailwind 色彩 + `dark:` modifier (非 CSS 變數) |
| Alert (success/warning) | 使用 Tailwind 色彩 + `dark:` modifier |
| PasswordStrengthIndicator | 使用 Tailwind 色彩 + `dark:` modifier |
