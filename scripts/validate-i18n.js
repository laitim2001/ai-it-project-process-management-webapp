#!/usr/bin/env node

/**
 * I18N 翻譯文件驗證工具
 *
 * 功能:
 * 1. 檢查 JSON 語法正確性
 * 2. 檢測重複的鍵名
 * 3. 驗證多語言文件的鍵一致性
 * 4. 檢查翻譯值的完整性
 *
 * 使用方式:
 *   node scripts/validate-i18n.js
 *   pnpm validate:i18n
 */

const fs = require('fs');
const path = require('path');

// 配置
const MESSAGES_DIR = path.join(__dirname, '../apps/web/src/messages');
const LOCALES = ['en', 'zh-TW'];

// ANSI 顏色碼
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

let hasErrors = false;
let hasWarnings = false;

/**
 * 打印帶顏色的消息
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * 檢查 JSON 文件中的重複鍵
 */
function checkDuplicateKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const keyMap = new Map();
  const duplicates = [];

  let currentPath = [];
  let lineNumber = 0;

  for (const line of lines) {
    lineNumber++;
    const match = line.match(/^\s*"([^"]+)"\s*:/);

    if (match) {
      const key = match[1];
      const indent = line.match(/^\s*/)[0].length;

      // 計算當前層級
      while (currentPath.length > 0 && currentPath[currentPath.length - 1].indent >= indent) {
        currentPath.pop();
      }

      const fullKey = [...currentPath.map(p => p.key), key].join('.');

      if (keyMap.has(fullKey)) {
        duplicates.push({
          key: fullKey,
          firstLine: keyMap.get(fullKey),
          secondLine: lineNumber,
        });
      } else {
        keyMap.set(fullKey, lineNumber);
      }

      // 檢查是否是對象開始
      if (line.includes('{')) {
        currentPath.push({ key, indent });
      }
    }
  }

  return duplicates;
}

/**
 * 遞歸獲取所有鍵路徑
 */
