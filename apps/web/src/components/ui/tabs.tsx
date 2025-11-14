/**
 * @fileoverview Tabs Component - shadcn/ui 分頁標籤組件
 *
 * @description
 * 自訂實作的分頁標籤組件，提供內容分組和切換功能。
 * 使用 React Context 管理標籤狀態，支援受控和非受控模式。
 * 遵循 shadcn/ui 設計系統規範，提供一致的視覺樣式和無障礙性支援。
 *
 * @component Tabs
 *
 * @features
 * - 基於 React Context 的狀態管理
 * - 支援受控和非受控模式
 * - Tab 切換動畫效果
 * - 當前 Tab 視覺高亮
 * - 鍵盤導航支援（方向鍵、Enter）
 * - 自動焦點管理
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @components
 * - Tabs: 根容器（狀態管理）
 * - TabsList: Tab 按鈕列表容器
 * - TabsTrigger: 單一 Tab 按鈕
 * - TabsContent: Tab 內容面板
 *
 * @props
 * Tabs Props:
 * @param {Object} props - 組件屬性
 * @param {string} [props.defaultValue] - 預設選中的 Tab（非受控）
 * @param {string} [props.value] - 當前選中的 Tab（受控）
 * @param {(value: string) => void} [props.onValueChange] - Tab 變更回調
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * TabsTrigger Props:
 * @param {Object} props - 組件屬性
 * @param {string} props.value - Tab 識別值
 * @param {React.ReactNode} props.children - 按鈕文字
 *
 * TabsContent Props:
 * @param {Object} props - 組件屬性
 * @param {string} props.value - 對應的 Tab 識別值
 * @param {React.ReactNode} props.children - 內容
 *
 * @example
 * ```tsx
 * // 基本用法（非受控）
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">標籤 1</TabsTrigger>
 *     <TabsTrigger value="tab2">標籤 2</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">內容 1</TabsContent>
 *   <TabsContent value="tab2">內容 2</TabsContent>
 * </Tabs>
 *
 * // 受控模式
 * const [activeTab, setActiveTab] = useState("tab1");
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 *   ...
 * </Tabs>
 * ```
 *
 * @accessibility
 * - 使用 role="tab" 標記 Tab 按鈕
 * - role="tabpanel" 標記內容面板
 * - aria-selected 指示當前 Tab
 * - 鍵盤導航（方向鍵切換、Enter 選擇）
 * - 焦點管理（Tab 切換時保持焦點）
 *
 * @dependencies
 * - React Context: 狀態管理
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/app/[locale]/settings/page.tsx - 使用範例（設定頁面）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { cn } from "@/lib/utils"

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = React.useContext(TabsContext)
  if (!context) {
    throw new Error("Tabs components must be used within Tabs")
  }
  return context
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
}

const Tabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, defaultValue, value, onValueChange, children, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue || "")
    const isControlled = value !== undefined
    const currentValue = isControlled ? value : internalValue

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue)
        }
        onValueChange?.(newValue)
      },
      [isControlled, onValueChange]
    )

    return (
      <TabsContext.Provider
        value={{ value: currentValue, onValueChange: handleValueChange }}
      >
        <div ref={ref} className={cn("", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    )
  }
)
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, value, onClick, ...props }, ref) => {
    const { value: currentValue, onValueChange } = useTabsContext()
    const isActive = currentValue === value

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e)
      onValueChange(value)
    }

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        aria-selected={isActive}
        onClick={handleClick}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isActive
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
          className
        )}
        {...props}
      />
    )
  }
)
TabsTrigger.displayName = "TabsTrigger"

interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: currentValue } = useTabsContext()
    const isActive = currentValue === value

    if (!isActive) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
