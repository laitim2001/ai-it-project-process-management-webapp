/**
 * @fileoverview Table Component - shadcn/ui 表格組件
 *
 * @description
 * 語義化的 HTML 表格組件集，提供一致的視覺樣式和完整的表格結構支援。
 * 包含 Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption 等子組件。
 * 遵循 shadcn/ui 設計系統規範，支援響應式設計和主題切換。
 *
 * @component Table
 *
 * @features
 * - 完整的 HTML 表格結構組件集
 * - 自動響應式設計（水平滾動）
 * - Row hover 效果
 * - Row selected 狀態
 * - 斑馬條紋支援（透過 CSS）
 * - Checkbox 列特殊樣式支援
 * - 主題支援（Light/Dark/System）
 * - 完整的語義化標記
 *
 * @components
 * - Table: 表格容器（帶響應式滾動）
 * - TableHeader: 表格頭部（thead）
 * - TableBody: 表格主體（tbody）
 * - TableFooter: 表格尾部（tfoot）
 * - TableRow: 表格行（tr）
 * - TableHead: 表頭單元格（th）
 * - TableCell: 資料單元格（td）
 * - TableCaption: 表格標題（caption）
 *
 * @example
 * ```tsx
 * <Table>
 *   <TableCaption>專案列表</TableCaption>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead>專案名稱</TableHead>
 *       <TableHead>狀態</TableHead>
 *       <TableHead className="text-right">預算</TableHead>
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell>專案 A</TableCell>
 *       <TableCell>進行中</TableCell>
 *       <TableCell className="text-right">$10,000</TableCell>
 *     </TableRow>
 *   </TableBody>
 *   <TableFooter>
 *     <TableRow>
 *       <TableCell colSpan={2}>總計</TableCell>
 *       <TableCell className="text-right">$10,000</TableCell>
 *     </TableRow>
 *   </TableFooter>
 * </Table>
 * ```
 *
 * @accessibility
 * - 使用語義化的 table 元素
 * - caption 提供表格描述
 * - thead, tbody, tfoot 結構清晰
 * - 支援 scope, colSpan, rowSpan 屬性
 *
 * @dependencies
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/app/[locale]/projects/page.tsx - 使用範例（專案列表）
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 使用範例（預算池列表）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { cn } from "@/lib/utils"

const Table = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement>
>(({ className, ...props }, ref) => (
  <div className="relative w-full overflow-auto">
    <table
      ref={ref}
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
))
Table.displayName = "Table"

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
))
TableHeader.displayName = "TableHeader"

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn("[&_tr:last-child]:border-0", className)}
    {...props}
  />
))
TableBody.displayName = "TableBody"

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className
    )}
    {...props}
  />
))
TableFooter.displayName = "TableFooter"

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn(
      "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
      className
    )}
    {...props}
  />
))
TableRow.displayName = "TableRow"

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
))
TableHead.displayName = "TableHead"

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("p-4 align-middle [&:has([role=checkbox])]:pr-0", className)}
    {...props}
  />
))
TableCell.displayName = "TableCell"

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn("mt-4 text-sm text-muted-foreground", className)}
    {...props}
  />
))
TableCaption.displayName = "TableCaption"

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
