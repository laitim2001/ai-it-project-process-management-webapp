/**
 * @fileoverview 提案文件上傳 API Route - 預算提案文件上傳服務（Azure Blob Storage）
 * @description 處理預算提案計劃書檔案上傳至 Azure Blob Storage，支援 PDF、PPT、Word 格式
 *
 * 此 API 用於 Epic 3 預算提案工作流程，允許專案經理在提交預算提案時上傳專案計劃書。
 * 檔案上傳後保存至 Azure Blob Storage，並返回 Blob URL 供前端儲存至資料庫。
 *
 * **✨ Azure 部署準備階段 3 更新**: 文件存儲已從本地文件系統遷移到 Azure Blob Storage，
 * 確保在 Azure App Service 容器環境中文件永久保存。
 *
 * @api
 * @method POST
 * @route /api/upload/proposal
 *
 * @features
 * - 商業文件格式支援 - 支援 PDF、PowerPoint（.ppt/.pptx）、Word（.doc/.docx）
 * - 檔案大小驗證 - 限制單一檔案最大 20MB，適合包含圖表的完整計劃書
 * - 檔案類型驗證 - 使用 MIME Type 驗證，確保只接受文件格式
 * - 唯一檔名生成 - 使用 `proposal_{proposalId}_{timestamp}.{ext}` 格式避免檔名衝突
 * - ✨ Azure Blob Storage - 文件永久保存至 Azure Blob Storage（支持本地 Azurite 開發環境）
 * - 環境自動檢測 - 本地開發使用 Azurite，生產環境使用 Azure Blob Storage
 *
 * @security
 * - 檔案類型白名單驗證（ALLOWED_TYPES）
 * - 檔案大小限制（MAX_FILE_SIZE = 20MB）
 * - 必填欄位驗證（file, proposalId）
 * - 使用 TYPE_TO_EXTENSION 映射表確保副檔名正確
 * - 錯誤處理避免伺服器資訊洩漏
 *
 * @dependencies
 * - `next/server` - Next.js App Router API Route 支援
 * - `@/lib/azure-storage` - Azure Blob Storage 服務層（uploadToBlob, BLOB_CONTAINERS）
 * - `@azure/storage-blob` - Azure Blob Storage SDK（間接依賴）
 * - `@azure/identity` - Azure 身份驗證（間接依賴，用於 Managed Identity）
 *
 * @related
 * - `apps/web/src/app/[locale]/proposals/new/page.tsx` - 提案新增頁面（呼叫此 API）
 * - `packages/api/src/routers/budgetProposal.ts` - 提案 tRPC Router（儲存 filePath）
 * - `packages/db/prisma/schema.prisma` - BudgetProposal 模型定義
 * - `apps/web/src/app/api/upload/invoice/route.ts` - 類似功能的發票上傳 API
 *
 * @author IT Project Management Team
 * @since Epic 3 - Budget Proposal Workflow
 *
 * @example
 * // 前端呼叫範例（FormData）
 * const formData = new FormData();
 * formData.append('file', proposalFile); // File 物件
 * formData.append('proposalId', 'PROP-2025-001');
 *
 * const response = await fetch('/api/upload/proposal', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const result = await response.json();
 * // { success: true, filePath: 'https://itpmprodstorage.blob.core.windows.net/proposals/proposal_PROP-2025-001_1234567890.pdf', ... }
 *
 * @example
 * // 錯誤處理範例
 * if (!response.ok) {
 *   const error = await response.json();
 *   console.error(error.error); // "文件大小不能超過 20MB"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadToBlob, BLOB_CONTAINERS } from '@/lib/azure-storage';

// 允許的文件類型
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// 文件擴展名映射
const TYPE_TO_EXTENSION: Record<string, string> = {
  'application/pdf': 'pdf',
  'application/vnd.ms-powerpoint': 'ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
};

// 最大文件大小 (20MB)
const MAX_FILE_SIZE = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    // 獲取表單數據
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const proposalId = formData.get('proposalId') as string;

    // 驗證文件是否存在
    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的文件' },
        { status: 400 }
      );
    }

    // 驗證提案 ID
    if (!proposalId) {
      return NextResponse.json(
        { error: '缺少提案 ID' },
        { status: 400 }
      );
    }

    // 驗證文件類型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支持的文件類型。請上傳 PDF、PPT 或 Word 文件' },
        { status: 400 }
      );
    }

    // 驗證文件大小
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `文件大小不能超過 ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
        { status: 400 }
      );
    }

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = TYPE_TO_EXTENSION[file.type];
    const blobName = `proposal_${proposalId}_${timestamp}.${fileExtension}`;

    // 上傳文件到 Azure Blob Storage
    let blobUrl: string;
    try {
      console.log('[Proposal Upload] 開始上傳到 Azure Blob Storage...');
      console.log('[Proposal Upload] Blob 名稱:', blobName);
      console.log('[Proposal Upload] Container:', BLOB_CONTAINERS.PROPOSALS);

      const uploadResult = await uploadToBlob(
        file,
        BLOB_CONTAINERS.PROPOSALS,
        blobName,
        file.type
      );

      blobUrl = uploadResult.url;
      console.log('[Proposal Upload] 上傳成功，Blob URL:', blobUrl);
      console.log('[Proposal Upload] 文件大小:', uploadResult.size, 'bytes');
    } catch (error) {
      console.error('[Proposal Upload] Azure Blob Storage 上傳失敗:', error);
      return NextResponse.json(
        { error: `文件上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
        { status: 500 }
      );
    }

    // 返回 Blob URL（用於前端更新數據庫）
    return NextResponse.json({
      success: true,
      filePath: blobUrl, // ✅ 使用 Azure Blob Storage URL
      fileName: file.name,
      fileSize: file.size,
    });
  } catch (error) {
    console.error('提案文件上傳錯誤:', error);
    return NextResponse.json(
      { error: '文件上傳失敗，請稍後再試' },
      { status: 500 }
    );
  }
}
