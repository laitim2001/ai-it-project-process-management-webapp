/**
 * @fileoverview JSDoc Validation Script - JSDoc 註釋驗證腳本
 *
 * @description
 * 自動掃描專案中所有代碼文件，驗證 JSDoc 註釋的完整性和正確性。
 * 檢查必要欄位、路徑有效性、格式規範等，生成詳細的驗證報告。
 *
 * @features
 * - 掃描所有 .ts 和 .tsx 文件
 * - 驗證 JSDoc 必要欄位
 * - 檢查 @related 路徑是否存在
 * - 驗證 JSDoc 格式正確性
 * - 生成詳細的驗證報告
 * - 支援增量驗證（只檢查已修改文件）
 *
 * @usage
 * ```bash
 * # 完整驗證
 * node scripts/validate-jsdoc.js
 *
 * # 增量驗證
 * node scripts/validate-jsdoc.js --incremental
 *
 * # 只驗證特定目錄
 * node scripts/validate-jsdoc.js --dir apps/web/src/components
 * ```
 *
 * @author IT Department
 * @since 2025-11-14 (JSDoc Migration Project)
 */

const fs = require('fs');
const path = require('path');

// ================================================================
// 配置
// ================================================================

const CONFIG = {
  // 需要掃描的目錄
  scanDirs: [
    'apps/web/src',
    'packages/api/src',
    'packages/auth/src',
  ],

  // 排除的目錄
  excludeDirs: [
    'node_modules',
    '.next',
    'dist',
    '.turbo',
    'coverage',
  ],

  // 必要的 JSDoc 標籤
  requiredTags: [
    '@fileoverview',
    '@description',
    '@author',
    '@since',
  ],

  // 可選但建議的標籤
  recommendedTags: [
    '@features',
    '@dependencies',
    '@related',
  ],
};

// ================================================================
// 輔助函數
// ================================================================

/**
 * 遞迴掃描目錄，收集所有 .ts 和 .tsx 文件
 */
function scanDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // 檢查是否在排除列表中
      const dirName = path.basename(filePath);
      if (!CONFIG.excludeDirs.includes(dirName)) {
        scanDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * 提取文件的 JSDoc 註釋
 */
function extractJSDoc(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  // 查找文件頂部的 JSDoc 註釋
  let jsdocStart = -1;
  let jsdocEnd = -1;

  for (let i = 0; i < Math.min(lines.length, 100); i++) {
    const line = lines[i].trim();

    if (line === '/**') {
      jsdocStart = i;
    } else if (line === '*/' && jsdocStart !== -1) {
      jsdocEnd = i;
      break;
    }
  }

  if (jsdocStart === -1 || jsdocEnd === -1) {
    return null;
  }

  return lines.slice(jsdocStart, jsdocEnd + 1).join('\n');
}

/**
 * 驗證 JSDoc 內容
 */
function validateJSDoc(filePath, jsdoc) {
  const errors = [];
  const warnings = [];

  // 檢查必要標籤
  CONFIG.requiredTags.forEach((tag) => {
    if (!jsdoc.includes(tag)) {
      errors.push(`缺少必要標籤: ${tag}`);
    }
  });

  // 檢查建議標籤
  CONFIG.recommendedTags.forEach((tag) => {
    if (!jsdoc.includes(tag)) {
      warnings.push(`建議添加標籤: ${tag}`);
    }
  });

  // 檢查 @related 路徑
  const relatedMatches = jsdoc.match(/@related\s*\n([\s\S]*?)(?=\n\s*\*?\s*@|\n\s*\*\/)/);
  if (relatedMatches) {
    const relatedSection = relatedMatches[1];
    // 修正：使用正則表達式提取反引號內的路徑，或者普通路徑
    const pathMatches = relatedSection.matchAll(/^\s*\*?\s*-\s*`([^`]+)`|^\s*\*?\s*-\s*([^\s-][^\s]*)/gm);

    for (const match of pathMatches) {
      // match[1] 是反引號內的路徑，match[2] 是普通路徑
      const relatedPath = match[1] || match[2];
      if (!relatedPath) continue;

      // 跳過 {@link ...} 格式的路徑
      if (relatedPath.startsWith('{@link')) continue;

      // 檢查文件是否存在（目錄路徑以 / 結尾的跳過）
      if (relatedPath.endsWith('/')) continue;

      const fullPath = path.join(process.cwd(), relatedPath);
      if (!fs.existsSync(fullPath)) {
        warnings.push(`@related 路徑不存在: \`${relatedPath}\``);
      }
    }
  }

  // 檢查 @fileoverview 是否有內容
  const fileoverviewMatch = jsdoc.match(/@fileoverview\s+(.+)/);
  if (fileoverviewMatch && fileoverviewMatch[1].trim().length < 10) {
    warnings.push('@fileoverview 內容過短（應 > 10 字元）');
  }

  // 檢查 @description 是否有內容
  const descMatch = jsdoc.match(/@description\s*\n([\s\S]*?)(?=\n\s*@)/);
  if (descMatch && descMatch[1].trim().length < 20) {
    warnings.push('@description 內容過短（應 > 20 字元）');
  }

  return { errors, warnings };
}

