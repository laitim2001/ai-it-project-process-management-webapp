# ============================================================================
# IT Project Process Management Platform - Production Dockerfile
# ============================================================================
# Multi-stage build for optimized production image
# Node.js 20 + pnpm + Turborepo + Next.js 14
#
# Build context: monorepo root
# Target: apps/web (Next.js application)
#
# Usage:
#   docker build -t itpm-web:latest -f docker/Dockerfile .
#   docker run -p 3000:3000 --env-file .env.production itpm-web:latest
# ============================================================================

# ----------------------------------------------------------------------------
# Stage 1: Base - Setup Node.js and pnpm
# ----------------------------------------------------------------------------
# Use Alpine 3.17 which includes OpenSSL 1.1.x (required by Prisma)
# Alpine 3.19+ uses OpenSSL 3.x which is incompatible with Prisma engines
FROM node:20-alpine3.17 AS base

# Install dependencies for native modules
RUN apk add --no-cache libc6-compat

# Enable Corepack for pnpm
RUN corepack enable && corepack prepare pnpm@8.15.3 --activate

WORKDIR /app

# ----------------------------------------------------------------------------
# Stage 2: Dependencies - Install all dependencies
# ----------------------------------------------------------------------------
FROM base AS deps

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# ----------------------------------------------------------------------------
# Stage 3: Builder - Build the application
# ----------------------------------------------------------------------------
FROM base AS builder

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/api/node_modules ./packages/api/node_modules
COPY --from=deps /app/packages/auth/node_modules ./packages/auth/node_modules
COPY --from=deps /app/packages/db/node_modules ./packages/db/node_modules

# Copy source code
COPY . .

# Generate Prisma Client (skip SSL verification for corporate proxy)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0
RUN cd packages/db && pnpm prisma generate
ENV NODE_TLS_REJECT_UNAUTHORIZED=1

# Build the application
# This will build @itpm/db, @itpm/api, @itpm/auth, and @itpm/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Skip SSL verification for Google Fonts during build (corporate proxy)
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

RUN pnpm build --filter=@itpm/web

# Reset SSL verification after build
ENV NODE_TLS_REJECT_UNAUTHORIZED=1

# ----------------------------------------------------------------------------
# Stage 4: Runner - Production runtime
# ----------------------------------------------------------------------------
FROM base AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy necessary files from builder
# Next.js standalone output (includes most dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# ============================================================================
# Prisma Client - Runtime Regeneration Approach (Simplified)
# ============================================================================
# Issue: Hardcoded version paths in COPY commands were fragile and caused
# MODULE_NOT_FOUND errors when Prisma Client wasn't successfully copied.
#
# Solution: Copy all pnpm dependencies from deps stage and regenerate Prisma
# Client in runtime. This ensures all Prisma dependencies are available.
#
# Trade-offs:
# - ✅ 100% reliability (all Prisma dependencies guaranteed)
# - ⚠️ +80MB image size (includes pnpm store)
# - ⚠️ +5s startup time (one-time Prisma generation)
# ============================================================================

# Copy Prisma schema and package.json (required for generation)
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/package.json ./packages/db/package.json

# Copy complete pnpm node_modules from deps stage (includes all Prisma packages)
# This ensures we have prisma CLI and all related packages
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/.pnpm ./node_modules/.pnpm

# Temporarily switch to root to run Prisma generate (requires write permissions)
USER root

# Regenerate Prisma Client in runtime environment using direct path
# Directly call prisma from pnpm virtual store to use exact version 5.22.0
# This avoids npx which tries to install latest prisma@7.x
# Creates both:
# - node_modules/@prisma/client/ (the package)
# - node_modules/.prisma/client/ (the generated client)
RUN cd /app && \
    node node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js generate --schema=packages/db/prisma/schema.prisma && \
    echo "✅ Prisma Client 已在 runtime 成功生成"

# Verify that @prisma/client can be successfully loaded by Node.js
# This will fail the build if Prisma Client is not properly installed
RUN node -e "try { require('@prisma/client'); console.log('✅ @prisma/client 模組載入成功'); } catch(e) { console.error('❌ 載入失敗:', e.message); process.exit(1); }"

# Ensure nextjs user has permissions for generated Prisma files
RUN chown -R nextjs:nodejs /app/node_modules 2>/dev/null || true

# Copy startup script that runs migrations before starting the app
COPY --chown=nextjs:nodejs docker/startup.sh /app/startup.sh
RUN chmod +x /app/startup.sh

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application using the startup script
# This script runs: 1) prisma migrate deploy, 2) starts Next.js
CMD ["/app/startup.sh"]
