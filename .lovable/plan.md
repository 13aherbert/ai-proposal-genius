

## Diagnosis: Admin Dashboard Blocked + Constant Re-rendering

### Database Roles

The user `apxherbert@gmail.com` now has 3 valid roles: `user`, `admin`, `system_admin`. The invalid `developer` role was already removed. The roles themselves are correct.

### Root Cause 1: Shared `lastCheckedTime` Prevents System Admin Check

In `src/hooks/user-roles/role-check-utils.ts`, both `checkAdminRole` and `checkSystemAdminRole` share the same `refs.lastCheckedTime`. They are called sequentially in `use-role-check-effect.ts`:

```
checkAdminRole(...)   → sets refs.lastCheckedTime = now (line 41)
checkSystemAdminRole(...)  → sees refs.lastCheckedTime was JUST set
                           → (now - refs.lastCheckedTime < 10000) is TRUE
                           → returns cached refs.systemAdminStatus (default: false)
                           → NEVER calls the RPC
```

This means `checkSystemAdminRole` always returns `false` on every normal (non-forced) check because the admin check already "used up" the cache window.

### Root Cause 2: `checkRoles` Callback Depends on Entire `session` Object

In `use-role-check-effect.ts` line 100, `checkRoles` has `session` in its dependency array. The Supabase auth session object can be recreated (new reference) on token refresh events, even when `session.user.id` hasn't changed. This causes:

1. `session` reference changes → `checkRoles` callback is recreated
2. `useEffect` in `index.ts` line 151 depends on `checkRoles` → effect re-runs
3. Effect clears old interval, starts new timeout + interval → creates churn
4. This explains the "constantly rendering" feel

### Root Cause 3: `checkingInProgress` Conflict Between Functions

After `checkAdminRole` runs (line 29: sets `refs.checkingInProgress = true`, line 46: sets it back to `false`), if there's any timing issue or error path where it stays `true`, `checkSystemAdminRole` line 65 will short-circuit and return `false`.

### Fix Plan

**File 1: `src/hooks/user-roles/role-check-utils.ts`**

- Give `checkSystemAdminRole` its own separate cache timestamp (e.g. a `lastSystemAdminCheckedTime` ref field) so it doesn't share `lastCheckedTime` with `checkAdminRole`.
- Or simpler: remove the `lastCheckedTime` cache check from both functions since the parent `use-role-check-effect.ts` already throttles with `MIN_CHECK_INTERVAL` (15s). The child functions don't need their own throttle.
- Remove the `refs.checkingInProgress` guard from both functions (lines 17 and 65) — the parent already guards against concurrent `checkRoles` calls on line 23.

**File 2: `src/hooks/user-roles/use-role-check-effect.ts`**

- Change `checkRoles` dependency from `session` to `session?.user?.id` so the callback isn't recreated on every token refresh.

**File 3: `src/hooks/user-roles/types.ts`**

- No changes needed (the existing refs structure is sufficient).

### Summary of Changes

| File | Change |
|------|--------|
| `role-check-utils.ts` | Remove `checkingInProgress` guard and `lastCheckedTime` cache from both check functions (parent already throttles) |
| `use-role-check-effect.ts` | Change `useCallback` dep from `session` to `session?.user?.id` |

### Expected Result

- `checkSystemAdminRole` will actually execute its RPC call, returning `true` for this user
- `AdminLayout` will see `isAdmin = true` and render the admin dashboard
- The callback won't be recreated on token refreshes, stopping the re-render churn

