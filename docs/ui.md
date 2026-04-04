# UI Coding Standards

## Component Library

**Only shadcn/ui components are permitted for all UI in this project.**

- Do NOT create custom UI components (buttons, inputs, cards, dialogs, tables, etc.)
- Do NOT use raw HTML elements styled with Tailwind where a shadcn/ui component exists
- Install shadcn/ui components via the CLI: `npx shadcn@latest add <component>`
- All available components are documented at https://ui.shadcn.com/docs/components

If a component does not exist in shadcn/ui, open a discussion before introducing any alternative.

## Date Formatting

All dates must be formatted using **date-fns**. No other date formatting libraries or manual formatting are permitted.

### Format

Dates are displayed in the following format:

```
1st Sep 2025
2nd Aug 2025
3rd Jan 2026
4th Jun 2024
```

### Implementation

Use `format` from `date-fns` with the `do MMM yyyy` format string:

```ts
import { format } from 'date-fns';

format(new Date('2025-09-01'), 'do MMM yyyy'); // "1st Sep 2025"
format(new Date('2025-08-02'), 'do MMM yyyy'); // "2nd Aug 2025"
format(new Date('2026-01-03'), 'do MMM yyyy'); // "3rd Jan 2026"
format(new Date('2024-06-04'), 'do MMM yyyy'); // "4th Jun 2024"
```

This applies everywhere a date is rendered in the UI — workout dates, timestamps, labels, etc.
