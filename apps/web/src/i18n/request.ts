import {getRequestConfig} from 'next-intl/server';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  // 從請求中獲取語言設置 - FIX-061: Force recompile
  let locale = await requestLocale;

  // 驗證語言是否在支援列表中，否則使用默認語言
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    // 動態加載對應語言的翻譯文件
    // 這樣可以確保只加載當前需要的語言，優化性能
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
