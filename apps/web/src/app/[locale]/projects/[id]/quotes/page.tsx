'use client';

/**
 * 專案報價管理頁面
 *
 * 功能說明:
 * - 顯示專案所有報價單
 * - 報價比較功能（最低價、最高價、平均價）
 * - 選擇供應商並生成採購單
 * - 報價統計資訊
 *
 * Epic 5 - Story 5.2 & 5.3: 報價管理和供應商選擇
 */

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useParams } from "next/navigation";
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Building2, Calendar, DollarSign, TrendingUp, TrendingDown, CheckCircle, ShoppingCart, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { QuoteUploadForm } from '@/components/quote/QuoteUploadForm';

export default function ProjectQuotesPage() {
  const t = useTranslations('quotes');
  const tNav = useTranslations('navigation');
  const tProjects = useTranslations('projects');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const projectId = params.id as string;

  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  // 查詢專案資訊
  const { data: project, isLoading: projectLoading } = api.project.getById.useQuery({ id: projectId });

  // 查詢專案的所有報價
  const { data: quotes, isLoading: quotesLoading } = api.quote.getByProject.useQuery({ projectId });

  // 查詢報價比較統計
  const { data: comparison } = api.quote.compare.useQuery({ projectId });

  // 從報價生成採購單
  const createPOMutation = api.purchaseOrder.createFromQuote.useMutation({
    onSuccess: (po) => {
      toast({
        title: t('messages.success'),
        description: t('messages.poCreatedSuccess', { poNumber: po.poNumber }),
        variant: 'success',
      });
      router.push(`/purchase-orders/${po.id}`);
    },
    onError: (error) => {
      toast({
        title: t('messages.error'),
        description: t('messages.poCreatedError', { message: error.message }),
        variant: 'destructive',
      });
    },
  });

  /**
   * 選擇報價並生成採購單
   */
  const handleSelectQuote = (quoteId: string) => {
    if (confirm(t('messages.confirmSelectQuote'))) {
      createPOMutation.mutate({ projectId, quoteId });
    }
  };

  // 載入狀態
  if (projectLoading || quotesLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-[520px]" />

          {/* Header Skeleton */}
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>

          {/* Upload Form Skeleton */}
          <Skeleton className="h-64 w-full" />

          {/* Stats Cards Skeleton */}
          <div className="grid gap-6 md:grid-cols-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>

          {/* Quotes List Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // 找不到專案
  if (!project) {
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
                <BreadcrumbLink asChild><Link href="/projects">{tNav('projects')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {tProjects('detail.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/projects">
                <Button>{tProjects('actions.backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 排序報價 (按金額排序)
  const sortedQuotes = quotes ? [...quotes].sort((a, b) => a.amount - b.amount) : [];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* 麵包屑導航 */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('home')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/projects">{tNav('projects')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/projects/${projectId}`}>{project.name}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{project.name}</p>
          </div>
        </div>

        {/* 報價上傳表單 */}
        <QuoteUploadForm
          projectId={projectId}
          onSuccess={() => {
            // 刷新報價列表
            router.refresh();
          }}
        />

        {/* 報價統計卡片 */}
        {comparison && (
          <div className="grid gap-6 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.totalQuotes')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{comparison.stats.totalQuotes}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingDown className="h-4 w-4 text-green-600" />
                  {t('stats.lowestQuote')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  ${comparison.stats.lowestQuote?.toLocaleString() ?? 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-red-600" />
                  {t('stats.highestQuote')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  ${comparison.stats.highestQuote?.toLocaleString() ?? 'N/A'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">{t('stats.averageQuote')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  ${comparison.stats.averageQuote?.toLocaleString() ?? 'N/A'}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 報價比較列表 */}
        <Card>
          <CardHeader>
            <CardTitle>{t('comparison.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            {sortedQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground mb-2">{t('comparison.noQuotes')}</p>
                <p className="text-sm text-muted-foreground">{t('comparison.uploadFirst')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedQuotes.map((quote, index) => {
                  const isLowest = quote.amount === comparison?.stats.lowestQuote;
                  const isHighest = quote.amount === comparison?.stats.highestQuote;
                  const hasSelectedPO = !!quote.purchaseOrder;

                  return (
                    <div
                      key={quote.id}
                      className={`
                        relative border rounded-lg p-6 transition
                        ${isLowest ? 'border-green-500 bg-green-50' : ''}
                        ${isHighest ? 'border-red-500 bg-red-50' : ''}
                        ${!isLowest && !isHighest ? 'border-border hover:border-primary' : ''}
                        ${hasSelectedPO ? 'opacity-60' : ''}
                      `}
                    >
                      {/* 最低/最高標記 */}
                      {isLowest && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            {t('badges.lowest')}
                          </Badge>
                        </div>
                      )}
                      {isHighest && !isLowest && (
                        <div className="absolute top-4 right-4">
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {t('badges.highest')}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-6">
                        {/* 左側：報價資訊 */}
                        <div className="flex-1 space-y-3">
                          {/* 供應商 */}
                          <div className="flex items-center gap-3">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">{t('fields.vendor')}</p>
                              <Link
                                href={`/vendors/${quote.vendor.id}`}
                                className="text-lg font-semibold text-foreground hover:text-primary"
                              >
                                {quote.vendor.name}
                              </Link>
                            </div>
                          </div>

                          {/* 報價金額 */}
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">{t('fields.amount')}</p>
                              <p className="text-2xl font-bold text-foreground">
                                ${quote.amount.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          {/* 上傳日期 */}
                          <div className="flex items-center gap-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">{t('fields.uploadDate')}</p>
                              <p className="text-base text-foreground">
                                {new Date(quote.uploadDate).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                          </div>

                          {/* 報價文件 */}
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="text-sm text-muted-foreground">{t('fields.document')}</p>
                              <p className="text-sm text-foreground">{quote.filePath.split('/').pop()}</p>
                            </div>
                          </div>

                          {/* 已生成採購單標記 */}
                          {hasSelectedPO && quote.purchaseOrder && (
                            <div className="flex items-center gap-2 mt-4 p-3 bg-primary/10 border border-primary rounded-lg">
                              <CheckCircle className="h-5 w-5 text-primary" />
                              <div>
                                <p className="text-sm font-medium text-primary">{t('messages.quoteSelected')}</p>
                                <Link
                                  href={`/purchase-orders/${quote.purchaseOrder.id}`}
                                  className="text-sm text-primary hover:underline"
                                >
                                  {t('messages.viewPO', { poNumber: quote.purchaseOrder.poNumber })}
                                </Link>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 右側：操作按鈕 */}
                        {!hasSelectedPO && (
                          <div className="flex flex-col gap-2">
                            <Button
                              onClick={() => handleSelectQuote(quote.id)}
                              disabled={createPOMutation.isLoading}
                              className="whitespace-nowrap"
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              {createPOMutation.isLoading ? t('actions.processing') : t('actions.selectVendor')}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
