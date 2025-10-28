/**
 * E2E 測試數據工廠
 *
 * 生成測試數據，使用 E2E_ 前綴便於識別和清理
 */

// 生成唯一時間戳
const timestamp = () => Date.now().toString().slice(-6);

/**
 * 預算池測試數據
 */
export const generateBudgetPoolData = () => ({
  name: `E2E_BudgetPool_${timestamp()}`,
  description: 'E2E 測試預算池',
  totalAmount: '1000000',
  financialYear: '2025',
  categories: [
    { categoryName: 'Hardware', categoryCode: 'HW', totalAmount: '400000' },
    { categoryName: 'Software', categoryCode: 'SW', totalAmount: '300000' },
    { categoryName: 'Services', categoryCode: 'SV', totalAmount: '300000' },
  ],
});

/**
 * 項目測試數據
 */
export const generateProjectData = () => ({
  name: `E2E_Project_${timestamp()}`,
  description: 'E2E 測試項目',
  startDate: new Date().toISOString().split('T')[0],
  endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  requestedBudget: '100000',
});

/**
 * 預算提案測試數據
 */
export const generateProposalData = () => ({
  title: `E2E_Proposal_${timestamp()}`,
  amount: '50000',
  description: 'E2E 測試預算提案',
});

/**
 * 供應商測試數據
 */
export const generateVendorData = () => ({
  name: `E2E_Vendor_${timestamp()}`,
  contactName: 'Test Contact',
  email: `e2e-vendor-${timestamp()}@example.com`,
  phone: '+852 1234 5678',
  address: 'Test Address, Hong Kong',
});

/**
 * 採購訂單測試數據
 */
export const generatePurchaseOrderData = () => ({
  poNumber: `E2E-PO-${timestamp()}`,
  poDate: new Date().toISOString().split('T')[0],
  deliveryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  totalAmount: '50000',
});

/**
 * 費用測試數據
 */
export const generateExpenseData = () => ({
  name: `E2E_Expense_${timestamp()}`,
  description: 'E2E 測試費用',
  totalAmount: '30000',
  expenseDate: new Date().toISOString().split('T')[0],
  invoiceNumber: `E2E-INV-${timestamp()}`,
  requiresChargeOut: true,
});

/**
 * ChargeOut 測試數據
 */
export const generateChargeOutData = () => ({
  name: `E2E_ChargeOut_${timestamp()}`,
  description: 'E2E 測試費用轉嫁',
});

/**
 * 測試用戶憑證
 */
export const testUsers = {
  manager: {
    email: 'test-manager@example.com',
    password: 'testpassword123',
  },
  supervisor: {
    email: 'test-supervisor@example.com',
    password: 'testpassword123',
  },
};

/**
 * 等待助手函數
 */
export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 格式化貨幣
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-HK', {
    style: 'currency',
    currency: 'HKD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
