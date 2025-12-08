#!/usr/bin/env node
/**
 * 索引同步檢查工具
 * 用途：確保項目索引文件與實際文件結構保持同步
 * 使用：npm run index:check
 */

const fs = require('fs');
const path = require('path');

class IndexSyncChecker {
  constructor() {
    this.projectRoot = process.cwd();
    this.issues = [];
    this.suggestions = [];
    this.autoFix = false;
    this.incrementalMode = false;
    this.lastCheckTime = null;
  }

  /**
   * 主要檢查流程
   */
  async runCheck(options = {}) {
    this.autoFix = options.autoFix || false;
    this.incrementalMode = options.incremental || false;
    this.hookMode = options.hookMode || false; // Git hook 模式

    console.log('🔍 開始索引同步檢查...\\n');

    if (this.incrementalMode) {
      console.log('⚡ 增量模式：只檢查最近變更的文件');
      await this.loadLastCheckTime();
    }

    try {
      // 1. 檢查核心索引文件是否存在
      await this.checkCoreIndexFiles();

      // 2. 驗證索引文件中的路徑
      await this.validateIndexPaths();

      // 3. 檢測新文件是否需要加入索引
      await this.detectMissingFiles();

      // 4. 檢查過期引用
      await this.checkObsoleteReferences();

      // 5. 生成報告
      this.generateReport();

      // 6. 自動修復（如果啟用）
      if (this.autoFix && this.suggestions.length > 0) {
        await this.performAutoFix();
      }

      // 7. 記錄檢查時間（僅在非hook模式）
      if (!this.hookMode) {
        await this.saveLastCheckTime();
      }

    } catch (error) {
      console.error('❌ 檢查過程發生錯誤:', error.message);
      process.exit(1);
    }
  }

  /**
   * 載入上次檢查時間
   */
  async loadLastCheckTime() {
    const checkFile = path.join(this.projectRoot, '.index-check-time');
    try {
      if (fs.existsSync(checkFile)) {
        const timeStr = fs.readFileSync(checkFile, 'utf-8').trim();
        this.lastCheckTime = new Date(timeStr);
        console.log(`📅 上次檢查時間: ${this.lastCheckTime.toLocaleString()}`);
      }
    } catch (error) {
      console.log('⚠️ 無法讀取上次檢查時間，將執行完整檢查');
    }
  }

  /**
   * 保存檢查時間
   */
  async saveLastCheckTime() {
    const checkFile = path.join(this.projectRoot, '.index-check-time');
    fs.writeFileSync(checkFile, new Date().toISOString());
  }

  /**
   * 自動修復功能
   */
  async performAutoFix() {
    console.log('\\n🔧 開始自動修復...');

    for (const suggestion of this.suggestions.slice(0, 5)) { // 限制一次最多修復5個
      if (suggestion.type === 'add_to_index') {
        await this.addFileToIndex(suggestion.file);
      }
    }
  }

  /**
   * 將文件添加到索引
   */
  async addFileToIndex(filePath) {
    const importance = this.getFileImportance(filePath);
    const targetIndex = importance === 'high' ? 'AI-ASSISTANT-GUIDE.md' : 'PROJECT-INDEX.md';

    console.log(`📝 添加 ${filePath} 到 ${targetIndex}`);

    try {
      if (targetIndex === 'PROJECT-INDEX.md') {
        await this.addToProjectIndex(filePath);
      } else {
        await this.addToAssistantGuide(filePath);
      }

      console.log(`✅ 成功添加 ${filePath} 到 ${targetIndex}`);
    } catch (error) {
      console.log(`❌ 添加失敗: ${error.message}`);
      this.suggestions.push({
        type: 'auto_fix_failed',
        file: filePath,
        targetIndex: targetIndex,
        message: `自動添加失敗，建議手動添加到 ${targetIndex}：${filePath}`
      });
    }
  }

