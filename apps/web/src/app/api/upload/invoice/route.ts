/**
 * 發票文件上傳 API Route
 *
 * Epic 6 - Story 6.1: 針對採購單記錄發票與費用
 *
 * 功能說明:
 * - 處理發票文件上傳 (PDF, Word, Excel, Images)
 * - 驗證文件類型和大小
 * - 將文件保存到 public/uploads/invoices/
 * - 返回文件路徑供創建費用記錄使用
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
