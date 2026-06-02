/**
 * @fileoverview Proposal Actions Component - 預算提案操作按鈕組件
 *
 * @description
 * 預算提案詳情頁面的操作按鈕組件，根據提案狀態顯示不同的操作選項。
 * 支援提交審批、批准、拒絕、請求更多資訊和回退到草稿等工作流程操作。
 * 整合 tRPC mutation 和 React Query 快取更新機制。
 *
 * @component ProposalActions
 *
 * @features
 * - 狀態驅動的按鈕顯示（Draft/PendingApproval/Approved/Rejected）
 * - 提交審批功能（Draft → PendingApproval）
 * - 審批操作（批准/拒絕/請求更多資訊）
 * - CHANGE-018: 回退到草稿功能（非 Draft → Draft）
 * - 審批評論輸入和驗證
 * - 即時快取更新（Bug #4/#5 修復）
 * - 國際化支援（繁中/英文）
 * - 錯誤處理和成功提示（Toast）
 * - 用戶身份驗證檢查
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {string} props.proposalId - 提案 ID
 * @param {string} props.status - 提案狀態（Draft/PendingApproval/Approved/Rejected/MoreInfoRequired）
 *
 * @example
 * ```tsx
 * // Draft 狀態 - 顯示提交按鈕
 * <ProposalActions proposalId="uuid" status="Draft" />
 *
 * // PendingApproval 狀態 - 顯示審批選項
 * <ProposalActions proposalId="uuid" status="PendingApproval" />
 *
 * // Approved 狀態 - 顯示批准訊息 + 回退按鈕 (Admin/Supervisor)
 * <ProposalActions proposalId="uuid" status="Approved" />
 * ```
 *
 * @dependencies
 * - @tanstack/react-query: tRPC mutation 和快取更新
 * - next-auth/react: 用戶身份驗證
 * - next-intl: 國際化
 * - shadcn/ui: useToast, AlertDialog
 *
 * @related
 * - packages/api/src/routers/budgetProposal.ts - 提案 API Router (submit, approve, revertToDraft)
 * - apps/web/src/app/[locale]/proposals/[id]/page.tsx - 提案詳情頁面
 *
 * @author IT Department
 * @since Epic 3 - Budget Proposal Workflow
 * @lastModified 2025-12-15 (CHANGE-018: 新增回退到草稿功能)
 */

'use client';

import { RotateCcw, Lock } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';



import { useToast } from '@/components/ui';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { LoadingButton } from '@/components/ui/loading';
import { useRouter } from "@/i18n/routing";
import { api } from '@/lib/trpc';


/** FEAT-014: 當前步驟進度（用於判斷登入者是否為當前審批角色） */
interface StepProgress {
  sequence: number;
  approverRoleId: number;
  status: string;
  step?: { role?: { name: string } | null } | null;
}

interface ProposalActionsProps {
  proposalId: string;
  status: string;
  /** FEAT-014: 提案綁定的審批流程（null=未綁定，走舊單階段 approve fallback） */
  workflowId?: string | null;
  /** FEAT-014: 目前進行到第幾步 */
  currentStepSequence?: number | null;
  /** FEAT-014: 各步驟進度（用於序列審批 UI） */
  approvalProgress?: StepProgress[];
}

