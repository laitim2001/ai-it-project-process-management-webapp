#!/usr/bin/env node
/**
 * 檢查重複 import 語句
 *
 * 掃描所有 .tsx 和 .ts 文件,找出重複的 import 語句
 *
 * 使用方法:
 * node scripts/check-duplicate-imports.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 掃描重複 import 語句...\n');

// 使用 grep 找出所有包含 useTranslations import 的文件
const grepCommand = `grep -r "import { useTranslations } from 'next-intl'" apps/web/src --include="*.tsx" -l`;

try {
  const output = execSync(grepCommand, { encoding: 'utf-8' });
  const files = output.trim().split('\n').filter(Boolean);

  console.log(`📁 找到 ${files.length} 個文件包含 useTranslations import\n`);

  const filesWithDuplicates = [];

  files.forEach((filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    const importLines = [];
    lines.forEach((line, index) => {
      if (line.includes("import { useTranslations } from 'next-intl'")) {
        importLines.push(index + 1);
      }
    });

    if (importLines.length > 1) {
      filesWithDuplicates.push({
        filePath,
        count: importLines.length,
        lines: importLines,
      });
    }
  });

  if (filesWithDuplicates.length === 0) {
    console.log('✅ 所有文件都沒有重複 import!');
  } else {
    console.log(`⚠️  發現 ${filesWithDuplicates.length} 個文件有重複 import:\n`);

    filesWithDuplicates.forEach(({ filePath, count, lines }) => {
      const relativePath = filePath.replace(/\\/g, '/');
      console.log(`❌ ${relativePath}`);
      console.log(`   重複次數: ${count}`);
      console.log(`   出現在行: ${lines.join(', ')}`);
      console.log('');
    });

    console.log('💡 修復方法:');
    console.log('   1. 打開文件');
    console.log('   2. 保留第一個 import { useTranslations } from \'next-intl\'');
    console.log('   3. 刪除其他所有重複的 import');
    console.log('');

    process.exit(1);
  }
} catch (error) {
  if (error.status === 1) {
    // grep 沒有找到匹配的文件
    console.log('✅ 沒有文件使用 useTranslations import');
  } else {
    console.error('錯誤:', error.message);
    process.exit(1);
  }
}
