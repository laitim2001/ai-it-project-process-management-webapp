/**
 * @fileoverview UI Components Index - shadcn/ui 設計系統組件統一導出
 *
 * @description
 * 統一導出所有 shadcn/ui 設計系統組件和類型定義，提供集中式的組件匯入入口。
 * 包含 46 個 UI 組件，涵蓋基礎組件、表單組件、對話框、下拉選單、回饋組件等。
 * 組件分為 5 個階段：P1 基礎組件、P2 表單組件、P3 覆蓋層組件、P4 回饋組件、P5 進階組件。
 *
 * @module components/ui
 *
 * @components
 * **P1 - 基礎組件 (11 個)**
 * - Button, Input, Card, Badge, Label, Textarea, Select
 * - Avatar, Progress, Skeleton, Breadcrumb, Pagination
 *
 * **P2 - 表單組件 (5 個)**
 * - Checkbox, RadioGroup, Switch, Slider, Form
 *
 * **P3 - 覆蓋層組件 (6 個)**
 * - Dialog, DropdownMenu, Popover, Tooltip, Sheet, AlertDialog, ContextMenu
 *
 * **P4 - 回饋組件 (4 個)**
 * - Alert, Separator, Toast (useToast hook), Toaster
 *
 * **P5 - 進階組件 (3 個)**
 * - Tabs, Table, Accordion
 *
 * **業務組件 (1 個)**
 * - LoadingSkeleton (BudgetPoolListSkeleton)
 *
 * @example
 * ```tsx
 * // 單一導入
 * import { Button } from '@/components/ui';
 *
 * // 多個導入
 * import { Button, Input, Card, toast } from '@/components/ui';
 *
 * // 使用類型
 * import { type ButtonProps } from '@/components/ui';
 * ```
 *
 * @dependencies
 * - @radix-ui/react-*: 各組件的底層 Radix UI 實現
 * - class-variance-authority: 樣式變體管理
 * - tailwind-merge: Tailwind CSS 類別合併
 *
 * @related
 * - apps/web/src/components/ui/*.tsx - 各個 UI 組件實現
 * - apps/web/src/lib/utils.ts - cn() 工具函數
 * - claudedocs/DESIGN-SYSTEM-MIGRATION-PROGRESS.md - 設計系統遷移進度
 *
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 */

// Base Components (Design System)
export { Button, buttonVariants } from "./button"
export type { ButtonProps } from "./button"

export { Input } from "./input"
export type { InputProps } from "./input"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from "./card"

export { Badge, badgeVariants } from "./badge"
export type { BadgeProps } from "./badge"

// Form Components (New Design System)
export { Label } from "./label"
export type { LabelProps } from "./label"

export { Textarea } from "./textarea"
export type { TextareaProps } from "./textarea"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, NativeSelect } from "./select"
export type { NativeSelectProps } from "./select"

// Dialog Components
export {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./dialog"

// Dropdown Menu Components
export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "./dropdown-menu"

// Tabs Components
export { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs"

// Table Components
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
} from "./table"

// Avatar Components
export { Avatar, AvatarImage, AvatarFallback, avatarVariants } from "./avatar"
export type { AvatarProps } from "./avatar"

// Progress Components
export { Progress, progressVariants, progressIndicatorVariants } from "./progress"
export type { ProgressProps } from "./progress"

// Skeleton Components
export {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonTable,
  skeletonVariants,
} from "./skeleton"
export type { SkeletonProps } from "./skeleton"

// Breadcrumb Components
export {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
} from "./breadcrumb"

// Pagination Components
export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationControls,
} from "./pagination"
export { BudgetPoolListSkeleton } from './loading-skeleton';
// 使用新版 shadcn/ui Toast 系統 (見第180-181行)
// export { ToastProvider, useToast } from './Toast';

// Phase 2 - Additional P2 Form Components
export { Checkbox } from "./checkbox";
export { RadioGroup, RadioGroupItem } from "./radio-group";
export { Switch } from "./switch";
export { Slider } from "./slider";
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
} from "./form";

// Phase 2 - Additional P3 Overlay Components
export { Popover, PopoverTrigger, PopoverContent } from "./popover";
export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./tooltip";
export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from "./sheet";
export {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "./alert-dialog";
export {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
  ContextMenuRadioItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuPortal,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuRadioGroup,
} from "./context-menu";

// Phase 2 - Additional P4 Feedback Components
export { Alert, AlertTitle, AlertDescription } from "./alert";
export { Separator } from "./separator";
export { toast, useToast } from "./use-toast"; // 新版 Toast Hook
export { Toaster } from "./toaster";

// Phase 2 - P5 Advanced Component (Accordion)
export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./accordion";

// CHANGE-032 - Password Components
export { PasswordInput } from "./password-input";
export type { PasswordInputProps } from "./password-input";
export { PasswordStrengthIndicator } from "./password-strength-indicator";
export type { PasswordStrengthIndicatorProps } from "./password-strength-indicator";

// FEAT-012 - Loading Components
export { Spinner, LoadingButton, LoadingOverlay, GlobalProgress } from "./loading";
export type { SpinnerProps, LoadingButtonProps, LoadingOverlayProps, GlobalProgressProps } from "./loading";
