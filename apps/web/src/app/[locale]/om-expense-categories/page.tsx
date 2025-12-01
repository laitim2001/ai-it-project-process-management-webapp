/**
 * @fileoverview OM Expense Categories List Page - OM 費用類別列表頁面
 *
 * @description
 * 顯示所有 OM 費用類別的列表頁面。
 * 支援搜尋、過濾、分頁和 CRUD 操作。
 *
 * @page /[locale]/om-expense-categories
 *
 * @features
 * - 費用類別表格顯示
 * - 搜尋功能（代碼、名稱）
 * - 啟用/停用過濾
 * - 分頁功能
 * - 新增、編輯、刪除操作
 * - 顯示關聯 OM 費用數量
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

'use client';

import { Plus, Search, Tags, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { OMExpenseCategoryActions } from '@/components/om-expense-category';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';


export default function OMExpenseCategoriesPage() {
  const t = useTranslations('omExpenseCategories');
  const tCommon = useTranslations('common');

  // 狀態
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const debouncedSearch = useDebounce(search, 300);
  const limit = 10;

  // 查詢參數
  const queryParams = {
    page,
    limit,
    search: debouncedSearch || undefined,
    isActive: statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined,
    includeInactive: statusFilter === 'all',
  };

  // API 查詢
  const { data, isLoading, refetch } = api.omExpenseCategory.getAll.useQuery(queryParams);

  // 處理狀態過濾變更
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setPage(1);
  };

  // 處理搜尋變更
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Tags className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('title')}</h1>
              <p className="text-muted-foreground">{t('description')}</p>
            </div>
          </div>
          <Link href="/om-expense-categories/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('actions.create')}
            </Button>
          </Link>
        </div>

        {/* 過濾器 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('filters.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              {/* 搜尋 */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('search.placeholder')}
                  value={search}
                  onChange={handleSearchChange}
                  className="pl-9"
                />
              </div>

              {/* 狀態過濾 */}
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full sm:w-[180px]"
              >
                <option value="all">{t('filters.all')}</option>
                <option value="active">{t('status.active')}</option>
                <option value="inactive">{t('status.inactive')}</option>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* 類別列表 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {t('table.title')}
              {data && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  ({tCommon('pagination.total', { count: data.total })})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : data?.categories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Tags className="h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">{t('empty.title')}</h3>
                <p className="mt-2 text-muted-foreground">{t('empty.description')}</p>
                <Link href="/om-expense-categories/new" className="mt-4">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    {t('actions.create')}
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('table.code')}</TableHead>
                      <TableHead>{t('table.name')}</TableHead>
                      <TableHead>{t('table.description')}</TableHead>
                      <TableHead className="text-center">{t('table.omExpenses')}</TableHead>
                      <TableHead className="text-center">{t('table.status')}</TableHead>
                      <TableHead className="text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.categories.map((category) => (
                      <TableRow key={category.id}>
                        <TableCell className="font-mono font-medium">{category.code}</TableCell>
                        <TableCell className="font-medium">{category.name}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="secondary">{category._count.omExpenses}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant={category.isActive ? 'default' : 'outline'}>
                            {category.isActive ? t('status.active') : t('status.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <OMExpenseCategoryActions
                            category={category}
                            onActionComplete={() => refetch()}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* 分頁 */}
                {data && data.totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                      {tCommon('pagination.showing', {
                        from: (page - 1) * limit + 1,
                        to: Math.min(page * limit, data.total),
                        total: data.total,
                      })}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        {tCommon('pagination.previous')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                        disabled={page === data.totalPages}
                      >
                        {tCommon('pagination.next')}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
