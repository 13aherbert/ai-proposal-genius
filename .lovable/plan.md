

## Plan: Refine Sonner Toast Configuration

### Current State
Sonner is already installed, imported, and actively used across **109 files** in the codebase. The `<Toaster>` is rendered in `App.tsx` with `position="top-right" richColors closeButton`.

The existing setup already covers:
- Success, error, warning, info, and loading toasts used throughout
- Action buttons in toasts (retry, view, etc.)
- Descriptions on most toasts
- Theme-aware styling via `richColors`

### What Actually Needs Changing

Only the `<Toaster>` configuration in `src/App.tsx` needs a small update to match the spec:

1. **Position**: Change from `top-right` to `bottom-right` on desktop (spec requirement)
2. **Max visible toasts**: Add `visibleToasts={3}` (spec: max 3)
3. **Default duration**: Add `duration={4000}` (spec: 4s default)

That's it — one line change. Everything else requested (toast types, usage patterns, action buttons, loading states) is already implemented throughout the codebase.

### Change

**`src/App.tsx` (line ~102)**

Update the Toaster props:
```tsx
// Before
<Toaster position="top-right" richColors closeButton />

// After
<Toaster position="bottom-right" richColors closeButton visibleToasts={3} duration={4000} />
```

| File | Action |
|------|--------|
| `src/App.tsx` | Modify — update Toaster props (position, visibleToasts, duration) |

