/**
 * @fileoverview Project Expense Item List - 專案費用明細清單（FEAT-015）
 * @component ProjectExpenseItemList
 *
 * @description
 * 單一費用表（表頭）下的明細清單，支援 @dnd-kit 拖曳排序、編輯、刪除、編輯月度記錄。
 * 比照 OMExpenseItemList，但欄位依 FEAT-015 調整：顯示費用類別、OpCo、年度預算
 * （= 12 月預算加總）與年度實際（= 12 月實際加總），金額用 CHANGE-042 雙幣別顯示。
 *
 * 受控組件：本身不呼叫 API，所有資料與操作由父層（ProjectExpensePanel）提供。
 *
 * @related
 * - apps/web/src/components/project-expense/ProjectExpensePanel.tsx
 * - apps/web/src/components/project-expense/ProjectExpenseItemMonthlyGrid.tsx
 *
 * @since FEAT-015 - Project Expense 月度模組
 */

'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus, Pencil, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';

import { DualCurrency } from '@/components/shared/DualCurrency';
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
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import type { ProjectExpenseItemData } from './types';
import type { DragEndEvent } from '@dnd-kit/core';

interface ProjectExpenseItemListProps {
  items: ProjectExpenseItemData[];
  onAddItem: () => void;
  onEditItem: (item: ProjectExpenseItemData) => void;
  onDeleteItem: (itemId: string) => void;
  onReorder: (newOrder: string[]) => void;
  /** CHANGE-044: 選取明細以於右欄檢視/編輯月度（取代原月度 Dialog） */
  onSelectItem: (item: ProjectExpenseItemData) => void;
  /** CHANGE-044: 目前選中的明細 id（用於高亮列） */
  selectedItemId: string | null;
}

function calcUtilization(actual: number, budget: number): number {
  if (budget <= 0) return 0;
  return (actual / budget) * 100;
}

function getUtilizationColor(utilization: number): string {
  if (utilization > 100) return 'text-red-600 dark:text-red-400';
  if (utilization > 90) return 'text-yellow-600 dark:text-yellow-400';
  return 'text-green-600 dark:text-green-400';
}

// ============================================================
// Sortable Row
// ============================================================

interface SortableRowProps {
  item: ProjectExpenseItemData;
  index: number;
  isSelected: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onSelect: () => void;
}

function SortableRow({
  item,
  index,
  isSelected,
  onEdit,
  onDelete,
  onSelect,
}: SortableRowProps) {
  const t = useTranslations('projectExpenses');

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const utilization = calcUtilization(item.totalActualSpent, item.totalBudgetAmount);

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      className={cn(
        'group',
        isDragging && 'bg-muted/50 opacity-50',
        isSelected && 'bg-primary/10 hover:bg-primary/10'
      )}
    >
      {/* Drag Handle */}
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
          aria-label={t('items.dragToReorder')}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </TableCell>

      {/* Index */}
      <TableCell className="w-12 text-center text-muted-foreground">
        {index + 1}
      </TableCell>

      {/* Name */}
      <TableCell className="font-medium">
        <button
          onClick={onSelect}
          className={cn(
            'cursor-pointer text-left transition-colors hover:text-primary hover:underline',
            isSelected && 'text-primary'
          )}
          title={t('items.editMonthly')}
        >
          {item.name}
        </button>
        {item.description && (
          <div className="max-w-[200px] truncate text-sm text-muted-foreground">
            {item.description}
          </div>
        )}
      </TableCell>

      {/* Category */}
      <TableCell>
        {item.category ? (
          <span className="inline-flex items-center rounded-full bg-secondary px-2 py-1 text-xs font-medium text-secondary-foreground">
            {item.category.name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* OpCo */}
      <TableCell>
        {item.opCo ? (
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
            {item.opCo.name}
          </span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )}
      </TableCell>

      {/* Annual Budget (= Σ monthly budget) */}
      <TableCell className="text-right font-mono">
        <DualCurrency amountUSD={item.totalBudgetAmount} currency={item.currency} />
      </TableCell>

      {/* Annual Actual (= Σ monthly actual) */}
      <TableCell className={cn('text-right font-mono', getUtilizationColor(utilization))}>
        <DualCurrency amountUSD={item.totalActualSpent} currency={item.currency} />
      </TableCell>

      {/* Utilization */}
      <TableCell className={cn('text-right', getUtilizationColor(utilization))}>
        {utilization.toFixed(1)}%
      </TableCell>

      {/* Actions */}
      <TableCell className="w-32">
        <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onSelect} className="h-8 w-8">
                  <Calendar className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('items.editMonthly')}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
                  <Pencil className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('items.editItem')}</TooltipContent>
            </Tooltip>

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
              <TooltipContent>{t('items.removeItem')}</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

