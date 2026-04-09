# Model 詳細規格

> 來源檔案：`packages/db/prisma/schema.prisma`（951 行，32 個 Model）
> 分析日期：2026-04-09

---

## 1. User（L19-49）

使用者主表，整合 NextAuth.js 和 Azure AD B2C。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| email | String | No | — | @unique |
| emailVerified | DateTime | Yes | — | NextAuth 郵箱驗證時間 |
| name | String | Yes | — | |
| image | String | Yes | — | 用戶頭像 URL |
| password | String | Yes | — | bcrypt hash，Azure AD B2C 用戶為 null |
| roleId | Int | No | @default(1) | 預設 ProjectManager |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**關聯**：role(Role), projects[](ProjectManager), approvals[](Supervisor), comments[], historyItems[], notifications[], accounts[], sessions[], approvedProposals[](ProposalApprover), confirmedChargeOuts[](ChargeOutConfirmer), operatingCompanyPermissions[], permissions[]

**索引**：@@index([email]), @@index([roleId])

---

## 2. Account（L52-70）

NextAuth OAuth 帳號，用於 Azure AD B2C SSO 連結。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| userId | String | No | — | FK → User |
| type | String | No | — | oauth, email, credentials |
| provider | String | No | — | azure-ad-b2c |
| providerAccountId | String | No | — | Azure AD B2C 用戶唯一 ID |
| refresh_token | String | Yes | — | @db.Text |
| access_token | String | Yes | — | @db.Text |
| expires_at | Int | Yes | — | |
| token_type | String | Yes | — | |
| scope | String | Yes | — | |
| id_token | String | Yes | — | @db.Text |
| session_state | String | Yes | — | |

**級聯**：onDelete: Cascade（User 刪除時一同刪除）
**唯一**：@@unique([provider, providerAccountId])
**索引**：@@index([userId])

---

## 3. Session（L72-81）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| sessionToken | String | No | — | @unique |
| userId | String | No | — | FK → User |
| expires | DateTime | No | — | |

**級聯**：onDelete: Cascade
**索引**：@@index([userId])

---

## 4. VerificationToken（L83-89）

無 @id 主鍵，僅使用複合唯一約束。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| identifier | String | No | — | |
| token | String | No | — | @unique |
| expires | DateTime | No | — | |

**唯一**：@@unique([identifier, token])

---

## 5. Role（L91-98）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | Int | No | @default(autoincrement()) | @id，唯一使用自增整數的 Model |
| name | String | No | — | @unique，值為 "ProjectManager", "Supervisor", "Admin" |

**關聯**：users[], defaultPermissions[]

---

## 6. Permission（L106-124）

FEAT-011 權限定義表。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| code | String | No | — | @unique，如 "menu:dashboard" |
| name | String | No | — | 權限名稱 |
| category | String | No | — | 如 "menu", "project" |
| description | String | Yes | — | |
| isActive | Boolean | No | @default(true) | |
| sortOrder | Int | No | @default(0) | |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**索引**：@@index([category]), @@index([code]), @@index([isActive])

---

## 7. RolePermission（L127-140）

角色預設權限多對多中間表。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| roleId | Int | No | — | FK → Role |
| permissionId | String | No | — | FK → Permission |
| createdAt | DateTime | No | @default(now()) | |

**級聯**：兩端皆 onDelete: Cascade
**唯一**：@@unique([roleId, permissionId])

---

## 8. UserPermission（L143-159）

使用者自訂權限（可覆蓋角色預設）。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| userId | String | No | — | FK → User |
| permissionId | String | No | — | FK → Permission |
| granted | Boolean | No | @default(true) | true=授予, false=撤銷 |
| createdBy | String | Yes | — | 設定此權限的管理員 ID |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**級聯**：兩端皆 onDelete: Cascade
**唯一**：@@unique([userId, permissionId])

---

## 9. BudgetPool（L165-182）

年度預算池。totalAmount/usedAmount 已標記為 DEPRECATED，改由 BudgetCategory 匯總計算。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| name | String | No | — | |
| totalAmount | Float | No | — | DEPRECATED |
| usedAmount | Float | No | @default(0) | DEPRECATED |
| financialYear | Int | No | — | |
| description | String | Yes | — | |
| currencyId | String | Yes | — | FEAT-002 |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**關聯**：currency(BudgetPoolCurrency), categories[], projects[]
**索引**：@@index([financialYear]), @@index([currencyId])

---

## 10. Project（L184-258）

