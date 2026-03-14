# 本地開發環境初始化檢查清單

**最後更新**: 2026-03-14
**適用場景**: 新電腦設置、專案複製還原、跨機器遷移、新成員加入
**經驗來源**: 實際從另一台電腦複製專案後的初始化過程

---

## 📋 目錄

- [快速啟動（TL;DR）](#快速啟動tldr)
- [Phase 1: 環境檢查](#phase-1-環境檢查)
- [Phase 2: 基礎服務啟動](#phase-2-基礎服務啟動)
- [Phase 3: 依賴安裝與生成](#phase-3-依賴安裝與生成)
- [Phase 4: 資料庫初始化](#phase-4-資料庫初始化)
- [Phase 5: 環境變數調整](#phase-5-環境變數調整)
- [Phase 6: 啟動與驗證](#phase-6-啟動與驗證)
- [常見問題與解決方案](#常見問題與解決方案)
- [初始化檢查清單](#初始化檢查清單)

---

## 快速啟動（TL;DR）

如果你熟悉本專案，以下是最精簡的初始化步驟：

```bash
# 1. 啟動 Docker 服務
docker-compose up -d

# 2. 安裝依賴
pnpm install

# 3. 生成 Prisma Client
cd packages/db && npx prisma generate && cd ../..

# 4. 同步資料庫 Schema（全新資料庫或 Schema 不一致時）
cd packages/db && npx prisma db push --accept-data-loss && cd ../..

# 5. 執行種子資料（包含權限、測試帳號等）
pnpm --filter db db:seed

# 6. 確認 .env 中的 NEXTAUTH_URL 與實際使用的 Port 一致

# 7. 啟動開發服務器
pnpm dev
```

---

## Phase 1: 環境檢查

### 1.1 必要工具版本

| 工具 | 最低版本 | 建議版本 | 檢查指令 |
|------|---------|---------|---------|
| **Node.js** | >= 20.0.0 | 20.11.0 | `node -v` |
| **pnpm** | >= 8.0.0 | 8.15.3 | `pnpm -v` |
| **Docker** | >= 20.10.0 | 最新 | `docker --version` |
| **Git** | >= 2.30.0 | 最新 | `git --version` |

```bash
# 一次檢查所有工具
node -v && pnpm -v && docker --version && git --version
```

### 1.2 專案來源確認

```bash
# 確認 Git 狀態
git status
git branch
git log --oneline -5

# 如果是從 Git clone 的，確保是最新版本
git pull origin main
```

> **注意**: 如果專案是透過檔案複製（非 Git clone），確保 `.env` 檔案已存在。
> `.env` 在 `.gitignore` 中，不會被 Git 追蹤，需要手動複製或從 `.env.example` 建立。

### 1.3 .env 檔案確認

```bash
# 檢查 .env 是否存在
ls -la .env

# 如果不存在，從範本建立
cp .env.example .env
# 然後編輯 .env 填入必要的配置值
```

---

## Phase 2: 基礎服務啟動

### 2.1 啟動 Docker 容器

```bash
docker-compose up -d
```

### 2.2 驗證容器狀態

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

**預期結果**（5 個容器全部運行）：

| 容器名稱 | 用途 | Port | 預期狀態 |
|----------|------|------|---------|
| `itpm-postgres-dev` | PostgreSQL 資料庫 | 5434:5432 | Up (healthy) |
| `itpm-redis-dev` | Redis 快取 | 6381:6379 | Up (healthy) |
| `itpm-mailhog` | 郵件測試 | 1025/8025 | Up |
| `itpm-azurite-dev` | Azure Storage 模擬 | 10000-10002 | Up (healthy) |
| `itpm-pgadmin` | 資料庫管理 UI | 5050 | Up |

> **注意**: 本專案使用**非標準 Port** 以避免與其他專案衝突：
> - PostgreSQL: **5434**（非預設 5432）
> - Redis: **6381**（非預設 6379）

### 2.3 常見 Docker 問題

#### Port 衝突
```bash
# 檢查 Port 佔用情況
netstat -ano | grep -E ":5434|:6381|:1025|:8025|:10000"

# 如果有衝突，停止佔用程式或修改 docker-compose.yml 中的 Port 映射
```

#### pgAdmin 持續重啟
pgAdmin 容器偶爾會因為 PostgreSQL 尚未完全就緒而持續重啟，這不影響主要功能。
等待 PostgreSQL 完全啟動後 pgAdmin 通常會自動恢復。

---

## Phase 3: 依賴安裝與生成

### 3.1 安裝依賴

```bash
pnpm install
```

> **注意**: 如果提示 "The modules directories will be removed and reinstalled from scratch. Proceed?"
> 輸入 `y` 確認。如果卡住，可以用 `echo "y" | pnpm install` 自動確認。

### 3.2 生成 Prisma Client

`pnpm install` 的 postinstall 腳本會嘗試自動生成，但可能失敗。建議手動確認：

```bash
cd packages/db && npx prisma generate
```

**預期輸出**:
```
✔ Generated Prisma Client (v5.22.0) to ...
```

> **常見錯誤**: 如果出現 `EPERM: operation not permitted` 錯誤，表示有其他程式（如 dev server）
> 正在使用 Prisma Client 檔案。請先停止 dev server 再重新生成。

---

## Phase 4: 資料庫初始化

這是最容易出問題的階段，需要根據資料庫的實際狀態選擇不同策略。

### 4.1 判斷資料庫狀態

```bash
cd packages/db && npx prisma migrate status
```

**可能的結果：**

| 狀態 | 說明 | 處理方式 |
|------|------|---------|
| "Database schema is up to date!" | Schema 已同步 | 跳到 4.4 種子資料 |
| "X migrations have not yet been applied" | 有未套用的遷移 | 執行 4.2 |
| "migrate found failed migrations" | 有失敗的遷移記錄 | 執行 4.3 |
| 連線錯誤 | 資料庫未啟動或連線資訊錯誤 | 檢查 Docker 和 .env |

### 4.2 套用遷移（正常情況）

```bash
cd packages/db && npx prisma migrate deploy
```

### 4.3 處理遷移歷史不一致

當專案從另一台電腦複製過來時，Docker volume 中的資料庫可能是**全新的**或**舊版本的**。
這會導致遷移歷史不一致。

#### 方法 A：全新資料庫（推薦）

如果是全新的資料庫（Docker volume 剛建立），直接用 `db push` 同步所有 Schema：

```bash
cd packages/db && npx prisma db push --accept-data-loss
```

#### 方法 B：有失敗遷移記錄

先解決失敗記錄，再嘗試重新套用：

```bash
# 標記失敗的遷移為已回滾
cd packages/db && npx prisma migrate resolve --rolled-back <migration_name>

# 如果表已存在但遷移記錄缺失，標記為已套用
cd packages/db && npx prisma migrate resolve --applied <migration_name>

# 重新嘗試
cd packages/db && npx prisma migrate deploy
```

#### 方法 C：Schema 嚴重不一致

如果上述方法都不行，且是開發環境，可以重置：

```bash
# ⚠️ 警告：會清除所有資料！
cd packages/db && npx prisma db push --accept-data-loss
```

### 4.4 驗證 Schema 同步

確認資料庫表數量與 Prisma Schema model 數量一致：

```bash
# 檢查 Prisma Schema 中的 model 數量（應為 32 個）
grep "^model " packages/db/prisma/schema.prisma | wc -l

# 檢查資料庫實際表數量（應為 33 = 32 models + 1 _prisma_migrations）
docker exec itpm-postgres-dev psql -U postgres -d itpm_dev -c \
  "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';"
```

### 4.5 執行種子資料（關鍵！）

**這一步極為重要**，不執行會導致：
- Sidebar 選單完全不顯示（缺少權限資料）
- 角色權限不生效
- 沒有測試帳號可用

```bash
pnpm --filter db db:seed
```

**種子資料內容：**

| 類別 | 數量 | 說明 |
|------|------|------|
| 角色 (Role) | 3 | Admin, ProjectManager, Supervisor |
| 菜單權限 (Permission) | 18 | Sidebar 各功能項的訪問權限 |
| 角色預設權限 (RolePermission) | 46 | Admin=18, Supervisor=17, PM=11 |
| 費用類別 (ExpenseCategory) | 8 | HW, SW, SV, MAINT, LICENSE, CLOUD, TELECOM, OTHER |
| 測試用戶 | 3 | admin, pm, supervisor |
| 預算池、專案、供應商等 | 多筆 | 完整的示範業務資料 |

**種子資料預設帳號：**

| 角色 | Email | 密碼 | 權限數量 |
|------|-------|------|---------|
| **Admin** | `admin@itpm.local` | `admin123` | 18（全部功能） |
| **ProjectManager** | `pm@itpm.local` | `pm123` | 11（核心業務） |
| **Supervisor** | `supervisor@itpm.local` | `supervisor123` | 17（除用戶管理） |

---

## Phase 5: 環境變數調整

### 5.1 NEXTAUTH_URL（最常需要調整）

如果 Port 3000 被其他程式佔用，Next.js 會自動跳到 3001、3002 等。
此時**必須**同步更新 `.env` 中的 `NEXTAUTH_URL`：

```bash
# 查看哪些 Port 被佔用
netstat -ano | grep -E ":300[0-9]" | grep LISTENING

# 更新 .env（假設使用 3002）
# NEXTAUTH_URL="http://localhost:3002"
```

> **為什麼重要？** NextAuth 的認證回調 URL 依賴此設定。
> 如果設定的 Port 與實際運行的 Port 不一致，登入後會被重導到錯誤的地址。

### 5.2 其他可能需要調整的變數

| 變數 | 預設值 | 何時需要調整 |
|------|--------|-------------|
| `DATABASE_URL` | `localhost:5434` | 修改了 Docker PostgreSQL Port 時 |
| `REDIS_URL` | `localhost:6381` | 修改了 Docker Redis Port 時 |
| `CORS_ORIGIN` | `http://localhost:3000` | Port 變更時一起調整 |
| `NEXTAUTH_SECRET` | 已設定 | 新環境建議重新生成 |

```bash
# 重新生成 NEXTAUTH_SECRET
openssl rand -base64 32
```

### 5.3 .env 不會影響 Git 同步

`.env` 在 `.gitignore` 中，修改不會影響 Git 狀態或與其他電腦的程式碼同步。
每台電腦應該有獨立的 `.env` 配置。

---

## Phase 6: 啟動與驗證

### 6.1 啟動開發服務器

```bash
pnpm dev
```

**觀察啟動輸出**：
```
@itpm/web:dev: ▲ Next.js 14.2.33
@itpm/web:dev: - Local: http://localhost:3002    ← 確認實際 Port
@itpm/web:dev: ✓ Ready in 1640ms                 ← 確認啟動成功
```

### 6.2 驗證清單

#### 基本功能
- [ ] 瀏覽器可以打開應用（http://localhost:XXXX）
- [ ] 登入頁面正常顯示
- [ ] 可以用測試帳號登入
- [ ] Sidebar 選單正常顯示所有功能項

#### 登入驗證
- [ ] Admin 帳號可登入（`admin@itpm.local` / `admin123`）
- [ ] 登入後可以看到 Dashboard
- [ ] Sidebar 顯示所有 18 個功能項（Admin 角色）

#### 資料驗證
- [ ] Dashboard 顯示統計數據
- [ ] 專案列表有示範資料
- [ ] 預算池列表有資料

### 6.3 清除瀏覽器快取

如果從另一台電腦遷移，瀏覽器可能有舊的 session cookies（用舊的 NEXTAUTH_SECRET 加密），
會導致 `no matching decryption secret` 錯誤。

**解決方法**：
1. 按 `F12` 開啟 DevTools
2. Application → Cookies → 刪除所有 `localhost` 的 cookies
3. 重新整理頁面

---

## 常見問題與解決方案

### Q1: Sidebar 完全看不到任何功能

**原因**: `Permission` 和 `RolePermission` 表為空。
**解決**: 執行種子資料 `pnpm --filter db db:seed`

### Q2: 登入時顯示「密碼錯誤」

**可能原因**：
1. 密碼確實不正確（種子資料預設密碼見上方表格）
2. 透過 SQL 直接更新密碼時，bcrypt hash 中的 `$` 符號被 shell 轉義

**安全的密碼重設方法**（透過 Node.js，避免 shell 轉義問題）：
```bash
node -e "
const bcrypt = require('./packages/db/node_modules/bcryptjs');
const { PrismaClient } = require('./node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const hash = await bcrypt.hash('YOUR_NEW_PASSWORD', 10);
  await prisma.user.update({
    where: { email: 'admin@itpm.local' },
    data: { password: hash }
  });
  console.log('Password updated successfully');
  await prisma.\$disconnect();
}
main();
"
```

> **重要**: 不要用 `docker exec psql` 直接更新密碼！bcrypt hash 包含 `$` 符號，
> 會被 bash shell 解釋為變數，導致存入損壞的 hash。

### Q3: 登入後被重導到錯誤頁面或無法登入

**原因**: `NEXTAUTH_URL` 與實際運行 Port 不一致。
**解決**: 更新 `.env` 中的 `NEXTAUTH_URL` 後重啟 dev server。

### Q4: `no matching decryption secret` 錯誤

**原因**: 瀏覽器有舊的 JWT session cookie（用不同的 NEXTAUTH_SECRET 加密）。
**解決**: 清除瀏覽器 cookies 後重新登入。

### Q5: `prisma generate` 顯示 EPERM 錯誤

**原因**: Dev server 正在使用 Prisma Client 的 query engine 檔案。
**解決**: 先停止 dev server，再執行 `npx prisma generate`，然後重新啟動。

### Q6: 遷移顯示 "relation already exists" 錯誤

**原因**: 資料庫表已存在，但遷移歷史記錄缺失。
**解決**:
```bash
# 將已存在的遷移標記為已套用
cd packages/db && npx prisma migrate resolve --applied <migration_name>
```

### Q7: Docker 容器無法啟動

```bash
# 檢查 Docker daemon 是否運行
docker info

# 查看容器日誌
docker logs itpm-postgres-dev

# 完全重建（會清除資料！）
docker-compose down -v
docker-compose up -d
```

---

## 初始化檢查清單

### 環境準備
- [ ] Node.js >= 20.0.0 已安裝
- [ ] pnpm >= 8.0.0 已安裝
- [ ] Docker Desktop 已安裝並運行
- [ ] `.env` 檔案已存在且已配置

### Docker 服務
- [ ] `docker-compose up -d` 執行成功
- [ ] PostgreSQL 容器狀態為 healthy (Port 5434)
- [ ] Redis 容器狀態為 healthy (Port 6381)
- [ ] Mailhog 容器運行中 (Port 1025/8025)
- [ ] Azurite 容器運行中 (Port 10000-10002)

### 依賴與生成
- [ ] `pnpm install` 執行成功
- [ ] `npx prisma generate` 執行成功（在 packages/db 目錄）

### 資料庫
- [ ] 資料庫可連線（`npx prisma migrate status` 無錯誤）
- [ ] Schema 已同步（32 個 model = 33 個表）
- [ ] **種子資料已執行**（`pnpm --filter db db:seed`）
- [ ] Permission 表有 18 筆資料
- [ ] RolePermission 表有資料

### 環境變數
- [ ] `NEXTAUTH_URL` 與實際運行 Port 一致
- [ ] `DATABASE_URL` 指向正確的 PostgreSQL (Port 5434)
- [ ] `REDIS_URL` 指向正確的 Redis (Port 6381)

### 驗證
- [ ] `pnpm dev` 啟動成功
- [ ] 瀏覽器可訪問應用
- [ ] 清除舊 cookies（如果從其他環境遷移）
- [ ] 可用 `admin@itpm.local` / `admin123` 登入
- [ ] Sidebar 顯示所有功能選單
- [ ] Dashboard 正常顯示

---

## 相關文檔

- [部署前置條件](./00-prerequisites.md) — Azure 部署環境準備
- [首次部署設置](./01-first-time-setup.md) — Azure 首次部署
- [故障排除](./03-troubleshooting.md) — 部署問題排查
- [開發環境設置](../../DEVELOPMENT-SETUP.md) — 跨平台開發環境指南（711 行）

---

**文檔維護者**: Development Team
**下次檢視**: 當 Prisma Schema model 數量變更或新增環境依賴時
