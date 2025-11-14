/**
 * @fileoverview Toast Provider Component - 簡易 Toast 通知系統
 *
 * @description
 * 提供基於 Context API 的輕量級 Toast 通知系統。
 * 支援成功、錯誤、資訊三種通知類型，自動移除通知（5 秒），
 * 並在視窗右下角顯示通知堆疊。
 *
 * @component ToastProvider
 *
 * @features
 * - 三種通知類型（success / error / info）
 * - 自動移除通知（5 秒後）
 * - 固定在視窗右下角
 * - 手動關閉按鈕
 * - 彩色背景區分通知類型
 * - 簡單的進入/退出動畫
 *
 * @example
 * ```tsx
 * // 在應用根組件中使用
 * import { ToastProvider, useToast } from '@/components/ui/toast';
 *
 * function App() {
 *   return (
 *     <ToastProvider>
 *       <YourApp />
 *     </ToastProvider>
 *   );
 * }
 *
 * // 在子組件中使用
 * function MyComponent() {
 *   const { showToast } = useToast();
 *
 *   const handleSuccess = () => {
 *     showToast('操作成功！', 'success');
 *   };
 *
 *   const handleError = () => {
 *     showToast('操作失敗，請重試', 'error');
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleSuccess}>成功範例</button>
 *       <button onClick={handleError}>錯誤範例</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @dependencies
 * - react: Context API, useState, useCallback
 *
 * @related
 * - apps/web/src/components/ui/toaster.tsx - shadcn/ui Toast 系統（更完整）
 * - apps/web/src/components/ui/use-toast.tsx - shadcn/ui Toast Hook
 *
 * @author IT Department
 * @since MVP Phase 1
 * @lastModified 2025-11-14
 *
 * @notes
 * - 此為簡易版 Toast 系統，若需要更多功能（變體、Action 按鈕、持久化），
 *   建議使用 apps/web/src/components/ui/toaster.tsx 的 shadcn/ui Toast 系統
 * - 通知會自動在 5 秒後移除
 * - 最多同時顯示無限制，但建議不超過 5 個
 */

'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Toast 通知類型
 * @typedef {'success' | 'error' | 'info'} ToastType
 */
type ToastType = 'success' | 'error' | 'info';

/**
 * Toast 通知資料結構
 * @interface Toast
 * @property {string} id - 通知的唯一識別碼
 * @property {string} message - 通知訊息內容
 * @property {ToastType} type - 通知類型（success / error / info）
 */
interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

/**
 * Toast Context 類型定義
 * @interface ToastContextType
 * @property {Function} showToast - 顯示 Toast 通知的函數
 */
interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

/**
 * Toast Context
 * @private
 */
const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * ToastProvider 組件
 *
 * @description
 * Toast 通知系統的 Provider 組件，管理所有 Toast 通知的狀態。
 * 提供 showToast 函數給子組件使用，並負責渲染通知列表。
 *
 * @param {Object} props
 * @param {ReactNode} props.children - 子組件
 * @returns {JSX.Element} Toast Provider
 *
 * @example
 * ```tsx
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  /**
   * 顯示 Toast 通知
   *
   * @param {string} message - 通知訊息
   * @param {ToastType} type - 通知類型（success / error / info）
   *
   * @description
   * 新增一個 Toast 通知，並在 5 秒後自動移除。
   * Toast ID 使用隨機字串生成。
   */
  const showToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(7);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 5000);
  }, []);

  /**
   * 移除指定的 Toast 通知
   *
   * @param {string} id - Toast ID
   * @private
   */
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`min-w-[300px] rounded-md p-4 shadow-lg transition-all ${
              toast.type === 'success'
                ? 'bg-green-600 text-white'
                : toast.type === 'error'
                ? 'bg-red-600 text-white'
                : 'bg-blue-600 text-white'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="flex-1">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-white/80 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

/**
 * useToast Hook
 *
 * @description
 * 獲取 Toast Context，提供 showToast 函數給組件使用。
 * 必須在 ToastProvider 內部使用。
 *
 * @returns {ToastContextType} Toast Context 物件
 * @returns {Function} showToast - 顯示 Toast 通知的函數
 *
 * @throws {Error} 如果在 ToastProvider 外部使用
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { showToast } = useToast();
 *
 *   const handleClick = () => {
 *     showToast('操作成功！', 'success');
 *   };
 *
 *   return <button onClick={handleClick}>點擊我</button>;
 * }
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
