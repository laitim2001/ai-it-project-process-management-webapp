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

interface ProposalDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProposalDetailPage({ params }: ProposalDetailPageProps) {
  const proposal = await api.budgetProposal.getById.query({ id: params.id });

  if (!proposal) {
    notFound();
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      Draft: { label: '草稿', className: 'bg-gray-100 text-gray-800' },
      PendingApproval: { label: '待審批', className: 'bg-yellow-100 text-yellow-800' },
      Approved: { label: '已批准', className: 'bg-green-100 text-green-800' },
      Rejected: { label: '已拒絕', className: 'bg-red-100 text-red-800' },
      MoreInfoRequired: { label: '需更多資訊', className: 'bg-orange-100 text-orange-800' },
    };

    const statusInfo = statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getActionLabel = (action: string) => {
    const actionMap: Record<string, string> = {
      SUBMITTED: '提交審批',
      APPROVED: '批准',
      REJECTED: '拒絕',
      MORE_INFO_REQUIRED: '需要更多資訊',
    };
    return actionMap[action] || action;
  };

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* 標題與操作按鈕 */}
      <div className="mb-8 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-gray-900">{proposal.title}</h1>
            {getStatusBadge(proposal.status)}
          </div>
          <p className="text-gray-600">
            專案：
            <Link
              href={`/projects/${proposal.project.id}`}
              className="ml-1 text-blue-600 hover:text-blue-800"
            >
              {proposal.project.name}
            </Link>
          </p>
        </div>
        <div className="flex gap-4">
          {(proposal.status === 'Draft' || proposal.status === 'MoreInfoRequired') && (
            <Link
              href={`/proposals/${proposal.id}/edit`}
              className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
            >
              編輯
            </Link>
          )}
          <Link
            href="/proposals"
            className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
          >
            返回列表
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左側主要內容 */}
        <div className="space-y-6 lg:col-span-2">
          {/* 基本資訊 */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">提案資訊</h2>
            <dl className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">預算金額</dt>
                <dd className="mt-1 text-2xl font-bold text-gray-900">
                  ${proposal.amount.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">狀態</dt>
                <dd className="mt-1">{getStatusBadge(proposal.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">建立時間</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(proposal.createdAt).toLocaleString('zh-TW')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">最後更新</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {new Date(proposal.updatedAt).toLocaleString('zh-TW')}
                </dd>
              </div>
            </dl>
          </div>

          {/* 專案資訊 */}
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">相關專案</h2>
            <div className="space-y-3">
              <div>
                <span className="text-sm font-medium text-gray-500">專案名稱：</span>
                <Link
                  href={`/projects/${proposal.project.id}`}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  {proposal.project.name}
                </Link>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">專案管理者：</span>
                <span className="ml-2 text-sm text-gray-900">
                  {proposal.project.manager.name || proposal.project.manager.email}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">監督者：</span>
                <span className="ml-2 text-sm text-gray-900">
                  {proposal.project.supervisor.name || proposal.project.supervisor.email}
                </span>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-500">預算池：</span>
                <Link
                  href={`/budget-pools/${proposal.project.budgetPool.id}`}
                  className="ml-2 text-blue-600 hover:text-blue-800"
                >
                  {proposal.project.budgetPool.name}
                </Link>
              </div>
            </div>
          </div>

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
            <div className="rounded-lg bg-white p-6 shadow-md">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">審批歷史</h2>
              <div className="space-y-4">
                {proposal.historyItems.map((history) => (
                  <div
                    key={history.id}
                    className="border-l-2 border-blue-500 pl-4"
                  >
                    <div className="flex items-center gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
