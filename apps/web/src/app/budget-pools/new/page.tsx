'use client';

import { BudgetPoolForm } from '@/components/budget-pool/BudgetPoolForm';

export default function NewBudgetPoolPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-3xl font-bold">Create New Budget Pool</h1>
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6">
        <BudgetPoolForm mode="create" />
      </div>
    </div>
  );
}
