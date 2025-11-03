import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  // 支援的語言列表
  locales: ['en', 'zh-TW'],

  // 默認語言為繁體中文
  defaultLocale: 'zh-TW',

  // URL 語言前綴策略：
  // - 'always': 所有語言都顯示前綴
  //   例如: /zh-TW/projects (繁中), /en/projects (英文)
  //   根路徑 / 會自動重定向到 /zh-TW
  localePrefix: 'always'
});

// 創建類型安全的導航輔助函數
// 使用這些函數可以確保語言路由正確
export const {Link, redirect, usePathname, useRouter, getPathname} = createNavigation(routing);
