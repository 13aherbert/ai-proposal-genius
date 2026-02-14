
## Hide Knowledge Base Setup Wizard When Essentials Are Complete

### Problem
The Knowledge Base setup wizard dialog appears on the dashboard even when the user has already filled all 6 essential categories. It should only show when there are missing essential categories.

### Solution
One small change in `src/pages/Dashboard.tsx`:

**File: `src/pages/Dashboard.tsx` (lines 54-63)**

Update the `useEffect` that controls wizard visibility to also check `knowledgeReadiness.missingEssential.length`. If there are zero missing essential categories, never show the wizard -- regardless of localStorage or other conditions.

The updated logic will be:
1. If still loading, do nothing
2. If all essential categories are complete (`missingEssential.length === 0`), do not show the wizard
3. If the knowledge base is empty AND the user hasn't seen the wizard AND has no projects, show the wizard (existing behavior)

This uses the `missingEssential` array already provided by the `useKnowledgeReadiness()` hook -- no new data fetching or hooks needed.

### Technical Detail

In the `useEffect` on lines 54-63, add an early return:

```
if (knowledgeReadiness.missingEssential.length === 0) return;
```

before the existing `isEmpty` check. Add `knowledgeReadiness.missingEssential` to the dependency array.

One file changed, one line added.
