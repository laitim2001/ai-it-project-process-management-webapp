'use client';

/**
 * 創建新採購單頁面
 *
 * 功能說明：
 * - 使用 PurchaseOrderForm 組件創建新採購單
 * - 支持表頭-明細結構
 * - 自動計算總金額
 *
 * Module 4: PurchaseOrder 表頭明細重構 - 前端實施
 */

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

export default function NewPurchaseOrderPage() {
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
              <BreadcrumbLink href="/purchase-orders">採購單</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>新建</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* 頁面標題 */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">創建新採購單</h1>
          <p className="text-muted-foreground mt-2">
            填寫採購單基本信息並添加採購品項明細
          </p>
        </div>

        {/* 表單 */}
        <PurchaseOrderForm />
      </div>
    </DashboardLayout>
  );
}
