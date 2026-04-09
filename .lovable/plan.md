

## Diagnosis: Admin Access Required Despite Having Admin Role

### Root Cause

There is a **shared `checkingInProgress` flag conflict** between `use-role-check-effect.ts` and `role-check-utils.ts`.

In `use-role-check-effect.ts` line 39:
```typescript
refs.checkingInProgress = true;  // Set BEFORE calling checkAdminRole
```

Then `checkAdminRole` at line 17:
```typescript
if (!userId || (refs.checkingInProgress && !forceUpdate)) {
  return refs.adminStatus;  // Returns false (the initial default)
}
```

Since `checkingInProgress` is already `true` and `forceUpdate` is `false`, the function **short-circuits and returns the default `false`** without ever calling the RPC. The same happens for `checkSystemAdminRole`. The admin RPC is never actually executed during normal checks.

The console logs confirm this: "Checking admin role directly via RPC" is logged, but the actual RPC call inside `checkAdminRole` is skipped because of the guard. The user has `admin` and `system_admin` roles in the database, but the client never reads them.

### Fix

**File: `src/hooks/user-roles/use-role-check-effect.ts`**

Remove the `refs.checkingInProgress = true` at line 39 and `refs.checkingInProgress = false` at line 99. The individual `checkAdminRole` and `checkSystemAdminRole` functions already manage their own `checkingInProgress` flag internally. The parent function setting it first prevents the child functions from executing.

Alternatively (cleaner): keep the parent's `checkingInProgress` guard (line 23) to prevent concurrent `checkRoles` calls, but **don't pass it down** — remove the `refs.checkingInProgress` check from `checkAdminRole` and `checkSystemAdminRole` since they're always called from within the already-guarded parent.

**Recommended approach**: Remove lines 39 and the `finally` block reset at line 99 in `use-role-check-effect.ts`. This lets each sub-function manage its own concurrency independently.

### Files Changed

1. **`src/hooks/user-roles/use-role-check-effect.ts`** — Remove `refs.checkingInProgress = true` (line 39) and `refs.checkingInProgress = false` (line 99) so the child role-check functions can actually execute their RPC calls.

