

## Fix: Keyword Search Returns Irrelevant/No Results Due to Stale Filters

### Root Cause
The search form retains all filter values across searches. When a user searches by NAICS code first, then switches to a keyword search, the NAICS code and other filters remain active, making the combined query too restrictive (0 results).

### Changes

**File: `src/components/opportunities/OpportunitySearchForm.tsx`**

1. Add a "Clear All Filters" button that resets all fields except keyword
2. Show active filter count badge next to the search button so users know filters are applied
3. Add a "Reset All" link that clears everything including keyword
4. When filters are active alongside a keyword, show a subtle warning: "Filters are narrowing your results. Clear filters for broader keyword search."

### Implementation Detail

```text
┌─────────────────────────────────────────────┐
│ Keyword: [Construction                    ] │
│                                             │
│ ⚠ 2 filters active (NAICS, Type).          │
│   Clear filters for broader results.        │
│                                             │
│ Source: All    Type: Presolicitation  ...    │
│ NAICS: 511512  Set-Aside: Any              │
│                                             │
│ [🔍 Search]  [Clear Filters]  [Reset All]  │
└─────────────────────────────────────────────┘
```

### Files to update
- `src/components/opportunities/OpportunitySearchForm.tsx` -- add clear buttons + active filter indicator

