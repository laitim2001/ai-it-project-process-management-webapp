/**
 * BudgetProposal 詳情頁面
 *
 * 顯示預算提案的完整資訊，包含：
 * - 基本資訊
 * - 審批功能（提交、審批）
 * - 評論系統
 * - 審批歷史
 */

import Link from 'next/link';
import { notFound } from 'next/navigation';
import { api } from '@/lib/trpc';
import { ProposalActions } from '@/components/proposal/ProposalActions';
import { CommentSection } from '@/components/proposal/CommentSection';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { FileText, DollarSign, Calendar, User, History, Building2 } from 'lucide-react';

interface ProposalDetailPageProps {
  params: {
    id: string;
  };
}

/**
 * 提案狀態顯示配置
 */
const PROPOSAL_STATUS_CONFIG = {
  Draft: { label: '草稿', variant: 'default' as const },
  PendingApproval: { label: '待審批', variant: 'warning' as const },
  Approved: { label: '已批准', variant: 'success' as const },
  Rejected: { label: '已拒絕', variant: 'error' as const },
  MoreInfoRequired: { label: '需更多資訊', variant: 'warning' as const },
} as const;

/**
 * 審批動作標籤映射
 */
const ACTION_LABELS: Record<string, string> = {
  SUBMITTED: '提交審批',
  APPROVED: '批准',
  REJECTED: '拒絕',
  MORE_INFO_REQUIRED: '需要更多資訊',
};

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const proposal = await api.budgetProposal.getById.query({ id: params.id });

  if (!proposal) {
    notFound();
  }

  const getActionLabel = (action: string) => ACTION_LABELS[action] || action;

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
              <BreadcrumbLink href="/proposals">預算提案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{proposal.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題和操作按鈕 */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
              <Badge variant={PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].variant}>
                {PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].label}
              </Badge>
            </div>
            <p className="text-gray-600">
              專案：
              <Link
                href={`/projects/${proposal.project.id}`}
                className="ml-1 text-blue-600 hover:text-blue-800 font-medium"
              >
                {proposal.project.name}
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
              <Link href={`/proposals/${proposal.id}/edit`}>
                <Button variant="outline">編輯</Button>
              </Link>
            )}
            <Link href="/proposals">
              <Button variant="outline">返回列表</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側主要內容 */}
          <div className="space-y-6 lg:col-span-2">
            {/* 基本資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  提案資訊
                </CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">預算金額</dt>
                    <dd className="text-2xl font-bold text-gray-900 flex items-center gap-1">
                      <DollarSign className="h-5 w-5" />
                      ${proposal.amount.toLocaleString()}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">狀態</dt>
                    <dd>
                      <Badge variant={PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].variant}>
                        {PROPOSAL_STATUS_CONFIG[proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG].label}
                      </Badge>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">建立時間</dt>
                    <dd className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(proposal.createdAt).toLocaleString('zh-TW')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 mb-1">最後更新</dt>
                    <dd className="text-sm text-gray-900 flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(proposal.updatedAt).toLocaleString('zh-TW')}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* 專案資訊 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  相關專案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm font-medium text-gray-500">專案名稱：</span>
                  <Link
                    href={`/projects/${proposal.project.id}`}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {proposal.project.name}
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">專案管理者</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-sm text-gray-900">
                        {proposal.project.manager.name || proposal.project.manager.email}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-500 block mb-2">監督者</span>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      <span className="text-sm text-gray-900">
                        {proposal.project.supervisor.name || proposal.project.supervisor.email}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-500">預算池：</span>
                  <Link
                    href={`/budget-pools/${proposal.project.budgetPool.id}`}
                    className="ml-2 text-blue-600 hover:text-blue-800 font-medium"
                  >
                    {proposal.project.budgetPool.name}
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 評論區 */}
            <CommentSection
              proposalId={proposal.id}
              comments={proposal.comments}
            />
          </div>

          {/* 右側邊欄 */}
          <div className="space-y-6">
            {/* 操作區 */}
            <ProposalActions
              proposalId={proposal.id}
              status={proposal.status}
            />

            {/* 審批歷史 */}
            {proposal.historyItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <History className="h-5 w-5" />
                    審批歷史
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {proposal.historyItems.map((history) => (
                      <div
                        key={history.id}
                        className="border-l-2 border-blue-500 pl-4"
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-900">
                            {getActionLabel(history.action)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(history.createdAt).toLocaleString('zh-TW')}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">
                          {history.user.name || history.user.email}
                        </p>
                        {history.details && (
                          <p className="mt-1 text-sm text-gray-500">{history.details}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
