# 資料流圖

本文件描述 IT 專案流程管理平台中各項核心業務流程的資料流向，包含預算審批、費用管理、OM 費用、以及資料匯入等流程。

---

## 1. 核心業務流程總覽

此圖展示從預算池建立到費用轉嫁的完整業務資料流。每個方塊代表一個主要 Prisma Model，箭頭表示資料關聯方向。

```mermaid
graph TD
    BP["BudgetPool<br/>預算池<br/>(financialYear, totalAmount)"]
    BC["BudgetCategory<br/>預算類別<br/>(categoryName, totalAmount)"]
    PROJ["Project<br/>專案<br/>(status, requestedBudget)"]
    PROP["BudgetProposal<br/>預算提案<br/>(amount, status)"]

    VEN["Vendor<br/>供應商"]
    QUO["Quote<br/>報價單<br/>(amount, filePath)"]
    PO["PurchaseOrder<br/>採購單<br/>(totalAmount, status)"]
    POI["PurchaseOrderItem<br/>採購明細"]

    EXP["Expense<br/>費用<br/>(totalAmount, status)"]
    EXI["ExpenseItem<br/>費用明細<br/>(amount, categoryId)"]

    CO["ChargeOut<br/>費用轉嫁<br/>(totalAmount, status)"]
    COI["ChargeOutItem<br/>轉嫁明細<br/>(amount)"]
    OPCO["OperatingCompany<br/>營運公司"]

    BP --> BC
    BP --> PROJ
    BC --> PROJ
    PROJ --> PROP
    PROJ --> QUO
    PROJ --> PO
    PROJ --> CO

    VEN --> QUO
    VEN --> PO
    QUO --> PO

    PO --> POI
    PO --> EXP
    EXP --> EXI
    EXI --> COI
    CO --> COI
    OPCO --> CO

    classDef budget fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef procurement fill:#10b981,stroke:#059669,color:#fff
    classDef expense fill:#f59e0b,stroke:#d97706,color:#fff
    classDef chargeout fill:#ef4444,stroke:#dc2626,color:#fff

    class BP,BC,PROJ,PROP budget
    class VEN,QUO,PO,POI procurement
    class EXP,EXI expense
    class CO,COI,OPCO chargeout
```

---

## 2. 預算提案審批流程

此圖展示 BudgetProposal 的完整狀態流轉，包含每個狀態轉換觸發的資料庫操作和通知。資料來源為 `budgetProposal.ts` router 的 submit、approve 等 procedure。

```mermaid
stateDiagram-v2
    [*] --> Draft: create()

    Draft --> PendingApproval: submit()
    note right of PendingApproval
        觸發動作：
        1. History 記錄 "SUBMITTED"
        2. 通知 Supervisor
        3. Email 通知
    end note

    PendingApproval --> Approved: approve(action='Approved')
    note right of Approved
        觸發動作：
        1. 記錄 approvedAmount, approvedBy, approvedAt
        2. 更新 Project.approvedBudget
        3. 更新 Project.status = 'InProgress'
        4. History 記錄 "APPROVED"
        5. 通知 PM
    end note

    PendingApproval --> Rejected: approve(action='Rejected')
    note left of Rejected
        觸發動作：
        1. 記錄 rejectionReason
        2. History 記錄 "REJECTED"
        3. 通知 PM
    end note

    PendingApproval --> MoreInfoRequired: approve(action='MoreInfoRequired')
    note left of MoreInfoRequired
        觸發動作：
        1. 記錄 comment
        2. History 記錄 "MORE_INFO_REQUIRED"
        3. 通知 PM
    end note

    MoreInfoRequired --> PendingApproval: submit()

    Approved --> Draft: revertToDraft()
    note left of Draft
        revertToDraft 觸發：
        1. 清除 approvedAmount/approvedBy/approvedAt
        2. 回退 Project.approvedBudget
        3. History 記錄 "REVERTED"
    end note

    Rejected --> Draft: revertToDraft()
    MoreInfoRequired --> Draft: revertToDraft()

    Draft --> [*]: delete() (僅 Draft 可刪除)
```

