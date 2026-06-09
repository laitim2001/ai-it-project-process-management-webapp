/**
 * @fileoverview Project Expense Panel - 專案費用月度模組容器（FEAT-015）
 * @component ProjectExpensePanel
 *
 * @description
 * 掛載於 Project 詳情頁「專案費用」tab 左側的容器組件，編排費用表互動：
 * - 查詢某專案的所有費用表（getByProject）
 * - 表頭 CRUD（ProjectExpenseForm）、明細 CRUD/排序（ProjectExpenseItemList + ProjectExpenseItemForm）
 * - 所有 mutation 成功後 invalidate getByProject 重新整理
 *
 * 🟢 CHANGE-044：月度編輯改為 master-detail——本組件僅負責費用表與明細清單，點選明細
 *   經 onSelectItem 通知頁面，月度網格（ProjectExpenseItemMonthlyGrid）由頁面右欄渲染，
 *   不再使用本組件內的彈窗。
 *
 * 🔴 D11/R8：此模組與既有「PO→Expense 實際支出」為兩種記法，畫面明確區隔、永不相加。
 *
 * @related
 * - apps/web/src/app/[locale]/projects/[id]/page.tsx（掛載點 + 右欄月度網格）
 * - packages/api/src/routers/projectExpense.ts
 *
 * @since FEAT-015 - Project Expense 月度模組（CHANGE-044 改為 master-detail 版面）
 */

'use client';

