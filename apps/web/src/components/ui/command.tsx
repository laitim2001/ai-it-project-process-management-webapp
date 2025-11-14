/**
 * @fileoverview Command Component - shadcn/ui 命令選單組件
 *
 * @description
 * 基於 cmdk 庫的命令選單組件，提供快速搜尋和鍵盤導航功能。
 * 常用於實現命令面板 (Command Palette)、可搜尋下拉選單等交互模式。
 * 整合 Dialog 組件可實現全域命令搜尋功能 (如 Cmd+K)。
 *
 * @component Command
 *
 * @features
 * - 即時搜尋過濾
 * - 鍵盤導航 (上下鍵、Enter 選取)
 * - 命令分組 (CommandGroup)
 * - 空狀態處理 (CommandEmpty)
 * - 快捷鍵顯示 (CommandShortcut)
 * - 對話框模式 (CommandDialog)
 * - 主題支援 (Light/Dark/System)
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Command>
 *   <CommandInput placeholder="搜尋..." />
 *   <CommandList>
 *     <CommandEmpty>找不到結果</CommandEmpty>
 *     <CommandGroup heading="建議">
 *       <CommandItem>專案</CommandItem>
 *       <CommandItem>預算池</CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </Command>
 *
 * // 對話框模式 (Cmd+K 命令面板)
 * <CommandDialog open={open} onOpenChange={setOpen}>
 *   <CommandInput placeholder="輸入命令或搜尋..." />
 *   <CommandList>
 *     <CommandEmpty>找不到結果</CommandEmpty>
 *     <CommandGroup heading="操作">
 *       <CommandItem onSelect={() => router.push('/projects/new')}>
 *         建立新專案
 *         <CommandShortcut>⌘N</CommandShortcut>
 *       </CommandItem>
 *     </CommandGroup>
 *   </CommandList>
 * </CommandDialog>
 * ```
 *
 * @dependencies
 * - cmdk: Command 底層實現
 * - @radix-ui/react-icons: MagnifyingGlassIcon
 * - apps/web/src/components/ui/dialog.tsx: Dialog 組件
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/combobox.tsx - Combobox 組件 (移除了 cmdk 依賴)
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

"use client"

import * as React from "react"
import { type DialogProps } from "@radix-ui/react-dialog"
import { MagnifyingGlassIcon } from "@radix-ui/react-icons"
import { Command as CommandPrimitive } from "cmdk"

import { cn } from "@/lib/utils"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const Command = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive>
>(({ className, ...props }, ref) => (
  <CommandPrimitive
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-md bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
))
Command.displayName = CommandPrimitive.displayName

interface CommandDialogProps extends DialogProps {}

const CommandDialog = ({ children, ...props }: CommandDialogProps) => {
  return (
    <Dialog {...props}>
      <DialogContent className="overflow-hidden p-0">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          {children}
        </Command>
      </DialogContent>
    </Dialog>
  )
}

const CommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div className="flex items-center border-b px-3" cmdk-input-wrapper="">
    <MagnifyingGlassIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  </div>
))

CommandInput.displayName = CommandPrimitive.Input.displayName

const CommandList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List
    ref={ref}
    className={cn("max-h-[300px] overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
))

CommandList.displayName = CommandPrimitive.List.displayName

const CommandEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    className="py-6 text-center text-sm"
    {...props}
  />
))

CommandEmpty.displayName = CommandPrimitive.Empty.displayName

const CommandGroup = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Group>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Group>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Group
    ref={ref}
    className={cn(
      "overflow-hidden p-1 text-foreground [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
      className
    )}
    {...props}
  />
))

CommandGroup.displayName = CommandPrimitive.Group.displayName

const CommandSeparator = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 h-px bg-border", className)}
    {...props}
  />
))
CommandSeparator.displayName = CommandPrimitive.Separator.displayName

const CommandItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      className
    )}
    {...props}
  />
))

CommandItem.displayName = CommandPrimitive.Item.displayName

const CommandShortcut = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={cn(
        "ml-auto text-xs tracking-widest text-muted-foreground",
        className
      )}
      {...props}
    />
  )
}
CommandShortcut.displayName = "CommandShortcut"

export {
  Command,
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
  CommandShortcut,
}
