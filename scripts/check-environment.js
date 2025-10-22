#!/usr/bin/env node

/**
 * 環境檢查腳本 (Environment Check Script)
 *
 * 目的: 驗證開發環境是否正確配置，確保項目可以正常啟動
 *
 * 使用方法:
 *   node scripts/check-environment.js
 *   或
 *   npm run check:env
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI 顏色碼
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// 檢查結果
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

/**
 * 打印帶顏色的訊息
 */
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logCheck(name, passed, details = '') {
  const icon = passed ? '✓' : '✗';
  const color = passed ? 'green' : 'red';
  const status = passed ? 'PASSED' : 'FAILED';

  log(`${icon} ${name} ... ${status}`, color);
  if (details) {
    log(`  ${details}`, 'cyan');
  }

  if (passed) {
    results.passed.push(name);
  } else {
    results.failed.push({ name, details });
  }
}

function logWarning(name, details) {
  log(`⚠ ${name} ... WARNING`, 'yellow');
  if (details) {
    log(`  ${details}`, 'cyan');
  }
  results.warnings.push({ name, details });
}

/**
 * 執行命令並返回輸出
 */
function execCommand(command) {
  try {
    return execSync(command, { encoding: 'utf8', stdio: 'pipe' }).trim();
  } catch (error) {
    return null;
  }
}

/**
 * 檢查 Node.js 版本
 */
function checkNodeVersion() {
  const currentVersion = process.version;
  const requiredVersion = '20.0.0';

  const current = currentVersion.replace('v', '').split('.').map(Number);
  const required = requiredVersion.split('.').map(Number);

  const isValid =
    current[0] > required[0] ||
    (current[0] === required[0] && current[1] >= required[1]);

  logCheck(
    'Node.js version',
    isValid,
    `當前版本: ${currentVersion}, 需要: >= v${requiredVersion}`
  );
}

/**
 * 檢查 pnpm 是否安裝
 */
function checkPnpm() {
  const pnpmVersion = execCommand('pnpm --version');
  const isInstalled = pnpmVersion !== null;

  if (isInstalled) {
    const requiredVersion = '8.0.0';
    const current = pnpmVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);

    const isValid =
      current[0] > required[0] ||
      (current[0] === required[0] && current[1] >= required[1]);

    logCheck(
      'pnpm package manager',
      isValid,
      `當前版本: ${pnpmVersion}, 需要: >= ${requiredVersion}`
    );
  } else {
    logCheck(
      'pnpm package manager',
      false,
      '未安裝。請執行: npm install -g pnpm'
    );
  }
}

/**
 * 檢查 Docker 是否運行
 */
function checkDocker() {
  const dockerVersion = execCommand('docker --version');
  const isInstalled = dockerVersion !== null;

  if (!isInstalled) {
    logCheck(
      'Docker installation',
      false,
      'Docker 未安裝。請從 https://www.docker.com/products/docker-desktop 下載安裝'
    );
    return;
  }

  const dockerRunning = execCommand('docker ps') !== null;
  logCheck(
    'Docker daemon running',
    dockerRunning,
    dockerRunning ? 'Docker 正在運行' : 'Docker 未啟動。請啟動 Docker Desktop'
  );
}

/**
 * 檢查 .env 檔案
 */
function checkEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  const exists = fs.existsSync(envPath);

  if (!exists) {
    logCheck(
      '.env file exists',
      false,
      `請複製 .env.example 為 .env: cp .env.example .env`
    );
    return;
  }

  logCheck('.env file exists', true);

  // 檢查關鍵環境變數
  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'DATABASE_URL',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
  ];

  const missingVars = requiredVars.filter(varName => {
    const regex = new RegExp(`^${varName}=.+`, 'm');
    return !regex.test(envContent);
  });

  if (missingVars.length > 0) {
    logWarning(
      'Environment variables',
      `缺少以下環境變數: ${missingVars.join(', ')}`
    );
  } else {
    logCheck('Required environment variables', true);
  }
}

/**
 * 檢查 node_modules 是否安裝
 */
function checkNodeModules() {
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const exists = fs.existsSync(nodeModulesPath);

  if (!exists) {
    logCheck(
      'Dependencies installed',
      false,
      '請執行: pnpm install'
    );
  } else {
    logCheck('Dependencies installed', true);
  }
}

/**
 * 檢查 Prisma Client 是否生成
 */
function checkPrismaClient() {
  const prismaClientPath = path.join(
    process.cwd(),
    'node_modules',
    '.prisma',
    'client'
  );
  const exists = fs.existsSync(prismaClientPath);

  if (!exists) {
    logCheck(
      'Prisma Client generated',
      false,
      '請執行: pnpm db:generate'
    );
  } else {
    logCheck('Prisma Client generated', true);
  }
}

