# 業務流程圖

本文件描述 IT 專案流程管理平台的各項業務流程，包含認證流程、審批工作流、權限控制決策樹等。所有流程圖均基於實際程式碼驗證。

---

## 1. 使用者認證流程

此圖展示平台支援的兩種認證方式：Azure AD B2C SSO (企業環境) 和本地密碼登入 (開發/備援)。認證成功後統一建立 JWT Session。資料來源為 `packages/auth/src/index.ts`。

```mermaid
flowchart TD
    START([使用者訪問受保護頁面])
    MW{"middleware.ts<br/>檢查 Session Cookie"}

    MW -->|"有效 Session"| ACCESS[允許訪問頁面]
    MW -->|"無效/過期"| LOGIN[重定向至 /login]

    LOGIN --> CHOOSE{"選擇登入方式"}

    subgraph "Azure AD B2C SSO"
        AAD_START[點擊 SSO 登入按鈕]
        AAD_REDIRECT["重定向至 Azure AD B2C<br/>登入頁面"]
        AAD_AUTH["使用者輸入企業帳號密碼<br/>Azure AD B2C 驗證"]
        AAD_CODE["返回 Authorization Code"]
        AAD_TOKEN["NextAuth 交換 Access Token"]
        AAD_SYNC["JWT Callback:<br/>查詢/建立 User 記錄<br/>同步 Azure AD 資料"]
    end

    subgraph "本地密碼認證"
        CRED_INPUT["輸入 Email + Password"]
        CRED_QUERY["CredentialsProvider.authorize()<br/>查詢 User (by email)"]
        CRED_CHECK{"password 欄位<br/>是否存在?"}
        CRED_BCRYPT["bcrypt.compare()<br/>密碼比對"]
        CRED_MATCH{"比對結果"}
    end

    CHOOSE -->|"Azure AD B2C"| AAD_START
    CHOOSE -->|"Email/Password"| CRED_INPUT

    AAD_START --> AAD_REDIRECT
    AAD_REDIRECT --> AAD_AUTH
    AAD_AUTH --> AAD_CODE
    AAD_CODE --> AAD_TOKEN
    AAD_TOKEN --> AAD_SYNC

    CRED_INPUT --> CRED_QUERY
    CRED_QUERY --> CRED_CHECK
    CRED_CHECK -->|"null (SSO-only 用戶)"| FAIL["登入失敗<br/>此帳號未設定密碼"]
    CRED_CHECK -->|"有 hash"| CRED_BCRYPT
    CRED_BCRYPT --> CRED_MATCH
    CRED_MATCH -->|"不符"| FAIL

    AAD_SYNC --> JWT_CREATE
    CRED_MATCH -->|"符合"| JWT_CREATE

    JWT_CREATE["建立 JWT Session<br/>─────────<br/>user.id<br/>user.email<br/>user.name<br/>user.roleId<br/>user.role.name<br/>maxAge: 24 小時"]

    JWT_CREATE --> SET_COOKIE["設定 Session Cookie<br/>(httpOnly, secure)"]
    SET_COOKIE --> REDIRECT["重定向至 /dashboard"]

    classDef start fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef decision fill:#f59e0b,stroke:#d97706,color:#000
    classDef process fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef success fill:#10b981,stroke:#059669,color:#fff
    classDef fail fill:#ef4444,stroke:#dc2626,color:#fff

    class START start
    class MW,CHOOSE,CRED_CHECK,CRED_MATCH decision
    class AAD_START,AAD_REDIRECT,AAD_AUTH,AAD_CODE,AAD_TOKEN,AAD_SYNC,CRED_INPUT,CRED_QUERY,CRED_BCRYPT process
    class JWT_CREATE,SET_COOKIE,REDIRECT,ACCESS success
    class FAIL,LOGIN fail
```

---

## 2. 預算提案審批工作流

此圖展示 BudgetProposal 的完整業務流程，包含各個角色的操作和系統自動化動作。資料來源為 `budgetProposal.ts` router。

