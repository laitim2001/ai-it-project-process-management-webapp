# 5. 數據模型與 Prisma Schema

數據模型是本應用的核心基礎。我們將使用 Prisma 作為 ORM，在 `packages/db/prisma/schema.prisma` 文件中定義我們的數據庫結構。Prisma 將基於此 schema 自動生成類型安全的資料庫客戶端。

以下是我們應用的核心 `schema.prisma` 設計：

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================================================================
// 1. 核心使用者與權限模型 (Core User & Auth Models)
// ==================================================================

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  roleId    Int
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  role         Role          @relation(fields: [roleId], references: [id])
  projects     Project[]     @relation("ProjectManager")
  approvals    Project[]     @relation("Supervisor")
  comments     Comment[]
  historyItems History[]
}

model Role {
  id    Int    @id @default(autoincrement())
  name  String @unique // "ProjectManager", "Supervisor", "Admin"
  users User[]
}

// ==================================================================
// 2. 核心業務流程模型 (Core Business Process Models)
// ==================================================================

model BudgetPool {
  id             String    @id @default(uuid())
  name           String    // e.g., "FY2025 Marketing Budget"
  totalAmount    Float
  financialYear  Int
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  projects Project[]
}

model Project {
  id             String    @id @default(uuid())
  name           String
  description    String?
  status         String    @default("Draft") // e.g., "Draft", "InProgress", "Completed", "Archived"
  managerId      String
  supervisorId   String
  budgetPoolId   String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  manager        User          @relation("ProjectManager", fields: [managerId], references: [id])
  supervisor     User          @relation("Supervisor", fields: [supervisorId], references: [id])
  budgetPool     BudgetPool    @relation(fields: [budgetPoolId], references: [id])
  proposals      BudgetProposal[]
  purchaseOrders PurchaseOrder[]
}

model BudgetProposal {
  id          String   @id @default(uuid())
  title       String
  amount      Float
  status      String   @default("Draft") // "Draft", "PendingApproval", "Approved", "Rejected", "MoreInfoRequired"
  projectId   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  project     Project    @relation(fields: [projectId], references: [id])
  comments    Comment[]
  historyItems History[]
}

model Vendor {
  id             String   @id @default(uuid())
  name           String   @unique
  contactPerson  String?
  contactEmail   String?
  phone          String?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  quotes         Quote[]
  purchaseOrders PurchaseOrder[]
}

model Quote {
  id             String   @id @default(uuid())
  filePath       String
  uploadDate     DateTime @default(now())
  amount         Float
  vendorId       String
  purchaseOrderId String?  @unique
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  vendor         Vendor          @relation(fields: [vendorId], references: [id])
  purchaseOrder  PurchaseOrder?  @relation(fields: [purchaseOrderId], references: [id])
}

model PurchaseOrder {
  id         String   @id @default(uuid())
  poNumber   String   @unique @default(cuid()) // Unique Purchase Order number
  date       DateTime @default(now())
  totalAmount Float
  projectId  String
  vendorId   String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  project    Project   @relation(fields: [projectId], references: [id])
  vendor     Vendor    @relation(fields: [vendorId], references: [id])
  quote      Quote?
  expenses   Expense[]
}

model Expense {
  id              String   @id @default(uuid())
  invoiceFilePath String?
  amount          Float
  expenseDate     DateTime
  status          String   @default("Draft") // "Draft", "PendingApproval", "Approved", "Paid"
  purchaseOrderId String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  purchaseOrder PurchaseOrder @relation(fields: [purchaseOrderId], references: [id])
}


// ==================================================================
// 3. 輔助模型 (Supporting Models)
// ==================================================================

model Comment {
  id               String   @id @default(uuid())
  content          String
  userId           String
  budgetProposalId String
  createdAt        DateTime @default(now())

  user           User           @relation(fields: [userId], references: [id])
  budgetProposal BudgetProposal @relation(fields: [budgetProposalId], references: [id])
}

model History {
  id               String   @id @default(uuid())
  action           String   // e.g., "SUBMITTED", "APPROVED", "REJECTED"
  details          String?
  userId           String
  budgetProposalId String
  createdAt        DateTime @default(now())

  user           User           @relation(fields: [userId], references: [id])
  budgetProposal BudgetProposal @relation(fields: [budgetProposalId], references: [id])
}

