'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/trpc';

/**
 * OM 費用管理列表頁
 *
 * 功能：
 * 1. 顯示所有 O&M 費用記錄
 * 2. 支持年度、OpCo、類別過濾
 * 3. 卡片式展示（預算、實際支出、增長率）
 * 4. 創建新 OM 費用
 */

export default function OMExpensesPage() {
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
      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">O&M 費用管理</h1>
            <p className="mt-2 text-muted-foreground">
              管理年度操作與維護費用、月度支出記錄和增長率追蹤
            </p>
          </div>
          <Button onClick={() => router.push('/om-expenses/new')}>
            <Plus className="mr-2 h-4 w-4" />
            新增 OM 費用
          </Button>
        </div>
      </div>

      {/* 過濾器 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* 年度選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">財務年度</label>
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
              <label className="mb-2 block text-sm font-medium">營運公司 (OpCo)</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedOpCo}
                onChange={(e) => {
                  setSelectedOpCo(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部 OpCo</option>
                {opCos?.map((opCo) => (
                  <option key={opCo.id} value={opCo.id}>
                    {opCo.code} - {opCo.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 類別選擇 */}
            <div>
              <label className="mb-2 block text-sm font-medium">OM 類別</label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">全部類別</option>
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
        <div className="text-center py-8">載入中...</div>
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
                        <span className="text-muted-foreground">OpCo: </span>
                        <span className="font-medium">{om.opCo.code}</span>
                      </div>
                      {om.vendor && (
                        <div className="text-sm">
                          <span className="text-muted-foreground">供應商: </span>
                          <span className="font-medium">{om.vendor.name}</span>
                        </div>
                      )}

                      {/* 預算金額 */}
                      <div className="flex items-center justify-between border-t pt-3">
                        <span className="text-sm text-muted-foreground">預算金額</span>
                        <span className="font-semibold">{formatCurrency(om.budgetAmount)}</span>
                      </div>

                      {/* 實際支出 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">實際支出</span>
                        <span className={`font-semibold ${getUtilizationColor(utilizationRate)}`}>
                          {formatCurrency(om.actualSpent)}
                        </span>
                      </div>

                      {/* 使用率 */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">使用率</span>
                        <span className={`text-sm font-medium ${getUtilizationColor(utilizationRate)}`}>
                          {utilizationRate.toFixed(1)}%
                        </span>
                      </div>

                      {/* 月度記錄數 */}
                      <div className="border-t pt-3">
                        <span className="text-xs text-muted-foreground">
                          月度記錄: {om._count.monthlyRecords} / 12
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
                上一頁
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {page} 頁，共 {omExpenses.totalPages} 頁
              </span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(omExpenses.totalPages, p + 1))}
                disabled={page === omExpenses.totalPages}
              >
                下一頁
              </Button>
            </div>
          )}
        </>
      ) : (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              {selectedYear || selectedOpCo || selectedCategory
                ? '沒有符合條件的 OM 費用記錄'
                : '尚無 OM 費用記錄，請創建新的 OM 費用'}
            </p>
            {!selectedYear && !selectedOpCo && !selectedCategory && (
              <Button className="mt-4" onClick={() => router.push('/om-expenses/new')}>
                <Plus className="mr-2 h-4 w-4" />
                創建第一筆 OM 費用
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  );
}
