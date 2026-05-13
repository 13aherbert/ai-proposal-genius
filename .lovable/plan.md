# Fix: Admin dashboard stuck loading

## Root cause

`AdminLayout` renders a spinner while `useUserRoles().isCheckingRoles === true`. That flag only clears after `is_admin` and `is_system_admin` RPCs return. On `/admin`, `supabase.auth.getSession()` is timing out (3s) and the supabase client is in a bad-JWT / refresh state (`403: invalid claim: missing sub claim` in auth logs), so those RPC calls never resolve and the spinner is permanent. There is no timeout / fallback around the RPC awaits in `use-role-check-effect.ts`.

A secondary irritant: `AuthProvider`'s `SIGNED_IN` handler re-runs the lifetime-checkout flow on every sign-in because `lifetime_deal_code` stays in `localStorage` after a failed handoff, firing an extra network call right as `/admin` mounts.

## Fix

### 1. Make the role check self-terminating (`src/hooks/user-roles/use-role-check-effect.ts`)

- Wrap each `checkAdminRole` / `checkSystemAdminRole` / `ensureUserRole` await in a `Promise.race` against a ~5s timeout so a hung RPC can never block UI state.
- Move `setIsCheckingRoles(false)` into a `finally` block (currently it only runs on the success path; the outer `catch` also clears it but the per-RPC try/catch swallows errors so the loop can stall).
- On timeout, keep the previously-known `refs.adminStatus` and set `roleCheckError` so `AdminLayout` can render an inline error rather than a spinner.

### 2. Add a hard fallback in `AdminLayout` (`src/layouts/AdminLayout.tsx`)

- After ~6s of `isCheckingRoles`, stop rendering the spinner and show a small "We couldn't verify your admin access — retry / back to dashboard" panel. This guarantees the page is never visually frozen even if a future regression re-introduces a hang.

### 3. Stop the lifetime-checkout side-effect from re-firing on `/admin` (`src/components/AuthProvider.tsx`)

- In the `SIGNED_IN` branch, only attempt `create-lifetime-checkout` when `location.pathname === '/lifetime'` (or `/auth` coming from `/lifetime`). Keep the code in `localStorage` for later retries, but don't kick it off on unrelated routes like `/admin`. This removes the competing in-flight request that's contributing to the auth-init timeout.

### 4. Light hardening of `fetchSession` (`src/components/AuthProvider.tsx`) — optional but recommended

- On `Session fetch timed out`, also call `supabase.auth.refreshSession()` once before giving up, so a transient bad-JWT state self-heals instead of forcing the user to re-login.

## Out of scope

- No DB / migration changes. The `is_admin` / `is_system_admin` RPCs themselves are fine; the bug is purely client-side resilience.
- No changes to RLS or auth secrets.

## Verification

1. Hard-reload `/admin` while logged in as an admin → dashboard renders within ~2s, no infinite spinner.
2. Simulate RPC hang (DevTools → block `/rest/v1/rpc/is_admin`) → after ~5s, AdminLayout shows the retry panel instead of spinning forever.
3. Navigate to `/admin` with `lifetime_deal_code` set in localStorage → no `"Starting your lifetime checkout…"` toast appears; admin loads normally.
