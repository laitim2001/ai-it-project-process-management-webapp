#!/usr/bin/env node
/**
 * FEAT-002: Manually execute BudgetPool currency migration
 * This script runs the SQL migration to add currencyId to BudgetPool
 */

const { PrismaClient } = require('../packages/db/node_modules/@prisma/client');
const fs = require('fs');
const path = require('path');

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL || 'postgresql://postgres:localdev123@localhost:5434/itpm_dev'
      }
    }
  });

  try {
    console.log('🔄 Starting FEAT-002 migration...\n');

    // Step 1: Check if Currency table has TWD
    const twdCurrency = await prisma.$queryRaw`
      SELECT id FROM "Currency" WHERE code = 'TWD' LIMIT 1
    `;

    if (!twdCurrency || twdCurrency.length === 0) {
      throw new Error('❌ TWD currency not found! Please ensure Currency table has TWD record.');
    }

    const twdId = twdCurrency[0].id;
    console.log(`✅ Found TWD currency: ${twdId}`);

    // Step 2: Check if currencyId column already exists
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'BudgetPool' AND column_name = 'currencyId'
    `;

    if (columnCheck && columnCheck.length > 0) {
      console.log('⚠️  currencyId column already exists in BudgetPool');

      // Check if there are any NULL values
      const nullCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM "BudgetPool" WHERE "currencyId" IS NULL
      `;

      if (nullCount[0].count > 0) {
        console.log(`🔄 Updating ${nullCount[0].count} NULL currencyId values to TWD...`);
        await prisma.$executeRaw`
          UPDATE "BudgetPool"
          SET "currencyId" = ${twdId}
          WHERE "currencyId" IS NULL
        `;
        console.log('✅ NULL values updated');
      } else {
        console.log('✅ All BudgetPool records have currencyId');
      }

      await prisma.$disconnect();
      console.log('\n✅ Migration check complete!');
      return;
    }

    // Step 3: Add currencyId column (nullable)
    console.log('\n📝 Step 1: Adding currencyId column...');
    await prisma.$executeRaw`
      ALTER TABLE "BudgetPool" ADD COLUMN "currencyId" TEXT
    `;
    console.log('✅ Column added');

    // Step 4: Count existing records
    const budgetPoolCount = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM "BudgetPool"
    `;
    console.log(`\n📊 Found ${budgetPoolCount[0].count} existing BudgetPool records`);

    // Step 5: Update all existing records to TWD
    console.log('\n📝 Step 2: Setting all existing records to TWD...');
    await prisma.$executeRaw`
      UPDATE "BudgetPool"
      SET "currencyId" = ${twdId}
      WHERE "currencyId" IS NULL
    `;
    console.log('✅ All records updated to TWD');

    // Step 6: Make currencyId NOT NULL
    console.log('\n📝 Step 3: Making currencyId NOT NULL...');
    await prisma.$executeRaw`
      ALTER TABLE "BudgetPool" ALTER COLUMN "currencyId" SET NOT NULL
    `;
    console.log('✅ Column set to NOT NULL');

    // Step 7: Add foreign key constraint
    console.log('\n📝 Step 4: Adding foreign key constraint...');
    await prisma.$executeRaw`
      ALTER TABLE "BudgetPool" ADD CONSTRAINT "BudgetPool_currencyId_fkey"
        FOREIGN KEY ("currencyId") REFERENCES "Currency"("id")
        ON DELETE RESTRICT ON UPDATE CASCADE
    `;
    console.log('✅ Foreign key added');

    // Step 8: Create index
    console.log('\n📝 Step 5: Creating index...');
    await prisma.$executeRaw`
      CREATE INDEX "BudgetPool_currencyId_idx" ON "BudgetPool"("currencyId")
    `;
    console.log('✅ Index created');

    // Step 9: Verify migration
    console.log('\n🔍 Verifying migration...');
    const verifyResult = await prisma.$queryRaw`
      SELECT COUNT(*) as total,
             COUNT("currencyId") as with_currency
      FROM "BudgetPool"
    `;
    console.log(`✅ Verification: ${verifyResult[0].with_currency}/${verifyResult[0].total} records have currencyId`);

    await prisma.$disconnect();
    console.log('\n✅ FEAT-002 migration completed successfully! 🎉');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