```mermaid
flowchart TD
    PM_CREATE([PM: 建立提案])
    PM_CREATE --> DRAFT["狀態: Draft<br/>─────────<br/>PM 可編輯 title, amount<br/>PM 可上傳計劃書<br/>PM 可刪除提案"]

    DRAFT --> PM_SUBMIT{PM: 提交審批}
    PM_SUBMIT --> PENDING["狀態: PendingApproval<br/>─────────<br/>系統動作:<br/>1. 記錄 History SUBMITTED<br/>2. 通知 Supervisor<br/>3. 發送 Email"]

    PENDING --> SUP_REVIEW{"Supervisor 審核"}

    SUP_REVIEW -->|"批准"| APPROVED["狀態: Approved<br/>─────────<br/>系統動作:<br/>1. 記錄 approvedAmount<br/>2. 記錄 approvedBy, approvedAt<br/>3. Project.approvedBudget += amount<br/>4. Project.status = InProgress<br/>5. History APPROVED<br/>6. 通知 PM"]

    SUP_REVIEW -->|"拒絕"| REJECTED["狀態: Rejected<br/>─────────<br/>系統動作:<br/>1. 記錄 rejectionReason<br/>2. History REJECTED<br/>3. 通知 PM"]

    SUP_REVIEW -->|"要求補充資料"| MOREINFO["狀態: MoreInfoRequired<br/>─────────<br/>系統動作:<br/>1. 記錄 comment<br/>2. History MORE_INFO_REQUIRED<br/>3. 通知 PM"]

    MOREINFO --> PM_UPDATE["PM: 補充資料<br/>更新提案內容"]
    PM_UPDATE --> PM_SUBMIT

    APPROVED --> REVERT_A{"Admin/Supervisor:<br/>revertToDraft?"}
    REJECTED --> REVERT_R{"Admin/Supervisor:<br/>revertToDraft?"}
    MOREINFO --> REVERT_M{"Admin/Supervisor:<br/>revertToDraft?"}

    REVERT_A -->|"是"| DRAFT
    REVERT_R -->|"是"| DRAFT
    REVERT_M -->|"是"| DRAFT

    APPROVED --> DONE([提案完成])

    classDef draft fill:#6b7280,stroke:#4b5563,color:#fff
    classDef pending fill:#f59e0b,stroke:#d97706,color:#fff
    classDef approved fill:#10b981,stroke:#059669,color:#fff
    classDef rejected fill:#ef4444,stroke:#dc2626,color:#fff
    classDef moreinfo fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef action fill:#3b82f6,stroke:#2563eb,color:#fff

    class DRAFT draft
    class PENDING pending
    class APPROVED,DONE approved
    class REJECTED rejected
    class MOREINFO moreinfo
    class PM_SUBMIT,SUP_REVIEW,REVERT_A,REVERT_R,REVERT_M action
```

---

## 3. 費用審批與支付工作流

此圖展示 Expense 從建立到支付的完整業務流程，包含預算自動扣款邏輯。資料來源為 `expense.ts` router。

