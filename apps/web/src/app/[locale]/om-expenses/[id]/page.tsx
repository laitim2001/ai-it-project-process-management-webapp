'use client';

import { Link, useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowLeft, Edit, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import OMExpenseMonthlyGrid from '@/components/om-expense/OMExpenseMonthlyGrid';
import { useToast } from '@/components/ui';
import { api } from '@/lib/trpc';

/**
 * OM Expense Detail Page
 *
 * Features:
 * 1. Display OM expense basic information
 * 2. Display related information (OpCo, Vendor)
 * 3. Monthly expense grid editor (core feature)
 * 4. Growth rate display and calculation button
 * 5. Edit and delete functionality
 */

export default function OMExpenseDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('omExpenses');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();

  // Get OM expense details
  const { data: omExpense, isLoading, refetch } = api.omExpense.getById.useQuery({
    id: params.id,
  });

  // Calculate growth rate mutation
  const calculateGrowthMutation = api.omExpense.calculateYoYGrowth.useMutation({
    onSuccess: (data) => {
      if (data.yoyGrowthRate !== null) {
        toast({
          title: t('messages.growthCalculated'),
          description: t('messages.growthCalculationDesc', {
            current: formatCurrency(data.currentAmount),
            previous: formatCurrency(data.previousAmount ?? 0),
            rate: formatGrowthRate(data.yoyGrowthRate),
          }),
        });
        refetch();
      } else {
        toast({
          title: t('messages.cannotCalculateGrowth'),
          description: data.message || t('messages.noPreviousYearData'),
          variant: 'default',
        });
      }
    },
    onError: (error) => {
      toast({
        title: t('messages.calculationFailed'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Delete mutation
  const deleteMutation = api.omExpense.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('success'),
        description: t('messages.deleteSuccess'),
      });
      router.push('/om-expenses');
    },
    onError: (error) => {
      toast({
        title: tCommon('error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('zh-HK', {
      style: 'currency',
      currency: 'HKD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // Format growth rate
  const formatGrowthRate = (rate: number | null) => {
    if (rate === null) return 'N/A';
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };

  // Growth rate icon
  const getGrowthIcon = (rate: number | null) => {
    if (rate === null) return <Minus className="h-4 w-4" />;
    if (rate > 0) return <TrendingUp className="h-4 w-4" />;
    if (rate < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  // Growth rate color
  const getGrowthRateColor = (rate: number | null) => {
    if (rate === null) return 'bg-gray-500';
    if (rate > 10) return 'bg-red-500'; // High growth (warning)
    if (rate > 0) return 'bg-yellow-500'; // Positive growth
    if (rate < 0) return 'bg-green-500'; // Negative growth (savings)
    return 'bg-gray-500'; // Zero growth
  };

  // Delete confirmation
  const handleDelete = () => {
    if (confirm(t('messages.deleteConfirm'))) {
      deleteMutation.mutate({ id: params.id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">{t('detail.loading')}</div>
      </DashboardLayout>
    );
  }

  if (!omExpense) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('list.empty.notFound')}</p>
          <Button className="mt-4" onClick={() => router.push('/om-expenses')}>
            {t('breadcrumb.backToList')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const utilizationRate =
    omExpense.budgetAmount > 0 ? (omExpense.actualSpent / omExpense.budgetAmount) * 100 : 0;

  return (
    <DashboardLayout>
      {/* Breadcrumb Navigation */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">{tNav('home')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/om-expenses">{tNav('menu.omExpenses')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{omExpense.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Page Header with Title and Actions */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/om-expenses')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('breadcrumb.backToList')}
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
              {t('form.actions.edit')}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t('form.actions.deleting') : t('form.actions.delete')}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Basic Info and Related Info */}
        <div className="space-y-6 lg:col-span-1">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.basicInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {omExpense.description && (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.description')}</div>
                  <div className="mt-1 text-sm">{omExpense.description}</div>
                </div>
              )}

              <div>
                <div className="text-sm text-muted-foreground">{t('detail.financialYear')}</div>
                <div className="mt-1 font-medium">FY{omExpense.financialYear}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">{t('detail.category')}</div>
                <div className="mt-1 font-medium">{omExpense.category}</div>
              </div>

              <div>
                <div className="text-sm text-muted-foreground">{t('detail.dateRange')}</div>
                <div className="mt-1 text-sm">
                  {formatDate(omExpense.startDate)} - {formatDate(omExpense.endDate)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Information Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.relatedInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-sm text-muted-foreground">{t('detail.opCo')}</div>
                <div className="mt-1">
                  <Badge variant="outline" className="font-mono">
                    {omExpense.opCo.code}
                  </Badge>
                  <div className="mt-1 text-sm">{omExpense.opCo.name}</div>
                </div>
              </div>

              {omExpense.vendor ? (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.vendor')}</div>
                  <div className="mt-1 font-medium">{omExpense.vendor.name}</div>
                  {omExpense.vendor.contactEmail && (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {omExpense.vendor.contactEmail}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.vendor')}</div>
                  <div className="mt-1 text-sm text-muted-foreground">{t('detail.noVendor')}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Budget Overview Card */}
          <Card>
            <CardHeader>
              <CardTitle>{t('detail.budgetOverview')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('detail.budgetAmount')}</span>
                <span className="font-semibold">{formatCurrency(omExpense.budgetAmount)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">{t('detail.actualSpent')}</span>
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
                <span className="text-sm text-muted-foreground">{t('detail.remainingBudget')}</span>
                <span className="font-semibold">
                  {formatCurrency(omExpense.budgetAmount - omExpense.actualSpent)}
                </span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="text-sm text-muted-foreground">{t('detail.utilizationRate')}</span>
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

          {/* Year-over-Year Growth Card */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{t('detail.yoyGrowth')}</CardTitle>
                  <CardDescription>{t('detail.yoyGrowthDesc')}</CardDescription>
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
                    ? t('detail.increaseBy', { rate: omExpense.yoyGrowthRate.toFixed(1) })
                    : omExpense.yoyGrowthRate < 0
                    ? t('detail.decreaseBy', { rate: Math.abs(omExpense.yoyGrowthRate).toFixed(1) })
                    : t('detail.noChange')}
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">{t('detail.growthNotCalculated')}</div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => calculateGrowthMutation.mutate({ id: params.id })}
                    disabled={calculateGrowthMutation.isPending}
                  >
                    {calculateGrowthMutation.isPending ? t('detail.calculating') : t('detail.calculateGrowth')}
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
                  {calculateGrowthMutation.isPending ? t('detail.recalculating') : t('detail.recalculate')}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Monthly Grid Editor */}
        <div className="lg:col-span-2">
          <OMExpenseMonthlyGrid
            omExpenseId={params.id}
            budgetAmount={omExpense.budgetAmount}
            initialRecords={omExpense.monthlyRecords}
            onSave={() => refetch()}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
