## Goal
Make the Projects list and Knowledge Base page feel instant by removing redundant queries, slimming payloads, lazy-loading non-visible panels, and adding the right DB indexes.

## What's slow today

**Knowledge Base page** fires **5+ independent queries on mount**, several of them duplicates or unnecessary:
1. `useKnowledgeBase` (search infra)
2. `useEntries` — paginated entries, runs **count + data sequentially** (2 round-trips)
3. `useKnowledgeReadiness` — pulls every entry's `content` + `parsed_content` just to count categories (huge payload on a populated KB)
4. `KnowledgeBase.tsx` — separate `select('category, updated_at')` over all entries (third pass on the same table)
5. `useKBGovernance` — runs **on mount even though the Governance panel is hidden**: re-fetches the user's org via its own profile query, then 3 more selects (`kb_review_cycles`, `kb_health_scores`, `kb_qa_pairs`)
6. `useStarterTemplates` — also runs on mount
7. `RecentEntries` calls `fetchEntries()` in a `useEffect` even though react-query already auto-fetches → duplicate request on every category change

**Projects list (`useProjects`)**:
- Sequential **count query + data query** (2 round-trips per page)
- Hard-coded `setTimeout(500ms)` "dev delay" still in the fetch path
- Waits up to 5s on `useCurrentOrganization` before firing
- `useCurrentOrganization` itself does **profile then organizations** as 2 sequential round-trips

**Project detail (`use-project-details`)**:
- Custom retry-with-backoff (1s/2s/3s) **wrapped inside** react-query's own `retry: 3` → up to 9 attempts on a real "not found", multi-second blocking spinner

## Plan

### Phase 1 — Knowledge Base (biggest win)
- **Lazy-load `useKBGovernance`**: only run when `showGovernance` is true. Pass an `enabled` flag.
- **Replace `useKnowledgeReadiness` payload**: select only `category` (drop `content`/`parsed_content`); detect template-only categories via a separate, cheap `head: true` count grouped by category, or move template detection to KB-server side. Convert hook to react-query with org-keyed `staleTime: 5min` so navigating away/back is instant.
- **Merge category-dates fetch into `useKnowledgeReadiness`** (one trip instead of two over the same table). Convert to react-query.
- **Combine count+data in `useEntries`** using a single `select('*', { count: 'exact' }).range(from, to)` call. Drop unused columns from the select.
- **Remove duplicate `fetchEntries()` effect in `RecentEntries`** (react-query handles it via the queryKey).
- **Defer `useStarterTemplates` seeding** to idle / first KB write instead of mount.

### Phase 2 — Projects
- **Single round-trip in `useProjects`**: `select('project_id,title,status,…', { count: 'exact' }).range()` instead of separate count + data queries.
- **Remove the `process.env.NODE_ENV === 'development'` 500ms delay** from `fetchProjects`.
- **Collapse `useCurrentOrganization` into one query** using a Supabase relational select: `profiles.select("current_organization_id, organization:organizations!profiles_current_organization_id_fkey(*)").eq("profile_id", uid).single()`. Falls from 2 → 1 round-trip and shaves ~150–300ms off every page that depends on org.
- **Drop the 5s "org loading" timeout branch in `useProjects`** once the above merge lands (org resolves much faster).
- **Prefetch projects on Dashboard / app-shell mount** via `queryClient.prefetchQuery` so opening `/projects` is instant when coming from Dashboard.

### Phase 3 — Project detail
- **Remove the custom retry loop in `fetchProjectWithRetry`** and rely on react-query's `retry`/`retryDelay` only. Cuts worst-case wait from ~9s to ~3s and removes the double-spinner experience.

### Phase 4 — Database indexes
Add covering indexes (verify via `pg_indexes` first; create only if missing):
- `projects (user_id, organization_id, last_update_at DESC)` — matches the list query order/filters
- `knowledge_entries (organization_id, category)` — for readiness + category counts
- `knowledge_entries (user_id, updated_at DESC)` — for `useEntries` ordering
- `knowledge_entries USING gin (to_tsvector('english', coalesce(title,'') || ' ' || coalesce(content,'')))` — only if KB search latency shows up; defer otherwise

Migration will be a single SQL file with `CREATE INDEX IF NOT EXISTS …` statements. No table or RLS changes.

### Phase 5 — Verify
- Reload `/knowledge-base` cold and warm: confirm only 2–3 KB requests on first paint (entries + readiness + categories combined), 0 governance requests until panel opened.
- Reload `/projects`: confirm 1 list request (no separate count), no 500ms artificial delay.
- Open a project: confirm spinner ≤ ~1s on cache hit, ≤ 3s on miss.
- Confirm no regressions in pagination, search, governance panel, KB seeding.

## Out of scope
- Server-side full-text search migration for KB (separate effort)
- Edge-function cold start tuning
- Changes to RLS policies or table schemas (only indexes)

## Files expected to change
- `src/components/knowledge-base/governance/useKBGovernance.ts` (lazy enable, use `useCurrentOrganization`)
- `src/components/knowledge-base/RecentEntries.tsx` (remove duplicate effect)
- `src/components/knowledge-base/entries/useEntries.ts` (combine count+data)
- `src/components/knowledge-base/hooks/useStarterTemplates.ts` (defer)
- `src/hooks/use-knowledge-readiness.ts` (slim payload, react-query, merge category-dates)
- `src/pages/KnowledgeBase.tsx` (drop direct category-dates query, pass it from readiness)
- `src/hooks/use-projects.ts` (combined query, drop dev delay, drop org timeout)
- `src/hooks/use-current-organization.ts` (single relational query)
- `src/hooks/use-project-details.ts` (drop custom retry)
- One Supabase migration adding indexes