  /**
   * 添加文件到 PROJECT-INDEX.md
   */
  async addToProjectIndex(filePath) {
    const indexPath = path.join(this.projectRoot, 'PROJECT-INDEX.md');
    if (!fs.existsSync(indexPath)) return;

    const content = fs.readFileSync(indexPath, 'utf-8');

    // 查找合適的插入位置 - 在 "### 🟢 參考 (需要時查看)" 部分之前
    const insertMarker = '### 🟢 參考 (需要時查看)';
    const insertIndex = content.indexOf(insertMarker);

    if (insertIndex === -1) {
      throw new Error('找不到適當的插入位置');
    }

    // 生成新的條目
    const fileName = path.basename(filePath, '.md');
    const description = this.getFileDescription(filePath);
    const importance = this.getDisplayImportance(filePath);
    const newEntry = `| **${fileName}** | \`${filePath}\` | ${description} | ${importance} |\\n`;

    // 在插入點之前找到表格結束位置
    const beforeInsert = content.substring(0, insertIndex);
    const lastTableIndex = beforeInsert.lastIndexOf('|');
    const insertPosition = beforeInsert.lastIndexOf('\\n', lastTableIndex) + 1;

    const newContent = content.substring(0, insertPosition) +
                      newEntry +
                      content.substring(insertPosition);

    fs.writeFileSync(indexPath, newContent);
  }

  /**
   * 添加文件到 AI-ASSISTANT-GUIDE.md
   */
  async addToAssistantGuide(filePath) {
    const indexPath = path.join(this.projectRoot, 'AI-ASSISTANT-GUIDE.md');
    if (!fs.existsSync(indexPath)) return;

    const content = fs.readFileSync(indexPath, 'utf-8');

    // 查找 "### 🟡 重要 (常用)" 部分的插入位置
    const insertMarker = '### 🟢 參考 (需要時查看)';
    const insertIndex = content.indexOf(insertMarker);

    if (insertIndex === -1) {
      throw new Error('找不到適當的插入位置');
    }

    // 生成新的條目
    const description = this.getFileDescription(filePath);
    const newEntry = `${filePath}     # ${description}\\n`;

    // 在插入點之前找到合適位置
    const insertPosition = content.lastIndexOf('\\n```\\n', insertIndex);

    const newContent = content.substring(0, insertPosition) +
                      newEntry +
                      content.substring(insertPosition);

    fs.writeFileSync(indexPath, newContent);
  }

  /**
   * 獲取文件描述
   */
  getFileDescription(filePath) {
    const descriptions = {
      '.ai-context': '極簡上下文載入文件',
      'check-index-sync.js': '索引同步檢查工具',
    };

    return descriptions[path.basename(filePath)] || '項目相關文檔';
  }

  /**
   * 獲取顯示重要程度
   */
  getDisplayImportance(filePath) {
    const importance = this.getFileImportance(filePath);
    return importance === 'high' ? '🟡 高' : '🟢 中';
  }

  /**
   * 判斷文件重要性
   */
  getFileImportance(filePath) {
    const highImportancePatterns = [
      /README\.md$/,
      /.*\.config\.(js|ts|json)$/,
      /package\.json$/,
      /schema\.prisma$/,
      /(docs|src)\/.*\.md$/,
      // 根目錄重要開發文檔
      /^[A-Z][A-Z-]*\.md$/,  // 大寫開頭的根目錄.md文件
      /^(DEVELOPMENT|DEPLOYMENT|SETUP|GUIDE|CHANGELOG|CONTRIBUTING|FIXLOG|INDEX).*\.md$/,
      // 測試相關重要文件
      /.*test.*\.md$/,
      /.*test.*\.config\.(js|ts)$/,
      /playwright\.config\.(js|ts)$/,
      /jest\.config\.(js|ts)$/,
      /vitest\.config\.(js|ts)$/,
      // 核心代碼模組
      /^lib\/.*\.(ts|js)$/,
      /^components\/.*\.(tsx|ts)$/,
      /^apps\/.*\.(ts|tsx)$/,
      /^packages\/.*\.(ts|js)$/,
      /^__tests__\/.*\.test\.(ts|js)$/
    ];

    if (highImportancePatterns.some(pattern => pattern.test(filePath))) {
      return 'high';
    }

    return 'medium';
  }

