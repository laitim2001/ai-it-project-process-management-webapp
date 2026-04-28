---
sub_feature: FEAT-013.4
check_id: IAM-07
nature: CHANGE（擴充 auth）+ FEAT（新增 admin 解鎖介面）
status: 📋 Planned
estimated_days: 3
dependencies: FEAT-013.3（rate limit 機制可重用）
---

# FEAT-013.4 — IAM-07 帳號鎖定 + 解鎖機制

> **Check ID**: IAM-07（帳號鎖定）
> **企業級基準**: N 次失敗鎖定、防 brute force
> **目前評估**: L0 → 目標 L3
> **重要前提**: 依 Phase 0 結論，**鎖定 + 解鎖必須一起設計**，不可只做鎖定

---

## 1. 背景與目標

### 1.1 問題現況

- 無登入失敗計數
- 無帳號鎖定機制
- 即使有 Rate Limit（FEAT-013.3）也只擋 IP 層，無法針對單一帳號累積失敗

### 1.2 目標

實作 IAM-07 完整功能，**含 Phase 0 確認的 5 項解鎖機制**：

1. **失敗計數**：5 次失敗後鎖定 15 分鐘
2. **自動解鎖**：鎖定期滿自動解除
3. **Admin 手動解鎖**：`/admin/users/[id]` 加「解鎖」按鈕
4. **SSO 自動解除**：用戶透過 Azure SSO 成功登入後自動解除本地鎖定
5. **鎖定通知**：被鎖定時 email 通知用戶
6. **錯誤訊息**：不洩漏「密碼錯誤」vs「帳號鎖定」差異

### 1.3 不在範圍

- Slow brute force 偵測（緩慢分散攻擊）→ Phase 2 Obs-09 異常偵測
- 多帳號 IP 偵測（一個 IP 嘗試多個帳號）→ 同 Phase 2

---

## 2. 影響範圍

### 2.1 受影響檔案

| 檔案 | 變更類型 | 行數估 |
|------|---------|--------|
| `packages/db/prisma/schema.prisma` | User model 加欄位 + 新 AuditLog model | ~30 |
| Migration 檔案 | 新增 | auto |
| `packages/auth/src/index.ts` | 修改 authorize callback | ~50 |
| `packages/api/src/routers/user.ts` | 新增 unlockAccount procedure | ~30 |
| `packages/api/src/lib/auditLog.ts`（新建） | 新增 helper | ~50 |
| `packages/api/src/lib/email.ts` | 新增 sendLockoutNotification | ~30 |
| `apps/web/src/app/[locale]/admin/users/[id]/page.tsx` | UI 加鎖定狀態 + 解鎖按鈕 | ~50 |
| `apps/web/src/components/users/UnlockAccountButton.tsx`（新建） | 新元件 | ~60 |
| `apps/web/src/messages/{en,zh-TW}.json` | i18n keys | ~15 |
| `apps/web/e2e/security/lockout.spec.ts`（新建） | E2E | ~200 |

### 2.2 Migration 內容

```prisma
// packages/db/prisma/schema.prisma

model User {
  // ... 既有欄位

  // 新增（IAM-07）
  failedLoginAttempts Int       @default(0)
  lockedUntil         DateTime?
  lastFailedLoginAt   DateTime?

  @@index([lockedUntil])  // 用於查詢被鎖帳號
}

// 新增（FEAT-013.4 連帶建立通用 AuditLog 雛形，Phase 2 Obs-01 全面套用）
model AuditLog {
  id            String   @id @default(uuid())
  entityType    String   // "User"
  entityId      String
  action        String   // "ACCOUNT_LOCKED" | "ACCOUNT_UNLOCKED" | "LOGIN_FAILED" | "LOGIN_SUCCESS"
  performedById String?  // 執行操作的人（自動鎖定為系統 → null；Admin 解鎖 → adminId）
  metadata      Json?    // { failedAttempts, ipAddress, userAgent, lockedFor: '15min' }
  timestamp     DateTime @default(now())

  @@index([entityType, entityId])
  @@index([performedById, timestamp])
  @@index([action, timestamp])
}
```

### 2.3 i18n 影響

新增約 12 個 key：

