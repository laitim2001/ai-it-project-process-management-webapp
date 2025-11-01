'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaginationControls, BudgetPoolListSkeleton, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Download, Wallet, AlertCircle, LayoutGrid, List } from 'lucide-react';

export default function BudgetPoolsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'amount'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const { toast } = useToast();
  const utils = api.useContext();

  // Debounce search to avoid too many API calls
  const debouncedSearch = useDebounce(search, 300);

  const { data, isLoading, error } = api.budgetPool.getAll.useQuery({
    page,
    limit: 9,
    search: debouncedSearch || undefined,
    year: yearFilter,
    sortBy,
    sortOrder,
  });

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Export handler
  const handleExport = async () => {
    try {
      setIsExporting(true);

      // Use tRPC client to fetch export data
      const exportData = await utils.client.budgetPool.export.query({
        search: debouncedSearch || undefined,
        year: yearFilter,
        minAmount: minAmount,
        maxAmount: maxAmount,
      });

      // Convert to CSV and download
      const csvContent = convertToCSV(exportData);
      const filename = generateExportFilename('budget-pools');
      downloadCSV(csvContent, filename);

      toast({
        title: '成功',
        description: '資料匯出成功！',
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: '錯誤',
        description: '資料匯出失敗，請稍後再試',
        variant: 'destructive',
      });
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">預算池</h1>
          </div>
          <BudgetPoolListSkeleton />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb */}
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>預算池</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                載入預算池時發生錯誤：{error.message}。請稍後再試或聯繫系統管理員。
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const budgetPools = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>預算池</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">預算池</h1>
            <p className="mt-2 text-muted-foreground">管理財務年度預算池</p>
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
            <Button
              variant="outline"
              onClick={handleExport}
              disabled={isExporting || budgetPools.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              {isExporting ? '匯出中...' : '匯出 CSV'}
            </Button>
            <Link href="/budget-pools/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                新增預算池
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <Input
              type="text"
              placeholder="搜尋預算池..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <Select
            value={yearFilter ?? ''}
            onChange={(e) => {
              setYearFilter(e.target.value ? parseInt(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">所有年度</option>
            {years.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </Select>

          <Select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [newSortBy, newSortOrder] = e.target.value.split('-') as [
                'name' | 'year' | 'amount',
                'asc' | 'desc'
              ];
              setSortBy(newSortBy);
              setSortOrder(newSortOrder);
            }}
          >
            <option value="year-desc">年度 (新到舊)</option>
            <option value="year-asc">年度 (舊到新)</option>
            <option value="name-asc">名稱 (A-Z)</option>
            <option value="name-desc">名稱 (Z-A)</option>
            <option value="amount-desc">金額 (高到低)</option>
            <option value="amount-asc">金額 (低到高)</option>
          </Select>
        </div>

        {/* Results Count */}
        {pagination && (
          <div className="text-sm text-muted-foreground">
            顯示 {((pagination.page - 1) * pagination.limit) + 1} -{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} / {pagination.total} 個預算池
          </div>
        )}

        {/* Budget Pools Display - 根據視圖模式切換 */}
        {budgetPools.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium mb-2">
                {search || yearFilter
                  ? '找不到符合條件的預算池'
                  : '尚未有任何預算池'}
              </p>
              {!search && !yearFilter && (
                <p className="text-sm text-muted-foreground">
                  點擊上方「新增預算池」按鈕開始建立
                </p>
              )}
            </div>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetPools.map((pool) => {
                const utilizationRate = pool.utilizationRate ?? 0;
                const categoryCount = pool.categories?.length ?? 0;

                return (
                  <Link
                    key={pool.id}
                    href={`/budget-pools/${pool.id}`}
                  >
                    <Card className="p-6 transition hover:border-primary hover:shadow-md h-full">
                      <h2 className="mb-3 text-xl font-semibold text-foreground">{pool.name}</h2>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">財務年度</span>
                          <span className="font-medium text-foreground">FY {pool.financialYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">類別數量</span>
                          <span className="font-medium text-foreground">{categoryCount} 個類別</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">總預算</span>
                          <span className="font-medium text-foreground">
                            ${(pool.computedTotalAmount ?? pool.totalAmount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">已使用</span>
                          <span className="font-medium text-foreground">
                            ${(pool.computedUsedAmount ?? 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">使用率</span>
                          <span className={`font-medium ${
                            utilizationRate > 90 ? 'text-destructive' :
                            utilizationRate > 75 ? 'text-yellow-600 dark:text-yellow-500' :
                            'text-green-600 dark:text-green-500'
                          }`}>
                            {utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">專案數量</span>
                          <span className="font-medium text-foreground">{pool._count.projects}</span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* Pagination */}
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
                    <TableHead>預算池名稱</TableHead>
                    <TableHead>財務年度</TableHead>
                    <TableHead className="text-center">類別數量</TableHead>
                    <TableHead className="text-right">總預算</TableHead>
                    <TableHead className="text-right">已使用</TableHead>
                    <TableHead className="text-right">使用率</TableHead>
                    <TableHead className="text-center">專案數</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {budgetPools.map((pool) => {
                    const utilizationRate = pool.utilizationRate ?? 0;
                    const categoryCount = pool.categories?.length ?? 0;

                    return (
                      <TableRow key={pool.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Link
                            href={`/budget-pools/${pool.id}`}
                            className="font-medium text-primary hover:underline"
                          >
                            {pool.name}
                          </Link>
                        </TableCell>
                        <TableCell>FY {pool.financialYear}</TableCell>
                        <TableCell className="text-center">{categoryCount}</TableCell>
                        <TableCell className="text-right font-medium">
                          ${(pool.computedTotalAmount ?? pool.totalAmount).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          ${(pool.computedUsedAmount ?? 0).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-medium ${
                            utilizationRate > 90 ? 'text-destructive' :
                            utilizationRate > 75 ? 'text-yellow-600 dark:text-yellow-500' :
                            'text-green-600 dark:text-green-500'
                          }`}>
                            {utilizationRate.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{pool._count.projects}</TableCell>
                        <TableCell className="text-right">
                          <Link
                            href={`/budget-pools/${pool.id}`}
                            className="text-primary hover:underline"
                          >
                            查看
                          </Link>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
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
