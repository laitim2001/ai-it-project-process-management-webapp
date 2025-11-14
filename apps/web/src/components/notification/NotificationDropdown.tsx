'use client';

/**
 * @fileoverview Notification Dropdown Component - 通知下拉選單組件
 *
 * @description
 * 顯示最近的通知列表（最多 10 條），支援標記為已讀、跳轉詳情頁面和標記所有為已讀。
 * 使用彈出視窗展示通知內容，提供圖示、時間戳和已讀狀態視覺化，
 * 整合相對時間顯示（date-fns），提供完整的通知管理功能。
 *
 * @component NotificationDropdown
 *
 * @features
 * - 最近通知列表展示（限制 10 條）
 * - 通知類型圖示顯示（提案/費用/一般）
 * - 相對時間顯示（date-fns formatDistanceToNow）
 * - 未讀/已讀視覺化區分（背景色）
 * - 點擊通知標記為已讀
 * - 點擊通知跳轉詳情頁面
 * - 標記所有為已讀按鈕
 * - 查看全部通知連結
 * - 載入和空狀態處理
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {() => void} props.onClose - 關閉下拉選單回調
 * @param {number} props.unreadCount - 未讀通知數量（傳遞自 NotificationBell）
 *
 * @example
 * ```tsx
 * <NotificationDropdown
 *   onClose={() => setIsOpen(false)}
 *   unreadCount={5}
 * />
 * ```
 *
 * @notificationTypes
 * - PROPOSAL_*: 提案相關通知（藍色 DocumentText 圖示）
 * - EXPENSE_*: 費用相關通知（綠色 CurrencyDollar 圖示）
 * - 其他: 一般通知（灰色 BellAlert 圖示）
 *
 * @dependencies
 * - next-intl: 國際化翻譯
 * - date-fns: 時間格式化（formatDistanceToNow, zhTW）
 * - lucide-react: 圖示組件（Check, BellRing, FileText, DollarSign）
 * - @/lib/trpc: tRPC 客戶端（查詢和 mutation）
 * - @/i18n/routing: 國際化路由（Link）
 *
 * @related
 * - apps/web/src/components/notification/NotificationBell.tsx - 通知鈴鐺組件
 * - packages/api/src/routers/notification.ts - 通知 API Router
 * - apps/web/src/app/[locale]/notifications/page.tsx - 通知列表頁面
 *
 * @author IT Department
 * @since Epic 8 - Notification System
 * @lastModified 2025-11-14
 */

import { Fragment } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import {
  Check as CheckIcon,
  BellRing as BellAlertIcon,
  FileText as DocumentTextIcon,
  DollarSign as CurrencyDollarIcon,
} from 'lucide-react';

interface NotificationDropdownProps {
  onClose: () => void;
  unreadCount: number;
}

export function NotificationDropdown({
  onClose,
  unreadCount,
}: NotificationDropdownProps) {
  const t = useTranslations('notifications');
  const utils = api.useUtils();

  // 獲取最近的通知 (限制10條)
  const { data: notificationsData, isLoading } =
    api.notification.getAll.useQuery({
      limit: 10,
    });

  // 標記為已讀
  const markAsRead = api.notification.markAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getAll.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  // 標記所有為已讀
  const markAllAsRead = api.notification.markAllAsRead.useMutation({
    onSuccess: () => {
      void utils.notification.getAll.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  const notifications = notificationsData?.notifications ?? [];

  // 處理通知點擊
  const handleNotificationClick = (
    notificationId: string,
    isRead: boolean,
    link?: string | null
  ) => {
    if (!isRead) {
      markAsRead.mutate({ id: notificationId });
    }
    if (link) {
      onClose();
    }
  };

  // 獲取通知圖標
  const getNotificationIcon = (type: string) => {
    if (type.includes('PROPOSAL')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }
    if (type.includes('EXPENSE')) {
      return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
    }
    return <BellAlertIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="absolute right-0 z-50 mt-2 w-96 rounded-lg border border-gray-200 bg-white shadow-lg ring-1 ring-black ring-opacity-5">
      {/* 標題列 */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h3 className="text-base font-semibold text-gray-900">{t('dropdown.title')}</h3>
        {unreadCount > 0 && (
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-800"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            {t('dropdown.markAllRead')}
          </button>
        )}
      </div>

      {/* 通知列表 */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            {t('dropdown.loading')}
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-gray-500">
            {t('dropdown.empty')}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {notifications.map((notification) => (
              <li key={notification.id}>
                {notification.link ? (
                  <Link
                    href={notification.link}
                    className={`block px-4 py-3 transition-colors hover:bg-gray-50 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                    onClick={() =>
                      handleNotificationClick(
                        notification.id,
                        notification.isRead,
                        notification.link
                      )
                    }
                  >
                    <NotificationItem notification={notification} />
                  </Link>
                ) : (
                  <div
                    className={`px-4 py-3 ${
                      !notification.isRead ? 'bg-blue-50' : ''
                    }`}
                  >
                    <NotificationItem notification={notification} />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 查看全部 */}
      <div className="border-t border-gray-200 px-4 py-3">
        <Link
          href="/notifications"
          className="block text-center text-sm font-medium text-blue-600 hover:text-blue-800"
          onClick={onClose}
        >
          {t('dropdown.viewAll')}
        </Link>
      </div>
    </div>
  );
}

// 通知項目組件
function NotificationItem({
  notification,
}: {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: Date;
  };
}) {
  const getNotificationIcon = (type: string) => {
    if (type.includes('PROPOSAL')) {
      return <DocumentTextIcon className="h-5 w-5 text-blue-500" />;
    }
    if (type.includes('EXPENSE')) {
      return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
    }
    return <BellAlertIcon className="h-5 w-5 text-gray-500" />;
  };

  return (
    <div className="flex items-start space-x-3">
      {/* 圖標 */}
      <div className="flex-shrink-0">{getNotificationIcon(notification.type)}</div>

      {/* 內容 */}
      <div className="min-w-0 flex-1">
        <p
          className={`text-sm ${
            !notification.isRead
              ? 'font-semibold text-gray-900'
              : 'font-medium text-gray-700'
          }`}
        >
          {notification.title}
        </p>
        <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
        <p className="mt-1 text-xs text-gray-500">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: zhTW,
          })}
        </p>
      </div>

      {/* 未讀標記 */}
      {!notification.isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-blue-600"></div>
        </div>
      )}
    </div>
  );
}
