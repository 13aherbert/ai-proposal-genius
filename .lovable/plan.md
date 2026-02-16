

## Fix: Display All Quick Action Cards in a Single Row

### Change
Update the Quick Actions grid in `src/pages/Dashboard.tsx` (line 174) from `lg:grid-cols-3` to `lg:grid-cols-4` so all four cards (Upload New RFP, View All Projects, Knowledge Base, Find Opportunities) appear in one row on desktop.

### Technical Detail

**File:** `src/pages/Dashboard.tsx`, line 174

Change:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
```
To:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4
```

This is a one-line CSS class change. On smaller screens the cards will still stack into 2 columns (sm) or 1 column (mobile).

