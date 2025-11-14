/**
 * @fileoverview Label Component - shadcn/ui 表單標籤組件
 *
 * @description
 * 基於 Radix UI Label 的表單標籤組件，提供完整的無障礙性支援和語義化 HTML。
 * 自動處理標籤與表單控件的關聯，支援禁用狀態樣式和主題切換。
 * 遵循 shadcn/ui 設計系統規範，與所有表單組件無縫整合。
 *
 * @component Label
 *
 * @features
 * - 基於 Radix UI Label primitive
 * - 自動標籤-輸入框關聯（透過 htmlFor）
 * - 禁用狀態視覺回饋（透明度降低、滑鼠游標變化）
 * - 主題支援（Light/Dark/System）
 * - 完整的無障礙性支援（ARIA 標準）
 * - 與 React Hook Form 無縫整合
 *
 * @props
 * @param {Object} props - 組件屬性（繼承自 Radix UI Label.Root）
 * @param {string} [props.htmlFor] - 關聯的表單控件 ID
 * @param {string} [props.className] - 自訂 CSS 類別
 * @param {React.ReactNode} props.children - 標籤文字內容
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Label htmlFor="email">電子郵件</Label>
 * <Input id="email" type="email" />
 *
 * // 與 React Hook Form 整合
 * <Label htmlFor="username">用戶名稱</Label>
 * <Input id="username" {...register("username")} />
 *
 * // 自訂樣式
 * <Label htmlFor="password" className="text-lg font-bold">
 *   密碼
 * </Label>
 * ```
 *
 * @accessibility
 * - 使用語義化的 <label> 元素
 * - 透過 htmlFor 自動關聯表單控件
 * - 支援鍵盤導航（點擊標籤聚焦到輸入框）
 * - 禁用狀態視覺提示（peer-disabled 狀態）
 *
 * @dependencies
 * - @radix-ui/react-label: 底層 Label primitive
 * - class-variance-authority: 樣式變體管理
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/input.tsx - Input 組件（常用搭配）
 * - apps/web/src/components/ui/form.tsx - Form 組件（React Hook Form 整合）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
    VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
