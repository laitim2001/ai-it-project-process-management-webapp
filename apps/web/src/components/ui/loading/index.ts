/**
 * @fileoverview Loading Components Index - 載入組件統一導出
 *
 * @description
 * 統一導出所有載入相關組件，提供集中式的匯入入口。
 *
 * @module components/ui/loading
 *
 * @components
 * - Spinner: 通用旋轉載入指示器
 * - LoadingButton: 帶載入狀態的按鈕
 * - LoadingOverlay: 區域載入遮罩
 * - GlobalProgress: 全局頂部進度條
 *
 * @example
 * ```tsx
 * // 單一導入
 * import { Spinner } from '@/components/ui/loading';
 *
 * // 多個導入
 * import { Spinner, LoadingButton, LoadingOverlay, GlobalProgress } from '@/components/ui/loading';
 *
 * // 類型導入
 * import { type SpinnerProps, type LoadingButtonProps } from '@/components/ui/loading';
 * ```
 *
 * @author IT Department
 * @since FEAT-012 - Unified Loading System
 * @lastModified 2025-12-16
 */

// Spinner
export { Spinner } from './Spinner';
export type { SpinnerProps } from './Spinner';

// LoadingButton
export { LoadingButton } from './LoadingButton';
export type { LoadingButtonProps } from './LoadingButton';

// LoadingOverlay
export { LoadingOverlay } from './LoadingOverlay';
export type { LoadingOverlayProps } from './LoadingOverlay';

// GlobalProgress
export { GlobalProgress } from './GlobalProgress';
export type { GlobalProgressProps } from './GlobalProgress';
