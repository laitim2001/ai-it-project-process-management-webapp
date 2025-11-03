/**
 * Root Layout - 根路徑重定向頁面的 layout
 *
 * 注意：此 layout 僅用於根 page.tsx 的重定向
 * 實際的應用 layout 在 [locale]/layout.tsx
 * 使用 suppressHydrationWarning 避免與 [locale]/layout.tsx 的 html/body 衝突
 */

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
