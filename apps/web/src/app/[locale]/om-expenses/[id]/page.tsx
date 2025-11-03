'use client';

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseMonthlyGrid from '@/components/om-expense/OMExpenseMonthlyGrid';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

/**
 * OM 費用詳情頁
 *
 * 功能：
 * 1. 顯示 OM 費用基本資訊
 * 2. 顯示關聯資訊（OpCo、Vendor）
 * 3. 月度支出網格編輯器（核心功能）
 * 4. 增長率顯示和計算按鈕
 * 5. 編輯和刪除功能
 */

export default function OMExpenseDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('omExpenses');
  const router = useRouter();
  const { toast } = useToast();

  // 獲取 OM 費用詳情
  const { data: omExpense, isLoading, refetch } = api.omExpense.getById.useQuery({
    id: params.id,
  });

  // 計算增長率 Mutation
  const calculateGrowthMutation = api.omExpense.calculateYoYGrowth.useMutation({
    onSuccess: (data) => {
      if (data.yoyGrowthRate !== null) {
        toast({
          title: '增長率計算成功',
          description: `本年度實際支出：${formatCurrency(data.currentAmount)}，上年度：${formatCurrency(data.previousAmount ?? 0)}，增長率：${formatGrowthRate(data.yoyGrowthRate)}`,
        });
        refetch(); // 重新獲取資料以顯示更新後的增長率
      } else {
        toast({
          title: '無法計算增長率',
          description: data.message || '無上年度數據可比較',
          variant: 'default',
        });
      }
    },
    onError: (error) => {
      toast({
        title: '計算失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 刪除 Mutation
  const deleteMutation = api.omExpense.delete.useMutation({
    onSuccess: () => {
      toast({
        title: '刪除成功',
        description: 'OM 費用已刪除',
      });
      router.push('/om-expenses');
    },
    onError: (error) => {
      toast({
        title: '刪除失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
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

  // 格式化日期
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 格式化增長率
  const formatGrowthRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // 增長率圖示
  const getGrowthIcon = (rate: number | null) => {
    if (rate === null) return <Minus className="h-4 w-4" />;
    if (rate > 0) return <TrendingUp className="h-4 w-4" />;
    if (rate < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  // 增長率顏色
  const getGrowthRateColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-500';
    if (rate > 10) return 'bg-red-500'; // 高增長（警告）
    if (rate > 0) return 'bg-yellow-500'; // 正增長
    if (rate < 0) return 'bg-green-500'; // 負增長（節省）
    return 'bg-gray-500'; // 零增長
  };

  // 刪除確認
  const handleDelete = () => {
    if (confirm('確定要刪除此 OM 費用嗎？此操作無法撤銷，將同時刪除所有月度記錄。')) {
      deleteMutation.mutate({ id: params.id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">載入中...</div>
      </DashboardLayout>
    );
  }

  if (!omExpense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">OM 費用不存在</p>
          <Button className="mt-4" onClick={() => router.push('/om-expenses')}>
            返回列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const utilizationRate =
    omExpense.budgetAmount > 0 ? (omExpense.actualSpent / omExpense.budgetAmount) * 100 : 0;

  return (
    <DashboardLayout>
      {/* 返回按鈕和標題 */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/om-expenses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回列表
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{omExpense.name}</h1>
            <p className="mt-2 text-muted-foreground">
              FY{omExpense.financialYear} · {omExpense.category}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push(`/om-expenses/${params.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" />
              編輯
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? '刪除中...' : '刪除'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左側：基本資訊和關聯資訊 */}
        <div className="space-y-6 lg:col-span-1">
          {/* 基本資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>基本資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {omExpense.description && (
                <div>
                  <div className="text-sm text-muted-foreground">描述</div>
                  <div className="mt-1 text-sm">{omExpense.description}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">財務年度</div>
                <div className="mt-1 font-medium">FY{omExpense.financialYear}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">OM 類別</div>
                <div className="mt-1 font-medium">{omExpense.category}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">日期範圍</div>
                <div className="mt-1 text-sm">
                  {formatDate(omExpense.startDate)} - {formatDate(omExpense.endDate)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 關聯資訊 */}
          <Card>
            <CardHeader>
              <CardTitle>關聯資訊</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">營運公司 (OpCo)</div>
                <div className="mt-1">
                  <Badge variant="outline" className="font-mono">
                    {omExpense.opCo.code}
                  </Badge>
                  <div className="mt-1 text-sm">{omExpense.opCo.name}</div>
                </div>
              </div>

              {omExpense.vendor ? (
                <div>
                  <div className="text-sm text-muted-foreground">供應商</div>
                  <div className="mt-1 font-medium">{omExpense.vendor.name}</div>
                  {omExpense.vendor.contactEmail && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {omExpense.vendor.contactEmail}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm text-muted-foreground">供應商</div>
                  <div className="mt-1 text-sm text-muted-foreground">無關聯供應商</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 預算概覽 */}
          <Card>
            <CardHeader>
              <CardTitle>預算概覽</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">預算金額</span>
                <span className="font-semibold">{formatCurrency(omExpense.budgetAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">實際支出</span>
                <span
                  className={`font-semibold ${
                    utilizationRate > 100
                      ? 'text-red-600'
                      : utilizationRate > 90
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {formatCurrency(omExpense.actualSpent)}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">剩餘預算</span>
                <span className="font-semibold">
                  {formatCurrency(omExpense.budgetAmount - omExpense.actualSpent)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">使用率</span>
                <span
                  className={`text-sm font-medium ${
                    utilizationRate > 100
                      ? 'text-red-600'
                      : utilizationRate > 90
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {utilizationRate.toFixed(1)}%
                </span>
              </div>
            </CardContent>
          </Card>

          {/* 年度增長率 */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>年度增長率</CardTitle>
                  <CardDescription>相比上一財務年度</CardDescription>
                </div>
                {omExpense.yoyGrowthRate !== null && (
                  <Badge className={getGrowthRateColor(omExpense.yoyGrowthRate)}>
                    {getGrowthIcon(omExpense.yoyGrowthRate)}
                    <span className="ml-1">{formatGrowthRate(omExpense.yoyGrowthRate)}</span>
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {omExpense.yoyGrowthRate !== null ? (
                <div className="text-sm text-muted-foreground">
                  {omExpense.yoyGrowthRate > 0
                    ? `支出增加 ${omExpense.yoyGrowthRate.toFixed(1)}%`
                    : omExpense.yoyGrowthRate < 0
                    ? `支出減少 ${Math.abs(omExpense.yoyGrowthRate).toFixed(1)}%`
                    : '支出持平'}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">尚未計算增長率</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => calculateGrowthMutation.mutate({ id: params.id })}
                    disabled={calculateGrowthMutation.isPending}
                  >
                    {calculateGrowthMutation.isPending ? '計算中...' : '計算增長率'}
                  </Button>
                </div>
              )}
              {omExpense.yoyGrowthRate !== null && (
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 w-full"
                  onClick={() => calculateGrowthMutation.mutate({ id: params.id })}
                  disabled={calculateGrowthMutation.isPending}
                >
                  {calculateGrowthMutation.isPending ? '重新計算中...' : '重新計算'}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：月度網格編輯器 */}
        <div className="lg:col-span-2">
          <OMExpenseMonthlyGrid
            omExpenseId={params.id}
            budgetAmount={omExpense.budgetAmount}
            initialRecords={omExpense.monthlyRecords}
            onSave={() => refetch()} // 保存後重新獲取資料
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
