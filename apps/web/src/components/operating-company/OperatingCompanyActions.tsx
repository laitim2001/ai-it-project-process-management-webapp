/**
 * @fileoverview Operating Company Actions Component - 營運公司操作按鈕組件
 *
 * @description
 * 營運公司的操作按鈕組件，用於列表頁面的每一行。
 * 支援編輯、切換啟用狀態、刪除等操作，並包含確認對話框防止誤操作。
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
 * - shadcn/ui: Button, DropdownMenu, AlertDialog
 * - lucide-react: Icons
 *
 * @author IT Department
 * @since FEAT-004 - Operating Company Management
 * @lastModified 2025-12-01
 */

'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  MoreHorizontal,
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
            <span className="sr-only">{tCommon('actions.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* 編輯 */}
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            {t('actions.edit')}
          </DropdownMenuItem>

          {/* 切換啟用/停用 */}
          <DropdownMenuItem onClick={() => setShowToggleDialog(true)}>
            {opCo.isActive ? (
              <>
                <PowerOff className="mr-2 h-4 w-4" />
                {t('actions.deactivate')}
              </>
            ) : (
              <>
                <Power className="mr-2 h-4 w-4" />
                {t('actions.activate')}
              </>
            )}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* 刪除 - 有關聯資料時禁用 */}
          {!hasRelations ? (
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-muted-foreground cursor-not-allowed opacity-50"
              title={t('messages.cannotDeleteWithRelations')}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('actions.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
