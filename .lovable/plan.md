

## Plan: Fix Enterprise UX and Team Invitation Flow

### Issues Found

1. **Critical: Subscription fetch error spam** — `src/hooks/use-subscription.ts` uses `.single()` (lines 81 and 123) when querying the `subscriptions` table. When a user has no subscription row, Supabase returns `PGRST116` ("Cannot coerce the result to a single JSON object"), which triggers repeated error logs and breaks downstream features like the team invitation's `canAddUser` check.

2. **Team invitation flow** — The `MemberInvitation` component and `team-invite` Edge Function are correctly implemented. However, the subscription error above causes `useSubscriptionFeatures` to fail, which means `canAddUser()` and `pricingTier` may return incorrect/null values, potentially blocking invitations or showing wrong limits.

### Changes

**1. Fix `src/hooks/use-subscription.ts`** — Replace `.single()` with `.maybeSingle()` in both the main fetch (line 81) and the background refresh (line 123). Handle `null` data gracefully instead of throwing. This matches the pattern already used in `SubscriptionProvider.tsx` (line 161).

**2. Fix `src/hooks/use-subscription.ts` background refresh** — Same `.maybeSingle()` fix on line 123.

**3. Verify `use-subscription-features` resilience** — Confirm that when no subscription exists, the features hook falls back to a starter plan default so that `canAddUser` and `getUserLimitDisplay` return sensible values.

### Files Modified

| File | Change |
|------|--------|
| `src/hooks/use-subscription.ts` | Replace `.single()` with `.maybeSingle()` in 2 locations; handle null without throwing |

This is a targeted fix — the team invitation UI, Edge Function, and organization dashboard components are all correctly wired. The subscription query error is the single root cause blocking the enterprise UX from working smoothly.

