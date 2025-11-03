#!/usr/bin/env node
/**
 * i18n 範圍分析腳本
 *
 * 功能：
 * 1. 掃描所有 TSX 文件
 * 2. 識別硬編碼的中文字符串
 * 3. 分類文本類型（UI文本、錯誤訊息、註釋等）
 * 4. 統計每個文件的翻譯工作量
 * 5. 生成詳細的分析報告
 */

const fs = require('fs');
const path = require('path');

// 配置
const SCAN_DIRS = [
  'apps/web/src/app',
  'apps/web/src/components',
];

const OUTPUT_FILE = 'claudedocs/I18N-IMPACT-ANALYSIS.md';

// 統計數據
const stats = {
  totalFiles: 0,
  filesWithChinese: 0,
  totalChineseStrings: 0,
  fileDetails: [],
  textTypes: {
    uiText: 0,          // UI 顯示文本
    errorMessages: 0,   // 錯誤訊息
    validation: 0,      // 表單驗證
    comments: 0,        // 註釋
    console: 0,         // console.log
  },
  complexity: {
    simple: 0,      // < 10 個字符串
    moderate: 0,    // 10-30 個字符串
    complex: 0,     // > 30 個字符串
  }
};

// 中文正則
const CHINESE_REGEX = /[\u4e00-\u9fff]+/g;

// 掃描文件
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');

  const fileInfo = {
    path: filePath.replace(/\\/g, '/').replace(/^.*\/apps\/web\/src\//, ''),
    chineseStrings: [],
    lineNumbers: [],
    types: {
      uiText: 0,
      errorMessages: 0,
      validation: 0,
      comments: 0,
      console: 0,
    }
  };

  lines.forEach((line, index) => {
    // 跳過註釋行
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
      const matches = line.match(CHINESE_REGEX);
      if (matches) {
        fileInfo.types.comments += matches.length;
        stats.textTypes.comments += matches.length;
      }
      return;
    }

    // 檢查中文字符串
    const matches = line.match(CHINESE_REGEX);
    if (matches) {
      matches.forEach(match => {
        fileInfo.chineseStrings.push({
          text: match,
          line: index + 1,
          context: line.trim()
        });

        // 分類
        if (line.includes('console.')) {
          fileInfo.types.console++;
          stats.textTypes.console++;
        } else if (line.includes('error') || line.includes('Error') || line.includes('錯誤')) {
          fileInfo.types.errorMessages++;
          stats.textTypes.errorMessages++;
        } else if (line.includes('validation') || line.includes('required') || line.includes('請輸入') || line.includes('必須')) {
          fileInfo.types.validation++;
          stats.textTypes.validation++;
        } else {
          fileInfo.types.uiText++;
          stats.textTypes.uiText++;
        }
      });
    }
  });

  if (fileInfo.chineseStrings.length > 0) {
    stats.filesWithChinese++;
    stats.totalChineseStrings += fileInfo.chineseStrings.length;

    // 評估複雜度
    if (fileInfo.chineseStrings.length < 10) {
      fileInfo.complexity = 'simple';
      stats.complexity.simple++;
    } else if (fileInfo.chineseStrings.length <= 30) {
      fileInfo.complexity = 'moderate';
      stats.complexity.moderate++;
    } else {
      fileInfo.complexity = 'complex';
      stats.complexity.complex++;
    }

    stats.fileDetails.push(fileInfo);
  }

  stats.totalFiles++;
}

// 遞迴掃描目錄
function scanDirectory(dir) {
  const items = fs.readdirSync(dir);

  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      scanDirectory(fullPath);
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      scanFile(fullPath);
    }
  });
}

