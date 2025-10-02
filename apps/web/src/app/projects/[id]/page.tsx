/**
 * Project 詳情頁面
 *
 * 功能說明：
 * - 顯示專案的完整資訊（名稱、描述、狀態、預算池、專案經理、主管）
 * - 顯示專案統計數據（提案數量和金額、採購單數量和金額、費用統計）
 * - 顯示關聯的提案列表
 * - 顯示關聯的採購單列表
 * - 提供編輯和刪除操作
 *
 * 頁面佈局：
 * - 左側 2/3：專案資訊、統計數據、提案列表、採購單列表
 * - 右側 1/3：快速操作、專案團隊資訊、預算池資訊
 *
 * 業務邏輯：
 * - 刪除前檢查是否有關聯的提案或採購單
 * - 狀態變更影響專案生命週期
 */

'use client';

import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui';

/**
 * 專案狀態顯示配置
 */
const PROJECT_STATUS_CONFIG = {
  Draft: {
    label: '草稿',
    color: 'bg-gray-100 text-gray-800',
  },
  InProgress: {
    label: '進行中',
    color: 'bg-blue-100 text-blue-800',
  },
  Completed: {
    label: '已完成',
    color: 'bg-green-100 text-green-800',
  },
  Archived: {
    label: '已歸檔',
    color: 'bg-gray-100 text-gray-600',
  },
} as const;

/**
 * 提案狀態顯示配置
 */
const PROPOSAL_STATUS_CONFIG = {
  Draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  PendingApproval: { label: '待審批', color: 'bg-yellow-100 text-yellow-800' },
  Approved: { label: '已批准', color: 'bg-green-100 text-green-800' },
  Rejected: { label: '已拒絕', color: 'bg-red-100 text-red-800' },
  MoreInfoRequired: { label: '需補充資訊', color: 'bg-orange-100 text-orange-800' },
} as const;

