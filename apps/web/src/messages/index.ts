// 導出翻譯文件的 TypeScript 類型
// 這樣可以在使用 useTranslations 時獲得自動補全和類型檢查
export type Messages = typeof import('./zh-TW.json');
