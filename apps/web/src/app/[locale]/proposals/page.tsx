/**
 * BudgetProposal 列表頁面
 *
 * 顯示所有預算提案的列表，包含以下功能：
 * - 顯示提案資訊（標題、金額、狀態、專案）
 * - 根據狀態篩選
 * - 新增提案
 * - 查看詳情
 */

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, LayoutGrid, List, Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

type ProposalStatus = 'Draft' | 'PendingApproval' | 'Approved' | 'Rejected' | 'MoreInfoRequired';

export default function ProposalsPage() {
  const t = useTranslations('proposals');
  const tCommon = useTranslations('common');
  const tNav = useTranslations('navigation');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | undefined>(undefined);
  const router = useRouter();

  // Debounce search to avoid too many API requests
  const debouncedSearch = useDebounce(search, 300);

  const { data: proposals, isLoading } = api.budgetProposal.getAll.useQuery({
    search: debouncedSearch || undefined,
    status: statusFilter,
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      Draft: { label: t('status.draft'), variant: 'outline' },
      PendingApproval: { label: t('status.pendingApproval'), variant: 'default' },
      Approved: { label: t('status.approved'), variant: 'secondary' },
      Rejected: { label: t('status.rejected'), variant: 'destructive' },
      MoreInfoRequired: { label: t('status.moreInfoRequired'), variant: 'default' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          {/* Breadcrumb Skeleton */}
          <Skeleton className="h-5 w-64" />

          {/* Header Skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table Skeleton */}
          <div className="rounded-lg border bg-card shadow-sm">
            <div className="p-6 space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
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
              <BreadcrumbLink asChild><Link href="/dashboard">{tNav('dashboard')}</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t('title')}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
          <div className="flex gap-2">
            {/* 視圖切換按鈕 */}
            <div className="flex border border-input rounded-md">
              <Button
                variant={viewMode === 'card' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="rounded-r-none"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Link href="/proposals/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('actions.create')}
              </Button>
            </Link>
          </div>
        </div>

        {/* 搜尋和篩選欄 */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              {/* 搜尋框 */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder={t('search.placeholder')}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* 狀態篩選 */}
              <div className="flex gap-2">
                <select
                  value={statusFilter ?? ''}
                  onChange={(e) => {
                    setStatusFilter(
                      e.target.value
                        ? (e.target.value as ProposalStatus)
                        : undefined
                    );
                  }}
                  className="h-10 rounded-md border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/20"
                >
                  <option value="">{t('filters.allStatuses')}</option>
                  <option value="Draft">{t('status.draft')}</option>
                  <option value="PendingApproval">{t('status.pendingApproval')}</option>
                  <option value="Approved">{t('status.approved')}</option>
                  <option value="Rejected">{t('status.rejected')}</option>
                  <option value="MoreInfoRequired">{t('status.moreInfoRequired')}</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 結果數量統計 */}
        {proposals && proposals.length > 0 && (
          <div className="text-sm text-muted-foreground">
            {t('summary.total', { count: proposals.length })}
          </div>
        )}

        {/* 提案顯示區域 - 根據視圖模式切換 */}
        {!proposals || proposals.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">
                  {search || statusFilter ? tCommon('noData') : tCommon('noData')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{t('empty.hint')}</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <Card
                  key={proposal.id}
                  className="h-full transition-all hover:border-primary hover:shadow-md cursor-pointer"
                  onClick={() => router.push(`/proposals/${proposal.id}`)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl flex-1">{proposal.title}</CardTitle>
                      {getStatusBadge(proposal.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {/* 專案 */}
                      <div className="flex justify-between">
                        <span>{t('fields.project')}：</span>
                        <span className="font-medium text-right">{proposal.project.name}</span>
                      </div>

                      {/* 金額 */}
                      <div className="flex justify-between">
                        <span>{t('fields.amount')}：</span>
                        <span className="font-medium text-primary text-lg">
                          ${proposal.amount.toLocaleString()}
                        </span>
                      </div>

                      {/* 建立時間 */}
                      <div className="flex justify-between">
                        <span>{tCommon('fields.createdAt')}：</span>
                        <span className="font-medium">
                          {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                        </span>
                      </div>

                      {/* 操作按鈕 */}
                      {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                        <div className="pt-2 border-t border-border">
                          <Link
                            href={`/proposals/${proposal.id}/edit`}
                            className="text-sm text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {t('actions.edit')}
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        ) : (
          <>
            {/* 列表視圖 */}
            <div className="rounded-lg border bg-card shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('fields.title')}</TableHead>
                    <TableHead>{t('fields.project')}</TableHead>
                    <TableHead>{t('fields.amount')}</TableHead>
                    <TableHead>{t('fields.status')}</TableHead>
                    <TableHead>{tCommon('fields.createdAt')}</TableHead>
                    <TableHead className="text-right">{tCommon('fields.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {proposals.map((proposal) => (
                    <TableRow key={proposal.id} className="hover:bg-muted/50">
                      <TableCell>
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {proposal.title}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/projects/${proposal.project.id}`}
                          className="text-primary hover:underline"
                        >
                          {proposal.project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-medium">
                        ${proposal.amount.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/proposals/${proposal.id}`}
                          className="text-primary hover:underline"
                        >
                          {tCommon('actions.view')}
                        </Link>
                        {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                          <>
                            <span className="mx-2 text-muted-foreground">|</span>
                            <Link
                              href={`/proposals/${proposal.id}/edit`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {tCommon('actions.edit')}
                            </Link>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
