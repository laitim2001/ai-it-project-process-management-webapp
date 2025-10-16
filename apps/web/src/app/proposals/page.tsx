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

import Link from 'next/link';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, FileText } from 'lucide-react';

export default function ProposalsPage() {
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
          <Link href="/proposals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增提案
            </Button>
          </Link>
        </div>

        {/* Table */}
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
              {!proposals || proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center">
                      <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                      <p className="text-muted-foreground font-medium">尚無提案資料</p>
                      <p className="text-sm text-muted-foreground mt-1">請點擊右上角「新增提案」按鈕建立第一個提案</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="font-medium text-primary hover:text-primary"
                      >
                        {proposal.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${proposal.project.id}`}
                        className="text-primary hover:text-primary"
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
                        className="text-primary hover:text-primary"
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

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
