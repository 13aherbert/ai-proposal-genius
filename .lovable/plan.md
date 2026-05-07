## Diagnosis

The flashing `Loading subscription data...` state is coming from the `/upload-rfp` project creation page. I found three contributing issues:

1. **Refresh loop in `use-rfp-upload`**
   - The hook compares the subscription row’s stored `project_limit` with the app’s normalized plan limits.
   - Current app constants are `starter=6`, `growth/basic=36`, `business/pro=120`.
   - Existing database rows still contain older limits like `starter=3`, `starter=10`, `pro=30`.
   - When a mismatch is detected, the hook calls `refreshSubscription()`, which toggles subscription loading back to `true`. Since refreshing does not repair the database value, the mismatch remains and the loading indicator can flash repeatedly.

2. **Duplicate project-count polling/fetching**
   - `UploadRFP.tsx` calls `fetchProjectCount()` when the subscription object changes.
   - `use-rfp-upload.ts` also calls `fetchProjectCount()` when the subscription changes.
   - `UploadRFP.tsx` additionally polls project count every 10 seconds.
   - This creates unnecessary re-renders around the same UI area.

3. **Missing organization subscription rows in live data**
   - A read-only database check shows several profiles have a `current_organization_id` but no matching `organization_subscriptions` row.
   - The provider has a fallback path, but because project creation depends on subscription loading and project count together, missing rows can keep this flow fragile.

## Plan

### 1. Stop the subscription refresh loop

Update `src/hooks/use-rfp-upload.ts` so it no longer calls `refreshSubscription()` just because `subscriptionData.project_limit` differs from the normalized app limit.

Instead:
- Use the normalized app limit for UI gating.
- Treat the database `project_limit` as legacy/possibly stale display data.
- Keep `refreshSubscription()` only for explicit user-triggered refresh actions.

This directly addresses the flashing spinner.

### 2. Stabilize the upload page loading state

Update `src/pages/UploadRFP.tsx` to avoid tying project-count fetching to the entire `subscription` object identity.

Changes:
- Depend on stable fields like `session?.user?.id` and `subscription?.subscription_id` or remove the duplicate subscription-triggered fetch entirely if `use-rfp-upload` already handles it.
- Remove or reduce the 10-second polling; project count only needs to refresh on mount, after upload/import, and on explicit refresh.
- Make the loading message appear only during the initial load, not during background refreshes.

### 3. Make subscription loading resilient to legacy/missing rows

Update `src/hooks/subscription/providers/SubscriptionProvider.tsx` to make fallback behavior safer:
- If an organization subscription row is missing, create/use the in-memory starter subscription fallback immediately so consumers can render.
- Ensure `setIsLoading(false)` always happens after fallback paths.
- Avoid toggling global subscription loading for background refreshes unless this is an explicit manual refresh.

### 4. Align default subscription limits in code/database migrations

Add a migration to normalize future and existing organization subscription data:
- Update default organization subscription creation to use current plan limits (`starter=6`, `growth/basic=36`, `business/pro=120`, `enterprise=-1`).
- Backfill existing `organization_subscriptions` rows with legacy plan names/limits to current normalized values.
- Insert missing `organization_subscriptions` rows for organizations that currently have members/profile references but no subscription, defaulting to active starter with 6 projects.

### 5. Verify the fix

After implementation:
- Open `/upload-rfp` while signed in.
- Confirm `Loading subscription data...` appears only briefly on first load and does not flash repeatedly.
- Confirm project usage displays correctly.
- Confirm creating/uploading a project still respects plan limits.
- Check console/network for repeated subscription fetches or refresh-loop logs.

## Expected outcome

The project creation page should stop flashing the subscription loading wheel, use stable project-limit calculations, avoid unnecessary refetches, and remain correct even for older accounts with legacy or missing organization subscription rows.