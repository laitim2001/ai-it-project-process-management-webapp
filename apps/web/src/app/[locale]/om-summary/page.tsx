/**
 * @fileoverview O&M Summary Page - O&M 費用總覽頁面
 *
 * @description
 * 提供 O&M 費用的總覽視圖，類似 Excel 的表格樣式顯示。
 * 支援按年度、OpCo、Category 過濾，顯示類別匯總和明細列表。
 *
 * @page /[locale]/om-summary
 *
 * @features
 * - 財務年度選擇（顯示當前年度 Budget vs 上年度 Actual）
 * - OpCo 多選過濾
 * - O&M Category 多選過濾
 * - 類別匯總表格（Category、Budget、Actual、Change%、Item Count）
 * - 明細表格（Category → OpCo → Items 階層結構）
 * - 重置過濾器功能
 * - 響應式設計
 *
 * @permissions
 * - ProjectManager: 查看 O&M Summary
 * - Supervisor: 查看 O&M Summary
 * - Admin: 完整權限
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OMExpense API Router (getSummary)
 * - packages/api/src/routers/operatingCompany.ts - OpCo API Router
 * - apps/web/src/components/om-summary/* - O&M Summary 組件
 *
 * @author IT Department
 * @since FEAT-003 - O&M Summary Page
 * @lastModified 2025-11-29
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';

import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { api } from '@/lib/trpc';

import {
  OMSummaryFilters,
  OMSummaryCategoryGrid,
  OMSummaryDetailGrid,
  type FilterState,
} from '@/components/om-summary';

export default function OMSummaryPage() {
  const t = useTranslations('omSummary');
  const tCommon = useTranslations('common');

  // 當前財務年度
  const currentFY = new Date().getFullYear();

  // 過濾器狀態
  const [filters, setFilters] = React.useState<FilterState>({
    currentYear: currentFY,
    previousYear: currentFY - 1,
    opCoIds: [],
    categories: [],
  });

  // 標記是否已初始化
  const [isInitialized, setIsInitialized] = React.useState(false);

  // 獲取 OpCo 列表
  const { data: opCoData, isLoading: isLoadingOpCos } = api.operatingCompany.getAll.useQuery();

  // 獲取 OM 類別列表
  const { data: categoryData, isLoading: isLoadingCategories } = api.omExpense.getCategories.useQuery();

  // 初始化過濾器（全選 OpCo 和 Category）
  React.useEffect(() => {
    if (!isInitialized && opCoData && categoryData) {
      setFilters((prev) => ({
        ...prev,
        opCoIds: opCoData.map((o) => o.id),
        categories: categoryData,
      }));
      setIsInitialized(true);
    }
  }, [opCoData, categoryData, isInitialized]);

  // 獲取 Summary 數據
  const { data: summaryData, isLoading: isLoadingSummary, isFetching: isFetchingSummary } = api.omExpense.getSummary.useQuery(
    {
      currentYear: filters.currentYear,
      previousYear: filters.previousYear,
      opCoIds: filters.opCoIds.length > 0 ? filters.opCoIds : undefined,
      categories: filters.categories.length > 0 ? filters.categories : undefined,
    },
    {
      enabled: isInitialized,
      // 保持之前的數據直到新數據載入完成
      keepPreviousData: true,
    }
  );

  // 生成可用年度列表（當前年度 ± 5 年）
  const availableYears = React.useMemo(() => {
    const years: number[] = [];
    for (let i = currentFY + 2; i >= currentFY - 5; i--) {
      years.push(i);
    }
    return years;
  }, [currentFY]);

  // 處理過濾器變更
  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  // 判斷是否顯示 OpCo 分組（當只選一個 OpCo 時隱藏）
  const showOpCoGroups = filters.opCoIds.length !== 1;

  // 載入狀態
  const isLoading = isLoadingOpCos || isLoadingCategories || !isInitialized;
  // 資料重新載入狀態（篩選器變更時）
  const isRefetching = isFetchingSummary;

  return (
    <DashboardLayout>
      {/* 麵包屑導航 */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/dashboard">{tCommon('nav.dashboard')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* 頁面標題 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* 過濾器 */}
      <OMSummaryFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        availableYears={availableYears}
        opCoOptions={opCoData || []}
        categoryOptions={categoryData || []}
        isLoading={isLoading}
      />

      {/* 類別匯總表格 */}
      <OMSummaryCategoryGrid
        data={summaryData?.categorySummary || []}
        grandTotal={summaryData?.grandTotal || {
          currentYearBudget: 0,
          previousYearActual: 0,
          changePercent: null,
          itemCount: 0,
        }}
        currentYear={filters.currentYear}
        previousYear={filters.previousYear}
        isLoading={isLoading}
      />

      {/* 明細表格 */}
      <OMSummaryDetailGrid
        data={summaryData?.detailData || []}
        currentYear={filters.currentYear}
        previousYear={filters.previousYear}
        isLoading={isLoading}
        showOpCoGroups={showOpCoGroups}
      />
    </DashboardLayout>
  );
}
