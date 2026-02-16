

## Fix: Prevent Knowledge Base Wizard from Flashing

### Root Cause

The `KnowledgeSetupWizard` component always renders a `<Dialog>` in the DOM (controlled by the `open` prop). During the initial load, `knowledgeReadiness.isLoading` is `true`, so the useEffect that sets `showKBWizard` doesn't run yet. Once loading completes, there's a brief state transition that can cause the dialog to flash -- especially if the effect briefly sets it to `true` before the next render cycle corrects it.

### Fix (two changes in `src/pages/Dashboard.tsx`)

**1. Don't render the wizard component at all when essentials are complete:**

Replace line 151:
```tsx
<KnowledgeSetupWizard open={showKBWizard} onOpenChange={handleKBWizardClose} />
```
With:
```tsx
{showKBWizard && (
  <KnowledgeSetupWizard open={showKBWizard} onOpenChange={handleKBWizardClose} />
)}
```

This prevents the `<Dialog>` from being in the DOM at all when it shouldn't show.

**2. Guard the useEffect to only show the wizard after loading is fully complete and essentials are truly missing:**

Replace the existing useEffect (lines 51-62) with logic that:
- Does nothing while `isLoading` is true (no state changes during loading)
- Only sets `showKBWizard = true` if `missingEssential.length > 0` AND `isEmpty` is true AND the wizard hasn't been dismissed AND the user has no projects
- Immediately returns without setting state if essentials are complete

```tsx
useEffect(() => {
  if (knowledgeReadiness.isLoading) return; // Wait for data
  if (knowledgeReadiness.missingEssential.length === 0) return; // Essentials complete, never show
  if (knowledgeReadiness.isEmpty && !localStorage.getItem('kb_wizard_seen') && !dashboardStats.hasProjects) {
    setShowKBWizard(true);
  }
}, [knowledgeReadiness.isLoading, knowledgeReadiness.isEmpty, knowledgeReadiness.missingEssential, dashboardStats.hasProjects]);
```

The key difference: removing the `setShowKBWizard(false)` call that was triggering unnecessary re-renders, and conditionally rendering the component so it's never in the DOM when it shouldn't be.

### Files Modified
| File | Change |
|------|--------|
| `src/pages/Dashboard.tsx` | Simplify useEffect, conditionally render wizard component |

