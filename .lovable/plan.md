

## Plan: Fix Session Persistence on Direct Navigation

### Root Causes Identified

**1. `SessionSecurity.isSessionExpired()` falsely reports expired on fresh loads**
In `src/utils/security/auth-security.ts` line 108: when `last_activity` doesn't exist in localStorage (which is the case on a fresh page load / direct navigation), the method returns `true` (expired). The `SecurityProvider` monitors this and will sign the user out.

**2. Aggressive 3-second timeout on session fetch**
In `src/components/AuthProvider.tsx` lines 156-158: `supabase.auth.getSession()` is raced against a 3-second timeout. If the Supabase client needs to refresh an expired access token (network call), this timeout can fire first, causing the session to appear missing.

**3. Missing `last_activity` initialization on session restore**
When a session is successfully fetched on page load, `SessionSecurity.updateLastActivity()` is never called, so the security monitoring can later determine the session is "expired."

### Changes

**1. `src/utils/security/auth-security.ts`** — Fix `isSessionExpired()`
- When `last_activity` is missing (fresh page load), return `false` instead of `true` and call `updateLastActivity()` to initialize the timestamp.

**2. `src/components/AuthProvider.tsx`** — Two fixes:
- Increase the session fetch timeout from 3 seconds to 10 seconds (or remove it) to accommodate token refresh network calls.
- After successfully fetching a session, call `SessionSecurity.updateLastActivity()` to initialize the activity tracker.

### Files Modified (2)
- `src/utils/security/auth-security.ts`
- `src/components/AuthProvider.tsx`

