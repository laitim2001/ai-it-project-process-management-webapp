# UI Component Library

A collection of reusable, accessible, and consistent UI components for the IT Project Management Platform.

## Components

### Button

A versatile button component with multiple variants and states.

**Props:**
- `variant?: 'primary' | 'secondary' | 'danger' | 'ghost'` - Visual style variant (default: `'primary'`)
- `size?: 'sm' | 'md' | 'lg'` - Button size (default: `'md'`)
- `isLoading?: boolean` - Shows loading spinner when true
- `fullWidth?: boolean` - Makes button full width
- All standard button HTML attributes

**Usage:**
```tsx
import { Button } from '@/components/ui';

// Primary button
<Button variant="primary" onClick={handleClick}>
  Click Me
</Button>

// Loading state
<Button variant="primary" isLoading>
  Saving...
</Button>

// Danger button
<Button variant="danger" onClick={handleDelete}>
  Delete
</Button>

// Secondary button with custom size
<Button variant="secondary" size="lg">
  Large Button
</Button>
```

**Variants:**
- **primary**: Blue background, white text - for primary actions
- **secondary**: Gray background with border - for secondary actions
- **danger**: Red background, white text - for destructive actions
- **ghost**: Transparent background - for tertiary actions

---

### Input

A text input component with label, error, and helper text support.

**Props:**
- `label?: string` - Input label text
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below input
- `fullWidth?: boolean` - Makes input full width
- All standard input HTML attributes

**Usage:**
```tsx
import { Input } from '@/components/ui';

// Basic input
<Input
  type="text"
  placeholder="Enter your name"
  value={name}
  onChange={(e) => setName(e.target.value)}
/>

// With label and helper text
<Input
  label="Email Address"
  type="email"
  helperText="We'll never share your email"
  fullWidth
/>

// With error state
<Input
  label="Password"
  type="password"
  error="Password must be at least 8 characters"
/>
```

**States:**
- **Normal**: Gray border with blue focus ring
- **Error**: Red border with red focus ring when error prop is present
- **Disabled**: Grayed out appearance when disabled prop is true

---

### Select

A select dropdown component with label, error, and helper text support.

**Props:**
- `label?: string` - Select label text
- `error?: string` - Error message to display
- `helperText?: string` - Helper text below select
- `fullWidth?: boolean` - Makes select full width
- All standard select HTML attributes

**Usage:**
```tsx
import { Select } from '@/components/ui';

// Basic select
<Select value={year} onChange={(e) => setYear(e.target.value)}>
  <option value="">Select a year</option>
  <option value="2024">2024</option>
  <option value="2025">2025</option>
</Select>

// With label
<Select
  label="Financial Year"
  value={year}
  onChange={handleYearChange}
  fullWidth
>
  <option value="">All Years</option>
  {years.map(y => (
    <option key={y} value={y}>FY {y}</option>
  ))}
</Select>

// With error
<Select
  label="Category"
  error="Please select a category"
>
  <option value="">Choose...</option>
</Select>
```

---

### Pagination

A pagination component for navigating through pages of data.

**Props:**
- `currentPage: number` - Current active page
- `totalPages: number` - Total number of pages
- `onPageChange: (page: number) => void` - Callback when page changes

**Usage:**
```tsx
import { Pagination } from '@/components/ui';

<Pagination
  currentPage={page}
  totalPages={totalPages}
  onPageChange={setPage}
/>
```

---

### Toast

A toast notification system for displaying temporary messages.

**Usage:**
```tsx
import { useToast } from '@/components/ui';

function MyComponent() {
  const { showToast } = useToast();

  const handleSuccess = () => {
    showToast('Operation successful!', 'success');
  };

  const handleError = () => {
    showToast('Something went wrong', 'error');
  };

  return (
    <Button onClick={handleSuccess}>
      Show Success Toast
    </Button>
  );
}
```

**Toast Types:**
- `'success'` - Green toast for success messages
- `'error'` - Red toast for error messages

**Provider:**
The `ToastProvider` must wrap your application in the root layout:
```tsx
import { ToastProvider } from '@/components/ui';

export default function RootLayout({ children }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
```

---

## Design System

### Color Palette

**Primary Colors:**
- Blue 600: `#2563eb` - Primary actions
- Blue 700: `#1d4ed8` - Primary hover state
- Blue 500: `#3b82f6` - Focus rings

**Secondary Colors:**
- Gray 100: `#f3f4f6` - Secondary backgrounds
- Gray 200: `#e5e7eb` - Secondary hover
- Gray 300: `#d1d5db` - Borders
- Gray 500: `#6b7280` - Helper text
- Gray 600: `#4b5563` - Secondary text
- Gray 700: `#374151` - Primary text
- Gray 900: `#111827` - Headings

**Semantic Colors:**
- Red 600: `#dc2626` - Danger/Error
- Red 700: `#b91c1c` - Danger hover
- Red 300: `#fca5a5` - Error borders
- Green 600: `#16a34a` - Success
- Green 50: `#f0fdf4` - Success backgrounds

### Typography

**Font Family:**
- Default: Inter (sans-serif)

**Font Sizes:**
- `text-sm`: 14px - Helper text, labels
- `text-base`: 16px - Body text, buttons
- `text-lg`: 18px - Large buttons, subheadings
- `text-xl`: 20px - Section headings
- `text-3xl`: 30px - Page headings

**Font Weights:**
- `font-medium`: 500 - Labels, buttons
- `font-semibold`: 600 - Card titles
- `font-bold`: 700 - Page headings

### Spacing

**Component Padding:**
- Small: `px-3 py-1.5` (12px 6px)
- Medium: `px-4 py-2` (16px 8px)
- Large: `px-6 py-3` (24px 12px)

**Gaps:**
- Between form elements: `gap-4` (16px)
- Between sections: `gap-6` (24px)
- Between cards: `gap-4` (16px)

### Border Radius

- Default: `rounded-md` (6px)
- Pills/Tags: `rounded-full`

### Shadows

- Cards: `hover:shadow-md`
- Focus: `focus:ring-2 focus:ring-offset-1`

---

## Best Practices

1. **Always use the component library** - Don't create one-off styled elements
2. **Use semantic variants** - `variant="danger"` for destructive actions
3. **Provide labels** - Always include labels for form inputs for accessibility
4. **Handle loading states** - Use `isLoading` prop on buttons during async operations
5. **Show errors** - Use `error` prop to display validation errors
6. **Consistent spacing** - Use the design system spacing values
7. **Full width on mobile** - Use `fullWidth` for better mobile experience

---

## Importing Components

All components can be imported from the central index:

```tsx
import { Button, Input, Select, Pagination, useToast } from '@/components/ui';
```

Or individually:

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
```
