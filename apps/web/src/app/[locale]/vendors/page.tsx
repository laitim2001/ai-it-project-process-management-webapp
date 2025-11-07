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

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { PaginationControls } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Building2, Mail, Phone, User, AlertCircle, LayoutGrid, List } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';

export default function VendorsPage() {
  const t = useTranslations('vendors');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  // 狀態管理
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'createdAt' | 'updatedAt'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  // 使用 ref 保持輸入框 focus
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // 在查詢完成後恢復搜索框焦點，避免用戶輸入時被打斷
  useEffect(() => {
    // 只在搜索框之前有焦點且查詢完成時才恢復焦點
    if (!isLoading && searchInputRef.current) {
      const activeElement = document.activeElement;
      // 如果當前焦點不在搜索框，且用戶正在輸入（search 不為空），則恢復焦點
      if (activeElement !== searchInputRef.current && search.length > 0) {
        const cursorPosition = searchInputRef.current.selectionStart;
        searchInputRef.current.focus();
        // 恢復光標位置
        if (cursorPosition !== null) {
          searchInputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        }
      }
    }
  }, [isLoading, debouncedSearch, search]);

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
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.loadError')}: {error.message}
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
                aria-label={tCommon('viewMode.card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label={tCommon('viewMode.list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/vendors/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 搜尋和排序欄 */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              ref={searchInputRef}
              type="text"
              placeholder={t('search.placeholder')}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1); // 搜索時重置到第一頁
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
            <option value="name-asc">{t('sort.nameAsc')}</option>
            <option value="name-desc">{t('sort.nameDesc')}</option>
            <option value="createdAt-desc">{tCommon('sort.createdAtDesc')}</option>
            <option value="createdAt-asc">{tCommon('sort.createdAtAsc')}</option>
            <option value="updatedAt-desc">{tCommon('sort.updatedAtDesc')}</option>
            <option value="updatedAt-asc">{tCommon('sort.updatedAtAsc')}</option>
          </Select>
        </div>

        {/* 結果計數 */}
        {pagination && (
          <div className="text-sm text-muted-foreground">
            {tCommon('pagination.showing', {
              from: ((pagination.page - 1) * pagination.limit) + 1,
              to: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })} {t('list.items')}
          </div>
        )}

        {/* 供應商顯示 - 根據視圖模式切換 */}
        {vendors.length === 0 ? (
          <Card className="p-8 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {search
                ? t('list.noResults')
                : t('list.empty')}
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
                        <span className="text-muted-foreground">{t('fields.quotesCount')}: </span>
                        <span className="font-medium text-foreground">
                          {vendor._count.quotes}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('fields.purchaseOrdersCount')}: </span>
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
                    <TableHead>{t('fields.name')}</TableHead>
                    <TableHead>{t('fields.contactPerson')}</TableHead>
                    <TableHead>{t('fields.email')}</TableHead>
                    <TableHead>{t('fields.phone')}</TableHead>
                    <TableHead className="text-center">{t('fields.quotesCount')}</TableHead>
                    <TableHead className="text-center">{t('fields.purchaseOrdersCount')}</TableHead>
                    <TableHead className="text-right">{tCommon('actions.actions')}</TableHead>
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
                          {tCommon('actions.view')}
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
