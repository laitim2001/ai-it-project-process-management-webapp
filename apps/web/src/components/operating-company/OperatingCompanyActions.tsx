/**
 * @fileoverview Operating Company Actions Component - 營運公司操作按鈕組件
 *
 * @description
 * 營運公司的操作按鈕組件，用於列表頁面的每一行。
 * 支援編輯、切換啟用狀態、刪除等操作，並包含確認對話框防止誤操作。
 * 使用直接按鈕顯示，避免下拉選單被截斷的問題。
 *
 * @component OperatingCompanyActions
 *
 * @features
 * - 編輯按鈕（連結到編輯頁面）
 * - 切換啟用/停用狀態按鈕
 * - 刪除按鈕（需確認對話框）
 * - 載入狀態顯示
 * - 權限檢查（有關聯資料時禁止刪除）
 * - 國際化支援
 *
 * @props
 * @param {Object} props.opCo - Operating Company 物件
 * @param {Function} props.onSuccess - 操作成功後的回調
 *
 * @dependencies
 * - @tanstack/react-query: tRPC mutation
 * - shadcn/ui: Button, AlertDialog, Tooltip
 * - lucide-react: Icons
 *
 * @author IT Department
 * @since FEAT-004 - Operating Company Management
 * @lastModified 2025-12-18
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';
import {
  Edit,
  Power,
  PowerOff,
  Trash2,
  Loader2,
} from 'lucide-react';

interface OperatingCompanyActionsProps {
  opCo: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    _count?: {
      chargeOuts: number;
      omExpenseItems: number;
      omExpensesLegacy: number;
    };
  };
  onSuccess?: () => void;
}

export function OperatingCompanyActions({ opCo, onSuccess }: OperatingCompanyActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const t = useTranslations('operatingCompanies');
  const tCommon = useTranslations('common');
  const utils = api.useUtils();

  // Dialog 狀態
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showToggleDialog, setShowToggleDialog] = useState(false);

  // 切換狀態 Mutation
  const toggleMutation = api.operatingCompany.toggleActive.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.toggleSuccess'),
        variant: 'success',
      });
      utils.operatingCompany.getAll.invalidate();
      setShowToggleDialog(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 刪除 Mutation
  const deleteMutation = api.operatingCompany.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.deleteSuccess'),
        variant: 'success',
      });
      utils.operatingCompany.getAll.invalidate();
      setShowDeleteDialog(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 計算是否可以刪除（沒有關聯資料）
  const hasRelations = (opCo._count?.chargeOuts ?? 0) > 0 ||
    (opCo._count?.omExpenseItems ?? 0) > 0 ||
    (opCo._count?.omExpensesLegacy ?? 0) > 0;

  const handleEdit = () => {
    router.push(`/operating-companies/${opCo.id}/edit`);
  };

  const handleToggle = () => {
    toggleMutation.mutate({ id: opCo.id });
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id: opCo.id });
  };

  const isLoading = toggleMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <TooltipProvider delayDuration={300}>
        <div className="flex items-center gap-1">
          {/* 編輯按鈕 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEdit}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
                <span className="sr-only">{t('actions.edit')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('actions.edit')}</p>
            </TooltipContent>
          </Tooltip>

          {/* 切換啟用/停用按鈕 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowToggleDialog(true)}
                disabled={isLoading}
                className="h-8 w-8 p-0"
              >
                {toggleMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : opCo.isActive ? (
                  <PowerOff className="h-4 w-4" />
                ) : (
                  <Power className="h-4 w-4" />
                )}
                <span className="sr-only">
                  {opCo.isActive ? t('actions.deactivate') : t('actions.activate')}
                </span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{opCo.isActive ? t('actions.deactivate') : t('actions.activate')}</p>
            </TooltipContent>
          </Tooltip>

          {/* 刪除按鈕 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => !hasRelations && setShowDeleteDialog(true)}
                disabled={isLoading || hasRelations}
                className={`h-8 w-8 p-0 ${
                  hasRelations
                    ? 'text-muted-foreground cursor-not-allowed opacity-50'
                    : 'text-destructive hover:text-destructive hover:bg-destructive/10'
                }`}
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                <span className="sr-only">{t('actions.delete')}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {hasRelations
                  ? t('messages.cannotDeleteWithRelations')
                  : t('actions.delete')}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>

      {/* 切換狀態確認對話框 */}
      <AlertDialog open={showToggleDialog} onOpenChange={setShowToggleDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {opCo.isActive
                ? t('dialogs.deactivate.title')
                : t('dialogs.activate.title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {opCo.isActive
                ? t('dialogs.deactivate.description', { name: opCo.name })
                : t('dialogs.activate.description', { name: opCo.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              {tCommon('actions.confirm')}
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
              {t('dialogs.delete.description', { name: opCo.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
