/**
 * @fileoverview Notification Module Exports - 通知模組導出
 *
 * @description
 * 統一導出通知相關組件，提供簡化的導入路徑。
 * 包含通知鈴鐺組件和通知下拉選單組件，方便其他模組使用。
 *
 * @module components/notification
 *
 * @exports
 * - NotificationBell: 通知鈴鐺組件（顯示未讀數量徽章）
 * - NotificationDropdown: 通知下拉選單組件（顯示通知列表）
 *
 * @usage
 * ```tsx
 * // 使用方式 1: 從模組導入
 * import { NotificationBell, NotificationDropdown } from '@/components/notification';
 *
 * // 使用方式 2: 直接導入（如需單獨使用）
 * import { NotificationBell } from '@/components/notification/NotificationBell';
 * ```
 *
 * @related
 * - apps/web/src/components/notification/NotificationBell.tsx - 通知鈴鐺組件
 * - apps/web/src/components/notification/NotificationDropdown.tsx - 通知下拉選單組件
 * - apps/web/src/components/layout/TopBar.tsx - TopBar 組件（使用通知鈴鐺）
 *
 * @author IT Department
 * @since Epic 8 - Notification System
 * @lastModified 2025-11-14
 */

export { NotificationBell } from './NotificationBell';
export { NotificationDropdown } from './NotificationDropdown';
