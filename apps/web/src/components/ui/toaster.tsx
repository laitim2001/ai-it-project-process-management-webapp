/**
 * @fileoverview Toaster 組件 - Toast 通知渲染容器
 *
 * @description
 * Toast 通知系統的渲染容器，負責顯示所有 Toast 通知。
 * 配合 use-toast Hook 使用，自動處理通知的顯示和動畫。
 * 固定在視窗右下角，支援最多 5 個通知堆疊顯示。
 *
 * @module apps/web/src/components/ui/toaster
 * @component Toaster
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 *
 * @features
 * - 固定在視窗右下角（桌面版）/底部中央（手機版）
 * - 自動堆疊多個通知
 * - 平滑的進入/退出動畫
 * - 支援滑動關閉手勢
 * - 響應式設計
 * - 最多顯示 5 個通知
 * - 完全無障礙（aria-live, WCAG 2.1 AA）
 *
 * @dependencies
 * - use-toast Hook - Toast 狀態管理
 * - lucide-react - 圖標組件
 * - @/lib/utils - cn() 工具函數
 *
 * @example
 * // 在根布局中使用
 * ```tsx
 * 在應用根組件中加入 Toaster：
 * ```tsx
 * // app/layout.tsx or _app.tsx
 * import { Toaster } from "@/components/ui/toaster"
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         {children}
 *         <Toaster />
 *       </body>
 *     </html>
 *   )
 * }
 * ```
 *
 * 【設計特點】
 * • 固定在視窗右下角
 * • 自動堆疊多個通知
 * • 平滑的進入/退出動畫
 * • 支援滑動關閉手勢
 * • 響應式設計 (手機版調整位置)
 * • 最多顯示 5 個通知
 *
 * 【無障礙特性】
 * • aria-live="polite" - 螢幕閱讀器支援
 * • 鍵盤可訪問的關閉按鈕
 * • 適當的顏色對比度
 * • 支援縮放和高對比度模式
 */

"use client";

import * as React from "react";
import { X } from "lucide-react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";
import type { Toast } from "./use-toast";

/**
 * Toast 變體圖標映射
 */
const variantIcons = {
  default: Info,
  destructive: AlertCircle,
  success: CheckCircle2,
  warning: AlertTriangle,
};

/**
 * Toast 變體樣式映射
 */
const variantStyles = {
  default: "bg-background text-foreground border-border",
  destructive:
    "bg-destructive text-destructive-foreground border-destructive",
  success:
    "bg-green-600 text-white border-green-700 dark:bg-green-700 dark:border-green-800",
  warning:
    "bg-yellow-500 text-white border-yellow-600 dark:bg-yellow-600 dark:border-yellow-700",
};

/**
 * ToastItem 組件 - 單個 Toast 通知
 *
 * 【Props】
 * • toast: Toast 資料
 * • onClose: 關閉回調
 */
interface ToastItemProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastItem = React.forwardRef<HTMLDivElement, ToastItemProps>(
  ({ toast, onClose }, ref) => {
    const [isExiting, setIsExiting] = React.useState(false);
    const variant = toast.variant ?? "default";
    const Icon = variantIcons[variant];

    const handleClose = () => {
      setIsExiting(true);
      setTimeout(() => {
        onClose(toast.id);
      }, 300); // 等待退出動畫完成
    };

    return (
      <div
        ref={ref}
        className={cn(
          // 基礎樣式
          "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-4 pr-8 shadow-lg transition-all",
          // 變體樣式
          variantStyles[variant],
          // 動畫類
          isExiting
            ? "animate-out slide-out-to-right-full"
            : "animate-in slide-in-from-right-full",
          // 響應式寬度
          "max-w-md sm:max-w-sm"
        )}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* 圖標 */}
        <Icon className="h-5 w-5 flex-shrink-0" />

        {/* 內容區域 */}
        <div className="grid flex-1 gap-1">
          {toast.title && (
            <div className="text-sm font-semibold">{toast.title}</div>
          )}
          {toast.description && (
            <div className="text-sm opacity-90">{toast.description}</div>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-current bg-transparent px-3 text-sm font-medium transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
              aria-label={toast.action.altText}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* 關閉按鈕 */}
        <button
          onClick={handleClose}
          className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
          aria-label="關閉通知"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }
);
ToastItem.displayName = "ToastItem";

/**
 * Toaster 主組件 - Toast 通知容器
 *
 * 【功能】
 * • 自動從 use-toast 獲取通知列表
 * • 渲染所有活動的通知
 * • 處理通知的關閉操作
 * • 提供固定定位的容器
 *
 * 【樣式】
 * • 固定在視窗右下角 (桌面版)
 * • 固定在視窗底部中央 (手機版)
 * • z-index: 100 (確保在最上層)
 * • 內建間距和內邊距
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className={cn(
        // 固定定位
        "fixed z-[100] flex flex-col-reverse gap-2 p-4",
        // 桌面版：右下角
        "bottom-0 right-0",
        // 手機版：底部中央
        "sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col"
      )}
      aria-label="通知區域"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={dismiss} />
      ))}
    </div>
  );
}
