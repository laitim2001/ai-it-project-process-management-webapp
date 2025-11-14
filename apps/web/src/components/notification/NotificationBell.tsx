'use client';

/**
 * @fileoverview Notification Bell Component - 通知鈴鐺組件
 *
 * @description
 * 顯示通知鈴鐺圖示和未讀通知數量徽章，點擊開啟通知下拉選單。
 * 自動每 30 秒刷新未讀數量，支援點擊外部關閉下拉選單，
 * 提供即時通知提醒功能，整合在頂部導航欄中使用。
 *
 * @component NotificationBell
 *
 * @features
 * - 通知鈴鐺圖示按鈕（Bell 圖示）
 * - 未讀數量徽章顯示（超過 99 顯示 99+）
 * - 點擊開啟/關閉通知下拉選單
 * - 點擊外部自動關閉下拉選單
 * - 自動刷新未讀數量（30 秒間隔）
 * - 無障礙支援（ARIA labels）
 *
 * @stateManagement
 * - useState: 下拉選單開啟狀態（isOpen）
 * - useRef: 下拉選單 DOM 參考（dropdownRef）
 * - tRPC Query: 未讀通知數量（getUnreadCount）
 *
 * @example
 * ```tsx
 * // 在 TopBar 中使用
 * <NotificationBell />
 * ```
 *
 * @dependencies
 * - next-intl: 國際化翻譯
 * - lucide-react: Bell 圖示
 * - @/lib/trpc: tRPC 客戶端（API 查詢）
 * - NotificationDropdown: 通知下拉選單組件
 *
 * @related
 * - apps/web/src/components/notification/NotificationDropdown.tsx - 通知下拉選單
 * - apps/web/src/components/layout/TopBar.tsx - 頂部導航欄（使用此組件）
 * - packages/api/src/routers/notification.ts - 通知 API Router
 *
 * @author IT Department
 * @since Epic 8 - Notification System
 * @lastModified 2025-11-14
 */

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Bell } from 'lucide-react';
import { api } from '@/lib/trpc';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 獲取未讀通知數量
  const { data: unreadData } = api.notification.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: 30000, // 每30秒自動刷新
    }
  );

  const unreadCount = unreadData?.count ?? 0;

  // 點擊外部關閉下拉列表
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 通知鈴鐺按鈕 */}
      <button
        type="button"
        className="relative rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={t('aria.notifications')}
      >
        <Bell className="h-6 w-6" aria-hidden="true" />

        {/* 未讀數量徽章 */}
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 通知下拉列表 */}
      {isOpen && (
        <NotificationDropdown
          onClose={() => setIsOpen(false)}
          unreadCount={unreadCount}
        />
      )}
    </div>
  );
}
