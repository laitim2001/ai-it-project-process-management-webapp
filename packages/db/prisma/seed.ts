/**
 * Database Seed Script
 *
 * 創建初始資料供開發和測試使用
 * 執行方式: pnpm db:seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 開始資料庫種子數據...');

  // 1. 創建角色 (Roles)
  console.log('📝 創建角色...');
  const adminRole = await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: {
      name: 'Admin',
    },
  });

  const pmRole = await prisma.role.upsert({
    where: { name: 'ProjectManager' },
    update: {},
    create: {
      name: 'ProjectManager',
    },
  });

  const supervisorRole = await prisma.role.upsert({
    where: { name: 'Supervisor' },
    update: {},
    create: {
      name: 'Supervisor',
    },
  });

  console.log('✅ 角色創建完成');

  // 1.3 FEAT-011: 創建菜單權限 (Menu Permissions)
  console.log('🔐 創建菜單權限...');

  const menuPermissions = [
    // Overview (1)
    { code: 'menu:dashboard', name: '儀表板', category: 'menu', sortOrder: 100, description: '訪問儀表板頁面' },

    // Project Budget (3)
    { code: 'menu:budget-pools', name: '預算池', category: 'menu', sortOrder: 200, description: '訪問預算池管理頁面' },
    { code: 'menu:projects', name: '專案', category: 'menu', sortOrder: 210, description: '訪問專案管理頁面' },
    { code: 'menu:proposals', name: '提案', category: 'menu', sortOrder: 220, description: '訪問預算提案頁面' },

    // Procurement (7)
    { code: 'menu:vendors', name: '供應商', category: 'menu', sortOrder: 300, description: '訪問供應商管理頁面' },
    { code: 'menu:quotes', name: '報價單', category: 'menu', sortOrder: 310, description: '訪問報價單頁面' },
    { code: 'menu:purchase-orders', name: '採購單', category: 'menu', sortOrder: 320, description: '訪問採購單管理頁面' },
    { code: 'menu:expenses', name: '費用', category: 'menu', sortOrder: 330, description: '訪問費用管理頁面' },
    { code: 'menu:om-expenses', name: 'OM 費用', category: 'menu', sortOrder: 340, description: '訪問 OM 費用管理頁面' },
    { code: 'menu:om-summary', name: 'OM 總覽', category: 'menu', sortOrder: 350, description: '訪問 OM 總覽報表頁面' },
    { code: 'menu:charge-outs', name: '費用轉嫁', category: 'menu', sortOrder: 360, description: '訪問費用轉嫁管理頁面' },

    // System (6)
    { code: 'menu:users', name: '用戶管理', category: 'menu', sortOrder: 400, description: '訪問用戶管理頁面' },
    { code: 'menu:operating-companies', name: '營運公司', category: 'menu', sortOrder: 410, description: '訪問營運公司管理頁面' },
    { code: 'menu:om-expense-categories', name: 'OM 費用類別', category: 'menu', sortOrder: 420, description: '訪問 OM 費用類別管理頁面' },
    { code: 'menu:currencies', name: '幣別', category: 'menu', sortOrder: 430, description: '訪問幣別管理頁面' },
    { code: 'menu:data-import', name: 'OM 數據導入', category: 'menu', sortOrder: 440, description: '訪問 OM 數據導入頁面' },
    { code: 'menu:project-data-import', name: '專案數據導入', category: 'menu', sortOrder: 450, description: '訪問專案數據導入頁面' },

    // Settings (1)
    { code: 'menu:settings', name: '設定', category: 'menu', sortOrder: 500, description: '訪問個人設定頁面' },
  ];

  // 創建權限記錄
  const permissionRecords: Record<string, { id: string }> = {};
  for (const perm of menuPermissions) {
    const permission = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        name: perm.name,
        category: perm.category,
        sortOrder: perm.sortOrder,
        description: perm.description,
      },
      create: {
        code: perm.code,
        name: perm.name,
        category: perm.category,
        sortOrder: perm.sortOrder,
        description: perm.description,
        isActive: true,
      },
    });
    permissionRecords[perm.code] = permission;
  }

  console.log(`✅ 菜單權限創建完成 (${menuPermissions.length} 個權限)`);

  // 1.4 FEAT-011: 創建角色預設權限 (Role Default Permissions)
  console.log('🔐 配置角色預設權限...');

  // 定義角色預設權限映射
  const rolePermissionMapping: Record<string, string[]> = {
    // Admin: 所有權限
    Admin: menuPermissions.map((p) => p.code),

    // Supervisor: 除用戶管理外的所有權限
    Supervisor: menuPermissions.filter((p) => p.code !== 'menu:users').map((p) => p.code),

    // ProjectManager: 核心業務功能權限 (不含系統管理類)
    ProjectManager: [
      'menu:dashboard',
      'menu:budget-pools',
      'menu:projects',
      'menu:proposals',
      'menu:vendors',
      'menu:quotes',
      'menu:purchase-orders',
      'menu:expenses',
      'menu:om-expenses',
      'menu:om-summary',
      'menu:settings',
    ],
  };

  // 獲取所有角色
  const roles = await prisma.role.findMany();

  // 為每個角色配置預設權限
  for (const role of roles) {
    const permCodes = rolePermissionMapping[role.name] || [];

    for (const code of permCodes) {
      const permission = permissionRecords[code];
      if (permission) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: {},
          create: {
            roleId: role.id,
            permissionId: permission.id,
          },
        });
      }
    }

    console.log(`  ✅ ${role.name}: ${permCodes.length} 個權限`);
  }

  console.log('✅ 角色預設權限配置完成');

  // 1.5 CHANGE-003: 創建統一費用類別 (Expense Categories)
  console.log('📂 創建費用類別...');

  const expenseCategories = [
    { code: 'HW', name: '硬體', description: '硬體設備、伺服器、工作站等', sortOrder: 1 },
    { code: 'SW', name: '軟體', description: '軟體授權、應用程式購買', sortOrder: 2 },
    { code: 'SV', name: '服務', description: '顧問服務、技術支援、實施服務', sortOrder: 3 },
    { code: 'MAINT', name: '維護', description: '設備維護、系統維護、保固延長', sortOrder: 4 },
    { code: 'LICENSE', name: '授權', description: '軟體授權續約、訂閱費用', sortOrder: 5 },
    { code: 'CLOUD', name: '雲端', description: '雲端服務、IaaS/PaaS/SaaS 費用', sortOrder: 6 },
    { code: 'TELECOM', name: '電信', description: '網路費用、電話費、通訊服務', sortOrder: 7 },
    { code: 'OTHER', name: '其他', description: '其他未分類費用', sortOrder: 99 },
  ];

  for (const category of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { code: category.code },
      update: {},
      create: {
        code: category.code,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
        isActive: true,
      },
    });
  }

  console.log('✅ 費用類別創建完成 (8 個類別)');

  // 2. 創建測試用戶 (Users)
  console.log('👤 創建測試用戶...');

  const adminPassword = await bcrypt.hash('admin123', 10);
  const pmPassword = await bcrypt.hash('pm123', 10);
  const supervisorPassword = await bcrypt.hash('supervisor123', 10);

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@itpm.local' },
    update: {},
    create: {
      email: 'admin@itpm.local',
      name: '系統管理員',
      password: adminPassword,
      roleId: adminRole.id,
    },
  });

  const pmUser = await prisma.user.upsert({
    where: { email: 'pm@itpm.local' },
    update: {},
    create: {
      email: 'pm@itpm.local',
      name: '專案經理 - 張三',
      password: pmPassword,
      roleId: pmRole.id,
    },
  });

  const supervisorUser = await prisma.user.upsert({
    where: { email: 'supervisor@itpm.local' },
    update: {},
    create: {
      email: 'supervisor@itpm.local',
      name: '主管 - 李四',
      password: supervisorPassword,
      roleId: supervisorRole.id,
    },
  });

  console.log('✅ 測試用戶創建完成');

  // 3. 創建預算池 (Budget Pools)
  console.log('💰 創建預算池...');

  const budgetPool2024 = await prisma.budgetPool.upsert({
    where: { id: 'bp-2024-it' },
    update: {},
    create: {
      id: 'bp-2024-it',
      name: '2024 IT 部門預算池',
      totalAmount: 5000000,
      financialYear: 2024,
    },
  });

  const budgetPool2025 = await prisma.budgetPool.upsert({
    where: { id: 'bp-2025-it' },
    update: {},
    create: {
      id: 'bp-2025-it',
      name: '2025 IT 部門預算池',
      totalAmount: 6000000,
      financialYear: 2025,
    },
  });

  console.log('✅ 預算池創建完成');

  // 4. 創建示範專案 (Projects)
  console.log('📂 創建示範專案...');

  const project1 = await prisma.project.upsert({
    where: { id: 'proj-erp-upgrade' },
    update: {},
    create: {
      id: 'proj-erp-upgrade',
      projectCode: 'PRJ-2024-ERP-001', // FEAT-001: 必填專案編號
      name: 'ERP 系統升級專案',
      description: '將現有 ERP 系統升級至最新版本，包含模組更新和數據遷移',
      status: 'InProgress',
      globalFlag: 'Region', // FEAT-001: 全域標誌
      priority: 'High', // FEAT-001: 優先權
      managerId: pmUser.id,
      supervisorId: supervisorUser.id,
      budgetPoolId: budgetPool2024.id,
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-12-31'),
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: 'proj-cloud-migration' },
    update: {},
    create: {
      id: 'proj-cloud-migration',
      projectCode: 'PRJ-2025-CLD-001', // FEAT-001: 必填專案編號
      name: '雲端遷移專案',
      description: '將核心業務系統遷移至 Azure 雲平台',
      status: 'Draft',
      globalFlag: 'RCL', // FEAT-001: 全域標誌
      priority: 'Medium', // FEAT-001: 優先權
      managerId: pmUser.id,
      supervisorId: supervisorUser.id,
      budgetPoolId: budgetPool2025.id,
      startDate: new Date('2025-03-01'),
    },
  });

  console.log('✅ 示範專案創建完成');

  // 5. 創建供應商 (Vendors)
  console.log('🏢 創建供應商...');

  const vendor1 = await prisma.vendor.upsert({
    where: { name: 'Microsoft Taiwan' },
    update: {},
    create: {
      name: 'Microsoft Taiwan',
      contactPerson: '王小明',
      contactEmail: 'contact@microsoft.com.tw',
      phone: '02-1234-5678',
    },
  });

  const vendor2 = await prisma.vendor.upsert({
    where: { name: 'Dell Technologies' },
    update: {},
    create: {
      name: 'Dell Technologies',
      contactPerson: '陳大華',
      contactEmail: 'sales@dell.com.tw',
      phone: '02-8765-4321',
    },
  });

  console.log('✅ 供應商創建完成');

  // 6. 創建預算提案 (Budget Proposals) - 涵蓋所有審批工作流狀態
  console.log('📝 創建預算提案...');

  // 提案 1: Draft 狀態 - 草稿中
  const proposal1 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-draft-001' },
    update: {},
    create: {
      id: 'proposal-draft-001',
      title: 'ERP 系統升級第一期預算提案',
      amount: 1200000,
      status: 'Draft',
      projectId: project1.id,
    },
  });

  // 提案 2: PendingApproval 狀態 - 待審批
  const proposal2 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-pending-001' },
    update: {},
    create: {
      id: 'proposal-pending-001',
      title: 'ERP 系統升級第二期預算提案',
      amount: 800000,
      status: 'PendingApproval',
      projectId: project1.id,
    },
  });

  // 提案 3: Approved 狀態 - 已批准
  const proposal3 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-approved-001' },
    update: {},
    create: {
      id: 'proposal-approved-001',
      title: 'ERP 數據遷移專項預算',
      amount: 500000,
      status: 'Approved',
      projectId: project1.id,
    },
  });

  // 提案 4: Rejected 狀態 - 已拒絕
  const proposal4 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-rejected-001' },
    update: {},
    create: {
      id: 'proposal-rejected-001',
      title: 'ERP 額外培訓預算申請',
      amount: 300000,
      status: 'Rejected',
      projectId: project1.id,
    },
  });

  // 提案 5: MoreInfoRequired 狀態 - 需更多資訊
  const proposal5 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-moreinfo-001' },
    update: {},
    create: {
      id: 'proposal-moreinfo-001',
      title: 'ERP 系統整合測試環境建置',
      amount: 400000,
      status: 'MoreInfoRequired',
      projectId: project1.id,
    },
  });

  // 提案 6: 雲端遷移專案的提案 - Draft
  const proposal6 = await prisma.budgetProposal.upsert({
    where: { id: 'proposal-cloud-001' },
    update: {},
    create: {
      id: 'proposal-cloud-001',
      title: 'Azure 雲平台基礎架構建置',
      amount: 2500000,
      status: 'Draft',
      projectId: project2.id,
    },
  });

  console.log('✅ 預算提案創建完成');

  // 7. 創建審批歷史記錄 (History)
  console.log('📚 創建審批歷史記錄...');

  // 提案 2 的歷史：Draft → PendingApproval (已提交)
  await prisma.history.upsert({
    where: { id: 'history-001' },
    update: {},
    create: {
      id: 'history-001',
      action: 'SUBMITTED',
      details: '提案已提交審批',
      userId: pmUser.id,
      budgetProposalId: proposal2.id,
      createdAt: new Date('2024-10-01T09:00:00Z'),
    },
  });

  // 提案 3 的歷史：Draft → PendingApproval → Approved
  await prisma.history.upsert({
    where: { id: 'history-002' },
    update: {},
    create: {
      id: 'history-002',
      action: 'SUBMITTED',
      details: '提案已提交審批',
      userId: pmUser.id,
      budgetProposalId: proposal3.id,
      createdAt: new Date('2024-09-15T10:00:00Z'),
    },
  });

  await prisma.history.upsert({
    where: { id: 'history-003' },
    update: {},
    create: {
      id: 'history-003',
      action: 'APPROVED',
      details: '預算合理，數據遷移方案完善，批准執行',
      userId: supervisorUser.id,
      budgetProposalId: proposal3.id,
      createdAt: new Date('2024-09-16T14:30:00Z'),
    },
  });

  // 提案 4 的歷史：Draft → PendingApproval → Rejected
  await prisma.history.upsert({
    where: { id: 'history-004' },
    update: {},
    create: {
      id: 'history-004',
      action: 'SUBMITTED',
      details: '提案已提交審批',
      userId: pmUser.id,
      budgetProposalId: proposal4.id,
      createdAt: new Date('2024-09-20T11:00:00Z'),
    },
  });

  await prisma.history.upsert({
    where: { id: 'history-005' },
    update: {},
    create: {
      id: 'history-005',
      action: 'REJECTED',
      details: '培訓預算超出必要範圍，建議縮減至基礎培訓部分',
      userId: supervisorUser.id,
      budgetProposalId: proposal4.id,
      createdAt: new Date('2024-09-21T16:00:00Z'),
    },
  });

  // 提案 5 的歷史：Draft → PendingApproval → MoreInfoRequired
  await prisma.history.upsert({
    where: { id: 'history-006' },
    update: {},
    create: {
      id: 'history-006',
      action: 'SUBMITTED',
      details: '提案已提交審批',
      userId: pmUser.id,
      budgetProposalId: proposal5.id,
      createdAt: new Date('2024-10-02T09:30:00Z'),
    },
  });

  await prisma.history.upsert({
    where: { id: 'history-007' },
    update: {},
    create: {
      id: 'history-007',
      action: 'MORE_INFO_REQUIRED',
      details: '請補充測試環境的詳細配置規格和使用期限說明',
      userId: supervisorUser.id,
      budgetProposalId: proposal5.id,
      createdAt: new Date('2024-10-03T15:00:00Z'),
    },
  });

  console.log('✅ 審批歷史記錄創建完成');

  // 8. 創建評論 (Comments)
  console.log('💬 創建評論...');

  // 提案 2 的評論 (待審批中)
  await prisma.comment.upsert({
    where: { id: 'comment-001' },
    update: {},
    create: {
      id: 'comment-001',
      content: '此階段主要涵蓋核心模組升級，預算已包含軟體授權和技術支援費用',
      userId: pmUser.id,
      budgetProposalId: proposal2.id,
      createdAt: new Date('2024-10-01T09:15:00Z'),
    },
  });

  // 提案 3 的評論 (已批准)
  await prisma.comment.upsert({
    where: { id: 'comment-002' },
    update: {},
    create: {
      id: 'comment-002',
      content: '數據遷移計劃詳細，包含完整的測試和驗證流程',
      userId: pmUser.id,
      budgetProposalId: proposal3.id,
      createdAt: new Date('2024-09-15T10:30:00Z'),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment-003' },
    update: {},
    create: {
      id: 'comment-003',
      content: '方案完善，建議按計劃執行。請注意數據備份安全。',
      userId: supervisorUser.id,
      budgetProposalId: proposal3.id,
      createdAt: new Date('2024-09-16T14:30:00Z'),
    },
  });

  // 提案 4 的評論 (已拒絕)
  await prisma.comment.upsert({
    where: { id: 'comment-004' },
    update: {},
    create: {
      id: 'comment-004',
      content: '包含進階培訓課程和認證考試費用，提升團隊專業能力',
      userId: pmUser.id,
      budgetProposalId: proposal4.id,
      createdAt: new Date('2024-09-20T11:15:00Z'),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment-005' },
    update: {},
    create: {
      id: 'comment-005',
      content: '基礎培訓已足夠，進階認證可在明年度再評估',
      userId: supervisorUser.id,
      budgetProposalId: proposal4.id,
      createdAt: new Date('2024-09-21T16:00:00Z'),
    },
  });

  // 提案 5 的評論 (需更多資訊)
  await prisma.comment.upsert({
    where: { id: 'comment-006' },
    update: {},
    create: {
      id: 'comment-006',
      content: '測試環境將用於整合測試，預計使用6個月',
      userId: pmUser.id,
      budgetProposalId: proposal5.id,
      createdAt: new Date('2024-10-02T10:00:00Z'),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment-007' },
    update: {},
    create: {
      id: 'comment-007',
      content: '請提供詳細的硬體配置清單和軟體授權需求',
      userId: supervisorUser.id,
      budgetProposalId: proposal5.id,
      createdAt: new Date('2024-10-03T15:00:00Z'),
    },
  });

  await prisma.comment.upsert({
    where: { id: 'comment-008' },
    update: {},
    create: {
      id: 'comment-008',
      content: '已補充詳細配置清單，請參閱附件文檔',
      userId: pmUser.id,
      budgetProposalId: proposal5.id,
      createdAt: new Date('2024-10-04T09:00:00Z'),
    },
  });

  console.log('✅ 評論創建完成');

  // ========================================
  // Epic 5: 供應商與採購管理種子數據
  // ========================================

  console.log('🏢 創建更多供應商...');

  // 供應商: Microsoft 台灣分公司
  const vendorMS = await prisma.vendor.upsert({
    where: { name: 'Microsoft 台灣分公司' },
    update: {},
    create: {
      name: 'Microsoft 台灣分公司',
      contactPerson: '王大明',
      contactEmail: 'david.wang@microsoft.com',
      phone: '02-1234-5678',
    },
  });

  // 供應商: IBM 台灣
  const vendorIBM = await prisma.vendor.upsert({
    where: { name: 'IBM 台灣國際商業機器股份有限公司' },
    update: {},
    create: {
      name: 'IBM 台灣國際商業機器股份有限公司',
      contactPerson: '李小華',
      contactEmail: 'lisa.lee@ibm.com',
      phone: '02-2345-6789',
    },
  });

  // 供應商: Oracle 台灣
  const vendorOracle = await prisma.vendor.upsert({
    where: { name: 'Oracle 甲骨文台灣分公司' },
    update: {},
    create: {
      name: 'Oracle 甲骨文台灣分公司',
      contactPerson: '張志明',
      contactEmail: 'james.chang@oracle.com',
      phone: '02-3456-7890',
    },
  });

  // 供應商: 本地系統整合商
  const vendorLocal = await prisma.vendor.upsert({
    where: { name: '台灣資訊系統整合股份有限公司' },
    update: {},
    create: {
      name: '台灣資訊系統整合股份有限公司',
      contactPerson: '陳美玲',
      contactEmail: 'mary.chen@twsi.com.tw',
      phone: '02-4567-8901',
    },
  });

  // 供應商: 雲端服務商
  const vendorAWS = await prisma.vendor.upsert({
    where: { name: 'Amazon Web Services 台灣' },
    update: {},
    create: {
      name: 'Amazon Web Services 台灣',
      contactPerson: '林志偉',
      contactEmail: 'william.lin@aws.com',
      phone: '02-5678-9012',
    },
  });

  console.log('✅ 更多供應商創建完成');

  console.log('📄 創建報價單...');

  // 專案 1 (ERP系統升級) 的報價單 - 已批准的專案
  // 報價 1: Microsoft 的報價
  const quoteERPMS = await prisma.quote.upsert({
    where: { id: 'quote-erp-ms-001' },
    update: {},
    create: {
      id: 'quote-erp-ms-001',
      projectId: project1.id,
      vendorId: vendorMS.id,
      amount: 1200000,
      filePath: '/uploads/quotes/erp-microsoft-quote.pdf',
      uploadDate: new Date('2024-10-05T10:00:00Z'),
    },
  });

  // 報價 2: IBM 的報價
  const quoteERPIBM = await prisma.quote.upsert({
    where: { id: 'quote-erp-ibm-001' },
    update: {},
    create: {
      id: 'quote-erp-ibm-001',
      projectId: project1.id,
      vendorId: vendorIBM.id,
      amount: 1350000,
      filePath: '/uploads/quotes/erp-ibm-quote.pdf',
      uploadDate: new Date('2024-10-05T14:00:00Z'),
    },
  });

  // 報價 3: Oracle 的報價
  const quoteERPOracle = await prisma.quote.upsert({
    where: { id: 'quote-erp-oracle-001' },
    update: {},
    create: {
      id: 'quote-erp-oracle-001',
      projectId: project1.id,
      vendorId: vendorOracle.id,
      amount: 1280000,
      filePath: '/uploads/quotes/erp-oracle-quote.pdf',
      uploadDate: new Date('2024-10-06T09:00:00Z'),
    },
  });

  // 專案 2 (雲端基礎設施擴容) 的報價單
  // 報價 4: AWS 的報價
  const quoteCloudAWS = await prisma.quote.upsert({
    where: { id: 'quote-cloud-aws-001' },
    update: {},
    create: {
      id: 'quote-cloud-aws-001',
      projectId: project2.id,
      vendorId: vendorAWS.id,
      amount: 750000,
      filePath: '/uploads/quotes/cloud-aws-quote.pdf',
      uploadDate: new Date('2024-10-07T11:00:00Z'),
    },
  });

  // 報價 5: 本地整合商的雲端方案報價
  const quoteCloudLocal = await prisma.quote.upsert({
    where: { id: 'quote-cloud-local-001' },
    update: {},
    create: {
      id: 'quote-cloud-local-001',
      projectId: project2.id,
      vendorId: vendorLocal.id,
      amount: 820000,
      filePath: '/uploads/quotes/cloud-local-quote.pdf',
      uploadDate: new Date('2024-10-07T15:00:00Z'),
    },
  });

  console.log('✅ 報價單創建完成');

  console.log('📋 創建採購單...');

  // 為專案 1 (ERP系統升級) 創建採購單 - 選擇了 Microsoft 的報價 (最低價)
  const purchaseOrderERP = await prisma.purchaseOrder.upsert({
    where: { id: 'po-erp-001' },
    update: {},
    create: {
      id: 'po-erp-001',
      poNumber: 'PO-2024-ERP-001',
      name: 'ERP 系統升級採購單',
      description: 'Microsoft ERP 系統升級專案採購單',
      projectId: project1.id,
      vendorId: vendorMS.id,
      quoteId: quoteERPMS.id, // 關聯到 Microsoft 的報價
      totalAmount: 1200000,
      date: new Date('2024-10-08T10:00:00Z'),
    },
  });

  console.log('✅ 採購單創建完成');

  // ========================================
  // Epic 6: 費用記錄與審批種子數據
  // ========================================

  console.log('💰 創建費用記錄...');

  // 費用 1: 專案 1 ERP 系統升級的費用 - Draft 狀態
  const expenseDraft = await prisma.expense.upsert({
    where: { id: 'expense-erp-draft-001' },
    update: {},
    create: {
      id: 'expense-erp-draft-001',
      name: 'ERP 軟體授權費用',
      description: 'ERP 系統升級第一期軟體授權費用',
      purchaseOrderId: purchaseOrderERP.id,
      totalAmount: 400000,
      expenseDate: new Date('2024-10-10T00:00:00Z'),
      invoiceDate: new Date('2024-10-10T00:00:00Z'),
      invoiceFilePath: '/uploads/invoices/erp-invoice-001.pdf',
      status: 'Draft',
    },
  });

  // 費用 2: 專案 1 ERP 系統升級的費用 - PendingApproval 狀態
  const expensePending = await prisma.expense.upsert({
    where: { id: 'expense-erp-pending-001' },
    update: {},
    create: {
      id: 'expense-erp-pending-001',
      name: 'ERP 技術支援服務費',
      description: 'ERP 系統升級技術支援與顧問服務費用',
      purchaseOrderId: purchaseOrderERP.id,
      totalAmount: 600000,
      expenseDate: new Date('2024-10-12T00:00:00Z'),
      invoiceDate: new Date('2024-10-12T00:00:00Z'),
      invoiceFilePath: '/uploads/invoices/erp-invoice-002.pdf',
      status: 'PendingApproval',
    },
  });

  // 費用 3: 專案 1 ERP 系統升級的費用 - Approved 狀態
  const expenseApproved = await prisma.expense.upsert({
    where: { id: 'expense-erp-approved-001' },
    update: {},
    create: {
      id: 'expense-erp-approved-001',
      name: 'ERP 初始設定費用',
      description: 'ERP 系統初始設定與配置費用',
      purchaseOrderId: purchaseOrderERP.id,
      totalAmount: 200000,
      expenseDate: new Date('2024-10-08T00:00:00Z'),
      invoiceDate: new Date('2024-10-08T00:00:00Z'),
      invoiceFilePath: '/uploads/invoices/erp-invoice-003.pdf',
      status: 'Approved',
    },
  });

  // 更新預算池 - 扣除已批准的費用
  await prisma.budgetPool.update({
    where: { id: budgetPool2024.id },
    data: {
      usedAmount: {
        increment: expenseApproved.totalAmount,
      },
    },
  });

  console.log('✅ 費用記錄創建完成 (預算池已扣除 $200,000)');

  console.log('');
  console.log('🎉 資料庫種子數據完成！');
  console.log('');
  console.log('🔐 菜單權限 (FEAT-011):');
  console.log('  - 18 個菜單權限已創建');
  console.log('  - Admin: 18 個權限 (全部)');
  console.log('  - Supervisor: 17 個權限 (除用戶管理)');
  console.log('  - ProjectManager: 11 個權限 (核心業務)');
  console.log('');
  console.log('📂 費用類別 (CHANGE-003):');
  console.log('  - HW: 硬體');
  console.log('  - SW: 軟體');
  console.log('  - SV: 服務');
  console.log('  - MAINT: 維護');
  console.log('  - LICENSE: 授權');
  console.log('  - CLOUD: 雲端');
  console.log('  - TELECOM: 電信');
  console.log('  - OTHER: 其他');
  console.log('');
  console.log('📋 測試帳號:');
  console.log('  管理員: admin@itpm.local / admin123');
  console.log('  專案經理: pm@itpm.local / pm123');
  console.log('  主管: supervisor@itpm.local / supervisor123');
  console.log('');
  console.log('📊 預算提案測試數據:');
  console.log('  ✏️  Draft (草稿): 2 個提案');
  console.log('  ⏳ PendingApproval (待審批): 1 個提案');
  console.log('  ✅ Approved (已批准): 1 個提案');
  console.log('  ❌ Rejected (已拒絕): 1 個提案');
  console.log('  📝 MoreInfoRequired (需更多資訊): 1 個提案');
  console.log('');
  console.log('💬 審批歷史與評論:');
  console.log('  - 完整的審批工作流歷史記錄');
  console.log('  - 專案經理與主管的溝通評論');
  console.log('  - 涵蓋所有審批狀態轉換');
  console.log('');
  console.log('🏢 供應商與採購管理測試數據:');
  console.log('  📦 供應商: 5 家');
  console.log('    - Microsoft 台灣分公司');
  console.log('    - IBM 台灣國際商業機器股份有限公司');
  console.log('    - Oracle 甲骨文台灣分公司');
  console.log('    - 台灣資訊系統整合股份有限公司');
  console.log('    - Amazon Web Services 台灣');
  console.log('  📄 報價單: 5 張');
  console.log('    - 專案 1 (ERP系統升級): 3 張報價 (Microsoft, IBM, Oracle)');
  console.log('    - 專案 2 (雲端基礎設施擴容): 2 張報價 (AWS, 本地整合商)');
  console.log('  📋 採購單: 1 張');
  console.log('    - PO-2024-ERP-001: ERP系統升級 (選擇 Microsoft, $1,200,000)');
  console.log('');
  console.log('💰 費用記錄與審批測試數據:');
  console.log('  📝 費用記錄: 3 筆');
  console.log('    - ✏️  Draft (草稿): 1 筆 ($400,000)');
  console.log('    - ⏳ PendingApproval (待審批): 1 筆 ($600,000)');
  console.log('    - ✅ Approved (已批准): 1 筆 ($200,000)');
  console.log('  💸 預算池扣款: 已從 2024 IT 預算池扣除 $200,000');
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ 種子數據失敗:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