---

## 3. 費用審批與支付流程

此圖展示 Expense 從建立到支付的完整資料流。approve 動作會觸發預算池自動扣款，reject 會將狀態退回。資料來源為 `expense.ts` router。

```mermaid
stateDiagram-v2
    [*] --> Draft: create()
    note right of Draft
        建立時：
        - 表頭 + ExpenseItem[]
        - 關聯 PurchaseOrder
        - totalAmount = SUM(items.amount)
    end note

    Draft --> Submitted: submit()
    note right of Submitted
        驗證：
        - 至少有一個 ExpenseItem
        - 清除 approvedDate
        - 通知 Supervisor
    end note

    Submitted --> Approved: approve() [supervisorProcedure]
    note right of Approved
        觸發動作：
        1. BudgetPool.usedAmount += totalAmount
        2. BudgetCategory.usedAmount += totalAmount
        3. 記錄 approvedDate
        4. 通知 PM
    end note

    Submitted --> Draft: reject() [supervisorProcedure]
    note left of Draft
        reject 觸發：
        - 退回 Draft 狀態
        - 記錄拒絕原因
        - 通知 PM
    end note

    Approved --> Paid: markAsPaid()
    note right of Paid
        記錄 paidDate
    end note

    Approved --> Draft: revertToDraft()
    note left of Draft
        revertToDraft 觸發：
        1. BudgetPool.usedAmount -= totalAmount
        2. BudgetCategory.usedAmount -= totalAmount
        3. 清除 approvedDate, paidDate
    end note

    Draft --> [*]: delete() (僅 Draft 可刪除)
```

---

## 4. 費用轉嫁 (ChargeOut) 流程

此圖展示 ChargeOut 的狀態流轉。ChargeOut 用於將 IT 費用分攤給各營運公司 (OpCo)，需要主管確認。資料來源為 `chargeOut.ts` router。

```mermaid
stateDiagram-v2
    [*] --> Draft: create()
    note right of Draft
        建立時：
        - 選擇 Project + OpCo
        - 添加 ChargeOutItem[]
        - 每個 Item 關聯一筆 Expense/ExpenseItem
        - totalAmount = SUM(items.amount)
    end note

    Draft --> Submitted: submit()
    note right of Submitted
        驗證：至少有一個 ChargeOutItem
    end note

    Submitted --> Confirmed: confirm() [supervisorProcedure]
    note right of Confirmed
        記錄 confirmedBy + confirmedAt
    end note

    Submitted --> Rejected: reject() [supervisorProcedure]

    Confirmed --> Paid: markAsPaid()
    note right of Paid
        記錄 paymentDate
    end note

    Draft --> [*]: delete()
    Rejected --> [*]: delete()
```

---

## 5. OM 費用表頭-明細資料流 (FEAT-007)

此圖展示 OM Expense 的三層資料架構：OMExpense (表頭) 包含多個 OMExpenseItem (明細)，每個明細再包含 12 筆 OMExpenseMonthly (月度記錄)。資料來源為 `omExpense.ts` router。

