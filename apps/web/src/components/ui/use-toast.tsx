/**
 * ================================================================
 * use-toast Hook - Toast 通知狀態管理
 * ================================================================
 *
 * 【功能說明】
 * Toast 通知系統的核心狀態管理 Hook
 * 提供 toast 的新增、更新、移除功能
 *
 * 【使用方式】
 * ```tsx
 * import { useToast } from "@/components/ui/use-toast"
 *
 * function MyComponent() {
 *   const { toast } = useToast()
 *
 *   return (
 *     <Button
 *       onClick={() => {
 *         toast({
 *           title: "成功",
 *           description: "操作已完成",
 *           variant: "success",
 *         })
 *       }}
 *     >
 *       顯示通知
 *     </Button>
 *   )
 * }
 * ```
 *
 * 【快捷方法】
 * ```tsx
 * const { toast } = useToast()
 *
 * // 成功通知
 * toast({
 *   title: "成功",
 *   description: "操作已完成",
 *   variant: "success",
 * })
 *
 * // 錯誤通知
 * toast({
 *   title: "錯誤",
 *   description: "操作失敗",
 *   variant: "destructive",
 * })
 *
 * // 警告通知
 * toast({
 *   title: "警告",
 *   description: "請注意",
 *   variant: "warning",
 * })
 *
 * // 移除特定通知
 * toast.dismiss(toastId)
 * ```
 *
 * 【設計模式】
 * • React Hooks 狀態管理
 * • 訂閱者模式 (Pub/Sub)
 * • 全域狀態管理 (不依賴 Context)
 * • 自動過期機制
 */

import * as React from "react";

// Toast 的變體類型
type ToastVariant = "default" | "destructive" | "success" | "warning";

// Toast Action 按鈕配置
export interface ToastActionElement {
  altText: string;
  onClick: () => void;
  label: string;
}

// Toast 屬性定義
export interface Toast {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
  variant?: ToastVariant;
  duration?: number;
}

// Toast 操作類型
type ToastAction =
  | { type: "ADD_TOAST"; toast: Toast }
  | { type: "UPDATE_TOAST"; toast: Partial<Toast> }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

// Toast 狀態
interface ToastState {
  toasts: Toast[];
}

// 記錄待移除的 Toast ID
const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

// 新增 Toast 到待移除列表
const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    });
  }, 300); // 300ms 等待退出動畫完成

  toastTimeouts.set(toastId, timeout);
};

// Toast Reducer
export const reducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, 5), // 最多顯示 5 個
      };

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      };

    case "DISMISS_TOAST": {
      const { toastId } = action;

      if (toastId) {
        addToRemoveQueue(toastId);
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id);
        });
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      };
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        };
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      };
  }
};

// 全域監聽器列表
const listeners: Array<(state: ToastState) => void> = [];

// 內存中的 Toast 狀態
let memoryState: ToastState = { toasts: [] };

// Dispatch 函數 - 通知所有監聽器
function dispatch(action: ToastAction) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

/**
 * Toast 配置選項
 */
export interface ToastOptions extends Omit<Toast, "id"> {}

/**
 * 生成唯一 ID
 */
function genId() {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Toast 函數 - 顯示新的 Toast
 *
 * 【參數】
 * • title: 標題
 * • description: 描述
 * • variant: 變體 (default, destructive, success, warning)
 * • duration: 顯示時間 (毫秒)，預設 5000ms
 * • action: 操作按鈕配置
 *
 * 【返回】
 * • id: Toast ID
 * • dismiss: 移除此 Toast 的函數
 * • update: 更新此 Toast 的函數
 */
function toast({ ...props }: ToastOptions) {
  const id = genId();

  const update = (props: ToastOptions) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    });

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id });

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open: boolean) => {
        if (!open) dismiss();
      },
    } as Toast,
  });

  // 自動移除
  const duration = props.duration ?? 5000;
  if (duration > 0) {
    setTimeout(() => {
      dismiss();
    }, duration);
  }

  return {
    id: id,
    dismiss,
    update,
  };
}

/**
 * useToast Hook - 訂閱 Toast 狀態
 *
 * 【返回】
 * • toast: 顯示 Toast 的函數
 * • toasts: 當前所有 Toast 列表
 * • dismiss: 移除 Toast 的函數
 *
 * 【使用範例】
 * ```tsx
 * const { toast, toasts, dismiss } = useToast()
 *
 * // 顯示通知
 * toast({
 *   title: "成功",
 *   description: "操作已完成",
 * })
 *
 * // 移除所有通知
 * dismiss()
 *
 * // 移除特定通知
 * dismiss(toastId)
 * ```
 */
function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}

export { useToast, toast };
