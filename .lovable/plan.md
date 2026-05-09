## Performance Audit — Findings & Fix Plan

After reviewing the auth, subscription, organization, and project-section code paths, the slow "section load" feel is caused by a small number of high-impact issues that compound: the auth effect re-runs on every session change, the same profile/organization is queried 3-4× per page, members are refetched without any cache, and every section tab waits for a serial chunk download + DB round-trip before showing anything.

### Findings (highest impact first)

**1. AuthProvider re-subscribes on every session change** (`src/components/AuthProvider.tsx`)
- `useEffect` deps include `session`, so each `setSession` tears down and re-creates the `onAuthStateChange` listener, the 60s timeout interval, and the timeout. It also runs `JSON.stringify(session) !== JSON.stringify(currentSession)` on every event.
- Side effect: a background `get-user-roles` edge call fires on every auth event and times out at 3s (visible in console: `Roles fetch timeout`).

**2. Profile/organization queried 3-4× per project page**
- `useCurrentOrganization` (react-query, cached) — good.
- `ProjectContent.tsx` lines 44-49 — independent `profiles.current_organization_id` fetch.
- `ProposalDraft.tsx` lines 62-69 — same independent fetch.
- `useProposalSections.addSection` — fetches profile again on every insert.
- All four return the same value `useCurrentOrganization` already has.

**3. `useOrganizationMembers` has no caching** (`src/hooks/useOrganizationMembers.ts`)
- Plain `useState` + `useEffect` — refetches on every mount with `select(*)` and a join to `profiles`. Called in both `ProjectContent` and `ProposalDraft`, so the same query runs twice per project page open and again on every tab switch that remounts.

**4. Dual role-check pipeline** (`src/hooks/user-roles/`, `AuthProvider`)
- `AuthProvider` calls the `get-user-roles` edge function on every auth event (3s timeout, frequently fails).
- `useUserRoles` separately fires `is_admin` and `is_system_admin` RPCs on a 60s interval and after every session change, with its own delay/retry logic.
- Console shows duplicate "Forced role check" / "Skipping role check" — two consumers fighting over the same state.

**5. Section tabs are cold every time**
- `ProjectContent` lazy-loads `UnifiedAnalysisView`, `UnifiedProposalView`, `ReviewQueue`, `ProposalDesignStudio` — each is a fresh chunk download + DB query (`proposal-sections`, `proposal_outline`, `comments`, `members`) on first click.
- No prefetch, so the spinner is chunk-fetch + data-fetch in series.

**6. `useEntries` caches via `useState`** (`src/components/knowledge-base/entries/useEntries.ts`)
- Manual cache map in component state causes re-renders on every cache write and never deduplicates concurrent requests. Should be react-query (already in the project).

**7. Misc**
- `BrowserRouter` query client has `refetchOnWindowFocus: false` (good) but no `refetchOnMount: false` — keys missing from cache still re-fetch on every section mount.
- `useProposalSections` 5-minute `setInterval` + `localStorage.setItem` of full sections array on every save is fine, but the effect deps don't include `sections`, so it captures a stale closure (already a latent bug, low impact).

### Fix Plan

**Phase 1 — Auth & role stabilization (biggest win, isolated)**
1. `AuthProvider.tsx`
   - Remove `session` from the main `useEffect` deps; keep `[navigate, location.pathname]` only. Use a ref for the previous session JSON comparison (or compare `currentSession?.access_token`).
   - Move the background `get-user-roles` invocation out of `AuthProvider` entirely — `useUserRoles` already covers it.
   - Drop the per-event `JSON.stringify(session)` comparison; compare `access_token` strings.
2. `useUserRoles`
   - Single source of truth. Cache result in a module-level promise so multiple consumers share one in-flight request. Keep the 60s refresh, but only when the tab is visible (`document.visibilityState === 'visible'`).

**Phase 2 — Deduplicate profile/org/member fetches**
1. Remove the inline `profiles.current_organization_id` lookups in `ProjectContent.tsx` and `ProposalDraft.tsx`. Replace with `useCurrentOrganization()` (already cached 5 min).
2. In `useProposalSections.addSection`, read the org id from a passed-in prop or from `useCurrentOrganization`; do not fetch it inside the mutation.
3. Convert `useOrganizationMembers` to react-query:
   - Key: `["organization-members", organizationId]`.
   - `staleTime: 5 * 60 * 1000`, `gcTime: 10 * 60 * 1000`.
   - Slim the select: only `id, user_id, role, status, joined_at, profiles(first_name,last_name,username,avatar_url)`.
4. Lift presence/member loading to `ProjectContent` only; pass `members` down to `ProposalDraft` via props (or rely on the shared react-query cache so the second call is free).

**Phase 3 — Faster section switching**
1. Prefetch the next section's chunk on hover/focus of the sidebar item:
   ```ts
   onMouseEnter={() => import('@/components/project/proposal-draft/ProposalDraft')}
   ```
   Apply to Analysis, Proposal, Review, Design entries in `ProjectSidebar`.
2. Add `queryClient.prefetchQuery` for `proposal-sections` and `proposal-outline` when the user opens a project (idle callback).
3. Tighten react-query defaults in `App.tsx`: add `refetchOnReconnect: false` and ensure heavy queries (`proposal-sections`, `proposal-outline`, `organization-members`, `current-organization`) declare appropriate `staleTime` so tab re-mounts don't refetch.

**Phase 4 — Knowledge base**
1. Replace the manual cache in `useEntries.ts` with a react-query `useQuery` keyed on `[user_id, category, page, pageSize]`. Removes re-renders, dedupes concurrent calls, and gives free background revalidation.

**Phase 5 — Verification**
1. Reproduce on `/projects/:id`: open DevTools → Network. Confirm only one `profiles`, one `organizations`, one `organization_members` request per project view.
2. Switch between Overview → Analysis → Proposal → Review and confirm chunks are cached after first hover, and no spinner > 200ms once data is warm.
3. Watch console: no more `Roles fetch timeout`; `Forced role check` should appear once on login, not on every navigation.

### Out of scope (can follow up)
- Edge-function cold start optimization for `get-user-roles`.
- Splitting `ProposalDesignStudio` into smaller chunks (it pulls in TipTap + canvas).
- Server-side denormalization of `current_organization_id` into the auth JWT (would eliminate the profile read entirely).
