/**
 * @fileoverview GlobalProgress Component - 全局頂部進度條
 *
 * @description
 * 類似 NProgress 的頁面導航進度條，在路由切換時自動顯示進度動畫。
 * 使用 Primary 顏色，帶有發光效果。
 *
 * @component GlobalProgress
 *
 * @features
 * - 路由變化自動觸發
 * - 模擬進度動畫 (0% → 30% → 60% → 80% → 100%)
 * - Primary 顏色 + 發光效果
 * - 可配置高度和顏色
 * - 可選角落 Spinner
 * - SSR 兼容（需 Suspense 包裹）
 *
 * @example
 * ```tsx
 * // 在 layout.tsx 中使用
 * import { Suspense } from 'react';
 * import { GlobalProgress } from '@/components/ui/loading';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       <Suspense fallback={null}>
 *         <GlobalProgress />
 *       </Suspense>
 *       {children}
 *     </>
 *   );
 * }
 *
 * // 自訂顏色和高度
 * <GlobalProgress color="hsl(var(--destructive))" height={4} />
 *
 * // 顯示角落 Spinner
 * <GlobalProgress showSpinner />
 * ```
 *
 * @dependencies
 * - next/navigation: usePathname, useSearchParams
 * - ./Spinner: Spinner 組件
 *
 * @note
 * 必須在 Suspense 內使用，因為 useSearchParams 需要 Suspense boundary
 *
 * @related
 * - apps/web/src/app/[locale]/layout.tsx - 整合位置
 *
 * @author IT Department
 * @since FEAT-012 - Unified Loading System
 * @lastModified 2025-12-16
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Spinner } from './Spinner';

export interface GlobalProgressProps {
  /** 進度條顏色（CSS 值） */
  color?: string;
  /** 進度條高度（像素） */
  height?: number;
  /** 是否顯示角落 Spinner */
  showSpinner?: boolean;
  /** 自訂 CSS 類別 */
  className?: string;
}

export function GlobalProgress({
  color = 'hsl(var(--primary))',
  height = 3,
  showSpinner = false,
  className,
}: GlobalProgressProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const prevPathRef = useRef<string>('');
  const prevSearchRef = useRef<string>('');

  // 檢測路由是否真的改變
  const checkRouteChange = useCallback(() => {
    const currentPath = pathname || '';
    const currentSearch = searchParams?.toString() || '';

    const hasChanged =
      currentPath !== prevPathRef.current ||
      currentSearch !== prevSearchRef.current;

    if (hasChanged) {
      prevPathRef.current = currentPath;
      prevSearchRef.current = currentSearch;
    }

    return hasChanged;
  }, [pathname, searchParams]);

  useEffect(() => {
    // 只有路由真正改變時才觸發
    if (!checkRouteChange()) return;

    // 開始進度動畫
    setIsVisible(true);
    setProgress(0);

    // 模擬進度
    const timer1 = setTimeout(() => setProgress(30), 100);
    const timer2 = setTimeout(() => setProgress(60), 200);
    const timer3 = setTimeout(() => setProgress(80), 400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [pathname, searchParams, checkRouteChange]);

  useEffect(() => {
    if (progress >= 80) {
      // 頁面載入完成
      const timer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsVisible(false);
          setProgress(0);
        }, 200);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [progress]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed top-0 left-0 right-0 z-[9999]',
        'transition-opacity duration-200',
        progress === 100 ? 'opacity-0' : 'opacity-100',
        className
      )}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="頁面載入中"
    >
      {/* Progress Bar */}
      <div
        className="transition-all duration-300 ease-out"
        style={{
          width: `${progress}%`,
          height: `${height}px`,
          backgroundColor: color,
          boxShadow: `0 0 10px ${color}, 0 0 5px ${color}`,
        }}
      />

      {/* Optional Spinner */}
      {showSpinner && progress < 100 && (
        <div className="fixed top-4 right-4">
          <Spinner size="sm" />
        </div>
      )}
    </div>
  );
}

GlobalProgress.displayName = 'GlobalProgress';
