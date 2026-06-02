/**
 * @fileoverview User Registration API Route - 用戶註冊 API 路由
 *
 * @description
 * Next.js 14 App Router API route 用於處理用戶註冊請求。
 * 實現完整的註冊流程：輸入驗證、重複帳號檢查、密碼加密、創建用戶記錄。
 * 支援 Email/Password 憑證註冊，預設角色為 ProjectManager。
 *
 * @api POST /api/auth/register
 *
 * @features
 * - 伺服器端輸入驗證（Zod schema）
 * - 重複 Email 檢查（數據庫唯一性）
 * - 密碼加密（bcrypt hash，10 輪 salt）
 * - 用戶記錄創建（預設角色 ProjectManager，以 role.name 查詢取得 id）
 * - 詳細錯誤訊息（區分重複帳號、驗證錯誤、系統錯誤）
 *
 * @security
 * - 密碼使用 bcryptjs 加密，不存明文
 * - Email 唯一性約束防止重複註冊
 * - 輸入驗證防止注入攻擊
 * - 錯誤訊息不洩露敏感信息
 *
 * @dependencies
 * - bcryptjs: 密碼加密庫（純 JavaScript 實現，Azure 兼容）
 * - zod: 輸入驗證
 * - @prisma/client: 數據庫操作
 *
 * @related
 * - apps/web/src/app/[locale]/register/page.tsx - 註冊頁面（前端）
 * - apps/web/src/app/[locale]/login/page.tsx - 登入頁面
 * - packages/auth/src/index.ts - NextAuth.js 認證配置
 * - packages/db/prisma/schema.prisma - User model 定義
 *
 * @author IT Department
 * @since Post-MVP Enhancement - User Registration
 * @lastModified 2025-11-21
 */

import { prisma } from '@itpm/db';
import bcrypt from 'bcryptjs';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Force dynamic rendering to avoid build-time Prisma initialization
export const dynamic = 'force-dynamic';

// ========================================
// 🔐 Input Validation Schema
// ========================================

/**
 * 註冊請求驗證 Schema
 *
 * 使用 Zod 進行伺服器端輸入驗證，確保數據符合要求
 */
const registerSchema = z.object({
  name: z.string().min(1, { message: '姓名為必填欄位' }),
  email: z
    .string()
    .min(1, { message: 'Email 為必填欄位' })
    .email({ message: 'Email 格式不正確' }),
  password: z
    .string()
    .min(8, { message: '密碼長度至少 8 個字元' })
    .max(100, { message: '密碼長度不能超過 100 個字元' }),
});

type RegisterInput = z.infer<typeof registerSchema>;

// ========================================
// 🔧 Configuration Constants
// ========================================

/**
 * bcryptjs salt rounds
 * 10 輪是安全性和效能的平衡點
 */
const BCRYPT_SALT_ROUNDS = 10;

/**
 * 新註冊用戶的預設角色名稱
 * 以 role.name 查詢實際 id（最小權限原則），避免硬編碼 roleId —
 * Role.id 為 autoincrement，數值會隨 seed 順序/環境而異。
 */
const DEFAULT_ROLE_NAME = 'ProjectManager';

// ========================================
// 📡 API Route Handler
// ========================================

/**
 * POST /api/auth/register
 *
 * 處理用戶註冊請求
 *
 * @param request - Next.js Request 物件
 * @returns JSON response with user data or error
 *
 * @example
 * Request Body:
 * {
 *   "name": "張三",
 *   "email": "zhang.san@example.com",
 *   "password": "SecurePassword123"
 * }
 *
 * Success Response (201):
 * {
 *   "success": true,
 *   "message": "註冊成功",
 *   "user": {
 *     "id": "uuid",
 *     "name": "張三",
 *     "email": "zhang.san@example.com"
 *   }
 * }
 *
 * Error Response (400):
 * {
 *   "success": false,
 *   "error": "此 Email 已被註冊"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // Step 1: Parse and Validate Input
    // ========================================
    const body = await request.json();

    // Validate with Zod schema
    const validationResult = registerSchema.safeParse(body);

    if (!validationResult.success) {
      // 返回驗證錯誤（第一個錯誤訊息）
      const firstError = validationResult.error.errors[0];
      return NextResponse.json(
        {
          success: false,
          error: firstError?.message || '輸入驗證失敗',
        },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.data;

    // ========================================
    // Step 2: Check for Duplicate Email
    // ========================================
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }, // 只查詢 ID，提高效能
    });

    if (existingUser) {
      return NextResponse.json(
        {
          success: false,
          error: '此 Email 已被註冊',
        },
        { status: 400 }
      );
    }

    // ========================================
    // Step 3: Hash Password
    // ========================================
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    // ========================================
    // Step 4: Resolve Default Role (ProjectManager)
    // ========================================
    // 以 role.name 查詢預設角色 id（最小權限），避免硬編碼數值
    const defaultRole = await prisma.role.findUnique({
      where: { name: DEFAULT_ROLE_NAME },
      select: { id: true },
    });

    if (!defaultRole) {
      console.error(`❌ 註冊錯誤: 預設角色 ${DEFAULT_ROLE_NAME} 不存在，請先執行資料庫 seed`);
      return NextResponse.json(
        {
          success: false,
          error: '註冊失敗，請稍後再試',
        },
        { status: 500 }
      );
    }

    // ========================================
    // Step 5: Create User Record
    // ========================================
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        roleId: defaultRole.id, // 預設為 ProjectManager（最小權限）
      },
      select: {
        id: true,
        name: true,
        email: true,
        roleId: true,
        createdAt: true,
      },
    });

    // ========================================
    // Step 6: Return Success Response
    // ========================================
    return NextResponse.json(
      {
        success: true,
        message: '註冊成功',
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
        },
      },
      { status: 201 } // 201 Created
    );
  } catch (error) {
    // ========================================
    // Error Handling
    // ========================================
    console.error('❌ 註冊錯誤:', error);

    // 詳細的錯誤日誌記錄（用於 Azure 診斷）
    if (error instanceof Error) {
      console.error('錯誤類型:', error.constructor.name);
      console.error('錯誤訊息:', error.message);
      console.error('錯誤堆疊:', error.stack);
    } else {
      console.error('未知錯誤類型:', typeof error);
      console.error('錯誤值:', JSON.stringify(error, null, 2));
    }

    // 檢查是否為 Prisma 唯一性約束錯誤（防禦性檢查）
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json(
        {
          success: false,
          error: '此 Email 已被註冊',
        },
        { status: 400 }
      );
    }

    // 返回通用錯誤訊息（不洩露系統細節）
    return NextResponse.json(
      {
        success: false,
        error: '註冊失敗，請稍後再試',
      },
      { status: 500 }
    );
  }
}
