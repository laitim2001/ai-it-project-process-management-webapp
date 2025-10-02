'use client';

import { useState } from 'react';

interface FilterState {
  search: string;
  year?: number;
  minAmount?: number;
  maxAmount?: number;
  sortBy: 'name' | 'year' | 'amount';
  sortOrder: 'asc' | 'desc';
}

interface BudgetPoolFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
}

export function BudgetPoolFilters({ filters, onFilterChange }: BudgetPoolFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const handleReset = () => {
    onFilterChange({
      search: '',
      year: undefined,
      minAmount: undefined,
      maxAmount: undefined,
      sortBy: 'year',
      sortOrder: 'desc',
    });
  };

  return (
    <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
      {/* Basic Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Search
          </label>
          <input
            type="text"
            placeholder="Search budget pools..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange({ ...filters, search: e.target.value })
            }
            className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Financial Year
          </label>
          <select
            value={filters.year ?? ''}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                year: e.target.value ? parseInt(e.target.value) : undefined,
              })
            }
            className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            {years.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Sort By
          </label>
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split('-') as [
                'name' | 'year' | 'amount',
                'asc' | 'desc'
              ];
              onFilterChange({ ...filters, sortBy, sortOrder });
            }}
            className="rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="year-desc">Year (Newest First)</option>
            <option value="year-asc">Year (Oldest First)</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="amount-desc">Amount (High to Low)</option>
            <option value="amount-asc">Amount (Low to High)</option>
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Min Amount ($)
              </label>
              <input
                type="number"
                placeholder="0"
                value={filters.minAmount ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-40 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Max Amount ($)
              </label>
              <input
                type="number"
                placeholder="999999999"
                value={filters.maxAmount ?? ''}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
                className="w-40 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={handleReset}
                className="rounded-md bg-gray-100 px-4 py-2 hover:bg-gray-200"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Count */}
      {(filters.search || filters.year || filters.minAmount || filters.maxAmount) && (
        <div className="mt-3 text-sm text-gray-600">
          {[
            filters.search && 'search',
            filters.year && 'year',
            filters.minAmount && 'min amount',
            filters.maxAmount && 'max amount',
          ]
            .filter(Boolean)
            .join(', ')}{' '}
          filter(s) active
        </div>
      )}
    </div>
  );
}
