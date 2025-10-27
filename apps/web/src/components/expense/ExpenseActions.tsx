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
import { useRouter } from 'next/navigation';
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
  const router = useRouter();
  const { toast } = useToast();
  const utils = api.useUtils();

  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  // ===== Mutations =====
  const submitMutation = api.expense.submit.useMutation({
    onSuccess: () => {
      toast({
        title: '提交成功',
        description: '費用記錄已提交，等待主管審批',
      });
      utils.expense.getById.invalidate({ id: expenseId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '提交失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const approveMutation = api.expense.approve.useMutation({
    onSuccess: () => {
      toast({
        title: '批准成功',
        description: '費用記錄已批准',
      });
      utils.expense.getById.invalidate({ id: expenseId });
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '批准失敗',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // ===== 操作處理 =====
  const handleSubmit = () => {
    if (itemsCount === 0) {
      toast({
        title: '無法提交',
        description: '費用記錄至少需要一個費用項目才能提交',
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
          <CardTitle>操作</CardTitle>
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
                  提交中...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  提交審批
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
                  批准中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  批准費用記錄
                </>
              )}
            </Button>
          )}

          {/* Approved 狀態 - 顯示狀態 */}
          {status === 'Approved' && (
            <div className="flex items-center justify-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="mr-2 h-5 w-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                已批准
              </span>
            </div>
          )}

          {/* 提示信息 */}
          {status === 'Draft' && itemsCount === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              請至少添加一個費用項目才能提交
            </p>
          )}

          {status === 'Submitted' && (
            <p className="text-sm text-muted-foreground text-center">
              等待主管審批
            </p>
          )}
        </CardContent>
      </Card>

      {/* 提交確認對話框 */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認提交審批？</AlertDialogTitle>
            <AlertDialogDescription>
              提交後，費用記錄將進入審批流程。
              <br />
              提交後將無法再編輯，請確認所有信息正確。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmSubmit}>
              確認提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 批准確認對話框 */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>確認批准費用記錄？</AlertDialogTitle>
            <AlertDialogDescription>
              批准後，費用記錄狀態將更新為「已批准」。
              <br />
              批准操作無法撤銷，請確認費用信息無誤。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApprove}>
              確認批准
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