```json
{
  "auth": {
    "errors": {
      "credentialsInvalid": "電子郵件或密碼錯誤",  // 既有，不洩漏鎖定狀態
      "accountTemporarilyUnavailable": "帳號暫時無法登入，請稍後再試或聯絡管理員"
    },
    "lockout": {
      "emailSubject": "您的帳號已被暫時鎖定",
      "emailBody": "因連續登入失敗，您的帳號已被鎖定 15 分鐘..."
    }
  },
  "admin": {
    "users": {
      "lockoutStatus": {
        "locked": "已鎖定（{minutes} 分鐘後自動解除）",
        "unlocked": "正常",
        "neverLocked": "從未鎖定"
      },
      "unlockButton": "立即解鎖",
      "unlockConfirm": "確定要解鎖此帳號嗎？此操作將被記錄。",
      "unlockSuccess": "帳號已解鎖",
      "unlockError": "解鎖失敗：{error}"
    }
  }
}
```

---

## 3. 技術設計

### 3.1 鎖定邏輯（authorize callback）

```typescript
// packages/auth/src/index.ts

import { logAudit } from '@itpm/api/lib/auditLog';
import { sendLockoutNotification } from '@itpm/api/lib/email';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000;  // 15 min

async function authorize(credentials, request) {
  const dbUser = await prisma.user.findUnique({
    where: { email: credentials.email },
  });

  if (!dbUser) {
    // 不洩漏「用戶不存在」vs「密碼錯誤」差異
    await sleep(randomDelay()); // 防 timing attack
    throw new Error('credentialsInvalid');
  }

  // 檢查鎖定狀態
  if (dbUser.lockedUntil && dbUser.lockedUntil > new Date()) {
    // 不洩漏「鎖定」差異，回傳統一錯誤
    throw new Error('credentialsInvalid');
  }

  // 鎖定到期：自動解除
  if (dbUser.lockedUntil && dbUser.lockedUntil <= new Date()) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
    await logAudit({
      entityType: 'User',
      entityId: dbUser.id,
      action: 'ACCOUNT_UNLOCKED',
      performedById: null,  // 系統自動
      metadata: { reason: 'auto_expired' },
    });
  }

  const passwordMatches = await bcrypt.compare(credentials.password, dbUser.password);

  if (!passwordMatches) {
    // 增加失敗計數
    const newAttempts = dbUser.failedLoginAttempts + 1;
    const shouldLock = newAttempts >= MAX_FAILED_ATTEMPTS;
    const ip = getRequestIP(request);

    await prisma.user.update({
      where: { id: dbUser.id },
      data: {
        failedLoginAttempts: newAttempts,
        lastFailedLoginAt: new Date(),
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_DURATION_MS) : null,
      },
    });

    await logAudit({
      entityType: 'User',
      entityId: dbUser.id,
      action: 'LOGIN_FAILED',
      performedById: null,
      metadata: { failedAttempts: newAttempts, ipAddress: ip },
    });

    if (shouldLock) {
      await logAudit({
        entityType: 'User',
        entityId: dbUser.id,
        action: 'ACCOUNT_LOCKED',
        performedById: null,
        metadata: {
          failedAttempts: newAttempts,
          ipAddress: ip,
          lockedFor: '15min',
        },
      });

      // Email 通知（async，不阻擋登入流程）
      sendLockoutNotification({
        email: dbUser.email,
        ipAddress: ip,
        unlockTime: new Date(Date.now() + LOCKOUT_DURATION_MS),
      }).catch(err => console.error('Failed to send lockout notification', err));
    }

    throw new Error('credentialsInvalid');
  }

  // 成功登入：reset counter
  if (dbUser.failedLoginAttempts > 0) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  }

  await logAudit({
    entityType: 'User',
    entityId: dbUser.id,
    action: 'LOGIN_SUCCESS',
    performedById: dbUser.id,
    metadata: { ipAddress: getRequestIP(request) },
  });

  return { id: dbUser.id, email: dbUser.email, role: dbUser.role };
}
```

### 3.2 SSO 成功後自動解除本地鎖定

