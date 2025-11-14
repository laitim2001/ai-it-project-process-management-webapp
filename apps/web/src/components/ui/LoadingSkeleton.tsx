/**
 * @fileoverview Loading Skeleton Components - 預算池載入骨架組件
 *
 * @description
 * 提供預算池卡片和列表的載入骨架畫面，在資料載入時提供視覺回饋。
 * 使用 Tailwind CSS animate-pulse 實現脈動動畫效果，提升用戶體驗。
 * 骨架結構與實際卡片佈局保持一致，確保視覺連貫性。
 *
 * @component BudgetPoolCardSkeleton, BudgetPoolListSkeleton
 *
 * @features
 * - 預算池卡片骨架 (BudgetPoolCardSkeleton)
 * - 預算池列表骨架 (BudgetPoolListSkeleton)
 * - 脈動動畫效果 (animate-pulse)
 * - 響應式網格佈局 (md:2列, lg:3列)
 * - 模擬實際卡片結構 (標題 + 3行資訊)
 *
 * @example
 * ```tsx
 * // 單一卡片骨架
 * <BudgetPoolCardSkeleton />
 *
 * // 列表骨架 (6 個卡片)
 * <BudgetPoolListSkeleton />
 *
 * // 條件渲染
 * {isLoading ? <BudgetPoolListSkeleton /> : <BudgetPoolCards data={pools} />}
 * ```
 *
 * @dependencies
 * - Tailwind CSS: animate-pulse, grid, responsive utilities
 *
 * @related
 * - apps/web/src/components/ui/skeleton.tsx - 通用骨架組件
 * - apps/web/src/components/ui/index.ts - UI 組件索引
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 使用範例
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14
 */

export function BudgetPoolCardSkeleton() {
  return (
    <div className="block rounded-lg border border-gray-200 bg-white p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
        <div className="flex justify-between">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/5"></div>
        </div>
      </div>
    </div>
  );
}

export function BudgetPoolListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <BudgetPoolCardSkeleton key={i} />
      ))}
    </div>
  );
}
