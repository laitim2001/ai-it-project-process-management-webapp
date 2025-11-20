/**
 * @fileoverview Expense Actions Component - 費用記錄狀態操作組件
 *
 * @description
 * 費用記錄的狀態流轉操作按鈕組件，根據費用狀態和用戶角色顯示對應的操作按鈕。
 * 支援 Draft → Submitted → Approved 的費用審批工作流，並整合確認對話框和錯誤處理。
 *
 * @component ExpenseActions
 *
 * @features
 * - 狀態驅動的按鈕顯示（Draft/Submitted/Approved）
 * - 角色權限控制（Supervisor 才能批准）
 * - 提交前驗證（必須有至少一個費用項目）
 * - 確認對話框（AlertDialog）防止誤操作
 * - 樂觀更新和自動資料刷新
 * - 載入狀態顯示和錯誤處理
 * - 國際化支援（繁中/英文）
 *
 * @props
 * @param {Object} props - 組件屬性
 * @param {string} props.expenseId - 費用記錄 ID
 * @param {string} props.status - 當前費用狀態（Draft/Submitted/Approved）
 * @param {number} props.itemsCount - 費用項目數量（用於提交前驗證）
 *
 * @example
 * ```tsx
 * // Draft 狀態顯示提交按鈕
 * <ExpenseActions
 *   expenseId="expense-1"
 *   status="Draft"
 *   itemsCount={3}
 * />
 *
 * // Submitted 狀態顯示批准按鈕（Supervisor）
 * <ExpenseActions
 *   expenseId="expense-1"
 *   status="Submitted"
 *   itemsCount={3}
 * />
 * ```
 *
 * @dependencies
 * - @tanstack/react-query: tRPC 查詢和 mutation
 * - shadcn/ui: Button, Card, AlertDialog
 * - next-intl: 國際化
 * - lucide-react: 圖示（CheckCircle2, Send, Loader2）
 *
 * @related
 * - packages/api/src/routers/expense.ts - 費用 API Router（submit/approve procedures）
 * - apps/web/src/components/expense/ExpenseForm.tsx - 費用表單組件
 * - apps/web/src/app/[locale]/expenses/[id]/page.tsx - 費用詳情頁面
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14 (FIX-044: 移除 router.refresh() 避免 HotReload 問題)
 */

'use client';

import { useState } from 'react';
import { useRouter } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
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
