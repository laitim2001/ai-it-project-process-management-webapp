/**
 * @fileoverview Next.js Instrumentation Hook
 *
 * @description
 * 此檔案在 Next.js 應用啟動時執行一次。
 * 用於執行初始化邏輯，如資料庫 seed 檢查。
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * @author IT Department
 * @since 2025-11-25
 */

export async function register() {
  // 只在伺服器端執行
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 [INSTRUMENTATION] Next.js 應用程式啟動...');

    // 動態導入以避免客戶端打包問題
    const { initializeDatabase } = await import('./src/lib/db-init');

    // 執行資料庫初始化檢查
    await initializeDatabase();

    console.log('✅ [INSTRUMENTATION] 初始化完成');
  }
}