```mermaid
flowchart TD
    PM_CREATE([PM: 建立費用記錄])
    PM_CREATE --> DRAFT["狀態: Draft<br/>─────────<br/>建立表頭 + ExpenseItem[]<br/>關聯 PurchaseOrder<br/>totalAmount = SUM(items)"]

    DRAFT --> EDIT["PM: 可編輯<br/>新增/修改/刪除明細"]
    EDIT --> DRAFT

    DRAFT --> SUBMIT_CHECK{"PM: 提交審批<br/>驗證: items.length > 0?"}
    SUBMIT_CHECK -->|"無明細"| DRAFT
    SUBMIT_CHECK -->|"有明細"| SUBMITTED["狀態: Submitted<br/>─────────<br/>系統動作:<br/>1. 清除 approvedDate<br/>2. 通知 Supervisor"]

    SUBMITTED --> SUP_REVIEW{"Supervisor 審核"}

    SUP_REVIEW -->|"批准"| APPROVE_TX["狀態: Approved<br/>─────────<br/>$transaction 內:<br/>1. Expense.status = Approved<br/>2. Expense.approvedDate = now<br/>3. BudgetPool.usedAmount += totalAmount<br/>4. BudgetCategory.usedAmount += totalAmount<br/>5. 通知 PM"]

    SUP_REVIEW -->|"拒絕"| REJECT["狀態: Draft (退回)<br/>─────────<br/>系統動作:<br/>1. 退回 Draft 狀態<br/>2. 記錄拒絕原因<br/>3. 通知 PM"]

    REJECT --> DRAFT

    APPROVE_TX --> PAY_CHECK{"PM/Finance:<br/>標記已支付?"}
    PAY_CHECK -->|"是"| PAID["狀態: Paid<br/>─────────<br/>記錄 paidDate"]
    PAY_CHECK -->|"退回"| REVERT["revertToDraft<br/>─────────<br/>$transaction 內:<br/>1. status = Draft<br/>2. BudgetPool.usedAmount -= totalAmount<br/>3. BudgetCategory.usedAmount -= totalAmount<br/>4. 清除 approvedDate, paidDate"]

    REVERT --> DRAFT

    DRAFT --> DELETE{"PM: 刪除?<br/>(僅 Draft 可刪除)"}
    DELETE -->|"確認"| DELETED([費用已刪除])

    PAID --> CHARGEOUT{"需要費用轉嫁?<br/>(requiresChargeOut)"}
    CHARGEOUT -->|"是"| TO_CO([進入 ChargeOut 流程])
    CHARGEOUT -->|"否"| COMPLETE([費用流程結束])

    classDef draft fill:#6b7280,stroke:#4b5563,color:#fff
    classDef submitted fill:#f59e0b,stroke:#d97706,color:#fff
    classDef approved fill:#10b981,stroke:#059669,color:#fff
    classDef paid fill:#0ea5e9,stroke:#0284c7,color:#fff
    classDef action fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef end_node fill:#8b5cf6,stroke:#6d28d9,color:#fff

    class DRAFT,EDIT,REJECT draft
    class SUBMITTED submitted
    class APPROVE_TX approved
    class PAID paid
    class SUBMIT_CHECK,SUP_REVIEW,PAY_CHECK,DELETE,CHARGEOUT action
    class TO_CO,COMPLETE,DELETED end_node
```

---

## 4. ChargeOut 確認工作流

此圖展示費用轉嫁 (ChargeOut) 從建立到付款的完整流程。資料來源為 `chargeOut.ts` router。

```mermaid
flowchart TD
    START([PM: 建立 ChargeOut])
    START --> SELECT["選擇 Project 和 OpCo<br/>選擇需轉嫁的 Expense/ExpenseItem"]

    SELECT --> DRAFT["狀態: Draft<br/>─────────<br/>ChargeOut 表頭<br/>+ ChargeOutItem[] 明細<br/>totalAmount = SUM(items)"]

    DRAFT --> EDIT_ITEMS["PM: 編輯明細<br/>updateItems 批量更新<br/>─────────<br/>新增/修改/刪除 Item<br/>更新 debitNoteNumber"]
    EDIT_ITEMS --> DRAFT

    DRAFT --> SUBMIT_CHECK{"PM: 提交<br/>items.length > 0?"}
    SUBMIT_CHECK -->|"無明細"| DRAFT
    SUBMIT_CHECK -->|"有明細"| SUBMITTED["狀態: Submitted"]

    SUBMITTED --> SUP_DECISION{"Supervisor 決策"}

    SUP_DECISION -->|"確認"| CONFIRMED["狀態: Confirmed<br/>─────────<br/>confirmedBy = supervisor.id<br/>confirmedAt = now()"]

    SUP_DECISION -->|"拒絕"| REJECTED["狀態: Rejected<br/>─────────<br/>可刪除後重建"]

    CONFIRMED --> PAY{"Finance:<br/>收到付款?"}
    PAY -->|"是"| PAID["狀態: Paid<br/>─────────<br/>paymentDate = now()"]

    DRAFT --> DELETE_D{"刪除?"}
    REJECTED --> DELETE_R{"刪除?"}
    DELETE_D -->|"是"| DELETED([已刪除])
    DELETE_R -->|"是"| DELETED

    PAID --> COMPLETE([ChargeOut 完成])

    classDef draft fill:#6b7280,stroke:#4b5563,color:#fff
    classDef submitted fill:#f59e0b,stroke:#d97706,color:#fff
    classDef confirmed fill:#10b981,stroke:#059669,color:#fff
    classDef paid fill:#0ea5e9,stroke:#0284c7,color:#fff
    classDef rejected fill:#ef4444,stroke:#dc2626,color:#fff
    classDef action fill:#3b82f6,stroke:#2563eb,color:#fff

    class DRAFT,EDIT_ITEMS draft
    class SUBMITTED submitted
    class CONFIRMED confirmed
    class PAID paid
    class REJECTED rejected
    class SUBMIT_CHECK,SUP_DECISION,PAY,DELETE_D,DELETE_R action
```

