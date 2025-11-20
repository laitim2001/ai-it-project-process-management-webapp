/**
 * @fileoverview Charge Out Detail Page - 費用轉嫁詳情頁面
 *
 * @description
 * 顯示單一費用轉嫁的完整資訊，包含專案、預算類別、成本中心和審批狀態。
 * 提供審批工作流操作，Supervisor 可在此頁面進行審批操作。
 *
 * @page /[locale]/charge-outs/[id]
 *
 * @features
 * - 費用轉嫁詳情展示（專案、預算類別、成本中心、金額、日期）
 * - 專案資訊展示（專案名稱、預算池）
 * - 預算類別資訊展示（類別名稱、預算）
 * - 審批工作流（提交、審批、拒絕）
 * - 狀態徽章顯示（Draft, Submitted, Approved, Completed）
 * - 審批歷史記錄（狀態變更軌跡）
 * - 編輯操作（僅 Draft 狀態可編輯）
 * - 權限控制（根據角色和轉嫁狀態控制操作權限）
 * - 麵包屑導航
 *
 * @permissions
 * - ProjectManager: 查看和編輯自己專案的費用轉嫁
 * - Supervisor: 查看所有費用轉嫁，審批 Submitted 轉嫁
 * - Admin: 完整權限
 *
 * @routing
 * - 詳情頁: /charge-outs/[id]
 * - 編輯頁: /charge-outs/[id]/edit
 * - 返回列表: /charge-outs
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/chargeOut.ts` - ChargeOut API Router（查詢詳情、審批工作流操作）
 * - `packages/db/prisma/schema.prisma` - ChargeOut, ChargeOutItem, Expense, Project, OperatingCompany 資料模型定義
 * - `apps/web/src/components/charge-out/ChargeOutActions.tsx` - ChargeOut 操作按鈕組件（提交、確認、拒絕、標記為已支付）
 * - `apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx` - ChargeOut 編輯頁（僅 Draft 狀態可導向）
 * - `apps/web/src/app/[locale]/charge-outs/page.tsx` - ChargeOut 列表頁（返回列表）
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { useRouter } from "@/i18n/routing";
import { Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Building2, FolderOpen, DollarSign, Calendar, FileText } from 'lucide-react';
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
import { ChargeOutActions } from '@/components/charge-out/ChargeOutActions';

export default function ChargeOutDetailPage({ params }: { params: { id: string } }) {
  const t = useTranslations('chargeOuts');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { data: session } = useSession();

  // 獲取 ChargeOut 詳情
  const { data: chargeOut, isLoading } = api.chargeOut.getById.useQuery({
    id: params.id,
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

  // 格式化日期時間
  const formatDateTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  // 格式化日期
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('zh-HK').format(new Date(date));
  };

  // 狀態顏色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft':
        return 'bg-gray-500';
      case 'Submitted':
        return 'bg-yellow-500';
      case 'Confirmed':
        return 'bg-green-500';
      case 'Paid':
        return 'bg-blue-500';
      case 'Rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 狀態文字
  const getStatusText = (status: string) => {
    switch (status) {
      case 'Draft':
        return tCommon('status.draft');
      case 'Submitted':
        return tCommon('status.submitted');
      case 'Confirmed':
        return tCommon('status.confirmed');
      case 'Paid':
        return tCommon('status.paid');
      case 'Rejected':
        return tCommon('status.rejected');
      default:
        return status;
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">{tCommon('loading')}</div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!chargeOut) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('detail.notFound')}</p>
          <Button className="mt-4" onClick={() => router.push('/charge-outs')}>
            {tCommon('actions.back')}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <Link href="/dashboard">{tNav('home')}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <Link href="/charge-outs">{tNav('menu.chargeOuts')}</Link>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{chargeOut.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題和操作 */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold">{chargeOut.name}</h1>
                <p className="mt-2 text-muted-foreground">
                  {chargeOut.description || t('detail.noDescription')}
                </p>
              </div>
            </div>
          </div>
          <Badge className={`${getStatusColor(chargeOut.status)} text-lg px-4 py-2`}>
            {getStatusText(chargeOut.status)}
          </Badge>
        </div>
      </div>

      {/* 狀態操作按鈕 */}
      <div className="mb-6">
        <ChargeOutActions
          chargeOut={chargeOut}
          currentUserRole={(session?.user as any)?.role?.name}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左側：基本信息 + 費用明細 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基本信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t('detail.basicInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">ChargeOut ID</div>
                  <div className="font-mono text-sm">{chargeOut.id}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{tCommon('fields.status')}</div>
                  <div>
                    <Badge className={getStatusColor(chargeOut.status)}>
                      {getStatusText(chargeOut.status)}
                    </Badge>
                  </div>
                </div>
                {chargeOut.debitNoteNumber && (
                  <div>
                    <div className="text-sm text-muted-foreground">{t('detail.debitNoteNumber')}</div>
                    <div className="font-medium">{chargeOut.debitNoteNumber}</div>
                  </div>
                )}
                {chargeOut.issueDate && (
                  <div>
                    <div className="text-sm text-muted-foreground">{t('detail.issueDate')}</div>
                    <div className="font-medium">{formatDate(chargeOut.issueDate)}</div>
                  </div>
                )}
                {chargeOut.paymentDate && (
                  <div>
                    <div className="text-sm text-muted-foreground">{t('detail.paymentDate')}</div>
                    <div className="font-medium">{formatDate(chargeOut.paymentDate)}</div>
                  </div>
                )}
              </div>

              {chargeOut.confirmer && (
                <div className="border-t pt-4">
                  <div className="text-sm text-muted-foreground">{t('detail.confirmer')}</div>
                  <div className="font-medium">{chargeOut.confirmer.name || chargeOut.confirmer.email}</div>
                  {chargeOut.confirmedAt && (
                    <div className="text-xs text-muted-foreground">
                      {t('detail.confirmedAt')}: {formatDateTime(chargeOut.confirmedAt)}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 費用明細卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('detail.expenseItems')}
              </CardTitle>
              <CardDescription>{t('detail.itemsCount', { count: chargeOut.items.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2 text-left text-sm font-medium">#</th>
                      <th className="p-2 text-left text-sm font-medium">{t('detail.table.expenseName')}</th>
                      <th className="p-2 text-left text-sm font-medium">{t('detail.table.invoiceNumber')}</th>
                      <th className="p-2 text-right text-sm font-medium">{t('detail.table.amount')}</th>
                      <th className="p-2 text-left text-sm font-medium">{tCommon('form.description.label')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chargeOut.items
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((item, index) => (
                        <tr key={item.id} className="border-b hover:bg-muted/50">
                          <td className="p-2 text-sm">{index + 1}</td>
                          <td className="p-2 text-sm">
                            <div className="font-medium">{item.expense.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {item.expense.expenseDate
                                ? formatDate(item.expense.expenseDate)
                                : 'N/A'}
                            </div>
                          </td>
                          <td className="p-2 text-sm">
                            {item.expense.invoiceNumber || 'N/A'}
                          </td>
                          <td className="p-2 text-right text-sm font-medium">
                            {formatCurrency(item.amount)}
                          </td>
                          <td className="p-2 text-sm text-muted-foreground">
                            {item.description || '-'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 font-semibold">
                      <td colSpan={3} className="p-2 text-right">
                        {t('detail.total')}
                      </td>
                      <td className="p-2 text-right text-lg text-primary">
                        {formatCurrency(chargeOut.totalAmount)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右側：相關信息 */}
        <div className="space-y-6">
          {/* 項目信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                {t('detail.projectInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">{t('detail.projectName')}</div>
                <div className="font-medium">{chargeOut.project.name}</div>
              </div>
              {chargeOut.project.description && (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.projectDescription')}</div>
                  <div className="text-sm">{chargeOut.project.description}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">{t('detail.projectManager')}</div>
                <div className="text-sm">
                  {chargeOut.project.manager.name || chargeOut.project.manager.email}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* OpCo 信息卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('detail.opCoInfo')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">{t('detail.opCoCode')}</div>
                <div className="font-medium">{chargeOut.opCo.code}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{t('detail.opCoName')}</div>
                <div className="font-medium">{chargeOut.opCo.name}</div>
              </div>
              {chargeOut.opCo.description && (
                <div>
                  <div className="text-sm text-muted-foreground">{tCommon('form.description.label')}</div>
                  <div className="text-sm">{chargeOut.opCo.description}</div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 時間軸卡片 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('detail.timeline')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="text-sm text-muted-foreground">{tCommon('fields.createdAt')}</div>
                <div className="text-sm">{formatDateTime(chargeOut.createdAt)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">{tCommon('fields.updatedAt')}</div>
                <div className="text-sm">{formatDateTime(chargeOut.updatedAt)}</div>
              </div>
              {chargeOut.confirmedAt && (
                <div>
                  <div className="text-sm text-muted-foreground">{t('detail.confirmedAt')}</div>
                  <div className="text-sm">{formatDateTime(chargeOut.confirmedAt)}</div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
