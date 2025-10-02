/**
 * BudgetProposal 列表頁面
 *
 * 顯示所有預算提案的列表，包含以下功能：
 * - 顯示提案資訊（標題、金額、狀態、專案）
 * - 根據狀態篩選
 * - 新增提案
 * - 查看詳情
 */

import Link from 'next/link';
import { api } from '@/lib/trpc';

export default async function ProposalsPage() {
  const proposals = await api.budgetProposal.getAll.query();

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
      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">預算提案</h1>
          <p className="mt-2 text-gray-600">管理所有專案的預算提案</p>
        </div>
        <Link
          href="/proposals/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          新增提案
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-md">
        <table className="w-full">
          <thead className="border-b bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                提案標題
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                專案
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                金額
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                狀態
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                建立時間
              </th>
              <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                操作
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {proposals.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  尚無提案資料
                </td>
              </tr>
            ) : (
              proposals.map((proposal) => (
                <tr key={proposal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link
                      href={`/proposals/${proposal.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {proposal.title}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <Link
                      href={`/projects/${proposal.project.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      {proposal.project.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    ${proposal.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{getStatusBadge(proposal.status)}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
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
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        總共 {proposals.length} 個提案
      </div>
    </div>
  );
}
