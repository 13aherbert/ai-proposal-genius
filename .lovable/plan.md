

## Plan: Add Knowledge Base Link to Footer

### Problem
There is no `/kb` link in the codebase — and no Knowledge Base link in the main footer at all. The route for the Knowledge Base page is `/knowledge-base`.

### Fix

**`src/components/navigation/Footer.tsx`** — Add a "Knowledge Base" link visible only to logged-in users (since the route is protected), placed alongside the existing links:

```tsx
{session && (
  <Link to="/knowledge-base" className="hover:text-foreground">
    Knowledge Base
  </Link>
)}
```

This will be inserted after the "Compare" link and before the "Pricing" link.

### Files Modified (1)
- `src/components/navigation/Footer.tsx`

