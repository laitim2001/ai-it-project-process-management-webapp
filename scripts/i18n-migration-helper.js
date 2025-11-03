#!/usr/bin/env node
/**
 * i18n 遷移輔助腳本
 *
 * 功能:
 * 1. 掃描文件中的硬編碼繁體中文文字
 * 2. 檢測重複的 import 語句
 * 3. 生成遷移建議
 * 4. 驗證翻譯 key 是否存在
 *
 * 使用方法:
 * node scripts/i18n-migration-helper.js <file-path>
 * node scripts/i18n-migration-helper.js apps/web/src/app/[locale]/projects/[id]/page.tsx
 */

const fs = require('fs');
const path = require('path');

// ==========================================================================
// 配置
// ==========================================================================

const CONFIG = {
  messagesPath: 'apps/web/src/messages',
  chineseRegex: /[\u4e00-\u9fa5]+/g,
  importRegex: /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
  useTranslationsRegex: /const\s+(\w+)\s*=\s*useTranslations\(['"]([^'"]+)['"]\)/g,
};

// ==========================================================================
// 主函數
// ==========================================================================

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('使用方法: node scripts/i18n-migration-helper.js <file-path>');
    console.log('範例: node scripts/i18n-migration-helper.js apps/web/src/app/[locale]/projects/[id]/page.tsx');
    process.exit(1);
  }

  const filePath = args[0];

  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${filePath}`);
    process.exit(1);
  }

  console.log(`\n📊 分析文件: ${filePath}\n`);

  const content = fs.readFileSync(filePath, 'utf-8');

  // 1. 檢測重複 import
  checkDuplicateImports(content);

  // 2. 分析硬編碼中文
  analyzeChineseText(content, filePath);

  // 3. 分析翻譯 hooks 使用
  analyzeTranslationHooks(content);

  console.log('\n✅ 分析完成\n');
}

// ==========================================================================
// 檢測重複 import
// ==========================================================================

function checkDuplicateImports(content) {
  console.log('🔍 檢查重複 import...\n');

  const importCounts = {};
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const match = line.match(/import\s+.*\s+from\s+['"]([^'"]+)['"]/);
    if (match) {
      const importSource = match[1];
      if (!importCounts[importSource]) {
        importCounts[importSource] = [];
      }
      importCounts[importSource].push(index + 1);
    }
  });

  let hasDuplicates = false;
  Object.entries(importCounts).forEach(([source, lineNumbers]) => {
    if (lineNumbers.length > 1) {
      hasDuplicates = true;
      console.log(`⚠️  重複 import: "${source}"`);
      console.log(`   出現在行: ${lineNumbers.join(', ')}`);
      console.log(`   建議: 保留第一個,刪除其他 ${lineNumbers.length - 1} 個\n`);
    }
  });

  if (!hasDuplicates) {
    console.log('✅ 無重複 import\n');
  }
}

// ==========================================================================
// 分析硬編碼中文
// ==========================================================================

function analyzeChineseText(content, filePath) {
  console.log('🔍 分析硬編碼繁體中文...\n');

  const lines = content.split('\n');
  const chineseOccurrences = [];

  lines.forEach((line, index) => {
    // 跳過註釋行
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      return;
    }

    // 跳過 import 行
    if (line.includes('import ')) {
      return;
    }

    const matches = line.match(CONFIG.chineseRegex);
    if (matches) {
      chineseOccurrences.push({
        lineNumber: index + 1,
        line: line.trim(),
        matches: matches,
      });
    }
  });

  if (chineseOccurrences.length === 0) {
    console.log('✅ 無硬編碼中文文字\n');
    return;
  }

  console.log(`⚠️  發現 ${chineseOccurrences.length} 行包含硬編碼中文:\n`);

  // 分組顯示
  const categories = categorizeChineseText(chineseOccurrences);

  Object.entries(categories).forEach(([category, items]) => {
    console.log(`📌 ${category} (${items.length} 處):`);
    items.slice(0, 5).forEach(({ lineNumber, line }) => {
      console.log(`   L${lineNumber}: ${line.substring(0, 80)}${line.length > 80 ? '...' : ''}`);
    });
    if (items.length > 5) {
      console.log(`   ... 還有 ${items.length - 5} 處\n`);
    } else {
      console.log('');
    }
  });
}

function categorizeChineseText(occurrences) {
  const categories = {
    'JSX 內容': [],
    'Toast 訊息': [],
    'Alert/Confirm': [],
    '屬性值': [],
    '其他': [],
  };

  occurrences.forEach((occurrence) => {
    const line = occurrence.line;

    if (line.includes('toast(') || line.includes('title:') || line.includes('description:')) {
      categories['Toast 訊息'].push(occurrence);
    } else if (line.includes('alert(') || line.includes('confirm(')) {
      categories['Alert/Confirm'].push(occurrence);
    } else if (line.includes('placeholder=') || line.includes('title=') || line.includes('aria-label=')) {
      categories['屬性值'].push(occurrence);
    } else if (line.includes('<') || line.includes('>')) {
      categories['JSX 內容'].push(occurrence);
    } else {
      categories['其他'].push(occurrence);
    }
  });

  // 過濾空分類
  Object.keys(categories).forEach((key) => {
    if (categories[key].length === 0) {
      delete categories[key];
    }
  });

  return categories;
}

// ==========================================================================
// 分析翻譯 hooks 使用
// ==========================================================================

function analyzeTranslationHooks(content) {
  console.log('🔍 分析翻譯 hooks 使用...\n');

  const hooks = [];
  let match;
  const regex = new RegExp(CONFIG.useTranslationsRegex);

  while ((match = regex.exec(content)) !== null) {
    hooks.push({
      variable: match[1],
      namespace: match[2],
    });
  }

  if (hooks.length === 0) {
    console.log('⚠️  未使用任何翻譯 hooks');
    console.log('   建議: 添加 `import { useTranslations } from \'next-intl\'`');
    console.log('   並在組件中使用 `const t = useTranslations(\'namespace\')`\n');
    return;
  }

  console.log(`✅ 已使用 ${hooks.length} 個翻譯 hooks:\n`);
  hooks.forEach(({ variable, namespace }) => {
    console.log(`   const ${variable} = useTranslations('${namespace}')`);
  });
  console.log('');

  // 檢查常用 hooks 是否缺失
  const usedNamespaces = hooks.map((h) => h.namespace);
  const recommendedNamespaces = ['common', 'validation', 'toast'];

  const missingNamespaces = recommendedNamespaces.filter((ns) => !usedNamespaces.includes(ns));

  if (missingNamespaces.length > 0) {
    console.log('💡 建議添加常用 hooks:');
    missingNamespaces.forEach((ns) => {
      const varName = ns === 'common' ? 'tCommon' : `t${ns.charAt(0).toUpperCase() + ns.slice(1)}`;
      console.log(`   const ${varName} = useTranslations('${ns}')`);
    });
    console.log('');
  }
}

// ==========================================================================
// 執行
// ==========================================================================

main();