```typescript
// packages/auth/src/index.ts — Azure AD callback

callbacks: {
  async signIn({ user, account, profile }) {
    if (account?.provider === 'azure-ad') {
      // SSO 成功，解除本地鎖定（如有）
      const dbUser = await prisma.user.findUnique({
        where: { email: user.email! },
      });

      if (dbUser?.lockedUntil) {
        await prisma.user.update({
          where: { id: dbUser.id },
          data: { failedLoginAttempts: 0, lockedUntil: null },
        });

        await logAudit({
          entityType: 'User',
          entityId: dbUser.id,
          action: 'ACCOUNT_UNLOCKED',
          performedById: null,
          metadata: { reason: 'sso_success' },
        });
      }
    }
    return true;
  },
}
```

### 3.3 Admin 解鎖 API

```typescript
// packages/api/src/routers/user.ts

unlockAccount: adminProcedure
  .input(z.object({ userId: z.string().uuid() }))
  .mutation(async ({ ctx, input }) => {
    const user = await ctx.prisma.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND' });
    }

    if (!user.lockedUntil) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Account is not locked',
        cause: { reason: 'NOT_LOCKED' },
      });
    }

    await ctx.prisma.user.update({
      where: { id: input.userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });

    await logAudit({
      entityType: 'User',
      entityId: input.userId,
      action: 'ACCOUNT_UNLOCKED',
      performedById: ctx.session.user.id,
      metadata: { reason: 'admin_manual' },
    });

    return { success: true };
  }),
```

### 3.4 Admin 解鎖 UI

```tsx
// apps/web/src/components/users/UnlockAccountButton.tsx

'use client';

import { useTranslations } from 'next-intl';
import { LoadingButton } from '@/components/ui/loading/LoadingButton';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/trpc';

export function UnlockAccountButton({ userId, lockedUntil }: {
  userId: string;
  lockedUntil: Date | null;
}) {
  const t = useTranslations('admin.users');
  const { toast } = useToast();
  const utils = api.useContext();

  const mutation = api.user.unlockAccount.useMutation({
    onSuccess: () => {
      toast({ title: t('unlockSuccess'), variant: 'success' });
      utils.user.getById.invalidate({ id: userId });
    },
    onError: (err) => {
      toast({
        title: t('unlockError', { error: err.message }),
        variant: 'destructive',
      });
    },
  });

  if (!lockedUntil || lockedUntil < new Date()) return null;

  const minutes = Math.ceil((lockedUntil.getTime() - Date.now()) / 60_000);

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-red-600">
        {t('lockoutStatus.locked', { minutes })}
      </span>
      <LoadingButton
        variant="outline"
        size="sm"
        isLoading={mutation.isLoading}
        onClick={() => {
          if (confirm(t('unlockConfirm'))) {
            mutation.mutate({ userId });
          }
        }}
      >
        {t('unlockButton')}
      </LoadingButton>
    </div>
  );
}
```

### 3.5 Email 通知

```typescript
// packages/api/src/lib/email.ts

export async function sendLockoutNotification({
  email, ipAddress, unlockTime
}: {
  email: string;
  ipAddress: string;
  unlockTime: Date;
}) {
  await sendEmail({
    to: email,
    subject: '您的帳號已被暫時鎖定',
    html: `
      <p>您好，</p>
      <p>因連續登入失敗，您的帳號已被暫時鎖定。</p>
      <ul>
        <li>嘗試 IP：${ipAddress}</li>
        <li>解鎖時間：${unlockTime.toLocaleString('zh-TW')}</li>
      </ul>
      <p>若這不是您本人操作，建議：</p>
      <ol>
        <li>透過 Azure SSO 登入（會自動解除鎖定）</li>
        <li>聯絡管理員手動解鎖</li>
        <li>修改密碼（解鎖後）</li>
      </ol>
    `,
  });
}
```

---

## 4. 實作步驟

### Step 1: Schema migration（0.5d）

```bash
# 修改 schema.prisma 加 User 欄位 + AuditLog model
# 建立 migration
pnpm db:migrate

# 確認 Prisma Client 重生
pnpm db:generate
```

### Step 2: AuditLog helper（0.25d）

`packages/api/src/lib/auditLog.ts` 提供 `logAudit()`，**簡化版**（Phase 2 Obs-01 再擴充）。

### Step 3: 認證流程改造（1d）

依 §3.1 / §3.2 修改 `packages/auth/src/index.ts`：
- authorize callback 加鎖定邏輯
- signIn callback 加 SSO 自動解除

