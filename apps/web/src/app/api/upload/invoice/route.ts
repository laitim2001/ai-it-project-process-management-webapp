/**
 * @fileoverview 發票文件上傳 API Route - 費用記錄檔案上傳服務
 * @description 處理費用發票檔案上傳，支援多種檔案格式，並進行嚴格驗證
 *
 * 此 API 用於 Epic 6 費用管理流程，允許專案經理在記錄費用時上傳發票掃描檔或電子檔。
 * 檔案上傳後保存至伺服器本地檔案系統，並返回檔案路徑供前端儲存至資料庫。
 *
 * @api
 * @method POST
 * @route /api/upload/invoice
 *
 * @features
 * - 多格式支援 - 支援 PDF、Word（.doc/.docx）、Excel（.xls/.xlsx）、圖片（JPEG/PNG）
 * - 檔案大小驗證 - 限制單一檔案最大 10MB，防止伺服器儲存空間濫用
 * - 檔案類型驗證 - 使用 MIME Type 驗證，拒絕不支援的檔案格式
 * - 唯一檔名生成 - 使用 `invoice_{purchaseOrderId}_{timestamp}.{ext}` 格式避免檔名衝突
 * - 本地檔案系統儲存 - 儲存至 `public/uploads/invoices/` 目錄，可直接透過 URL 訪問
 *
 * @security
 * - 檔案類型白名單驗證（ALLOWED_TYPES）
 * - 檔案大小限制（MAX_FILE_SIZE = 10MB）
 * - 必填欄位驗證（file, purchaseOrderId）
 * - 錯誤處理避免伺服器資訊洩漏
 * - 未來建議：增加防病毒掃描、檔案內容驗證
 *
 * @dependencies
 * - `next/server` - Next.js App Router API Route 支援
 * - `fs/promises` - Node.js 檔案系統操作（writeFile）
 * - `path` - 路徑處理工具（join）
 *
 * @related
 * - `apps/web/src/app/[locale]/expenses/new/page.tsx` - 費用新增頁面（呼叫此 API）
 * - `packages/api/src/routers/expense.ts` - 費用 tRPC Router（儲存 filePath）
 * - `packages/db/prisma/schema.prisma` - Expense.invoiceFilePath 欄位定義
 * - `apps/web/src/app/api/upload/quote/route.ts` - 類似功能的報價單上傳 API
 *
 * @author IT Project Management Team
 * @since Epic 6 - Story 6.1: 針對採購單記錄發票與費用
 *
 * @example
 * // 前端呼叫範例（FormData）
 * const formData = new FormData();
 * formData.append('file', invoiceFile);
 * formData.append('purchaseOrderId', 'PO-2025-001');
 *
 * const response = await fetch('/api/upload/invoice', {
 *   method: 'POST',
 *   body: formData,
 * });
 *
 * const result = await response.json();
 * // { success: true, filePath: '/uploads/invoices/invoice_PO-2025-001_1234567890.pdf', ... }
 *
 * @example
 * // 錯誤處理範例
 * if (!response.ok) {
 *   const error = await response.json();
 *   console.error(error.error); // "文件大小超過限制（最大 10MB）"
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

// 允許的文件類型
const ALLOWED_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'application/msword', // .doc
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
  'image/jpeg',
  'image/png',
  'image/jpg',
];

// 最大文件大小 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 獲取文件
    const file = formData.get('file') as File;
    const purchaseOrderId = formData.get('purchaseOrderId') as string;

    // 驗證必填欄位
    if (!file) {
      return NextResponse.json(
        { error: '請選擇要上傳的文件' },
        { status: 400 }
      );
    }

    if (!purchaseOrderId) {
      return NextResponse.json(
        { error: '缺少採購單 ID' },
        { status: 400 }
      );
    }

    // 驗證文件類型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '不支援的文件類型。請上傳 PDF, Word, Excel 或圖片文件。' },
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

    // 生成唯一文件名
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop();
    const fileName = `invoice_${purchaseOrderId}_${timestamp}.${fileExtension}`;

    // 文件存儲路徑
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件到 public/uploads/invoices/
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'invoices');
    const filePath = join(uploadDir, fileName);

    // 確保目錄存在並寫入文件
    try {
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('文件寫入失敗:', error);
      return NextResponse.json(
        { error: '文件上傳失敗，請稍後再試' },
        { status: 500 }
      );
    }

    // 返回文件路徑
    return NextResponse.json({
      success: true,
      message: '發票上傳成功',
      filePath: `/uploads/invoices/${fileName}`,
      fileName: fileName,
      originalName: file.name,
    });

  } catch (error) {
    console.error('發票上傳錯誤:', error);
    return NextResponse.json(
      { error: '服務器錯誤，請稍後再試' },
      { status: 500 }
    );
  }
}

// 禁用 Next.js 的 body parser
export const config = {
  api: {
    bodyParser: false,
  },
};
