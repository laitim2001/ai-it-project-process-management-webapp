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
FROM node:20-alpine AS base

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

# Generate Prisma Client
RUN cd packages/db && pnpm prisma generate

# Build the application
# This will build @itpm/db, @itpm/api, @itpm/auth, and @itpm/web
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build --filter=@itpm/web

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
# Next.js standalone output (already includes all required node_modules and Prisma Client)
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

# Copy Prisma schema files (required for runtime migrations and introspection)
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "apps/web/server.js"]
