/**
 * @fileoverview O&M Summary Page - O&M 費用總覽頁面
 *
 * @description
 * 提供 O&M 費用和專案摘要的總覽視圖，使用 Tab 切換顯示。
 * 支援 FEAT-007 表頭-明細架構，顯示彙總自所有明細項目的預算和實際支出。
 * - O&M Summary Tab: 按年度、OpCo、Category 過濾的 O&M 費用（從 OMExpenseItem 彙總）
 * - Project Summary Tab: 按年度、預算類別過濾的專案摘要 (FEAT-006)
 *
 * @page /[locale]/om-summary
 *
 * @features
 * - FEAT-007 表頭-明細架構支援
 * - Tab 切換：O&M 費用總覽 / 專案摘要
 * - O&M Summary:
 *   - 財務年度選擇（顯示當前年度 Budget vs 上年度 Actual）
 *   - OpCo 多選過濾（過濾明細項目的 OpCo）
 *   - O&M Category 多選過濾
 *   - 類別匯總表格（從所有明細項目彙總）
 *   - 明細表格（Category → OpCo → Items 階層結構）
 * - Project Summary (FEAT-006):
 *   - 財務年度單選過濾
 *   - 預算類別多選過濾
 *   - 類別統計摘要表格
 *   - 專案明細 Accordion 表格
 * - 向後相容舊資料格式
 * - 重置過濾器功能
 * - 響應式設計
 *
 * @permissions
 * - ProjectManager: 查看 O&M Summary 和 Project Summary
 * - Supervisor: 查看 O&M Summary 和 Project Summary
 * - Admin: 完整權限
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OMExpense API Router (getSummary, FEAT-007)
 * - packages/api/src/routers/project.ts - Project API Router (getProjectSummary)
 * - packages/api/src/routers/operatingCompany.ts - OpCo API Router
 * - apps/web/src/components/om-summary/* - O&M Summary 組件 (FEAT-007 重構)
 * - apps/web/src/components/project-summary/* - Project Summary 組件 (FEAT-006)
 *
 * @author IT Department
 * @since FEAT-003 - O&M Summary Page
 * @modified FEAT-006 - Project Summary Tab (2025-12-05)
 * @modified FEAT-007 - Header-Detail Architecture (2025-12-05)
 * @modified FEAT-009 - Operating Company Data Permission (2025-12-12)
 * @lastModified 2025-12-12
 */

'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
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
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs';
import { api } from '@/lib/trpc';

import {
  OMSummaryFilters,
  OMSummaryCategoryGrid,
  OMSummaryDetailGrid,
  type FilterState,
} from '@/components/om-summary';
import {
  ProjectSummaryFilters,
  ProjectSummaryTable,
} from '@/components/project-summary';

