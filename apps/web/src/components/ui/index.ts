// Base Components (Design System)
export { Button, buttonVariants } from "./Button"
export type { ButtonProps } from "./Button"

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

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel } from "./select"
export type { SelectProps } from "./select"

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
export { BudgetPoolListSkeleton } from './LoadingSkeleton';
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