核心專案記錄，經過 FEAT-001/006/010 多次擴展，為欄位最多的 Model（30+ 個資料欄位）。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| name | String | No | — | |
| description | String | Yes | — | |
| status | String | No | @default("Draft") | Draft/InProgress/Completed/Archived |
| managerId | String | No | — | FK → User |
| supervisorId | String | No | — | FK → User |
| budgetPoolId | String | No | — | FK → BudgetPool |
| budgetCategoryId | String | Yes | — | FK → BudgetCategory |
| requestedBudget | Float | Yes | — | |
| approvedBudget | Float | Yes | — | |
| startDate | DateTime | No | — | |
| endDate | DateTime | Yes | — | |
| chargeOutDate | DateTime | Yes | — | Story 6.4 |
| projectCode | String | No | — | @unique，FEAT-001 |
| globalFlag | String | No | @default("Region") | FEAT-001 |
| priority | String | No | @default("Medium") | FEAT-001 |
| currencyId | String | Yes | — | FEAT-001 |
| projectCategory | String | Yes | — | FEAT-006 |
| projectType | String | No | @default("Project") | FEAT-006 |
| expenseType | String | No | @default("Expense") | FEAT-006 |
| chargeBackToOpCo | Boolean | No | @default(false) | FEAT-006 |
| chargeOutMethod | String | Yes | — | @db.Text, FEAT-006 |
| probability | String | No | @default("Medium") | FEAT-006 |
| team | String | Yes | — | FEAT-006 |
| personInCharge | String | Yes | — | FEAT-006 |
| fiscalYear | Int | Yes | — | FEAT-010 |
| isCdoReviewRequired | Boolean | No | @default(false) | FEAT-010 |
| isManagerConfirmed | Boolean | No | @default(false) | FEAT-010 |
| payForWhat | String | Yes | — | FEAT-010 |
| payToWhom | String | Yes | — | FEAT-010 |
| isOngoing | Boolean | No | @default(false) | FEAT-010 |
| lastFYActualExpense | Float | Yes | — | FEAT-010 |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**關聯**：manager(ProjectManager), supervisor(Supervisor), budgetPool, budgetCategory?, currency?(ProjectCurrency, onDelete: SetNull), proposals[], quotes[], purchaseOrders[], chargeOuts[], chargeOutOpCos[], projectBudgetCategories[]

**索引**：共 16 個 @@index（managerId, supervisorId, budgetPoolId, budgetCategoryId, status, projectCode, globalFlag, priority, currencyId, projectCategory, projectType, expenseType, chargeBackToOpCo, probability, team, fiscalYear, isCdoReviewRequired）

---

## 11. BudgetProposal（L260-294）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| title | String | No | — | |
| amount | Float | No | — | |
| status | String | No | @default("Draft") | 5 種狀態 |
| projectId | String | No | — | FK → Project |
| proposalFilePath | String | Yes | — | 計劃書文件路徑 |
| proposalFileName | String | Yes | — | |
| proposalFileSize | Int | Yes | — | bytes |
| meetingDate | DateTime | Yes | — | |
| meetingNotes | String | Yes | — | @db.Text |
| presentedBy | String | Yes | — | |
| approvedAmount | Float | Yes | — | |
| approvedBy | String | Yes | — | FK → User |
| approvedAt | DateTime | Yes | — | |
| rejectionReason | String | Yes | — | @db.Text |
| createdAt | DateTime | No | @default(now()) | |
| updatedAt | DateTime | No | @updatedAt | |

**關聯**：project, approver?(ProposalApprover), comments[], historyItems[]
**索引**：@@index([projectId]), @@index([status]), @@index([approvedBy])

---

## 12. Vendor（L296-309）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| name | String | No | — |
| contactPerson | String | Yes | — |
| contactEmail | String | Yes | — |
| phone | String | Yes | — |
| createdAt | DateTime | No | @default(now()) |
| updatedAt | DateTime | No | @updatedAt |

**name** 為 @unique。**關聯**：quotes[], purchaseOrders[], expenses[], omExpenses[]

---

## 13. Quote（L311-327）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| filePath | String | No | — |
| uploadDate | DateTime | No | @default(now()) |
| amount | Float | No | — |
| vendorId | String | No | — |
| projectId | String | No | — |
| createdAt/updatedAt | — | — | — |

**索引**：@@index([vendorId]), @@index([projectId])

---

