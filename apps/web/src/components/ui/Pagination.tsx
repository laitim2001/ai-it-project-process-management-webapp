/**
 * @fileoverview Pagination Component - shadcn/ui 分頁導航組件
 *
 * @description
 * 功能完整的分頁導航組件，提供靈活的分頁導航和智能頁碼顯示策略。
 * 包含基礎組件（Pagination, PaginationContent, PaginationItem 等）和高階組件（PaginationControls）。
 * PaginationControls 提供內建分頁邏輯，自動處理頁碼省略和邊界檢查。
 *
 * @component Pagination
 *
 * @features
 * - 完整的分頁組件集（Container, Content, Item, Link, Previous, Next, Ellipsis）
 * - 智能頁碼顯示（總頁數 > 7 時自動省略）
 * - 當前頁視覺高亮（isActive 狀態）
 * - 上一頁/下一頁導航按鈕
 * - 省略號指示器（MoreHorizontal 圖示）
 * - PaginationControls 高階組件（內建分頁邏輯）
 * - 完整的無障礙性支援（ARIA 標準）
 *
 * @components
 * - Pagination: 分頁容器（nav 元素）
 * - PaginationContent: 分頁項目列表（ul 元素）
 * - PaginationItem: 單一分頁項目容器（li 元素）
 * - PaginationLink: 分頁連結（支援 isActive 狀態）
 * - PaginationPrevious: 上一頁按鈕（帶 ChevronLeft 圖示）
 * - PaginationNext: 下一頁按鈕（帶 ChevronRight 圖示）
 * - PaginationEllipsis: 省略號指示器（MoreHorizontal 圖示）
 * - PaginationControls: 高階組件（完整分頁邏輯）
 *
 * @example
 * ```tsx
 * // 基本用法（手動組裝）
 * <Pagination>
 *   <PaginationContent>
 *     <PaginationItem>
 *       <PaginationPrevious href="#" />
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#" isActive>1</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationLink href="#">2</PaginationLink>
 *     </PaginationItem>
 *     <PaginationItem>
 *       <PaginationNext href="#" />
 *     </PaginationItem>
 *   </PaginationContent>
 * </Pagination>
 *
 * // 高階組件用法（推薦）
 * const [currentPage, setCurrentPage] = useState(1);
 * const totalPages = 20;
 *
 * <PaginationControls
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 * />
 * ```
 *
 * @paginationLogic
 * PaginationControls 智能頁碼顯示邏輯：
 * - 總頁數 ≤ 7: 顯示所有頁碼 [1, 2, 3, 4, 5, 6, 7]
 * - 當前頁 ≤ 4: [1, 2, 3, 4, 5, ..., N]
 * - 當前頁 ≥ N-3: [1, ..., N-4, N-3, N-2, N-1, N]
 * - 其他情況: [1, ..., current-1, current, current+1, ..., N]
 *
 * @accessibility
 * - 使用 <nav role="navigation"> 語義化容器
 * - aria-label="pagination" 導航提示
 * - aria-current="page" 當前頁標記
 * - aria-label 描述上一頁/下一頁按鈕
 * - aria-hidden 隱藏裝飾性省略號
 * - 禁用狀態視覺提示（pointer-events-none + opacity-50）
 *
 * @dependencies
 * - lucide-react: 圖示庫（ChevronLeft, ChevronRight, MoreHorizontal）
 * - Tailwind CSS: 樣式系統
 *
 * @related
 * - apps/web/src/components/ui/button.tsx - Button 組件（分頁按鈕樣式基礎）
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/app/[locale]/projects/page.tsx - 使用範例（專案列表分頁）
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 使用範例（預算池列表分頁）
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "./Button"

interface PaginationProps extends Omit<React.ComponentProps<"nav">, 'currentPage' | 'totalPages' | 'onPageChange'> {}

const Pagination: React.FC<PaginationProps> = ({
  className,
  ...props
}) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
)
Pagination.displayName = "Pagination"

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
))
PaginationContent.displayName = "PaginationContent"

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
  <li ref={ref} className={cn("", className)} {...props} />
))
PaginationItem.displayName = "PaginationItem"

type PaginationLinkProps = {
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
  React.ComponentProps<"a">

const PaginationLink: React.FC<PaginationLinkProps> = ({
  className,
  isActive,
  size = "icon",
  ...props
}) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
      isActive
        ? "bg-primary text-primary-foreground hover:bg-primary/90"
        : "hover:bg-accent hover:text-accent-foreground",
      size === "default" ? "h-10 px-4 py-2" : "h-10 w-10",
      className
    )}
    {...props}
  />
)
PaginationLink.displayName = "PaginationLink"

const PaginationPrevious: React.FC<
  React.ComponentProps<typeof PaginationLink>
> = ({ className, ...props }) => (
  <PaginationLink
    aria-label="Go to previous page"
    size="default"
    className={cn("gap-1 pl-2.5", className)}
    {...props}
  >
    <ChevronLeft className="h-4 w-4" />
    <span>Previous</span>
  </PaginationLink>
)
PaginationPrevious.displayName = "PaginationPrevious"

const PaginationNext: React.FC<React.ComponentProps<typeof PaginationLink>> = ({
  className,
  ...props
}) => (
  <PaginationLink
    aria-label="Go to next page"
    size="default"
    className={cn("gap-1 pr-2.5", className)}
    {...props}
  >
    <span>Next</span>
    <ChevronRight className="h-4 w-4" />
  </PaginationLink>
)
PaginationNext.displayName = "PaginationNext"

const PaginationEllipsis: React.FC<React.ComponentProps<"span">> = ({
  className,
  ...props
}) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
)
PaginationEllipsis.displayName = "PaginationEllipsis"

// Helper component with built-in pagination logic
interface PaginationControlsProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  className,
}) => {
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "ellipsis", totalPages]
    }

    if (currentPage >= totalPages - 3) {
      return [
        1,
        "ellipsis",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ]
    }

    return [
      1,
      "ellipsis",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "ellipsis",
      totalPages,
    ]
  }

  const visiblePages = getVisiblePages()

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            className={cn(
              currentPage === 1 && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>

        {visiblePages.map((page, index) => (
          <PaginationItem key={`page-${index}`}>
            {page === "ellipsis" ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink
                onClick={() => onPageChange(page as number)}
                isActive={currentPage === page}
              >
                {page}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}

        <PaginationItem>
          <PaginationNext
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className={cn(
              currentPage === totalPages && "pointer-events-none opacity-50"
            )}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  )
}
PaginationControls.displayName = "PaginationControls"

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationControls,
}