/**
 * 檢查 Docker Compose 服務
 */
function checkDockerServices() {
  const dockerComposeConfig = execCommand('docker-compose config');
  if (dockerComposeConfig === null) {
    logCheck(
      'Docker Compose configuration',
      false,
      'docker-compose.yml 配置無效'
    );
    return;
  }

  logCheck('Docker Compose configuration', true);

  // 檢查容器是否運行
  const runningContainers = execCommand('docker-compose ps --services --filter "status=running"');

  if (runningContainers) {
    const services = runningContainers.split('\n').filter(Boolean);
    const expectedServices = ['postgres', 'redis', 'mailhog'];
    const runningServices = services.filter(s => expectedServices.includes(s));

    if (runningServices.length === 0) {
      logWarning(
        'Docker services running',
        'Docker 服務未啟動。請執行: docker-compose up -d'
      );
    } else if (runningServices.length < expectedServices.length) {
      const missing = expectedServices.filter(s => !runningServices.includes(s));
      logWarning(
        'Docker services running',
        `部分服務未啟動: ${missing.join(', ')}。請執行: docker-compose up -d`
      );
    } else {
      logCheck(
        'Docker services running',
        true,
        `運行中的服務: ${runningServices.join(', ')}`
      );
    }
  } else {
    logWarning(
      'Docker services running',
      'Docker 服務未啟動。請執行: docker-compose up -d'
    );
  }
}

/**
 * 檢查資料庫連接
 */
function checkDatabaseConnection() {
  try {
    const result = execCommand(
      'docker exec itpm-postgres-dev pg_isready -U postgres'
    );
    const isReady = result && result.includes('accepting connections');

    logCheck(
      'Database connection',
      isReady,
      isReady ? 'PostgreSQL 正在運行' : 'PostgreSQL 未就緒'
    );
  } catch (error) {
    logCheck(
      'Database connection',
      false,
      'PostgreSQL 容器未運行。請執行: docker-compose up -d postgres'
    );
  }
}

/**
 * 檢查端口是否被佔用
 */
function checkPorts() {
  const ports = [
    { port: 3000, service: 'Next.js 開發服務器' },
    { port: 5434, service: 'PostgreSQL' },
    { port: 6381, service: 'Redis' },
    { port: 1025, service: 'MailHog SMTP' },
    { port: 8025, service: 'MailHog Web UI' },
  ];

  ports.forEach(({ port, service }) => {
    const isListening = execCommand(
      process.platform === 'win32'
        ? `netstat -ano | findstr :${port}`
        : `lsof -i :${port}`
    );

    if (isListening && port === 3000) {
      logWarning(
        `Port ${port} (${service})`,
        '端口已被佔用。Next.js 將自動使用其他端口 (3001, 3002...)'
      );
    } else if (isListening && port !== 3000) {
      logCheck(
        `Port ${port} (${service})`,
        true,
        '服務正在運行'
      );
    }
  });
}

/**
 * 主函數
 */
async function main() {
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║    IT 專案流程管理平台 - 環境檢查                              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log('正在檢查開發環境...\n', 'blue');

  // 執行所有檢查
  checkNodeVersion();
  checkPnpm();
  checkDocker();
  checkEnvFile();
  checkNodeModules();
  checkPrismaClient();
  checkDockerServices();
  checkDatabaseConnection();
  checkPorts();

  // 總結
  log('\n╔════════════════════════════════════════════════════════════════╗', 'cyan');
  log('║    檢查總結                                                     ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════════╝\n', 'cyan');

  log(`✓ 通過: ${results.passed.length}`, 'green');
  log(`✗ 失敗: ${results.failed.length}`, 'red');
  log(`⚠ 警告: ${results.warnings.length}`, 'yellow');

  if (results.failed.length > 0) {
    log('\n失敗的檢查項目:', 'red');
    results.failed.forEach(({ name, details }) => {
      log(`  ✗ ${name}`, 'red');
      if (details) log(`    ${details}`, 'cyan');
    });
  }

  if (results.warnings.length > 0) {
    log('\n警告項目:', 'yellow');
    results.warnings.forEach(({ name, details }) => {
      log(`  ⚠ ${name}`, 'yellow');
      if (details) log(`    ${details}`, 'cyan');
    });
  }

  if (results.failed.length === 0) {
    log('\n✅ 環境檢查完成！您可以開始開發了。', 'green');
    log('   執行 pnpm dev 啟動開發服務器\n', 'cyan');
    process.exit(0);
  } else {
    log('\n❌ 環境配置存在問題，請根據上述提示進行修復。\n', 'red');
    process.exit(1);
  }
}

// 執行主函數
main().catch((error) => {
  log(`\n錯誤: ${error.message}`, 'red');
  process.exit(1);
});