加 unit test 涵蓋：
- 第 1-4 次失敗：counter 增加，未鎖定
- 第 5 次失敗：counter = 5，lockedUntil 設定，AuditLog 記錄
- 鎖定期間正確密碼：仍回失敗
- 鎖定期過後正確密碼：自動解除 + 成功登入
- SSO 成功 → 本地鎖定自動解除

### Step 4: Admin 解鎖 procedure（0.25d）

依 §3.3 加 `user.unlockAccount`。

### Step 5: Admin UI（0.5d）

依 §3.4 建立 `UnlockAccountButton.tsx`，整合到 `/admin/users/[id]`。

新增 i18n keys（12 個，兩個 locale）。

執行 `pnpm validate:i18n` 驗證。

### Step 6: Email 通知（0.25d）

依 §3.5 加 `sendLockoutNotification`。

開發環境用 Mailhog 確認 email 內容。

### Step 7: E2E 測試（0.25d）

`apps/web/e2e/security/lockout.spec.ts`：
1. 連續錯誤 5 次後，第 5 次顯示統一錯誤訊息（不洩漏鎖定狀態）
2. 等待 15 分鐘後（test 中模擬時間 / 直接 update DB）→ 可正常登入
3. 鎖定期間 Admin 從 `/admin/users/[id]` 解鎖 → 用戶可立即登入
4. SSO 登入成功後本地鎖定自動解除
5. AuditLog 含對應記錄

---

## 5. 驗收標準（DoD）

- [ ] User schema 加 3 個欄位（failedLoginAttempts、lockedUntil、lastFailedLoginAt）
- [ ] AuditLog model 建立（雛形）
- [ ] Migration 執行成功
- [ ] authorize callback 含鎖定邏輯
- [ ] SSO signIn callback 自動解除本地鎖定
- [ ] `user.unlockAccount` adminProcedure 完成
- [ ] `/admin/users/[id]` 顯示鎖定狀態 + 解鎖按鈕
- [ ] Email 通知功能（dev 環境 Mailhog 可見）
- [ ] i18n keys 兩個 locale 同步（`pnpm validate:i18n` 通過）
- [ ] 所有解鎖 / 鎖定事件記錄 AuditLog
- [ ] 5 個 E2E 場景通過
- [ ] FEAT-013 主矩陣 IAM-07 等級從 L0 → L3

---

## 6. 驗證計畫

### 6.1 單元測試

```bash
pnpm test --filter=auth packages/auth/__tests__/lockout.test.ts
```

### 6.2 整合測試

```bash
# 模擬連續失敗
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/callback/credentials \
    -d "email=test@itpm.local&password=wrongpassword"
done

# 預期前 5 次回 'credentialsInvalid'，第 6 次仍回相同訊息（但 DB 已 lockedUntil = now+15min）
```

### 6.3 Negative testing

- [ ] 鎖定期間連對的密碼也失敗
- [ ] 解鎖後馬上登入成功
- [ ] SSO 登入後本地鎖定狀態消失
- [ ] Admin 不可解鎖自己的帳號（防止自我恢復繞過）— 待確認業務需求

---

## 7. 風險與取捨

| 風險 | 緩解 |
|------|------|
| 5 次失敗門檻太低，正常用戶誤觸 | 文件化；若實際抱怨多再調整為 10 次 |
| 鎖定通知 email 失敗導致用戶不知情 | Email 為輔助，不阻擋鎖定邏輯；Admin 介面可看 |
| AuditLog 寫入失敗影響登入流程 | 用 try-catch 包覆，log 失敗不影響登入 |
| Migration 期間既有用戶 failedLoginAttempts 預設 0 是否合適 | 是（從 0 開始計數即可） |
| Admin 不小心解鎖惡意嘗試的帳號 | 加 confirm dialog；AuditLog 完整記錄供事後追查 |

---

## 8. 後續延伸（不在本 sub-feature 範圍）

- Slow brute force 偵測（30 min 內 30 次跨帳號嘗試）→ Phase 2 Obs-09
- Captcha 整合（嘗試 3 次後加 Captcha）→ 評估後決定
- 失敗計數依 IP + email 雙因子 → Phase 2

---

**Last Updated**: 2026-04-28
**Owner**: 待指派
**Reviewer**: Security Lead
