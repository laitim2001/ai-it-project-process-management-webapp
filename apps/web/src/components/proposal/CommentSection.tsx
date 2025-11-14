'use client';

/**
 * @fileoverview 提案評論區組件
 *
 * @description
 * 提案詳情頁面的評論功能組件，支援查看評論歷史和新增評論。
 * 評論用於主管和專案經理之間的溝通，記錄審批討論過程。
 *
 * @module apps/web/src/components/proposal/CommentSection
 * @component CommentSection
 * @author IT Department
 * @since Epic 3 - Story 3.3 (Proposal Comments)
 * @lastModified 2025-11-14
 *
 * @features
 * - 顯示評論列表（含作者和時間）
 * - 新增評論表單
 * - 即時更新評論（使用 tRPC invalidation）
 * - 空狀態提示
 * - 評論計數顯示
 *
 * @dependencies
 * - @/lib/trpc - tRPC client
 * - next-auth/react - Session 管理
 * - next-intl - 國際化
 * - @/components/ui - Toast 通知
 *
 * @related
 * - ../../app/[locale]/proposals/[id]/page.tsx - 使用此組件的提案詳情頁
 * - ../../../../packages/api/src/routers/budgetProposal.ts - API addComment procedure
 * - ../../../../packages/db/prisma/schema.prisma - Comment model
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui';

interface Comment {
  id: string;
  content: string;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface CommentSectionProps {
  proposalId: string;
  comments: Comment[];
}

export function CommentSection({ proposalId, comments }: CommentSectionProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const t = useTranslations('proposals.comments');
  const { toast } = useToast();
  const utils = api.useContext();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addCommentMutation = api.budgetProposal.addComment.useMutation({
    onSuccess: async () => {
      toast({
        title: t('addSuccess'),
        description: t('addSuccessDescription'),
        variant: 'success',
      });
      setNewComment('');
      // 修復問題2: 手動觸發數據重新獲取，確保評論列表立即更新
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: t('error'),
        description: `${t('addError')}: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast({
        title: t('error'),
        description: t('emptyContent'),
        variant: 'destructive',
      });
      return;
    }

    if (!session?.user?.id) {
      toast({
        title: t('error'),
        description: t('loginRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        budgetProposalId: proposalId,
        userId: session.user.id,
        content: newComment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        {t('title')} ({comments.length})
      </h2>

      {/* 評論列表 */}
      <div className="mb-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500">{t('noComments')}</p>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  {comment.user.name || comment.user.email}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString('zh-TW')}
                </span>
              </div>
              <p className="text-sm text-gray-700">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      {/* 新增評論表單 */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="newComment" className="block text-sm font-medium text-gray-700">
            {t('addComment')}
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder={t('placeholder')}
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>
    </div>
  );
}
