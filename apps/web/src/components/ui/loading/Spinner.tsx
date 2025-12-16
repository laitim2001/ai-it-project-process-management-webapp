/**
 * @fileoverview Spinner Component - 通用旋轉載入指示器
 *
 * @description
 * 基於 Lucide React Loader2 圖標的旋轉載入指示器。
 * 支援多種尺寸和顏色變體，用於各種載入場景。
 *
 * @component Spinner
 *
 * @features
 * - 5 種尺寸變體 (xs, sm, md, lg, xl)
 * - 4 種顏色變體 (primary, secondary, white, muted)
 * - CSS 動畫旋轉效果 (animate-spin)
 * - 無障礙設計（sr-only 標籤）
 *
 * @example
 * ```tsx
 * // 基本用法
 * <Spinner />
 *
 * // 不同尺寸
 * <Spinner size="xs" />
 * <Spinner size="lg" />
 *
 * // 不同顏色
 * <Spinner color="white" />
 * <Spinner color="muted" />
 *
 * // 自訂 className
 * <Spinner className="mr-2" />
 * ```
 *
 * @dependencies
 * - lucide-react: Loader2 圖標
 *
 * @related
 * - apps/web/src/components/ui/loading/LoadingButton.tsx
 * - apps/web/src/components/ui/loading/LoadingOverlay.tsx
 *
 * @author IT Department
 * @since FEAT-012 - Unified Loading System
 * @lastModified 2025-12-16
 */

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface SpinnerProps {
  /** 尺寸變體 */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** 顏色變體 */
  color?: 'primary' | 'secondary' | 'white' | 'muted';
  /** 自訂 CSS 類別 */
  className?: string;
  /** 螢幕閱讀器標籤 */
  srLabel?: string;
}

const sizeClasses = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colorClasses = {
  primary: 'text-primary',
  secondary: 'text-secondary',
  white: 'text-white',
  muted: 'text-muted-foreground',
};

export function Spinner({
  size = 'md',
  color = 'primary',
  className,
  srLabel = '載入中',
}: SpinnerProps) {
  return (
    <>
      <Loader2
        className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color],
          className
        )}
        aria-hidden="true"
      />
      <span className="sr-only">{srLabel}</span>
    </>
  );
}

Spinner.displayName = 'Spinner';
