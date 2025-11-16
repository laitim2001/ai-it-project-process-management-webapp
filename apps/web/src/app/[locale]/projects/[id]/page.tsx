/**
 * @fileoverview Project Detail Page - 專案詳情頁面
 *
 * @description
 * 顯示單一專案的完整資訊，包含基本資料、統計數據、關聯提案列表、採購單列表和預算使用情況。
 * 使用 3 欄響應式佈局（左側 2/3 詳細資訊，右側 1/3 快速資訊欄）。
 * 整合 Module 2 預算使用情況功能，提供即時預算追蹤和視覺化進度條。
 *
 * @page /[locale]/projects/[id]
 *
 * @features
 * - 專案基本資訊展示（名稱、描述、狀態、建立/更新時間）
 * - 專案統計卡片（提案統計、採購統計、費用統計）
 * - 預算使用情況（請求預算、批准預算、實際支出、使用率、剩餘預算）
 * - 關聯提案列表（可點擊查看詳情，顯示狀態和金額）
 * - 關聯採購單列表（可點擊查看詳情，顯示供應商和金額）
 * - 專案團隊資訊（專案經理、主管）
 * - 預算池資訊（名稱、財年、總預算）
 * - 報價管理入口（查看和管理專案報價）
 * - 快速操作（新增提案、新增採購單、編輯專案）
 * - 編輯和刪除操作（含確認對話框）
 *
 * @permissions
 * - ProjectManager: 查看和編輯自己的專案
 * - Supervisor: 查看所有專案、編輯和刪除
 * - Admin: 完整查看、編輯和管理權限
 *
 * @routing
 * - 詳情頁: /projects/[id]
 * - 編輯頁: /projects/[id]/edit
 * - 報價管理: /projects/[id]/quotes
 * - 新增提案: /proposals/new?projectId=[id]
 * - 新增採購單: /purchase-orders/new?projectId=[id]
 *
 * @stateManagement
 * - React Query: 專案資料、統計資料、預算使用情況快取
 * - tRPC: API 查詢和刪除 mutation
 * - Toast: 操作結果提示
 * - Locale: 日期格式化依據當前語言
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: Card, Badge, Button, Breadcrumb
 * - lucide-react: 圖示庫
 *
 * @related
 * - packages/api/src/routers/project.ts - 專案 API Router
 * - apps/web/src/app/[locale]/projects/page.tsx - 專案列表頁面
 * - apps/web/src/app/[locale]/projects/[id]/edit/page.tsx - 專案編輯頁面
 * - apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx - 專案報價頁面
 * - packages/db/prisma/schema.prisma - Project 資料模型
 *
 * @author IT Department
 * @since Epic 2 - Project Management (Module 2: 預算使用情況追蹤)
 * @lastModified 2025-11-16 (FEAT-001: 專案資訊新增專案編號、全域標誌、優先權、貨幣欄位)
 */

'use client';