```mermaid
graph TB
    subgraph "OMExpense 表頭"
        OME["OMExpense<br/>表頭<br/>─────────<br/>name, financialYear<br/>category, categoryId<br/>totalBudgetAmount (自動匯總)<br/>totalActualSpent (自動匯總)<br/>defaultOpCoId<br/>vendorId, sourceExpenseId"]
    end

    subgraph "OMExpenseItem 明細 (1:N)"
        ITEM1["OMExpenseItem #1<br/>─────────<br/>name: 'TGT-DC'<br/>budgetAmount: 50,000<br/>actualSpent: 42,000<br/>opCoId: 'OpCo-HK'<br/>lastFYActualExpense"]
        ITEM2["OMExpenseItem #2<br/>─────────<br/>name: 'RDC2'<br/>budgetAmount: 30,000<br/>actualSpent: 28,000<br/>opCoId: 'OpCo-SG'"]
        ITEMN["OMExpenseItem #N<br/>..."]
    end

    subgraph "OMExpenseMonthly 月度記錄 (1:12)"
        M1["Month 1<br/>actualAmount"]
        M2["Month 2<br/>actualAmount"]
        M3["..."]
        M12["Month 12<br/>actualAmount"]
    end

    OME --> ITEM1
    OME --> ITEM2
    OME --> ITEMN

    ITEM1 --> M1
    ITEM1 --> M2
    ITEM1 --> M3
    ITEM1 --> M12

    classDef header fill:#7c3aed,stroke:#5b21b6,color:#fff
    classDef item fill:#2563eb,stroke:#1d4ed8,color:#fff
    classDef monthly fill:#059669,stroke:#047857,color:#fff

    class OME header
    class ITEM1,ITEM2,ITEMN item
    class M1,M2,M3,M12 monthly
```

### OM 費用操作資料流

```mermaid
sequenceDiagram
    participant UI as 前端頁面
    participant API as omExpense Router
    participant DB as PostgreSQL

    Note over UI,DB: createWithItems - 建立完整 OM 費用

    UI->>API: createWithItems({ name, items[] })
    API->>DB: $transaction 開始
    API->>DB: OMExpense.create (表頭)
    loop 每個 Item
        API->>DB: OMExpenseItem.create
        loop Month 1-12
            API->>DB: OMExpenseMonthly.create
        end
    end
    API->>DB: OMExpense.update (匯總 totalBudgetAmount)
    API->>DB: $transaction 結束
    API-->>UI: 完整 OMExpense + Items + Monthly

    Note over UI,DB: updateItemMonthlyRecords - 更新月度記錄

    UI->>API: updateItemMonthlyRecords({ itemId, records[] })
    API->>DB: $transaction 開始
    loop 每個月度記錄
        API->>DB: OMExpenseMonthly.upsert
    end
    API->>DB: OMExpenseItem.update (actualSpent = SUM)
    API->>DB: OMExpense.update (totalActualSpent = SUM)
    API->>DB: $transaction 結束
    API-->>UI: 更新後的 Item
```

---

## 6. Excel 資料匯入流程 (FEAT-008)

此圖展示 data-import 頁面的資料匯入流程。使用者上傳 Excel 檔案後，前端使用 xlsx 庫解析，經過欄位映射和驗證後，批量建立 OM Expense 記錄。

```mermaid
flowchart TD
    START([使用者開啟 Data Import 頁面])
    UPLOAD[選擇 Excel 檔案<br/>支援 .xlsx / .xls]
    PARSE["前端解析 (xlsx 庫)<br/>讀取 Sheet 資料"]
    PREVIEW["預覽資料<br/>顯示解析結果表格"]

    MAP["欄位映射<br/>Excel 欄位 → Model 欄位<br/>─────────<br/>name → OMExpense.name<br/>category → category<br/>opCo → defaultOpCoId<br/>budget → budgetAmount<br/>actual → actualSpent"]

    VALIDATE{"資料驗證"}
    VALID_OK["驗證通過"]
    VALID_ERR["驗證失敗<br/>顯示錯誤訊息<br/>─────────<br/>必填欄位缺失<br/>金額格式錯誤<br/>OpCo 不存在"]

    IMPORT["批量匯入<br/>呼叫 API createWithItems"]
    RESULT["匯入結果<br/>─────────<br/>成功筆數<br/>失敗筆數<br/>錯誤明細"]

    START --> UPLOAD
    UPLOAD --> PARSE
    PARSE --> PREVIEW
    PREVIEW --> MAP
    MAP --> VALIDATE

    VALIDATE -->|"通過"| VALID_OK
    VALIDATE -->|"失敗"| VALID_ERR
    VALID_ERR -->|"修正後重新驗證"| VALIDATE

    VALID_OK --> IMPORT
    IMPORT --> RESULT

    classDef start fill:#6366f1,stroke:#4f46e5,color:#fff
    classDef process fill:#3b82f6,stroke:#2563eb,color:#fff
    classDef decision fill:#f59e0b,stroke:#d97706,color:#000
    classDef error fill:#ef4444,stroke:#dc2626,color:#fff
    classDef success fill:#10b981,stroke:#059669,color:#fff

    class START start
    class UPLOAD,PARSE,PREVIEW,MAP,IMPORT process
    class VALIDATE decision
    class VALID_ERR error
    class VALID_OK,RESULT success
```

