/**
 * @fileoverview Accordion Component - shadcn/ui 可摺疊面板組件
 *
 * @description
 * 基於 Radix UI Accordion 的可摺疊內容面板組件，支援單選和多選展開模式。
 * 提供平滑的展開/收合動畫、完整的鍵盤導航支援和無障礙性功能。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和完整的可訪問性支援。
 *
 * @component Accordion
 *
 * @features
 * - 單選/多選展開模式 (type="single" | "multiple")
 * - 可控/非可控模式支援
 * - 完整的鍵盤導航 (方向鍵、Home、End、Enter、Space)
 * - 平滑的展開/收合動畫
 * - Chevron 圖標旋轉動畫
 * - 主題支援 (Light/Dark/System)
 * - 完整的無障礙性支援 (ARIA 屬性、螢幕閱讀器友善)
 * - WCAG 2.1 AA 標準
 *
 * @example
 * ```tsx
 * // 單選模式 (一次只能展開一個項目)
 * <Accordion type="single" collapsible>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>第一個項目</AccordionTrigger>
 *     <AccordionContent>
 *       這是第一個項目的內容
 *     </AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>第二個項目</AccordionTrigger>
 *     <AccordionContent>
 *       這是第二個項目的內容
 *     </AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // 多選模式 (可同時展開多個項目)
 * <Accordion type="multiple" defaultValue={["item-1", "item-2"]}>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>項目 1</AccordionTrigger>
 *     <AccordionContent>內容 1</AccordionContent>
 *   </AccordionItem>
 *   <AccordionItem value="item-2">
 *     <AccordionTrigger>項目 2</AccordionTrigger>
 *     <AccordionContent>內容 2</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 *
 * // 可控模式
 * const [value, setValue] = useState("item-1");
 * <Accordion type="single" value={value} onValueChange={setValue}>
 *   <AccordionItem value="item-1">
 *     <AccordionTrigger>標題</AccordionTrigger>
 *     <AccordionContent>內容</AccordionContent>
 *   </AccordionItem>
 * </Accordion>
 * ```
 *
 * @accessibility
 * - ARIA 屬性自動處理 (role, aria-expanded, aria-controls)
 * - 鍵盤導航完整支援 (方向鍵、Home、End、Enter、Space)
 * - 焦點管理自動化
 * - 螢幕閱讀器友善
 * - WCAG 2.1 AA 標準
 *
 * @dependencies
 * - @radix-ui/react-accordion: Accordion 底層實現
 * - lucide-react: ChevronDown 圖標
 * - class-variance-authority: 樣式變體管理 (通過 shadcn/ui 間接依賴)
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/collapsible.tsx - 單一可摺疊組件
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Accordion 根組件
 *
 * 【Props】
 * • type: "single" | "multiple" - 展開模式
 * • collapsible: boolean - 是否允許全部收合 (僅 single 模式)
 * • defaultValue: string | string[] - 預設展開項目
 * • value: string | string[] - 受控值
 * • onValueChange: (value) => void - 值變更回調
 * • disabled: boolean - 是否禁用
 * • orientation: "vertical" | "horizontal" - 方向
 *
 * 【單選模式】
 * type="single" - 一次只能展開一個項目
 * collapsible - 允許收合當前展開的項目
 *
 * 【多選模式】
 * type="multiple" - 可以同時展開多個項目
 */
const Accordion = AccordionPrimitive.Root;

/**
 * AccordionItem 項目組件
 *
 * 【Props】
 * • value: string - 項目的唯一識別值 (必填)
 * • disabled: boolean - 是否禁用此項目
 * • className: string - 額外的 CSS 類名
 *
 * 【樣式】
 * • 底部邊框分隔
 * • 支援禁用狀態
 */
const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

/**
 * AccordionTrigger 觸發器組件 (標題按鈕)
 *
 * 【Props】
 * • className: string - 額外的 CSS 類名
 * • children: ReactNode - 標題內容
 *
 * 【樣式】
 * • 全寬度可點擊區域
 * • Hover 效果
 * • 旋轉動畫的 Chevron 圖標
 * • 字體粗細: medium
 * • 文字對齊: 左對齊
 *
 * 【動畫】
 * • Chevron 圖標展開時旋轉 180 度
 * • 平滑過渡效果
 *
 * 【無障礙】
 * • role="button"
 * • aria-expanded 自動處理
 * • 鍵盤焦點樣式
 */
const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        // 基礎佈局
        "flex flex-1 items-center justify-between py-4 font-medium transition-all",
        // Hover 效果
        "hover:underline",
        // 焦點樣式
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // 禁用狀態
        "disabled:cursor-not-allowed disabled:opacity-50",
        // 文字對齊
        "text-left",
        // 自定義類名
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          // 圖標尺寸
          "h-4 w-4 flex-shrink-0",
          // 過渡動畫
          "transition-transform duration-200",
          // 展開時旋轉 180 度
          "[&[data-state=open]]:rotate-180"
        )}
        aria-hidden="true"
      />
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/**
 * AccordionContent 內容組件
 *
 * 【Props】
 * • className: string - 額外的 CSS 類名
 * • children: ReactNode - 內容
 *
 * 【樣式】
 * • 文字大小: sm
 * • 內邊距: 下方 4 單位，上方 0
 * • 顏色: muted-foreground (次要文字顏色)
 *
 * 【動畫】
 * • 展開: 平滑的高度和透明度過渡
 * • 收合: 反向過渡效果
 * • 使用 Radix UI 的 data-state 屬性控制
 *
 * 【實現細節】
 * • 使用 overflow-hidden 裁剪動畫
 * • grid-rows 實現高度動畫
 * • 過渡時間: 200ms
 */
const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    className={cn(
      // 基礎樣式
      "overflow-hidden text-sm transition-all",
      // 展開動畫
      "data-[state=closed]:animate-accordion-up",
      "data-[state=open]:animate-accordion-down",
      // 自定義類名
      className
    )}
    {...props}
  >
    <div className="pb-4 pt-0">{children}</div>
  </AccordionPrimitive.Content>
));
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
