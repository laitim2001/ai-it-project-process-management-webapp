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
import { Plus } from 'lucide-react';

export default function ProposalsPage() {
  const { data: proposals, isLoading } = api.budgetProposal.getAll.useQuery();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
      Draft: { label: '草稿', variant: 'default' },
      PendingApproval: { label: '待審批', variant: 'warning' },
      Approved: { label: '已批准', variant: 'success' },
      Rejected: { label: '已拒絕', variant: 'error' },
      MoreInfoRequired: { label: '需更多資訊', variant: 'warning' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' as const };

    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

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
            <h1 className="text-3xl font-bold text-gray-900">預算提案</h1>
            <p className="mt-2 text-gray-600">管理所有專案的預算提案</p>
          </div>
          <Link href="/proposals/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新增提案
            </Button>
          </Link>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-white shadow-sm">
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
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    載入中...
                  </TableCell>
                </TableRow>
              ) : !proposals || proposals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                    尚無提案資料
                  </TableCell>
                </TableRow>
              ) : (
                proposals.map((proposal) => (
                  <TableRow key={proposal.id}>
                    <TableCell>
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {proposal.title}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/projects/${proposal.project.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {proposal.project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${proposal.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{getStatusBadge(proposal.status)}</TableCell>
                    <TableCell className="text-gray-500">
                      {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/proposals/${proposal.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        查看
                      </Link>
                      {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
                        <>
                          <span className="mx-2 text-gray-300">|</span>
                          <Link
                            href={`/proposals/${proposal.id}/edit`}
                            className="text-gray-600 hover:text-gray-800"
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
        <div className="text-sm text-gray-600">
          總共 {proposals.length} 個提案
        </div>
      </div>
    </DashboardLayout>
  );
}
