# Story 1.2: 核心認證與用戶管理服務 - 資料庫模型

> **🔴 MVP Priority: Phase 1** - 核心數據基礎，使用者系統的根本
> **⏱️ 預估工作量**: 1 天
> **👥 需要角色**: 後端開發者

## User Story

身為開發團隊，
我想要設定好資料庫，並建立一個包含「角色」屬性的使用者 (User) 資料模型，
以便儲存使用者資訊並為後續的權限管理打下堅實的基礎。

## 背景說明
使用者模型是任何需要認證系統的應用程式的核心。此故事的目標是定義使用者資料的結構，並透過 ORM (Object-Relational Mapper) 將其對應到實際的資料庫表中。

## 技術規格 (初步建議)
*   **資料庫選型:** **PostgreSQL**。
*   **ORM 選型:** **Prisma**。
*   **Schema 定義:** 在 `api/prisma/schema.prisma` 檔案中定義 `User` 模型和 `Role` 枚舉 (`MANAGER`, `SUPERVISOR`)。
*   **開發流程:** 初始化 Prisma，設定資料庫連接字串，並執行 `prisma migrate dev`。

## 驗收標準
**1. 資料庫連接：**
- 後端應用能成功連接到本地 PostgreSQL 資料庫。
- `DATABASE_URL` 已設定在 `.env` 中並被 `.gitignore` 忽略。
**2. 資料模型定義 (Prisma Schema):**
- `schema.prisma` 中已存在 `User` 模型，包含 `id`, `email` (`@unique`), `password`, `role` (`Role`, 預設 `MANAGER`) 欄位。
- `Role` 枚舉已定義。
**3. 資料庫同步：**
- 成功執行 `prisma migrate dev` 後，資料庫中存在結構正確的 `User` 資料表。
- Prisma Client 已成功生成。

## 技術債務考量
- **簡化模型:** MVP 階段的 `User` 模型只包含核心認證欄位。更詳細的使用者個人資料（如姓名）將在後續迭代中添加。
