#!/usr/bin/env node

/**
 * 修復所有頁面的麵包屑路由問題
 *
 * 問題: BreadcrumbLink 使用 href 屬性會導致語言環境丟失
 * 解決: 將 BreadcrumbLink 內容改為使用 Link 組件包裹
 *
 * 修復範例:
 * Before:
 *   <BreadcrumbLink href="/dashboard">{tNav('home')}</BreadcrumbLink>
 *
 * After:
 *   <BreadcrumbLink asChild>
 *     <Link href="/dashboard">{tNav('home')}</Link>
 *   </BreadcrumbLink>
 */

const fs = require('fs');
const path = require('path');

// 需要修復的檔案清單
const filesToFix = [
  'apps/web/src/app/[locale]/budget-pools/new/page.tsx',
  'apps/web/src/app/[locale]/budget-pools/page.tsx',
  'apps/web/src/app/[locale]/budget-pools/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/budget-pools/[id]/page.tsx',
  'apps/web/src/app/[locale]/charge-outs/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/expenses/new/page.tsx',
  'apps/web/src/app/[locale]/expenses/page.tsx',
  'apps/web/src/app/[locale]/expenses/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/expenses/[id]/page.tsx',
  'apps/web/src/app/[locale]/projects/new/page.tsx',
  'apps/web/src/app/[locale]/projects/page.tsx',
  'apps/web/src/app/[locale]/projects/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/projects/[id]/page.tsx',
  'apps/web/src/app/[locale]/projects/[id]/quotes/page.tsx',
  'apps/web/src/app/[locale]/proposals/new/page.tsx',
  'apps/web/src/app/[locale]/proposals/page.tsx',
  'apps/web/src/app/[locale]/proposals/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/proposals/[id]/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/new/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/purchase-orders/[id]/page.tsx',
  'apps/web/src/app/[locale]/quotes/new/page.tsx',
  'apps/web/src/app/[locale]/quotes/page.tsx',
  'apps/web/src/app/[locale]/quotes/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/settings/page.tsx',
  'apps/web/src/app/[locale]/users/new/page.tsx',
  'apps/web/src/app/[locale]/users/page.tsx',
  'apps/web/src/app/[locale]/users/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/users/[id]/page.tsx',
  'apps/web/src/app/[locale]/vendors/new/page.tsx',
  'apps/web/src/app/[locale]/vendors/page.tsx',
  'apps/web/src/app/[locale]/vendors/[id]/edit/page.tsx',
  'apps/web/src/app/[locale]/vendors/[id]/page.tsx',
];

let fixedCount = 0;
let skippedCount = 0;

console.log('🔧 開始修復麵包屑路由問題...\n');

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  跳過 (檔案不存在): ${filePath}`);
    skippedCount++;
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  const originalContent = content;

  // 1. 確保有 import Link from "@/i18n/routing"
  const hasLinkImport = /import\s+{\s*Link\s*}\s+from\s+["']@\/i18n\/routing["']/.test(content);

  if (!hasLinkImport) {
    // 找到 next-intl 的 import 行,在其後添加 Link import
    const nextIntlImportMatch = content.match(/import\s+{[^}]+}\s+from\s+['"]next-intl['"];?\n/);
    if (nextIntlImportMatch) {
      const insertPosition = nextIntlImportMatch.index + nextIntlImportMatch[0].length;
      content = content.slice(0, insertPosition) +
                'import { Link } from "@/i18n/routing";\n' +
                content.slice(insertPosition);
    }
  }

  // 2. 替換 BreadcrumbLink href 為 BreadcrumbLink asChild + Link
  // Pattern: <BreadcrumbLink href="/path">content</BreadcrumbLink>
  // Replace with: <BreadcrumbLink asChild><Link href="/path">content</Link></BreadcrumbLink>

  // 2a. 處理模板字串 href={`/${locale}/path`}
  content = content.replace(
    /<BreadcrumbLink\s+href=\{`([^`]+)`\}>((?:(?!<\/BreadcrumbLink>).)*)<\/BreadcrumbLink>/gs,
    (match, href, children) => {
      // 如果已經包含 <Link>,跳過
      if (children.includes('<Link')) {
        return match;
      }
      return `<BreadcrumbLink asChild><Link href={\`${href}\`}>${children}</Link></BreadcrumbLink>`;
    }
  );

  // 2b. 處理普通字串 href="/path"
  content = content.replace(
    /<BreadcrumbLink\s+href=["']([^"']+)["']>([^<]+)<\/BreadcrumbLink>/g,
    '<BreadcrumbLink asChild><Link href="$1">$2</Link></BreadcrumbLink>'
  );

  // 3. 處理有變數的情況 (例如 {tNav('home')})
  content = content.replace(
    /<BreadcrumbLink\s+href=["']([^"']+)["']>(\{[^}]+\})<\/BreadcrumbLink>/g,
    '<BreadcrumbLink asChild><Link href="$1">$2</Link></BreadcrumbLink>'
  );

  // 4. 處理有多個子元素的情況
  content = content.replace(
    /<BreadcrumbLink\s+href=["']([^"']+)["']>((?:.|\n)*?)<\/BreadcrumbLink>/g,
    (match, href, children) => {
      // 如果已經包含 <Link>,跳過
      if (children.includes('<Link')) {
        return match;
      }
      return `<BreadcrumbLink asChild><Link href="${href}">${children}</Link></BreadcrumbLink>`;
    }
  );

  if (content !== originalContent) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ 修復: ${filePath}`);
    fixedCount++;
  } else {
    console.log(`⏭️  跳過 (無需修改): ${filePath}`);
    skippedCount++;
  }
});

console.log(`\n🎉 修復完成!`);
console.log(`   修復: ${fixedCount} 個檔案`);
console.log(`   跳過: ${skippedCount} 個檔案`);
console.log(`   總計: ${filesToFix.length} 個檔案\n`);