---

## 5. 角色權限控制決策樹 (RBAC)

此圖展示 tRPC procedure 中介層如何檢查使用者權限。三層 procedure 構成遞進式的權限檢查鏈。資料來源為 `packages/api/src/trpc.ts`。

```mermaid
flowchart TD
    REQ([API 請求進入])
    REQ --> PUB{"publicProcedure<br/>─────────<br/>不檢查認證<br/>ctx.session 可能為 null"}

    PUB -->|"如 health.check"| EXEC_PUB[執行 Procedure 邏輯]

    REQ --> PROT{"protectedProcedure<br/>─────────<br/>ctx.session 存在?<br/>ctx.session.user 存在?"}

    PROT -->|"否"| UNAUTH["TRPCError<br/>code: UNAUTHORIZED<br/>HTTP 401"]

    PROT -->|"是"| AUTH_OK["認證通過<br/>ctx.session.user 保證非 null"]

    AUTH_OK --> SUP_CHECK{"supervisorProcedure<br/>─────────<br/>role.name = Supervisor<br/>OR role.name = Admin?"}

    SUP_CHECK -->|"否"| FORBIDDEN_SUP["TRPCError<br/>code: FORBIDDEN<br/>需要 Supervisor 或 Admin 權限"]

    SUP_CHECK -->|"是"| SUP_OK["Supervisor 權限通過"]

    AUTH_OK --> ADMIN_CHECK{"adminProcedure<br/>─────────<br/>role.name = Admin?"}

    ADMIN_CHECK -->|"否"| FORBIDDEN_ADM["TRPCError<br/>code: FORBIDDEN<br/>需要 Admin 權限"]

    ADMIN_CHECK -->|"是"| ADMIN_OK["Admin 權限通過"]

    AUTH_OK --> EXEC_PROT[執行 protectedProcedure 邏輯]
    SUP_OK --> EXEC_SUP[執行 supervisorProcedure 邏輯]
    ADMIN_OK --> EXEC_ADM[執行 adminProcedure 邏輯]

    classDef start fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef check fill:#f59e0b,stroke:#d97706,color:#000
    classDef error fill:#ef4444,stroke:#dc2626,color:#fff
    classDef success fill:#10b981,stroke:#059669,color:#fff

    class REQ start
    class PUB,PROT,SUP_CHECK,ADMIN_CHECK check
    class UNAUTH,FORBIDDEN_SUP,FORBIDDEN_ADM error
    class AUTH_OK,SUP_OK,ADMIN_OK,EXEC_PUB,EXEC_PROT,EXEC_SUP,EXEC_ADM success
```

### 各 Procedure 類型的使用場景

| Procedure 類型 | 使用的 Router | 操作 |
|---------------|--------------|------|
| `publicProcedure` | health | diagnose, getConfig |
| `protectedProcedure` | project, budgetPool, budgetProposal, expense, purchaseOrder, quote, vendor, notification, omExpense, chargeOut, currency, operatingCompany, expenseCategory, dashboard | 大部分 CRUD 操作 |
| `supervisorProcedure` | budgetProposal (approve), expense (approve, reject), chargeOut (confirm, reject) | 審批/確認操作 |
| `adminProcedure` | user (create, delete), permission (setUserPermission, setUserPermissions, getRolePermissions) | 系統管理操作 |

---

## 6. FEAT-011 權限管理流程

此圖展示 FEAT-011 實作的細粒度權限系統，包含角色預設權限和使用者自訂覆蓋。資料來源為 `permission.ts` router 和 schema.prisma 的 Permission、RolePermission、UserPermission model。

