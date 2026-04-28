---
sub_feature: FEAT-013.3
check_id: AppSec-09
nature: FEAT（新增）
status: 📋 Planned
estimated_days: 3
dependencies: 無（可立即啟動）
---

# FEAT-013.3 — AppSec-09 Rate Limiting (In-Memory)

> **Check ID**: AppSec-09（API Rate Limiting） + Resi-01（Rate Limiting 多實例 — 暫不做）
> **企業級基準**: 全域 + 端點級
> **目前評估**: L0 → 目標 L2（in-memory 版本）→ 未來 L3（多實例 Redis 版本）
> **對應既有發現**: SEC-003、SEC-016
> **重要**: 依 Phase 0 結論，**不採用 Redis**，使用 in-memory 版本（單實例足夠）

---

## 1. 背景與目標

### 1.1 問題現況

整個應用沒有任何速率限制（grep 0 結果）。攻擊者可：
- 暴力破解登入密碼
- 大量呼叫 API 造成 DoS
- 批量上傳檔案消耗儲存
- 帳號 / email 枚舉

`.env.example:172-174` 雖定義 `RATE_LIMIT_*` 變數但代碼從未使用。

### 1.2 目標

- **全域 rate limit**：100 req/min/IP（偽裝下限）
- **敏感端點嚴格限制**：登入 / 註冊 / 上傳 / seed
- **超限回 429** + `Retry-After` header
- **觸發紀錄**：寫入 logger（Phase 2 改記錄到 AuditLog）
- **In-memory 實作**：單實例足夠（Azure App Service 預設單實例）

### 1.3 不在範圍

- Redis / Upstash 多實例同步 → 暫緩，待擴展時再升級
- AuditLog 整合 → 屬 Phase 2 Obs-01
- WAF / DDoS 雲服務 → Phase 2-3 視需要

---

## 2. 影響範圍

### 2.1 受影響檔案

| 檔案 | 變更類型 | 行數估 |
|------|---------|--------|
| `packages/api/src/lib/rateLimit.ts`（新建） | 新增 | ~150 |
| `apps/web/src/middleware.ts` | 加全域 rate limit | ~30 |
| `packages/api/src/trpc.ts` | 加 tRPC middleware | ~20 |
| `apps/web/src/app/api/auth/register/route.ts` | 套用嚴格限制 | ~5 |
| `apps/web/src/app/api/upload/*/route.ts`（3 處） | 套用上傳限制 | ~15 |
| `apps/web/src/app/api/admin/seed/route.ts` | 套用嚴格限制 | ~5 |
| `apps/web/src/components/ui/RateLimitError.tsx`（新建） | 新增錯誤元件 | ~40 |
| `apps/web/src/messages/{en,zh-TW}.json` | i18n keys | ~10 |
| `apps/web/e2e/security/rate-limit.spec.ts`（新建） | E2E | ~150 |

### 2.2 不需 Migration

無 schema 變更（in-memory 版本）。

> **未來 Phase 2 升級為 Redis 時**：可選擇加 `RateLimitMetric` model 持久化觸發歷史。

### 2.3 i18n 影響

新增約 5 個 key：
- `errors.rateLimitExceeded.title`
- `errors.rateLimitExceeded.description`
- `errors.rateLimitExceeded.retryAfter`
- `errors.rateLimitExceeded.contactSupport`
- `errors.tooManyAttempts`

---

## 3. 技術設計

### 3.1 In-Memory Rate Limiter 實作

採用 **Token Bucket** 演算法（簡單、效能好、容忍 burst）：

