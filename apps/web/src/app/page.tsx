/**
 * Root Page - 重定向到默認語言
 *
 * 當用戶訪問根路徑 `/` 時，自動重定向到默認語言 `/zh-TW`
 */

import { redirect } from 'next/navigation';

export default function RootPage() {
  // 重定向到繁體中文版本
  redirect('/zh-TW');
}
