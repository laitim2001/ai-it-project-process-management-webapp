/**
 * @fileoverview Form 組件 - 表單整合系統
 *
 * @description
 * 整合 react-hook-form 和 zod 的完整表單組件系統。
 * 提供 Context-based API 用於表單狀態管理、驗證和錯誤處理。
 *
 * @module apps/web/src/components/ui/form
 * @component Form
 * @author IT Department
 * @since Post-MVP - Design System Migration
 * @lastModified 2025-11-14
 *
 * @features
 * - 與 react-hook-form 完整整合
 * - 支援 zod schema 驗證
 * - 自動處理錯誤訊息顯示
 * - 無障礙友善的錯誤提示（ARIA attributes）
 * - Context-based API（FormField, FormItem, FormLabel）
 * - 表單描述和錯誤訊息組件
 *
 * @dependencies
 * - react-hook-form - 表單狀態管理
 * - @radix-ui/react-label - 無障礙 label 組件
 * - @radix-ui/react-slot - Slot 組件
 * - @/lib/utils - cn() 工具函數
 *
 * @example
 * ```tsx
 * import { zodResolver } from "@hookform/resolvers/zod";
 * import * as z from "zod";
 *
 * const formSchema = z.object({
 *   username: z.string().min(2, "用戶名至少 2 個字符"),
 *   email: z.string().email("無效的電子郵件"),
 * });
 *
 * function MyForm() {
 *   const form = useForm<z.infer<typeof formSchema>>({
 *     resolver: zodResolver(formSchema),
 *     defaultValues: { username: "", email: "" },
 *   });
 *
 *   const onSubmit = (values: z.infer<typeof formSchema>) => {
 *     console.log(values);
 *   };
 *
 *   return (
 *     <Form {...form}>
 *       <form onSubmit={form.handleSubmit(onSubmit)}>
 *         <FormField
 *           control={form.control}
 *           name="username"
 *           render={({ field }) => (
 *             <FormItem>
 *               <FormLabel>用戶名</FormLabel>
 *               <FormControl>
 *                 <Input placeholder="請輸入用戶名" {...field} />
 *               </FormControl>
 *               <FormDescription>這是您的公開顯示名稱</FormDescription>
 *               <FormMessage />
 *             </FormItem>
 *           )}
 *         />
 *         <Button type="submit">提交</Button>
 *       </form>
 *     </Form>
 *   );
 * }
 * ```
 */

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";
import { cn } from "@/lib/utils";
import { Label } from "./label";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn("text-sm font-medium text-destructive", className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