```mermaid
flowchart TD
    subgraph "權限定義"
        PERM["Permission 表<br/>─────────<br/>code: 'menu:dashboard'<br/>code: 'project:create'<br/>code: 'proposal:approve'<br/>category: menu/project/proposal"]
    end

    subgraph "角色預設權限"
        RP_PM["RolePermission<br/>roleId: 1 (PM)<br/>─────────<br/>menu:dashboard ✓<br/>project:create ✓<br/>proposal:create ✓<br/>proposal:approve ✗"]

        RP_SUP["RolePermission<br/>roleId: 2 (Supervisor)<br/>─────────<br/>menu:dashboard ✓<br/>project:create ✓<br/>proposal:approve ✓<br/>expense:approve ✓"]

        RP_ADM["RolePermission<br/>roleId: 3 (Admin)<br/>─────────<br/>所有權限 ✓"]
    end

    subgraph "使用者自訂覆蓋"
        UP["UserPermission<br/>─────────<br/>userId + permissionId<br/>granted: true (授予)<br/>granted: false (撤銷)"]
    end

    subgraph "權限計算 (getMyPermissions)"
        CALC["有效權限 =<br/>角色預設權限<br/>+ 用戶授予 (granted=true)<br/>- 用戶撤銷 (granted=false)"]
    end

    subgraph "前端應用"
        SIDEBAR["Sidebar 菜單<br/>根據 menu:* 權限<br/>過濾顯示項目"]
        BUTTON["操作按鈕<br/>根據 action:* 權限<br/>控制可見/可用"]
    end

    PERM --> RP_PM
    PERM --> RP_SUP
    PERM --> RP_ADM
    PERM --> UP

    RP_PM --> CALC
    RP_SUP --> CALC
    RP_ADM --> CALC
    UP --> CALC

    CALC --> SIDEBAR
    CALC --> BUTTON

    classDef perm fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef role fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef user fill:#f59e0b,stroke:#d97706,color:#fff
    classDef calc fill:#10b981,stroke:#059669,color:#fff
    classDef ui fill:#6366f1,stroke:#4f46e5,color:#fff

    class PERM perm
    class RP_PM,RP_SUP,RP_ADM role
    class UP user
    class CALC calc
    class SIDEBAR,BUTTON ui
```

---

## 7. 完整專案生命週期

此圖展示一個 IT 專案從預算規劃到費用轉嫁的完整端到端業務流程。

```mermaid
flowchart LR
    subgraph "Phase 1: 預算規劃"
        BP_CREATE["建立 BudgetPool<br/>(financialYear)"]
        BC_CREATE["建立 BudgetCategory<br/>(Hardware, Software...)"]
        PROJ_CREATE["建立 Project<br/>(projectCode, managerId)"]
    end

    subgraph "Phase 2: 提案審批"
        PROP_CREATE["建立 BudgetProposal"]
        PROP_SUBMIT["提交審批"]
        PROP_APPROVE["Supervisor 批准<br/>→ Project.status = InProgress"]
    end

    subgraph "Phase 3: 採購執行"
        VEN_SELECT["選擇 Vendor"]
        QUO_UPLOAD["上傳 Quote"]
        PO_CREATE["建立 PurchaseOrder<br/>+ PurchaseOrderItem[]"]
    end

    subgraph "Phase 4: 費用記錄"
        EXP_CREATE["建立 Expense<br/>+ ExpenseItem[]"]
        EXP_SUBMIT["提交費用審批"]
        EXP_APPROVE["Supervisor 批准<br/>→ 預算池扣款"]
        EXP_PAY["標記已支付"]
    end

    subgraph "Phase 5: 費用轉嫁"
        CO_CREATE["建立 ChargeOut<br/>→ OpCo"]
        CO_CONFIRM["Supervisor 確認"]
        CO_PAY["收到付款"]
    end

    BP_CREATE --> BC_CREATE
    BC_CREATE --> PROJ_CREATE
    PROJ_CREATE --> PROP_CREATE
    PROP_CREATE --> PROP_SUBMIT
    PROP_SUBMIT --> PROP_APPROVE
    PROP_APPROVE --> VEN_SELECT
    VEN_SELECT --> QUO_UPLOAD
    QUO_UPLOAD --> PO_CREATE
    PO_CREATE --> EXP_CREATE
    EXP_CREATE --> EXP_SUBMIT
    EXP_SUBMIT --> EXP_APPROVE
    EXP_APPROVE --> EXP_PAY
    EXP_PAY --> CO_CREATE
    CO_CREATE --> CO_CONFIRM
    CO_CONFIRM --> CO_PAY

    classDef phase1 fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef phase2 fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef phase3 fill:#10b981,stroke:#059669,color:#fff
    classDef phase4 fill:#f59e0b,stroke:#d97706,color:#fff
    classDef phase5 fill:#ef4444,stroke:#dc2626,color:#fff

    class BP_CREATE,BC_CREATE,PROJ_CREATE phase1
    class PROP_CREATE,PROP_SUBMIT,PROP_APPROVE phase2
    class VEN_SELECT,QUO_UPLOAD,PO_CREATE phase3
    class EXP_CREATE,EXP_SUBMIT,EXP_APPROVE,EXP_PAY phase4
    class CO_CREATE,CO_CONFIRM,CO_PAY phase5
```

