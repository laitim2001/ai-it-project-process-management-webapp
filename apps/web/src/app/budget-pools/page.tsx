'use client';

import { useState } from 'react';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { Button, Input, Select, Pagination, BudgetPoolListSkeleton, useToast } from '@/components/ui';
import { useDebounce } from '@/hooks/useDebounce';
import { convertToCSV, downloadCSV, generateExportFilename } from '@/lib/exportUtils';

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
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold">Budget Pools</h1>
        </div>
        <BudgetPoolListSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-red-600">Error loading budget pools: {error.message}</p>
        </div>
      </div>
    );
  }

  const budgetPools = data?.items ?? [];
  const pagination = data?.pagination;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budget Pools</h1>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={handleExport}
            isLoading={isExporting}
            disabled={budgetPools.length === 0}
          >
            Export CSV
          </Button>
          <Link href="/budget-pools/new">
            <Button variant="primary">
              Create New Budget Pool
            </Button>
          </Link>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            type="text"
            placeholder="Search budget pools..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            fullWidth
          />
        </div>

        <Select
          value={yearFilter ?? ''}
          onChange={(e) => {
            setYearFilter(e.target.value ? parseInt(e.target.value) : undefined);
            setPage(1);
          }}
        >
          <option value="">All Years</option>
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
          <option value="year-desc">Year (Newest First)</option>
          <option value="year-asc">Year (Oldest First)</option>
          <option value="name-asc">Name (A-Z)</option>
          <option value="name-desc">Name (Z-A)</option>
          <option value="amount-desc">Amount (High to Low)</option>
          <option value="amount-asc">Amount (Low to High)</option>
        </Select>
      </div>

      {/* Results Count */}
      {pagination && (
        <div className="mb-4 text-sm text-gray-600">
          Showing {((pagination.page - 1) * pagination.limit) + 1} -{' '}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
          {pagination.total} budget pools
        </div>
      )}

      {/* Budget Pools Grid */}
      {budgetPools.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-8 text-center">
          <p className="text-gray-600">
            {search || yearFilter
              ? 'No budget pools found matching your criteria.'
              : 'No budget pools found. Create one to get started.'}
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {budgetPools.map((pool) => (
              <Link
                key={pool.id}
                href={`/budget-pools/${pool.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-6 transition hover:border-blue-500 hover:shadow-md"
              >
                <h2 className="mb-2 text-xl font-semibold">{pool.name}</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between">
                    <span>Financial Year:</span>
                    <span className="font-medium">{pool.financialYear}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Budget:</span>
                    <span className="font-medium">
                      ${pool.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Projects:</span>
                    <span className="font-medium">{pool._count.projects}</span>
                  </div>
                </div>
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
  );
}
