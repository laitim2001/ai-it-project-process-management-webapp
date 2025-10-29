'use client';

/**
 * BudgetProposalForm 組件
 *
 * 用於新增和編輯預算提案的表單組件
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/use-toast';

interface BudgetProposalFormProps {
  initialData?: {
    id: string;
    title: string;
    amount: number;
    projectId: string;
  };
  mode: 'create' | 'edit';
}

export function BudgetProposalForm({ initialData, mode }: BudgetProposalFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: initialData?.title ?? '',
    amount: initialData?.amount ?? 0,
    projectId: initialData?.projectId ?? '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // 取得所有專案
  const { data: projects } = api.project.getAll.useQuery();

  const createMutation = api.budgetProposal.create.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '提案建立成功！',
        variant: 'success',
      });
      router.push('/proposals');
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateMutation = api.budgetProposal.update.useMutation({
    onSuccess: () => {
      toast({
        title: '成功',
        description: '提案更新成功！',
        variant: 'success',
      });
      router.push(`/proposals/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast({
        title: '錯誤',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = '標題為必填欄位';
    }

    if (formData.amount <= 0) {
      newErrors.amount = '金額必須大於0';
    }

    if (!formData.projectId) {
      newErrors.projectId = '專案為必填欄位';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    if (mode === 'create') {
      createMutation.mutate(formData);
    } else if (initialData) {
      updateMutation.mutate({
        id: initialData.id,
        title: formData.title,
        amount: formData.amount,
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          提案標題 *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="例如：購買伺服器設備"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          預算金額 ($) *
        </label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={(e) =>
            setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="100000"
          step="0.01"
        />
        {errors.amount && (
          <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
        )}
      </div>

      {mode === 'create' && (
        <div>
          <label htmlFor="projectId" className="block text-sm font-medium text-gray-700">
            所屬專案 *
          </label>
          <select
            id="projectId"
            name="projectId"
            value={formData.projectId}
            onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          >
            <option value="">選擇專案</option>
            {projects?.items?.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          {errors.projectId && (
            <p className="mt-1 text-sm text-red-600">{errors.projectId}</p>
          )}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? '儲存中...' : mode === 'create' ? '建立提案' : '更新提案'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          取消
        </button>
      </div>
    </form>
  );
}
