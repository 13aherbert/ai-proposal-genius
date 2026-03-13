

## Plan: Enhance Projects Usage Widget on Dashboard

### Current State
The `UsageProgressWidget` already exists and is rendered on the dashboard (line 259-263 of `Dashboard.tsx`). It shows a progress bar with count, remaining projects, color-coded states, and an upgrade modal at limit. However, it's missing several requested features.

### Changes

**1. Enhance `UsageProgressWidget` — `src/components/subscription/UsageProgressWidget.tsx`**

Redesign the widget into a proper Card with richer content:

- **Title**: "Projects This Year" with the current tier badge (e.g., "Starter (Free)")
- **Large number display**: Bold "4 of 6 used" as a prominent heading
- **Improved color thresholds**: Green 0-50%, Yellow 51-83%, Red 84-100% (update from current 70% threshold)
- **Details section**: Show "X remaining" and "Resets January 1, {nextYear}"
- **Upgrade CTA**: Show "Upgrade" button when >50% used (not just at limit)
- **Tooltip on hover**: Wrap widget in a Tooltip showing tier details and remaining count
- **Pulsing indicator at limit**: Add `animate-pulse` red dot when at 100%
- **Animated progress bar**: Add `transition-all duration-700` for load animation (use a `useEffect` to delay setting value)
- **Clickable**: Opens upgrade modal on click (already partially implemented, extend to always open plan comparison)

**2. Add mobile-responsive compact mode — same file**

- Below `sm` breakpoint: Collapse to a single-line layout showing "4/6" with a colored status dot
- Use a `details`/`summary`-style expand or simply responsive Tailwind classes (`hidden sm:block` for details, `sm:hidden` for compact)
- Tap on mobile expands to full widget or opens upgrade modal

**3. Move widget position on Dashboard — `src/pages/Dashboard.tsx`**

- Move `UsageProgressWidget` from below quick actions (line 259) to directly below `DashboardHeader` (line 166), before quick actions, so it's visible immediately
- Also show it for non-established users (currently only rendered inside `isEstablished` block)

### Files Touched
- **Modified**: `src/components/subscription/UsageProgressWidget.tsx`, `src/pages/Dashboard.tsx`

