'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { ChargeOutForm } from '@/components/charge-out/ChargeOutForm';
import { api } from '@/lib/trpc';

/**
 * ChargeOut 編輯頁面
 *
 * 功能：
 * - 編輯現有的 ChargeOut 記錄
 * - 僅 Draft 狀態可編輯
 * - 使用 ChargeOutForm 組件
 *
 * Fixed: params is already unwrapped in Client Components (not Promise)
 */

export default function EditChargeOutPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  // 獲取 ChargeOut 詳情
  const { data: chargeOut, isLoading } = api.chargeOut.getById.useQuery({
    id: params.id,
  });

  // Loading state
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">載入中...</div>
      </DashboardLayout>
    );
  }

  // Not found
  if (!chargeOut) {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">找不到 ChargeOut 記錄</p>
          <Button className="mt-4" onClick={() => router.push('/charge-outs')}>
            返回列表
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // 只有 Draft 狀態可編輯
  if (chargeOut.status !== 'Draft') {
    return (
      <DashboardLayout>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            只有草稿 (Draft) 狀態的 ChargeOut 可以編輯
          </p>
          <Button className="mt-4" onClick={() => router.push(`/charge-outs/${chargeOut.id}`)}>
            返回詳情
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Breadcrumb 導航 */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">首頁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/charge-outs">費用轉嫁</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/charge-outs/${chargeOut.id}`}>
              {chargeOut.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>編輯</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/charge-outs/${chargeOut.id}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">編輯 ChargeOut</h1>
            <p className="mt-2 text-muted-foreground">{chargeOut.name}</p>
          </div>
        </div>
      </div>

      {/* ChargeOut 表單 */}
      <ChargeOutForm initialData={chargeOut} isEdit={true} />
    </DashboardLayout>
  );
}