// ============================================================
// Main Component
// ============================================================

export default function ProjectExpenseItemList({
  items,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onReorder,
  onSelectItem,
  selectedItemId,
}: ProjectExpenseItemListProps) {
  const t = useTranslations('projectExpenses');
  const tCommon = useTranslations('common');

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const totals = useMemo(
    () =>
      items.reduce(
        (acc, item) => ({
          budget: acc.budget + item.totalBudgetAmount,
          actual: acc.actual + item.totalActualSpent,
        }),
        { budget: 0, actual: 0 }
      ),
    [items]
  );

  const totalUtilization = calcUtilization(totals.actual, totals.budget);

  // CHANGE-042: 全部明細同幣別時，總計才顯示換算次值（否則只顯示 USD，避免混幣別錯加）
  const sharedCurrency = useMemo(() => {
    const first = items[0];
    if (!first?.currency) return null;
    const firstCurrency = first.currency;
    return items.every((i) => i.currency?.id === firstCurrency.id)
      ? firstCurrency
      : null;
  }, [items]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const newItems = arrayMove(items, oldIndex, newIndex);
      onReorder(newItems.map((i) => i.id));
    }
  };

  const handleDeleteClick = (itemId: string) => {
    setItemToDelete(itemId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (itemToDelete) onDeleteItem(itemToDelete);
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-end">
        <Button size="sm" variant="outline" onClick={onAddItem}>
          <Plus className="mr-2 h-4 w-4" />
          {t('items.addItem')}
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <AlertCircle className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="font-medium text-muted-foreground">{t('items.noItems')}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('items.addFirstItem')}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead className="w-12 text-center">#</TableHead>
                    <TableHead>{t('itemFields.name.label')}</TableHead>
                    <TableHead>{t('itemFields.category.label')}</TableHead>
                    <TableHead>{t('itemFields.opCo.label')}</TableHead>
                    <TableHead className="text-right">{t('fields.annualBudget')}</TableHead>
                    <TableHead className="text-right">{t('fields.annualActual')}</TableHead>
                    <TableHead className="text-right">{t('fields.utilizationRate')}</TableHead>
                    <TableHead className="w-32 text-right">
                      {tCommon('actions.title')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <SortableRow
                      key={item.id}
                      item={item}
                      index={index}
                      isSelected={item.id === selectedItemId}
                      onEdit={() => onEditItem(item)}
                      onDelete={() => handleDeleteClick(item.id)}
                      onSelect={() => onSelectItem(item)}
                    />
                  ))}
                </TableBody>
                <TableFooter>
                  <TableRow className="bg-muted/50">
                    <TableCell colSpan={5} className="font-semibold">
                      {t('items.total')} ({items.length} {t('items.itemCount')})
                    </TableCell>
                    <TableCell className="text-right font-mono font-semibold">
                      <DualCurrency amountUSD={totals.budget} currency={sharedCurrency} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-mono font-semibold',
                        getUtilizationColor(totalUtilization)
                      )}
                    >
                      <DualCurrency amountUSD={totals.actual} currency={sharedCurrency} />
                    </TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold',
                        getUtilizationColor(totalUtilization)
                      )}
                    >
                      {totalUtilization.toFixed(1)}%
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </SortableContext>
          </DndContext>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('items.confirmDeleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('items.confirmDelete')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tCommon('actions.cancel')}</AlertDialogCancel>
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
