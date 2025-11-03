const fs = require('fs');
const path = require('path');

// 讀取繁體中文翻譯檔案
const zhTW = require('../apps/web/src/messages/zh-TW.json');

// 翻譯對照表（繁體中文 → 英文）
const translationMap = {
  // Common actions
  '儲存': 'Save',
  '取消': 'Cancel',
  '刪除': 'Delete',
  '編輯': 'Edit',
  '新增': 'Create',
  '提交': 'Submit',
  '搜尋': 'Search',
  '篩選': 'Filter',
  '匯出': 'Export',
  '匯入': 'Import',
  '確認': 'Confirm',
  '返回': 'Back',
  '下一步': 'Next',
  '上一步': 'Previous',
  '關閉': 'Close',
  '是': 'Yes',
  '否': 'No',
  '查看': 'View',
  '查看全部': 'View All',
  '下載': 'Download',
  '上傳': 'Upload',
  '批准': 'Approve',
  '駁回': 'Reject',
  '撤回': 'Withdraw',
  '要求更多資訊': 'Request More Info',
  '重新整理': 'Refresh',

  // Common status
  '草稿': 'Draft',
  '待審批': 'Pending Approval',
  '已批准': 'Approved',
  '已駁回': 'Rejected',
  '需要更多資訊': 'More Info Required',
  '已完成': 'Completed',
  '已支付': 'Paid',
  '已取消': 'Cancelled',
  '進行中': 'Active',
  '非活動': 'Inactive',

  // Loading states
  '載入中...': 'Loading...',
  '儲存中...': 'Saving...',
  '提交中...': 'Submitting...',
  '處理中...': 'Processing...',
  '發生錯誤': 'An error occurred',
  '操作成功': 'Operation successful',
  '無資料': 'No data',
  '無搜尋結果': 'No results found',
  '請選擇': 'Please select',
  '搜尋...': 'Search...',
  '必填': 'Required',
  '選填': 'Optional',
  '全部': 'All',

  // Pagination
  '頁': 'Page',
  '共': 'of',
  '每頁顯示': 'Rows per page',
  '顯示': 'Showing',
  '至': 'to',
  '筆資料': 'entries',

  // Date
  '今天': 'Today',
  '昨天': 'Yesterday',
  '上週': 'Last Week',
  '上月': 'Last Month',
  '本月': 'This Month',
  '今年': 'This Year',
  '開始日期': 'Start Date',
  '結束日期': 'End Date',

  // Navigation
  'IT 專案管理': 'IT Project Management',
  '流程平台': 'Process Platform',
  '概覽': 'Overview',
  '專案與預算': 'Project & Budget',
  '採購管理': 'Procurement',
  '系統管理': 'System Admin',
  '儀表板': 'Dashboard',
  '專案管理': 'Projects',
  '預算提案': 'Budget Proposals',
  '預算池': 'Budget Pools',
  '供應商': 'Vendors',
  '報價單': 'Quotes',
  '採購單': 'Purchase Orders',
  '費用記錄': 'Expenses',
  'OM 費用': 'OM Expenses',
  '費用轉嫁': 'Charge Outs',
  '用戶管理': 'Users',
  '通知': 'Notifications',
  '系統設定': 'Settings',
  '幫助中心': 'Help Center',

  // Navigation descriptions
  '專案總覽和關鍵指標': 'Project overview and key metrics',
  '專案資料和進度管理': 'Project data and progress management',
  '預算提案申請與審批': 'Budget proposal submission and approval',
  '年度預算分配管理': 'Annual budget allocation management',
  '供應商資料管理': 'Vendor data management',
  '供應商報價管理': 'Vendor quote management',
  '採購訂單追蹤': 'Purchase order tracking',
  '費用發票與核銷': 'Expense invoice and reimbursement',
  '操作與維護費用管理': 'Operation and maintenance expense management',
  'ChargeOut 費用轉嫁管理': 'ChargeOut expense transfer management',
  '用戶帳號和權限': 'User accounts and permissions',
  '系統參數設定': 'System parameters settings',
  '使用指南和支援': 'User guide and support',

  // User navigation
  '個人資料': 'Profile',
  '登出': 'Logout',
  '角色': 'Role',
  '在線': 'Online',
  '離線': 'Offline',

  // Auth - Login
  '登入': 'Login',
  '歡迎回到 IT 專案管理平台': 'Welcome back to IT Project Management Platform',
  '電子郵件': 'Email',
  '密碼': 'Password',
  '記住我': 'Remember me',
  '忘記密碼？': 'Forgot password?',
  '還沒有帳號？': "Don't have an account?",
  '註冊': 'Sign up',
  '或使用以下方式登入': 'Or login with',
  '登入中...': 'Logging in...',

  // Auth - Register
  '建立您的帳號': 'Create your account',
  '姓名': 'Name',
  '確認密碼': 'Confirm password',
  '已有帳號？': 'Already have an account?',
  '註冊中...': 'Registering...',

  // Auth - Forgot Password
  '忘記密碼': 'Forgot Password',
  '輸入您的電子郵件以重設密碼': 'Enter your email to reset password',
  '發送重設連結': 'Send Reset Link',
  '返回登入': 'Back to Login',
  '發送中...': 'Sending...',
  '重設連結已發送至您的信箱': 'Reset link sent to your email',

  // Dashboard
  '歡迎回來！查看您的專案進度和最新動態': 'Welcome back! View your project progress and latest updates',
  '本月預算額': 'Monthly Budget',
  '較上月': 'vs last month',
  '進行中項目': 'Active Projects',
  '待審批提案': 'Pending Proposals',
  '預算執行率': 'Budget Utilization',
  '預算趨勢': 'Budget Trends',
  '近 6 個月': 'Last 6 Months',
  '近 3 個月': 'Last 3 Months',
  '月增長率': 'Monthly Growth Rate',
  '總提案數': 'Total Proposals',
  '快速操作': 'Quick Actions',
  '常用功能快捷入口': 'Shortcuts to commonly used features',
  '新增專案': 'New Project',
  '建立新的 IT 專案': 'Create a new IT project',
  '建立提案': 'New Proposal',
  '提交預算提案申請': 'Submit a budget proposal',
  '新增預算池': 'New Budget Pool',
  '創建財政年度預算池': 'Create a fiscal year budget pool',
  '供應商管理': 'Manage Vendors',
  '管理供應商資料': 'Manage vendor data',
  '查看採購單': 'View Purchase Orders',
  '檢視採購訂單狀態': 'Check purchase order status',
  '費用記錄': 'Record Expense',
  '記錄專案費用支出': 'Record project expense',
  '最近活動': 'Recent Activities',
  '小時前': 'hour ago',
  '天前': 'day ago',
  'AI 洞察': 'AI Insights',
  '基於數據分析的智能建議': 'Intelligent suggestions based on data analysis',
  '信心度': 'Confidence',
  '查看詳情': 'View Details',
  '今日統計': "Today's Stats",
  '待處理提案': 'Pending Proposals',
  '今日會議': 'Meetings Today',
};

// 遞迴翻譯函數
function translateObject(obj) {
  if (typeof obj === 'string') {
    // 直接翻譯字符串
    return translationMap[obj] || obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(translateObject);
  }

  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    for (const [key, value] of Object.entries(obj)) {
      result[key] = translateObject(value);
    }
    return result;
  }

  return obj;
}

// 生成英文翻譯
const en = translateObject(zhTW);

// 寫入檔案
const enPath = path.join(__dirname, '../apps/web/src/messages/en.json');
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), 'utf-8');

console.log('✅ English translation file generated successfully!');
console.log(`📁 Output: ${enPath}`);
