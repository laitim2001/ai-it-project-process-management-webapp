/**
 * @fileoverview LoadingOverlay Component - 區域載入遮罩
 *
 * @description
 * 為指定區域添加半透明載入遮罩，顯示 Spinner 指示載入狀態。
 * 支援背景模糊效果，適用於數據刷新、表格重載等場景。
 *
 * @component LoadingOverlay
 *
 * @features
 * - 相對定位容器 + 絕對定位遮罩
 * - 可選背景模糊效果
 * - Spinner 尺寸可配置
 * - 淺色半透明背景（不會遮擋內容過多）
 * - 無障礙設計（aria-busy）
 *
 * @example
 * ```tsx
 * // 基本用法
 * <LoadingOverlay isLoading={isFetching}>
 *   <DataTable data={data} />
 * </LoadingOverlay>
 *
 * // 帶模糊效果
 * <LoadingOverlay isLoading={isFetching} blur>
 *   <Card>...</Card>
 * </LoadingOverlay>
 *
 * // 自訂 Spinner 尺寸
 * <LoadingOverlay isLoading={isFetching} spinnerSize="md">
 *   <Form>...</Form>
 * </LoadingOverlay>
 *
 * // 配合 tRPC isLoading
 * const { data, isLoading, isFetching } = api.project.getAll.useQuery({});
 * <LoadingOverlay isLoading={isFetching && !isLoading}>
 *   <ProjectList data={data} />
 * </LoadingOverlay>
 * ```
 *
 * @dependencies
 * - ./Spinner: Spinner 組件
 *
 * @related
 * - apps/web/src/components/ui/skeleton.tsx - 首次載入骨架屏
 *
 * @author IT Department
 * @since FEAT-012 - Unified Loading System
 * @lastModified 2025-12-16
 */

import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface LoadingOverlayProps {
  /** 是否顯示遮罩 */
  isLoading: boolean;
  /** 子內容 */
  children: React.ReactNode;
  /** 是否啟用背景模糊 */
  blur?: boolean;
  /** Spinner 尺寸 */
  spinnerSize?: 'sm' | 'md' | 'lg';
  /** 自訂容器 CSS 類別 */
  className?: string;
  /** 自訂遮罩 CSS 類別 */
  overlayClassName?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  blur = false,
  spinnerSize = 'lg',
  className,
  overlayClassName,
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)} aria-busy={isLoading}>
      {children}

      {isLoading && (
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center',
            'bg-background/60 dark:bg-background/70',
            'transition-opacity duration-200',
            blur && 'backdrop-blur-sm',
            overlayClassName
          )}
        >
          <Spinner size={spinnerSize} />
        </div>
      )}
    </div>
  );
}

LoadingOverlay.displayName = 'LoadingOverlay';
