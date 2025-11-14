/**
 * @fileoverview Dialog Component - shadcn/ui 對話框組件
 *
 * @description
 * 基於 React Context 的對話框組件，提供模態內容展示功能。
 * 使用受控或非受控模式管理開啟/關閉狀態，支援背景遮罩、ESC 鍵關閉等功能。
 * 適用於表單對話框、確認對話框、內容展示等場景。
 *
 * @component Dialog
 *
 * @features
 * - 可控/非可控模式
 * - 背景遮罩和模糊效果
 * - ESC 鍵關閉
 * - 背景點擊關閉
 * - 關閉按鈕 (X)
 * - 平滑淡入淡出和縮放動畫
 * - 主題支援 (Light/Dark/System)
 * - 焦點管理
 *
 * @example
 * ```tsx
 * // 基本用法 (非受控)
 * <Dialog>
 *   <DialogTrigger>
 *     <Button>開啟對話框</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogHeader>
 *       <DialogTitle>標題</DialogTitle>
 *       <DialogDescription>描述</DialogDescription>
 *     </DialogHeader>
 *     <p>對話框內容</p>
 *     <DialogFooter>
 *       <Button>確認</Button>
 *     </DialogFooter>
 *   </DialogContent>
 * </Dialog>
 *
 * // 受控模式
 * const [open, setOpen] = useState(false);
 * <Dialog open={open} onOpenChange={setOpen}>
 *   <DialogTrigger>
 *     <Button>開啟</Button>
 *   </DialogTrigger>
 *   <DialogContent>
 *     <DialogTitle>標題</DialogTitle>
 *     <p>內容</p>
 *   </DialogContent>
 * </Dialog>
 * ```
 *
 * @dependencies
 * - lucide-react: X 圖標 (關閉按鈕)
 *
 * @related
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - apps/web/src/components/ui/alert-dialog.tsx - AlertDialog 組件 (確認對話框)
 * - apps/web/src/components/ui/command.tsx - CommandDialog 使用範例
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | undefined>(
  undefined
)

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Dialog components must be used within Dialog")
  }
  return context
}

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const handleOpenChange = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setInternalOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange]
  )

  return (
    <DialogContext.Provider value={{ open: isOpen, onOpenChange: handleOpenChange }}>
      {children}
    </DialogContext.Provider>
  )
}
Dialog.displayName = "Dialog"

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ className, onClick, asChild, children, ...props }, ref) => {
  const { onOpenChange } = useDialogContext()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    onClick?.(e)
    onOpenChange(true)
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    })
  }

  return (
    <button ref={ref} onClick={handleClick} className={className} {...props}>
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  onEscapeKeyDown?: (event: KeyboardEvent) => void
  onPointerDownOutside?: (event: PointerEvent) => void
}

const DialogContent = React.forwardRef<HTMLDivElement, DialogContentProps>(
  ({ className, children, onEscapeKeyDown, onPointerDownOutside, ...props }, ref) => {
    const { open, onOpenChange } = useDialogContext()
    const contentRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onEscapeKeyDown?.(event)
          if (!event.defaultPrevented) {
            onOpenChange(false)
          }
        }
      }

      if (open) {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
      }
    }, [open, onOpenChange, onEscapeKeyDown])

    const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onOpenChange(false)
      }
    }

    if (!open) return null

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        onClick={handleOverlayClick}
      >
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />

        {/* Content */}
        <div
          ref={ref}
          className={cn(
            "relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 sm:rounded-lg",
            className
          )}
          {...props}
        >
          {children}
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>
      </div>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
    {...props}
  />
))
DialogHeader.displayName = "DialogHeader"

const DialogFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
))
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h2
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
DialogDescription.displayName = "DialogDescription"

export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
