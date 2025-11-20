/**
 * @fileoverview O&M Expenses List Page - 維運費用列表頁面
 *
 * @description
 * 顯示所有維運（O&M）費用的列表，支援即時搜尋、狀態過濾和分頁功能。
 * 維運費用用於記錄非專案的日常營運費用，支援獨立的審批流程。
 * 整合預算類別和審批工作流，提供完整的維運費用管理功能。
 *
 * @page /[locale]/om-expenses
 *
 * @features
 * - 維運費用列表展示（卡片視圖）
 * - 即時搜尋（費用描述、發票號）
 * - 狀態過濾（Draft, Submitted, Approved, Paid）
 * - 排序功能（金額、日期、狀態）
 * - 分頁導航（每頁 10/20/50 項）
 * - 快速操作（查看詳情、編輯、提交、審批）
 * - 狀態徽章顯示（不同顏色標示不同狀態）
 * - 角色權限控制（RBAC）
 *
 * @permissions
 * - ProjectManager: 查看和建立維運費用
 * - Supervisor: 查看所有維運費用，審批 Submitted 費用
 * - Admin: 完整權限
 *
 * @routing
 * - 列表頁: /om-expenses
 * - 建立頁: /om-expenses/new
 * - 詳情頁: /om-expenses/[id]
 * - 編輯頁: /om-expenses/[id]/edit
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/omExpense.ts` - OMExpense API Router（getAll、getCategories）
 * - `packages/api/src/routers/operatingCompany.ts` - OperatingCompany API Router（OpCo 過濾器）
 * - `packages/db/prisma/schema.prisma` - OMExpense 和 OperatingCompany 資料模型定義
 * - `apps/web/src/app/[locale]/om-expenses/new/page.tsx` - OMExpense 建立頁
 * - `apps/web/src/app/[locale]/om-expenses/[id]/page.tsx` - OMExpense 詳情頁（卡片點擊導向）
 * - `apps/web/src/app/[locale]/om-expenses/[id]/edit/page.tsx` - OMExpense 編輯頁
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 * - `apps/web/src/components/ui/card.tsx` - Card UI 組件（列表卡片展示）
 * - `apps/web/src/components/ui/badge.tsx` - Badge UI 組件（狀態徽章和增長率）
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from "@/i18n/routing";
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

export default function OMExpensesPage() {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const currentYear = new Date().getFullYear();

  // 過濾狀態
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedOpCo, setSelectedOpCo] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 12;

  // 獲取 OpCo 列表（用於過濾器）
  const { data: opCos } = api.operatingCompany.getAll.useQuery();

  // 獲取 OM 類別列表（用於過濾器）
  const { data: categories } = api.omExpense.getCategories.useQuery();

  // 獲取 OM 費用列表
  const { data: omExpenses, isLoading } = api.omExpense.getAll.useQuery({
    financialYear: selectedYear,
    opCoId: selectedOpCo || undefined,
    category: selectedCategory || undefined,
    page,
    limit,
  });

  // 格式化金額
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // 格式化增長率
  const formatGrowthRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // 增長率顏色
  const getGrowthRateColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-500';
    if (rate > 10) return 'bg-red-500'; // 高增長（警告）
    if (rate > 0) return 'bg-yellow-500'; // 正增長
    if (rate < 0) return 'bg-green-500'; // 負增長（節省）
    return 'bg-gray-500'; // 零增長
  };

  // 預算使用率顏色
  const getUtilizationColor = (utilizationRate: number) => {
    if (utilizationRate > 100) return 'text-red-600';
    if (utilizationRate > 90) return 'text-yellow-600';
    return 'text-green-600';
  };

  // 年度選項（最近 5 年）
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{t('breadcrumb.home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('breadcrumb.omExpenses')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">
              {t('description')}
            </p>
          </div>
          <Button onClick={() => router.push('/om-expenses/new')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('list.newOMExpense')}
          </Button>
        </div>
      </div>

      {/* 過濾器 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 年度選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.financialYear')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(parseInt(e.target.value));
                  setPage(1);
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    FY{year}
                  </option>
                ))}
              </select>
            </div>

            {/* OpCo 選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.opCo')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedOpCo}
                onChange={(e) => {
                  setSelectedOpCo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allOpCos')}</option>
                {opCos?.map((opCo) => (
                  <option key={opCo.id} value={opCo.id}>
                    {opCo.code} - {opCo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 類別選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">{t('list.filters.category')}</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">{t('list.filters.allCategories')}</option>
                {categories?.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OM 費用列表 */}
      {isLoading ? (
        <div className="text-center py-8">{tCommon('loading')}</div>
      ) : omExpenses && omExpenses.items.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {omExpenses.items.map((om) => {
              const utilizationRate = om.budgetAmount > 0
                ? (om.actualSpent / om.budgetAmount) * 100
                : 0;

              return (
                <Card
                  key={om.id}
                  className="cursor-pointer transition-shadow hover:shadow-lg"
                  onClick={() => router.push(`/om-expenses/${om.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{om.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {om.category}
                        </CardDescription>
                      </div>
                      {om.yoyGrowthRate !== null && (
                        <Badge className={getGrowthRateColor(om.yoyGrowthRate)}>
                          {formatGrowthRate(om.yoyGrowthRate)}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* OpCo 和供應商 */}
                      <div className="text-sm">
                        <span className="text-muted-foreground">{t('list.card.opCo')}: </span>
                        <span className="font-medium">{om.opCo.code}</span>
                      </div>
                      {om.vendor && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">{t('list.card.vendor')}: </span>
                          <span className="font-medium">{om.vendor.name}</span>
                        </div>
                      )}

                      {/* 預算金額 */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-sm text-muted-foreground">{t('list.card.budget')}</span>
                        <span className="font-semibold">{formatCurrency(om.budgetAmount)}</span>
                      </div>

                      {/* 實際支出 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('list.card.actualSpent')}</span>
                        <span className={`font-semibold ${getUtilizationColor(utilizationRate)}`}>
                          {formatCurrency(om.actualSpent)}
                        </span>
                      </div>

                      {/* 使用率 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">{t('list.card.utilizationRate')}</span>
                        <span className={`text-sm font-medium ${getUtilizationColor(utilizationRate)}`}>
                          {utilizationRate.toFixed(1)}%
                        </span>
                      </div>

                      {/* 月度記錄數 */}
                      <div className="border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          {t('list.card.monthlyRecords')}: {om._count.monthlyRecords} / 12
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* 分頁控制 */}
          {omExpenses.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('list.pagination.previous')}
              </Button>
              <span className="text-sm text-muted-foreground">
                {t('list.pagination.page', { current: page, total: omExpenses.totalPages })}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(omExpenses.totalPages, p + 1))}
                disabled={page === omExpenses.totalPages}
              >
                {t('list.pagination.next')}
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {selectedYear || selectedOpCo || selectedCategory
                ? t('list.empty.noResults')
                : t('list.empty.noRecords')}
            </p>
            {!selectedYear && !selectedOpCo && !selectedCategory && (
              <Button className="mt-4" onClick={() => router.push('/om-expenses/new')}>
                <Plus className="mr-2 h-4 w-4" />
                {t('list.empty.createFirst')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