## 14. PurchaseOrder（L329-356）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| poNumber | String | No | @default(cuid()) | @unique |
| name | String | No | — | |
| description | String | Yes | — | @db.Text |
| date | DateTime | No | @default(now()) | |
| totalAmount | Float | No | — | 由明細自動計算 |
| currencyId | String | Yes | — | FEAT-002 |
| status | String | No | @default("Draft") | 5 種狀態 |
| projectId | String | No | — | |
| vendorId | String | No | — | |
| quoteId | String | Yes | — | |
| approvedDate | DateTime | Yes | — | |
| createdAt/updatedAt | — | — | — | |

**關聯**：project, vendor, quote?, currency?(PurchaseOrderCurrency), items[], expenses[]
**索引**：@@index([projectId, vendorId, currencyId, status])

---

## 15. Expense（L358-403）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | @id |
| name | String | No | — | |
| description | String | Yes | — | @db.Text |
| totalAmount | Float | No | — | 由明細計算 |
| currencyId | String | Yes | — | FEAT-002 |
| status | String | No | @default("Draft") | 5 種狀態 |
| invoiceNumber | String | Yes | — | |
| invoiceDate | DateTime | No | — | |
| invoiceFilePath | String | Yes | — | |
| requiresChargeOut | Boolean | No | @default(false) | |
| isOperationMaint | Boolean | No | @default(false) | |
| purchaseOrderId | String | No | — | |
| budgetCategoryId | String | Yes | — | |
| vendorId | String | Yes | — | |
| expenseDate | DateTime | No | — | |
| approvedDate | DateTime | Yes | — | |
| paidDate | DateTime | Yes | — | |
| createdAt/updatedAt | — | — | — | |

**關聯**：purchaseOrder, budgetCategory?, vendor?, currency?(ExpenseCurrency), items[], chargeOutItems[], derivedOMExpenses[](DerivedOMExpenses)
**索引**：7 個（purchaseOrderId, budgetCategoryId, vendorId, currencyId, status, requiresChargeOut, isOperationMaint）

---

## 16. Comment（L409-421）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| content | String | No | — |
| userId | String | No | — |
| budgetProposalId | String | No | — |
| createdAt | DateTime | No | @default(now()) |

**注意**：僅有 createdAt，無 updatedAt（評論不可編輯模式）。

---

## 17. History（L423-436）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| action | String | No | — |
| details | String | Yes | — |
| userId | String | No | — |
| budgetProposalId | String | No | — |
| createdAt | DateTime | No | @default(now()) |

**注意**：僅有 createdAt，無 updatedAt（審計記錄不可變模式）。

---

## 18. Notification（L443-463）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| userId | String | No | — |
| type | String | No | — |
| title | String | No | — |
| message | String | No | — |
| link | String | Yes | — |
| isRead | Boolean | No | @default(false) |
| emailSent | Boolean | No | @default(false) |
| entityType | String | Yes | — |
| entityId | String | Yes | — |
| createdAt/updatedAt | — | — | — |

**索引**：@@index([userId]), @@index([isRead]), @@index([createdAt]), @@index([entityType, entityId])

---

## 19. OperatingCompany（L471-495）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| code | String | No | — |
| name | String | No | — |
| description | String | Yes | — |
| isActive | Boolean | No | @default(true) |
| createdAt/updatedAt | — | — | — |

**code** 為 @unique。**關聯**：chargeOuts[], omExpenseMonthly[], chargeOutExpenseItems[](ChargeOutExpenseItems), projectChargeOuts[], omExpenseItems[](OMExpenseItemOpCo), omExpenseDefaults[](OMExpenseDefaultOpCo), omExpensesLegacy[](OMExpenseLegacyOpCo), userPermissions[]

---

## 20. ProjectChargeOutOpCo（L502-514）

FEAT-006 專案與 OpCo 多對多關聯。

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| projectId | String | No | — |
| opCoId | String | No | — |
| createdAt | DateTime | No | @default(now()) |

**級聯**：兩端皆 onDelete: Cascade
**唯一**：@@unique([projectId, opCoId])

---

## 21. UserOperatingCompany（L521-536）

FEAT-009 使用者 OpCo 數據權限。

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| userId | String | No | — |
| operatingCompanyId | String | No | — |
| createdAt | DateTime | No | @default(now()) |
| createdBy | String | Yes | — |

**級聯**：兩端皆 onDelete: Cascade
**唯一**：@@unique([userId, operatingCompanyId])

---