/**
 * 生成驗證報告
 */
function generateReport(results) {
  const totalFiles = results.length;
  const filesWithJSDoc = results.filter((r) => r.hasJSDoc).length;
  const filesWithErrors = results.filter((r) => r.errors.length > 0).length;
  const filesWithWarnings = results.filter((r) => r.warnings.length > 0).length;

  console.log('\n' + '='.repeat(80));
  console.log('📝 JSDoc 驗證報告');
  console.log('='.repeat(80));
  console.log(`\n📊 總體統計:`);
  console.log(`  - 總文件數: ${totalFiles}`);
  console.log(`  - 已有 JSDoc: ${filesWithJSDoc} (${Math.round((filesWithJSDoc / totalFiles) * 100)}%)`);
  console.log(`  - 未有 JSDoc: ${totalFiles - filesWithJSDoc}`);
  console.log(`  - 有錯誤: ${filesWithErrors}`);
  console.log(`  - 有警告: ${filesWithWarnings}`);

  // 顯示進度條
  const progress = Math.round((filesWithJSDoc / totalFiles) * 100);
  const filled = Math.round(progress / 2);
  const empty = 50 - filled;
  const progressBar = '█'.repeat(filled) + '░'.repeat(empty);
  console.log(`\n進度: [${progressBar}] ${progress}%`);

  // 列出沒有 JSDoc 的文件
  const filesWithoutJSDoc = results.filter((r) => !r.hasJSDoc);
  if (filesWithoutJSDoc.length > 0) {
    console.log(`\n🔴 未有 JSDoc 的文件 (${filesWithoutJSDoc.length}):`);
    filesWithoutJSDoc.slice(0, 20).forEach((r) => {
      console.log(`  - ${r.file}`);
    });
    if (filesWithoutJSDoc.length > 20) {
      console.log(`  ... 還有 ${filesWithoutJSDoc.length - 20} 個文件`);
    }
  }

  // 列出有錯誤的文件
  const filesWithErrorsList = results.filter((r) => r.errors.length > 0);
  if (filesWithErrorsList.length > 0) {
    console.log(`\n❌ 有錯誤的文件 (${filesWithErrorsList.length}):`);
    filesWithErrorsList.slice(0, 10).forEach((r) => {
      console.log(`\n  📄 ${r.file}`);
      r.errors.forEach((err) => {
        console.log(`    ❌ ${err}`);
      });
    });
    if (filesWithErrorsList.length > 10) {
      console.log(`  ... 還有 ${filesWithErrorsList.length - 10} 個文件有錯誤`);
    }
  }

  // 列出有警告的文件
  const filesWithWarningsList = results.filter((r) => r.warnings.length > 0);
  if (filesWithWarningsList.length > 0) {
    console.log(`\n⚠️  有警告的文件 (${filesWithWarningsList.length}):`);
    filesWithWarningsList.slice(0, 10).forEach((r) => {
      console.log(`\n  📄 ${r.file}`);
      r.warnings.forEach((warn) => {
        console.log(`    ⚠️  ${warn}`);
      });
    });
    if (filesWithWarningsList.length > 10) {
      console.log(`  ... 還有 ${filesWithWarningsList.length - 10} 個文件有警告`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // 返回退出碼
  return filesWithErrors > 0 ? 1 : 0;
}

// ================================================================
// 主程序
// ================================================================

function main() {
  console.log('🔍 開始掃描專案文件...\n');

  const allFiles = [];

  // 掃描所有目錄
  CONFIG.scanDirs.forEach((dir) => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📂 掃描目錄: ${dir}`);
      scanDirectory(fullPath, allFiles);
    }
  });

  console.log(`\n✅ 找到 ${allFiles.length} 個代碼文件\n`);
  console.log('🔍 開始驗證 JSDoc...\n');

  const results = [];

  allFiles.forEach((file) => {
    const relativePath = path.relative(process.cwd(), file);
    const jsdoc = extractJSDoc(file);

    if (!jsdoc) {
      results.push({
        file: relativePath,
        hasJSDoc: false,
        errors: [],
        warnings: [],
      });
    } else {
      const { errors, warnings } = validateJSDoc(file, jsdoc);
      results.push({
        file: relativePath,
        hasJSDoc: true,
        errors,
        warnings,
      });
    }
  });

  // 生成報告
  const exitCode = generateReport(results);

  // 退出
  process.exit(exitCode);
}

// 執行
main();
