

## Fix: SAM.gov Opportunities Not Showing

### Root Cause

The SAM.gov V2 API requires **both** `postedFrom` and `postedTo` parameters. The edge function currently only sets `postedTo` when the user explicitly provides it (line 59). When omitted, SAM.gov returns a `400` error: `"PostedFrom and PostedTo are mandatory"`.

This is confirmed by the edge function logs:
```
[SAM.gov] API error [400]: {"errorCode":"400","errorMessage":"PostedFrom and PostedTo are mandatory"}
```

### Fix

**File: `supabase/functions/search-opportunities/index.ts`** (line 59)

Always provide a `postedTo` value. When the user does not specify one, default to today's date.

Change:
```typescript
if (params.postedTo) qp.set("postedTo", toSamDate(String(params.postedTo).slice(0, 10)));
```

To:
```typescript
const defaultTo = new Date();
const defaultToStr = `${String(defaultTo.getMonth() + 1).padStart(2, "0")}/${String(defaultTo.getDate()).padStart(2, "0")}/${defaultTo.getFullYear()}`;
qp.set("postedTo", params.postedTo ? toSamDate(String(params.postedTo).slice(0, 10)) : defaultToStr);
```

After editing, redeploy the `search-opportunities` edge function.

### Files

| File | Change |
|---|---|
| `supabase/functions/search-opportunities/index.ts` | Always set `postedTo` with a default of today's date |

