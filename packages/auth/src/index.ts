/**
 * @fileoverview NextAuth.js TypeScript Type Augmentations
 *
 * @description
 * This package exists SOLELY to provide TypeScript module augmentations
 * for NextAuth.js types. It adds custom fields (role, roleId) to the
 * Session and JWT types used throughout the application.
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

/**
 * Augment NextAuth Session and User types with custom fields.
 *
 * These augmentations are required by packages/api for RBAC:
 * - ctx.session.user.role.name (supervisorProcedure, adminProcedure)
 * - ctx.session.user.role.id (permission router)
 * - ctx.session.user.roleId (CHANGE-014)
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string | null;
      roleId: number; // CHANGE-014: roleId for direct access
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
declare module 'next-auth/jwt' {
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
