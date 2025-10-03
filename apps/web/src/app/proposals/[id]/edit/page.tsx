import dynamic from 'next/dynamic';
import { api } from '@/lib/trpc';
import { notFound, redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetProposalForm = dynamic(
  () => import('@/components/proposal/BudgetProposalForm').then((mod) => ({ default: mod.BudgetProposalForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

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
    <DashboardLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/proposals">預算提案</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/proposals/${params.id}`}>{proposal.title}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">編輯預算提案</h1>
          <p className="mt-2 text-gray-600">
            更新提案資訊
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetProposalForm
              mode="edit"
              initialData={{
                id: proposal.id,
                title: proposal.title,
                amount: proposal.amount,
                projectId: proposal.projectId,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
