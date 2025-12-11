/**
 * @fileoverview OM Expense Item List Component - OM 費用明細項目列表
 *
 * @description
 * OM 費用明細項目的列表組件，支援拖曳排序功能。
 * 顯示所有明細項目及其預算、實際支出、OpCo 等資訊，
 * 提供新增、編輯、刪除、查看月度記錄等操作。
 *
 * @component OMExpenseItemList
 *
 * @features
 * - 表格顯示所有明細項目
 * - 拖曳排序功能 (@dnd-kit)
 * - 每行操作按鈕：編輯、刪除、編輯月度記錄
 * - 頂部新增按鈕
 * - 底部匯總行（總預算、總實際支出）
 * - 利用率顏色警示
 * - 響應式設計
 * - 國際化支援
 *
 * @props
 * @param {string} omExpenseId - OM 費用 ID
 * @param {Array<OMExpenseItemData>} items - 明細項目列表
 * @param {Function} onAddItem - 新增項目回調
 * @param {Function} onEditItem - 編輯項目回調
 * @param {Function} onDeleteItem - 刪除項目回調
 * @param {Function} onReorder - 排序變更回調
 * @param {Function} onEditMonthly - 編輯月度記錄回調
 * @param {boolean} [isLoading] - 載入狀態
 *
 * @dependencies
 * - @dnd-kit/core: 拖曳核心功能
 * - @dnd-kit/sortable: 排序功能
 * - @dnd-kit/utilities: 工具函數
 * - lucide-react: 圖標
 * - shadcn/ui: Table, Button, Card
 * - next-intl: 國際化
 *
 * @related
 * - packages/api/src/routers/omExpense.ts - OM 費用 API Router
 * - apps/web/src/components/om-expense/OMExpenseItemForm.tsx - 明細項目表單
 * - apps/web/src/components/om-expense/OMExpenseItemMonthlyGrid.tsx - 月度記錄編輯
 *
 * @author IT Department
 * @since FEAT-007 - OM Expense Header-Detail Refactoring
 * @lastModified 2025-12-05
 */

'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  Calendar,
  AlertCircle,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
import { cn } from '@/lib/utils';

// ============================================================
// Types
// ============================================================

export interface OMExpenseItemData {
  id: string;
  name: string;
  description?: string | null;
  sortOrder: number;
  budgetAmount: number;
  actualSpent: number;
  opCoId: string;
  currencyId?: string | null;
  startDate?: string | null;
  endDate: string;
  opCo?: {
    id: string;
    code: string;
    name: string;
  };
  currency?: {
    id: string;
    code: string;
    name: string;
  } | null;
  monthlyRecords?: Array<{
    month: number;
    actualAmount: number;
  }>;
}

interface OMExpenseItemListProps {
  omExpenseId: string;
  items: OMExpenseItemData[];
  onAddItem: () => void;
  onEditItem: (item: OMExpenseItemData) => void;
  onDeleteItem: (itemId: string) => void;
  onReorder: (newOrder: string[]) => void;
  onEditMonthly: (item: OMExpenseItemData) => void;
  isLoading?: boolean;
  canEdit?: boolean;
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * 格式化金額（千分位）
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 格式化日期
 */
function formatDate(date: string | null | undefined): string {
  if (!date) return '-';
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(date));
}

/**
 * 計算利用率
 */
function calculateUtilization(actual: number, budget: number): number {
  if (budget <= 0) return 0;
  return (actual / budget) * 100;
}

/**
 * 獲取利用率顏色
 */
function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return 'text-red-600 dark:text-red-400';
  if (utilization > 90) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

// ============================================================
// Sortable Row Component
// ============================================================

interface SortableRowProps {
  item: OMExpenseItemData;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
  onEditMonthly: () => void;
  canEdit: boolean;
}

