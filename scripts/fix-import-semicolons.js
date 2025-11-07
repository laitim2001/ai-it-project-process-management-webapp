#!/usr/bin/env node

/**
 * 修復 import 語句的分號問題
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/web/src/app/[locale]/proposals/new/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/new/page.tsx',
  'apps/web/src/app/[locale]/quotes/new/page.tsx',
  'apps/web/src/app/[locale]/settings/page.tsx',
  'apps/web/src/app/[locale]/users/new/page.tsx',
  'apps/web/src/app/[locale]/vendors/new/page.tsx',
];

let fixedCount = 0;

console.log('🔧 開始修復 import 分號問題...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  跳過 (檔案不存在): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 修復模式：next-intl import 沒有分號 + Link import + 多餘分號
  content = content.replace(
    /import { useTranslations } from 'next-intl'\nimport { Link } from "@\/i18n\/routing";\n;/g,
    `import { useTranslations } from 'next-intl';\nimport { Link } from "@/i18n/routing";`
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 修復: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⏭️  跳過 (無需修復): ${filePath}`);
  }
});

console.log(`\n🎉 修復完成!`);
console.log(`   修復: ${fixedCount} 個檔案\n`);
