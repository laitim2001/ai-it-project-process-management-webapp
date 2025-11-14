/**
 * @fileoverview Notifications List Page - 通知中心頁面
 *
 * @description
 * 顯示使用者所有通知的列表，支援已讀/未讀過濾、通知標記和刪除功能。
 * 整合提案和費用審批通知，提供快速跳轉到相關頁面的功能。
 * 支援即時更新和分頁載入，提供完整的通知管理體驗。
 *
 * @page /[locale]/notifications
 *
 * @features
 * - 通知列表展示（時間倒序排列）
 * - 已讀/未讀狀態過濾
 * - 通知類型圖示（提案、費用、系統）
 * - 即時時間顯示（相對時間，如「2 小時前」）
 * - 標記為已讀功能（單一或批量標記）
 * - 刪除通知功能（單一或批量刪除）
 * - 快速跳轉到相關頁面（提案詳情、費用詳情）
 * - 分頁載入（無限滾動或分頁導航）
 * - 未讀通知計數顯示
 * - 通知類型徽章（不同顏色標示不同類型）
 *
 * @permissions
 * - All authenticated users: 查看自己的通知
 *
 * @routing
 * - 通知列表頁: /notifications
 * - 相關提案頁: /proposals/[id]
 * - 相關費用頁: /expenses/[id]
 *
 * @stateManagement
 * - URL Query Params: 過濾狀態（已讀/未讀）
 * - React Query: 資料快取和即時更新
 * - Local State: 選中的通知、過濾狀態
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Card, Badge, Button, Alert
 * - lucide-react: 圖示庫
 * - date-fns: 日期格式化
 *
 * @related
 * - packages/api/src/routers/notification.ts - 通知 API Router
 * - apps/web/src/components/notification/NotificationBell.tsx - 通知鈴鐺組件
 * - apps/web/src/components/notification/NotificationDropdown.tsx - 通知下拉組件
 * - packages/db/prisma/schema.prisma - Notification 資料模型
 *
 * @author IT Department
 * @since Epic 8 - Notification System
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from "@/i18n/routing";
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { api } from '@/lib/trpc';
import {
  BellRing as BellAlertIcon,
  FileText as DocumentTextIcon,
  DollarSign as CurrencyDollarIcon,
  Trash2 as TrashIcon,
  Check as CheckIcon,
} from 'lucide-react';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const tCommon = useTranslations('common');
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const utils = api.useUtils();

  // 獲取通知列表
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.notification.getAll.useInfiniteQuery(
      {
        limit: 20,
        isRead: filter === 'all' ? undefined : filter === 'read',
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

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

  // 刪除通知
  const deleteNotification = api.notification.delete.useMutation({
    onSuccess: () => {
      void utils.notification.getAll.invalidate();
      void utils.notification.getUnreadCount.invalidate();
    },
  });

  const notifications = data?.pages.flatMap((page) => page.notifications) ?? [];

  // 獲取通知圖標
  const getNotificationIcon = (type: string) => {
    if (type.includes('PROPOSAL')) {
      return <DocumentTextIcon className="h-6 w-6 text-primary" />;
    }
    if (type.includes('EXPENSE')) {
      return <CurrencyDollarIcon className="h-6 w-6 text-green-500" />;
    }
    return <BellAlertIcon className="h-6 w-6 text-muted-foreground" />;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('description')}</p>
      </div>

      {/* 篩選和操作列 */}
      <div className="mb-4 flex items-center justify-between">
        {/* 篩選按鈕 */}
        <div className="flex space-x-2">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground ring-1 ring-inset ring-border hover:bg-muted'
            }`}
            onClick={() => setFilter('all')}
          >
            {t('filters.all')}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'unread'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground ring-1 ring-inset ring-border hover:bg-muted'
            }`}
            onClick={() => setFilter('unread')}
          >
            {t('filters.unread')}
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'read'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background text-foreground ring-1 ring-inset ring-border hover:bg-muted'
            }`}
            onClick={() => setFilter('read')}
          >
            {t('filters.read')}
          </button>
        </div>

        {/* 標記所有為已讀 */}
        {filter !== 'read' && notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckIcon className="mr-1.5 h-4 w-4" />
            {t('actions.markAllRead')}
          </button>
        )}
      </div>

      {/* 通知列表 */}
      {isLoading ? (
        <div className="rounded-lg bg-background p-12 text-center shadow">
          <p className="text-sm text-muted-foreground">{t('states.loading')}</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg bg-background p-12 text-center shadow">
          <BellAlertIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'all'
              ? t('states.empty.all')
              : filter === 'unread'
                ? t('states.empty.unread')
                : t('states.empty.read')}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg bg-background shadow transition-colors hover:bg-muted ${
                !notification.isRead ? 'ring-2 ring-primary ring-opacity-50' : ''
              }`}
            >
              <div className="p-4">
                <div className="flex items-start justify-between">
                  {/* 左側: 圖標和內容 */}
                  <div className="flex items-start space-x-4">
                    {/* 圖標 */}
                    <div className="flex-shrink-0">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* 內容 */}
                    <div className="min-w-0 flex-1">
                      <h3
                        className={`text-sm ${
                          !notification.isRead
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-muted-foreground'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="mt-1 text-sm text-foreground/80">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                          locale: zhTW,
                        })}
                      </p>

                      {/* 操作按鈕 */}
                      <div className="mt-3 flex items-center space-x-4">
                        {notification.link && (
                          <Link
                            href={notification.link}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead.mutate({ id: notification.id });
                              }
                            }}
                          >
                            {t('actions.viewDetails')} →
                          </Link>
                        )}
                        {!notification.isRead && (
                          <button
                            type="button"
                            className="text-sm font-medium text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              markAsRead.mutate({ id: notification.id })
                            }
                            disabled={markAsRead.isPending}
                          >
                            {t('actions.markAsRead')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右側: 刪除按鈕 */}
                  <button
                    type="button"
                    className="ml-4 flex-shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() =>
                      deleteNotification.mutate({ id: notification.id })
                    }
                    disabled={deleteNotification.isPending}
                    aria-label={t('actions.delete')}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 加載更多按鈕 */}
      {hasNextPage && (
        <div className="mt-6 text-center">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-background px-4 py-2 text-sm font-medium text-foreground shadow ring-1 ring-inset ring-border hover:bg-muted disabled:opacity-50"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? t('states.loading') : t('states.loadMore')}
          </button>
        </div>
      )}
    </div>
  );
}
