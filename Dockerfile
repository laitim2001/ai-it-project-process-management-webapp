# Multi-stage Dockerfile for IT Project Management Platform
# Optimized for production deployment with Next.js standalone output

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.3 --activate

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/api/package.json ./packages/api/
COPY packages/auth/package.json ./packages/auth/
COPY packages/db/package.json ./packages/db/
COPY packages/tsconfig/package.json ./packages/tsconfig/

# Install dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile --prod=false

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@8.15.3 --activate

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps ./apps
COPY --from=deps /app/packages ./packages

# Copy source code
COPY . .

# Copy Prisma schema first
COPY packages/db/prisma ./packages/db/prisma

# Generate Prisma Client - must be done before build
# Use npx directly since pnpm filter with command doesn't work correctly in Docker
RUN cd packages/db && npx prisma generate --schema=./prisma/schema.prisma

# Build the application
# Next.js collects anonymous telemetry data, disable it
ENV NEXT_TELEMETRY_DISABLED=1

# Skip static page generation that requires database connection
ENV SKIP_ENV_VALIDATION=1
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"

RUN pnpm build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Tell Prisma to use the OpenSSL 3.0 compatible engine
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-linux-musl-openssl-3.0.x.so.node

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set permissions for prerender cache
RUN mkdir -p apps/web/.next
RUN mkdir -p apps/web/public
RUN chown nextjs:nodejs apps/web/.next

# Copy built application - public folder may not exist if empty
COPY --from=builder /app/apps/web/public* ./apps/web/

# Automatically leverage Next.js standalone output
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Copy Prisma schema and migrations
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/prisma ./packages/db/prisma

# Copy Prisma generated client from pnpm store (where prisma generate outputs)
# The generated client is at: node_modules/.pnpm/@prisma+client@*/node_modules/.prisma
RUN mkdir -p node_modules/.prisma node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/.prisma ./node_modules/.prisma
# Copy @prisma/client package (the client runtime)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+client@5.22.0_prisma@5.22.0/node_modules/@prisma/client ./node_modules/@prisma/client
# Copy engine files
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+engines@5.22.0/node_modules/@prisma/engines ./node_modules/@prisma/engines

# Copy Prisma CLI and all dependencies for migration (required for `prisma migrate deploy`)
# Create node_modules structure for Prisma CLI
RUN mkdir -p packages/db/node_modules/@prisma

# Copy Prisma CLI
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/prisma@5.22.0/node_modules/prisma ./packages/db/node_modules/prisma

# Copy Prisma CLI dependencies (all required @prisma/* packages)
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+engines@5.22.0/node_modules/@prisma/engines ./packages/db/node_modules/@prisma/engines
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+debug@5.22.0/node_modules/@prisma/debug ./packages/db/node_modules/@prisma/debug
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+get-platform@5.22.0/node_modules/@prisma/get-platform ./packages/db/node_modules/@prisma/get-platform
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.pnpm/@prisma+fetch-engine@5.22.0/node_modules/@prisma/fetch-engine ./packages/db/node_modules/@prisma/fetch-engine
COPY --from=builder --chown=nextjs:nodejs "/app/node_modules/.pnpm/@prisma+engines-version@5.22.0-44.605197351a3c8bdd595af2d2a9bc3025bca48ea2/node_modules/@prisma/engines-version" ./packages/db/node_modules/@prisma/engines-version

# Copy startup script
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start with entrypoint script (runs migrations then starts app)
ENTRYPOINT ["./docker-entrypoint.sh"]
