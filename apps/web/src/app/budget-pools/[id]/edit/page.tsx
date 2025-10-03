'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { api } from '@/lib/trpc';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const BudgetPoolForm = dynamic(
  () => import('@/components/budget-pool/BudgetPoolForm').then((mod) => ({ default: mod.BudgetPoolForm })),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false,
  }
);

export default function EditBudgetPoolPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: budgetPool, isLoading } = api.budgetPool.getById.useQuery({ id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-lg text-gray-600">載入中...</div>
        </div>
      </DashboardLayout>
    );
  }

  if (!budgetPool) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">找不到預算池</h2>
            <p className="text-gray-600 mb-4">此預算池不存在或已被刪除。</p>
            <Link href="/budget-pools">
              <Button>返回預算池列表</Button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
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
              <BreadcrumbLink href="/budget-pools">預算池</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/budget-pools/${id}`}>{budgetPool.name}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">編輯預算池</h1>
          <p className="mt-2 text-gray-600">
            更新預算池資訊
          </p>
        </div>

        {/* Form Card */}
        <Card>
          <CardContent className="pt-6">
            <BudgetPoolForm
              mode="edit"
              initialData={{
                id: budgetPool.id,
                name: budgetPool.name,
                totalAmount: budgetPool.totalAmount,
                financialYear: budgetPool.financialYear,
              }}
            />
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
