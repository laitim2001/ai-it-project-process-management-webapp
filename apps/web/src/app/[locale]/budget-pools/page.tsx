'use client';

import { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { PaginationControls, BudgetPoolListSkeleton } from '@/components/ui';
import { useToast } from '@/components/ui/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Download, Wallet, AlertCircle, LayoutGrid, List } from 'lucide-react';

export default function BudgetPoolsPage() {
  const t = useTranslations('budgetPools');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
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

  // 使用 ref 保持輸入框 focus
  const searchInputRef = useRef<HTMLInputElement>(null);

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
        title: tCommon('messages.success'),
        description: t('messages.exportSuccess'),
        variant: 'success',
      });
    } catch (error) {
      toast({
        title: tCommon('messages.error'),
        description: t('messages.exportError'),
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
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
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
                <BreadcrumbLink asChild><Link href="/dashboard">{tNav('home')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {tCommon('errors.loadingError')}{error.message}{tCommon('errors.tryAgain')}
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('home')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
                aria-label={t('views.card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
                aria-label={t('views.list')}
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
              {isExporting ? tCommon('actions.exporting') : tCommon('actions.exportCSV')}
            </Button>
            <Link href="/budget-pools/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Search and Filter Bar */}
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
            value={yearFilter ?? ''}
            onChange={(e) => {
              setYearFilter(e.target.value ? parseInt(e.target.value) : undefined);
              setPage(1);
            }}
          >
            <option value="">{t('filters.allYears')}</option>
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
            <option value="year-desc">{t('sort.yearDesc')}</option>
            <option value="year-asc">{t('sort.yearAsc')}</option>
            <option value="name-asc">{t('sort.nameAsc')}</option>
            <option value="name-desc">{t('sort.nameDesc')}</option>
            <option value="amount-desc">{t('sort.amountDesc')}</option>
            <option value="amount-asc">{t('sort.amountAsc')}</option>
          </Select>
        </div>

        {/* Results Count */}
        {pagination && (
          <div className="text-sm text-muted-foreground">
            {t('list.showing', {
              start: ((pagination.page - 1) * pagination.limit) + 1,
              end: Math.min(pagination.page * pagination.limit, pagination.total),
              total: pagination.total
            })}
          </div>
        )}

        {/* Budget Pools Display - 根據視圖模式切換 */}
        {budgetPools.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center">
              <Wallet className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground font-medium mb-2">
                {search || yearFilter
                  ? t('list.noResults')
                  : t('list.empty')}
              </p>
              {!search && !yearFilter && (
                <p className="text-sm text-muted-foreground">
                  {t('list.emptyHint')}
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
                          <span className="text-muted-foreground">{t('fields.fiscalYear')}</span>
                          <span className="font-medium text-foreground">FY {pool.financialYear}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fields.categoryCount')}</span>
                          <span className="font-medium text-foreground">{categoryCount} {t('fields.categories')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fields.totalBudget')}</span>
                          <span className="font-medium text-foreground">
                            ${(pool.computedTotalAmount ?? pool.totalAmount).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fields.used')}</span>
                          <span className="font-medium text-foreground">
                            ${(pool.computedUsedAmount ?? 0).toLocaleString('en-US', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fields.utilizationRate')}</span>
                          <span className={`font-medium ${
                            utilizationRate > 90 ? 'text-destructive' :
                            utilizationRate > 75 ? 'text-yellow-600 dark:text-yellow-500' :
                            'text-green-600 dark:text-green-500'
                          }`}>
                            {utilizationRate.toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t('fields.projectCount')}</span>
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
                    <TableHead>{t('table.name')}</TableHead>
                    <TableHead>{t('table.fiscalYear')}</TableHead>
                    <TableHead className="text-center">{t('table.categoryCount')}</TableHead>
                    <TableHead className="text-right">{t('table.totalBudget')}</TableHead>
                    <TableHead className="text-right">{t('table.used')}</TableHead>
                    <TableHead className="text-right">{t('table.utilizationRate')}</TableHead>
                    <TableHead className="text-center">{t('table.projectCount')}</TableHead>
                    <TableHead className="text-right">{tCommon('table.actions')}</TableHead>
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
                            {tCommon('actions.view')}
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
