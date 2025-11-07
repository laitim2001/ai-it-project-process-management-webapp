#!/usr/bin/env node

/**
 * 為缺少 Link import 的檔案添加 import
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/web/src/app/[locale]/expenses/new/page.tsx',
  'apps/web/src/app/[locale]/proposals/new/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/new/page.tsx',
  'apps/web/src/app/[locale]/quotes/new/page.tsx',
  'apps/web/src/app/[locale]/settings/page.tsx',
  'apps/web/src/app/[locale]/users/new/page.tsx',
  'apps/web/src/app/[locale]/vendors/new/page.tsx',
];

let fixedCount = 0;

console.log('🔧 開始添加缺少的 Link import...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  跳過 (檔案不存在): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 檢查是否已有 Link import
  const hasLinkImport = /import\s+{[^}]*Link[^}]*}\s+from\s+["']@\/i18n\/routing["']/.test(content);

  if (hasLinkImport) {
    console.log(`⏭️  跳過 (已有 Link import): ${filePath}`);
    return;
  }

  // 找到 next-intl 的 import 行,在其後添加 Link import
  let nextIntlImportMatch = content.match(/import\s+{[^}]+}\s+from\s+['"]next-intl['"];?\n/);

  if (!nextIntlImportMatch) {
    // 嘗試匹配不同格式
    nextIntlImportMatch = content.match(/import\s+{[^}]+}\s+from\s+['"]next-intl['"]/);
  }

  if (nextIntlImportMatch) {
    const insertPosition = nextIntlImportMatch.index + nextIntlImportMatch[0].length;
    // 如果匹配的字串沒有換行符,添加一個
    const separator = nextIntlImportMatch[0].endsWith('\n') ? '' : '\n';
    content = content.slice(0, insertPosition) +
              separator +
              'import { Link } from "@/i18n/routing";\n' +
              content.slice(insertPosition);

    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 修復: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⚠️  警告: 找不到 next-intl import - ${filePath}`);
  }
});

console.log(`\n🎉 修復完成!`);
console.log(`   修復: ${fixedCount} 個檔案\n`);
