'use client';

/**
 * ProposalActions 組件
 *
 * 處理預算提案的操作按鈕（提交、審批等）
 */

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from "@/i18n/routing";
import { useSession } from 'next-auth/react';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

interface ProposalActionsProps {
  proposalId: string;
  status: string;
}

export function ProposalActions({ proposalId, status }: ProposalActionsProps) {
  const t = useTranslations('proposals');
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const utils = api.useContext();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 從 session 獲取當前用戶 ID
  const userId = session?.user?.id;

  const submitMutation = api.budgetProposal.submit.useMutation({
    onSuccess: async () => {
      toast({
        title: '成功',
        description: '提案已提交審批！',
        variant: 'success',
      });
      // 修復 Bug #4: 手動觸發數據重新獲取，確保 UI 立即更新
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = api.budgetProposal.approve.useMutation({
    onSuccess: async () => {
      toast({
        title: '成功',
        description: '審批完成！',
        variant: 'success',
      });
      setComment('');
      // 修復 Bug #5: 手動觸發數據重新獲取，確保 UI 立即更新
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: '錯誤',
        description: '請先登入',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        id: proposalId,
        userId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (action: 'Approved' | 'Rejected' | 'MoreInfoRequired') => {
    if (!userId) {
      toast({
        title: '錯誤',
        description: '請先登入',
        variant: 'destructive',
      });
      return;
    }

    if (action !== 'Approved' && !comment.trim()) {
      toast({
        title: '錯誤',
        description: '請提供審批意見',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await approveMutation.mutateAsync({
        id: proposalId,
        userId,
        action,
        comment: comment || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">操作</h2>

      {/* 草稿或需更多資訊狀態：可以提交審批 */}
      {(status === 'Draft' || status === 'MoreInfoRequired') && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '提交中...' : '提交審批'}
        </button>
      )}

      {/* 待審批狀態：顯示審批選項 */}
      {status === 'PendingApproval' && (
        <div className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              審批意見
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="請輸入審批意見..."
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleApprove('Approved')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              批准
            </button>
            <button
              onClick={() => handleApprove('Rejected')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
            >
              拒絕
            </button>
            <button
              onClick={() => handleApprove('MoreInfoRequired')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              需要更多資訊
            </button>
          </div>
        </div>
      )}

      {/* 已批准狀態 */}
      {status === 'Approved' && (
        <div className="rounded-md bg-green-50 p-4 text-center">
          <p className="text-sm font-medium text-green-800">此提案已批准</p>
        </div>
      )}

      {/* 已拒絕狀態 */}
      {status === 'Rejected' && (
        <div className="rounded-md bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-800">此提案已被拒絕</p>
        </div>
      )}
    </div>
  );
}
