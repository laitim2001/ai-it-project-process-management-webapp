/**
 * 測試數據 Fixture
 * 提供可重用的測試數據
 */

import { generateRandomString, generateRandomEmail, getTodayDateString, getFutureDateString } from '../helpers/test-helpers';

/**
 * 項目測試數據
 */
export const projectTestData = {
  valid: {
    name: `Test Project ${generateRandomString(6)}`,
    description: 'This is a test project for E2E testing',
    startDate: getTodayDateString(),
    endDate: getFutureDateString(90),
  },
  invalid: {
    emptyName: '',
    negativeBudget: '-10000',
    invalidDates: {
      startDate: getFutureDateString(30),
      endDate: getTodayDateString(), // 結束日期早於開始日期
    },
  },
};

/**
 * 預算申請測試數據
 */
export const proposalTestData = {
  valid: {
    title: `Budget Proposal ${generateRandomString(6)}`,
    amount: '50000',
    description: 'Test budget proposal for E2E testing',
  },
  invalid: {
    emptyTitle: '',
    negativeAmount: '-10000',
    zeroAmount: '0',
    excessiveAmount: '999999999999',
  },
};

/**
 * 供應商測試數據
 */
export const vendorTestData = {
  valid: {
    name: `Test Vendor ${generateRandomString(6)}`,
    contactPerson: 'John Doe',
    email: generateRandomEmail(),
    phone: '+1234567890',
  },
  invalid: {
    emptyName: '',
    invalidEmail: 'not-an-email',
    duplicateName: 'Existing Vendor', // 假設已存在
  },
};

/**
 * 費用測試數據
 */
export const expenseTestData = {
  valid: {
    amount: '5000',
    expenseDate: getTodayDateString(),
    invoiceNumber: `INV-${generateRandomString(8)}`,
    description: 'Test expense for E2E testing',
  },
  invalid: {
    negativeAmount: '-1000',
    futureDate: getFutureDateString(7),
    emptyInvoiceNumber: '',
  },
};

/**
 * 用戶測試數據
 */
export const userTestData = {
  projectManager: {
    email: 'pm@example.com',
    password: 'password123',
    role: 'ProjectManager',
  },
  supervisor: {
    email: 'supervisor@example.com',
    password: 'password123',
    role: 'Supervisor',
  },
  admin: {
    email: 'admin@example.com',
    password: 'password123',
    role: 'Admin',
  },
};

/**
 * 文件上傳測試數據
 */
export const fileTestData = {
  validPDF: {
    name: 'test-invoice.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 100, // 100KB
  },
  validJPG: {
    name: 'test-receipt.jpg',
    mimeType: 'image/jpeg',
    size: 1024 * 200, // 200KB
  },
  invalidFormat: {
    name: 'malicious.exe',
    mimeType: 'application/x-msdownload',
    size: 1024 * 50,
  },
  tooLarge: {
    name: 'huge-file.pdf',
    mimeType: 'application/pdf',
    size: 1024 * 1024 * 15, // 15MB (超過 10MB 限制)
  },
};

/**
 * API 錯誤訊息
 */
export const apiErrorMessages = {
  serverError: '伺服器錯誤，請稍後重試',
  networkTimeout: '請求超時，請檢查網路連接',
  unauthorizedAccess: '未授權訪問',
  forbidden: '權限不足',
  notFound: '資源不存在',
  conflict: '此記錄已被其他用戶修改',
  validationError: '數據驗證失敗',
  databaseError: '系統暫時無法使用，請稍後再試',
};

/**
 * 表單驗證錯誤訊息
 */
export const validationMessages = {
  required: {
    name: '名稱為必填',
    title: '標題為必填',
    amount: '金額為必填',
    email: 'Email 為必填',
    budgetPool: '請選擇預算池',
    project: '請選擇項目',
    manager: '請選擇項目經理',
    supervisor: '請選擇主管',
  },
  format: {
    email: '請輸入有效的 Email 地址',
    phone: '請輸入有效的電話號碼',
    date: '請輸入有效的日期',
  },
  range: {
    amountPositive: '金額必須大於 0',
    amountMax: '金額不能超過',
    dateLogic: '結束日期必須晚於開始日期',
    dateNotFuture: '日期不能是未來日期',
  },
  uniqueness: {
    projectName: '項目名稱已存在',
    vendorName: '供應商名稱已存在',
    email: 'Email 已被使用',
  },
  file: {
    format: '只支持 PDF、JPG、PNG 格式',
    size: '文件大小不能超過 10MB',
  },
};
