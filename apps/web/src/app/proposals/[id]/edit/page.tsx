import { api } from '@/lib/trpc';
import { BudgetProposalForm } from '@/components/proposal/BudgetProposalForm';
import { notFound, redirect } from 'next/navigation';

interface EditProposalPageProps {
  params: {
    id: string;
  };
}

export default async function EditProposalPage({ params }: EditProposalPageProps) {
  const proposal = await api.budgetProposal.getById.query({ id: params.id });

  if (!proposal) {
    notFound();
  }

  // 只有草稿或需更多資訊狀態可以編輯
  if (proposal.status !== 'Draft' && proposal.status !== 'MoreInfoRequired') {
    redirect(`/proposals/${proposal.id}`);
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">編輯預算提案</h1>
        <p className="mt-2 text-gray-600">
          更新提案資訊
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow-md">
        <BudgetProposalForm
          mode="edit"
          initialData={{
            id: proposal.id,
            title: proposal.title,
            amount: proposal.amount,
            projectId: proposal.projectId,
          }}
        />
      </div>
    </div>
  );
}
