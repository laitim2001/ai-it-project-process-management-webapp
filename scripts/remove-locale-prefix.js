#!/usr/bin/env node

/**
 * 移除 Link href 中的 /${locale}/ 前綴
 *
 * next-intl 的 Link 組件會自動添加 locale 前綴,
 * 所以我們不需要手動添加 /${locale}/
 *
 * Before: <Link href={`/${locale}/dashboard`}>
 * After:  <Link href="/dashboard">
 */

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'apps/web/src/app/[locale]/budget-pools/new/page.tsx',
  'apps/web/src/app/[locale]/expenses/new/page.tsx',
  'apps/web/src/app/[locale]/projects/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/projects/[id]/page.tsx',
  'apps/web/src/app/[locale]/proposals/new/page.tsx',
  'apps/web/src/app/[locale]/proposals/[id]/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/new/page.tsx',
  'apps/web/src/app/[locale]/quotes/new/page.tsx',
  'apps/web/src/app/[locale]/vendors/new/page.tsx',
];

let fixedCount = 0;

console.log('🔧 開始移除 locale 前綴...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  跳過 (檔案不存在): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 1. 移除 href={`/${locale}/path`} 中的 /${locale}/
  content = content.replace(/href=\{`\/\$\{locale\}\/([^`]+)`\}/g, 'href="/$1"');

  // 2. 移除 useParams 和 locale 變數(如果只用於 breadcrumb)
  //    檢查 locale 是否只在 href 中使用
  const localeUsageCount = (content.match(/\$\{locale\}/g) || []).length;
  if (localeUsageCount === 0) {
    // 移除 const locale = params.locale as string;
    content = content.replace(/\s*const locale = params\.locale as string;\n/, '');
  }

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 修復: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⏭️  跳過 (無需修改): ${filePath}`);
  }
});

console.log(`\n🎉 修復完成!`);
console.log(`   修復: ${fixedCount} 個檔案\n`);
