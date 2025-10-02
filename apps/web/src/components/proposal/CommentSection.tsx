'use client';

/**
 * CommentSection 組件
 *
 * 顯示和新增提案評論
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/Toast';

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
  const { showToast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock userId - 在實際應用中應從 session 獲取
  const mockUserId = 'mock-user-id';

  const addCommentMutation = api.budgetProposal.addComment.useMutation({
    onSuccess: () => {
      showToast('評論已新增！', 'success');
      setNewComment('');
      router.refresh();
    },
    onError: (error) => {
      showToast(`錯誤: ${error.message}`, 'error');
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      showToast('請輸入評論內容', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await addCommentMutation.mutateAsync({
        budgetProposalId: proposalId,
        userId: mockUserId,
        content: newComment,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">
        評論 ({comments.length})
      </h2>

      {/* 評論列表 */}
      <div className="mb-6 space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-sm text-gray-500">尚無評論</p>
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
            新增評論
          </label>
          <textarea
            id="newComment"
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
            placeholder="輸入您的評論..."
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '發送中...' : '發送評論'}
        </button>
      </form>
    </div>
  );
}
