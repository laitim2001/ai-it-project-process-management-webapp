'use client';

/**
 * NotificationBell Component
 * Epic 8 - Story 8.2: 通知鈴鐺組件
 *
 * 功能:
 * - 顯示通知鈴鐺圖標
 * - 顯示未讀通知數量徽章
 * - 點擊打開通知下拉列表
 */

import { useState, useRef, useEffect } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { api } from '~/lib/trpc';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
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
        aria-label="通知"
      >
        <BellIcon className="h-6 w-6" aria-hidden="true" />

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