## 22. BudgetCategory（L539-567）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| budgetPoolId | String | No | — |
| categoryName | String | No | — |
| categoryCode | String | Yes | — |
| description | String | Yes | — |
| totalAmount | Float | No | — |
| usedAmount | Float | No | @default(0) |
| sortOrder | Int | No | @default(0) |
| isActive | Boolean | No | @default(true) |
| createdAt/updatedAt | — | — | — |

**級聯**：budgetPool onDelete: Cascade
**唯一**：@@unique([budgetPoolId, categoryName])

---

## 23. ProjectBudgetCategory（L574-598）

CHANGE-038 專案預算類別同步（含申請金額）。

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| projectId | String | No | — |
| budgetCategoryId | String | No | — |
| requestedAmount | Float | No | @default(0) |
| sortOrder | Int | No | @default(0) |
| isActive | Boolean | No | @default(true) |
| createdAt/updatedAt | — | — | — |

**級聯**：project onDelete: Cascade, budgetCategory onDelete: Restrict
**唯一**：@@unique([projectId, budgetCategoryId])

---

## 24. PurchaseOrderItem（L606-626）

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| purchaseOrderId | String | No | — |
| itemName | String | No | — |
| description | String | Yes | — |
| quantity | Int | No | — |
| unitPrice | Float | No | — |
| subtotal | Float | No | — |
| sortOrder | Int | No | @default(0) |
| createdAt/updatedAt | — | — | — |

**級聯**：purchaseOrder onDelete: Cascade

---

## 25. ExpenseItem（L629-659）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| expenseId | String | No | — | |
| itemName | String | No | — | |
| description | String | Yes | — | @db.Text |
| amount | Float | No | — | |
| category | String | Yes | — | 舊欄位，保留向後兼容 |
| categoryId | String | Yes | — | CHANGE-003 FK → ExpenseCategory |
| chargeOutOpCoId | String | Yes | — | CHANGE-002 轉嫁目標 OpCo |
| sortOrder | Int | No | @default(0) | |
| createdAt/updatedAt | — | — | — | |

**級聯**：expense onDelete: Cascade
**關聯**：expenseCategory?(CHANGE-003), chargeOutOpCo?(ChargeOutExpenseItems), chargeOutItems[]

---

## 26. ExpenseCategory（L669-685）

統一費用類別，同時供 ExpenseItem 和 OMExpense 使用。

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| code | String | No | — |
| name | String | No | — |
| description | String | Yes | — |
| sortOrder | Int | No | @default(0) |
| isActive | Boolean | No | @default(true) |
| createdAt/updatedAt | — | — | — |

**code** 為 @unique。預設值：HW, SW, SV, MAINT, LICENSE, CLOUD, TELECOM, OTHER

---

## 27. OMExpense（L689-758）

OM 費用表頭，FEAT-007 重構。含多個已棄用欄位以維持向後兼容。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| name | String | No | — | |
| description | String | Yes | — | @db.Text |
| financialYear | Int | No | — | |
| category | String | No | — | 舊欄位 |
| categoryId | String | Yes | — | FK → ExpenseCategory |
| totalBudgetAmount | Float | No | @default(0) | FEAT-007 匯總 |
| totalActualSpent | Float | No | @default(0) | FEAT-007 匯總 |
| defaultOpCoId | String | Yes | — | FEAT-007 |
| opCoId | String | Yes | — | DEPRECATED |
| budgetAmount | Float | Yes | — | DEPRECATED |
| actualSpent | Float | No | @default(0) | DEPRECATED |
| startDate | DateTime | Yes | — | DEPRECATED |
| endDate | DateTime | Yes | — | DEPRECATED |
| yoyGrowthRate | Float | Yes | — | 年增長率 |
| vendorId | String | Yes | — | |
| sourceExpenseId | String | Yes | — | CHANGE-001 |
| createdAt/updatedAt | — | — | — | |

**關聯**：items[], defaultOpCo?(OMExpenseDefaultOpCo), opCo?(OMExpenseLegacyOpCo), vendor?, expenseCategory?, sourceExpense?(DerivedOMExpenses), monthlyRecords[](LegacyOMExpenseMonthly)

---

## 28. OMExpenseItem（L763-802）