export default function ProjectDetailPage() {
  // ============================================================
  // Hooks 和 Router
  // ============================================================

  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const id = params.id as string;

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
   * 刪除專案 Mutation
   * 成功後跳轉回專案列表頁面
   */
  const deleteMutation = api.project.delete.useMutation({
    onSuccess: () => {
      showToast('專案已成功刪除！', 'success');
      router.push('/projects');
      router.refresh();
    },
    onError: (error) => {
      showToast(`錯誤：${error.message}`, 'error');
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
    if (
      confirm(
        '確定要刪除此專案嗎？\n\n注意：如果專案有關聯的提案或採購單，將無法刪除。'
      )
    ) {
      deleteMutation.mutate({ id });
    }
  };

  // ============================================================
  // 加載狀態渲染
  // ============================================================

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">載入中...</div>
      </div>
    );
  }

  // ============================================================
  // 錯誤狀態渲染
  // ============================================================

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到專案</h2>
          <p className="text-gray-600 mb-4">此專案不存在或已被刪除。</p>
          <Link href="/projects">
            <Button variant="primary">返回專案列表</Button>
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // 主要內容渲染
  // ============================================================

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 頁面標題和操作按鈕 */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/projects"
            className="text-gray-600 hover:text-gray-900"
          >
            ← 返回列表
          </Link>
          <h1 className="text-3xl font-bold">{project.name}</h1>
          <span
            className={`px-3 py-1 text-sm font-medium rounded ${
              PROJECT_STATUS_CONFIG[
                project.status as keyof typeof PROJECT_STATUS_CONFIG
              ].color
            }`}
          >
            {
              PROJECT_STATUS_CONFIG[
                project.status as keyof typeof PROJECT_STATUS_CONFIG
              ].label
            }
          </span>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${id}/edit`}>
            <Button variant="secondary">編輯專案</Button>
          </Link>
          <Button
            variant="danger"
            onClick={handleDelete}
            isLoading={deleteMutation.isLoading}
          >
            {deleteMutation.isLoading ? '刪除中...' : '刪除專案'}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 左側：主要資訊區域（2/3 寬度） */}
        <div className="lg:col-span-2 space-y-6">
          {/* 專案基本資訊 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold">專案資訊</h2>
            <dl className="space-y-3">
              {project.description && (
                <div>
                  <dt className="text-gray-600 mb-1">專案描述：</dt>
                  <dd className="text-gray-900">{project.description}</dd>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-gray-600">創建時間：</dt>
                  <dd className="font-medium">
                    {new Date(project.createdAt).toLocaleDateString('zh-TW')}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-600">最後更新：</dt>
                  <dd className="font-medium">
                    {new Date(project.updatedAt).toLocaleDateString('zh-TW')}
                  </dd>
                </div>
              </div>
            </dl>
          </div>

          {/* 專案統計數據 */}
          {stats && (
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <h2 className="mb-4 text-xl font-semibold">專案統計</h2>
              <div className="grid grid-cols-2 gap-4">
                {/* 提案統計 */}
                <div className="border-r pr-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">預算提案</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">提案總數：</dt>
                      <dd className="font-medium">{stats.totalProposals}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">已批准：</dt>
                      <dd className="font-medium text-green-600">
                        {stats.approvedProposals}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">提案總金額：</dt>
                      <dd className="font-medium">
                        ${stats.totalProposedAmount.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">已批准金額：</dt>
                      <dd className="font-medium text-green-600">
                        ${stats.approvedAmount.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>

                {/* 採購與費用統計 */}
                <div className="pl-4">
                  <h3 className="text-sm font-medium text-gray-600 mb-3">採購與費用</h3>
                  <dl className="space-y-2">
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">採購單數量：</dt>
                      <dd className="font-medium">{stats.totalPurchaseOrders}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">採購總金額：</dt>
                      <dd className="font-medium">
                        ${stats.totalPurchaseAmount.toLocaleString()}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">費用記錄數：</dt>
                      <dd className="font-medium">{stats.totalExpenses}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-sm text-gray-600">已支付金額：</dt>
                      <dd className="font-medium text-blue-600">
                        ${stats.paidExpenseAmount.toLocaleString()}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          )}

          {/* 提案列表 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                預算提案 ({project.proposals.length})
              </h2>
              <Link href={`/proposals/new?projectId=${id}`}>
                <Button variant="secondary" size="sm">
                  新增提案
                </Button>
              </Link>
            </div>
            {project.proposals.length === 0 ? (
              <p className="text-gray-500 text-center py-4">尚未有任何提案</p>
            ) : (
              <div className="space-y-3">
                {project.proposals.map((proposal) => (
                  <Link
                    key={proposal.id}
                    href={`/proposals/${proposal.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">{proposal.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          金額：${proposal.amount.toLocaleString()} |{' '}
                          創建時間：{new Date(proposal.createdAt).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded ${
                          PROPOSAL_STATUS_CONFIG[
                            proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG
                          ].color
                        }`}
                      >
                        {
                          PROPOSAL_STATUS_CONFIG[
                            proposal.status as keyof typeof PROPOSAL_STATUS_CONFIG
                          ].label
                        }
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 採購單列表 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                採購單 ({project.purchaseOrders.length})
              </h2>
              <Link href={`/purchase-orders/new?projectId=${id}`}>
                <Button variant="secondary" size="sm">
                  新增採購單
                </Button>
              </Link>
            </div>
            {project.purchaseOrders.length === 0 ? (
              <p className="text-gray-500 text-center py-4">尚未有任何採購單</p>
            ) : (
              <div className="space-y-3">
                {project.purchaseOrders.map((po) => (
                  <Link
                    key={po.id}
                    href={`/purchase-orders/${po.id}`}
                    className="block border border-gray-200 rounded-lg p-4 hover:border-blue-500 hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">PO #{po.poNumber}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          供應商：{po.vendor.name} | 金額：$
                          {po.totalAmount.toLocaleString()} | 日期：
                          {new Date(po.date).toLocaleDateString('zh-TW')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右側：快速資訊欄（1/3 寬度） */}
        <div className="lg:col-span-1 space-y-6">
          {/* 預算池資訊 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">預算池</h2>
            <Link
              href={`/budget-pools/${project.budgetPool.id}`}
              className="block hover:text-blue-600"
            >
              <p className="font-medium text-lg mb-2">{project.budgetPool.name}</p>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">財務年度：</dt>
                  <dd className="font-medium">{project.budgetPool.financialYear}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-600">總預算：</dt>
                  <dd className="font-medium">
                    ${project.budgetPool.totalAmount.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </Link>
          </div>

          {/* 專案團隊 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">專案團隊</h2>
            <div className="space-y-4">
              {/* 專案經理 */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">專案經理</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {project.manager.name?.charAt(0) || 'M'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{project.manager.name}</p>
                    <p className="text-sm text-gray-600">{project.manager.email}</p>
                    <p className="text-xs text-gray-500">
                      {project.manager.role.name}
                    </p>
                  </div>
                </div>
              </div>

              {/* 主管 */}
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">主管</h3>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-green-600 font-medium">
                      {project.supervisor.name?.charAt(0) || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{project.supervisor.name}</p>
                    <p className="text-sm text-gray-600">{project.supervisor.email}</p>
                    <p className="text-xs text-gray-500">
                      {project.supervisor.role.name}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 快速操作 */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold">快速操作</h2>
            <div className="space-y-2">
              <Link href={`/proposals/new?projectId=${id}`} className="block">
                <Button variant="secondary" fullWidth>
                  新增預算提案
                </Button>
              </Link>
              <Link href={`/purchase-orders/new?projectId=${id}`} className="block">
                <Button variant="secondary" fullWidth>
                  新增採購單
                </Button>
              </Link>
              <Link href={`/projects/${id}/edit`} className="block">
                <Button variant="secondary" fullWidth>
                  編輯專案資訊
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
