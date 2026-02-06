
## Fix: Knowledge Base Audit Edge Function 401 Error

### Root Cause
The edge function analytics logs show all POST requests returning **401** status codes. The `verify_jwt = true` setting in `config.toml` causes Supabase's **gateway** to validate the JWT token before the request even reaches the function code. This gateway-level check is rejecting the requests, which is why no processing logs appear -- the function code never executes.

The function already has its own authorization logic (checking the `Authorization` header and calling `supabase.auth.getUser()`), making the gateway JWT check redundant and problematic.

### Fix

**File: `supabase/functions/config.toml`**

Change `verify_jwt` from `true` to `false` for the `audit-knowledge-base` function:

```text
[[functions]]
name = "audit-knowledge-base"
verify_jwt = false          # <-- changed from true
import_map = "import_map.json"
```

This matches the pattern used by other working functions in the project (e.g., `get-user-roles` and `generate-section-content`), and follows the recommended approach of handling auth validation inside the function code itself.

### Why This Works

- The function already validates the user by reading the `Authorization` header and calling `supabase.auth.getUser()` (lines 70-86 of `index.ts`)
- Setting `verify_jwt = false` lets the request reach the function code, where auth is properly handled
- Unauthorized requests are still rejected by the function's own auth checks (returns 401 if no auth header or invalid user)

### Verification Steps
1. Redeploy the edge function after the config change
2. Navigate to Knowledge Base page
3. Click "Analyze" on the Knowledge Base Audit card
4. Confirm analysis completes without the 401 error
