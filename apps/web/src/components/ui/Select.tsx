/**
 * @fileoverview Select Component - shadcn/ui 下拉選單組件
 *
 * @description
 * 原生 HTML select 的增強版本，提供一致的視覺樣式和更好的使用者體驗。
 * 包含基礎 Select 組件（原生 HTML select）和進階組件集（自訂樣式的下拉選單）。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和完整的表單整合。
 *
 * @component Select
 *
 * @features
 * - 原生 HTML select 增強版（更好的樣式）
 * - ChevronDown 圖示指示可展開狀態
 * - 支援禁用狀態
 * - 焦點環視覺指示
 * - 進階組件集（SelectTrigger, SelectContent, SelectItem 等）
 * - 主題支援（Light/Dark/System）
 * - 與 React Hook Form 無縫整合
 *
 * @components
 * - Select: 基礎原生 select（帶樣式增強）
 * - SelectTrigger: 進階觸發器按鈕
 * - SelectValue: 顯示當前選中值
 * - SelectContent: 下拉內容容器
 * - SelectItem: 單一選項
 * - SelectGroup: 選項分組容器
 * - SelectLabel: 分組標籤
 *
 * @props
 * Select Props:
 * @param {Object} props - 組件屬性（繼承自 HTML select）
 * @param {string} [props.className] - 自訂 CSS 類別
 * @param {React.ReactNode} props.children - option 元素
 *
 * @example
 * ```tsx
 * // 基礎用法（原生 select）
 * <Select>
 *   <option value="">請選擇</option>
 *   <option value="1">選項 1</option>
 *   <option value="2">選項 2</option>
 * </Select>
 *
 * // 進階用法（自訂組件）
 * <SelectTrigger>
 *   <SelectValue placeholder="請選擇" />
 * </SelectTrigger>
 * <SelectContent>
 *   <SelectGroup>
 *     <SelectLabel>分組標籤</SelectLabel>
 *     <SelectItem value="1">選項 1</SelectItem>
 *     <SelectItem value="2">選項 2</SelectItem>
 *   </SelectGroup>
 * </SelectContent>
 * ```
 *
 * @accessibility
 * - 使用語義化的 select/option 元素
 * - 鍵盤導航支援（方向鍵、Enter、Space）
 * - 焦點管理和視覺指示
 * - 禁用狀態視覺和行為回饋
 *
 * @dependencies
 * - lucide-react: ChevronDown 圖示
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/label.tsx - Label 組件（常用搭配）
 * - apps/web/src/components/ui/form.tsx - Form 組件（React Hook Form 整合）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            "flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      </div>
    )
  }
)
Select.displayName = "Select"

// Additional compound components for more complex use cases
interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background",
        "placeholder:text-muted-foreground",
        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  )
)
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, children, ...props }, ref) => (
  <span ref={ref} className={cn("block truncate", className)} {...props}>
    {children || <span className="text-muted-foreground">{placeholder}</span>}
  </span>
))
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover text-popover-foreground shadow-md",
      "animate-in fade-in-0 zoom-in-95",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 px-2 text-sm outline-none",
      "hover:bg-accent hover:text-accent-foreground",
      "focus:bg-accent focus:text-accent-foreground",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
SelectItem.displayName = "SelectItem"

const SelectGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-1", className)} {...props} />
))
SelectGroup.displayName = "SelectGroup"

const SelectLabel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("py-1.5 px-2 text-sm font-semibold", className)}
    {...props}
  />
))
SelectLabel.displayName = "SelectLabel"

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
}
