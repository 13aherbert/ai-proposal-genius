

## Fix: Admin Role Assignment Fails

### Root Causes

Two bugs in the database functions called by `secure-admin-operations`:

**Bug 1: Ambiguous column in `check_admin_rate_limit`**
The function parameter `action_type` conflicts with the column `action_type` in `admin_rate_limits`. Postgres error: `column reference "action_type" is ambiguous`. This causes the rate limit check to fail, returning a 429 error.

**Bug 2: `assign_user_role` uses `auth.uid()` which is null**
The edge function uses the service role key (no user session), so `auth.uid()` returns null. Inside `assign_user_role`, it calls `is_admin_direct()` and `is_system_admin()` which both rely on `auth.uid()` → both return false → raises "Unauthorized" exception.

Similarly, `log_admin_action` (called inside `assign_user_role`) also uses `is_admin_direct()` with `auth.uid()`.

### Fix Plan

#### 1. Fix `check_admin_rate_limit` — ambiguous column reference
Run a migration to rename the parameter or qualify the column reference:
```sql
-- Qualify table column references to disambiguate from parameter names
```

#### 2. Bypass RPC permission checks in edge function
Since the edge function already verified admin status via `direct_admin_check`, the service role client should directly insert/delete from `user_roles` and `activity_feed` instead of calling RPC functions that re-check admin via `auth.uid()`.

**File:** `supabase/functions/secure-admin-operations/index.ts`
- For `assign_role`: Replace `supabase.rpc('assign_user_role', ...)` with direct table operations using the service role client (which bypasses RLS):
  1. Check if role already exists via `select` on `user_roles`
  2. Insert into `user_roles` directly
  3. Log the action directly into `activity_feed`
- For `remove_role`: Replace `supabase.rpc('remove_user_role', ...)` with direct `delete` on `user_roles`
- Remove the `log_admin_action` RPC calls (which also fail due to `auth.uid()`) and replace with direct inserts

| Change | Location |
|--------|----------|
| Fix ambiguous `action_type` in rate limit function | DB migration |
| Replace RPC calls with direct table operations | `secure-admin-operations/index.ts` |