import { useRouter } from "@/i18n/routing";
import { useParams } from "next/navigation";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Link } from "@/i18n/routing";
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ArrowLeft, Edit, Trash2, Plus, FileText, ShoppingCart, User, Calendar, DollarSign, TrendingUp, Package, PieChart, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export default function ProjectDetailPage() {
  const t = useTranslations('projects.detail');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation.menu');
  const tStatus = useTranslations('common.status');
  const tToast = useTranslations('toast');

  // ============================================================
  // Hooks 和 Router
  // ============================================================

  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const id = params.id as string;
  const locale = params.locale as string;
  // 專案狀態映射
  const getProjectStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      Draft: tStatus('draft'),
      InProgress: tStatus('active'),
      Completed: tStatus('completed'),
      Archived: tStatus('inactive'),
    };
    return statusMap[status] || status;
  };

  // 專案狀態配置 (包含 variant) - FIX-061
  const getProjectStatusConfig = (status: string) => {
    const configs = {
      Draft: { variant: 'outline' as const },
      InProgress: { variant: 'secondary' as const },
      Completed: { variant: 'default' as const },
      Archived: { variant: 'outline' as const },
    };
    const config = configs[status as keyof typeof configs];
    return {
      label: getProjectStatusLabel(status),
      variant: config?.variant || ('outline' as const),
    };
  };

  // 專案狀態 variant 映射
  const getProjectStatusVariant = (status: string) => {
    const variantMap: Record<string, 'default' | 'info' | 'success'> = {
      Draft: 'default',
      InProgress: 'info',
      Completed: 'success',
      Archived: 'default',
    };
    return variantMap[status] || 'default';
  };

  // 提案狀態映射
  const getProposalStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      Draft: tStatus('draft'),
      PendingApproval: tStatus('pendingApproval'),
      Approved: tStatus('approved'),
      Rejected: tStatus('rejected'),
      MoreInfoRequired: tStatus('moreInfoRequired'),
    };
    return statusMap[status] || status;
  };

  // 提案狀態 variant 映射
  const getProposalStatusVariant = (status: string) => {
    const variantMap: Record<string, 'default' | 'warning' | 'success' | 'error'> = {
      Draft: 'default',
      PendingApproval: 'warning',
      Approved: 'success',
      Rejected: 'error',
      MoreInfoRequired: 'warning',
    };
    return variantMap[status] || 'default';
  };

  // 提案狀態配置 (組合 label 和 variant) - FIX-061
  const getProposalStatusConfig = (status: string) => {
    return {
      label: getProposalStatusLabel(status),
      variant: getProposalStatusVariant(status),
    };
  };

  // ============================================================
  // API 查詢
  // ============================================================

  /**
   * 查詢專案詳細資訊
   * 包含預算池、專案經理、主管、提案、採購單等關聯數據
   */
  const { data: project, isLoading } = api.project.getById.useQuery({ id });

  /**
   * 查詢專案統計數據
   * 包含提案統計、採購統計、費用統計
   */
  const { data: stats } = api.project.getStats.useQuery({ id });

  /**
   * Module 2: 查詢專案預算使用情況
   * 包含請求預算、批准預算、實際支出、使用率、剩餘預算
   */
  const { data: budgetUsage } = api.project.getBudgetUsage.useQuery({ projectId: id });

  /**
   * 刪除專案 Mutation
   * 成功後跳轉回專案列表頁面
   */
  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tToast('success.title'),
        description: tToast('success.deleted', { entity: t('entityName') }),
        variant: 'success',
      });
      router.push('/projects');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ============================================================
  // 事件處理函數
  // ============================================================

  /**
   * 處理刪除專案
   * 顯示確認對話框，確認後執行刪除操作
   */
  const handleDelete = () => {
    if (confirm(t('confirmDelete'))) {
      deleteMutation.mutate({ id });
    }
  };

  // ============================================================
  // 加載狀態渲染
  // ============================================================

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-muted-foreground">{t('loading')}</div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // 錯誤狀態渲染
  // ============================================================

  if (!project) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground mb-2">{t('notFound')}</h2>
            <p className="text-muted-foreground mb-4">{t('notFoundDescription')}</p>
            <Link href="/projects">
              <Button>{t('backToList')}</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ============================================================
  // 主要內容渲染
  // ============================================================

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/projects">{tNav('projects')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{project.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={getProjectStatusConfig(project.status).variant}>
                  {getProjectStatusConfig(project.status).label}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href={`/projects/${id}/edit`}>
              <Button variant="outline" size="default">
                <Edit className="h-4 w-4 mr-2" />
                {t('editProject')}
              </Button>
            </Link>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteMutation.isLoading ? t('deleting') : t('deleteProject')}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：主要資訊區域（2/3 寬度） */}
          <div className="lg:col-span-2 space-y-6">
            {/* 專案基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle>{t('projectInfo')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground mb-1">{t('projectDescription')}</dt>
                    <dd className="text-foreground">{project.description}</dd>
                  </div>
                )}

                {/* FEAT-001: 專案欄位擴展 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{t('fields.projectCode')}</dt>
                    <dd className="text-foreground font-mono font-medium mt-1">{project.projectCode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{t('fields.globalFlag')}</dt>
                    <dd className="mt-1">
                      <Badge variant={project.globalFlag === 'RCL' ? 'default' : 'secondary'}>
                        {project.globalFlag}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{t('fields.priority')}</dt>
                    <dd className="mt-1">
                      <Badge
                        variant={
                          project.priority === 'High' ? 'destructive' :
                          project.priority === 'Medium' ? 'warning' : 'secondary'
                        }
                      >
                        {t(`fields.priority.${project.priority.toLowerCase()}`)}
                      </Badge>
                    </dd>
                  </div>
                  {project.currency && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">{t('fields.currency')}</dt>
                      <dd className="text-foreground font-medium mt-1">
                        {project.currency.symbol} {project.currency.code} - {project.currency.name}
                      </dd>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{t('createdAt')}</dt>
                    <dd className="text-foreground font-medium mt-1">
                      {new Date(project.createdAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">{t('updatedAt')}</dt>
                    <dd className="text-foreground font-medium mt-1">
                      {new Date(project.updatedAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US')}
                    </dd>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 專案統計數據 */}
            {stats && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    {t('projectStats')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    {/* 提案統計 */}
                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        {t('budgetProposals')}
                      </h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('totalProposals')}</dt>
                          <dd className="font-medium text-foreground">{stats.totalProposals}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('approvedProposals')}</dt>
                          <dd className="font-medium text-green-600">
                            {stats.approvedProposals}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('totalProposedAmount')}</dt>
                          <dd className="font-medium text-foreground">
                            ${stats.totalProposedAmount.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('approvedAmount')}</dt>
                          <dd className="font-medium text-green-600">
                            ${stats.approvedAmount.toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>

                    {/* 採購與費用統計 */}
                    <div className="space-y-3 border-l pl-6">
                      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        {t('procurementAndExpenses')}
                      </h3>
                      <dl className="space-y-2">
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('totalPurchaseOrders')}</dt>
                          <dd className="font-medium text-foreground">{stats.totalPurchaseOrders}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('totalPurchaseAmount')}</dt>
                          <dd className="font-medium text-foreground">
                            ${stats.totalPurchaseAmount.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('totalExpenses')}</dt>
                          <dd className="font-medium text-foreground">{stats.totalExpenses}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-sm text-muted-foreground">{t('paidExpenseAmount')}</dt>
                          <dd className="font-medium text-primary">
                            ${stats.paidExpenseAmount.toLocaleString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 提案列表 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('proposalsList')} ({project.proposals.length})
                  </CardTitle>
                  <Link href={`/proposals/new?projectId=${id}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('newProposal')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.proposals.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('noProposals')}</p>
                ) : (
                  <div className="space-y-3">
                    {project.proposals.map((proposal) => (
                      <Link
                        key={proposal.id}
                        href={`/proposals/${proposal.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate">{proposal.title}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${proposal.amount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(proposal.createdAt).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US')}
                              </span>
                            </div>
                          </div>
                          <Badge variant={getProposalStatusConfig(proposal.status).variant}>
                            {getProposalStatusConfig(proposal.status).label}
                          </Badge>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 報價管理區塊 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('quoteManagement')}
                  </CardTitle>
                  <Link href={`/projects/${id}/quotes`}>
                    <Button variant="outline" size="sm">
                      {t('viewQuotes')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-6">
                  <p className="text-muted-foreground mb-4">
                    {t('quoteManagementDesc')}
                  </p>
                  <Link href={`/projects/${id}/quotes`}>
                    <Button>
                      {t('manageQuotes')}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 採購單列表 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5" />
                    {t('purchaseOrdersList')} ({project.purchaseOrders.length})
                  </CardTitle>
                  <Link href={`/purchase-orders/new?projectId=${id}`}>
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      {t('newPurchaseOrder')}
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {project.purchaseOrders.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">{t('noPurchaseOrders')}</p>
                ) : (
                  <div className="space-y-3">
                    {project.purchaseOrders.map((po) => (
                      <Link
                        key={po.id}
                        href={`/purchase-orders/${po.id}`}
                        className="block border border-border rounded-lg p-4 hover:border-primary hover:shadow-sm transition"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground">PO #{po.poNumber}</h3>
                            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                              <span>{t('vendor')}: {po.vendor.name}</span>
                              <span className="flex items-center gap-1">
                                <DollarSign className="h-3 w-3" />
                                ${po.totalAmount.toLocaleString()}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(po.date).toLocaleDateString(locale === 'zh-TW' ? 'zh-TW' : 'en-US')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右側：快速資訊欄（1/3 寬度） */}
          <div className="lg:col-span-1 space-y-6">
            {/* 預算池資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  {t('budgetPoolInfo')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/budget-pools/${project.budgetPool.id}`}
                  className="block hover:text-primary transition"
                >
                  <p className="font-medium text-lg text-foreground mb-3">{project.budgetPool.name}</p>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('financialYear')}</dt>
                      <dd className="font-medium text-foreground">{project.budgetPool.financialYear}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">{t('totalBudget')}</dt>
                      <dd className="font-medium text-foreground">
                        ${project.budgetPool.totalAmount.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </Link>
              </CardContent>
            </Card>

            {/* Module 2: 預算使用情況 */}
            {budgetUsage && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    {t('budgetUsage')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* 預算類別 */}
                  {budgetUsage.budgetCategory && (
                    <div className="pb-3 border-b border-border">
                      <dt className="text-sm font-medium text-muted-foreground mb-1">{t('budgetCategory')}</dt>
                      <dd className="text-foreground font-medium">{budgetUsage.budgetCategory.categoryName}</dd>
                    </div>
                  )}

                  {/* 預算金額資訊 */}
                  <dl className="space-y-3">
                    {budgetUsage.requestedBudget > 0 && (
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">{t('requestedBudget')}</dt>
                        <dd className="font-medium text-foreground">
                          ${budgetUsage.requestedBudget.toLocaleString()}
                        </dd>
                      </div>
                    )}

                    {budgetUsage.approvedBudget > 0 && (
                      <div className="flex justify-between items-center">
                        <dt className="text-sm text-muted-foreground">{t('approvedBudget')}</dt>
                        <dd className="font-semibold text-primary text-lg">
                          ${budgetUsage.approvedBudget.toLocaleString()}
                        </dd>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <dt className="text-sm text-muted-foreground">{t('actualSpent')}</dt>
                      <dd className="font-medium text-foreground">
                        ${budgetUsage.actualSpent.toLocaleString()}
                      </dd>
                    </div>

                    {budgetUsage.approvedBudget > 0 && (
                      <>
                        <div className="flex justify-between items-center">
                          <dt className="text-sm text-muted-foreground">{t('remainingBudget')}</dt>
                          <dd className={`font-medium ${budgetUsage.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${budgetUsage.remainingBudget.toLocaleString()}
                          </dd>
                        </div>

                        {/* 使用率進度條 */}
                        <div className="pt-2">
                          <div className="flex justify-between items-center mb-2">
                            <dt className="text-sm text-muted-foreground">{t('utilizationRate')}</dt>
                            <dd className={`font-semibold ${
                              budgetUsage.utilizationRate > 100 ? 'text-red-600' :
                              budgetUsage.utilizationRate > 90 ? 'text-orange-500' :
                              budgetUsage.utilizationRate > 75 ? 'text-yellow-600' :
                              'text-green-600'
                            }`}>
                              {budgetUsage.utilizationRate.toFixed(1)}%
                            </dd>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                budgetUsage.utilizationRate > 100 ? 'bg-red-600' :
                                budgetUsage.utilizationRate > 90 ? 'bg-orange-500' :
                                budgetUsage.utilizationRate > 75 ? 'bg-yellow-500' :
                                'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(budgetUsage.utilizationRate, 100)}%` }}
                            />
                          </div>
                          {budgetUsage.utilizationRate > 90 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-orange-600">
                              <AlertCircle className="h-3 w-3" />
                              <span>{t('budgetWarning')}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {budgetUsage.approvedBudget === 0 && budgetUsage.requestedBudget === 0 && (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">{t('noBudgetSet')}</p>
                      </div>
                    )}
                  </dl>
                </CardContent>
              </Card>
            )}

            {/* 專案團隊 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  {t('projectTeam')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 專案經理 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('projectManager')}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <span className="text-primary font-medium">
                        {project.manager.name?.charAt(0) || 'M'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{project.manager.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{project.manager.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.manager.role.name}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 主管 */}
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-2">{t('supervisor')}</h3>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-green-600 font-medium">
                        {project.supervisor.name?.charAt(0) || 'S'}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground">{project.supervisor.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{project.supervisor.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {project.supervisor.role.name}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t('quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/proposals/new?projectId=${id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    {t('newBudgetProposal')}
                  </Button>
                </Link>
                <Link href={`/purchase-orders/new?projectId=${id}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {t('newPurchaseOrder')}
                  </Button>
                </Link>
                <Link href={`/projects/${id}/edit`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Edit className="h-4 w-4 mr-2" />
                    {t('editProjectInfo')}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
