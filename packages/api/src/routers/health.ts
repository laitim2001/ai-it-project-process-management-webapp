import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';

/**
 * Health check router
 * Provides basic health check endpoints to verify the API is running
 */
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
