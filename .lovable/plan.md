

## Fix: Opportunity Search Edge Function

### Problem
Two bugs in `supabase/functions/search-opportunities/index.ts` prevent any searches from succeeding:

1. **Line 255**: Calls `supabase.auth.getClaims(token)` which does not exist in the Supabase JS SDK, causing every request to fail.
2. **Line 303**: Plan gate checks for `["pro", "enterprise", "white_label"]` but the actual plan types are `growth`, `business`, `enterprise`. Growth and Business users are blocked.

### Fix

**File: `supabase/functions/search-opportunities/index.ts`**

1. Replace `getClaims` auth block (lines 254-262) with `supabase.auth.getUser()`:
```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (authError || !user) {
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
const userId = user.id;
```

2. Update plan type check (line 303) to match actual pricing tiers:
```typescript
if (!["growth", "business", "enterprise", "white_label", "pro"].includes(planType)) {
```

### Technical Details
- `getUser()` validates the JWT via the Authorization header already passed to the client, so no separate token extraction is needed.
- The `token` variable (line 254) and its extraction can be removed since `getUser()` reads from the client headers directly.
- Adding `"growth"` and `"business"` to the allowed plans aligns the edge function with the established pricing model (Starter/Growth/Business/Enterprise).