---

## 7. 預算池使用率即時追蹤 (Epic 6.5)

此圖展示 BudgetPool 和 BudgetCategory 的 usedAmount 如何透過 Expense 審批動作自動更新。

```mermaid
flowchart LR
    subgraph "Expense 審批"
        APPROVE["expense.approve()<br/>supervisorProcedure"]
        REJECT_REVERT["expense.revertToDraft()"]
    end

    subgraph "預算池更新 ($transaction)"
        BP_INC["BudgetPool.usedAmount<br/>+= expense.totalAmount"]
        BC_INC["BudgetCategory.usedAmount<br/>+= expense.totalAmount"]
        BP_DEC["BudgetPool.usedAmount<br/>-= expense.totalAmount"]
        BC_DEC["BudgetCategory.usedAmount<br/>-= expense.totalAmount"]
    end

    subgraph "Dashboard 顯示"
        USAGE["使用率 = usedAmount / totalAmount"]
        HEALTH["健康狀態指標<br/>Green/Yellow/Red"]
    end

    APPROVE -->|"increment"| BP_INC
    APPROVE -->|"increment"| BC_INC
    REJECT_REVERT -->|"decrement"| BP_DEC
    REJECT_REVERT -->|"decrement"| BC_DEC

    BP_INC --> USAGE
    BC_INC --> USAGE
    USAGE --> HEALTH

    classDef action fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef update fill:#f59e0b,stroke:#d97706,color:#fff
    classDef display fill:#10b981,stroke:#059669,color:#fff

    class APPROVE,REJECT_REVERT action
    class BP_INC,BC_INC,BP_DEC,BC_DEC update
    class USAGE,HEALTH display
```

---

## 8. 通知系統資料流 (Epic 8)

此圖展示狀態變更時如何觸發站內通知和 Email 通知。

```mermaid
flowchart TD
    subgraph "觸發事件"
        PROP_SUB["Proposal 提交<br/>→ 通知 Supervisor"]
        PROP_APP["Proposal 審批<br/>→ 通知 PM"]
        EXP_SUB["Expense 提交<br/>→ 通知 Supervisor"]
        EXP_APP["Expense 審批<br/>→ 通知 PM"]
    end

    subgraph "通知建立"
        CREATE_NOTIF["Notification.create<br/>─────────<br/>userId (接收者)<br/>type (事件類型)<br/>title, message<br/>link (相關頁面)<br/>entityType, entityId"]
    end

    subgraph "通知傳遞"
        INAPP["站內通知<br/>NotificationBell 組件<br/>isRead 追蹤"]
        EMAIL["Email 通知<br/>EmailService<br/>SendGrid / Mailhog"]
    end

    PROP_SUB --> CREATE_NOTIF
    PROP_APP --> CREATE_NOTIF
    EXP_SUB --> CREATE_NOTIF
    EXP_APP --> CREATE_NOTIF

    CREATE_NOTIF --> INAPP
    CREATE_NOTIF --> EMAIL

    classDef trigger fill:#8b5cf6,stroke:#6d28d9,color:#fff
    classDef create fill:#3b82f6,stroke:#1e40af,color:#fff
    classDef deliver fill:#10b981,stroke:#059669,color:#fff

    class PROP_SUB,PROP_APP,EXP_SUB,EXP_APP trigger
    class CREATE_NOTIF create
    class INAPP,EMAIL deliver
```
