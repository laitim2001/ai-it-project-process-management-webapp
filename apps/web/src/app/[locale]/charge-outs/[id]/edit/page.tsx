/**
 * @fileoverview Edit Charge Out Page - 編輯費用轉嫁頁面
 *
 * @description
 * 提供編輯現有費用轉嫁的表單頁面，支援修改轉嫁資訊。
 * 僅允許編輯 Draft 狀態的費用轉嫁，使用 React Hook Form 進行表單驗證。
 *
 * @page /[locale]/charge-outs/[id]/edit
 *
 * @features
 * - 完整的費用轉嫁編輯表單（預填充現有資料）
 * - 修改預算類別、成本中心、金額、描述
 * - 狀態檢查（僅允許編輯 Draft 轉嫁）
 * - 即時表單驗證（Zod schema）
 * - 錯誤處理（權限錯誤、狀態錯誤、網路錯誤）
 *
 * @permissions
 * - ProjectManager: 可編輯自己專案的 Draft 費用轉嫁
 * - Supervisor: 可編輯任意專案的 Draft 費用轉嫁
 * - Admin: 完整權限
 * - 限制: 僅 Draft 狀態的轉嫁可編輯
 *
 * @routing
 * - 編輯頁: /charge-outs/[id]/edit
 * - 成功後導向: /charge-outs/[id] (費用轉嫁詳情頁)
 * - 取消後返回: /charge-outs/[id] (費用轉嫁詳情頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢和快取
 * - shadcn/ui: UI 組件庫
 *
 * @related
 * - `packages/api/src/routers/chargeOut.ts` - ChargeOut API Router（查詢和更新操作）
 * - `packages/db/prisma/schema.prisma` - ChargeOut, ChargeOutItem 資料模型定義
 * - `apps/web/src/components/charge-out/ChargeOutForm.tsx` - ChargeOut 表單組件（編輯模式）
 * - `apps/web/src/app/[locale]/charge-outs/[id]/page.tsx` - ChargeOut 詳情頁（編輯成功後導向）
 * - `apps/web/src/app/[locale]/charge-outs/page.tsx` - ChargeOut 列表頁（取消後返回）
 * - `apps/web/src/components/layout/dashboard-layout.tsx` - Dashboard 佈局組件
 *
 * @author IT Department
 * @since Epic 6 - Expense Recording & Financial Integration
 * @lastModified 2025-11-14
 */

'use client';

import { useRouter, Link } from "@/i18n/routing";
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export default function EditChargeOutPage({ params }: { params: { id: string } }) {
  const t = useTranslations('chargeOuts');
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
            <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href="/charge-outs">費用轉嫁</Link></BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild><Link href={`/charge-outs/${chargeOut.id}`}>
              {chargeOut.name}
            </Link></BreadcrumbLink>
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
