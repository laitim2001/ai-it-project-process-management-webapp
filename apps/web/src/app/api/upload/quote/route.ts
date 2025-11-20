/**
 * @fileoverview 報價單文件上傳 API Route - 供應商報價檔案上傳服務（Azure Blob Storage）
 * @description 處理供應商報價單檔案上傳至 Azure Blob Storage，並自動建立報價記錄至資料庫
 *
 * 此 API 用於 Epic 5 採購管理流程，允許專案經理為已批准的專案上傳供應商報價單。
 * 與其他上傳 API 不同，此 API 在上傳成功後會直接建立 Quote 記錄至資料庫，
 * 並驗證專案狀態（必須有已批准的提案）和供應商存在性。
 *
 * **✨ Azure 部署準備階段 3 更新**: 文件存儲已從本地文件系統遷移到 Azure Blob Storage，
 * 確保在 Azure App Service 容器環境中文件永久保存。
 *
 * @api
 * @method POST
 * @route /api/upload/quote
 *
 * @features
 * - 商業文件格式支援 - 支援 PDF、Word（.doc/.docx）、Excel（.xls/.xlsx）
 * - 檔案大小驗證 - 限制單一檔案最大 10MB
 * - 業務邏輯驗證 - 檢查專案是否有已批准提案、供應商是否存在
 * - 資料庫記錄自動建立 - 上傳成功後自動建立 Quote 記錄（包含 vendor、project 關聯）
 * - 唯一檔名生成 - 使用 `quote_{projectId}_{vendorId}_{timestamp}.{ext}` 格式
 * - ✨ Azure Blob Storage - 文件永久保存至 Azure Blob Storage（支持本地 Azurite 開發環境）
 * - 環境自動檢測 - 本地開發使用 Azurite，生產環境使用 Azure Blob Storage
 *
 * @security
 * - 檔案類型白名單驗證（ALLOWED_TYPES）
 * - 檔案大小限制（MAX_FILE_SIZE = 10MB）
 * - 必填欄位驗證（file, projectId, vendorId, amount）
 * - 業務規則驗證（專案必須有已批准提案）
 * - 外鍵驗證（Project 和 Vendor 必須存在）
 * - 錯誤處理避免伺服器資訊洩漏
 *
 * @dependencies
 * - `next/server` - Next.js App Router API Route 支援
 * - `@itpm/db` - Prisma Client，用於資料庫操作
 * - `@/lib/azure-storage` - Azure Blob Storage 服務層（uploadToBlob, BLOB_CONTAINERS）
 * - `@azure/storage-blob` - Azure Blob Storage SDK（間接依賴）
 * - `@azure/identity` - Azure 身份驗證（間接依賴，用於 Managed Identity）
 *
 * @related
 * - `apps/web/src/app/[locale]/quotes/page.tsx` - 報價單列表頁面
 * - `packages/api/src/routers/quote.ts` - 報價單 tRPC Router（查詢、比較報價）
 * - `packages/db/prisma/schema.prisma` - Quote, Project, Vendor 模型定義
 * - `apps/web/src/app/api/upload/invoice/route.ts` - 類似功能的發票上傳 API
 *
 * @author IT Project Management Team
 * @since Epic 5 - Story 5.2: 為已批准的專案上傳並關聯報價單
 *
 * @example
 * // 前端呼叫範例（FormData）
 * const formData = new FormData();
 * formData.append('file', quoteFile); // File 物件
 * formData.append('projectId', 'PROJ-2025-001');
 * formData.append('vendorId', 'VENDOR-001');
 * formData.append('amount', '50000');
 *
 * const response = await fetch('/api/upload/quote', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const result = await response.json();
 * // {
 * //   success: true,
 * //   quote: {
 * //     id: 'QUOTE-001',
 * //     amount: 50000,
 * //     filePath: 'https://itpmprodstorage.blob.core.windows.net/quotes/quote_PROJ-2025-001_VENDOR-001_1234567890.pdf',
 * //     vendor: { id: 'VENDOR-001', name: 'ABC 科技有限公司' },
 * //     project: { id: 'PROJ-2025-001', name: 'ERP 系統升級專案' }
 * //   }
 * // }
 *
 * @example
 * // 錯誤處理範例（專案無已批准提案）
 * if (!response.ok) {
 *   const error = await response.json();
 *   console.error(error.error); // "專案尚未有已批准的提案，無法上傳報價"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@itpm/db';
import { uploadToBlob, BLOB_CONTAINERS } from '@/lib/azure-storage';

// 允許的文件類型
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 獲取表單數據
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const vendorId = formData.get('vendorId') as string;
    const amount = formData.get('amount') as string;

    // 驗證必填欄位
    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的文件' },
        { status: 400 }
      );
    }

    if (!projectId || !vendorId || !amount) {
      return NextResponse.json(
        { error: '缺少必填欄位：projectId, vendorId, amount' },
        { status: 400 }
      );
    }

    // 驗證文件類型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支援的文件類型。請上傳 PDF, Word 或 Excel 文件。' },
        { status: 400 }
      );
    }

    // 驗證文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: '文件大小超過限制（最大 10MB）' },
        { status: 400 }
      );
    }

    // 驗證專案是否存在且已批准提案
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        proposals: {
          where: { status: 'Approved' },
        },
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: '專案不存在' },
        { status: 404 }
      );
    }

    if (project.proposals.length === 0) {
      return NextResponse.json(
        { error: '專案尚未有已批准的提案，無法上傳報價' },
        { status: 400 }
      );
    }

    // 驗證供應商是否存在
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: '供應商不存在' },
        { status: 404 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const blobName = `quote_${projectId}_${vendorId}_${timestamp}.${fileExtension}`;

    // 上傳文件到 Azure Blob Storage
    let blobUrl: string;
    try {
      console.log('[Quote Upload] 開始上傳到 Azure Blob Storage...');
      console.log('[Quote Upload] Blob 名稱:', blobName);
      console.log('[Quote Upload] Container:', BLOB_CONTAINERS.QUOTES);

      const uploadResult = await uploadToBlob(
        file,
        BLOB_CONTAINERS.QUOTES,
        blobName,
        file.type
      );

      blobUrl = uploadResult.url;
      console.log('[Quote Upload] 上傳成功，Blob URL:', blobUrl);
      console.log('[Quote Upload] 文件大小:', uploadResult.size, 'bytes');
    } catch (error) {
      console.error('[Quote Upload] Azure Blob Storage 上傳失敗:', error);
      return NextResponse.json(
        { error: `文件上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
        { status: 500 }
      );
    }

    // 創建報價記錄（使用 Blob URL）
    const quote = await prisma.quote.create({
      data: {
        projectId,
        vendorId,
        amount: parseFloat(amount),
        filePath: blobUrl, // ✅ 使用 Azure Blob Storage URL
        uploadDate: new Date(),
      },
      include: {
        vendor: true,
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: '報價單上傳成功',
      quote: {
        id: quote.id,
        amount: quote.amount,
        filePath: quote.filePath,
        uploadDate: quote.uploadDate,
        vendor: quote.vendor,
        project: quote.project,
      },
    });

  } catch (error) {
    console.error('報價單上傳錯誤:', error);
    return NextResponse.json(
      { error: '服務器錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}