```typescript
// packages/api/src/lib/rateLimit.ts

type Bucket = {
  tokens: number;
  lastRefill: number;
};

type RateLimitConfig = {
  capacity: number;     // 桶容量（最大 burst）
  refillRate: number;   // 每秒補充 tokens
  windowMs: number;     // 計算窗口（給觀察者用）
};

class InMemoryRateLimiter {
  private buckets = new Map<string, Bucket>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(private config: RateLimitConfig) {
    // 每 5 分鐘清理閒置 bucket
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  check(key: string): { allowed: boolean; retryAfterMs?: number; remaining: number } {
    const now = Date.now();
    let bucket = this.buckets.get(key);

    if (!bucket) {
      bucket = { tokens: this.config.capacity, lastRefill: now };
      this.buckets.set(key, bucket);
    }

    // 補充 tokens
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(
      this.config.capacity,
      bucket.tokens + elapsed * this.config.refillRate
    );
    bucket.lastRefill = now;

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return { allowed: true, remaining: Math.floor(bucket.tokens) };
    }

    const retryAfterMs = Math.ceil((1 - bucket.tokens) / this.config.refillRate * 1000);
    return { allowed: false, retryAfterMs, remaining: 0 };
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, bucket] of this.buckets.entries()) {
      if (now - bucket.lastRefill > 30 * 60 * 1000) {
        this.buckets.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.buckets.clear();
  }
}

// 預定義 limiter 實例
export const globalLimiter = new InMemoryRateLimiter({
  capacity: 100,    // 100 req burst
  refillRate: 100 / 60,  // 100/min
  windowMs: 60_000,
});

export const authLimiter = new InMemoryRateLimiter({
  capacity: 10,
  refillRate: 10 / 60,
  windowMs: 60_000,
});

export const registerLimiter = new InMemoryRateLimiter({
  capacity: 5,
  refillRate: 5 / 60,
  windowMs: 60_000,
});

export const uploadLimiter = new InMemoryRateLimiter({
  capacity: 20,
  refillRate: 20 / 60,
  windowMs: 60_000,
});
```

### 3.2 Next.js Middleware 整合（全域）

```typescript
// apps/web/src/middleware.ts

import { NextResponse } from 'next/server';
import { globalLimiter } from '@itpm/api/lib/rateLimit';

export function middleware(request: NextRequest) {
  // 取得真實 IP（Azure App Service 後）
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';

  // 健康檢查 / 靜態資源跳過
  if (request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname === '/api/health') {
    return NextResponse.next();
  }

  const result = globalLimiter.check(`global:${ip}`);
  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests', retryAfterMs: result.retryAfterMs },
      {
        status: 429,
        headers: {
          'Retry-After': Math.ceil(result.retryAfterMs! / 1000).toString(),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

### 3.3 tRPC Middleware

```typescript
// packages/api/src/trpc.ts

const rateLimitMiddleware = t.middleware(async ({ ctx, next, type, path }) => {
  const userId = ctx.session?.user?.id ?? `ip:${ctx.req.ip}`;

  // mutation 50/min/user, query 200/min/user
  const limiter = type === 'mutation'
    ? mutationLimiter
    : queryLimiter;

  const result = limiter.check(`trpc:${path}:${userId}`);
  if (!result.allowed) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Rate limit exceeded',
      cause: { retryAfterMs: result.retryAfterMs },
    });
  }

  return next();
});

export const protectedProcedure = t.procedure
  .use(authMiddleware)
  .use(rateLimitMiddleware);  // 加在 auth 之後
```

### 3.4 敏感端點套用

```typescript
// apps/web/src/app/api/auth/register/route.ts

import { registerLimiter } from '@itpm/api/lib/rateLimit';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? 'unknown';
  const result = registerLimiter.check(`register:${ip}`);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many registration attempts. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': Math.ceil(result.retryAfterMs! / 1000).toString() },
      }
    );
  }

  // ... 原有邏輯
}
```

### 3.5 前端錯誤處理

```typescript
// apps/web/src/components/ui/RateLimitError.tsx

import { useTranslations } from 'next-intl';

export function RateLimitError({ retryAfterSec }: { retryAfterSec: number }) {
  const t = useTranslations('errors.rateLimitExceeded');
  const minutes = Math.ceil(retryAfterSec / 60);

  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <h3 className="text-sm font-medium text-yellow-800">{t('title')}</h3>
      <p className="mt-2 text-sm text-yellow-700">
        {t('description')}
      </p>
      <p className="mt-1 text-sm text-yellow-600">
        {t('retryAfter', { minutes })}
      </p>
    </div>
  );
}
```

tRPC error handler 偵測 `TOO_MANY_REQUESTS`：

```typescript
// apps/web/src/lib/trpc.ts
onError: (error) => {
  if (error.data?.code === 'TOO_MANY_REQUESTS') {
    const retryMs = (error.data.cause as any)?.retryAfterMs ?? 60000;
    toast({
      title: t('errors.rateLimitExceeded.title'),
      description: t('errors.rateLimitExceeded.retryAfter', {
        minutes: Math.ceil(retryMs / 60000)
      }),
      variant: 'destructive',
    });
  }
}
```

---

## 4. 實作步驟

### Step 1: 建立 limiter library（1d）

依 §3.1 實作 `packages/api/src/lib/rateLimit.ts` + 單元測試：

```typescript
// packages/api/src/lib/__tests__/rateLimit.test.ts

