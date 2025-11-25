#!/usr/bin/env node

/**
 * 添加 auth.login.errors 翻譯 keys
 *
 * 此腳本為 en.json 和 zh-TW.json 添加缺失的 auth.login.errors 翻譯
 */

const fs = require('fs');
const path = require('path');

// 文件路徑
const enPath = path.join(__dirname, '../apps/web/src/messages/en.json');
const zhTWPath = path.join(__dirname, '../apps/web/src/messages/zh-TW.json');

// 定義要添加的 errors 翻譯
const loginErrors = {
  en: {
    invalidCredentials: "Invalid email or password",
    configurationError: "System configuration error, please contact administrator",
    accessDenied: "Access denied",
    verificationRequired: "Email verification required",
    loginFailed: "Login failed, please try again",
    emailRequired: "Please enter your email",
    passwordRequired: "Please enter your password",
    emailPasswordRequired: "Please enter your email and password",
    invalidEmailFormat: "Invalid email format",
    passwordTooShort: "Password must be at least 8 characters",
    accountLocked: "Account is locked, please contact administrator",
    accountDisabled: "Account is disabled",
    sessionExpired: "Session expired, please login again"
  },
  zhTW: {
    invalidCredentials: "電子郵件或密碼錯誤",
    configurationError: "系統配置錯誤，請聯絡管理員",
    accessDenied: "存取被拒絕",
    verificationRequired: "需要電子郵件驗證",
    loginFailed: "登入失敗，請重試",
    emailRequired: "請輸入電子郵件",
    passwordRequired: "請輸入密碼",
    emailPasswordRequired: "請輸入電子郵件和密碼",
    invalidEmailFormat: "電子郵件格式無效",
    passwordTooShort: "密碼長度至少 8 個字元",
    accountLocked: "帳號已被鎖定，請聯絡管理員",
    accountDisabled: "帳號已被停用",
    sessionExpired: "登入階段已過期，請重新登入"
  }
};

/**
 * 添加 errors 到 auth.login 部分
 */
function addLoginErrors(filePath, errorTranslations, locale) {
  console.log(`\n處理 ${locale} 翻譯文件: ${filePath}`);

  // 讀取現有文件
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(fileContent);

  // 檢查 auth.login 是否存在
  if (!data.auth || !data.auth.login) {
    console.error(`❌ 錯誤: auth.login 部分不存在於 ${filePath}`);
    return false;
  }

  // 檢查是否已有 errors 部分
  if (data.auth.login.errors) {
    console.log(`⚠️  警告: auth.login.errors 已存在，將合併新的翻譯`);
    // 合併現有和新的 errors
    data.auth.login.errors = {
      ...data.auth.login.errors,
      ...errorTranslations
    };
  } else {
    // 添加 errors 部分
    data.auth.login.errors = errorTranslations;
  }

  // 寫回文件（使用 2 空格縮排）
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  console.log(`✅ 成功添加 ${Object.keys(errorTranslations).length} 個錯誤翻譯 keys`);
  return true;
}

/**
 * 主函數
 */
function main() {
  console.log('='.repeat(60));
  console.log('添加 auth.login.errors 翻譯 Keys');
  console.log('='.repeat(60));

  let success = true;

  // 處理 en.json
  if (fs.existsSync(enPath)) {
    if (!addLoginErrors(enPath, loginErrors.en, 'en')) {
      success = false;
    }
  } else {
    console.error(`❌ 文件不存在: ${enPath}`);
    success = false;
  }

  // 處理 zh-TW.json
  if (fs.existsSync(zhTWPath)) {
    if (!addLoginErrors(zhTWPath, loginErrors.zhTW, 'zh-TW')) {
      success = false;
    }
  } else {
    console.error(`❌ 文件不存在: ${zhTWPath}`);
    success = false;
  }

  console.log('\n' + '='.repeat(60));
  if (success) {
    console.log('✅ 所有翻譯文件已成功更新');
    console.log('\n下一步：');
    console.log('1. 檢查翻譯文件的格式正確性: pnpm validate:i18n');
    console.log('2. 清除 Next.js 快取: rm -rf apps/web/.next');
    console.log('3. 重啟開發伺服器測試: pnpm dev');
  } else {
    console.log('❌ 發生錯誤，請檢查上面的錯誤訊息');
    process.exit(1);
  }
  console.log('='.repeat(60));
}

// 執行
main();