// 生成 Markdown 報告
function generateReport() {
  const report = [];

  report.push('# i18n 影響範圍分析報告\n');
  report.push(`> **生成時間**: ${new Date().toLocaleString('zh-TW')}\n`);
  report.push(`> **掃描範圍**: ${SCAN_DIRS.join(', ')}\n`);
  report.push('---\n\n');

  // 總覽
  report.push('## 📊 總覽統計\n\n');
  report.push('| 項目 | 數量 |\n');
  report.push('|------|------|\n');
  report.push(`| 總文件數 | ${stats.totalFiles} |\n`);
  report.push(`| 包含中文的文件 | ${stats.filesWithChinese} |\n`);
  report.push(`| 需要翻譯的中文字符串 | ${stats.totalChineseStrings} |\n`);
  report.push(`| 翻譯覆蓋率 | ${((stats.filesWithChinese / stats.totalFiles) * 100).toFixed(2)}% |\n\n`);

  // 文本類型分佈
  report.push('## 📝 文本類型分佈\n\n');
  report.push('```\n');
  report.push(`UI 顯示文本:    ${stats.textTypes.uiText.toString().padStart(6)} (${((stats.textTypes.uiText / stats.totalChineseStrings) * 100).toFixed(1)}%)\n`);
  report.push(`錯誤訊息:        ${stats.textTypes.errorMessages.toString().padStart(6)} (${((stats.textTypes.errorMessages / stats.totalChineseStrings) * 100).toFixed(1)}%)\n`);
  report.push(`表單驗證:        ${stats.textTypes.validation.toString().padStart(6)} (${((stats.textTypes.validation / stats.totalChineseStrings) * 100).toFixed(1)}%)\n`);
  report.push(`代碼註釋:        ${stats.textTypes.comments.toString().padStart(6)} (${((stats.textTypes.comments / stats.totalChineseStrings) * 100).toFixed(1)}%)\n`);
  report.push(`Console 輸出:    ${stats.textTypes.console.toString().padStart(6)} (${((stats.textTypes.console / stats.totalChineseStrings) * 100).toFixed(1)}%)\n`);
  report.push('```\n\n');

  // 複雜度分佈
  report.push('## 🎯 文件複雜度分佈\n\n');
  report.push('| 複雜度 | 文件數 | 說明 |\n');
  report.push('|--------|--------|------|\n');
  report.push(`| 🟢 簡單 | ${stats.complexity.simple} | < 10 個字符串 |\n`);
  report.push(`| 🟡 中等 | ${stats.complexity.moderate} | 10-30 個字符串 |\n`);
  report.push(`| 🔴 複雜 | ${stats.complexity.complex} | > 30 個字符串 |\n\n`);

  // 排序文件列表（按字符串數量降序）
  const sortedFiles = [...stats.fileDetails].sort((a, b) => b.chineseStrings.length - a.chineseStrings.length);

  // Top 20 需要優先處理的文件
  report.push('## 🔥 Top 20 高優先級文件\n\n');
  report.push('| 排名 | 文件 | 字符串數 | 複雜度 | 主要類型 |\n');
  report.push('|------|------|----------|--------|----------|\n');

  sortedFiles.slice(0, 20).forEach((file, index) => {
    const mainType = Object.keys(file.types).reduce((a, b) =>
      file.types[a] > file.types[b] ? a : b
    );
    const complexityEmoji = file.complexity === 'simple' ? '🟢' : file.complexity === 'moderate' ? '🟡' : '🔴';

    report.push(`| ${index + 1} | \`${file.path}\` | ${file.chineseStrings.length} | ${complexityEmoji} ${file.complexity} | ${mainType} |\n`);
  });

  report.push('\n');

  // 按目錄分類統計
  report.push('## 📁 按目錄分類統計\n\n');

  const dirStats = {};
  sortedFiles.forEach(file => {
    const dir = file.path.split('/')[0];
    if (!dirStats[dir]) {
      dirStats[dir] = {
        files: 0,
        strings: 0,
        complexity: {simple: 0, moderate: 0, complex: 0}
      };
    }
    dirStats[dir].files++;
    dirStats[dir].strings += file.chineseStrings.length;
    dirStats[dir].complexity[file.complexity]++;
  });

  report.push('| 目錄 | 文件數 | 字符串數 | 平均複雜度 |\n');
  report.push('|------|--------|----------|------------|\n');

  Object.keys(dirStats).sort().forEach(dir => {
    const avgStrings = (dirStats[dir].strings / dirStats[dir].files).toFixed(1);
    report.push(`| ${dir}/ | ${dirStats[dir].files} | ${dirStats[dir].strings} | ${avgStrings} 個/文件 |\n`);
  });

  report.push('\n');

  // 詳細文件列表
  report.push('## 📋 完整文件清單\n\n');
  report.push('<details>\n');
  report.push('<summary>點擊展開查看所有需要處理的文件（共 ' + stats.filesWithChinese + ' 個）</summary>\n\n');

  sortedFiles.forEach(file => {
    const complexityEmoji = file.complexity === 'simple' ? '🟢' : file.complexity === 'moderate' ? '🟡' : '🔴';

    report.push(`### ${complexityEmoji} ${file.path}\n\n`);
    report.push(`- **字符串數量**: ${file.chineseStrings.length}\n`);
    report.push(`- **複雜度**: ${file.complexity}\n`);
    report.push(`- **文本分佈**:\n`);
    report.push(`  - UI 文本: ${file.types.uiText}\n`);
    report.push(`  - 錯誤訊息: ${file.types.errorMessages}\n`);
    report.push(`  - 表單驗證: ${file.types.validation}\n`);
    report.push(`  - 註釋: ${file.types.comments}\n`);
    report.push(`  - Console: ${file.types.console}\n\n`);

    // 顯示前5個字符串作為示例
    if (file.chineseStrings.length > 0) {
      report.push('**示例字符串**:\n');
      file.chineseStrings.slice(0, 5).forEach(str => {
        report.push(`- L${str.line}: \`${str.text}\`\n`);
      });
      if (file.chineseStrings.length > 5) {
        report.push(`- ... 還有 ${file.chineseStrings.length - 5} 個字符串\n`);
      }
      report.push('\n');
    }
  });

  report.push('</details>\n\n');

  // 工作量評估
  report.push('## ⏱️ 工作量評估\n\n');

  const simpleTime = stats.complexity.simple * 0.25; // 簡單文件：15分鐘
  const moderateTime = stats.complexity.moderate * 0.5; // 中等文件：30分鐘
  const complexTime = stats.complexity.complex * 1; // 複雜文件：1小時
  const totalHours = simpleTime + moderateTime + complexTime;
  const totalDays = Math.ceil(totalHours / 8);

  report.push('### 預估時間（基於文件複雜度）\n\n');
  report.push('| 複雜度 | 文件數 | 單位時間 | 小計 |\n');
  report.push('|--------|--------|----------|------|\n');
  report.push(`| 🟢 簡單 | ${stats.complexity.simple} | 15 分鐘 | ${simpleTime.toFixed(1)} 小時 |\n`);
  report.push(`| 🟡 中等 | ${stats.complexity.moderate} | 30 分鐘 | ${moderateTime.toFixed(1)} 小時 |\n`);
  report.push(`| 🔴 複雜 | ${stats.complexity.complex} | 1 小時 | ${complexTime.toFixed(1)} 小時 |\n`);
  report.push(`| **總計** | **${stats.filesWithChinese}** | | **${totalHours.toFixed(1)} 小時 ≈ ${totalDays} 個工作日** |\n\n`);

  report.push('> **注意**: 以上時間僅為組件遷移時間，不包括：\n');
  report.push('> - 翻譯文件建立時間（約2-3天）\n');
  report.push('> - 測試時間（約2-3天）\n');
  report.push('> - Code Review 和修正時間（約1-2天）\n\n');

  // 建議
  report.push('## 💡 實施建議\n\n');
  report.push('### 優先處理順序\n\n');
  report.push('1. **Phase 1 - 核心認證頁面** (P0)\n');
  report.push('   - `app/login/page.tsx`\n');
  report.push('   - `app/register/page.tsx`\n');
  report.push('   - `app/forgot-password/page.tsx`\n\n');

  report.push('2. **Phase 2 - 主要佈局組件** (P0)\n');
  report.push('   - `components/layout/sidebar.tsx`\n');
  report.push('   - `components/layout/top-bar.tsx`\n');
  report.push('   - `app/layout.tsx`\n\n');

  report.push('3. **Phase 3 - 核心業務頁面** (P1)\n');
  report.push('   - `app/dashboard/`\n');
  report.push('   - `app/projects/`\n');
  report.push('   - `app/proposals/`\n\n');

  report.push('4. **Phase 4 - 輔助功能頁面** (P2)\n');
  report.push('   - `app/vendors/`\n');
  report.push('   - `app/quotes/`\n');
  report.push('   - `app/purchase-orders/`\n');
  report.push('   - `app/expenses/`\n\n');

  report.push('### 注意事項\n\n');
  report.push('- ⚠️ **註釋不需要翻譯**: ' + stats.textTypes.comments + ' 個註釋字符串可以保持中文\n');
  report.push('- ⚠️ **Console 輸出**: ' + stats.textTypes.console + ' 個 console.log 是否需要翻譯需要討論\n');
  report.push('- ⚠️ **錯誤訊息**: ' + stats.textTypes.errorMessages + ' 個錯誤訊息需要特別處理（後端 + 前端）\n\n');

  // 風險評估
  report.push('## ⚠️ 風險評估\n\n');
  report.push('| 風險項 | 等級 | 影響 | 緩解措施 |\n');
  report.push('|--------|------|------|----------|\n');
  report.push('| 工作量大（' + stats.filesWithChinese + '個文件） | 🔴 高 | 可能延長開發時間 | 分階段實施，優先核心頁面 |\n');
  report.push('| 翻譯遺漏 | 🟡 中 | 部分文本未翻譯 | 建立自動化檢查工具 |\n');
  report.push('| UI 破版 | 🟡 中 | 英文文本過長破壞佈局 | 預留30%空間，響應式設計 |\n');
  report.push('| 測試覆蓋不足 | 🟡 中 | 線上出現翻譯問題 | 完整的 E2E 測試覆蓋 |\n\n');

  return report.join('');
}

// 主函數
function main() {
  console.log('🔍 開始掃描項目...\n');

  SCAN_DIRS.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📂 掃描目錄: ${dir}`);
      scanDirectory(fullPath);
    }
  });

  console.log('\n✅ 掃描完成！\n');
  console.log('📊 統計結果:');
  console.log(`   - 總文件數: ${stats.totalFiles}`);
  console.log(`   - 包含中文的文件: ${stats.filesWithChinese}`);
  console.log(`   - 中文字符串總數: ${stats.totalChineseStrings}\n`);

  console.log('📝 生成分析報告...');
  const report = generateReport();

  const outputPath = path.join(process.cwd(), OUTPUT_FILE);
  fs.writeFileSync(outputPath, report, 'utf-8');

  console.log(`✅ 報告已生成: ${OUTPUT_FILE}\n`);
}

// 執行
main();
