

## Fix: Data Sources Filters Not Clickable

### Root cause

`SourceSelectionContent` (line 223) is defined as a **component function inside the render body**:
```tsx
const SourceSelectionContent = () => (
  <div className="space-y-3">
    ...checkboxes, collapsibles, switch...
  </div>
);
```

React sees a new component identity on every render cycle. Each time any state changes (e.g., clicking a checkbox calls `toggleSource` → `setSelectedSources` → re-render), React **unmounts and remounts** `SourceSelectionContent` entirely. This destroys focus, kills click handlers mid-execution, and resets Collapsible open states — making checkboxes appear unclickable.

### Fix

Convert `SourceSelectionContent` from a component to a **JSX variable** (inline JSX assigned to a `const`). This keeps the same React element tree identity across renders, so checkboxes, collapsibles, and the switch all work correctly.

Change line 223 from:
```tsx
const SourceSelectionContent = () => (
```
to:
```tsx
const sourceSelectionContent = (
```

Then update the two usage sites (lines 322 and the mobile Sheet) from `<SourceSelectionContent />` to `{sourceSelectionContent}`.

### File to update
- `src/components/opportunities/OpportunitySearchForm.tsx` — 3 small edits (line 223, and 2 usage sites)

### Expected result
Checkboxes toggle immediately, collapsible sections stay open, and the pre-solicitation switch works on first click.

