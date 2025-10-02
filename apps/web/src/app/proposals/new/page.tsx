import { BudgetProposalForm } from '@/components/proposal/BudgetProposalForm';

export default function NewProposalPage() {
  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">新增預算提案</h1>
        <p className="mt-2 text-gray-600">
          填寫以下資訊以建立新的預算提案
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <BudgetProposalForm mode="create" />
      </div>
    </div>
  );
}
