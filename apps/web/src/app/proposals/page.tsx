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
import Link from 'next/link';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText, LayoutGrid, List } from 'lucide-react';

export default function ProposalsPage() {
  const [viewMode, setViewMode] = useState<'card' | 'list'>('list');

  const { data: proposals, isLoading } = api.budgetProposal.getAll.useQuery();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
      Draft: { label: '草稿', variant: 'outline' },
      PendingApproval: { label: '待審批', variant: 'default' },
      Approved: { label: '已批准', variant: 'secondary' },
      Rejected: { label: '已拒絕', variant: 'destructive' },
      MoreInfoRequired: { label: '需更多資訊', variant: 'default' },
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
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>預算提案</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">預算提案</h1>
            <p className="mt-2 text-muted-foreground">管理所有專案的預算提案</p>
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
                新增提案
              </Button>
            </Link>
          </div>
        </div>

        {/* 提案顯示區域 - 根據視圖模式切換 */}
        {!proposals || proposals.length === 0 ? (
          <Card className="bg-muted">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground font-medium">尚無提案資料</p>
                <p className="text-sm text-muted-foreground mt-1">請點擊右上角「新增提案」按鈕建立第一個提案</p>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'card' ? (
          <>
            {/* 卡片視圖 */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {proposals.map((proposal) => (
                <Link
                  key={proposal.id}
                  href={`/proposals/${proposal.id}`}
                  className="block"
                >
                  <Card className="h-full transition-all hover:border-primary hover:shadow-md">
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
                          <span>專案：</span>
                          <span className="font-medium text-right">{proposal.project.name}</span>
                        </div>

                        {/* 金額 */}
                        <div className="flex justify-between">
                          <span>金額：</span>
                          <span className="font-medium text-primary text-lg">
                            ${proposal.amount.toLocaleString()}
                          </span>
                        </div>

                        {/* 建立時間 */}
                        <div className="flex justify-between">
                          <span>建立時間：</span>
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
                              編輯提案
                            </Link>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
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
                    <TableHead>提案標題</TableHead>
                    <TableHead>專案</TableHead>
                    <TableHead>金額</TableHead>
                    <TableHead>狀態</TableHead>
                    <TableHead>建立時間</TableHead>
                    <TableHead className="text-right">操作</TableHead>
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
                          查看
                        </Link>
                        {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                          <>
                            <span className="mx-2 text-muted-foreground">|</span>
                            <Link
                              href={`/proposals/${proposal.id}/edit`}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              編輯
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

        {/* Summary */}
        {proposals && (
          <div className="text-sm text-muted-foreground">
            總共 {proposals.length} 個提案
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
