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
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PaginationControls, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Building2, Mail, Phone, User, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function VendorsPage() {
  // 狀態管理
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
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
          <Skeleton className="h-5 w-64" />
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="flex gap-4">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-40" />
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
        <div className="space-y-8">
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
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  載入供應商失敗: {error.message}
                </AlertDescription>
              </Alert>
            </div>
          </div>
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
            <h1 className="text-3xl font-bold text-foreground">供應商管理</h1>
            <p className="mt-2 text-muted-foreground">管理和維護供應商資訊</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
                aria-label="卡片視圖"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label="列表視圖"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/vendors/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增供應商
              </Button>
            </Link>
          </div>
        </div>

        {/* 搜尋和排序欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="搜尋供應商名稱、聯絡人或郵箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
          <div className="text-sm text-muted-foreground">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 個供應商
          </div>
        )}

        {/* 供應商顯示 - 根據視圖模式切換 */}
        {vendors.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search
                ? '找不到符合條件的供應商'
                : '尚未有任何供應商，點擊新增開始建立'}
            </p>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-4 md:grid-cols-2">
              {vendors.map((vendor) => (
                <Link
                  key={vendor.id}
                  href={`/vendors/${vendor.id}`}
                >
                  <Card className="p-6 transition hover:border-primary hover:shadow-md h-full">
                    {/* 供應商名稱 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                        <h2 className="text-xl font-semibold text-foreground">{vendor.name}</h2>
                      </div>
                    </div>

                    {/* 聯絡資訊 */}
                    <div className="space-y-2 text-sm">
                      {vendor.contactPerson && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{vendor.contactPerson}</span>
                        </div>
                      )}
                      {vendor.contactEmail && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="h-4 w-4" />
                          <span className="truncate">{vendor.contactEmail}</span>
                        </div>
                      )}
                      {vendor.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{vendor.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* 統計資訊 */}
                    <div className="mt-4 flex gap-4 pt-4 border-t border-border text-sm">
                      <div>
                        <span className="text-muted-foreground">報價單: </span>
                        <span className="font-medium text-foreground">
                          {vendor._count.quotes}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">採購單: </span>
                        <span className="font-medium text-foreground">
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
              <PaginationControls
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
              />
            )}
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>供應商名稱</TableHead>
                    <TableHead>聯絡人</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>電話</TableHead>
                    <TableHead className="text-center">報價數量</TableHead>
                    <TableHead className="text-center">採購單數量</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendors.map((vendor) => (
                    <TableRow key={vendor.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="font-medium text-primary hover:underline flex items-center gap-2"
                        >
                          <Building2 className="h-4 w-4" />
                          {vendor.name}
                        </Link>
                      </TableCell>
                      <TableCell>{vendor.contactPerson || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{vendor.contactEmail || '-'}</TableCell>
                      <TableCell>{vendor.phone || '-'}</TableCell>
                      <TableCell className="text-center">{vendor._count.quotes}</TableCell>
                      <TableCell className="text-center">{vendor._count.purchaseOrders}</TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/vendors/${vendor.id}`}
                          className="text-primary hover:underline"
                        >
                          查看
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* 分頁 */}
            {pagination && pagination.totalPages > 1 && (
              <PaginationControls
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
