'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/trpc';
import { useToast } from '@/components/ui/Toast';

interface BudgetPoolFormProps {
  initialData?: {
    id: string;
    name: string;
    totalAmount: number;
    financialYear: number;
  };
  mode: 'create' | 'edit';
}

export function BudgetPoolForm({ initialData, mode }: BudgetPoolFormProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [formData, setFormData] = useState({
    name: initialData?.name ?? '',
    totalAmount: initialData?.totalAmount ?? 0,
    financialYear: initialData?.financialYear ?? new Date().getFullYear(),
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = api.budgetPool.create.useMutation({
    onSuccess: () => {
      showToast('Budget pool created successfully!', 'success');
      router.push('/budget-pools');
      router.refresh();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const updateMutation = api.budgetPool.update.useMutation({
    onSuccess: () => {
      showToast('Budget pool updated successfully!', 'success');
      router.push(`/budget-pools/${initialData?.id}`);
      router.refresh();
    },
    onError: (error) => {
      showToast(`Error: ${error.message}`, 'error');
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.totalAmount <= 0) {
      newErrors.totalAmount = 'Amount must be greater than 0';
    }

    if (formData.financialYear < 2000 || formData.financialYear > 2100) {
      newErrors.financialYear = 'Invalid financial year';
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
        ...formData,
      });
    }
  };

  const isSubmitting = createMutation.isLoading || updateMutation.isLoading;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Budget Pool Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="e.g., FY2024 IT Infrastructure"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
          Total Budget Amount ($)
        </label>
        <input
          type="number"
          id="totalAmount"
          value={formData.totalAmount}
          onChange={(e) =>
            setFormData({ ...formData, totalAmount: parseFloat(e.target.value) || 0 })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="100000"
          step="0.01"
        />
        {errors.totalAmount && (
          <p className="mt-1 text-sm text-red-600">{errors.totalAmount}</p>
        )}
      </div>

      <div>
        <label htmlFor="financialYear" className="block text-sm font-medium text-gray-700">
          Financial Year
        </label>
        <input
          type="number"
          id="financialYear"
          value={formData.financialYear}
          onChange={(e) =>
            setFormData({ ...formData, financialYear: parseInt(e.target.value) || new Date().getFullYear() })
          }
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="2024"
        />
        {errors.financialYear && (
          <p className="mt-1 text-sm text-red-600">{errors.financialYear}</p>
        )}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:bg-gray-400"
        >
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Budget Pool' : 'Update Budget Pool'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-4 py-2 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
