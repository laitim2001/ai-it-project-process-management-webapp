/**
 * @fileoverview Admin Seed API Route - 管理員種子資料 API
 *
 * @description
 * 用於在 Azure 環境中執行基礎種子資料（Role, Currency）的 API endpoint。
 * 此 API 僅供管理員使用，用於初始化或修復資料庫基礎資料。
 *
 * @api POST /api/admin/seed
 *
 * @security
 * - 需要提供 ADMIN_SEED_SECRET 環境變數作為驗證
 * - 生產環境應在執行後移除或禁用此 endpoint
 *
 * @author IT Department
 * @since 2025-11-25
 */

import { prisma } from '@itpm/db';
import { type NextRequest, NextResponse } from 'next/server';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * 基礎角色資料
 */
const ROLES = [
  { id: 1, name: 'ProjectManager' },
  { id: 2, name: 'Supervisor' },
  { id: 3, name: 'Admin' },
];

/**
 * 基礎貨幣資料
 */
const CURRENCIES = [
  { code: 'TWD', name: '新台幣', symbol: 'NT$', active: true },
  { code: 'USD', name: '美元', symbol: '$', active: true },
  { code: 'CNY', name: '人民幣', symbol: '¥', active: true },
  { code: 'HKD', name: '港幣', symbol: 'HK$', active: true },
  { code: 'JPY', name: '日圓', symbol: '¥', active: true },
  { code: 'EUR', name: '歐元', symbol: '€', active: true },
];

/**
 * GET /api/admin/seed
 * 檢查目前的 seed 狀態
 */
export async function GET(request: NextRequest) {
  try {
    // 檢查 Role 表
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' },
    });

    // 檢查 Currency 表
    const currencies = await prisma.currency.findMany({
      orderBy: { code: 'asc' },
    });

    return NextResponse.json({
      success: true,
      message: 'Seed 狀態檢查完成',
      data: {
        roles: {
          count: roles.length,
          items: roles,
          hasProjectManager: roles.some(
            (r) => r.id === 1 && r.name === 'ProjectManager'
          ),
        },
        currencies: {
          count: currencies.length,
          items: currencies.map((c) => ({ code: c.code, name: c.name })),
        },
        seedRequired: roles.length === 0,
      },
    });
  } catch (error) {
    console.error('❌ Seed 狀態檢查失敗:', error);

    return NextResponse.json(
      {
        success: false,
        error: '狀態檢查失敗',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/seed
 * 執行基礎種子資料
 */
export async function POST(request: NextRequest) {
  try {
    // ========================================
    // 安全驗證
    // ========================================
    const authHeader = request.headers.get('Authorization');
    const expectedSecret =
      process.env.ADMIN_SEED_SECRET || process.env.NEXTAUTH_SECRET;

    if (!expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          error: '伺服器配置錯誤：缺少驗證密鑰',
        },
        { status: 500 }
      );
    }

    // 驗證 Bearer token
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          error: '缺少授權標頭',
          hint: '請提供 Authorization: Bearer <secret>',
        },
        { status: 401 }
      );
    }

    const providedSecret = authHeader.substring(7);
    if (providedSecret !== expectedSecret) {
      return NextResponse.json(
        {
          success: false,
          error: '授權失敗',
        },
        { status: 403 }
      );
    }

    // ========================================
    // 執行 Seed
    // ========================================
    const results = {
      roles: { created: 0, updated: 0, errors: [] as string[] },
      currencies: { created: 0, updated: 0, errors: [] as string[] },
    };

    // Seed Roles
    console.log('🌱 開始 Seed Roles...');
    for (const role of ROLES) {
      try {
        await prisma.role.upsert({
          where: { id: role.id },
          update: { name: role.name },
          create: { id: role.id, name: role.name },
        });
        results.roles.created++;
        console.log(`  ✅ Role: ${role.name} (ID: ${role.id})`);
      } catch (err) {
        const errMsg = `Role ${role.name}: ${err instanceof Error ? err.message : String(err)}`;
        results.roles.errors.push(errMsg);
        console.error(`  ❌ ${errMsg}`);
      }
    }

    // Seed Currencies
    console.log('🌱 開始 Seed Currencies...');
    for (const currency of CURRENCIES) {
      try {
        await prisma.currency.upsert({
          where: { code: currency.code },
          update: {
            name: currency.name,
            symbol: currency.symbol,
            active: currency.active,
          },
          create: {
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            active: currency.active,
          },
        });
        results.currencies.created++;
        console.log(`  ✅ Currency: ${currency.code} (${currency.name})`);
      } catch (err) {
        const errMsg = `Currency ${currency.code}: ${err instanceof Error ? err.message : String(err)}`;
        results.currencies.errors.push(errMsg);
        console.error(`  ❌ ${errMsg}`);
      }
    }

    // ========================================
    // 驗證結果
    // ========================================
    const finalRoles = await prisma.role.findMany();
    const finalCurrencies = await prisma.currency.findMany();

    const hasErrors =
      results.roles.errors.length > 0 || results.currencies.errors.length > 0;

    console.log('🎉 Seed 完成！');
    console.log(`  Roles: ${finalRoles.length} 個`);
    console.log(`  Currencies: ${finalCurrencies.length} 個`);

    return NextResponse.json({
      success: !hasErrors,
      message: hasErrors ? 'Seed 完成但有錯誤' : 'Seed 成功完成',
      results: {
        roles: {
          processed: results.roles.created,
          total: finalRoles.length,
          errors: results.roles.errors,
        },
        currencies: {
          processed: results.currencies.created,
          total: finalCurrencies.length,
          errors: results.currencies.errors,
        },
      },
      verification: {
        hasProjectManagerRole: finalRoles.some(
          (r) => r.id === 1 && r.name === 'ProjectManager'
        ),
        roleCount: finalRoles.length,
        currencyCount: finalCurrencies.length,
      },
    });
  } catch (error) {
    console.error('❌ Seed 執行失敗:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Seed 執行失敗',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