function SortableRow({
  item,
  index,
  onEdit,
  onDelete,
  onEditMonthly,
  canEdit,
}: SortableRowProps) {
  const t = useTranslations('omExpenses');

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const utilization = calculateUtilization(item.actualSpent, item.budgetAmount);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'bg-muted/50 opacity-50'
      )}
    >
      {/* Drag Handle */}
      <TableCell className="w-10">
        {canEdit && (
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
            aria-label={t('items.dragToReorder', { defaultValue: '拖曳以排序' })}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
      </TableCell>

      {/* Index */}
      <TableCell className="w-12 text-center text-muted-foreground">
        {index + 1}
      </TableCell>

      {/* Item Name - CHANGE-009: 點擊 Item Name 可直接編輯 */}
      <TableCell className="font-medium">
        <div>
          <button
            onClick={onEdit}
            className="text-left hover:text-primary hover:underline cursor-pointer transition-colors"
            title={t('items.clickToEdit', { defaultValue: '點擊編輯' })}
          >
            {item.name}
          </button>
          {item.description && (
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {item.description}
            </div>
          )}
        </div>
      </TableCell>

      {/* OpCo - CHANGE-009: 改為顯示 company name */}
      <TableCell>
        <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
          {item.opCo?.name || '-'}
        </span>
      </TableCell>

      {/* Budget Amount */}
      <TableCell className="text-right font-mono">
        {formatCurrency(item.budgetAmount)}
      </TableCell>

      {/* Actual Spent */}
      <TableCell className={cn('text-right font-mono', getUtilizationColor(utilization))}>
        {formatCurrency(item.actualSpent)}
      </TableCell>

      {/* Utilization */}
      <TableCell className={cn('text-right', getUtilizationColor(utilization))}>
        {utilization.toFixed(1)}%
      </TableCell>

      {/* End Date */}
      <TableCell className="text-right">
        {formatDate(item.endDate)}
      </TableCell>

      {/* Actions */}
      <TableCell className="w-32">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <TooltipProvider>
            {/* Edit Monthly Records */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onEditMonthly}
                  className="h-8 w-8"
                >
                  <Calendar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('items.editMonthly', { defaultValue: '編輯月度記錄' })}
              </TooltipContent>
            </Tooltip>

            {canEdit && (
              <>
                {/* Edit Item */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onEdit}
                      className="h-8 w-8"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('items.editItem', { defaultValue: '編輯項目' })}
                  </TooltipContent>
                </Tooltip>

                {/* Delete Item */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onDelete}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('items.removeItem', { defaultValue: '刪除項目' })}
                  </TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function OMExpenseItemList({
  omExpenseId,
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorder,
  onEditMonthly,
  isLoading = false,
  canEdit = true,
}: OMExpenseItemListProps) {
  const t = useTranslations('omExpenses');
  const tCommon = useTranslations('common');

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Calculate totals
  const totals = useMemo(() => {
    return items.reduce(
      (acc, item) => ({
        budgetAmount: acc.budgetAmount + item.budgetAmount,
        actualSpent: acc.actualSpent + item.actualSpent,
      }),
      { budgetAmount: 0, actualSpent: 0 }
    );
  }, [items]);

  const totalUtilization = calculateUtilization(totals.actualSpent, totals.budgetAmount);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems.map((item) => item.id));
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) {
      onDeleteItem(itemToDelete);
    }
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('items.title', { defaultValue: '明細項目' })}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>{t('items.title', { defaultValue: '明細項目' })}</CardTitle>
              <CardDescription>
                {t('items.description', {
                  defaultValue: '管理 OM 費用的明細項目，拖曳可調整順序',
                  count: items.length,
                })}
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={onAddItem}>
                <Plus className="mr-2 h-4 w-4" />
                {t('items.addItem', { defaultValue: '新增項目' })}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">
                {t('items.noItems', { defaultValue: '尚無明細項目' })}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {t('items.addFirstItem', { defaultValue: '點擊上方按鈕新增第一個項目' })}
              </p>
              {canEdit && (
                <Button className="mt-4" onClick={onAddItem}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t('items.addItem', { defaultValue: '新增項目' })}
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10"></TableHead>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>
                          {t('itemFields.name.label', { defaultValue: '項目名稱' })}
                        </TableHead>
                        <TableHead>
                          {t('itemFields.opCo.label', { defaultValue: 'OpCo' })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('detail.budgetAmount', { defaultValue: '預算金額' })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('detail.actualSpent', { defaultValue: '實際支出' })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('detail.utilizationRate', { defaultValue: '利用率' })}
                        </TableHead>
                        <TableHead className="text-right">
                          {t('itemFields.endDate.label', { defaultValue: '結束日期' })}
                        </TableHead>
                        <TableHead className="w-32">
                          {tCommon('actions.title', { defaultValue: '操作' })}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {items.map((item, index) => (
                        <SortableRow
                          key={item.id}
                          item={item}
                          index={index}
                          onEdit={() => onEditItem(item)}
                          onDelete={() => handleDeleteClick(item.id)}
                          onEditMonthly={() => onEditMonthly(item)}
                          canEdit={canEdit}
                        />
                      ))}
                    </TableBody>
                    <TableFooter>
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={4} className="font-semibold">
                          {t('items.total', { defaultValue: '總計' })} ({items.length}{' '}
                          {t('items.itemCount', { defaultValue: '項' })})
                        </TableCell>
                        <TableCell className="text-right font-semibold font-mono">
                          {formatCurrency(totals.budgetAmount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-semibold font-mono',
                            getUtilizationColor(totalUtilization)
                          )}
                        >
                          {formatCurrency(totals.actualSpent)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            'text-right font-semibold',
                            getUtilizationColor(totalUtilization)
                          )}
                        >
                          {totalUtilization.toFixed(1)}%
                        </TableCell>
                        <TableCell colSpan={2}></TableCell>
                      </TableRow>
                    </TableFooter>
                  </Table>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('items.confirmDeleteTitle', { defaultValue: '確認刪除' })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('items.confirmDelete', {
                defaultValue: '確定要刪除此項目嗎？相關的月度記錄也會一併刪除。此操作無法復原。',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {tCommon('actions.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tCommon('actions.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
