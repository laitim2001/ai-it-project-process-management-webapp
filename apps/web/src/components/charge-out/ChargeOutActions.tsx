'use client';

/**
 * ChargeOutActions 組件 - Module 7-8 費用轉嫁狀態操作
 *
 * 功能說明：
 * - 狀態流程：Draft → Submitted → Confirmed → Paid
 * - Draft: 可編輯、可提交、可刪除
 * - Submitted: 可確認（Supervisor）、可拒絕（Supervisor）
 * - Confirmed: 可標記為已付款
 * - Paid: 終態
 * - Rejected: 可刪除
 *
 * Module 7-8: ChargeOut 費用轉嫁 - 前端實施
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import {
  Send,
  CheckCircle,
  XCircle,
  DollarSign,
  Edit,
  Trash2,
  Loader2,
} from 'lucide-react';

// ========================================
// Types
// ========================================

interface ChargeOutActionsProps {
  chargeOut: {
    id: string;
    name: string;
    status: string;
  };
  currentUserRole?: string; // 當前用戶角色
}

// ========================================
// Main Component
// ========================================

export function ChargeOutActions({ chargeOut, currentUserRole }: ChargeOutActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();
  const t = useTranslations('chargeOuts.actions');

  // ===== Dialog State =====
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showPaidDialog, setShowPaidDialog] = useState(false);

  // ===== Mutations =====

  const submitMutation = api.chargeOut.submit.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.submitSuccess'),
        description: t('messages.submitSuccessDesc', { name: chargeOut.name }),
      });
      utils.chargeOut.getById.invalidate({ id: chargeOut.id });
      setShowSubmitDialog(false);
    },
    onError: (error) => {
      toast({
        title: t('messages.submitError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const confirmMutation = api.chargeOut.confirm.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.confirmSuccess'),
        description: t('messages.confirmSuccessDesc', { name: chargeOut.name }),
      });
      utils.chargeOut.getById.invalidate({ id: chargeOut.id });
      setShowConfirmDialog(false);
    },
    onError: (error) => {
      toast({
        title: t('messages.confirmError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const rejectMutation = api.chargeOut.reject.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.rejectSuccess'),
        description: t('messages.rejectSuccessDesc', { name: chargeOut.name }),
      });
      utils.chargeOut.getById.invalidate({ id: chargeOut.id });
      setShowRejectDialog(false);
    },
    onError: (error) => {
      toast({
        title: t('messages.rejectError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const markAsPaidMutation = api.chargeOut.markAsPaid.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.markAsPaidSuccess'),
        description: t('messages.markAsPaidSuccessDesc', { name: chargeOut.name }),
      });
      utils.chargeOut.getById.invalidate({ id: chargeOut.id });
      setShowPaidDialog(false);
    },
    onError: (error) => {
      toast({
        title: t('messages.markAsPaidError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = api.chargeOut.delete.useMutation({
    onSuccess: () => {
      toast({
        title: t('messages.deleteSuccess'),
        description: t('messages.deleteSuccessDesc', { name: chargeOut.name }),
      });
      router.push('/charge-outs');
    },
    onError: (error) => {
      toast({
        title: t('messages.deleteError'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ===== Action Handlers =====

  const handleSubmit = () => {
    submitMutation.mutate({ id: chargeOut.id });
  };

  const handleConfirm = () => {
    confirmMutation.mutate({ id: chargeOut.id });
  };

  const handleReject = () => {
    rejectMutation.mutate({ id: chargeOut.id });
  };

  const handleMarkAsPaid = () => {
    // FIX-050: markAsPaid API 需要 paymentDate 參數（ISO 8601 格式）
    const today = new Date().toISOString();
    markAsPaidMutation.mutate({
      id: chargeOut.id,
      paymentDate: today
    });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: chargeOut.id });
  };

  const handleEdit = () => {
    router.push(`/charge-outs/${chargeOut.id}/edit`);
  };

  // ===== 權限和狀態判斷 =====
  const isSupervisor = currentUserRole === 'Supervisor' || currentUserRole === 'Admin';
  const isDraft = chargeOut.status === 'Draft';
  const isSubmitted = chargeOut.status === 'Submitted';
  const isConfirmed = chargeOut.status === 'Confirmed';
  const isRejected = chargeOut.status === 'Rejected';
  const isPaid = chargeOut.status === 'Paid';

  const canEdit = isDraft;
  const canSubmit = isDraft;
  const canConfirm = isSubmitted && isSupervisor;
  const canReject = isSubmitted && isSupervisor;
  const canMarkAsPaid = isConfirmed;
  const canDelete = (isDraft || isRejected) && !deleteMutation.isPending;

  // ===== Render =====
  return (
    <div className="flex flex-wrap gap-2">
      {/* 編輯按鈕 - Draft 狀態 */}
      {canEdit && (
        <Button variant="outline" onClick={handleEdit}>
          <Edit className="mr-2 h-4 w-4" />
          {t('edit')}
        </Button>
      )}

      {/* 提交按鈕 - Draft 狀態 */}
      {canSubmit && (
        <Button onClick={() => setShowSubmitDialog(true)} disabled={submitMutation.isPending}>
          {submitMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Send className="mr-2 h-4 w-4" />
          )}
          {t('submit')}
        </Button>
      )}

      {/* 確認按鈕 - Submitted 狀態 + Supervisor */}
      {canConfirm && (
        <Button
          onClick={() => setShowConfirmDialog(true)}
          disabled={confirmMutation.isPending}
          className="bg-green-600 hover:bg-green-700"
        >
          {confirmMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="mr-2 h-4 w-4" />
          )}
          {t('confirm')}
        </Button>
      )}

      {/* 拒絕按鈕 - Submitted 狀態 + Supervisor */}
      {canReject && (
        <Button
          variant="destructive"
          onClick={() => setShowRejectDialog(true)}
          disabled={rejectMutation.isPending}
        >
          {rejectMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <XCircle className="mr-2 h-4 w-4" />
          )}
          {t('reject')}
        </Button>
      )}

      {/* 標記為已付款按鈕 - Confirmed 狀態 */}
      {canMarkAsPaid && (
        <Button
          onClick={() => setShowPaidDialog(true)}
          disabled={markAsPaidMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {markAsPaidMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <DollarSign className="mr-2 h-4 w-4" />
          )}
          {t('markAsPaid')}
        </Button>
      )}

      {/* 刪除按鈕 - Draft 或 Rejected 狀態 */}
      {canDelete && (
        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
          <Trash2 className="mr-2 h-4 w-4" />
          {t('delete')}
        </Button>
      )}

      {/* 提交確認對話框 */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.submit.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.submit.description', { name: chargeOut.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.submit.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>{t('dialogs.submit.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 確認對話框 */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.confirm.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.confirm.description', { name: chargeOut.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
              {t('dialogs.confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 拒絕對話框 */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.reject.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.reject.description', { name: chargeOut.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.reject.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} className="bg-red-600 hover:bg-red-700">
              {t('dialogs.reject.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 標記為已付款對話框 */}
      <AlertDialog open={showPaidDialog} onOpenChange={setShowPaidDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.markAsPaid.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.markAsPaid.description', { name: chargeOut.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.markAsPaid.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleMarkAsPaid} className="bg-blue-600 hover:bg-blue-700">
              {t('dialogs.markAsPaid.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 刪除確認對話框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('dialogs.delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('dialogs.delete.description', { name: chargeOut.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('dialogs.delete.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              {t('dialogs.delete.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
