/**
 * API Route: 提案文件上傳
 *
 * 功能：
 * - 上傳項目計劃書文件 (PDF/PPT/Word)
 * - 文件驗證 (類型、大小)
 * - 保存到服務器文件系統
 * - 返回文件路徑供前端更新數據庫
 */

import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

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
    const fileName = `proposal_${proposalId}_${timestamp}.${fileExtension}`;

    // 確保上傳目錄存在
    const uploadDir = join(process.cwd(), 'public', 'uploads', 'proposals');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // 將文件保存到磁盤
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // 返回文件路徑（用於前端更新數據庫）
    return NextResponse.json({
      success: true,
      filePath: `/uploads/proposals/${fileName}`,
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
