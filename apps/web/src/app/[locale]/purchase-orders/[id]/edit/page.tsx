/**
 * @fileoverview Edit Purchase Order Page - 編輯採購單頁面
 *
 * @description
 * 提供編輯現有採購單的表單頁面，支援修改採購單資訊和品項明細。
 * 使用 React Hook Form 進行表單驗證，預填充現有資料。
 * 僅允許編輯 Draft 狀態的採購單，其他狀態會顯示錯誤提示。
 *
 * @page /[locale]/purchase-orders/[id]/edit
 *
 * @features
 * - 完整的採購單編輯表單（預填充現有資料）
 * - 修改金額、日期、說明、品項明細
 * - 即時表單驗證（Zod schema）
 * - 狀態檢查（僅允許 Draft 狀態編輯）
 * - 錯誤處理（採購單不存在、權限錯誤、狀態錯誤、網路錯誤）
 * - 載入狀態骨架屏
 * - 麵包屑導航支援
 * - 國際化表單標籤和錯誤訊息
 *
 * @permissions
 * - ProjectManager: 可編輯自己專案的採購單（僅 Draft 狀態）
 * - Supervisor: 可編輯任意專案的採購單（僅 Draft 狀態）
 * - Admin: 完整權限（僅 Draft 狀態）
 *
 * @routing
 * - 編輯頁: /purchase-orders/[id]/edit
 * - 成功後導向: /purchase-orders/[id] (採購單詳情頁)
 * - 取消後返回: /purchase-orders/[id] (採購單詳情頁)
 *
 * @dependencies
 * - next-intl: 國際化支援
 * - @tanstack/react-query: tRPC 查詢、mutation 和快取
 * - shadcn/ui: Breadcrumb, Skeleton, Alert, Button
 *
 * @related
 * - apps/web/src/components/purchase-order/PurchaseOrderForm.tsx - 採購單表單組件
 * - packages/api/src/routers/purchaseOrder.ts - 採購單 API Router (getById, update)
 * - apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx - 採購單詳情頁面
 * - apps/web/src/app/[locale]/purchase-orders/page.tsx - 採購單列表頁面
 *
 * @author IT Department
 * @since Epic 5 - Procurement & Vendor Management
 * @lastModified 2025-11-14
 */

'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/trpc';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { PurchaseOrderForm } from '@/components/purchase-order/PurchaseOrderForm';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Link } from "@/i18n/routing";

export default function EditPurchaseOrderPage() {
  const t = useTranslations('purchaseOrders');
  const params = useParams();
  const id = params.id as string;

  // 查詢採購單數據
  const { data: purchaseOrder, isLoading, error } = api.purchaseOrder.getById.useQuery({ id });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Skeleton className="h-5 w-[420px]" />
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !purchaseOrder) {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/purchase-orders">採購單</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>編輯</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  找不到採購單。此採購單可能不存在或已被刪除。
                </AlertDescription>
              </Alert>
              <Link href="/purchase-orders">
                <Button>返回採購單列表</Button>
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // 檢查是否為 Draft 狀態
  if (purchaseOrder.status !== 'Draft') {
    return (
      <DashboardLayout>
        <div className="space-y-8">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild><Link href="/purchase-orders">採購單</Link></BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>編輯</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex min-h-[60vh] items-center justify-center">
            <div className="max-w-md space-y-6 text-center">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  只有草稿狀態的採購單才能編輯。當前狀態：{purchaseOrder.status}
                </AlertDescription>
              </Alert>
              <Link href={`/purchase-orders/${id}`}>
                <Button>返回詳情頁面</Button>
              </Link>
            </div>
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
              <BreadcrumbLink asChild><Link href="/dashboard">首頁</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href="/purchase-orders">採購單</Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild><Link href={`/purchase-orders/${id}`}>
                {purchaseOrder.name}
              </Link></BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>編輯</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">編輯採購單</h1>
          <p className="text-muted-foreground mt-2">
            修改採購單信息和品項明細
          </p>
        </div>

        {/* 表單 */}
        <PurchaseOrderForm initialData={purchaseOrder} isEdit={true} />
      </div>
    </DashboardLayout>
  );
}
