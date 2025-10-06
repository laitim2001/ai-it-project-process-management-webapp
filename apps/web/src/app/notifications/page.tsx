'use client';

/**
 * Notifications Page
 * Epic 8 - Story 8.2: 通知列表頁面
 *
 * 功能:
 * - 顯示所有通知 (分頁加載)
 * - 篩選已讀/未讀通知
 * - 標記通知為已讀
 * - 刪除通知
 * - 跳轉到相關頁面
 */

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { api } from '~/lib/trpc';
import {
  BellAlertIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  TrashIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

export default function NotificationsPage() {
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
      return <DocumentTextIcon className="h-6 w-6 text-blue-500" />;
    }
    if (type.includes('EXPENSE')) {
      return <CurrencyDollarIcon className="h-6 w-6 text-green-500" />;
    }
    return <BellAlertIcon className="h-6 w-6 text-gray-500" />;
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">通知中心</h1>
        <p className="mt-1 text-sm text-gray-600">查看和管理您的通知</p>
      </div>

      {/* 篩選和操作列 */}
      <div className="mb-4 flex items-center justify-between">
        {/* 篩選按鈕 */}
        <div className="flex space-x-2">
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'unread'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('unread')}
          >
            未讀
          </button>
          <button
            type="button"
            className={`rounded-md px-3 py-1.5 text-sm font-medium ${
              filter === 'read'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => setFilter('read')}
          >
            已讀
          </button>
        </div>

        {/* 標記所有為已讀 */}
        {filter !== 'read' && notifications.some((n) => !n.isRead) && (
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            onClick={() => markAllAsRead.mutate()}
            disabled={markAllAsRead.isPending}
          >
            <CheckIcon className="mr-1.5 h-4 w-4" />
            標記全部已讀
          </button>
        )}
      </div>

      {/* 通知列表 */}
      {isLoading ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <p className="text-sm text-gray-500">載入中...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="rounded-lg bg-white p-12 text-center shadow">
          <BellAlertIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            {filter === 'all'
              ? '暫無通知'
              : filter === 'unread'
                ? '暫無未讀通知'
                : '暫無已讀通知'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-lg bg-white shadow transition-colors hover:bg-gray-50 ${
                !notification.isRead ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
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
                            ? 'font-semibold text-gray-900'
                            : 'font-medium text-gray-700'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
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
                            className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            onClick={() => {
                              if (!notification.isRead) {
                                markAsRead.mutate({ id: notification.id });
                              }
                            }}
                          >
                            查看詳情 →
                          </Link>
                        )}
                        {!notification.isRead && (
                          <button
                            type="button"
                            className="text-sm font-medium text-gray-600 hover:text-gray-800"
                            onClick={() =>
                              markAsRead.mutate({ id: notification.id })
                            }
                            disabled={markAsRead.isPending}
                          >
                            標記為已讀
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 右側: 刪除按鈕 */}
                  <button
                    type="button"
                    className="ml-4 flex-shrink-0 text-gray-400 hover:text-red-600"
                    onClick={() =>
                      deleteNotification.mutate({ id: notification.id })
                    }
                    disabled={deleteNotification.isPending}
                    aria-label="刪除通知"
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
            className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? '載入中...' : '加載更多'}
          </button>
        </div>
      )}
    </div>
  );
}
