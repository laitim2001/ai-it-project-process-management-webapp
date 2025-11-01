/**
 * 報價單文件上傳 API Route
 *
 * Epic 5 - Story 5.2: 為已批准的專案上傳並關聯報價單
 *
 * 功能說明:
 * - 處理報價單文件上傳 (PDF, Word, Excel)
 * - 驗證文件類型和大小
 * - 將文件保存到 public/uploads/quotes/
 * - 調用 tRPC API 創建報價記錄
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { prisma } from '@itpm/db';

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
    const fileName = `quote_${projectId}_${vendorId}_${timestamp}.${fileExtension}`;

    // 文件存儲路徑
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 保存文件到 public/uploads/quotes/
    const uploadDir = join(process.cwd(), 'apps', 'web', 'public', 'uploads', 'quotes');
    const filePath = join(uploadDir, fileName);

    // 確保目錄存在
    try {
      if (!existsSync(uploadDir)) {
        await mkdir(uploadDir, { recursive: true });
      }
      await writeFile(filePath, buffer);
    } catch (error) {
      console.error('文件寫入失敗:', error);
      return NextResponse.json(
        { error: `文件上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}` },
        { status: 500 }
      );
    }

    // 創建報價記錄
    const quote = await prisma.quote.create({
      data: {
        projectId,
        vendorId,
        amount: parseFloat(amount),
        filePath: `/uploads/quotes/${fileName}`,
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

// 禁用 Next.js 的 body parser，讓我們手動處理文件上傳
export const config = {
  api: {
    bodyParser: false,
  },
};
