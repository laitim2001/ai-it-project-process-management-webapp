/**
 * @fileoverview Textarea Component - shadcn/ui 多行文字輸入組件
 *
 * @description
 * 增強的 HTML textarea 組件，提供一致的視覺樣式和更好的使用者體驗。
 * 支援自動調整高度、最小高度設定、禁用狀態和焦點視覺回饋。
 * 遵循 shadcn/ui 設計系統規範，與所有表單組件無縫整合。
 *
 * @component Textarea
 *
 * @features
 * - 原生 HTML textarea 增強版
 * - 最小高度設定（min-h-[80px]）
 * - 焦點環視覺指示
 * - 支援禁用狀態
 * - placeholder 樣式統一
 * - 與 React Hook Form 無縫整合
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援
 *
 * @props
 * @param {Object} props - 組件屬性（繼承自 HTML textarea）
 * @param {string} [props.placeholder] - 佔位符文字
 * @param {number} [props.rows] - 顯示的行數
 * @param {boolean} [props.disabled] - 是否禁用
 * @param {string} [props.className] - 自訂 CSS 類別
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Textarea placeholder="請輸入內容" />
 *
 * // 自訂行數
 * <Textarea rows={5} />
 *
 * // 與 Label 搭配
 * <div>
 *   <Label htmlFor="description">描述</Label>
 *   <Textarea id="description" placeholder="請輸入專案描述" />
 * </div>
 *
 * // 與 React Hook Form 整合
 * <Textarea {...register("description")} />
 * ```
 *
 * @accessibility
 * - 使用語義化的 textarea 元素
 * - 支援 aria-label, aria-describedby
 * - 焦點管理和視覺指示
 * - 禁用狀態視覺和行為回饋
 *
 * @dependencies
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
import { cn } from "@/lib/utils"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }
