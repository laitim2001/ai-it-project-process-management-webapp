# 客製化銷售智能體 - 全端架構文件

**版本**: 1.0  
**日期**: 2024-12-21  
**作者**: Winston (架構師)  
**狀態**: 完成

---

## 目錄

1. [介紹](#1-介紹)
2. [高階架構](#2-高階架構)
3. [技術棧](#3-技術棧)
4. [資料模型與架構](#4-資料模型與架構)
5. [核心元件](#5-核心元件)
6. [外部 API 整合](#6-外部-api-整合)
7. [核心工作流程](#7-核心工作流程)
8. [資料庫架構](#8-資料庫架構)
9. [統一專案結構](#9-統一專案結構)
10. [開發工作流程](#10-開發工作流程)
11. [部署架構](#11-部署架構)
12. [安全與效能](#12-安全與效能)

---

## 1. 介紹

本文件概述了「客製化銷售智能體」專案的完整全端架構，包括後端系統、前端實現及其整合。它作為 AI 驅動開發的唯一真相來源，確保整個技術棧的一致性。

### 1.1 起始模板或現有專案

專案將採用**Next.js全棧架構 (Full-Stack Next.js)**，提供快速開發和部署的能力。這種方法簡化了專案結構，減少了技術複雜度，適合5-7人的開發團隊快速迭代。

**選擇理由：**
- 對專案的每一部分都有完全的控制權和深入的理解
- 確保架構完全符合我們的特定需求
- 避免引入不必要的依賴或約束

### 1.2 變更日誌

| 日期 | 版本 | 描述 | 作者 |
| :--- | :--- | :--- | :--- |
| 2024-12-21 | 1.0 | 初始版本的全端架構 | Winston (架構師) |

---

## 2. 高階架構

### 2.1 技術摘要

本專案將採用 **Next.js 14 全棧架構**，使用 **App Router** 和 **Server Actions** 提供前後端一體化的開發體驗。數據層使用 **PostgreSQL** 配合 **pgvector** 擴展實現向量搜索，**Prisma** 作為 ORM 簡化數據操作。部署於雲端平台（Azure 或 Vercel），提供自動擴容和 CDN 加速。此簡化架構大幅降低了技術複雜度，讓5-7人團隊能夠專注於業務價值開發，同時保持良好的可擴展性。

### 2.2 平台與基礎設施選擇

- **平台**: **Microsoft Azure**
  - **理由**: 與專案簡報中深度整合 Microsoft 生態系的策略完全一致
  
- **關鍵服務**:
  - **Azure App Service** 或 **Vercel**: 託管 Next.js 全棧應用程式，提供全球 CDN 加速和自動擴容
  - **Azure OpenAI Service**: 核心 AI 模型服務
  - **Azure AI Search**: 用於建立強大的知識庫搜尋索引（混合搜尋）
  - **PostgreSQL with pgvector**: 主要的關聯式資料庫，整合向量搜尋功能
  - **Azure Blob Storage**: 儲存非結構化資料（文件、檔案）
  - **Azure Logic Apps**: 處理與 Dynamics 365 的同步工作流程
  - **Azure API Management**: 作為統一的 API 網關
  - **Azure Active Directory (Azure AD)**: 用於身份驗證與授權
  - **Azure Functions**: 處理計算密集的 AI 任務

- **部署區域**: 主要部署在**東南亞 (Southeast Asia)**，以服務馬來西亞和新加坡的初始團隊

### 2.3 儲存庫結構

- **結構**: **Next.js 標準專案結構**
- **管理工具**: **pnpm** (高效的套件管理)

**選擇 Next.js 全棧的理由**:
1. **簡化架構**: 前後端統一在單一應用程式中，減少維護複雜度
2. **開發效率**: Server Components 和 Server Actions 簡化了 API 開發
3. **部署簡化**: 單一應用程式的部署比分離的前後端更容易管理
4. **團隊適用**: 5-7人團隊更容易掌握統一的技術棧

### 2.4 高階架構圖

```mermaid
graph TD
    subgraph 使用者互動
        User[銷售人員]
    end

    subgraph 前端層
        WebApp[Next.js 前端<br>on Azure Static Web Apps]
    end

    subgraph Azure 雲端
        APIM[Azure API Management]

        subgraph 應用服務
            NextjsApp[Next.js 全棧應用<br>on Azure App Service / Vercel]
            CRM_Connector[CRM 連接器<br>內建於 Next.js]
        end

        subgraph 資料與 AI
            PostgreSQL[PostgreSQL with pgvector]
            BlobStorage[Azure Blob Storage]
            AISearch[Azure AI Search<br>(向量索引)]
            OpenAI[Azure OpenAI Service]
        end

        subgraph 身份管理
            AzureAD[Azure AD]
        end
    end

    subgraph 外部系統
        D365[Dynamics 365 CRM]
        Tavily[Tavily API]
    end

    User --> WebApp
    WebApp --> APIM
    APIM --> API_App
    APIM --> AI_Functions

    API_App -- 管理認證 --> AzureAD
    API_App -- 讀寫資料 --> AzureSQL
    API_App -- 儲存/檢索檔案 --> BlobStorage
    API_App -- 調用 --> AI_Functions

    AI_Functions -- 語意搜尋 --> AISearch
    AI_Functions -- 內容生成 --> OpenAI
    AI_Functions -- 外部研究 --> Tavily
    AISearch -- 索引內容來自 --> BlobStorage

    CRM_Connector -- 同步資料 --> D365
    CRM_Connector -- 更新 --> AzureSQL
```

### 2.5 架構模式

- **模組化單體 (Modular Monolith)**: 後端將作為一個單獨的部署單元，但內部會劃分清晰的模組邊界。這平衡了初期的開發速度和未來的擴展性
- **針對 AI 工作負載的無伺服器函數**: 計算密集的 AI 任務將由獨立的 Azure Functions 處理，以實現成本效益和按需擴展
- **API 網關**: 所有客戶端請求都將通過 Azure API Management 進入後端
- **基於元件的 UI**: 前端將採用 React 元件化的方法，並建立共享的 UI 庫

---

## 3. 技術棧

### 3.1 技術棧決策過程

在確定技術棧之前，我們進行了深入的技術評估和比較，特別是在以下幾個關鍵決策點：

#### 架構簡化決策：全棧 vs 分離

**最終選擇：Next.js 全棧架構**

| 特性 | Next.js 全棧 | 分離式架構 (NestJS + Next.js) |
| :--- | :--- | :--- |
| **開發複雜度** | 低 - 單一應用程式 | 高 - 需要維護兩個應用程式 |
| **部署複雜度** | 低 - 單一部署單元 | 高 - 需要協調兩個服務 |
| **團隊學習成本** | 低 - 統一技術棧 | 高 - 前後端分離技能 |
| **適合團隊規模** | 5-7 人小團隊 | 10+ 人大團隊 |
| **MVP 開發速度** | 快速 | 較慢 |

**選擇理由**: 對於 MVP 階段和5-7人團隊，Next.js 全棧架構能夠顯著提升開發效率，降低維護成本。

#### 前端狀態管理：Zustand vs Redux

**最終選擇：Zustand**

**選擇理由**:
1. **開發速度與簡潔性**: 低樣板程式碼特性將讓團隊能更快地開發功能
2. **AI 友好**: API 非常直觀，AI 代理更容易生成正確的狀態管理程式碼
3. **效能易於掌握**: 預設的「訂閱 state 片段」行為，避免不必要的重新渲染

### 3.2 最終技術棧清單

| 分類 | 技術 | 版本 | 用途 | 理由 |
| :--- | :--- | :--- | :--- | :--- |
| **前端語言** | TypeScript | `~5.4.0` | 前端開發語言 | 提供類型安全，與後端統一 |
| **全棧框架** | Next.js 14 | `~14.2.0` | 全棧應用框架 | App Router + Server Actions |
| **UI 元件庫** | Tailwind CSS | `~3.4.0` | CSS 框架 | Utility-first，高度可客製化 |
| **無樣式元件** | Headless UI | `~2.0.0` | 無障礙元件庫 | 與 Tailwind 完美結合 |
| **狀態管理** | Zustand | `~4.5.0` | 客戶端狀態管理 | 輕量、簡單，基於 Hooks |
| **API 風格** | Server Actions + tRPC | N/A | 類型安全的 API | End-to-end 類型安全 |
| **資料庫 ORM** | Prisma | `~5.14.0` | 資料庫存取 | 優異的 TypeScript 支援 |
| **資料庫** | PostgreSQL | `16` | 主要關聯式資料庫 | 支援 JSONB 和向量擴充 |
| **快取** | Redis | `7.2` | 快取與 Session | 高效能記憶體資料庫 |
| **檔案儲存** | Azure Blob Storage | N/A | 文件儲存 | Azure 原生整合 |
| **身份驗證** | Azure AD | N/A | 企業級身份驗證 | Microsoft 生態整合 |
| **前端測試** | Jest + RTL | `~29.7.0` | 元件測試 | React 官方推薦 |
| **後端測試** | Jest | `~29.7.0` | 單元測試 | NestJS 內建支援 |
| **E2E 測試** | Playwright | `~1.44.0` | 端對端測試 | Microsoft 出品，穩定 |
| **部署平台** | Vercel / Azure App Service | N/A | 應用程式託管 | 簡化部署，自動擴容 |
| **CI/CD** | GitHub Actions | N/A | 持續整合部署 | 與 GitHub 原生整合 |
| **監控** | Azure Monitor | N/A | 應用程式監控 | Azure 原生服務 |
| **日誌** | Azure Log Analytics | N/A | 日誌聚合分析 | 與 Azure Monitor 整合 |

---

## 4. 資料模型與架構

### 4.1 核心資料模型決策

在設計資料模型時，我們面臨了一個關鍵決策：是否將 `Contact` 設計為獨立的模型，還是作為 `Customer` 的 JSONB 欄位。

**最終決定：將 Contact 設計為獨立的模型**

**理由**:
1. **避免可預見的重構**: 查詢特定聯絡人幾乎是 CRM 類應用必然會出現的需求
2. **Prisma 的強大能力**: 可以大幅減輕額外開發的複雜度
3. **奠定堅實的基礎**: 清晰、規範化的資料庫結構

### 4.2 實體關聯圖 (ERD)

```mermaid
erDiagram
    USER {
        string id PK "UUID"
        string azureAdObjectId "Azure AD Object ID"
        string name
        string email
        UserRole role
        datetime createdAt
        datetime updatedAt
    }

    KNOWLEDGE_DOCUMENT {
        string id PK "UUID"
        string title
        string sourceUrl "URL to Azure Blob Storage"
        DocumentStatus status
        string authorId FK "Creator of the document"
        array_string tags
        datetime createdAt
        datetime updatedAt
    }

    CUSTOMER {
        string id PK "UUID"
        string crmId "ID in Dynamics 365"
        string name
        string industry
        string size
        datetime createdAt
        datetime updatedAt
    }

    CONTACT {
        string id PK "UUID"
        string name
        string title
        string email
        string phone
        string customerId FK
        datetime createdAt
        datetime updatedAt
    }

    PROPOSAL {
        string id PK "UUID"
        string title
        string customerId FK "Associated customer"
        string authorId FK "Creator of the proposal"
        ProposalStatus status
        json content "Structured content"
        datetime createdAt
        datetime updatedAt
    }

    USER ||--o{ KNOWLEDGE_DOCUMENT : "creates"
    USER ||--o{ PROPOSAL : "creates"
    CUSTOMER ||--o{ PROPOSAL : "is for"
    CUSTOMER ||--o{ CONTACT : "has"
```

### 4.3 儲存策略

#### KnowledgeDocument 的 content 和 embedding 儲存策略

經過深入討論，我們決定採用**混合儲存策略**：

1. **content (內容) 儲存**:
   - **位置**: Azure Blob Storage
   - **策略**: 原始文件和純文字版本都存在 Blob Storage
   - **資料庫**: 只儲存指向 Blob Storage 的 URL

2. **embedding (向量) 儲存**:
   - **位置**: Azure AI Search
   - **理由**: 
     - 生態系整合完美
     - 支援混合搜尋（關鍵字 + 向量）
     - Azure 管理所有複雜性

**工作流程圖**:
```mermaid
graph TD
    subgraph 文件導入階段
        A[使用者上傳檔案] --> B{後端 API}
        B --> C[1. 儲存原始檔案到 Blob Storage]
        B --> D[2. 在 PostgreSQL 創建元資料]
        C --> E{Azure Function}
        E --> F[3. 提取文字]
        F --> G[4. 文字分塊]
        G --> H[5. 從 Azure OpenAI 獲取向量]
        H --> I[6. 在 Azure AI Search 索引文字和向量]
    end

    subgraph 使用者搜尋階段
        J[使用者查詢] --> K{後端 API}
        K --> L[1. 從 Azure OpenAI 獲取查詢向量]
        L --> M[2. 在 Azure AI Search 執行混合搜尋]
        M --> N[3. 獲取相關文件 ID]
        N --> O[4. 從 PostgreSQL 檢索完整元資料]
        O --> P[5. 回傳結果給使用者]
    end
```

---

## 5. 核心元件

### 5.1 後端元件 (`apps/api` - NestJS)

#### AuthModule (認證模組)
- **職責**: 處理所有與使用者身份驗證和授權相關的邏輯
- **主要介面**:
  - `POST /auth/login`: 使用 Azure AD 進行登入
  - `POST /auth/refresh`: 更新 Access Token
- **技術**: NestJS Passport, JWT

#### UserModule (使用者模組)
- **職責**: 管理使用者資料，包括角色和權限
- **主要介面**:
  - `GET /users/me`: 獲取當前使用者資訊
  - `GET /users`: (Admin) 獲取使用者列表

#### KnowledgeBaseModule (知識庫模組)
- **職責**: 處理知識庫文件的管理和搜尋
- **主要介面**:
  - `POST /documents/search`: 語意搜尋
  - `POST /documents/upload`: 文件上傳
  - CRUD 操作

#### ProposalModule (提案模組)
- **職責**: 處理提案的創建、生成和管理
- **主要介面**:
  - `POST /proposals`: 創建新提案
  - `GET /proposals`: 獲取提案列表

#### CustomerModule (客戶模組)
- **職責**: 管理客戶資料，與 CRM 同步
- **主要介面**:
  - `GET /customers`: 獲取客戶列表
  - `GET /customers/:id`: 360度視圖

#### AISearchService (AI 搜尋服務 - Serverless)
- **部署方式**: Azure Functions
- **職責**: 封裝所有 AI 相關的複雜邏輯
- **主要功能**:
  - `indexDocument`: 文件向量化和索引
  - `semanticSearch`: 執行混合搜尋
  - `generateContent`: 內容生成

### 5.2 前端元件 (`apps/web` - Next.js)

- **Authentication Components**: 登入頁面、路由保護
- **Dashboard Components**: 儀表板、智慧提醒
- **KnowledgeBase Components**: 搜尋介面、文件檢視器
- **Proposal Components**: 提案編輯器、工作流程
- **Shared UI Library (`packages/ui`)**: 基礎元件庫（Button, Card 等）

### 5.3 元件互動圖

```mermaid
graph TD
    subgraph 前端 (apps/web)
        AuthComp[認證元件] -->|API 呼叫| APIM
        DashboardComp[儀表板] -->|API 呼叫| APIM
        KBComp[知識庫] -->|API 呼叫| APIM
        ProposalComp[提案] -->|API 呼叫| APIM
    end

    subgraph Azure 雲端
        APIM(Azure API Management)
        
        subgraph 後端 (apps/api - NestJS)
            AuthMod[AuthModule]
            UserMod[UserModule]
            KBMod[KnowledgeBaseModule]
            PropMod[ProposalModule]
            CustMod[CustomerModule]
        end

        subgraph Serverless Functions
            AISearchSvc[AISearchService]
        end
    end

    APIM --> AuthMod
    APIM --> UserMod
    APIM --> KBMod
    APIM --> PropMod
    APIM --> CustMod

    KBMod -->|內部呼叫| AISearchSvc
    PropMod -->|內部呼叫| AISearchSvc
```

### 5.4 AISearchService 部署細節

**為什麼選擇 Serverless**:
1. **事件驅動**: 自動觸發處理
2. **彈性擴展**: 從零到數百個實例
3. **成本效益**: 只為執行時間付費
4. **關注點分離**: AI 邏輯與主後端分離

**具體函數劃分**:

1. **indexDocumentOnUpload**
   - 觸發器: Blob Storage Trigger
   - 功能: 文件上傳時自動索引

2. **performSemanticSearch**
   - 觸發器: HTTP Trigger
   - 功能: 執行語意搜尋

3. **generateProposalContent**
   - 觸發器: HTTP/Queue Trigger
   - 功能: AI 內容生成

---

## 6. 外部 API 整合

### 6.1 Microsoft Dynamics 365 Web API
- **用途**: 主要的客戶、聯絡人和銷售活動資料來源
- **整合方式**: 透過 Azure Logic App (CRM Connector) 非同步處理
- **認證**: OAuth 2.0 (Client Credentials Flow)
- **關鍵端點**:
  - `GET /api/data/v9.2/accounts`: 公司客戶
  - `GET /api/data/v9.2/contacts`: 聯絡人
  - `GET /api/data/v9.2/opportunities`: 商機

### 6.2 Tavily API

經過評估不同的新聞 API 選項後，我們選擇了 **Tavily API**。

**選擇理由**:
- **AI 整合式搜尋**: 專為 AI 應用設計
- **流程極簡**: 一次 API 呼叫完成所有工作
- **直接回答**: 不只是連結列表，而是綜合答案

**整合方式**:
- 由 `AISearchService` Azure Function 呼叫
- 用於「會前情報生成」功能
- 提供即時市場洞察

---

## 7. 核心工作流程

### 7.1 使用者搜尋文件

```mermaid
sequenceDiagram
    participant User as 銷售人員
    participant WebApp as Next.js 前端
    participant APIM as Azure API Management
    participant Backend as NestJS API
    participant AISearchFunc as Azure Function
    participant AzureAISearch as Azure AI Search
    participant AzureOpenAI as Azure OpenAI Service

    User->>WebApp: 1. 輸入查詢 "Docuware 安全性案例"
    WebApp->>APIM: 2. POST /documents/search
    
    APIM->>Backend: 3. 轉發請求 (驗證 JWT)
    
    Backend->>AISearchFunc: 4. 呼叫語意搜尋函數
    
    AISearchFunc->>AzureOpenAI: 5. 獲取查詢向量
    AzureOpenAI-->>AISearchFunc: 6. 回傳查詢向量

    AISearchFunc->>AzureAISearch: 7. 執行混合搜尋
    AzureAISearch-->>AISearchFunc: 8. 回傳相關文件片段

    AISearchFunc->>AzureOpenAI: 9. (可選) 生成摘要
    AzureOpenAI-->>AISearchFunc: 10. 回傳綜合摘要

    AISearchFunc-->>Backend: 11. 回傳結構化結果

    Backend->>Backend: 12. 豐富元資料
    
    Backend-->>APIM: 13. 回傳最終回應
    APIM-->>WebApp: 14. 轉發回應

    WebApp->>User: 15. 渲染搜尋結果頁面
```

### 7.2 會前情報生成

```mermaid
sequenceDiagram
    participant Calendar as Outlook/Google Calendar
    participant LogicApp as Azure Logic App
    participant Backend as NestJS API
    participant Tavily as Tavily API
    participant AISearchFunc as Azure Function
    participant D365 as Dynamics 365
    participant User as 銷售人員

    Note over Calendar, LogicApp: 每日定時掃描
    LogicApp->>Calendar: 1. 檢查未來 24 小時會議
    Calendar-->>LogicApp: 2. 回傳即將到來的會議

    LogicApp->>LogicApp: 3. 識別外部參與者
    LogicApp->>Backend: 4. 觸發情報準備

    Backend->>D365: 5. 查詢 CRM 資料
    D365-->>Backend: 6. 回傳 CRM 數據

    Backend->>Tavily: 7. 查詢最新新聞
    Tavily-->>Backend: 8. 回傳相關洞察

    Backend->>AISearchFunc: 9. 請求生成簡報
    AISearchFunc->>AISearchFunc: 10. 綜合資訊
    AISearchFunc->>AzureOpenAI: 11. 調用 GPT-4
    AzureOpenAI-->>AISearchFunc: 12. 回傳會議簡報

    AISearchFunc-->>Backend: 13. 回傳簡報內容

    Backend->>Backend: 14. 儲存簡報
    Backend->>User: 15. 透過 Email/Teams 推送
```

### 7.3 AI 提案生成

```mermaid
sequenceDiagram
    participant User as 銷售人員
    participant WebApp as Next.js 前端
    participant Backend as NestJS API
    participant AISearchFunc as Azure Function
    participant AzureAISearch as Azure AI Search
    participant SQL_DB as PostgreSQL with pgvector

    User->>WebApp: 1. 選擇客戶、輸入需求
    WebApp->>Backend: 2. POST /proposals

    Backend->>SQL_DB: 3. 創建提案記錄
    SQL_DB-->>Backend: 4. 回傳 proposalId

    Backend->>SQL_DB: 5. 獲取客戶資料
    SQL_DB-->>Backend: 6. 回傳客戶資料

    Backend->>AzureAISearch: 7. 搜尋相關知識
    AzureAISearch-->>Backend: 8. 回傳相關內容

    Backend->>AISearchFunc: 9. 呼叫內容生成

    AISearchFunc->>AzureOpenAI: 10. 調用 GPT-4
    AzureOpenAI-->>AISearchFunc: 11. 回傳生成內容
    AISearchFunc-->>Backend: 12. 回傳內容

    Backend->>SQL_DB: 13. 更新提案記錄
    
    Backend-->>WebApp: 14. 回應成功
    WebApp->>User: 15. 顯示提案草稿
```

### 7.4 CRM 資料同步

```mermaid
sequenceDiagram
    participant D365 as Dynamics 365
    participant LogicApp as Azure Logic App
    participant SQL_DB as PostgreSQL with pgvector

    Note over D365, LogicApp: 事件驅動
    D365->>LogicApp: 1. 記錄變更觸發 Webhook
    
    LogicApp->>LogicApp: 2. 轉換數據格式
    
    LogicApp->>SQL_DB: 3. 執行 Upsert
    SQL_DB->>SQL_DB: 4. 更新或插入記錄
    
    SQL_DB-->>LogicApp: 5. 回傳成功
    
    alt 操作失敗
        LogicApp->>LogicApp: 6a. 記錄錯誤
        LogicApp->>DLQ as Dead-Letter Queue: 6b. 放入死信佇列
    end
```

---

## 8. 資料庫架構

### 8.1 Prisma Schema

```prisma
// This is your Prisma schema file
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String   @id @default(uuid())
  azureAdObjectId String   @unique
  name            String
  email           String   @unique
  role            UserRole @default(SALES_PERSON)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  createdDocuments KnowledgeDocument[] @relation("CreatedBy")
  createdProposals Proposal[]          @relation("CreatedBy")
}

enum UserRole {
  SALES_PERSON
  SALES_MANAGER
  ADMIN
}

model KnowledgeDocument {
  id        String   @id @default(uuid())
  title     String
  sourceUrl String?  // URL to Azure Blob Storage
  status    DocumentStatus @default(DRAFT)
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  authorId String
  author   User   @relation("CreatedBy", fields: [authorId], references: [id])
}

enum DocumentStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model Customer {
  id          String   @id @default(uuid())
  crmId       String   @unique // ID in Dynamics 365
  name        String
  industry    String?
  size        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  proposals Proposal[]
  contacts  Contact[]
}

model Contact {
  id         String   @id @default(uuid())
  name       String
  title      String?
  email      String   @unique
  phone      String?
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])
}

model Proposal {
  id        String   @id @default(uuid())
  title     String
  status    ProposalStatus @default(DRAFT)
  content   Json?    // Structured proposal content
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  customerId String
  customer   Customer @relation(fields: [customerId], references: [id])

  authorId String
  author   User     @relation("CreatedBy", fields: [authorId], references: [id])
}

enum ProposalStatus {
  DRAFT
  SENT
  ACCEPTED
  REJECTED
}
```

---

## 9. 統一專案結構

### 9.1 Monorepo 結構

```plaintext
/apps
  /api             -- NestJS 後端應用
    /prisma
      /migrations
      schema.prisma  -- 我們的資料庫架構
      seed.ts        -- 種子資料腳本
    /src
      /auth          -- AuthModule
      /users         -- UserModule
      /knowledge-base-- KnowledgeBaseModule
      /proposals     -- ProposalModule
      /customers     -- CustomerModule
      /core          -- 核心服務 (如 PrismaService)
      app.module.ts
      main.ts
    .env.example
    jest.config.ts
    nest-cli.json
    package.json
    tsconfig.app.json
  /web             -- Next.js 前端應用
    /src
      /app           -- App Router
        /(auth)      -- 認證頁面路由群組
          /login
            page.tsx
        /(main)      -- 主應用路由群組
          /dashboard
          /customers
          /proposals
          layout.tsx -- 主要版面配置
        globals.css
        layout.tsx   -- 根版面配置
      /components    -- 可重用 UI 元件
      /features      -- 功能特定元件和 hooks
      /hooks         -- 應用程式級別的自訂 hooks
      /lib           -- 函式庫功能 (如 API client)
      /stores        -- Zustand stores
      /types         -- 前端特定的類型
    .env.local.example
    jest.config.ts
    next.config.js
    package.json
    postcss.config.js
    tailwind.config.ts
    tsconfig.json
/docs                -- 專案文件
/infrastructure
  /terraform       -- Azure 的 Terraform 腳本
/packages
  /shared          -- 前後端共享程式碼
    /src
      /index.ts
      /types         -- 共享的 DTOs 和介面
    package.json
    tsconfig.json
  /ui              -- 共享的 React 元件庫
    /.storybook    -- Storybook 設定
    /src
      /index.ts
      /components
        /Button
          Button.tsx
          Button.stories.tsx
          Button.test.tsx
        /Card
          Card.tsx
          Card.stories.tsx
          Card.test.tsx
    package.json
    tsconfig.json
/tools               -- Monorepo 的腳本和工具
.husky/              -- Git hooks
  pre-commit
nx.json
package.json
tsconfig.base.json
docker-compose.yml
```

### 9.2 共享策略

#### packages/shared 中的 DTOs 策略

**單一事實來源策略**:
1. Prisma schema 是唯一事實來源
2. 自動生成類型並導出到 `packages/shared`
3. 前後端都從 `@my-org/shared` 導入類型

**優點**:
- 真正的端到端類型安全
- 零重複定義
- 易於維護

#### packages/ui 與 Storybook 整合

**整合策略**:
1. 每個元件都有對應的 `.stories.tsx`
2. 獨立的開發環境
3. 視覺回歸測試整合

**優點**:
- 加速開發
- 提升品質
- 生成動態文件

---

## 10. 開發工作流程

### 10.1 本地開發設置

#### 先決條件
- Node.js v20.x LTS
- pnpm (套件管理器)
- Docker Desktop
- Git

#### 首次安裝
```bash
# 1. 安裝所有相依套件
pnpm install

# 2. 複製環境變數設定檔
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local

# 3. 啟動 Docker 容器 (PostgreSQL & Redis)
docker-compose up -d

# 4. 執行資料庫遷移
pnpm nx prisma-migrate-dev --workspace=api

# 5. (可選) 填充種子資料
pnpm nx prisma-seed --workspace=api
```

#### 日常開發指令
```bash
# 啟動所有服務
pnpm nx run-many --target=serve

# 只啟動後端 API
pnpm nx serve api

# 只啟動前端 Web
pnpm nx serve web

# 啟動 Storybook
pnpm nx storybook ui

# 執行所有測試
pnpm nx run-many --target=test
```

### 10.2 環境變數配置

#### 後端 (`apps/api/.env`)
```bash
# PostgreSQL
DATABASE_URL="postgresql://user:password@localhost:5432/sales_copilot_db?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="YOUR_SUPER_SECRET_KEY_FOR_DEVELOPMENT"

# Azure AD
AZURE_AD_CLIENT_ID="..."
AZURE_AD_CLIENT_SECRET="..."
AZURE_AD_TENANT_ID="..."

# Azure Storage
AZURE_STORAGE_CONNECTION_STRING="..."

# AI Services
AZURE_OPENAI_ENDPOINT="..."
AZURE_OPENAI_API_KEY="..."

# External APIs
TAVILY_API_KEY="..."
```

#### 前端 (`apps/web/.env.local`)
```bash
# API URL
NEXT_PUBLIC_API_URL="http://localhost:3333/api"

# Azure AD (MSAL)
NEXT_PUBLIC_AZURE_AD_CLIENT_ID="..."
NEXT_PUBLIC_AZURE_AD_AUTHORITY="..."
NEXT_PUBLIC_AZURE_AD_REDIRECT_URI="http://localhost:4200"
```

### 10.3 種子資料策略

**位置**: `apps/api/prisma/seed.ts`

**內容**:
1. **使用者**: 3-4 個不同角色的使用者
2. **客戶與聯絡人**: 5-10 個假客戶，每個 2-3 個聯絡人
3. **知識庫文件**: 15-20 份示範文件
4. **提案**: 2-3 個不同狀態的提案

**執行**: `pnpm nx prisma-seed --workspace=api`

### 10.4 品質保證策略

#### Husky + lint-staged 整合

**設定**:
```json
// package.json
"lint-staged": {
  "apps/**/*.{ts,tsx,js,jsx}": [
    "pnpm nx affected:lint --fix --uncommitted",
    "pnpm nx format:write --uncommitted"
  ],
  "packages/**/*.{ts,tsx,js,jsx}": [
    "pnpm nx affected:lint --fix --uncommitted",
    "pnpm nx format:write --uncommitted"
  ]
}
```

**優點**:
- 自動化品質保證
- 高效（只檢查受影響的專案）
- 早期錯誤發現

---

## 11. 部署架構

### 11.1 部署策略

- **前端 (`apps/web`)**: 
  - 平台: Azure Static Web Apps
  - 部署: GitHub Actions 自動建構並部署到全球 CDN

- **後端 (`apps/api`)**: 
  - 平台: Azure App Service (Linux, Node.js)
  - 部署: Docker 映像透過 Azure Container Registry

- **AI 服務 (`packages/ai-service`)**: 
  - 平台: Azure Functions
  - 部署: 直接部署函數程式碼

- **基礎設施**: 
  - 工具: Terraform
  - 部署: 需要手動批准的 GitHub Actions

### 11.2 CI/CD 管道

```yaml
# .github/workflows/main.yml (簡化版)
name: CI/CD Pipeline

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  # 1. Lint 和測試階段
  lint_and_test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: pnpm nx affected:lint --base=origin/main
      - run: pnpm nx affected:test --base=origin/main

  # 2. 建構階段
  build:
    needs: lint_and_test
    runs-on: ubuntu-latest
    steps:
      - run: pnpm nx affected:build --base=origin/main

  # 3. 部署階段 (僅限 main 分支)
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: build
    runs-on: ubuntu-latest
    steps:
      # 部署步驟...
```

### 11.3 環境

| 環境 | 前端 URL | 後端 URL | 用途 |
| :--- | :--- | :--- | :--- |
| **Development** | `localhost:4200` | `localhost:3333/api` | 本地開發 |
| **Staging** | `staging.salescopilot.com` | `api-staging.salescopilot.com` | QA 和 UAT |
| **Production** | `app.salescopilot.com` | `api.salescopilot.com` | 生產環境 |

---

## 12. 安全與效能

### 12.1 安全需求

- **前端**: 
  - 實施嚴格的內容安全策略 (CSP)
  - 所有敏感資料在記憶體中處理

- **後端**:
  - 所有 API 端點預設需要 JWT 認證
  - 使用 class-validator 進行輸入驗證
  - API Gateway 層級的速率限制

- **認證**:
  - 完全委託給 Azure AD
  - 前端使用 MSAL for React
  - Token 安全儲存策略

### 12.2 效能優化

- **前端**:
  - Next.js SSG/SSR/ISR 策略
  - 圖片優化使用 Next.js Image
  - 程式碼分割和懶加載

- **後端**:
  - Redis 快取層
  - 資料庫查詢優化
  - 連接池管理

- **AI 服務**:
  - 異步處理架構
  - 智能快取策略
  - 成本優化方案

---

## 結論

這份架構文件定義了「客製化銷售智能體」專案的完整技術藍圖。從高階概念到具體實現細節，我們已經為開發團隊和 AI 代理提供了清晰的指導方針。

**下一步驟**:
1. 架構文件已完成
2. 準備移交給產品負責人 (PO) 進行最終驗證
3. 開始第一個 Epic 的開發

---

## 13. 錯誤處理與復原策略

### 13.1 全局錯誤處理架構

#### NestJS 全局異常過濾器

**實現位置**: `apps/api/src/core/filters/`

```typescript
// global-exception.filter.ts
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : 500;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      correlationId: request.headers['x-correlation-id'],
      error: this.formatError(exception)
    };

    // 記錄到 Azure Application Insights
    this.logError(errorResponse, exception);

    response.status(status).json(errorResponse);
  }
}
```

#### 統一錯誤回應格式

**標準錯誤回應結構**:
```json
{
  "statusCode": 400,
  "timestamp": "2024-12-21T10:30:00.000Z",
  "path": "/api/v1/documents/search",
  "correlationId": "550e8400-e29b-41d4-a716-446655440000",
  "error": {
    "code": "SEARCH_001",
    "message": "搜尋查詢參數無效",
    "details": "查詢字串不能為空",
    "type": "ValidationError"
  }
}
```

#### 錯誤碼規範 (6位數字系統)

| 模組 | 前綴 | 範圍 | 示例 |
|------|------|------|------|
| **認證** | AUTH | 100001-100999 | AUTH_001: 無效的JWT Token |
| **用戶管理** | USER | 101001-101999 | USER_001: 用戶不存在 |
| **知識庫** | KBASE | 102001-102999 | KBASE_001: 文件索引失敗 |
| **提案** | PROP | 103001-103999 | PROP_001: 提案生成逾時 |
| **客戶** | CUST | 104001-104999 | CUST_001: CRM 同步失敗 |
| **AI 服務** | AI | 105001-105999 | AI_001: OpenAI API 限制 |
| **系統** | SYS | 900001-900999 | SYS_001: 資料庫連接失敗 |

### 13.2 錯誤分類與處理策略

#### 業務邏輯錯誤 (4xx)

```typescript
// Custom business exceptions
export class BusinessException extends HttpException {
  constructor(
    code: string,
    message: string,
    details?: string,
    statusCode: number = 400
  ) {
    super({
      code,
      message,
      details,
      type: 'BusinessError'
    }, statusCode);
  }
}

// 使用示例
throw new BusinessException(
  'KBASE_002',
  '文件格式不支援',
  '僅支援 PDF, DOCX, TXT 格式'
);
```

#### 系統錯誤 (5xx)

```typescript
// System error handling
export class SystemException extends HttpException {
  constructor(
    code: string,
    message: string,
    originalError?: Error,
    statusCode: number = 500
  ) {
    super({
      code,
      message,
      type: 'SystemError',
      timestamp: new Date().toISOString()
    }, statusCode);

    // 記錄原始錯誤到日誌
    if (originalError) {
      Logger.error(`System Error: ${code}`, originalError.stack);
    }
  }
}
```

#### 第三方服務錯誤

```typescript
// External service error mapping
export class ExternalServiceException extends HttpException {
  constructor(
    service: string,
    operation: string,
    statusCode: number,
    originalError?: any
  ) {
    const code = `EXT_${service.toUpperCase()}_${operation.toUpperCase()}`;

    super({
      code,
      message: `${service} 服務暫時無法使用`,
      type: 'ExternalServiceError',
      service,
      operation
    }, this.mapToHttpStatus(statusCode));
  }

  private mapToHttpStatus(externalStatus: number): number {
    // 將外部服務狀態碼映射到適當的 HTTP 狀態碼
    switch (true) {
      case externalStatus >= 400 && externalStatus < 500:
        return 400; // 客戶端錯誤
      case externalStatus >= 500:
        return 503; // 服務不可用
      default:
        return 500;
    }
  }
}
```

#### AI 服務錯誤特殊處理

```typescript
// AI-specific error handling
export class AIServiceException extends ExternalServiceException {
  constructor(
    operation: string,
    tokens?: number,
    model?: string,
    originalError?: any
  ) {
    super('openai', operation, 429, originalError);

    // 特殊 AI 錯誤處理
    this.handleAISpecificErrors(operation, tokens, model);
  }

  private handleAISpecificErrors(operation: string, tokens?: number, model?: string) {
    // Token 限制錯誤
    if (tokens && tokens > 4000) {
      this.logTokenUsage(operation, tokens, model);
    }

    // 模型不可用錯誤
    // 內容政策違規錯誤
    // 等等...
  }
}
```

### 13.3 復原機制

#### 重試策略 (指數退避)

```typescript
// Retry configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

// Default retry configurations
export const DEFAULT_RETRY_CONFIGS = {
  'azure-openai': {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
    retryableErrors: ['RATE_LIMIT', 'TIMEOUT', 'TEMPORARY_FAILURE']
  },
  'dynamics-365': {
    maxAttempts: 5,
    initialDelayMs: 500,
    maxDelayMs: 5000,
    backoffMultiplier: 1.5,
    retryableErrors: ['THROTTLING', 'TIMEOUT']
  }
};

// Retry decorator
export function Retryable(config: RetryConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      return executeWithRetry(originalMethod.bind(this), args, config);
    };
  };
}
```

#### 斷路器模式

```typescript
// Circuit breaker implementation
export class CircuitBreaker {
  private failures = 0;
  private nextAttempt = Date.now();
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private monitor?: (state: string) => void
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN');
      }
      this.state = 'HALF_OPEN';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
    this.monitor?.('CLOSED');
  }

  private onFailure() {
    this.failures++;
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      this.monitor?.('OPEN');
    }
  }
}
```

#### 降級服務

```typescript
// Fallback service implementation
export abstract class FallbackService<T> {
  abstract primaryOperation(): Promise<T>;
  abstract fallbackOperation(): Promise<T>;

  async executeWithFallback(): Promise<T> {
    try {
      return await this.primaryOperation();
    } catch (error) {
      Logger.warn('Primary service failed, using fallback', error);

      try {
        return await this.fallbackOperation();
      } catch (fallbackError) {
        Logger.error('Fallback service also failed', fallbackError);
        throw new SystemException(
          'SYS_002',
          '主要服務和備用服務都無法使用',
          fallbackError
        );
      }
    }
  }
}

// AI Search fallback example
export class AISearchService extends FallbackService<SearchResult[]> {
  async primaryOperation(): Promise<SearchResult[]> {
    // Azure AI Search with vector similarity
    return this.azureAISearch.search(query, { useVectorSearch: true });
  }

  async fallbackOperation(): Promise<SearchResult[]> {
    // Fallback to basic keyword search
    return this.azureAISearch.search(query, { useVectorSearch: false });
  }
}
```

#### 死信隊列 (DLQ)

**Azure Service Bus 配置**:
```typescript
// Dead letter queue configuration
export class DeadLetterQueueService {
  constructor(private serviceBusClient: ServiceBusClient) {}

  async handleFailedMessage(message: any, error: Error, attemptCount: number) {
    if (attemptCount >= 3) {
      // 移至死信隊列
      await this.moveToDeadLetterQueue(message, error);

      // 通知管理員
      await this.notifyAdministrators({
        message,
        error: error.message,
        timestamp: new Date(),
        attemptCount
      });
    } else {
      // 重新排隊處理
      await this.requeue(message, attemptCount + 1);
    }
  }

  private async moveToDeadLetterQueue(message: any, error: Error) {
    const dlqMessage = {
      originalMessage: message,
      error: error.message,
      timestamp: new Date(),
      reason: 'MAX_RETRY_EXCEEDED'
    };

    await this.serviceBusClient
      .createSender('dead-letter-queue')
      .sendMessages(dlqMessage);
  }
}
```

### 13.4 錯誤監控與告警

#### Azure Application Insights 整合

```typescript
// Error tracking service
export class ErrorTrackingService {
  constructor(private appInsights: TelemetryClient) {}

  trackException(error: Error, properties?: { [key: string]: string }) {
    this.appInsights.trackException({
      exception: error,
      properties: {
        service: 'sales-copilot-api',
        version: process.env.APP_VERSION,
        environment: process.env.NODE_ENV,
        ...properties
      }
    });
  }

  trackCustomEvent(name: string, properties?: { [key: string]: string }) {
    this.appInsights.trackEvent({
      name,
      properties: {
        timestamp: new Date().toISOString(),
        ...properties
      }
    });
  }
}
```

#### 告警配置

**關鍵錯誤告警觸發條件**:
- 5xx 錯誤率 > 1% (5分鐘內)
- AI 服務失敗率 > 5% (10分鐘內)
- 資料庫連接失敗 > 3次 (1分鐘內)
- 外部 API 回應時間 > 10秒 (連續3次)

---

## 14. 密鑰管理與安全加固

### 14.1 Azure Key Vault 整合

#### 密鑰管理架構

```typescript
// Key Vault service implementation
export class KeyVaultService {
  private client: SecretClient;
  private keyClient: KeyClient;

  constructor() {
    const credential = new DefaultAzureCredential();
    this.client = new SecretClient(
      process.env.AZURE_KEY_VAULT_URL,
      credential
    );
    this.keyClient = new KeyClient(
      process.env.AZURE_KEY_VAULT_URL,
      credential
    );
  }

  async getSecret(secretName: string): Promise<string> {
    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error) {
      throw new SystemException(
        'SYS_003',
        `無法獲取密鑰: ${secretName}`,
        error
      );
    }
  }

  async setSecret(secretName: string, value: string): Promise<void> {
    await this.client.setSecret(secretName, value);
  }
}
```

#### 密鑰輪換策略

**自動輪換配置**:
```yaml
# Azure Key Vault 密鑰輪換
secrets:
  jwt-secret:
    rotation_interval: 90d
    notification_before: 7d
    auto_rotate: true

  openai-api-key:
    rotation_interval: 180d
    notification_before: 14d
    auto_rotate: false  # 需要手動更新

  database-password:
    rotation_interval: 30d
    notification_before: 3d
    auto_rotate: true
```

#### 存取控制 (RBAC)

**Key Vault 存取原則**:
```json
{
  "accessPolicies": [
    {
      "tenantId": "{tenant-id}",
      "objectId": "{app-service-managed-identity}",
      "permissions": {
        "secrets": ["get", "list"],
        "keys": ["get", "decrypt", "encrypt"]
      }
    },
    {
      "tenantId": "{tenant-id}",
      "objectId": "{azure-functions-identity}",
      "permissions": {
        "secrets": ["get"],
        "keys": ["get", "decrypt"]
      }
    }
  ]
}
```

### 14.2 數據加密

#### 靜態加密 (Encryption at Rest)

**PostgreSQL 數據加密配置**:
```sql
-- PostgreSQL 透明數據加密（需要企業版或使用檔案系統加密）
-- 使用 pgcrypto 擴展進行欄位層級加密
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 檢查加密狀態
SELECT
    DB_NAME(database_id) AS DatabaseName,
    encryption_state,
    encryption_state_desc
FROM sys.dm_database_encryption_keys;
```

**Blob Storage 加密**:
```typescript
// Blob Storage 客戶管理密鑰
export class EncryptedBlobService {
  private blobServiceClient: BlobServiceClient;

  constructor() {
    this.blobServiceClient = new BlobServiceClient(
      process.env.AZURE_STORAGE_CONNECTION_STRING,
      {
        customerProvidedKey: {
          encryptionKey: process.env.BLOB_ENCRYPTION_KEY,
          encryptionKeySha256: process.env.BLOB_ENCRYPTION_KEY_HASH
        }
      }
    );
  }

  async uploadEncryptedFile(containerName: string, fileName: string, data: Buffer) {
    const containerClient = this.blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(fileName);

    return await blockBlobClient.upload(data, data.length, {
      metadata: {
        encrypted: 'true',
        encryptionVersion: 'v1'
      }
    });
  }
}
```

#### 傳輸加密 (Encryption in Transit)

**TLS 1.3 配置**:
```typescript
// Express.js 安全配置
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// 強制 HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

#### 敏感欄位加密

```typescript
// Field-level encryption for PII data
export class FieldEncryptionService {
  private algorithm = 'aes-256-gcm';

  async encryptField(data: string, key: string): Promise<string> {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key);

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  async decryptField(encryptedData: string, key: string): Promise<string> {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipher(this.algorithm, key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

// 在 Prisma model 中使用
export class UserService {
  async createUser(userData: CreateUserDto) {
    const encryptedEmail = await this.encryption.encryptField(
      userData.email,
      await this.keyVault.getSecret('field-encryption-key')
    );

    return this.prisma.user.create({
      data: {
        ...userData,
        email: encryptedEmail
      }
    });
  }
}
```

### 14.3 安全標準遵循

#### OWASP Top 10 防護

**1. 注入攻擊防護**:
```typescript
// SQL 注入防護 (Prisma ORM 自動處理)
// 輸入驗證
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 使用 class-validator 進行驗證
    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = validateSync(object);

    if (errors.length > 0) {
      throw new BusinessException(
        'VALID_001',
        '輸入資料驗證失敗',
        this.formatErrors(errors)
      );
    }

    return object;
  }
}
```

**2. 身份驗證失效防護**:
```typescript
// JWT 安全配置
export class JwtConfigService {
  getJwtConfig(): JwtModuleOptions {
    return {
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '15m',  // 短期訪問令牌
        issuer: 'sales-copilot',
        audience: 'sales-copilot-users'
      },
      verifyOptions: {
        issuer: 'sales-copilot',
        audience: 'sales-copilot-users'
      }
    };
  }
}

// 密碼強度要求
export const PASSWORD_POLICY = {
  minLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  maxAge: 90, // 90天過期
  preventReuse: 5 // 不能重複使用最近5個密碼
};
```

**3. 敏感資料暴露防護**:
```typescript
// 回應資料過濾
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // 移除敏感欄位
        return this.sanitizeResponse(data);
      })
    );
  }

  private sanitizeResponse(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.removeeSensitiveFields(item));
    }
    return this.removeSensitiveFields(data);
  }

  private removeSensitiveFields(obj: any): any {
    const sensitiveFields = ['password', 'apiKey', 'secret', 'token'];

    if (typeof obj !== 'object' || obj === null) return obj;

    const sanitized = { ...obj };
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });

    return sanitized;
  }
}
```

#### SOC 2 合規

**存取控制日誌**:
```typescript
// 存取日誌服務
export class AccessLogService {
  async logAccess(userId: string, resource: string, action: string, result: string) {
    const logEntry = {
      timestamp: new Date(),
      userId,
      resource,
      action,
      result, // SUCCESS | FAILURE | DENIED
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      correlationId: this.getCorrelationId()
    };

    // 寫入審計日誌
    await this.auditLogger.log(logEntry);

    // 發送到 Azure Monitor
    this.telemetryClient.trackEvent({
      name: 'AccessAttempt',
      properties: logEntry
    });
  }
}

// 在控制器中使用
@UseGuards(AuthGuard)
@UseInterceptors(AccessLogInterceptor)
export class DocumentController {
  @Get(':id')
  async getDocument(@Param('id') id: string, @Request() req) {
    // 存取日誌會自動記錄
    return this.documentService.findOne(id);
  }
}
```

#### GDPR 數據保護

**數據處理同意管理**:
```typescript
// GDPR 合規服務
export class GDPRComplianceService {
  async recordConsent(userId: string, purpose: string, consentGiven: boolean) {
    await this.prisma.dataProcessingConsent.create({
      data: {
        userId,
        purpose,
        consentGiven,
        timestamp: new Date(),
        ipAddress: this.getClientIP(),
        version: '1.0' // 隱私政策版本
      }
    });
  }

  async requestDataExport(userId: string): Promise<any> {
    // 收集用戶所有數據
    const userData = await this.collectUserData(userId);

    // 創建導出任務
    const exportTask = await this.createExportTask(userId, userData);

    // 異步處理並發送給用戶
    this.processExportAsync(exportTask);

    return { message: '數據導出請求已受理，我們將在30天內處理' };
  }

  async requestDataDeletion(userId: string): Promise<void> {
    // 檢查法律保留要求
    const retentionCheck = await this.checkRetentionRequirements(userId);

    if (retentionCheck.canDelete) {
      // 軟刪除用戶數據
      await this.softDeleteUserData(userId);

      // 記錄刪除請求
      await this.logDeletionRequest(userId);
    } else {
      throw new BusinessException(
        'GDPR_001',
        '數據刪除請求無法執行',
        retentionCheck.reason
      );
    }
  }
}
```

#### 滲透測試計畫

**定期安全評估時程**:
```yaml
security_assessments:
  penetration_testing:
    frequency: quarterly
    scope:
      - web_application
      - api_endpoints
      - azure_infrastructure
    provider: external_certified_vendor

  vulnerability_scanning:
    frequency: weekly
    tools:
      - azure_security_center
      - dependency_check
      - sonarqube

  security_code_review:
    frequency: per_release
    automated_tools:
      - eslint_security_plugin
      - bandit_python
      - semgrep
    manual_review: critical_components
```

---

## 15. 監控、告警與可觀測性

### 15.1 三支柱可觀測性架構

現代微服務和雲端應用的可觀測性基於三個核心支柱：**日誌 (Logging)**、**指標 (Metrics)** 和 **分散式追蹤 (Tracing)**。

#### Azure Monitor 整合架構

```mermaid
graph TD
    subgraph 應用層
        WebApp[Next.js 前端]
        API[NestJS 後端]
        Functions[Azure Functions]
    end

    subgraph Azure Monitor 生態
        AppInsights[Application Insights]
        LogAnalytics[Log Analytics Workspace]
        Monitor[Azure Monitor]
        Workbooks[Azure Workbooks]
    end

    subgraph 可觀測性支柱
        Logs[日誌 Logs]
        Metrics[指標 Metrics]
        Traces[追蹤 Traces]
    end

    WebApp --> AppInsights
    API --> AppInsights
    Functions --> AppInsights

    AppInsights --> Logs
    AppInsights --> Metrics
    AppInsights --> Traces

    Logs --> LogAnalytics
    Metrics --> Monitor
    Traces --> AppInsights

    LogAnalytics --> Workbooks
    Monitor --> Workbooks
```

#### 統一可觀測性配置

```typescript
// Observability configuration service
export class ObservabilityService {
  private appInsights: TelemetryClient;
  private logger: Logger;

  constructor() {
    // Application Insights 配置
    this.appInsights = new TelemetryClient({
      connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
      enableAutoCollectRequests: true,
      enableAutoCollectPerformance: true,
      enableAutoCollectExceptions: true,
      enableAutoCollectDependencies: true,
      enableAutoCollectConsole: true
    });

    // 結構化日誌配置
    this.logger = new Logger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.Azure({
          workspaceId: process.env.AZURE_LOG_WORKSPACE_ID,
          sharedKey: process.env.AZURE_LOG_SHARED_KEY
        })
      ]
    });
  }
}
```

### 15.2 日誌管理 (Logging)

#### 結構化日誌格式

```typescript
// Structured logging implementation
export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  correlationId: string;
  userId?: string;
  operation: string;
  duration?: number;
  metadata?: Record<string, any>;
  tags?: string[];
}

export class StructuredLogger {
  log(entry: Partial<LogEntry>) {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: entry.level || 'info',
      message: entry.message || '',
      correlationId: entry.correlationId || this.generateCorrelationId(),
      operation: entry.operation || 'unknown',
      ...entry
    };

    // 發送到 Azure Log Analytics
    this.sendToLogAnalytics(logEntry);

    // 本地日誌記錄
    console.log(JSON.stringify(logEntry));
  }

  // 專門的方法用於不同類型的日誌
  logAPIRequest(req: Request, res: Response, duration: number) {
    this.log({
      level: 'info',
      message: 'API Request',
      operation: 'http_request',
      duration,
      metadata: {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      },
      tags: ['api', 'request']
    });
  }

  logBusinessEvent(event: string, userId: string, data: any) {
    this.log({
      level: 'info',
      message: `Business Event: ${event}`,
      operation: 'business_event',
      userId,
      metadata: data,
      tags: ['business', event]
    });
  }

  logAIOperation(operation: string, tokens: number, model: string, success: boolean) {
    this.log({
      level: success ? 'info' : 'error',
      message: `AI Operation: ${operation}`,
      operation: 'ai_operation',
      metadata: {
        tokens,
        model,
        success,
        cost: this.calculateCost(tokens, model)
      },
      tags: ['ai', 'openai']
    });
  }
}
```

#### 日誌聚合與查詢

**KQL 查詢範例** (Azure Log Analytics):
```kusto
// 查詢 AI 操作的成本趨勢
AppLogs
| where TimeGenerated >= ago(24h)
| where Properties.operation == "ai_operation"
| extend Tokens = toint(Properties.metadata.tokens)
| extend Cost = toreal(Properties.metadata.cost)
| summarize TotalCost = sum(Cost), TotalTokens = sum(Tokens) by bin(TimeGenerated, 1h)
| render timechart

// 查詢錯誤率趨勢
requests
| where timestamp >= ago(7d)
| summarize
    TotalRequests = count(),
    ErrorRequests = countif(success == false)
by bin(timestamp, 1h)
| extend ErrorRate = (ErrorRequests * 100.0) / TotalRequests
| render timechart

// 查詢慢查詢
AppLogs
| where TimeGenerated >= ago(1h)
| where Properties.operation == "database_query"
| where Properties.duration > 1000  // 超過1秒
| project TimeGenerated, Properties.message, Properties.duration, Properties.metadata
| order by Properties.duration desc
```

### 15.3 指標收集 (Metrics)

#### 業務指標

```typescript
// Business metrics collection
export class BusinessMetricsService {
  constructor(private appInsights: TelemetryClient) {}

  // 知識庫使用指標
  trackKnowledgeBaseUsage(userId: string, searchQuery: string, resultCount: number) {
    this.appInsights.trackMetric({
      name: 'KnowledgeBase.SearchCount',
      value: 1,
      properties: {
        userId,
        hasResults: resultCount > 0 ? 'true' : 'false'
      }
    });

    this.appInsights.trackMetric({
      name: 'KnowledgeBase.ResultCount',
      value: resultCount,
      properties: { userId }
    });
  }

  // 提案生成指標
  trackProposalGeneration(userId: string, success: boolean, duration: number, wordCount?: number) {
    this.appInsights.trackMetric({
      name: 'Proposal.GenerationCount',
      value: 1,
      properties: {
        userId,
        success: success.toString()
      }
    });

    this.appInsights.trackMetric({
      name: 'Proposal.GenerationDuration',
      value: duration,
      properties: { userId }
    });

    if (wordCount) {
      this.appInsights.trackMetric({
        name: 'Proposal.WordCount',
        value: wordCount,
        properties: { userId }
      });
    }
  }

  // 用戶活躍度指標
  trackUserActivity(userId: string, action: string, feature: string) {
    this.appInsights.trackEvent({
      name: 'UserActivity',
      properties: {
        userId,
        action,
        feature,
        timestamp: new Date().toISOString()
      }
    });

    // 每日活躍用戶 (DAU) 計數器
    this.appInsights.trackMetric({
      name: 'Users.DailyActive',
      value: 1,
      properties: {
        date: new Date().toISOString().split('T')[0],
        userId
      }
    });
  }
}
```

#### 技術指標

```typescript
// Technical metrics collection
export class TechnicalMetricsService {
  constructor(private appInsights: TelemetryClient) {}

  // API 性能指標
  trackAPIPerformance(endpoint: string, method: string, statusCode: number, duration: number) {
    this.appInsights.trackMetric({
      name: 'API.ResponseTime',
      value: duration,
      properties: {
        endpoint,
        method,
        statusCode: statusCode.toString()
      }
    });

    this.appInsights.trackMetric({
      name: 'API.RequestCount',
      value: 1,
      properties: {
        endpoint,
        method,
        statusCode: statusCode.toString(),
        success: statusCode < 400 ? 'true' : 'false'
      }
    });
  }

  // 資料庫性能指標
  trackDatabasePerformance(operation: string, table: string, duration: number, rowCount?: number) {
    this.appInsights.trackMetric({
      name: 'Database.QueryTime',
      value: duration,
      properties: {
        operation,
        table
      }
    });

    if (rowCount !== undefined) {
      this.appInsights.trackMetric({
        name: 'Database.RowCount',
        value: rowCount,
        properties: {
          operation,
          table
        }
      });
    }
  }

  // AI 服務指標
  trackAIServiceMetrics(service: string, operation: string, tokens: number, cost: number, latency: number) {
    this.appInsights.trackMetric({
      name: 'AI.TokenUsage',
      value: tokens,
      properties: { service, operation }
    });

    this.appInsights.trackMetric({
      name: 'AI.Cost',
      value: cost,
      properties: { service, operation }
    });

    this.appInsights.trackMetric({
      name: 'AI.Latency',
      value: latency,
      properties: { service, operation }
    });
  }
}
```

### 15.4 分散式追蹤 (Distributed Tracing)

#### 關聯 ID 與追蹤實現

```typescript
// Correlation ID middleware
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // 從請求標頭獲取或生成新的關聯 ID
    const correlationId = req.headers['x-correlation-id'] || this.generateCorrelationId();

    // 設置到請求上下文
    req.correlationId = correlationId;

    // 設置到回應標頭
    res.setHeader('x-correlation-id', correlationId);

    // 設置到 Application Insights 上下文
    this.appInsights.setCorrelationContext({ correlationId });

    next();
  }

  private generateCorrelationId(): string {
    return uuidv4();
  }
}

// Distributed tracing decorator
export function TraceOperation(operationName: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const correlationId = this.getCorrelationId();
      const startTime = Date.now();

      const telemetryClient = new TelemetryClient();

      try {
        // 開始追蹤
        telemetryClient.trackEvent({
          name: `${operationName}.Started`,
          properties: {
            correlationId,
            timestamp: new Date().toISOString()
          }
        });

        const result = await originalMethod.apply(this, args);

        // 成功完成追蹤
        const duration = Date.now() - startTime;
        telemetryClient.trackMetric({
          name: `${operationName}.Duration`,
          value: duration,
          properties: {
            correlationId,
            success: 'true'
          }
        });

        return result;
      } catch (error) {
        // 錯誤追蹤
        const duration = Date.now() - startTime;
        telemetryClient.trackException({
          exception: error,
          properties: {
            correlationId,
            operationName,
            duration: duration.toString()
          }
        });

        throw error;
      }
    };
  };
}

// 使用範例
export class ProposalService {
  @TraceOperation('GenerateProposal')
  async generateProposal(customerId: string, requirements: string): Promise<Proposal> {
    // 業務邏輯實現
    const customer = await this.getCustomerData(customerId);
    const relevantDocs = await this.searchKnowledgeBase(requirements);
    const proposal = await this.aiService.generateProposal(customer, relevantDocs, requirements);

    return proposal;
  }
}
```

### 15.5 告警策略與配置

#### 告警級別定義

```yaml
# Azure Monitor 告警配置
alerts:
  critical:
    application_down:
      condition: "availability < 95%"
      window: "5m"
      threshold: 1
      action: "immediate_notification"

    high_error_rate:
      condition: "error_rate > 5%"
      window: "5m"
      threshold: 1
      action: "immediate_notification"

    database_connection_failure:
      condition: "database_connection_errors > 3"
      window: "1m"
      threshold: 1
      action: "immediate_notification"

  warning:
    high_response_time:
      condition: "avg_response_time > 2000ms"
      window: "10m"
      threshold: 3
      action: "delayed_notification"

    ai_token_usage_spike:
      condition: "ai_token_usage > 10000"
      window: "1h"
      threshold: 1
      action: "delayed_notification"

    low_disk_space:
      condition: "disk_usage > 80%"
      window: "15m"
      threshold: 2
      action: "delayed_notification"

  info:
    high_user_activity:
      condition: "concurrent_users > 100"
      window: "5m"
      threshold: 1
      action: "log_only"

    new_feature_usage:
      condition: "feature_adoption_rate > 50%"
      window: "1d"
      threshold: 1
      action: "log_only"
```

#### 智能告警實現

```typescript
// Smart alerting service
export class SmartAlertingService {
  private alertHistory: Map<string, AlertHistory> = new Map();

  async evaluateAlert(metric: string, value: number, threshold: number): Promise<void> {
    const alertKey = `${metric}_${threshold}`;
    const history = this.alertHistory.get(alertKey) || new AlertHistory();

    // 實施告警抑制邏輯
    if (this.shouldSuppressAlert(history, value)) {
      return;
    }

    // 動態閾值調整
    const adjustedThreshold = this.calculateDynamicThreshold(metric, value);

    if (value > adjustedThreshold) {
      await this.triggerAlert({
        metric,
        value,
        threshold: adjustedThreshold,
        severity: this.calculateSeverity(value, adjustedThreshold),
        context: await this.gatherAlertContext(metric)
      });

      history.recordAlert(new Date(), value);
      this.alertHistory.set(alertKey, history);
    }
  }

  private shouldSuppressAlert(history: AlertHistory, currentValue: number): boolean {
    // 避免告警風暴 - 同一個問題在5分鐘內不重複告警
    const recentAlerts = history.getAlertsInWindow(5 * 60 * 1000); // 5分鐘
    if (recentAlerts.length > 0) {
      return true;
    }

    // 避免波動造成的假告警
    const trend = history.calculateTrend();
    if (trend === 'stable' && Math.abs(currentValue - history.getAverage()) < 0.1) {
      return true;
    }

    return false;
  }

  private async gatherAlertContext(metric: string): Promise<AlertContext> {
    // 收集相關的上下文資訊以幫助診斷
    return {
      recentErrors: await this.getRecentErrors(),
      systemLoad: await this.getSystemLoad(),
      userActivity: await this.getCurrentUserActivity(),
      relatedMetrics: await this.getRelatedMetrics(metric)
    };
  }
}
```

#### 告警通知整合

```typescript
// Multi-channel alerting
export class AlertNotificationService {
  async sendAlert(alert: Alert): Promise<void> {
    const channels = this.getNotificationChannels(alert.severity);

    await Promise.all([
      this.sendToTeams(alert, channels.teams),
      this.sendToEmail(alert, channels.email),
      this.sendToSMS(alert, channels.sms),
      this.createAzureTicket(alert, channels.ticketing)
    ]);
  }

  private async sendToTeams(alert: Alert, config: TeamsConfig): Promise<void> {
    if (!config.enabled) return;

    const message = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      "themeColor": this.getSeverityColor(alert.severity),
      "summary": `${alert.severity.toUpperCase()}: ${alert.metric}`,
      "sections": [{
        "activityTitle": `🚨 ${alert.severity.toUpperCase()} Alert`,
        "activitySubtitle": alert.metric,
        "facts": [
          { "name": "Metric", "value": alert.metric },
          { "name": "Current Value", "value": alert.value.toString() },
          { "name": "Threshold", "value": alert.threshold.toString() },
          { "name": "Time", "value": new Date().toISOString() }
        ],
        "markdown": true
      }],
      "potentialAction": [{
        "@type": "OpenUri",
        "name": "View Dashboard",
        "targets": [{
          "os": "default",
          "uri": `${process.env.DASHBOARD_URL}/alerts/${alert.id}`
        }]
      }]
    };

    await this.httpClient.post(config.webhookUrl, message);
  }

  private async sendToEmail(alert: Alert, config: EmailConfig): Promise<void> {
    if (!config.enabled) return;

    const html = this.generateAlertEmailHTML(alert);

    await this.emailService.send({
      to: config.recipients,
      subject: `[${alert.severity.toUpperCase()}] Alert: ${alert.metric}`,
      html
    });
  }
}
```

### 15.6 儀表板與視覺化

#### Azure Workbooks 配置

```json
{
  "version": "Notebook/1.0",
  "items": [
    {
      "type": 1,
      "content": {
        "json": "# 客製化銷售智能體 - 營運儀表板\n\n即時監控系統健康狀況、用戶活動和業務指標。"
      }
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "requests\r\n| where timestamp >= ago(24h)\r\n| summarize RequestCount = count(), AvgDuration = avg(duration) by bin(timestamp, 1h)\r\n| render timechart",
        "size": 0,
        "title": "API 請求量與平均回應時間",
        "timeContext": {
          "durationMs": 86400000
        },
        "queryType": 0
      }
    },
    {
      "type": 3,
      "content": {
        "version": "KqlItem/1.0",
        "query": "customMetrics\r\n| where name == \"AI.TokenUsage\"\r\n| where timestamp >= ago(24h)\r\n| summarize TotalTokens = sum(value) by bin(timestamp, 1h), tostring(customDimensions.service)\r\n| render columnchart",
        "size": 0,
        "title": "AI Token 使用量",
        "timeContext": {
          "durationMs": 86400000
        },
        "queryType": 0
      }
    }
  ]
}
```

#### 自訂監控儀表板

```typescript
// Dashboard data service
export class DashboardDataService {
  async getSystemHealthOverview(): Promise<SystemHealthOverview> {
    const [
      errorRate,
      avgResponseTime,
      activeUsers,
      systemLoad
    ] = await Promise.all([
      this.getErrorRate(),
      this.getAverageResponseTime(),
      this.getActiveUsers(),
      this.getSystemLoad()
    ]);

    return {
      errorRate,
      avgResponseTime,
      activeUsers,
      systemLoad,
      status: this.calculateOverallStatus(errorRate, avgResponseTime, systemLoad)
    };
  }

  async getBusinessMetrics(): Promise<BusinessMetrics> {
    return {
      dailyActiveUsers: await this.getDailyActiveUsers(),
      proposalsGenerated: await this.getProposalsGeneratedToday(),
      searchQueries: await this.getSearchQueriesToday(),
      averageSessionDuration: await this.getAverageSessionDuration(),
      topFeatures: await this.getTopUsedFeatures()
    };
  }

  async getAIUsageMetrics(): Promise<AIUsageMetrics> {
    return {
      totalTokensUsed: await this.getTotalTokensUsed(),
      totalCost: await this.getTotalAICost(),
      averageLatency: await this.getAverageAILatency(),
      successRate: await this.getAISuccessRate(),
      costTrend: await this.getAICostTrend()
    };
  }
}
```

### 15.7 性能監控與診斷

#### APM (Application Performance Monitoring)

```typescript
// Performance monitoring service
export class PerformanceMonitoringService {
  // 自動檢測慢查詢
  async detectSlowQueries(): Promise<SlowQuery[]> {
    const slowQueries = await this.queryLogAnalytics(`
      AppTraces
      | where TimeGenerated >= ago(1h)
      | where Message contains "SLOW_QUERY"
      | extend Duration = toint(customDimensions.duration)
      | where Duration > 1000
      | project TimeGenerated, Message, Duration, customDimensions.query
      | order by Duration desc
    `);

    return slowQueries.map(query => ({
      timestamp: query.TimeGenerated,
      duration: query.Duration,
      query: query.query,
      recommendation: this.generateOptimizationRecommendation(query.query)
    }));
  }

  // 記憶體洩漏檢測
  async detectMemoryLeaks(): Promise<MemoryLeakAlert[]> {
    const memoryUsage = await this.queryLogAnalytics(`
      performanceCounters
      | where TimeGenerated >= ago(6h)
      | where counter == "Private Bytes"
      | summarize AvgMemory = avg(value) by bin(TimeGenerated, 10m)
      | order by TimeGenerated desc
    `);

    // 分析記憶體使用趨勢
    const trend = this.analyzeMemoryTrend(memoryUsage);

    if (trend.isIncreasing && trend.slope > 0.1) {
      return [{
        severity: 'warning',
        message: '檢測到潛在記憶體洩漏',
        trend: trend,
        recommendation: '建議檢查長時間運行的操作和快取策略'
      }];
    }

    return [];
  }

  // CPU 使用率異常檢測
  async detectCPUAnomalies(): Promise<CPUAnomaly[]> {
    const cpuData = await this.getHistoricalCPUUsage();
    const model = this.trainAnomalyDetectionModel(cpuData);

    const currentCPU = await this.getCurrentCPUUsage();
    const isAnomaly = model.predict(currentCPU);

    if (isAnomaly) {
      return [{
        timestamp: new Date(),
        cpuUsage: currentCPU,
        expectedRange: model.getExpectedRange(),
        severity: this.calculateCPUAnomalySeverity(currentCPU)
      }];
    }

    return [];
  }
}
```

---

## 16. API 設計與版本控制

### 16.1 RESTful API 設計規範

#### URL 命名規則

**資源命名約定**:
```
GET    /api/v1/customers                 # 獲取客戶列表
GET    /api/v1/customers/{id}            # 獲取特定客戶
POST   /api/v1/customers                 # 創建客戶
PUT    /api/v1/customers/{id}            # 更新客戶
DELETE /api/v1/customers/{id}            # 刪除客戶

GET    /api/v1/customers/{id}/contacts   # 獲取客戶的聯絡人
POST   /api/v1/customers/{id}/contacts   # 為客戶添加聯絡人

GET    /api/v1/documents/search          # 搜尋文件
POST   /api/v1/documents                 # 上傳文件
GET    /api/v1/documents/{id}            # 獲取文件詳情

POST   /api/v1/proposals/generate        # 生成提案
GET    /api/v1/proposals/{id}            # 獲取提案詳情
PUT    /api/v1/proposals/{id}/status     # 更新提案狀態
```

**命名規則**:
- 使用名詞而非動詞
- 使用複數形式表示集合
- 使用 kebab-case (小寫加連字符)
- 避免深層嵌套 (最多 3 層)

#### HTTP 動詞使用規範

```typescript
// HTTP 動詞使用指南
export enum HttpMethod {
  GET = 'GET',       // 獲取資源 (安全且幂等)
  POST = 'POST',     // 創建資源 (非安全，非幂等)
  PUT = 'PUT',       // 更新/替換資源 (非安全但幂等)
  PATCH = 'PATCH',   // 部分更新資源 (非安全，非幂等)
  DELETE = 'DELETE', // 刪除資源 (非安全但幂等)
  HEAD = 'HEAD',     // 獲取資源頭訊息 (安全且幂等)
  OPTIONS = 'OPTIONS' // 獲取資源支援的方法 (安全且幂等)
}

// 正確使用範例
@Controller('api/v1/customers')
export class CustomerController {
  @Get()
  async getCustomers(
    @Query() query: GetCustomersQueryDto
  ): Promise<PaginatedResponse<Customer>> {
    // 獲取客戶列表，支援分頁和過濾
  }

  @Get(':id')
  async getCustomer(@Param('id') id: string): Promise<Customer> {
    // 獲取單個客戶
  }

  @Post()
  async createCustomer(@Body() createDto: CreateCustomerDto): Promise<Customer> {
    // 創建新客戶
  }

  @Put(':id')
  async updateCustomer(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto
  ): Promise<Customer> {
    // 完整更新客戶
  }

  @Patch(':id')
  async patchCustomer(
    @Param('id') id: string,
    @Body() patchDto: PatchCustomerDto
  ): Promise<Customer> {
    // 部分更新客戶
  }

  @Delete(':id')
  async deleteCustomer(@Param('id') id: string): Promise<void> {
    // 刪除客戶 (軟刪除)
  }
}
```

#### 狀態碼規範

```typescript
// HTTP 狀態碼使用指南
export class HttpStatusCodes {
  // 2xx 成功
  static OK = 200;                    // 請求成功
  static CREATED = 201;               // 資源創建成功
  static ACCEPTED = 202;              // 請求已接受，異步處理
  static NO_CONTENT = 204;            // 成功但無回應內容

  // 4xx 客戶端錯誤
  static BAD_REQUEST = 400;           // 請求格式錯誤
  static UNAUTHORIZED = 401;          // 未授權
  static FORBIDDEN = 403;             // 禁止存取
  static NOT_FOUND = 404;             // 資源不存在
  static METHOD_NOT_ALLOWED = 405;    // 方法不允許
  static CONFLICT = 409;              // 資源衝突
  static UNPROCESSABLE_ENTITY = 422;  // 請求格式正確但處理失敗
  static TOO_MANY_REQUESTS = 429;     // 請求過多

  // 5xx 伺服器錯誤
  static INTERNAL_SERVER_ERROR = 500; // 內部伺服器錯誤
  static NOT_IMPLEMENTED = 501;       // 功能未實現
  static BAD_GATEWAY = 502;           // 上游服務錯誤
  static SERVICE_UNAVAILABLE = 503;   // 服務不可用
  static GATEWAY_TIMEOUT = 504;       // 上游服務逾時
}

// 狀態碼使用範例
export class ApiResponseHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      statusCode: HttpStatusCodes.OK,
      message: message || 'Success',
      data,
      timestamp: new Date().toISOString()
    };
  }

  static created<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      statusCode: HttpStatusCodes.CREATED,
      message: message || 'Resource created successfully',
      data,
      timestamp: new Date().toISOString()
    };
  }

  static error(statusCode: number, message: string, details?: any): ApiErrorResponse {
    return {
      success: false,
      statusCode,
      message,
      details,
      timestamp: new Date().toISOString()
    };
  }
}
```

#### 分頁與過濾

```typescript
// 分頁查詢 DTO
export class PaginationQueryDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(value))
  limit?: number = 20;

  @IsOptional()
  @IsString()
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

// 過濾查詢 DTO
export class CustomerFilterDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  industry?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsDateString()
  createdAfter?: string;

  @IsOptional()
  @IsDateString()
  createdBefore?: string;
}

// 分頁回應格式
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// 分頁服務實現
export class PaginationService {
  static paginate<T>(
    items: T[],
    total: number,
    page: number,
    limit: number
  ): PaginatedResponse<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    };
  }
}
```

### 16.2 API 版本控制策略

#### URL 路徑版本控制

```typescript
// 版本控制實現
@ApiTags('Customers v1')
@Controller('api/v1/customers')
export class CustomerV1Controller {
  // v1 實現
}

@ApiTags('Customers v2')
@Controller('api/v2/customers')
export class CustomerV2Controller {
  // v2 實現，支援新功能
}

// 版本路由配置
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    // v1 路由
    consumer
      .apply(ApiVersionMiddleware('v1'))
      .forRoutes('api/v1/*');

    // v2 路由
    consumer
      .apply(ApiVersionMiddleware('v2'))
      .forRoutes('api/v2/*');
  }
}
```

#### 版本生命週期管理

```typescript
// API 版本資訊服務
export class ApiVersionService {
  private versions: Map<string, ApiVersionInfo> = new Map([
    ['v1', {
      version: 'v1',
      status: 'deprecated',
      deprecationDate: new Date('2024-12-01'),
      sunsetDate: new Date('2025-06-01'),
      supportedUntil: new Date('2025-03-01'),
      migrationGuide: '/docs/migration/v1-to-v2'
    }],
    ['v2', {
      version: 'v2',
      status: 'current',
      releaseDate: new Date('2024-09-01'),
      supportedUntil: new Date('2026-09-01'),
      features: ['enhanced-search', 'batch-operations', 'async-proposals']
    }]
  ]);

  getVersionInfo(version: string): ApiVersionInfo | null {
    return this.versions.get(version) || null;
  }

  isVersionSupported(version: string): boolean {
    const versionInfo = this.versions.get(version);
    if (!versionInfo) return false;

    const now = new Date();
    return versionInfo.status !== 'sunset' &&
           (!versionInfo.sunsetDate || now < versionInfo.sunsetDate);
  }
}

// 版本棄用中間件
export class DeprecationWarningMiddleware implements NestMiddleware {
  constructor(private versionService: ApiVersionService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const version = this.extractVersionFromPath(req.path);
    const versionInfo = this.versionService.getVersionInfo(version);

    if (versionInfo?.status === 'deprecated') {
      res.setHeader('Deprecation', versionInfo.deprecationDate.toISOString());
      res.setHeader('Sunset', versionInfo.sunsetDate?.toISOString() || '');
      res.setHeader('Link', `<${versionInfo.migrationGuide}>; rel="help"`);

      // 記錄棄用 API 使用
      this.logDeprecatedApiUsage(req, versionInfo);
    }

    next();
  }
}
```

#### 向後相容性保證

```typescript
// 向後相容性保證策略
export class BackwardCompatibilityService {
  // DTO 轉換器 - 確保舊格式仍可使用
  transformV1ToV2Request(v1Request: any): any {
    return {
      ...v1Request,
      // 添加新欄位的預設值
      newField: v1Request.newField || 'default_value',
      // 轉換重命名的欄位
      renamedField: v1Request.oldFieldName
    };
  }

  transformV2ToV1Response(v2Response: any): any {
    const v1Response = { ...v2Response };

    // 移除 v1 不支援的欄位
    delete v1Response.newField;

    // 重命名欄位以匹配 v1 格式
    if (v2Response.renamedField) {
      v1Response.oldFieldName = v2Response.renamedField;
      delete v1Response.renamedField;
    }

    return v1Response;
  }

  // 漸進式欄位棄用
  @Deprecated('Use newFieldName instead. Will be removed in v3.')
  handleDeprecatedField(oldFieldName: string): string {
    this.logDeprecatedFieldUsage(oldFieldName);
    return this.mapToNewField(oldFieldName);
  }
}
```

### 16.3 API 文檔與測試

#### OpenAPI 3.0 規範

```typescript
// Swagger 配置
export class SwaggerConfig {
  static setup(app: INestApplication) {
    const config = new DocumentBuilder()
      .setTitle('客製化銷售智能體 API')
      .setDescription('AI-powered sales enablement platform API')
      .setVersion('2.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
        'JWT-auth'
      )
      .addServer('https://api.salescopilot.com', 'Production')
      .addServer('https://staging-api.salescopilot.com', 'Staging')
      .addServer('http://localhost:3333', 'Development')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    // 設置 API 文檔路由
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        filter: true,
        showExtensions: true
      }
    });

    // 導出 OpenAPI JSON
    writeFileSync('./api-spec.json', JSON.stringify(document, null, 2));
  }
}

// API 文檔註解範例
@ApiTags('Knowledge Base')
@Controller('api/v2/documents')
@ApiBearerAuth('JWT-auth')
export class DocumentController {
  @Post('search')
  @ApiOperation({
    summary: '搜尋知識庫文件',
    description: '使用 AI 語意搜尋在知識庫中查找相關文件'
  })
  @ApiBody({
    type: SearchDocumentsDto,
    examples: {
      basic: {
        summary: '基本搜尋',
        value: {
          query: 'Docuware 安全功能',
          limit: 10
        }
      },
      advanced: {
        summary: '進階搜尋',
        value: {
          query: '文件管理系統的備份策略',
          filters: {
            category: 'technical',
            dateRange: {
              start: '2024-01-01',
              end: '2024-12-31'
            }
          },
          limit: 20
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: '搜尋成功',
    type: SearchResultsResponseDto
  })
  @ApiResponse({
    status: 400,
    description: '搜尋參數無效',
    type: ApiErrorResponseDto
  })
  async searchDocuments(
    @Body() searchDto: SearchDocumentsDto,
    @Request() req
  ): Promise<SearchResultsResponseDto> {
    // 實現搜尋邏輯
  }
}
```

#### API 測試策略

```typescript
// API 集成測試
describe('DocumentController', () => {
  let app: INestApplication;
  let documentService: DocumentService;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        {
          provide: DocumentService,
          useValue: {
            search: jest.fn(),
            upload: jest.fn(),
            delete: jest.fn()
          }
        }
      ]
    }).compile();

    app = moduleFixture.createNestApplication();
    documentService = moduleFixture.get<DocumentService>(DocumentService);
    await app.init();
  });

  describe('POST /api/v2/documents/search', () => {
    it('should return search results for valid query', async () => {
      const mockResults = [
        { id: '1', title: 'Test Document', score: 0.95 }
      ];
      jest.spyOn(documentService, 'search').mockResolvedValue(mockResults);

      return request(app.getHttpServer())
        .post('/api/v2/documents/search')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          query: 'test query',
          limit: 10
        })
        .expect(200)
        .expect(res => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toEqual(mockResults);
        });
    });

    it('should return 400 for invalid query', async () => {
      return request(app.getHttpServer())
        .post('/api/v2/documents/search')
        .set('Authorization', 'Bearer valid-jwt-token')
        .send({
          query: '', // 空查詢應該失敗
          limit: 10
        })
        .expect(400)
        .expect(res => {
          expect(res.body.success).toBe(false);
          expect(res.body.message).toContain('查詢不能為空');
        });
    });

    it('should return 401 without valid token', async () => {
      return request(app.getHttpServer())
        .post('/api/v2/documents/search')
        .send({
          query: 'test query',
          limit: 10
        })
        .expect(401);
    });
  });
});

// API 契約測試 (使用 Pact)
describe('Document API Contract Tests', () => {
  let provider: Pact;

  beforeEach(() => {
    provider = new Pact({
      consumer: 'sales-copilot-frontend',
      provider: 'sales-copilot-api',
      port: 1234,
      log: path.resolve(process.cwd(), 'logs', 'pact.log'),
      dir: path.resolve(process.cwd(), 'pacts'),
      logLevel: 'INFO'
    });
  });

  it('should search documents', async () => {
    await provider
      .given('documents exist in knowledge base')
      .uponReceiving('a request to search documents')
      .withRequest({
        method: 'POST',
        path: '/api/v2/documents/search',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token'
        },
        body: {
          query: 'test',
          limit: 10
        }
      })
      .willRespondWith({
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        },
        body: {
          success: true,
          data: like([
            {
              id: like('doc-123'),
              title: like('Test Document'),
              score: like(0.95)
            }
          ])
        }
      });

    return provider.verify();
  });
});
```

---

## 17. 備份與災難恢復

### 17.1 備份策略

#### 資料庫備份配置
```typescript
// backup-service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private configService: ConfigService) {}

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async performDailyBackup(): Promise<void> {
    try {
      await this.backupDatabase();
      await this.backupFileStorage();
      await this.verifyBackupIntegrity();

      this.logger.log('Daily backup completed successfully');
    } catch (error) {
      this.logger.error('Daily backup failed', error);
      await this.alertBackupFailure(error);
    }
  }

  private async backupDatabase(): Promise<void> {
    const backupConfig = {
      serverName: this.configService.get('AZURE_SQL_SERVER'),
      databaseName: this.configService.get('AZURE_SQL_DATABASE'),
      storageAccount: this.configService.get('BACKUP_STORAGE_ACCOUNT'),
      retentionDays: 30,
      compressionEnabled: true
    };

    // PostgreSQL 自動備份配置
    const backupPolicy = {
      shortTermRetention: {
        retentionDays: 7,
        diffBackupIntervalInHours: 12
      },
      longTermRetention: {
        weeklyRetention: 'P12W',
        monthlyRetention: 'P12M',
        yearlyRetention: 'P5Y',
        weekOfYear: 1
      }
    };

    this.logger.log('Database backup initiated', backupConfig);
  }

  private async backupFileStorage(): Promise<void> {
    // Azure Blob Storage 備份
    const storageBackup = {
      sourceContainer: 'sales-documents',
      backupContainer: 'sales-documents-backup',
      crossRegionReplication: true,
      encryptionEnabled: true
    };

    this.logger.log('File storage backup initiated', storageBackup);
  }
}
```

#### RTO/RPO 目標設定
```typescript
// disaster-recovery-config.ts
export const DisasterRecoveryConfig = {
  objectives: {
    criticalSystems: {
      RTO: '1 hour',        // Recovery Time Objective
      RPO: '15 minutes',    // Recovery Point Objective
      availability: '99.9%'
    },
    normalSystems: {
      RTO: '4 hours',
      RPO: '1 hour',
      availability: '99.5%'
    }
  },

  backupSchedule: {
    database: {
      full: 'weekly',
      differential: 'daily',
      transaction_log: 'every_15_minutes'
    },
    fileStorage: {
      incremental: 'daily',
      full: 'weekly'
    }
  },

  recoveryRegions: {
    primary: 'East Asia',
    secondary: 'Southeast Asia',
    backup: 'Japan East'
  }
};
```

### 17.2 災難恢復程序

#### 自動容錯移轉配置
```typescript
// failover-service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FailoverService {
  private readonly logger = new Logger(FailoverService.name);

  async initiateFailover(region: string): Promise<void> {
    const failoverPlan = {
      priority1: [
        'database_failover',
        'storage_failover',
        'authentication_service'
      ],
      priority2: [
        'api_gateway',
        'microservices',
        'monitoring_systems'
      ],
      priority3: [
        'analytics_services',
        'reporting_systems',
        'backup_services'
      ]
    };

    for (const [priority, services] of Object.entries(failoverPlan)) {
      await this.executeFailoverStep(priority, services, region);
    }
  }

  private async executeFailoverStep(
    priority: string,
    services: string[],
    region: string
  ): Promise<void> {
    this.logger.log(`Executing failover step: ${priority}`, { services, region });

    // Azure Traffic Manager 設定
    const trafficManagerConfig = {
      profileName: 'sales-enablement-tm',
      targetRegion: region,
      routingMethod: 'Priority',
      endpoints: services.map(service => ({
        name: service,
        target: `${service}.${region}.cloudapp.azure.com`,
        priority: parseInt(priority.replace('priority', ''))
      }))
    };

    // 健康檢查配置
    const healthCheckConfig = {
      protocol: 'HTTPS',
      port: 443,
      path: '/health',
      intervalInSeconds: 30,
      timeoutInSeconds: 10,
      toleratedNumberOfFailures: 3
    };
  }
}
```

## 18. 效能優化策略

### 18.1 資料庫效能優化

#### 索引策略設計
```sql
-- 核心查詢索引
-- 客戶查詢優化
CREATE INDEX IX_Customer_Search ON Customer (company_name, email, created_at)
INCLUDE (id, status, assigned_user_id);

-- 通話記錄查詢優化
CREATE INDEX IX_Call_Customer_Date ON CallRecord (customer_id, call_date DESC)
INCLUDE (duration, outcome, recording_url);

-- 提案查詢優化
CREATE INDEX IX_Proposal_Status_Date ON Proposal (customer_id, status, created_at DESC)
INCLUDE (version, total_value);

-- 複合索引優化
CREATE INDEX IX_CallRecord_Complex ON CallRecord (customer_id, status, call_date)
WHERE status IN ('completed', 'scheduled');

-- 全文搜尋索引
CREATE FULLTEXT INDEX FT_Customer_Content ON Customer (company_name, notes);
CREATE FULLTEXT INDEX FT_CallRecord_Content ON CallRecord (summary, action_items);
```

#### 查詢優化服務
```typescript
// query-optimization.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class QueryOptimizationService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  // 分頁查詢優化
  async getCustomersOptimized(
    page: number = 1,
    limit: number = 20,
    filters: any = {}
  ): Promise<{ data: Customer[]; total: number }> {
    const queryBuilder = this.customerRepository
      .createQueryBuilder('customer')
      .select([
        'customer.id',
        'customer.company_name',
        'customer.email',
        'customer.status',
        'customer.created_at'
      ]);

    // 動態篩選條件
    if (filters.status) {
      queryBuilder.andWhere('customer.status = :status', { status: filters.status });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(customer.company_name ILIKE :search OR customer.email ILIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // 優化排序
    queryBuilder.orderBy('customer.created_at', 'DESC');

    // 分頁處理
    const [data, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total };
  }

  // 批次查詢優化
  async getCustomersWithRelations(customerIds: number[]): Promise<Customer[]> {
    return this.customerRepository
      .createQueryBuilder('customer')
      .leftJoinAndSelect('customer.callRecords', 'call')
      .leftJoinAndSelect('customer.proposals', 'proposal')
      .where('customer.id IN (:...ids)', { ids: customerIds })
      .getMany();
  }
}
```

### 18.2 快取策略實施

#### Redis 快取配置
```typescript
// cache-config.service.ts
import { Injectable, CacheModule } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-redis-store';

@Injectable()
export class CacheConfigService {
  static getConfig(configService: ConfigService) {
    return CacheModule.register({
      store: redisStore,
      host: configService.get('REDIS_HOST'),
      port: configService.get('REDIS_PORT'),
      password: configService.get('REDIS_PASSWORD'),
      ttl: 600, // 預設 10 分鐘
      max: 1000, // 最大快取項目數

      // Redis Cluster 配置
      cluster: {
        nodes: [
          { host: 'redis-1.azure.com', port: 6380 },
          { host: 'redis-2.azure.com', port: 6380 },
          { host: 'redis-3.azure.com', port: 6380 }
        ],
        options: {
          enableReadyCheck: true,
          redisOptions: {
            password: configService.get('REDIS_PASSWORD'),
            tls: {}
          }
        }
      }
    });
  }
}

// 快取裝飾器
export function Cacheable(ttl: number = 300) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const cacheKey = `${target.constructor.name}:${propertyName}:${JSON.stringify(args)}`;

      // 檢查快取
      const cached = await this.cacheManager.get(cacheKey);
      if (cached) {
        return cached;
      }

      // 執行原方法
      const result = await method.apply(this, args);

      // 設定快取
      await this.cacheManager.set(cacheKey, result, { ttl });

      return result;
    };
  };
}
```

#### 智能快取策略
```typescript
// smart-cache.service.ts
import { Injectable, CACHE_MANAGER, Inject } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class SmartCacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // 多層快取策略
  async getWithMultiLayerCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      l1Ttl?: number; // 記憶體快取
      l2Ttl?: number; // Redis 快取
      l3Ttl?: number; // CDN 快取
    } = {}
  ): Promise<T> {
    const { l1Ttl = 60, l2Ttl = 300, l3Ttl = 3600 } = options;

    // L1: 記憶體快取
    const l1Key = `l1:${key}`;
    let result = await this.cacheManager.get<T>(l1Key);
    if (result) return result;

    // L2: Redis 快取
    const l2Key = `l2:${key}`;
    result = await this.cacheManager.get<T>(l2Key);
    if (result) {
      await this.cacheManager.set(l1Key, result, { ttl: l1Ttl });
      return result;
    }

    // L3: 資料庫查詢
    result = await fetcher();

    // 設定所有層級快取
    await Promise.all([
      this.cacheManager.set(l1Key, result, { ttl: l1Ttl }),
      this.cacheManager.set(l2Key, result, { ttl: l2Ttl })
    ]);

    return result;
  }

  // 智能快取更新
  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.cacheManager.store.keys(`*${pattern}*`);
    await Promise.all(keys.map(key => this.cacheManager.del(key)));
  }
}
```

### 18.3 CDN 和靜態資源優化

#### Azure CDN 配置
```typescript
// cdn-config.ts
export const CDNConfig = {
  profile: {
    name: 'sales-enablement-cdn',
    sku: 'Standard_Microsoft',
    location: 'Global'
  },

  endpoints: {
    static: {
      name: 'sales-static',
      originHostName: 'salesenablement.blob.core.windows.net',
      caching: {
        queryStringCachingBehavior: 'IgnoreQueryString',
        cacheDuration: '7.00:00:00', // 7 天
        compressionEnabled: true,
        allowedContentTypes: [
          'text/css',
          'text/javascript',
          'application/javascript',
          'image/png',
          'image/jpeg',
          'image/svg+xml'
        ]
      }
    },

    api: {
      name: 'sales-api',
      originHostName: 'api.salesenablement.com',
      caching: {
        queryStringCachingBehavior: 'UseQueryString',
        cacheDuration: '0.00:05:00', // 5 分鐘
        cacheHeaders: ['Authorization', 'Content-Type']
      }
    }
  },

  optimizationRules: [
    {
      name: 'image-optimization',
      conditions: [
        {
          typeName: 'UrlFileExtensionCondition',
          parameters: {
            extensions: ['jpg', 'jpeg', 'png', 'gif', 'webp']
          }
        }
      ],
      actions: [
        {
          typeName: 'CacheExpirationAction',
          parameters: {
            cacheType: 'All',
            cacheDuration: '30.00:00:00' // 30 天
          }
        }
      ]
    }
  ]
};
```

## 19. 成本優化與管理

### 19.1 Azure 成本監控

#### 成本追蹤服務
```typescript
// cost-monitoring.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CostMonitoringService {
  private readonly logger = new Logger(CostMonitoringService.name);

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async analyzeDailyCosts(): Promise<void> {
    const costAnalysis = await this.getCostBreakdown();
    const anomalies = this.detectCostAnomalies(costAnalysis);

    if (anomalies.length > 0) {
      await this.alertCostAnomalies(anomalies);
    }

    await this.generateCostReport(costAnalysis);
  }

  private async getCostBreakdown(): Promise<CostAnalysis> {
    // Azure Cost Management API 整合
    const services = [
      'Azure OpenAI Service',
      'PostgreSQL Database',
      'Azure Functions',
      'Azure Blob Storage',
      'Azure CDN',
      'Azure Monitor'
    ];

    const costData = {
      total: 0,
      breakdown: {} as Record<string, number>,
      trends: {} as Record<string, number[]>
    };

    // 模擬成本數據收集
    for (const service of services) {
      const dailyCost = await this.getServiceCost(service);
      costData.breakdown[service] = dailyCost;
      costData.total += dailyCost;
    }

    return costData;
  }

  private detectCostAnomalies(analysis: CostAnalysis): CostAnomaly[] {
    const anomalies: CostAnomaly[] = [];
    const threshold = 0.2; // 20% 增長閾值

    for (const [service, cost] of Object.entries(analysis.breakdown)) {
      const historicalAverage = this.getHistoricalAverage(service);
      const increase = (cost - historicalAverage) / historicalAverage;

      if (increase > threshold) {
        anomalies.push({
          service,
          currentCost: cost,
          expectedCost: historicalAverage,
          increasePercentage: increase * 100,
          severity: increase > 0.5 ? 'high' : 'medium'
        });
      }
    }

    return anomalies;
  }
}

interface CostAnalysis {
  total: number;
  breakdown: Record<string, number>;
  trends: Record<string, number[]>;
}

interface CostAnomaly {
  service: string;
  currentCost: number;
  expectedCost: number;
  increasePercentage: number;
  severity: 'low' | 'medium' | 'high';
}
```

### 19.2 AI Token 使用優化

#### OpenAI Token 管理
```typescript
// token-optimization.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class TokenOptimizationService {
  private readonly logger = new Logger(TokenOptimizationService.name);
  private readonly tokenLimits = {
    daily: 100000,
    hourly: 5000,
    perUser: 1000
  };

  async optimizePrompt(originalPrompt: string): Promise<{
    optimizedPrompt: string;
    estimatedTokens: number;
    savings: number;
  }> {
    // 提示詞優化策略
    const optimizations = [
      this.removeRedundantWords,
      this.useAbreviations,
      this.structureContent,
      this.removeExamples
    ];

    let optimizedPrompt = originalPrompt;
    const originalTokens = this.estimateTokens(originalPrompt);

    for (const optimization of optimizations) {
      optimizedPrompt = optimization(optimizedPrompt);
    }

    const optimizedTokens = this.estimateTokens(optimizedPrompt);
    const savings = ((originalTokens - optimizedTokens) / originalTokens) * 100;

    return {
      optimizedPrompt,
      estimatedTokens: optimizedTokens,
      savings
    };
  }

  // Token 使用量追蹤
  async trackTokenUsage(
    userId: string,
    operation: string,
    tokensUsed: number
  ): Promise<void> {
    const usage = {
      userId,
      operation,
      tokensUsed,
      timestamp: new Date(),
      cost: this.calculateCost(tokensUsed)
    };

    // 檢查使用限制
    const currentUsage = await this.getCurrentUsage(userId);
    if (currentUsage.daily + tokensUsed > this.tokenLimits.daily) {
      throw new Error('Daily token limit exceeded');
    }

    await this.saveUsageRecord(usage);
  }

  private removeRedundantWords(text: string): string {
    const redundantPatterns = [
      /\b(very|really|quite|pretty)\s+/gi,
      /\b(that is|which is)\s+/gi,
      /\bin order to\b/gi,
      /\bdue to the fact that\b/gi
    ];

    return redundantPatterns.reduce(
      (result, pattern) => result.replace(pattern, ''),
      text
    );
  }

  private calculateCost(tokens: number): number {
    // GPT-4 Turbo 定價 (模擬)
    const inputCostPer1K = 0.01;   // $0.01 per 1K tokens
    const outputCostPer1K = 0.03;  // $0.03 per 1K tokens

    return (tokens / 1000) * inputCostPer1K;
  }
}
```

### 19.3 資源自動伸縮配置

#### 智能伸縮策略
```typescript
// auto-scaling.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AutoScalingService {
  private readonly logger = new Logger(AutoScalingService.name);

  async configureAutoScaling(): Promise<void> {
    const scalingRules = {
      webApp: {
        minInstances: 2,
        maxInstances: 20,
        targetCpuPercentage: 70,
        targetMemoryPercentage: 80,
        scaleOutCooldown: '5m',
        scaleInCooldown: '10m'
      },

      functions: {
        consumptionPlan: true,
        premiumPlan: {
          minInstances: 1,
          maxInstances: 10,
          preWarmedInstances: 2
        }
      },

      database: {
        autoScaleEnabled: true,
        minDTU: 10,
        maxDTU: 100,
        cpuThreshold: 75,
        memoryThreshold: 85
      }
    };

    await this.applyScalingRules(scalingRules);
  }

  // 預測性伸縮
  async predictiveScaling(): Promise<void> {
    const historicalData = await this.getHistoricalMetrics();
    const prediction = this.analyzeTrafficPatterns(historicalData);

    if (prediction.expectedIncrease > 0.3) {
      await this.preScaleResources(prediction.recommendedCapacity);
      this.logger.log('Pre-scaling initiated based on prediction', prediction);
    }
  }

  private analyzeTrafficPatterns(data: any[]): ScalingPrediction {
    // 分析歷史流量模式
    const patterns = {
      dailyPeak: this.findDailyPeaks(data),
      weeklyTrend: this.findWeeklyTrends(data),
      seasonalPattern: this.findSeasonalPatterns(data)
    };

    return {
      expectedIncrease: patterns.dailyPeak.growth,
      recommendedCapacity: Math.ceil(patterns.dailyPeak.maxInstances * 1.2),
      confidence: patterns.dailyPeak.confidence
    };
  }
}

interface ScalingPrediction {
  expectedIncrease: number;
  recommendedCapacity: number;
  confidence: number;
}
```

### 19.4 成本優化建議引擎

```typescript
// cost-optimizer.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class CostOptimizerService {
  async generateOptimizationRecommendations(): Promise<OptimizationRecommendation[]> {
    const recommendations: OptimizationRecommendation[] = [];

    // Azure Advisor 整合
    const advisorRecommendations = await this.getAzureAdvisorRecommendations();

    // 自定義優化建議
    const customRecommendations = [
      {
        category: 'Storage',
        description: '將冷數據遷移到 Cool/Archive 儲存層',
        potentialSavings: 500,
        implementation: 'Set up lifecycle management policies',
        priority: 'medium'
      },
      {
        category: 'Compute',
        description: '使用 Azure Reserved Instances',
        potentialSavings: 1200,
        implementation: 'Purchase 1-year reserved capacity',
        priority: 'high'
      },
      {
        category: 'AI Services',
        description: '實施智能 Token 管理',
        potentialSavings: 800,
        implementation: 'Deploy token optimization strategies',
        priority: 'high'
      }
    ];

    return [...advisorRecommendations, ...customRecommendations];
  }
}

interface OptimizationRecommendation {
  category: string;
  description: string;
  potentialSavings: number;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
}
```

---

*架構文件增強完成 - 現已包含完整的企業級技術指導*
