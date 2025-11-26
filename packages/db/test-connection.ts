/**
 * 測試資料庫連線
 */
import { PrismaClient } from '@prisma/client';

async function testConnection() {
  console.log('🔗 Testing database connection...');
  console.log(
    'DATABASE_URL:',
    process.env.DATABASE_URL?.substring(0, 50) + '...'
  );

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    // Test basic connection
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Connection successful!', result);

    // Check Role table
    const roles = await prisma.role.findMany();
    console.log('📋 Roles in database:', roles);

    if (roles.length === 0) {
      console.log(
        '⚠️  Role table is empty - this is the root cause of registration failure!'
      );
    }
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
