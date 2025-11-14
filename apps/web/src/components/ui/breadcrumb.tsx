/**
 * @fileoverview Breadcrumb Component - shadcn/ui 麵包屑導航組件
 *
 * @description
 * 基於 Radix UI 的麵包屑導航組件，提供層級式導航路徑顯示。
 * 遵循 shadcn/ui 設計系統規範，支援主題切換和完整的無障礙性。
 * 包含多個子組件以構建靈活的麵包屑結構。
 *
 * @component Breadcrumb
 *
 * @features
 * - 麵包屑導航列表 (BreadcrumbList)
 * - 麵包屑項目 (BreadcrumbItem)
 * - 可點擊連結 (BreadcrumbLink)
 * - 當前頁面顯示 (BreadcrumbPage)
 * - 自訂分隔符 (BreadcrumbSeparator)
 * - 省略符號 (BreadcrumbEllipsis)
 * - 主題支援 (Light/Dark/System)
 * - 完整的無障礙性支援 (ARIA labels)
 *
 * @subComponents
 * - Breadcrumb: 麵包屑容器 (nav 元素)
 * - BreadcrumbList: 麵包屑列表 (ol 元素)
 * - BreadcrumbItem: 麵包屑項目 (li 元素)
 * - BreadcrumbLink: 麵包屑連結 (a 元素，支援 asChild)
 * - BreadcrumbPage: 當前頁面 (span 元素，不可點擊)
 * - BreadcrumbSeparator: 分隔符 (預設為 ChevronRight 圖示)
 * - BreadcrumbEllipsis: 省略符號 (MoreHorizontal 圖示)
 *
 * @example
 * ```tsx
 * <Breadcrumb>
 *   <BreadcrumbList>
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/">首頁</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbLink href="/projects">專案</BreadcrumbLink>
 *     </BreadcrumbItem>
 *     <BreadcrumbSeparator />
 *     <BreadcrumbItem>
 *       <BreadcrumbPage>專案詳情</BreadcrumbPage>
 *     </BreadcrumbItem>
 *   </BreadcrumbList>
 * </Breadcrumb>
 * ```
 *
 * @dependencies
 * - lucide-react: ChevronRight, MoreHorizontal 圖示
 * - React: forwardRef
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/index.ts - UI 組件索引
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"

const Breadcrumb = React.forwardRef<
  HTMLElement,
  React.ComponentPropsWithoutRef<"nav"> & {
    separator?: React.ReactNode
  }
>(({ className, ...props }, ref) => (
  <nav
    ref={ref}
    aria-label="breadcrumb"
    className={className}
    {...props}
  />
))
Breadcrumb.displayName = "Breadcrumb"

const BreadcrumbList = React.forwardRef<
  HTMLOListElement,
  React.ComponentPropsWithoutRef<"ol">
>(({ className, ...props }, ref) => (
  <ol
    ref={ref}
    className={cn(
      "flex flex-wrap items-center gap-1.5 break-words text-sm text-muted-foreground sm:gap-2.5",
      className
    )}
    {...props}
  />
))
BreadcrumbList.displayName = "BreadcrumbList"

const BreadcrumbItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentPropsWithoutRef<"li">
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn("inline-flex items-center gap-1.5", className)}
    {...props}
  />
))
BreadcrumbItem.displayName = "BreadcrumbItem"

const BreadcrumbLink = React.forwardRef<
  HTMLAnchorElement,
  React.ComponentPropsWithoutRef<"a"> & {
    asChild?: boolean
  }
>(({ className, asChild, children, ...props }, ref) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      className: cn(
        "transition-colors hover:text-foreground",
        className
      ),
    })
  }

  return (
    <a
      ref={ref}
      className={cn("transition-colors hover:text-foreground", className)}
      {...props}
    >
      {children}
    </a>
  )
})
BreadcrumbLink.displayName = "BreadcrumbLink"

const BreadcrumbPage = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span">
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    role="link"
    aria-disabled="true"
    aria-current="page"
    className={cn("font-normal text-foreground", className)}
    {...props}
  />
))
BreadcrumbPage.displayName = "BreadcrumbPage"

const BreadcrumbSeparator: React.FC<React.ComponentProps<"li">> = ({
  children,
  className,
  ...props
}) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn("[&>svg]:size-3.5", className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
)
BreadcrumbSeparator.displayName = "BreadcrumbSeparator"

const BreadcrumbEllipsis: React.FC<React.ComponentProps<"span">> = ({
  className,
  ...props
}) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
)
BreadcrumbEllipsis.displayName = "BreadcrumbEllipsis"

export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
}
