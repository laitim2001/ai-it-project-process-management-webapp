'use client';

/**
 * ExpenseActions 組件 - 費用記錄操作按鈕
 *
 * 功能說明：
 * - Draft 狀態：顯示「提交審批」按鈕
 * - Submitted 狀態：顯示「批准」按鈕（僅 Supervisor）
 * - Approved 狀態：顯示「已批准」狀態
 *
 * Module 5: Expense 工作流按鈕
 */

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';
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

interface ExpenseActionsProps {
  expenseId: string;
  status: string;
  itemsCount: number;
}

export function ExpenseActions({
  expenseId,
  status,
  itemsCount,
}: ExpenseActionsProps) {
  const t = useTranslations('expenses');
  const tCommon = useTranslations('common');
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  // ===== Mutations =====
  const submitMutation = api.expense.submit.useMutation({
    onSuccess: () => {
      toast({
        title: t('actions.submit'),
        description: t('messages.submitSuccess'),
      });
      utils.expense.getById.invalidate({ id: expenseId });
      // FIX-044: 移除 router.refresh() 以避免開發模式下的 HotReload 問題
      // invalidate 已經會觸發 React Query 重新獲取數據，無需 refresh
      // router.refresh();
    },
    onError: (error) => {
      toast({
        title: t('actions.submit'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = api.expense.approve.useMutation({
    onSuccess: () => {
      toast({
        title: t('actions.approve'),
        description: t('messages.approveSuccess'),
      });
      utils.expense.getById.invalidate({ id: expenseId });
      // FIX-044: 移除 router.refresh() 以避免開發模式下的 HotReload 問題
      // invalidate 已經會觸發 React Query 重新獲取數據，無需 refresh
      // router.refresh();
    },
    onError: (error) => {
      toast({
        title: t('actions.approve'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ===== 操作處理 =====
  const handleSubmit = () => {
    if (itemsCount === 0) {
      toast({
        title: t('actions.submit'),
        description: t('actions.needItems'),
        variant: 'destructive',
      });
      return;
    }
    setShowSubmitDialog(true);
  };

  const confirmSubmit = () => {
    submitMutation.mutate({ id: expenseId });
    setShowSubmitDialog(false);
  };

  const handleApprove = () => {
    setShowApproveDialog(true);
  };

  const confirmApprove = () => {
    approveMutation.mutate({ id: expenseId });
    setShowApproveDialog(false);
  };

  const isLoading = submitMutation.isLoading || approveMutation.isLoading;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('actions.operations')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Draft 狀態 - 提交按鈕 */}
          {status === 'Draft' && (
            <Button
              onClick={handleSubmit}
              disabled={isLoading || itemsCount === 0}
              className="w-full"
            >
              {submitMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('actions.submitting')}
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {t('actions.submit')}
                </>
              )}
            </Button>
          )}

          {/* Submitted 狀態 - 批准按鈕（僅主管） */}
          {status === 'Submitted' && (
            <Button
              onClick={handleApprove}
              disabled={isLoading}
              className="w-full"
            >
              {approveMutation.isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('actions.approving')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  {t('actions.approve')}
                </>
              )}
            </Button>
          )}

          {/* Approved 狀態 - 顯示狀態 */}
          {status === 'Approved' && (
            <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                {t('actions.approved')}
              </span>
            </div>
          )}

          {/* 提示信息 */}
          {status === 'Draft' && itemsCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {t('actions.needItems')}
            </p>
          )}

          {status === 'Submitted' && (
            <p className="text-sm text-muted-foreground text-center">
              {t('actions.waitingApproval')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 提交確認對話框 */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.submitConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.submitConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              {tCommon('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批准確認對話框 */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('actions.approveConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('actions.approveConfirmDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove}>
              {tCommon('actions.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