export function ProposalActions({
  proposalId,
  status,
  workflowId,
  currentStepSequence,
  approvalProgress,
}: ProposalActionsProps) {
  const t = useTranslations('proposals');
  const tToast = useTranslations('toast');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const { data: session } = useSession();
  const utils = api.useContext();
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CHANGE-018: 回退功能狀態
  const [revertReason, setRevertReason] = useState('');
  const [isRevertDialogOpen, setIsRevertDialogOpen] = useState(false);
  const [isReverting, setIsReverting] = useState(false);

  // 從 session 獲取當前用戶 ID 和角色
  const userId = session?.user?.id;
  const userRole = session?.user?.role?.name;

  // CHANGE-018: 檢查是否可以回退（Admin 或 Supervisor，且非 Draft 狀態）
  const canRevert = (userRole === 'Admin' || userRole === 'Supervisor') && status !== 'Draft';

  // FEAT-014: 序列審批流程判斷（用 role.id；session 未填充頂層 roleId）
  const userRoleId = session?.user?.role?.id;
  const isWorkflow = !!workflowId;
  const currentStep = approvalProgress?.find((p) => p.sequence === currentStepSequence);
  const isMyStep =
    isWorkflow &&
    currentStep?.status === 'Pending' &&
    currentStep?.approverRoleId === userRoleId;
  const currentStepRoleName = currentStep?.step?.role?.name;

  const submitMutation = api.budgetProposal.submit.useMutation({
    onSuccess: async () => {
      toast({
        title: tToast('success.title'),
        description: t('messages.submitSuccess'),
        variant: 'success',
      });
      // 修復 Bug #4: 手動觸發數據重新獲取，確保 UI 立即更新
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = api.budgetProposal.approve.useMutation({
    onSuccess: async () => {
      toast({
        title: tToast('success.title'),
        description: t('messages.approvalSuccess'),
        variant: 'success',
      });
      setComment('');
      // 修復 Bug #5: 手動觸發數據重新獲取，確保 UI 立即更新
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // CHANGE-018: 回退到草稿 mutation
  const revertMutation = api.budgetProposal.revertToDraft.useMutation({
    onSuccess: async () => {
      toast({
        title: tToast('success.title'),
        description: t('actions.revertSuccess'),
        variant: 'success',
      });
      setRevertReason('');
      setIsRevertDialogOpen(false);
      // 手動觸發數據重新獲取
      await utils.budgetProposal.getById.invalidate({ id: proposalId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: tToast('error.title'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // FEAT-014: 序列審批步驟操作後的共用快取失效
  const invalidateAfterStep = async () => {
    await utils.budgetProposal.getById.invalidate({ id: proposalId });
    await utils.budgetProposal.getPendingForMe.invalidate();
    await utils.budgetProposal.getAll.invalidate();
    router.refresh();
  };

  const stepOnError = (error: { message: string }) =>
    toast({ title: tToast('error.title'), description: error.message, variant: 'destructive' });

  // FEAT-014: 核准當前步驟
  const approveStepMutation = api.budgetProposal.approveStep.useMutation({
    onSuccess: async () => {
      toast({ title: tToast('success.title'), description: t('messages.approvalSuccess'), variant: 'success' });
      setComment('');
      await invalidateAfterStep();
    },
    onError: stepOnError,
  });

  // FEAT-014: 駁回當前步驟
  const rejectStepMutation = api.budgetProposal.rejectStep.useMutation({
    onSuccess: async () => {
      toast({ title: tToast('success.title'), description: t('messages.approvalSuccess'), variant: 'success' });
      setComment('');
      await invalidateAfterStep();
    },
    onError: stepOnError,
  });

  // FEAT-014: 要求補件
  const requestMoreInfoStepMutation = api.budgetProposal.requestMoreInfoStep.useMutation({
    onSuccess: async () => {
      toast({ title: tToast('success.title'), description: t('messages.approvalSuccess'), variant: 'success' });
      setComment('');
      await invalidateAfterStep();
    },
    onError: stepOnError,
  });

  const handleSubmit = async () => {
    if (!userId) {
      toast({
        title: tToast('error.title'),
        description: tToast('pleaseLogin'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await submitMutation.mutateAsync({
        id: proposalId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // FEAT-014: 序列審批步驟操作處理
  const handleStepAction = (action: 'approve' | 'reject' | 'moreInfo') => {
    if (action !== 'approve' && !comment.trim()) {
      toast({
        title: tToast('error.title'),
        description: t('messages.commentRequired'),
        variant: 'destructive',
      });
      return;
    }
    if (action === 'approve') {
      approveStepMutation.mutate({ id: proposalId, comment: comment.trim() || undefined });
    } else if (action === 'reject') {
      rejectStepMutation.mutate({ id: proposalId, reason: comment.trim() });
    } else {
      requestMoreInfoStepMutation.mutate({ id: proposalId, comment: comment.trim() });
    }
  };

  const handleApprove = async (action: 'Approved' | 'Rejected' | 'MoreInfoRequired') => {
    if (!userId) {
      toast({
        title: tToast('error'),
        description: tToast('pleaseLogin'),
        variant: 'destructive',
      });
      return;
    }

    if (action !== 'Approved' && !comment.trim()) {
      toast({
        title: tToast('error'),
        description: t('messages.commentRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await approveMutation.mutateAsync({
        id: proposalId,
        action,
        comment: comment || undefined,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // CHANGE-018: 回退到草稿處理函數
  const handleRevert = async () => {
    if (!revertReason.trim()) {
      toast({
        title: tToast('error.title'),
        description: t('actions.revertReasonRequired'),
        variant: 'destructive',
      });
      return;
    }

    setIsReverting(true);
    try {
      await revertMutation.mutateAsync({
        id: proposalId,
        reason: revertReason,
      });
    } finally {
      setIsReverting(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">{t('actions.title')}</h2>

      {/* 草稿或需更多資訊狀態：可以提交審批 */}
      {(status === 'Draft' || status === 'MoreInfoRequired') && (
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? tToast('submitting') : t('actions.submit')}
        </button>
      )}

      {/* FEAT-014: 待審批 + 序列審批流程 */}
      {status === 'PendingApproval' && isWorkflow && (
        <div className="space-y-4">
          {/* 當前步驟指示 */}
          <div className="rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-800">
            {t('approval.currentStep', {
              step: currentStepSequence ?? 0,
              role: currentStepRoleName ?? '',
            })}
          </div>

          {isMyStep ? (
            <>
              <div>
                <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                  {t('approval.comment.label')}
                </label>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder={t('approval.comment.placeholder')}
                />
              </div>

              <div className="space-y-2">
                <LoadingButton
                  onClick={() => handleStepAction('approve')}
                  isLoading={approveStepMutation.isPending}
                  disabled={rejectStepMutation.isPending || requestMoreInfoStepMutation.isPending}
                  className="w-full"
                >
                  {t('approval.actions.approve')}
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleStepAction('reject')}
                  isLoading={rejectStepMutation.isPending}
                  disabled={approveStepMutation.isPending || requestMoreInfoStepMutation.isPending}
                  variant="destructive"
                  className="w-full"
                >
                  {t('approval.actions.reject')}
                </LoadingButton>
                <LoadingButton
                  onClick={() => handleStepAction('moreInfo')}
                  isLoading={requestMoreInfoStepMutation.isPending}
                  disabled={approveStepMutation.isPending || rejectStepMutation.isPending}
                  variant="outline"
                  className="w-full"
                >
                  {t('approval.actions.requestInfo')}
                </LoadingButton>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 rounded-md bg-gray-50 px-3 py-3 text-sm text-gray-600">
              <Lock className="h-4 w-4 shrink-0" />
              <span>{t('approval.notYourStep')}</span>
            </div>
          )}
        </div>
      )}

      {/* 待審批狀態（未綁定流程的舊單階段 fallback，Q-D） */}
      {status === 'PendingApproval' && !isWorkflow && (
        <div className="space-y-4">
          <div>
            <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
              {t('approval.comment.label')}
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder={t('approval.comment.placeholder')}
            />
          </div>

          <div className="space-y-2">
            <button
              onClick={() => handleApprove('Approved')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:bg-gray-400"
            >
              {t('approval.actions.approve')}
            </button>
            <button
              onClick={() => handleApprove('Rejected')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-gray-400"
            >
              {t('approval.actions.reject')}
            </button>
            <button
              onClick={() => handleApprove('MoreInfoRequired')}
              disabled={isSubmitting}
              className="w-full rounded-md bg-orange-600 px-4 py-2 text-white hover:bg-orange-700 disabled:bg-gray-400"
            >
              {t('approval.actions.requestInfo')}
            </button>
          </div>
        </div>
      )}

      {/* 已批准狀態 */}
      {status === 'Approved' && (
        <div className="rounded-md bg-green-50 p-4 text-center">
          <p className="text-sm font-medium text-green-800">{t('status.approvedMessage')}</p>
        </div>
      )}

      {/* 已拒絕狀態 */}
      {status === 'Rejected' && (
        <div className="rounded-md bg-red-50 p-4 text-center">
          <p className="text-sm font-medium text-red-800">{t('status.rejectedMessage')}</p>
        </div>
      )}

      {/* CHANGE-018: 回退到草稿功能 (Admin/Supervisor 專用) */}
      {canRevert && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <AlertDialog open={isRevertDialogOpen} onOpenChange={setIsRevertDialogOpen}>
            <AlertDialogTrigger asChild>
              <button
                className="w-full flex items-center justify-center gap-2 rounded-md bg-gray-600 px-4 py-2 text-white hover:bg-gray-700"
              >
                <RotateCcw className="h-4 w-4" />
                {t('actions.revertToDraft')}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('actions.revertToDraft')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('actions.confirmRevert')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <label htmlFor="revertReason" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('actions.revertReason')} <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="revertReason"
                  value={revertReason}
                  onChange={(e) => setRevertReason(e.target.value)}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                  placeholder={t('actions.revertReasonPlaceholder')}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setRevertReason('')}>
                  {tCommon('actions.cancel')}
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleRevert}
                  disabled={isReverting || !revertReason.trim()}
                  className="bg-gray-600 hover:bg-gray-700"
                >
                  {isReverting ? t('actions.reverting') : t('actions.revertToDraft')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
