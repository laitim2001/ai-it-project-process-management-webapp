'use client';

import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import { BudgetPoolForm } from '@/components/budget-pool/BudgetPoolForm';

export default function EditBudgetPoolPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!budgetPool) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">Budget pool not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Edit Budget Pool</h1>
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <BudgetPoolForm
          mode="edit"
          initialData={{
            id: budgetPool.id,
            name: budgetPool.name,
            totalAmount: budgetPool.totalAmount,
            financialYear: budgetPool.financialYear,
          }}
        />
      </div>
    </div>
  );
}
