/**
 * @fileoverview Budget Pool Detail Page - 預算池詳情頁面
 *
 * @description
 * 顯示單一預算池的完整資訊，包含基本資料、預算類別詳情、使用統計和關聯專案列表。
 * 提供即時預算使用率計算、健康狀態指標和級聯操作（編輯、刪除）功能。
 * 使用 3 欄響應式佈局（左側 2/3 詳細資訊，右側 1/3 專案列表）。
 *
 * @page /[locale]/budget-pools/[id]
 *
 * @features
 * - 預算池基本資訊展示（名稱、財年、總金額、使用金額）
 * - 預算類別詳細列表（名稱、代碼、總預算、已用金額、使用率）
 * - 即時使用率計算和視覺化進度條
 * - 預算統計卡片（已分配、已支出、剩餘、使用率）
 * - 關聯專案列表（可點擊查看詳情）
 * - 編輯和刪除操作（含確認對話框）
 * - 載入狀態骨架屏和錯誤處理
 *
 * @permissions
 * - ProjectManager: 查看自己專案相關的預算池
 * - Supervisor: 查看所有預算池
 * - Admin: 完整查看和管理權限
 *
 * @routing
 * - 詳情頁: /budget-pools/[id]
 * - 編輯頁: /budget-pools/[id]/edit
 * - 列表頁: /budget-pools
 *
 * @stateManagement
 * - React Query: 預算池資料和統計資料快取
 * - tRPC: API 查詢和刪除 mutation
 * - Toast: 操作結果提示
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Table, Badge, Button, Breadcrumb, Skeleton, Alert
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/budgetPool.ts - 預算池 API Router
 * - apps/web/src/app/[locale]/budget-pools/page.tsx - 預算池列表頁面
 * - apps/web/src/app/[locale]/budget-pools/[id]/edit/page.tsx - 預算池編輯頁面
 * - packages/db/prisma/schema.prisma - BudgetPool 和 BudgetCategory 資料模型
 *
 * @author IT Department
 * @since Epic 3 - Budget and Project Setup
 * @lastModified 2025-11-14
 */

'use client';

import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useParams } from "next/navigation";
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { DollarSign, Calendar, TrendingUp, Folder, Edit, Trash2, User, AlertCircle, ListTree } from 'lucide-react';