---

## 8. OM 費用管理流程 (FEAT-007)

此圖展示 OM (Operations & Maintenance) 費用的管理流程，包含 Excel 匯入路徑。

```mermaid
flowchart TD
    subgraph "建立方式"
        MANUAL["手動建立<br/>omExpense.create"]
        IMPORT["Excel 匯入<br/>data-import 頁面<br/>(FEAT-008)"]
        DERIVE["從 Expense 衍生<br/>(sourceExpenseId)"]
    end

    subgraph "OMExpense 管理"
        OME["OMExpense 表頭<br/>name, financialYear, category"]

        ADD_ITEM["addItem: 新增明細<br/>自動建立 12 個月度記錄"]
        UPDATE_ITEM["updateItem: 更新明細<br/>name, budgetAmount, opCoId"]
        REMOVE_ITEM["removeItem: 刪除明細<br/>級聯刪除月度記錄"]
        REORDER["reorderItems: 拖曳排序"]
        UPDATE_MONTHLY["updateItemMonthlyRecords<br/>更新各月實際支出"]
    end

    subgraph "自動匯總"
        SUM_BUDGET["totalBudgetAmount =<br/>SUM(items.budgetAmount)"]
        SUM_ACTUAL["totalActualSpent =<br/>SUM(items.actualSpent)"]
        YOY["calculateYoYGrowth<br/>年度增長率"]
    end

    subgraph "報表與分析"
        SUMMARY["getSummary<br/>OM Summary 報表"]
        MONTHLY_TOTALS["getMonthlyTotals<br/>月度支出匯總圖表"]
    end

    MANUAL --> OME
    IMPORT --> OME
    DERIVE --> OME

    OME --> ADD_ITEM
    OME --> UPDATE_ITEM
    OME --> REMOVE_ITEM
    OME --> REORDER
    OME --> UPDATE_MONTHLY

    UPDATE_MONTHLY --> SUM_ACTUAL
    ADD_ITEM --> SUM_BUDGET
    UPDATE_ITEM --> SUM_BUDGET
    REMOVE_ITEM --> SUM_BUDGET

    SUM_BUDGET --> YOY
    SUM_ACTUAL --> YOY

    SUM_BUDGET --> SUMMARY
    SUM_ACTUAL --> SUMMARY
    SUM_ACTUAL --> MONTHLY_TOTALS

    classDef create fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef manage fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef calc fill:#f59e0b,stroke:#d97706,color:#fff
    classDef report fill:#10b981,stroke:#059669,color:#fff

    class MANUAL,IMPORT,DERIVE create
    class OME,ADD_ITEM,UPDATE_ITEM,REMOVE_ITEM,REORDER,UPDATE_MONTHLY manage
    class SUM_BUDGET,SUM_ACTUAL,YOY calc
    class SUMMARY,MONTHLY_TOTALS report
```
