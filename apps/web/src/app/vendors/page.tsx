'use client';

/**
 * Vendor 列表頁面
 *
 * 功能說明:
 * - 供應商列表展示(分頁)
 * - 搜尋和排序功能
 * - 導航到詳情/新增/編輯頁面
 *
 * Epic 4 - Story 5.1: 管理供應商基本資訊
 */

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Plus, Building2, Mail, Phone, User } from 'lucide-react';

export default function VendorsPage() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { showToast } = useToast();

  // Debounce 搜尋避免過多 API 請求
  const debouncedSearch = useDebounce(search, 300);

  // 查詢供應商列表
  const { data, isLoading, error } = api.vendor.getAll.useQuery({
    page,
    limit: 10,
    search: debouncedSearch || undefined,
    sortBy,
    sortOrder,
  });

  // 載入骨架屏
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">供應商管理</h1>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 錯誤處理
  if (error) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">載入供應商失敗: {error.message}</p>
        </div>
      </DashboardLayout>
    );
  }

  const vendors = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>供應商管理</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">供應商管理</h1>
            <p className="mt-2 text-gray-600">管理和維護供應商資訊</p>
          </div>
          <Link href="/vendors/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增供應商
            </Button>
          </Link>
        </div>

        {/* 搜尋和排序欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="搜尋供應商名稱、聯絡人或郵箱..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                'name' | 'createdAt' | 'updatedAt',
                'asc' | 'desc'
              ];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="name-asc">名稱 (A-Z)</option>
            <option value="name-desc">名稱 (Z-A)</option>
            <option value="createdAt-desc">創建時間 (新到舊)</option>
            <option value="createdAt-asc">創建時間 (舊到新)</option>
            <option value="updatedAt-desc">更新時間 (新到舊)</option>
            <option value="updatedAt-asc">更新時間 (舊到新)</option>
          </Select>
        </div>

        {/* 結果計數 */}
        {pagination && (
          <div className="text-sm text-gray-600">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 個供應商
          </div>
        )}

        {/* 供應商卡片網格 */}
        {vendors.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">
              {search
                ? '找不到符合條件的供應商'
                : '尚未有任何供應商，點擊新增開始建立'}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.id}`}
                >
                  <Card className="p-6 transition hover:border-blue-500 hover:shadow-md h-full">
                    {/* 供應商名稱 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                        <h2 className="text-xl font-semibold text-gray-900">{vendor.name}</h2>
                      </div>
                    </div>

                    {/* 聯絡資訊 */}
                    <div className="space-y-2 text-sm">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{vendor.contactEmail}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-gray-600">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* 統計資訊 */}
                    <div className="mt-4 flex gap-4 pt-4 border-t border-gray-200 text-sm">
                      <div>
                        <span className="text-gray-600">報價單: </span>
                        <span className="font-medium text-gray-900">
                          {vendor._count.quotes}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">採購單: </span>
                        <span className="font-medium text-gray-900">
                          {vendor._count.purchaseOrders}
                        </span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
