/**
 * @fileoverview Approval Step List - 審批步驟清單（FEAT-014）
 * @component ApprovalStepList
 *
 * @description
 * 單一審批流程下的有序步驟清單，支援 @dnd-kit 拖曳排序、編輯、刪除。
 * 受控組件：本身不呼叫 API，所有資料與操作由父層（流程配置頁）提供。
 * 比照 FEAT-015 ProjectExpenseItemList 的拖曳模式。
 *
 * @related
 * - apps/web/src/app/[locale]/settings/approval-workflows/page.tsx
 *
 * @since FEAT-014 - 可配置序列審批流程
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
import { GripVertical, Plus, Pencil, Trash2, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import type { ApprovalStepData } from './types';
import type { DragEndEvent } from '@dnd-kit/core';

interface ApprovalStepListProps {
  steps: ApprovalStepData[];
  onAddStep: () => void;
  onEditStep: (step: ApprovalStepData) => void;
  onRemoveStep: (stepId: string) => void;
  onReorder: (orderedStepIds: string[]) => void;
}

interface SortableStepProps {
  step: ApprovalStepData;
  index: number;
  isLast: boolean;
  onEdit: () => void;
  onRemove: () => void;
}

function SortableStep({ step, index, isLast, onEdit, onRemove }: SortableStepProps) {
  const t = useTranslations('approvalWorkflows');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: step.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group flex items-center gap-3 rounded-md border bg-card p-3',
        isDragging && 'opacity-50 shadow-lg'
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 text-muted-foreground hover:text-foreground active:cursor-grabbing"
        aria-label={t('steps.dragToReorder')}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{step.role.name}</Badge>
          {step.name && (
            <span className="truncate text-sm text-muted-foreground">{step.name}</span>
          )}
        </div>
      </div>

      {!isLast && <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />}

      <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onRemove}
          className="h-8 w-8 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function ApprovalStepList({
  steps,
  onAddStep,
  onEditStep,
  onRemoveStep,
  onReorder,
}: ApprovalStepListProps) {
  const t = useTranslations('approvalWorkflows');

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = steps.findIndex((s) => s.id === active.id);
      const newIndex = steps.findIndex((s) => s.id === over.id);
      const newOrder = arrayMove(steps, oldIndex, newIndex);
      onReorder(newOrder.map((s) => s.id));
    }
  };

  return (
    <div className="space-y-3">
      {steps.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          {t('steps.noSteps')}
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={steps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              {steps.map((step, index) => (
                <SortableStep
                  key={step.id}
                  step={step}
                  index={index}
                  isLast={index === steps.length - 1}
                  onEdit={() => onEditStep(step)}
                  onRemove={() => onRemoveStep(step.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <Button size="sm" variant="outline" onClick={onAddStep}>
        <Plus className="mr-2 h-4 w-4" />
        {t('steps.addStep')}
      </Button>
    </div>
  );
}

export default ApprovalStepList;