import { Plus, Pencil, Trash2, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';

import { DualCurrency } from '@/components/shared/DualCurrency';
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
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/loading/Spinner';
import { api } from '@/lib/trpc';

import ProjectExpenseForm from './ProjectExpenseForm';
import ProjectExpenseItemForm from './ProjectExpenseItemForm';
import ProjectExpenseItemList from './ProjectExpenseItemList';

import type {
  ProjectExpenseCurrency,
  ProjectExpenseData,
  ProjectExpenseItemData,
} from './types';

interface ProjectExpensePanelProps {
  projectId: string;
  /** CHANGE-044: 目前選中的明細 id（master-detail，月度網格顯示於頁面右欄） */
  selectedItemId: string | null;
  /** CHANGE-044: 點選明細時通知頁面，由頁面右欄渲染月度網格 */
  onSelectItem: (item: ProjectExpenseItemData) => void;
}

/** 全部明細同幣別時才回傳該幣別（供總計顯示換算次值），否則 null（只顯示 USD） */
function getSharedCurrency(
  items: ProjectExpenseItemData[]
): ProjectExpenseCurrency | null {
  const first = items[0];
  if (!first?.currency) return null;
  const firstCurrency = first.currency;
  return items.every((i) => i.currency?.id === firstCurrency.id)
    ? firstCurrency
    : null;
}

export default function ProjectExpensePanel({
  projectId,
  selectedItemId,
  onSelectItem,
}: ProjectExpensePanelProps) {
  const t = useTranslations('projectExpenses');
  const tCommon = useTranslations('common');
  const { toast } = useToast();
  const utils = api.useUtils();

  const { data: expenses, isLoading } =
    api.projectExpense.getByProject.useQuery({ projectId });

  // Dialog 狀態
  const [headerDialog, setHeaderDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    data?: ProjectExpenseData;
  }>({ open: false, mode: 'create' });

  const [itemDialog, setItemDialog] = useState<{
    open: boolean;
    mode: 'create' | 'edit';
    projectExpenseId?: string;
    data?: ProjectExpenseItemData;
  }>({ open: false, mode: 'create' });

  const [deleteHeaderId, setDeleteHeaderId] = useState<string | null>(null);

  const invalidate = () => {
    void utils.projectExpense.getByProject.invalidate({ projectId });
  };

  const onMutationError = (error: { message: string }) => {
    toast({
      title: tCommon('error'),
      description: error.message,
      variant: 'destructive',
    });
  };

  // Panel 層 mutation（reorder / removeItem / removeExpense）
  const reorderMutation = api.projectExpense.reorderItems.useMutation({
    onSuccess: () => invalidate(),
    onError: onMutationError,
  });
  const removeItemMutation = api.projectExpense.removeItem.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('items.deleteSuccess') });
      invalidate();
    },
    onError: onMutationError,
  });
  const removeExpenseMutation = api.projectExpense.removeExpense.useMutation({
    onSuccess: () => {
      toast({ title: tCommon('success'), description: t('form.deleteSuccess') });
      invalidate();
    },
    onError: onMutationError,
  });

  // 表單成功後：關閉對話框 + 重新整理
  const handleHeaderSuccess = () => {
    setHeaderDialog({ open: false, mode: 'create' });
    invalidate();
  };
  const handleItemSuccess = () => {
    setItemDialog({ open: false, mode: 'create' });
    invalidate();
  };

  const headers = (expenses ?? []) as ProjectExpenseData[];

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 與 PO→Expense 區隔說明（D11/R8） */}
      <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{t('panel.separationNote')}</p>
      </div>

      {/* 標題 + 新增費用表 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('panel.title')}</h3>
          <p className="text-sm text-muted-foreground">{t('panel.description')}</p>
        </div>
        <Button onClick={() => setHeaderDialog({ open: true, mode: 'create' })}>
          <Plus className="mr-2 h-4 w-4" />
          {t('panel.addExpense')}
        </Button>
      </div>

      {/* 空狀態 */}
      {headers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <p className="font-medium text-muted-foreground">
              {t('panel.noExpenses')}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('panel.addFirstExpense')}
            </p>
            <Button
              className="mt-4"
              onClick={() => setHeaderDialog({ open: true, mode: 'create' })}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('panel.addExpense')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        headers.map((header) => {
          const sharedCurrency = getSharedCurrency(header.items);
          return (
            <Card key={header.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {header.name}
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        FY{header.financialYear}
                      </span>
                    </CardTitle>
                    <CardDescription>
                      {header.description || t('panel.noDescription')}
                    </CardDescription>
                    <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <span className="text-muted-foreground">
                        {t('fields.annualBudget')}:{' '}
                        <span className="font-semibold text-foreground">
                          <DualCurrency
                            amountUSD={header.totalBudgetAmount}
                            currency={sharedCurrency}
                          />
                        </span>
                      </span>
                      <span className="text-muted-foreground">
                        {t('fields.annualActual')}:{' '}
                        <span className="font-semibold text-foreground">
                          <DualCurrency
                            amountUSD={header.totalActualSpent}
                            currency={sharedCurrency}
                          />
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setHeaderDialog({ open: true, mode: 'edit', data: header })
                      }
                      aria-label={t('form.editTitle')}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setDeleteHeaderId(header.id)}
                      aria-label={t('form.deleteTitle')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ProjectExpenseItemList
                  items={header.items}
                  onAddItem={() =>
                    setItemDialog({
                      open: true,
                      mode: 'create',
                      projectExpenseId: header.id,
                    })
                  }
                  onEditItem={(item) =>
                    setItemDialog({ open: true, mode: 'edit', data: item })
                  }
                  onDeleteItem={(itemId) => removeItemMutation.mutate({ id: itemId })}
                  onReorder={(itemIds) =>
                    reorderMutation.mutate({ projectExpenseId: header.id, itemIds })
                  }
                  selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem}
                />
              </CardContent>
            </Card>
          );
        })
      )}

      {/* 表頭表單 Dialog */}
      <Dialog
        open={headerDialog.open}
        onOpenChange={(open) =>
          setHeaderDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {headerDialog.mode === 'create'
                ? t('form.createTitle')
                : t('form.editTitle')}
            </DialogTitle>
            <DialogDescription>{t('form.subtitle')}</DialogDescription>
          </DialogHeader>
          <ProjectExpenseForm
            mode={headerDialog.mode}
            projectId={projectId}
            defaultFinancialYear={currentYear}
            initialData={headerDialog.data}
            onSuccess={handleHeaderSuccess}
            onCancel={() => setHeaderDialog({ open: false, mode: 'create' })}
          />
        </DialogContent>
      </Dialog>

      {/* 明細表單 Dialog */}
      <Dialog
        open={itemDialog.open}
        onOpenChange={(open) => setItemDialog((prev) => ({ ...prev, open }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {itemDialog.mode === 'create'
                ? t('items.createTitle')
                : t('items.editTitle')}
            </DialogTitle>
            <DialogDescription>{t('items.subtitle')}</DialogDescription>
          </DialogHeader>
          <ProjectExpenseItemForm
            mode={itemDialog.mode}
            projectExpenseId={itemDialog.projectExpenseId}
            initialData={itemDialog.data}
            onSuccess={handleItemSuccess}
            onCancel={() => setItemDialog({ open: false, mode: 'create' })}
          />
        </DialogContent>
      </Dialog>

      {/* 刪除表頭確認 */}
      <AlertDialog
        open={deleteHeaderId !== null}
        onOpenChange={(open) => !open && setDeleteHeaderId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('form.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('form.confirmDelete')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteHeaderId) {
                  removeExpenseMutation.mutate({ id: deleteHeaderId });
                }
                setDeleteHeaderId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
