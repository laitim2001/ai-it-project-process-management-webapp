'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Pagination, BudgetPoolListSkeleton, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card } from '@/components/ui/card';
import { Plus, Download } from 'lucide-react';

export default function BudgetPoolsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<number | undefined>(undefined);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'name' | 'year' | 'amount'>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isExporting, setIsExporting] = useState(false);
  const { showToast } = useToast();
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

      showToast('Export successful!', 'success');
    } catch (error) {
      showToast('Export failed. Please try again.', 'error');
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
        <div className="rounded-lg border border-destructive bg-destructive/10 p-8 text-center">
          <p className="text-destructive">Error loading budget pools: {error.message}</p>
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

        {/* Budget Pools Grid */}
        {budgetPools.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {search || yearFilter
                ? '找不到符合條件的預算池'
                : '尚未有任何預算池，點擊新增開始建立'}
            </p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgetPools.map((pool) => (
                <Link
                  key={pool.id}
                  href={`/budget-pools/${pool.id}`}
                >
                  <Card className="p-6 transition hover:border-primary hover:shadow-md h-full">
                    <h2 className="mb-3 text-xl font-semibold text-foreground">{pool.name}</h2>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">財務年度</span>
                        <span className="font-medium text-foreground">{pool.financialYear}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">總預算</span>
                        <span className="font-medium text-foreground">
                          ${pool.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">專案數量</span>
                        <span className="font-medium text-foreground">{pool._count.projects}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Pagination */}
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