  /**
   * 檢查核心索引文件
   */
  async checkCoreIndexFiles() {
    console.log('📋 檢查核心索引文件...');

    const requiredIndexFiles = [
      '.ai-context',
      'AI-ASSISTANT-GUIDE.md',
      'PROJECT-INDEX.md',
      'INDEX-MAINTENANCE-GUIDE.md',
      'DEVELOPMENT-LOG.md',
      'FIXLOG.md'
    ];

    for (const indexFile of requiredIndexFiles) {
      const filePath = path.join(this.projectRoot, indexFile);
      if (!fs.existsSync(filePath)) {
        this.issues.push({
          type: 'missing_index',
          file: indexFile,
          severity: 'high',
          message: `核心索引文件不存在: ${indexFile}`
        });
      } else {
        console.log(`  ✅ ${indexFile}`);
      }
    }
  }

  /**
   * 驗證索引文件中的路徑
   */
  async validateIndexPaths() {
    console.log('\\n🔗 驗證索引文件中的路徑...');

    const indexFiles = [
      'AI-ASSISTANT-GUIDE.md',
      'PROJECT-INDEX.md'
    ];

    for (const indexFile of indexFiles) {
      const filePath = path.join(this.projectRoot, indexFile);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        await this.validatePathsInContent(content, indexFile);
      }
    }
  }

  /**
   * 驗證文件內容中的路徑
   */
  async validatePathsInContent(content, sourceFile) {
    // 匹配 markdown 中的文件路徑引用
    const pathRegex = /`([^`]+\\.(md|js|json|prisma|sql|yml|yaml|ts|tsx))`/g;
    let match;

    while ((match = pathRegex.exec(content)) !== null) {
      const referencedPath = match[1];
      const fullPath = path.join(this.projectRoot, referencedPath);

      if (!fs.existsSync(fullPath)) {
        this.issues.push({
          type: 'broken_reference',
          file: sourceFile,
          reference: referencedPath,
          severity: 'medium',
          message: `索引文件 ${sourceFile} 中的路徑引用失效: ${referencedPath}`
        });
      }
    }
  }

  /**
   * 檢測需要加入索引的新文件
   */
  async detectMissingFiles() {
    console.log('\\n🔍 檢測可能遺漏的重要文件...');

    const importantDirectories = ['docs', 'src', 'lib', 'components', 'apps', 'packages', 'scripts', 'azure', 'claudedocs'];
    const importantExtensions = ['.md', '.js', '.ts', '.tsx', '.prisma'];

    for (const dir of importantDirectories) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await this.scanDirectoryForImportantFiles(dirPath, dir);
      }
    }

    // 檢查根目錄重要文件
    const rootFiles = fs.readdirSync(this.projectRoot);
    for (const file of rootFiles) {
      const filePath = path.join(this.projectRoot, file);
      const stat = fs.statSync(filePath);

      if (!stat.isDirectory() && this.isImportantFile(file, path.extname(file))) {
        if (!this.isFileInIndex(file)) {
          this.suggestions.push({
            type: 'add_to_index',
            file: file,
            severity: 'low',
            message: `建議將重要文件加入索引: ${file}`
          });
        }
      }
    }
  }

  /**
   * 掃描目錄中的重要文件
   */
  async scanDirectoryForImportantFiles(dirPath, relativePath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        // 避免掃描工具目錄、範例文檔和測試目錄
        const avoidDirs = [
          '.bmad-core', '.bmad-infrastructure-devops', '.bmad-creative-writing',
          'web-bundles', '.claude', '.cursor', '.git', 'node_modules',
          'Sample-Docs', '.next', 'dist', 'build', '.turbo', 'coverage',
          '7-archive', 'archive', // 歸檔目錄不需要索引
          'e2e', '__tests__', 'tests', 'test', // 測試目錄
          '.playwright', 'playwright-report', 'test-results', // Playwright 相關
          'migrations', // 資料庫遷移目錄（由 Prisma 管理）
          'generated' // 自動生成目錄
        ];
        if (!avoidDirs.includes(file)) {
          await this.scanDirectoryForImportantFiles(
            filePath,
            path.join(relativePath, file)
          );
        }
      } else {
        const ext = path.extname(file);
        const relativeFilePath = path.join(relativePath, file).replace(/\\\\/g, '/');

        // 增量模式：只檢查最近修改的文件
        if (this.incrementalMode && this.lastCheckTime) {
          if (stat.mtime <= this.lastCheckTime) {
            continue; // 跳過未修改的文件
          }
        }

        // 檢查是否為重要文件但未在索引中
        // 排除 claudedocs 細粒度文件（已在目錄結構中組織）
        if (this.isImportantFile(file, ext, relativeFilePath) &&
            !this.isFileInIndex(relativeFilePath) &&
            !this.isClaudedocsGranularFile(relativeFilePath)) {
          const importance = this.getFileImportance(relativeFilePath);
          this.suggestions.push({
            type: 'add_to_index',
            file: relativeFilePath,
            importance: importance,
            severity: importance === 'high' ? 'medium' : 'low',
            message: `建議將重要文件加入索引: ${relativeFilePath}`,
            modifiedTime: stat.mtime
          });
        }
      }
    }
  }

  /**
   * 判斷是否為重要文件
   * @version 1.1.0 - 新增 claudedocs 細粒度文件排除邏輯
   */
  isImportantFile(fileName, extension, relativePath = '') {
    const importantFiles = [
      'README.md', 'CHANGELOG.md', 'CONTRIBUTING.md',
      'package.json', 'tsconfig.json', 'next.config.js', 'next.config.mjs',
      'schema.prisma', 'docker-compose.yml'
    ];

    // 需要排除的測試和自動生成文件模式
    const excludePatterns = [
      /\.spec\.(js|ts|tsx)$/,    // E2E 測試文件
      /\.test\.(js|ts|tsx)$/,    // 單元測試文件
      /\.d\.ts$/,                // TypeScript 宣告文件
      /\.map$/,                  // Source map 文件
      /\.lock$/,                 // Lock 文件
      /\.log$/,                  // Log 文件
    ];

    // 排除測試和自動生成文件
    if (excludePatterns.some(pattern => pattern.test(fileName))) {
      return false;
    }

    // 特殊處理：子目錄中的 CLAUDE.md 文件（已作為類別記錄，不需要單獨索引）
    // 統一使用正斜線進行路徑檢查（跨平台兼容）
    const normalizedRelPath = relativePath.replace(/\\/g, '/');
    if (fileName === 'CLAUDE.md' && normalizedRelPath.includes('/')) {
      return false;
    }

    // 排除組件目錄下的 barrel export 文件（index.ts）
    // 這些文件只是重新導出，不包含實際邏輯
    if (fileName === 'index.ts' &&
        (normalizedRelPath.includes('/components/') || normalizedRelPath.includes('/messages/'))) {
      return false;
    }

    const importantPatterns = [
      /^.*\.config\.(js|ts|json|mjs)$/,
      /^index\.(js|ts|tsx)$/,
      /^.*\.md$/,
      // Next.js 頁面文件模式
      /^page\.(js|ts|tsx)$/,
      /^layout\.(js|ts|tsx)$/,
      /^loading\.(js|ts|tsx)$/,
      /^error\.(js|ts|tsx)$/,
      /^not-found\.(js|ts|tsx)$/,
      /^route\.(js|ts)$/
    ];

    // 檢查重要文件名
    if (importantFiles.includes(fileName)) {
      return true;
    }

    // 檢查重要模式
    return importantPatterns.some(pattern => pattern.test(fileName));
  }

  /**
   * 判斷是否為 claudedocs 細粒度文件（已在目錄結構中組織，不需要單獨索引）
   * @version 1.1.0 新增
   */
  isClaudedocsGranularFile(relativePath) {
    const normalizedPath = relativePath.replace(/\\/g, '/');

    // 需要排除的 claudedocs 細粒度文件模式
    // 這些文件已在 claudedocs/README.md 或對應子目錄索引中組織
    const granularPatterns = [
      // 1-planning/architecture 架構文檔（已在總索引中分類記錄）
      /claudedocs\/1-planning\/architecture\/.*\.md$/,
      // FEAT-* 子文檔（01-requirements.md, 02-technical-design.md 等）
      /claudedocs\/1-planning\/features\/FEAT-\d+.*\/.*\.md$/,
      // AZURE-DEPLOY-PREP 所有子文檔
      /claudedocs\/1-planning\/features\/AZURE-DEPLOY-PREP\/.*\.md$/,
      // FIX-* 個別文件
      /claudedocs\/4-changes\/bug-fixes\/.*\.md$/,
      // I18N 個別文件
      /claudedocs\/4-changes\/i18n\/.*\.md$/,
      // CHANGE-* 個別文件
      /claudedocs\/4-changes\/feature-changes\/.*\.md$/,
      // 每日進度（已歸類為類別）
      /claudedocs\/3-progress\/daily\/.*\.md$/,
      // 週報（除了當前週）- 只保留最近 2 週
      /claudedocs\/3-progress\/weekly\/2025-W4[0-7]\.md$/,
      // Sprint 測試報告所有文件
      /claudedocs\/2-sprints\/testing-validation\/.*\.md$/,
      // AI 助手分析報告個別文件
      /claudedocs\/6-ai-assistant\/analysis\/.*\.md$/,
      // Handoff 文件
      /claudedocs\/6-ai-assistant\/handoff\/.*\.md$/,
      // claudedocs 根目錄的歷史記錄文件
      /claudedocs\/AZURE-.*\.md$/,
      /claudedocs\/DOCUMENTATION-.*\.md$/,
      /claudedocs\/PROJECT-.*\.md$/,
      /claudedocs\/WINDOWS-.*\.md$/,
      // 5-status 測試記錄
      /claudedocs\/5-status\/testing\/.*\.md$/,
    ];

    return granularPatterns.some(pattern => pattern.test(normalizedPath));
  }

  /**
   * 檢查文件是否已在索引中
   */
  isFileInIndex(filePath) {
    const indexFiles = ['AI-ASSISTANT-GUIDE.md', 'PROJECT-INDEX.md'];

    // 標準化路徑格式，統一使用正斜線
    const normalizedPath = filePath.replace(/\\/g, '/');
    // 同時準備反斜線版本（用於 Windows 路徑匹配）
    const windowsPath = filePath.replace(/\//g, '\\');
    // 提取文件名用於部分匹配
    const fileName = path.basename(filePath);

    for (const indexFile of indexFiles) {
      const indexPath = path.join(this.projectRoot, indexFile);
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath, 'utf-8');
        // 檢查多種路徑格式
        if (content.includes(normalizedPath) ||
            content.includes(windowsPath) ||
            content.includes(filePath)) {
          return true;
        }
        // 對於某些重要文件，檢查文件名是否已經在索引中（用於表格格式）
        // 例如: | **Brief** | `docs/brief.md` | 項目背景 |
        if (content.includes(`\`${normalizedPath}\``) ||
            content.includes(`\`${windowsPath}\``)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 檢查過期引用
   */
  async checkObsoleteReferences() {
    console.log('\\n🗑️ 檢查過期引用...');
    // 目前實現基本功能，未來可擴展
  }

  /**
   * 生成檢查報告
   */
  generateReport() {
    console.log('\\n' + '='.repeat(60));
    console.log('📊 索引同步檢查報告');
    console.log('='.repeat(60));

    // 統計
    const highIssues = this.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length;
    const lowIssues = this.issues.filter(i => i.severity === 'low').length;

    console.log(`\\n📈 問題統計:`);
    console.log(`  🔴 嚴重問題: ${highIssues}`);
    console.log(`  🟡 中等問題: ${mediumIssues}`);
    console.log(`  🟢 輕微問題: ${lowIssues}`);
    console.log(`  💡 改進建議: ${this.suggestions.length}`);

    // 詳細問題列表
    if (this.issues.length > 0) {
      console.log('\\n❌ 發現的問題:');
      this.issues.forEach((issue, index) => {
        const icon = issue.severity === 'high' ? '🔴' :
                    issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`\\n${index + 1}. ${icon} ${issue.message}`);
        if (issue.file) console.log(`   檔案: ${issue.file}`);
        if (issue.reference) console.log(`   引用: ${issue.reference}`);
      });
    }

    // 改進建議 (只顯示前5個，避免過多輸出)
    if (this.suggestions.length > 0) {
      console.log('\\n💡 改進建議 (顯示前5個):');
      this.suggestions.slice(0, 5).forEach((suggestion, index) => {
        console.log(`\\n${index + 1}. ${suggestion.message}`);
      });

      if (this.suggestions.length > 5) {
        console.log(`\\n... 還有 ${this.suggestions.length - 5} 個建議 (查看完整報告)`);
      }
    }

    // 總結
    console.log('\\n' + '='.repeat(60));
    if (this.issues.length === 0) {
      console.log('✅ 索引文件同步狀態良好！');
    } else {
      console.log('⚠️ 建議修復上述問題以保持索引文件同步');
    }

    // 保存報告到文件（僅在非hook模式）
    if (!this.hookMode) {
      this.saveReportToFile();
    }
  }

  /**
   * 保存報告到文件
   */
  saveReportToFile() {
    const report = {
      timestamp: new Date().toISOString(),
      checkerVersion: "1.2.0", // 2025-12-08: 新增 claudedocs 細粒度文件排除邏輯
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        workingDirectory: this.projectRoot
      },
      summary: {
        totalIssues: this.issues.length,
        highSeverity: this.issues.filter(i => i.severity === 'high').length,
        mediumSeverity: this.issues.filter(i => i.severity === 'medium').length,
        lowSeverity: this.issues.filter(i => i.severity === 'low').length,
        suggestions: this.suggestions.length,
        indexFilesChecked: ['AI-ASSISTANT-GUIDE.md', 'PROJECT-INDEX.md'],
        status: this.issues.length === 0 && this.suggestions.length === 0 ? 'perfect_sync' : 'needs_attention'
      },
      issues: this.issues,
      suggestions: this.suggestions,
      lastUpdated: new Date().toISOString()
    };

    const reportPath = path.join(this.projectRoot, 'index-sync-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\\n📄 詳細報告已保存至: index-sync-report.json`);
  }
}

// 如果直接執行此腳本
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    autoFix: args.includes('--auto-fix') || args.includes('-f'),
    incremental: args.includes('--incremental') || args.includes('-i'),
    hookMode: args.includes('--hook') || args.includes('--git-hook')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔍 索引同步檢查工具

使用方法:
  node check-index-sync.js [選項]

選項:
  -h, --help        顯示幫助信息
  -i, --incremental 增量模式（只檢查最近變更的文件）
  -f, --auto-fix    自動修復模式（自動應用建議的修復）

範例:
  node check-index-sync.js                    # 完整檢查
  node check-index-sync.js --incremental      # 增量檢查
  node check-index-sync.js --auto-fix         # 自動修復
  node check-index-sync.js -i -f              # 增量檢查並自動修復
    `);
    process.exit(0);
  }

  const checker = new IndexSyncChecker();
  checker.runCheck(options)
    .then(() => {
      console.log('\\n🎉 索引同步檢查完成！');
      if (options.autoFix) {
        console.log('🔧 已嘗試自動修復部分問題');
      }
    })
    .catch(error => {
      console.error('💥 檢查失敗:', error);
      process.exit(1);
    });
}

module.exports = IndexSyncChecker;
