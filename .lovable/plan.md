## Why the dashboard flickers today

`src/pages/Dashboard.tsx` renders three different layouts back-to-back during the first ~1–2 seconds:

1. **First paint** — `dashboardStats` defaults to `{ projectCount: 0, hasProjects: false, ... }` and `isNewUser` defaults to `false`. `isEstablished` is therefore `false`, so the page renders `DashboardEmptyState` (the onboarding checklist) and no Quick Actions / Recent Activity / Sidebar.
2. **After `fetchDashboardStats` resolves** — `hasProjects` flips to `true`, `isEstablished` becomes `true`, the empty state unmounts, and the Quick Actions grid + Usage Widget + Recent Activity + Sidebar mount in its place.
3. **After `useKnowledgeReadiness` resolves** — `showSidebar` flips again, so the right-hand column appears (or disappears) and the main column reflows from `lg:col-span-3` to full width (or back).

On top of the visual churn, the queries themselves are slower than they need to be:

- `fetchDashboardStats` does `select('project_id')` and `select('entry_id')` and counts the returned arrays in JS. For a user with many rows this transfers every id over the wire just to compute a length.
- The two queries run sequentially (`await` then `await`) instead of in parallel.
- The result lives in `useState`, so navigating away and back refetches every time — no React Query cache, no `staleTime`.
- `useRecentActivity` runs its own pair of sequential queries against the same two tables, duplicating work.
- `isNewUser` is computed in an effect after mount, so any UI keyed off it also flips on second render.

## Plan

### 1. Gate layout on a single readiness flag (stops the flicker)

In `src/pages/Dashboard.tsx`:

- Replace the `useState` for `dashboardStats` with a React Query hook (see step 2) that exposes `isLoading`.
- Compute `isReady = !statsLoading && !knowledgeReadiness.isLoading && !subscriptionLoading`.
- While `!isReady`, render a stable skeleton that matches the established-user layout (header + 4 quick action card placeholders + usage widget placeholder + recent activity list placeholder + optional sidebar placeholder). This is the same shape most users land on, so the post-load swap is invisible.
- Only branch into `DashboardEmptyState` vs. the established layout once `isReady` is true. This removes the empty-state → established-layout flip.
- Move `isNewUser` calculation into a `useMemo` derived directly from `session.user.created_at` so it is correct on first render (no effect-driven flip).
- Stabilize `showSidebar` so it cannot toggle after the first ready render: compute it once from the resolved data and keep the column structure consistent.

### 2. Replace `fetchDashboardStats` with a cached, count-only query

Create `src/hooks/use-dashboard-stats.ts`:

- Single React Query (`queryKey: ['dashboard-stats', userId]`, `staleTime: 60_000`).
- Run both counts in parallel with `Promise.all`, using head+count so no rows are transferred:
  ```ts
  const [{ count: projectCount }, { count: knowledgeCount }] = await Promise.all([
    supabase.from('projects').select('project_id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('knowledge_entries').select('entry_id', { count: 'exact', head: true }).eq('user_id', userId),
  ]);
  ```
- Return `{ projectCount, knowledgeCount, hasProjects, hasKnowledgeEntries, isLoading }`.
- Use this hook in `Dashboard.tsx` in place of the inline state + effect.

### 3. Parallelize and cache `useRecentActivity`

In `src/hooks/useRecentActivity.ts`:

- Convert from `useEffect` + `useState` to a React Query hook (`queryKey: ['recent-activity', userId]`, `staleTime: 60_000`).
- Run the `projects` and `knowledge_entries` queries in parallel with `Promise.all` instead of sequential `await`s.
- Keep the same return shape (`recentActivity`, `isLoading`) so callers don’t change.

### 4. Verification

- Sign in fresh and watch the dashboard: no empty-state → established swap, no sidebar pop-in, skeleton transitions smoothly to real data.
- Network tab: `dashboard-stats` issues two HEAD requests (no row payloads), `recent-activity` issues two parallel requests, no duplicate `projects`/`knowledge_entries` calls between the two hooks beyond the intentional ones.
- Navigating to another page and back uses cached data (no spinner if within `staleTime`).

## Out of scope

- Subscription/profile/organization hooks (already optimized in the previous pass).
- Visual redesign of the dashboard sections — only the loading behavior and data fetching change.
- Server-side aggregation or new RPCs; we stick with PostgREST `head: true` counts.

## Files to change

- `src/pages/Dashboard.tsx` — gate layout on readiness, derive `isNewUser` synchronously, render skeleton during load, consume the new stats hook.
- `src/hooks/use-dashboard-stats.ts` — new React Query hook with parallel head-count queries.
- `src/hooks/useRecentActivity.ts` — convert to React Query, parallelize the two fetches.
