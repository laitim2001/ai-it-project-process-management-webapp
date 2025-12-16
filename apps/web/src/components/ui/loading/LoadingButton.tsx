/**
 * @fileoverview LoadingButton Component - 帶載入狀態的按鈕
 *
 * @description
 * 擴展自 Button 組件，增加載入狀態支援。
 * 載入時顯示 Spinner 並禁用按鈕，防止重複提交。
 *
 * @component LoadingButton
 *
 * @features
 * - 繼承 Button 所有功能（variant, size, asChild）
 * - 載入狀態自動禁用
 * - 可自訂載入文字
 * - Spinner 位置可選（左/右）
 * - 無障礙設計（aria-busy）
 *
 * @example
 * ```tsx
 * // 基本用法
 * <LoadingButton isLoading={isPending}>
 *   儲存
 * </LoadingButton>
 *
 * // 自訂載入文字
 * <LoadingButton isLoading={isPending} loadingText="儲存中...">
 *   儲存
 * </LoadingButton>
 *
 * // Spinner 在右側
 * <LoadingButton isLoading={isPending} spinnerPosition="right">
 *   下一步
 * </LoadingButton>
 *
 * // 配合 tRPC mutation
 * const createMutation = api.project.create.useMutation();
 * <LoadingButton
 *   isLoading={createMutation.isPending}
 *   loadingText={t('saving')}
 * >
 *   {t('save')}
 * </LoadingButton>
 * ```
 *
 * @dependencies
 * - @/components/ui/button: Button 組件
 * - ./Spinner: Spinner 組件
 *
 * @related
 * - apps/web/src/components/ui/button.tsx
 * - apps/web/src/components/ui/loading/Spinner.tsx
 *
 * @author IT Department
 * @since FEAT-012 - Unified Loading System
 * @lastModified 2025-12-16
 */

import { forwardRef } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Spinner } from './Spinner';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends ButtonProps {
  /** 是否處於載入狀態 */
  isLoading?: boolean;
  /** 載入時顯示的文字（預設使用 children） */
  loadingText?: string;
  /** Spinner 位置 */
  spinnerPosition?: 'left' | 'right';
}

export const LoadingButton = forwardRef<HTMLButtonElement, LoadingButtonProps>(
  (
    {
      isLoading = false,
      loadingText,
      spinnerPosition = 'left',
      disabled,
      children,
      className,
      variant,
      ...props
    },
    ref
  ) => {
    // 根據 variant 決定 Spinner 顏色
    const spinnerColor = variant === 'outline' || variant === 'ghost' || variant === 'link'
      ? 'primary'
      : 'white';

    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        variant={variant}
        className={cn(
          isLoading && 'cursor-not-allowed',
          className
        )}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center">
            {spinnerPosition === 'left' && (
              <Spinner size="sm" color={spinnerColor} className="mr-2" />
            )}
            <span>{loadingText || children}</span>
            {spinnerPosition === 'right' && (
              <Spinner size="sm" color={spinnerColor} className="ml-2" />
            )}
          </span>
        ) : (
          children
        )}
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';
