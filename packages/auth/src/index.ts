/**
 * @fileoverview NextAuth.js TypeScript Type Augmentations
 *
 * @description
 * This package exists SOLELY to provide TypeScript module augmentations
 * for NextAuth.js types. It adds `role` to the Session type, and `role` +
 * `roleId` to the JWT / User types, used throughout the application.
 * (Session deliberately has no top-level `roleId` — see the note below.)
 *
 * IMPORTANT: This file contains NO runtime code. The actual NextAuth
 * configuration lives in apps/web/src/auth.ts (NextAuth v5).
 *
 * This package is imported as a side-effect in packages/api/src/trpc.ts:
 *   import '@itpm/auth';
 * This ensures the type augmentations are loaded when the API package
 * compiles, allowing ctx.session.user.role.name etc. to type-check.
 *
 * @module packages/auth
 *
 * @history
 * - Originally contained a full NextAuth v4-style runtime configuration
 *   (authOptions, providers, bcrypt password utils, etc.)
 * - That runtime config was superseded by apps/web/src/auth.ts (NextAuth v5)
 *   during the v4-to-v5 migration
 * - FIX-136 (2026-04-09): Stripped all dead runtime code, keeping only
 *   the type augmentations that packages/api depends on
 *
 * @related
 * - apps/web/src/auth.ts - The ACTUAL NextAuth v5 configuration (runtime)
 * - apps/web/src/auth.config.ts - Edge-compatible config for middleware
 * - packages/api/src/trpc.ts - Side-effect import of this package for types
 *
 * @author IT Department
 * @since Epic 1 - Azure AD B2C Authentication
 * @lastModified 2026-04-09 (FIX-136: removed dead runtime code)
 */

// ============================================================
// NextAuth.js Module Augmentations (Type-Only)
// ============================================================

// 這兩個 type-only import 有兩個作用：
// 1. 讓本檔成為 ES module，使下方 `declare module` 被視為「模組擴充（合併）」
//    而非「環境模組宣告（整個取代）」—— 否則會抹掉 next-auth 的 NextAuthConfig
//    等真實匯出、讓 `NextAuth()` 變成 not callable。
// 2. 將被擴充的模組載入編譯 program，使 `declare module` 能解析到目標模組
//    （augmentation 目標必須存在於 program 中，否則 TS2664）。
import type { DefaultSession } from 'next-auth';
import type { JWT } from '@auth/core/jwt';

// 避免 noUnusedLocals 環境下的未使用警告（同時明示意圖）。
export type _NextAuthAugmentationAnchors = [DefaultSession, JWT];

/**
 * Augment NextAuth Session and User types with custom fields.
 *
 * These augmentations are required by packages/api for RBAC:
 * - ctx.session.user.role.name (supervisorProcedure, adminProcedure)
 * - ctx.session.user.role.id (permission router, budgetProposal router)
 *
 * NOTE: Session.user intentionally does NOT expose a top-level `roleId`.
 * The session callback (apps/web/src/auth.ts) only populates `role: {id, name}`,
 * so a declared `session.user.roleId` would always be `undefined` at runtime —
 * a silent footgun (TypeScript would accept the read but the value is missing).
 * Always read the role id via `session.user.role.id` instead.
 * `roleId` still exists on the JWT / User types below because those layers do
 * carry it (the jwt callback sets `token.roleId` from the DB user).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      role: {
        id: number;
        name: string;
      };
    };
  }

  interface User {
    id: string;
    email: string;
    name: string | null;
    roleId?: number;
    role?: {
      id: number;
      name: string;
    };
  }
}

/**
 * Augment NextAuth JWT type with custom fields.
 *
 * These fields are populated in the jwt callback (apps/web/src/auth.ts)
 * and read back in the session callback to build the Session object.
 */
// JWT 介面實際宣告於 @auth/core/jwt（next-auth/jwt 僅 `export *` 轉出），
// 且 next-auth 的 jwt/session callback 之 token 型別取自 @auth/core/jwt 的 JWT。
// 因此必須擴充 @auth/core/jwt 本身，擴充 next-auth/jwt 無法影響 callback token 型別。
declare module '@auth/core/jwt' {
  interface JWT {
    id: string;
    email: string;
    name: string | null;
    roleId: number;
    role: {
      id: number;
      name: string;
    };
  }
}
