

## Plan: Enhance Interactive Onboarding Checklist

### Current State
`DashboardEmptyState.tsx` already has a solid checklist with 3 items, status icons, confetti on all-complete, staggered animations, and a progress bar. The main gaps vs the requirements are:

1. **Copy mismatches** -- descriptions, button labels, and reward text don't match spec
2. **No dismiss option** when all steps are complete
3. **No "Need help?" footer** link
4. **No individual step celebration** -- only fires confetti on all-complete, not per-step
5. **Visual hierarchy weak** -- completed items aren't dimmed enough, current item doesn't stand out
6. **Progress display** -- shows percentage instead of "X of 3 completed" as primary text
7. **Touch targets** -- action buttons use `size="sm"`, need default size for 44px height
8. **No CardFooter** with help link

### Changes

**File: `src/components/dashboard/DashboardEmptyState.tsx`**

1. **Update copy** to match spec (subtitle, step descriptions, button labels, reward messages)
2. **Add dismiss functionality** -- new `onDismiss` prop + "Dismiss checklist" button shown when all complete; persist to localStorage
3. **Add CardFooter** with "Need help? View documentation" link
4. **Improve visual hierarchy**:
   - Completed items: `opacity-60` + line-through on title
   - Current (first incomplete) item: `ring-2 ring-primary/30` highlight + bolder styling
   - Pending items after current: muted, no accent
5. **Fix progress display** -- remove percentage text, keep "X of 3 completed" badge as primary indicator
6. **Enlarge touch targets** -- buttons from `size="sm"` to default size
7. **Add per-step confetti** -- small confetti burst when individual step transitions to completed (track previous completion count via ref)
8. **Add completed badge per item** -- show "Profile complete!" / "Knowledge Base started!" / "First proposal created!" text badges on completed items instead of generic reward

**File: `src/pages/Dashboard.tsx`**

- Pass new `onDismiss` callback to `DashboardEmptyState` that sets localStorage flag and hides the component
- Check localStorage dismiss flag in render condition

| File | Action |
|------|--------|
| `src/components/dashboard/DashboardEmptyState.tsx` | Modify -- update copy, add dismiss, footer, visual hierarchy, per-step confetti, larger touch targets |
| `src/pages/Dashboard.tsx` | Modify -- add dismiss state management and pass callback |

