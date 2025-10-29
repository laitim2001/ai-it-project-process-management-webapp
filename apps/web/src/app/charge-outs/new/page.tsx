'use client';

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
import { useRouter } from 'next/navigation';

/**
 * ChargeOut 新增頁面
 *
 * 功能：
 * - 創建新的 ChargeOut 記錄
 * - 使用 ChargeOutForm 組件
 */

export default function NewChargeOutPage() {
  const router = useRouter();

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
            <BreadcrumbPage>新增 ChargeOut</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* 頁面標題 */}
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push('/charge-outs')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">新增 ChargeOut</h1>
            <p className="mt-2 text-muted-foreground">
              創建新的費用轉嫁記錄，將 IT 費用轉嫁至營運公司 (OpCo)
            </p>
          </div>
        </div>
      </div>

      {/* ChargeOut 表單 */}
      <ChargeOutForm />
    </DashboardLayout>
  );
}
