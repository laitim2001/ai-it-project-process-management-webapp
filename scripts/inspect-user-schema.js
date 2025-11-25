#!/usr/bin/env node

/**
 * 檢查 Azure PostgreSQL User 表的實際架構
 */

// 從 packages/db 導入 Prisma Client (monorepo 結構)
const { prisma } = require('../packages/db');

async function inspectUserSchema() {
  try {
    console.log('🔍 正在檢查 User 表的實際架構...\n');
    console.log('📋 資料庫連接:', process.env.DATABASE_URL?.substring(0, 50) + '...\n');

    // 查詢 User 表的欄位定義
    const columns = await prisma.$queryRaw`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'User'
      ORDER BY ordinal_position;
    `;

    console.log('📊 User 表的欄位定義:\n');
    console.log('欄位名稱'.padEnd(20), '資料類型'.padEnd(25), '可為空'.padEnd(10), '預設值');
    console.log('='.repeat(80));

    columns.forEach(col => {
      console.log(
        col.column_name.padEnd(20),
        `${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''}`.padEnd(25),
        col.is_nullable.padEnd(10),
        col.column_default || '(無)'
      );
    });

    console.log('\n✅ 共 ' + columns.length + ' 個欄位\n');

    // 檢查 Prisma schema 中定義的關鍵欄位
    const prismaSchemaFields = [
      'id',
      'email',
      'emailVerified',
      'name',
      'image',
      'password',
      'roleId',
      'createdAt',
      'updatedAt'
    ];

    console.log('🔍 Prisma Schema 中定義的欄位對比:\n');
    prismaSchemaFields.forEach(field => {
      const exists = columns.some(col => col.column_name === field);
      const status = exists ? '✅' : '❌';
      console.log(`${status} ${field}`);
    });

    console.log('\n');

  } catch (error) {
    console.error('❌ 錯誤:', error.message);
    if (error.code) {
      console.error('錯誤代碼:', error.code);
    }
    console.error('\n完整錯誤:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

inspectUserSchema();
