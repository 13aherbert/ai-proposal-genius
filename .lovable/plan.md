

## Diagnosis: Projects Stuck on Loading

### Root Cause

The `useProjects` hook depends on `useCurrentOrganization()`, which has a **race condition** in how it fetches the user. The organization hook uses its own `useState` + `useEffect` to call `supabase.auth.getUser()`, separate from the `AuthProvider` session. This creates two problems:

1. **Duplicate auth fetch**: `useCurrentOrganization` fetches the user independently instead of using the session from `AuthProvider`, causing a timing gap.

2. **Error blocks projects permanently**: The projects query has `enabled: !!user?.id && !orgLoading && orgError === null` (line 206). If the organization query throws an error (e.g., RLS denies access to `organizations` table, or `.single()` fails), `orgError` becomes non-null and the projects query **never executes**. The `orgLoading` flips to `false`, but `orgError !== null` keeps the query disabled. Meanwhile, `isLoadingWithOrg` (line 366) only checks `isLoading || orgLoading` — so it shows as not loading, but the `isLoading` from the projects query stays `true` because it never ran (enabled=false keeps it in loading state with react-query).

3. **`organizationId === null` returns empty**: Even if the org query succeeds but returns `null` (user has no `current_organization_id`), `fetchProjects` returns empty at line 111-114. But additionally, the query key includes `organizationId` as `undefined` during loading, then changes when resolved, causing refetches.

### The Fix

**File: `src/hooks/use-current-organization.ts`**
- Remove the independent `useState`/`useEffect` for user. Accept the user as a parameter or use `useAuth()` from `AuthProvider` to avoid the race condition.

**File: `src/hooks/use-projects.ts`**
- Change the `enabled` condition to handle org errors gracefully — if org loading fails, still allow projects to load (without org filter) rather than blocking entirely.
- Change `orgError === null` to `!orgError` or remove the org error gate and let projects load without an org filter as fallback.

### Specific Changes

1. **`src/hooks/use-current-organization.ts`**: Replace the manual `useState`/`useEffect` user fetch with `useAuth()` from `AuthProvider`, so the user is immediately available when the session exists.

2. **`src/hooks/use-projects.ts`** (line 206): Change the enabled condition from:
   ```
   enabled: !!user?.id && !orgLoading && orgError === null
   ```
   to:
   ```
   enabled: !!user?.id && !orgLoading
   ```
   And handle `orgError` as a fallback — if org failed, fetch projects without org filter.

3. **`src/hooks/use-projects.ts`** (line 366): Update `isLoadingWithOrg` to not block on org errors:
   ```
   const isLoadingWithOrg = orgLoading ? true : isLoading;
   ```

These changes ensure that even if the organization query fails or returns null, the user can still see their projects.

