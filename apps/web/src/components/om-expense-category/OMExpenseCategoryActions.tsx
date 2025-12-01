/**
 * @fileoverview OM Expense Category Actions Component - OM 費用類別操作組件
 *
 * @description
 * 提供 OM 費用類別的操作按鈕，包含編輯、刪除、啟用/停用等功能。
 * 使用下拉選單顯示操作選項。
 *
 * @component OMExpenseCategoryActions
 *
 * @features
 * - 編輯類別連結
 * - 啟用/停用狀態切換
 * - 刪除類別（帶確認對話框）
 * - 有關聯資料時禁止刪除
 *
 * @author IT Department
 * @since FEAT-005 - OM Expense Category Management
 * @lastModified 2025-12-01
 */

'use client';

import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Link } from '@/i18n/routing';
import { api } from '@/lib/trpc';


interface OMExpenseCategoryActionsProps {
  category: {
    id: string;
    code: string;
    name: string;
    isActive: boolean;
    _count?: {
      omExpenses: number;
    };
  };
  onActionComplete?: () => void;
}

export function OMExpenseCategoryActions({
  category,
  onActionComplete,
}: OMExpenseCategoryActionsProps) {
  const t = useTranslations('omExpenseCategories');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const utils = api.useUtils();

  // 刪除 Mutation
  const deleteMutation = api.omExpenseCategory.delete.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.deleteSuccess'),
      });
      void utils.omExpenseCategory.getAll.invalidate();
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // 切換狀態 Mutation
  const toggleStatusMutation = api.omExpenseCategory.toggleStatus.useMutation({
    onSuccess: () => {
      toast({
        title: tCommon('messages.success'),
        description: t('messages.toggleSuccess'),
      });
      void utils.omExpenseCategory.getAll.invalidate();
      onActionComplete?.();
    },
    onError: (error) => {
      toast({
        title: tCommon('messages.error'),
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: category.id });
    setShowDeleteDialog(false);
  };

  const handleToggleStatus = () => {
    toggleStatusMutation.mutate({ id: category.id });
  };

  const hasRelations = (category._count?.omExpenses ?? 0) > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">{tCommon('actions.openMenu')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* 編輯 */}
          <DropdownMenuItem asChild>
            <Link href={`/om-expense-categories/${category.id}/edit`}>
              <Pencil className="mr-2 h-4 w-4" />
              {t('actions.edit')}
            </Link>
          </DropdownMenuItem>

          {/* 啟用/停用 */}
          <DropdownMenuItem onClick={handleToggleStatus}>
            {category.isActive ? (
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

          {/* 刪除 */}
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            disabled={hasRelations}
            className={hasRelations ? 'opacity-50' : 'text-destructive focus:text-destructive'}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t('actions.delete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 刪除確認對話框 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('delete.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('delete.description', { name: category.name })}
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
