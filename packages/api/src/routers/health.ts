/**
 * @fileoverview Health Router - 健康檢查 API
 *
 * @description
 * 提供系統健康檢查端點，用於監控 API 服務和資料庫連線狀態。
 * 所有端點使用 publicProcedure，無需身份驗證，方便外部監控系統調用。
 * 適用於容器編排（Docker/Kubernetes）的 liveness 和 readiness 探針。
 *
 * @module api/routers/health
 *
 * @features
 * - 基礎 Ping 端點（驗證 API 服務運行）
 * - 資料庫連線檢查（驗證 Prisma 連線狀態）
 * - Echo 端點（用於測試請求-回應流程）
 * - 返回時間戳（用於監控系統時間同步）
 *
 * @procedures
 * - ping: 簡單的 pong 回應
 * - dbCheck: 資料庫連線健康檢查
 * - echo: 回顯測試端點
 *
 * @dependencies
 * - Prisma Client: 資料庫連線測試
 * - Zod: 輸入驗證
 * - tRPC: API 框架
 *
 * @related
 * - packages/api/src/trpc.ts - tRPC 配置和中介軟體
 * - docker-compose.yml - 容器健康檢查配置
 *
 * @author IT Department
 * @since Epic 1 - Platform Foundation
 * @lastModified 2025-11-14
 */

import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

export const healthRouter = createTRPCRouter({
  /**
   * Simple ping endpoint
   */
  ping: publicProcedure.query(() => {
    return { message: 'pong', timestamp: new Date().toISOString() };
  }),

  /**
   * Database connection check
   */
  dbCheck: publicProcedure.query(async ({ ctx }) => {
    try {
      await ctx.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }),

  /**
   * Echo endpoint for testing
   */
  echo: publicProcedure
    .input(z.object({ message: z.string() }))
    .query(({ input }) => {
      return { echo: input.message, timestamp: new Date().toISOString() };
    }),
});