export default function OMSummaryPage() {
  const t = useTranslations('omSummary');
  const tProjectSummary = useTranslations('projectSummary');
  const tCommon = useTranslations('common');

  // CHANGE-014: 獲取用戶 session 以判斷權限
  const { data: session } = useSession();
  const isAdmin = session?.user?.role?.id === 3; // Admin roleId = 3

  // 當前財務年度
  const currentFY = new Date().getFullYear();

  // Tab 狀態
  const [activeTab, setActiveTab] = React.useState<'om-summary' | 'project-summary'>('om-summary');

  // O&M Summary 過濾器狀態
  const [filters, setFilters] = React.useState<FilterState>({
    currentYear: currentFY,
    previousYear: currentFY - 1,
    opCoIds: [],
    categories: [],
  });

  // Project Summary 過濾器狀態
  const [projectFilters, setProjectFilters] = React.useState<{
    financialYear: number;
    budgetCategoryIds: string[];
  }>({
    financialYear: currentFY,
    budgetCategoryIds: [],
  });

  // 標記是否已初始化
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [isProjectSummaryInitialized, setIsProjectSummaryInitialized] = React.useState(false);

  // 獲取 OpCo 列表 (FEAT-009: 根據用戶權限過濾)
  const { data: opCoData, isLoading: isLoadingOpCos } = api.operatingCompany.getForCurrentUser.useQuery();

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

  // ========== Project Summary (FEAT-006) ==========

  // 獲取 Project Summary 數據（先不帶過濾器獲取所有數據，用於初始化類別選項）
  const {
    data: projectSummaryAllData,
    isLoading: isLoadingProjectSummaryAll,
  } = api.project.getProjectSummary.useQuery(
    { financialYear: projectFilters.financialYear },
    {
      enabled: activeTab === 'project-summary',
    }
  );

  // 獲取過濾後的 Project Summary 數據
  const {
    data: projectSummaryData,
    isLoading: isLoadingProjectSummary,
    isFetching: isFetchingProjectSummary,
  } = api.project.getProjectSummary.useQuery(
    {
      financialYear: projectFilters.financialYear,
      budgetCategoryIds: projectFilters.budgetCategoryIds.length > 0
        ? projectFilters.budgetCategoryIds
        : undefined,
    },
    {
      enabled: activeTab === 'project-summary' && isProjectSummaryInitialized,
      keepPreviousData: true,
    }
  );

  // 從 projectSummaryAllData 提取預算類別選項
  const budgetCategoryOptions = React.useMemo(() => {
    if (!projectSummaryAllData?.summary) return [];
    return projectSummaryAllData.summary.map((s) => ({
      id: s.categoryId,
      categoryName: s.categoryName,
      categoryCode: s.categoryCode,
    }));
  }, [projectSummaryAllData]);

  // Project Summary 初始化（全選所有類別）
  // 當 API 載入完成後（不管有沒有數據），都完成初始化
  React.useEffect(() => {
    if (!isProjectSummaryInitialized && !isLoadingProjectSummaryAll && projectSummaryAllData !== undefined) {
      // 如果有類別選項，全選所有類別
      if (budgetCategoryOptions.length > 0) {
        setProjectFilters((prev) => ({
          ...prev,
          budgetCategoryIds: budgetCategoryOptions.map((c) => c.id),
        }));
      }
      setIsProjectSummaryInitialized(true);
    }
  }, [budgetCategoryOptions, isProjectSummaryInitialized, isLoadingProjectSummaryAll, projectSummaryAllData]);

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

  // 處理 Project Summary 過濾器變更
  const handleProjectFiltersChange = (newFilters: {
    financialYear: number;
    budgetCategoryIds: string[];
  }) => {
    // 如果年度變更，重置初始化狀態以重新獲取類別
    if (newFilters.financialYear !== projectFilters.financialYear) {
      setIsProjectSummaryInitialized(false);
    }
    setProjectFilters(newFilters);
  };

  // 判斷是否顯示 OpCo 分組（當只選一個 OpCo 時隱藏）
  const showOpCoGroups = filters.opCoIds.length !== 1;

  // O&M Summary 載入狀態
  const isLoading = isLoadingOpCos || isLoadingCategories || !isInitialized;
  // 資料重新載入狀態（篩選器變更時）
  const isRefetching = isFetchingSummary;

  // Project Summary 載入狀態
  const isProjectLoading = isLoadingProjectSummaryAll || !isProjectSummaryInitialized;
  const isProjectRefetching = isFetchingProjectSummary;

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

      {/* Tab 切換 */}
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as 'om-summary' | 'project-summary')}
        className="w-full"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6">
          <TabsTrigger value="om-summary">{t('tabs.omSummary')}</TabsTrigger>
          <TabsTrigger value="project-summary">{t('tabs.projectSummary')}</TabsTrigger>
        </TabsList>

        {/* O&M Summary Tab */}
        <TabsContent value="om-summary">
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
        </TabsContent>

        {/* Project Summary Tab (FEAT-006) */}
        <TabsContent value="project-summary">
          {/* 過濾器 */}
          <ProjectSummaryFilters
            filters={projectFilters}
            onFiltersChange={handleProjectFiltersChange}
            availableYears={availableYears}
            budgetCategoryOptions={budgetCategoryOptions}
            isLoading={isProjectLoading}
          />

          {/* 專案摘要表格 */}
          {/* CHANGE-014: 傳遞用戶 OpCo 權限用於 chargeOutMethod 過濾 */}
          <ProjectSummaryTable
            projects={projectSummaryData?.projects || []}
            categorySummary={projectSummaryData?.summary || []}
            financialYear={projectFilters.financialYear}
            isLoading={isProjectLoading}
            userOpCoCodes={opCoData?.map((o) => o.code) || []}
            isAdmin={isAdmin}
          />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