/**
 * 專案狀態顯示配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: {
    label: '草稿',
    variant: 'default' as const,
  },
  InProgress: {
    label: '進行中',
    variant: 'default' as const,
  },
  Completed: {
    label: '已完成',
    variant: 'secondary' as const,
  },
  Archived: {
    label: '已歸檔',
    variant: 'outline' as const,
  },
} as const;

export default function BudgetPoolDetailPage() {
  const t = useTranslations('budgetPools');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });
  const { data: stats } = api.budgetPool.getStats.useQuery({ id });

  const deleteMutation = api.budgetPool.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.deleteSuccess'),
        variant: 'success',
      });
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    if (confirm(t('messages.confirmDelete'))) {
      deleteMutation.mutate({ id });
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-96" />

          {/* Header Skeleton */}
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-64" />
              <Skeleton className="h-5 w-48" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budgetPool) {
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
                <BreadcrumbLink asChild><Link href="/budget-pools">{t('title')}</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{t('detail.title')}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          {/* Error State */}
          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('messages.notFound')}
                </AlertDescription>
              </Alert>
              <Link href="/budget-pools">
                <Button>{t('actions.backToList')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

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
              <BreadcrumbLink asChild><Link href="/budget-pools">{t('title')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{budgetPool.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{budgetPool.name}</h1>
            <p className="text-muted-foreground mt-2">{t('detail.fiscalYearLabel')} {budgetPool.financialYear}</p>
          </div>
          <div className="flex gap-2">
            <Link href={`/budget-pools/${id}/edit`}>
              <Button variant="outline" size="default">
                <Edit className="h-4 w-4 mr-2" />
                {t('actions.edit')}
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? tCommon('actions.deleting') : t('actions.delete')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：主要資訊區域（2/3 寬度） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 預算池基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('detail.basicInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.fiscalYear')}</dt>
                    <dd className="text-xl font-bold text-foreground">FY {budgetPool.financialYear}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.categoryCount')}</dt>
                    <dd className="text-xl font-bold text-foreground">{budgetPool.categories.length} {t('fields.categories')}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.totalBudget')}</dt>
                    <dd className="text-xl font-bold text-foreground">
                      ${(budgetPool.computedTotalAmount ?? budgetPool.totalAmount).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.usedAmount')}</dt>
                    <dd className="text-xl font-bold text-orange-600">
                      ${(budgetPool.computedUsedAmount ?? 0).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{tCommon('fields.createdAt')}</dt>
                    <dd className="text-foreground font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.createdAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{tCommon('fields.updatedAt')}</dt>
                    <dd className="text-foreground font-medium mt-1 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(budgetPool.updatedAt).toLocaleDateString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 預算類別詳細資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTree className="h-5 w-5" />
                  {t('detail.categories.title')} ({budgetPool.categories.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetPool.categories.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('detail.categories.empty')}</p>
                ) : (
                  <div className="rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[50px]">{t('detail.categories.table.sort')}</TableHead>
                          <TableHead>{t('detail.categories.table.name')}</TableHead>
                          <TableHead>{t('detail.categories.table.code')}</TableHead>
                          <TableHead className="text-right">{t('detail.categories.table.totalBudget')}</TableHead>
                          <TableHead className="text-right">{t('detail.categories.table.used')}</TableHead>
                          <TableHead className="text-right">{t('detail.categories.table.utilizationRate')}</TableHead>
                          <TableHead className="text-center">{t('detail.categories.table.projectCount')}</TableHead>
                          <TableHead className="text-center">{t('detail.categories.table.expenseCount')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {budgetPool.categories.map((category) => {
                          const utilizationRate = category.utilizationRate ?? 0;

                          return (
                            <TableRow key={category.id}>
                              <TableCell className="text-center text-muted-foreground">
                                {category.sortOrder}
                              </TableCell>
                              <TableCell className="font-medium">
                                <div>
                                  <div className="font-medium text-foreground">{category.categoryName}</div>
                                  {category.description && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {category.description}
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {category.categoryCode || '-'}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                ${category.totalAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                ${category.usedAmount.toLocaleString('en-US', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className={`font-medium ${
                                  utilizationRate > 90 ? 'text-destructive' :
                                  utilizationRate > 75 ? 'text-yellow-600 dark:text-yellow-500' :
                                  'text-green-600 dark:text-green-500'
                                }`}>
                                  {utilizationRate.toFixed(1)}%
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                {category._count.projects}
                              </TableCell>
                              <TableCell className="text-center">
                                {category._count.expenses}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 預算統計數據 */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('detail.stats.title')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 gap-6">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">{t('detail.stats.allocated')}</dt>
                      <dd className="text-lg font-bold text-primary">
                        ${stats.totalAllocated.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">{t('detail.stats.spent')}</dt>
                      <dd className="text-lg font-bold text-orange-600">
                        ${stats.totalSpent.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">{t('detail.stats.remaining')}</dt>
                      <dd className="text-lg font-bold text-green-600">
                        ${stats.remaining.toLocaleString()}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground mb-1">{t('fields.utilizationRate')}</dt>
                      <dd className="text-lg font-bold text-foreground">
                        {stats.utilizationRate.toFixed(1)}%
                      </dd>
                    </div>
                  </dl>

                  {/* 進度條 */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">{t('detail.stats.progress')}</span>
                      <span className="text-sm font-medium text-foreground">
                        {stats.utilizationRate.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-3">
                      <div
                        className="bg-primary h-3 rounded-full transition-all"
                        style={{ width: `${Math.min(stats.utilizationRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* 右側：專案列表（1/3 寬度） */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Folder className="h-5 w-5" />
                  {t('detail.projects.title')} ({budgetPool.projects.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {budgetPool.projects.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('detail.projects.empty')}</p>
                ) : (
                  <div className="space-y-3">
                    {budgetPool.projects.map((project) => (
                      <Link
                        key={project.id}
                        href={`/projects/${project.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <h3 className="font-medium text-foreground mb-2">{project.name}</h3>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <User className="h-3 w-3" />
                          <span>{project.manager.name || project.manager.email}</span>
                        </div>
                        <Badge variant={PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].variant}>
                          {PROJECT_STATUS_CONFIG[project.status as keyof typeof PROJECT_STATUS_CONFIG].label}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
