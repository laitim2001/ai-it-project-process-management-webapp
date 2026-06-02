# 07 - 安全修復：新用戶預設角色（權限提升）盤點與降級

> **適用對象**：DevOps / DBA，需在 **production / UAT** 環境執行
> **關聯修復**：新用戶預設角色由 Admin 改為 ProjectManager（最小權限）
> **建立日期**：2026-06-02

---

## 背景

修復前，三條建立用戶的路徑都會把新用戶建立為 **Admin**（權限提升漏洞）：

1. **Azure AD SSO 首次登入**（`apps/web/src/auth.ts`）— 硬編碼 `roleId: 1`
2. **自助註冊 API**（`apps/web/src/app/api/auth/register/route.ts`）— 硬編碼 `roleId: 1`
3. **Prisma schema 預設值**（`packages/db/prisma/schema.prisma`）— `User.roleId @default(1)`

根因：`Role.id` 為 autoincrement，seed 依序建立 **Admin=1, ProjectManager=2, Supervisor=3**，
但程式碼註解誤以為 `roleId=1` 是 ProjectManager。實際 `roleId=1` 是 **Admin**。

> ⚠️ 若 Azure AD provider 已在 production 啟用，**任何首次以公司 SSO 登入的員工都會自動成為 Admin**；
> 自助註冊端點則對所有人開放，風險更高。

修復後：三條路徑都改為以 `role.name = 'ProjectManager'` 查詢取得 `roleId`（schema 預設改為安全網 `@default(2)`）。
RBAC 中介層（`packages/api/src/trpc.ts`）以 `role.name` 判斷，故此修復**不影響既有權限檢查邏輯**，
只改變「新用戶預設權限」。

---

## 重要原則

- ❌ **不可盲目 blanket-downgrade 所有 Admin** — 可能有被管理員「合法手動指派」為 Admin 的用戶。
- ✅ 先用**盤點查詢**列出候選名單，**人工確認**後再對**指定 email** 降級。
- ✅ 保留種子建立的合法管理員 `admin@itpm.local`。
- ✅ 高信心候選：`password IS NULL`（SSO 用戶）且為 Admin — 這類幾乎必然是 bug 誤建（SSO 用戶不會被手動建立成 Admin）。

---

## Step 1 — 盤點：列出所有 Admin 用戶（排除種子管理員）

```sql
SELECT
  u.id,
  u.email,
  u.name,
  (u.password IS NULL) AS is_sso_user,   -- true = 透過 Azure AD SSO 建立
  u."createdAt",
  r.name AS role_name
FROM "User" u
JOIN "Role" r ON r.id = u."roleId"
WHERE r.name = 'Admin'
  AND u.email <> 'admin@itpm.local'        -- 排除種子建立的合法管理員
ORDER BY is_sso_user DESC, u."createdAt" DESC;
```

**判讀**：
- `is_sso_user = true` → 高信心 bug 誤建（建議降級）。
- `is_sso_user = false`（有密碼）→ 可能是自助註冊誤建，也可能是合法手動指派；逐一與 IT 確認。

---

## Step 2 — （可選）僅統計高信心候選數量

```sql
SELECT COUNT(*) AS sso_admin_count
FROM "User" u
JOIN "Role" r ON r.id = u."roleId"
WHERE r.name = 'Admin'
  AND u.password IS NULL
  AND u.email <> 'admin@itpm.local';
```

---

## Step 3 — 降級指定用戶為 ProjectManager（人工確認名單後執行）

> 將下方 email 清單替換為 Step 1 確認過、確定要降級的帳號。
> 以 `role.name` 子查詢取得 id，避免硬編碼數值。

```sql
UPDATE "User"
SET "roleId" = (SELECT id FROM "Role" WHERE name = 'ProjectManager'),
    "updatedAt" = NOW()
WHERE email IN (
  'someone@company.com',
  'another@company.com'
)
AND "roleId" = (SELECT id FROM "Role" WHERE name = 'Admin');  -- 防呆：僅降級目前為 Admin 者
```

> 若要一次降級**所有 SSO 誤建 Admin**（已確認環境中沒有任何 SSO 帳號應為 Admin 時才用）：
>
> ```sql
> UPDATE "User"
> SET "roleId" = (SELECT id FROM "Role" WHERE name = 'ProjectManager'),
>     "updatedAt" = NOW()
> WHERE "roleId" = (SELECT id FROM "Role" WHERE name = 'Admin')
>   AND password IS NULL
>   AND email <> 'admin@itpm.local';
> ```

---

## Step 4 — 驗證

```sql
-- 應只剩預期內的 Admin（至少 admin@itpm.local + 任何合法手動指派者）
SELECT u.email, (u.password IS NULL) AS is_sso_user, r.name AS role_name
FROM "User" u
JOIN "Role" r ON r.id = u."roleId"
WHERE r.name = 'Admin'
ORDER BY u.email;
```

> 被降級的用戶需**重新登入**（清除舊 JWT session）才會套用新角色，因 session 為 24h JWT。

---

## 注意：登出 / Session 失效

降級後，受影響用戶的現有 JWT（最長 24 小時）仍帶舊角色。若需立即生效，請通知對方登出再登入，
或縮短 `session.maxAge` 後重啟服務。
