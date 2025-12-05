/**
 * @fileoverview Select Component - Radix UI 下拉選單組件
 *
 * @description
 * 基於 Radix UI Select 的完整下拉選單組件，提供一致的視覺樣式和更好的使用者體驗。
 * 支援完整的鍵盤導航、焦點管理和無障礙設計。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和完整的表單整合。
 *
 * @component Select
 *
 * @features
 * - Radix UI Select 基礎（完整無障礙支援）
 * - onValueChange 控制值變更
 * - 支援禁用狀態
 * - 焦點環視覺指示
 * - SelectTrigger, SelectContent, SelectItem 等組合組件
 * - 主題支援（Light/Dark/System）
 * - 與 React Hook Form 無縫整合
 *
 * @components
 * - Select: 根組件（狀態管理）
 * - SelectGroup: 選項分組容器
 * - SelectValue: 顯示當前選中值
 * - SelectTrigger: 觸發器按鈕
 * - SelectContent: 下拉內容容器
 * - SelectLabel: 分組標籤
 * - SelectItem: 單一選項
 * - SelectSeparator: 分隔線
 * - SelectScrollUpButton: 向上滾動按鈕
 * - SelectScrollDownButton: 向下滾動按鈕
 *
 * @example
 * ```tsx
 * // 基礎用法
 * <Select onValueChange={handleChange} value={value}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="請選擇" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectItem value="1">選項 1</SelectItem>
 *     <SelectItem value="2">選項 2</SelectItem>
 *   </SelectContent>
 * </Select>
 *
 * // 分組用法
 * <Select onValueChange={handleChange}>
 *   <SelectTrigger>
 *     <SelectValue placeholder="請選擇" />
 *   </SelectTrigger>
 *   <SelectContent>
 *     <SelectGroup>
 *       <SelectLabel>分組 A</SelectLabel>
 *       <SelectItem value="a1">選項 A1</SelectItem>
 *       <SelectItem value="a2">選項 A2</SelectItem>
 *     </SelectGroup>
 *     <SelectSeparator />
 *     <SelectGroup>
 *       <SelectLabel>分組 B</SelectLabel>
 *       <SelectItem value="b1">選項 B1</SelectItem>
 *     </SelectGroup>
 *   </SelectContent>
 * </Select>
 * ```
 *
 * @accessibility
 * - 完整 ARIA 支援（Radix UI 內建）
 * - 鍵盤導航支援（方向鍵、Enter、Space、Escape）
 * - 焦點管理和視覺指示
 * - 禁用狀態視覺和行為回饋
 * - 螢幕閱讀器友善
 *
 * @dependencies
 * - @radix-ui/react-select: 核心選單功能
 * - lucide-react: Check, ChevronDown, ChevronUp 圖示
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/label.tsx - Label 組件（常用搭配）
 * - apps/web/src/components/ui/form.tsx - Form 組件（React Hook Form 整合）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-12-05
 */

'use client';

import * as React from 'react';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';

import { cn } from '@/lib/utils';

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      '[&>span]:line-clamp-1',
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      'flex cursor-default items-center justify-center py-1',
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName;

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none',
      'focus:bg-accent focus:text-accent-foreground',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px bg-muted', className)}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// ============================================================
// Native Select (向後兼容)
// ============================================================

/**
 * NativeSelect - 原生 HTML select 組件（向後兼容）
 *
 * @description
 * 保留原生 HTML select 的樣式，用於需要 <option> 子元素的場景。
 * 建議新組件使用 Radix UI Select（支援 onValueChange）。
 *
 * @example
 * ```tsx
 * <NativeSelect onChange={(e) => setValue(e.target.value)} value={value}>
 *   <option value="">請選擇</option>
 *   <option value="1">選項 1</option>
 * </NativeSelect>
 * ```
 */
export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50" />
      </div>
    );
  }
);
NativeSelect.displayName = 'NativeSelect';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  NativeSelect,
};