FEAT-007 新增，OM 費用明細項目。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| omExpenseId | String | No | — | FK → OMExpense |
| name | String | No | — | 如 "TGT-DC", "RDC2" |
| description | String | Yes | — | @db.Text |
| sortOrder | Int | No | @default(0) | 拖曳排序 |
| budgetAmount | Float | No | — | |
| actualSpent | Float | No | @default(0) | 由月度記錄計算 |
| lastFYActualExpense | Float | Yes | — | FEAT-008 上年度支出 |
| currencyId | String | Yes | — | |
| opCoId | String | No | — | FK → OperatingCompany |
| startDate | DateTime | Yes | — | |
| endDate | DateTime | Yes | — | CHANGE-011 isOngoing 時可為 null |
| isOngoing | Boolean | No | @default(false) | CHANGE-011 |
| createdAt/updatedAt | — | — | — | |

**級聯**：omExpense onDelete: Cascade
**索引**：@@index([omExpenseId, opCoId, currencyId, sortOrder])

---

## 29. OMExpenseMonthly（L806-848）

OM 費用月度支出記錄。FEAT-007 將關聯從 OMExpense 遷移到 OMExpenseItem。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| omExpenseItemId | String | Yes | — | FEAT-007 新增 |
| omExpenseId | String | Yes | — | DEPRECATED |
| month | Int | No | — | 1-12 |
| actualAmount | Float | No | — | |
| opCoId | String | No | — | 冗餘，方便查詢 |
| createdAt/updatedAt | — | — | — | |

**級聯**：omExpenseItem onDelete: Cascade, omExpense(Legacy) onDelete: Cascade
**唯一**：@@unique([omExpenseItemId, month]), @@unique([omExpenseId, month])

---

## 30. ChargeOut（L856-895）

費用轉嫁表頭。

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| name | String | No | — | |
| description | String | Yes | — | @db.Text |
| projectId | String | No | — | |
| opCoId | String | No | — | |
| totalAmount | Float | No | — | 由明細計算 |
| status | String | No | @default("Draft") | 5 種狀態 |
| debitNoteNumber | String | Yes | — | @unique |
| issueDate | DateTime | Yes | — | |
| paymentDate | DateTime | Yes | — | |
| confirmedBy | String | Yes | — | FK → User |
| confirmedAt | DateTime | Yes | — | |
| createdAt/updatedAt | — | — | — | |

**關聯**：project, opCo, confirmer?(ChargeOutConfirmer), items[]
**索引**：@@index([projectId, opCoId, status, confirmedBy])

---

## 31. ChargeOutItem（L898-925）

| 欄位 | 類型 | 可空 | 預設值 | 註解 |
|------|------|------|--------|------|
| id | String | No | @default(uuid()) | |
| chargeOutId | String | No | — | |
| expenseItemId | String | Yes | — | CHANGE-002 |
| expenseId | String | Yes | — | 舊版向後兼容 |
| amount | Float | No | — | |
| description | String | Yes | — | @db.Text |
| sortOrder | Int | No | @default(0) | |
| createdAt/updatedAt | — | — | — | |

**級聯**：chargeOut onDelete: Cascade

---

## 32. Currency（L932-951）

FEAT-001 多幣別支援。

| 欄位 | 類型 | 可空 | 預設值 |
|------|------|------|--------|
| id | String | No | @default(uuid()) |
| code | String | No | — |
| name | String | No | — |
| symbol | String | No | — |
| exchangeRate | Float | Yes | — |
| active | Boolean | No | @default(true) |
| createdAt/updatedAt | — | — | — |

**code** 為 @unique（ISO 4217）。
**關聯**：projects[](ProjectCurrency), budgetPools[](BudgetPoolCurrency), purchaseOrders[](PurchaseOrderCurrency), expenses[](ExpenseCurrency), omExpenseItems[](OMExpenseItemCurrency)

---

## 特殊模式與注意事項

1. **表頭-明細模式**（Header-Detail Pattern）：PurchaseOrder↔PurchaseOrderItem, Expense↔ExpenseItem, OMExpense↔OMExpenseItem, ChargeOut↔ChargeOutItem — 明細端皆使用 onDelete: Cascade
2. **@db.Text 使用**：description, meetingNotes, rejectionReason, chargeOutMethod 等長文本欄位
3. **無 Prisma enum**：所有枚舉值以 String 儲存，由 API 層 Zod 驗證
4. **金額欄位全用 Float**：未使用 Decimal（@db.Decimal）
5. **唯一的 auto-increment**：僅 Role.id 使用 @default(autoincrement())，其餘全為 UUID
6. **無 @id 的 Model**：VerificationToken 無 @id，僅使用 @@unique 複合鍵
7. **冗餘欄位設計**：OMExpenseMonthly.opCoId 為冗餘欄位，用於加速查詢
