# ADR 0001: UI library direction

## Status
Proposed

## Context
The task tracker currently mixes Radix UI primitives with a Tailwind-based design system while relying on Material UI for specific controls (primarily date/time pickers). Both dayjs and react-day-picker back the scheduling workflows. This coexistence increases maintenance overhead and makes it harder to keep the interface consistent with the “quiet space” principle.

## Current usage
| Library family | Primary role | Notable usage (non-exhaustive) | Notes |
| --- | --- | --- | --- |
| Radix UI (@radix-ui/react-*) | Base primitives (dropdowns, popovers, tooltips, form controls) | `src/components/ui/*` wrappers such as `button`, `popover`, `tooltip`, `collapsible` | Composed with Tailwind utilities; aligns with current shadcn-style components. |
| Tailwind CSS (+ tailwind-merge / tailwindcss-animate) | Styling system | Global styling via `globals.css`, component-level classes | Works well with Radix wrappers. |
| Material UI (@mui/material, @mui/x-date-pickers, @emotion/*) | Advanced inputs, especially scheduling | `src/components/inputs/TimePickerField.jsx`, any future date pickers | Pulls in Emotion styling; visual language diverges from Radix/Tailwind defaults. |
| dayjs | Date utilities | `TimePickerField.jsx` formatting and parsing | Lightweight but tied to MUI pickers right now. |
| react-day-picker | Calendar grid | `src/components/ui/calendar.jsx` | Styled via Tailwind; complements Radix stack. |

## Options
1. **Lean into Radix + Tailwind**  
   - Replace remaining MUI components with Radix-friendly alternatives (e.g., custom time pickers or community packages).  
   - Removes Emotion styling layer; consistent design tokens.  
   - Requires building or adopting accessible time picker that matches requirements.
2. **Adopt MUI as primary UI kit**  
   - Migrate Radix-based primitives to MUI equivalents for consistency.  
   - Aligns with MUI ecosystem, but Tailwind utility classes become secondary.  
   - Larger bundle footprint; theming must be adapted to “quiet space” guideline.

## Impacted areas if either direction is chosen
- Scheduling inputs: `src/components/inputs/TimePickerField.jsx`, any future date range pickers.
- Shared UI primitives in `src/components/ui/*` (buttons, dialog, dropdown, tooltip, sheet).
- Form orchestration with `react-hook-form` + `zod` that currently expects Radix wrappers.
- Styling pipeline (Tailwind vs Emotion) and animation helpers.

## Open questions
- Do we need time picker UX beyond what react-day-picker offers?  
- Are there accessibility gaps in the current Radix-based wrappers that MUI already solves?  
- What is the acceptable bundle size / load performance budget?

## Next steps
- Audit the actual UI usage during Capture/Clarify flows to determine the minimal component set needed.  
- Prototype a Radix-aligned time picker to evaluate effort to drop MUI.  
- Decide on a direction before expanding new UI modules to avoid further divergence.
