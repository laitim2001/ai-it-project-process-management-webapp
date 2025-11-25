// Re-export types from @prisma/client for TypeScript compatibility
export * from '@prisma/client';
export type { Prisma, PrismaClient } from '@prisma/client';

// Lazy-loaded PrismaClient to avoid build-time initialization errors
// The client is only instantiated when getPrisma() or prisma is first accessed
let _prisma: InstanceType<typeof import('@prisma/client').PrismaClient> | null =
  null;

const globalForPrisma = globalThis as unknown as {
  prisma:
    | InstanceType<typeof import('@prisma/client').PrismaClient>
    | undefined;
};

/**
 * Get the PrismaClient instance with lazy initialization.
 * This prevents Prisma from initializing during Next.js build time.
 */
export function getPrisma(): InstanceType<
  typeof import('@prisma/client').PrismaClient
> {
  if (_prisma) return _prisma;
  if (globalForPrisma.prisma) {
    _prisma = globalForPrisma.prisma;
    return _prisma;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PrismaClient } =
    require('@prisma/client') as typeof import('@prisma/client');

  _prisma = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _prisma;
  }

  return _prisma;
}

// For backwards compatibility - creates a proxy that lazily initializes
// This allows existing code using `prisma.user.findMany()` to work unchanged
export const prisma = new Proxy(
  {} as InstanceType<typeof import('@prisma/client').PrismaClient>,
  {
    get(_target, prop) {
      return getPrisma()[prop as keyof ReturnType<typeof getPrisma>];
    },
  }
);