function getAllKeys(obj, prefix = '') {
  const keys = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      keys.push(...getAllKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

/**
 * 驗證 JSON 語法
 */
function validateJsonSyntax(filePath, locale) {
  log(`\n檢查 ${locale}.json 的 JSON 語法...`, 'cyan');

  try {
    const content = fs.readFileSync(filePath, 'utf8');
    JSON.parse(content);
    log('  ✅ JSON 語法正確', 'green');
    return true;
  } catch (error) {
    log(`  ❌ JSON 語法錯誤: ${error.message}`, 'red');
    hasErrors = true;
    return false;
  }
}

/**
 * 檢測重複鍵
 */
function validateDuplicateKeys(filePath, locale) {
  log(`\n檢查 ${locale}.json 的重複鍵...`, 'cyan');

  const duplicates = checkDuplicateKeys(filePath);

  if (duplicates.length === 0) {
    log('  ✅ 沒有發現重複鍵', 'green');
    return true;
  }

  log(`  ❌ 發現 ${duplicates.length} 個重複鍵:`, 'red');
  duplicates.forEach(({ key, firstLine, secondLine }) => {
    log(`    - "${key}"`, 'red');
    log(`      第一次出現: 第 ${firstLine} 行`, 'yellow');
    log(`      重複出現: 第 ${secondLine} 行`, 'yellow');
  });

  hasErrors = true;
  return false;
}

/**
 * 檢查空值
 */
function validateEmptyValues(data, locale, prefix = '') {
  log(`\n檢查 ${locale}.json 的空值...`, 'cyan');

  const emptyKeys = [];

  function checkEmpty(obj, path = '') {
    for (const [key, value] of Object.entries(obj)) {
      const fullPath = path ? `${path}.${key}` : key;

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        checkEmpty(value, fullPath);
      } else if (value === '' || value === null || value === undefined) {
        emptyKeys.push(fullPath);
      }
    }
  }

  checkEmpty(data);

  if (emptyKeys.length === 0) {
    log('  ✅ 沒有發現空值', 'green');
    return true;
  }

  log(`  ⚠️  發現 ${emptyKeys.length} 個空值:`, 'yellow');
  emptyKeys.forEach(key => {
    log(`    - ${key}`, 'yellow');
  });

  hasWarnings = true;
  return false;
}

/**
 * 比較兩個語言文件的鍵一致性
 */
function compareLocales(baseData, compareData, baseLocale, compareLocale) {
  log(`\n比較 ${baseLocale}.json 和 ${compareLocale}.json 的鍵一致性...`, 'cyan');

  const baseKeys = new Set(getAllKeys(baseData));
  const compareKeys = new Set(getAllKeys(compareData));

  const missingInCompare = [...baseKeys].filter(key => !compareKeys.has(key));
  const extraInCompare = [...compareKeys].filter(key => !baseKeys.has(key));

  let hasIssues = false;

  if (missingInCompare.length > 0) {
    log(`  ⚠️  ${compareLocale}.json 缺少 ${missingInCompare.length} 個鍵:`, 'yellow');
    missingInCompare.slice(0, 10).forEach(key => {
      log(`    - ${key}`, 'yellow');
    });
    if (missingInCompare.length > 10) {
      log(`    ... 還有 ${missingInCompare.length - 10} 個`, 'yellow');
    }
    hasIssues = true;
    hasWarnings = true;
  }

  if (extraInCompare.length > 0) {
    log(`  ⚠️  ${compareLocale}.json 多出 ${extraInCompare.length} 個鍵:`, 'yellow');
    extraInCompare.slice(0, 10).forEach(key => {
      log(`    - ${key}`, 'yellow');
    });
    if (extraInCompare.length > 10) {
      log(`    ... 還有 ${extraInCompare.length - 10} 個`, 'yellow');
    }
    hasIssues = true;
    hasWarnings = true;
  }

  if (!hasIssues) {
    log(`  ✅ 鍵結構完全一致 (${baseKeys.size} 個鍵)`, 'green');
  }

  return !hasIssues;
}

/**
 * 主驗證函數
 */
function main() {
  log('\n═══════════════════════════════════════════════════', 'blue');
  log('   I18N 翻譯文件驗證工具', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');

  const localeData = {};

  // 第一階段: 驗證每個文件
  for (const locale of LOCALES) {
    const filePath = path.join(MESSAGES_DIR, `${locale}.json`);

    if (!fs.existsSync(filePath)) {
      log(`\n❌ 找不到文件: ${filePath}`, 'red');
      hasErrors = true;
      continue;
    }

    // 驗證 JSON 語法
    if (!validateJsonSyntax(filePath, locale)) {
      continue; // 如果語法錯誤,跳過後續檢查
    }

    // 載入數據
    const content = fs.readFileSync(filePath, 'utf8');
    localeData[locale] = JSON.parse(content);

    // 檢測重複鍵
    validateDuplicateKeys(filePath, locale);

    // 檢查空值
    validateEmptyValues(localeData[locale], locale);
  }

  // 第二階段: 比較語言文件
  if (localeData['en'] && localeData['zh-TW']) {
    compareLocales(localeData['en'], localeData['zh-TW'], 'en', 'zh-TW');
  }

  // 最終報告
  log('\n═══════════════════════════════════════════════════', 'blue');

  if (!hasErrors && !hasWarnings) {
    log('✅ 所有檢查通過!翻譯文件完全正確。', 'green');
    log('═══════════════════════════════════════════════════\n', 'blue');
    process.exit(0);
  } else if (hasErrors) {
    log('❌ 發現嚴重錯誤!請修復後再提交。', 'red');
    log('═══════════════════════════════════════════════════\n', 'blue');
    process.exit(1);
  } else {
    log('⚠️  發現警告,建議修復。', 'yellow');
    log('═══════════════════════════════════════════════════\n', 'blue');
    process.exit(0); // 警告不阻止提交
  }
}

// 執行
main();