describe('InMemoryRateLimiter', () => {
  it('allows requests within capacity', () => { ... });
  it('blocks when capacity exceeded', () => { ... });
  it('refills tokens over time', () => { ... });
  it('cleans up idle buckets', () => { ... });
});
```

### Step 2: 整合 Next.js Middleware（0.5d）

依 §3.2 修改 `apps/web/src/middleware.ts`。

注意：Next.js middleware 在 Edge Runtime，需確認 in-memory state 是否跨請求保留（Edge Runtime 不保證）。**若在 Edge Runtime 不可用，改在 Node.js handler 層套用**。

驗證方式：
```bash
# 連續 curl 110 次，預期前 100 次 200，後 10 次 429
for i in {1..110}; do curl -o /dev/null -s -w "%{http_code}\n" http://localhost:3000/; done | sort | uniq -c
```

### Step 3: tRPC middleware（0.5d）

依 §3.3 在 `packages/api/src/trpc.ts` 加 rateLimitMiddleware。

驗證：
```bash
pnpm test --filter=api
```

### Step 4: 套用敏感端點（0.5d）

依 §3.4 套用到：
- `/api/auth/register`
- `/api/auth/[...nextauth]`（透過 NextAuth callback）
- `/api/upload/quote`、`/api/upload/invoice`、`/api/upload/proposal`
- `/api/admin/seed`

### Step 5: 前端錯誤元件 + i18n（0.25d）

依 §3.5 建立 `RateLimitError.tsx` + i18n keys + tRPC error handler。

### Step 6: E2E 測試（0.25d）

`apps/web/e2e/security/rate-limit.spec.ts`：
- 連續登入失敗 11 次 → 第 11 次 429
- 連續註冊 6 次 → 第 6 次 429
- 全域 110 次 → 第 101 次起 429

---

## 5. 驗收標準（DoD）

- [ ] `packages/api/src/lib/rateLimit.ts` 完成 + 單元測試通過
- [ ] Next.js middleware 套用全域 100 req/min/IP
- [ ] tRPC middleware 套用 mutation 50/min, query 200/min
- [ ] 4 個敏感端點套用嚴格限制
- [ ] 超限回 429 + `Retry-After` header
- [ ] 前端 `RateLimitError` 元件可顯示
- [ ] i18n keys 兩個 locale 同步
- [ ] E2E 測試通過
- [ ] 文件化「**單實例限制**」於 `docs/security-and-governance/governance/rate-limiting-policy.md`
- [ ] FEAT-013 主矩陣 AppSec-09 等級從 L0 → L2

---

## 6. 驗證計畫

### 6.1 單元測試

```bash
pnpm test --filter=api packages/api/src/lib/__tests__/rateLimit.test.ts
```

### 6.2 整合測試

```bash
# 全域限制
for i in {1..110}; do
  curl -s -o /dev/null -w "%{http_code} " http://localhost:3000/api/trpc/health.ping
done

# 預期：前 100 個 200，後 10 個 429
```

### 6.3 Negative testing

- [ ] 模擬暴力破解登入（11 次連續錯誤密碼）→ 第 11 次回 429
- [ ] 並發註冊（同 IP 6 次）→ 第 6 次回 429
- [ ] 上傳檔案 21 次 → 第 21 次回 429
- [ ] 等待 retry-after 時間後 → 應允許新請求

---

## 7. 風險與取捨

| 風險 | 緩解 |
|------|------|
| In-memory 在 App Service 重啟時 reset → 短暫窗口允許暴力破解 | 接受（單實例 + 重啟頻率低）；文件化此限制 |
| 多實例擴展時 in-memory 不一致 | 文件明確標示「單實例限制」；擴展時升級為 Redis（Phase 2 視需要） |
| Next.js Edge Runtime 可能不支援共享 in-memory state | Step 2 先測試；不支援則改為 Node.js handler 層 |
| 合法用戶因網路重試被誤擋 | 100/min 設定保守寬鬆；錯誤訊息提供「Retry-After」秒數 |
| Cleanup 邏輯延遲 → 記憶體緩慢成長 | 5 分鐘清理 + 30 分鐘 idle threshold；CI 加記憶體 leak 測試 |

---

## 8. 後續延伸（不在本 sub-feature 範圍）

- Redis / Upstash 多實例版本（Phase 2 視擴展需求）
- 觸發紀錄寫入 AuditLog（Phase 2 Obs-01）
- 動態調整 limit（依用戶角色 / 信任分數）
- 整合 WAF（Phase 3 Resi-02）

---

**Last Updated**: 2026-04-28
**Owner**: 待指派
**Reviewer**: Security Lead
