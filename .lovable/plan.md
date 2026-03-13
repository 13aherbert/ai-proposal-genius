

## Plan: Update Stripe Webhook for Tier-Based User Limits

### Problem
The stripe webhook uses stale plan names (starter/basic/pro) with hardcoded project limits (3/10/30). It doesn't reference `pricing_tiers` for `users_limit`, doesn't notify users about unlimited team access on upgrade, and doesn't handle downgrade warnings when a paid user with multiple team members cancels back to Starter.

### Changes

**1. Update `supabase/functions/_shared/subscription-limits.ts`**
- Update limits to match current model: starter=12, growth=36, business=120, enterprise=-1

**2. Update `supabase/functions/stripe-webhook/index.ts`**

**`checkout.session.completed`:**
- After determining `planType`, look up the matching `pricing_tiers` row to get `projects_limit` and `users_limit`
- Use `pricing_tiers.projects_limit` instead of hardcoded constants for `project_limit`
- Map plan names: growth→growth, business→business, enterprise→enterprise (replace old basic/pro logic)
- If the tier has `users_limit === -1` (any paid tier), invoke the `send-email` function to notify the user that unlimited team invites are now available
- To get the user's email: query `auth.users` or `profiles` using `session.client_reference_id`

**`customer.subscription.updated`:**
- After fetching subscription data, determine the new plan type from the Stripe subscription item
- Look up the new `pricing_tiers` row
- Update `plan_type` and `project_limit` in the `subscriptions` table (currently only updates status/cancel fields)
- If downgrading to starter (`users_limit !== -1`), count the user's `organization_members` 
- If team size > 1, insert a row into a new `downgrade_warnings` concept — or simpler: invoke `send-email` with a warning that they have 30 days to reduce team size or re-upgrade
- Update subscription record with new plan_type and project_limit

**`customer.subscription.deleted`:**
- Replace the stale downgrade to `trial` with plan_type=`starter`, project_limit=12 (not 3)
- Add the same team-size check: count org members, send downgrade warning email if > 1

**3. New email template (optional but recommended): `TeamUnlockedEmail` and `DowngradeWarningEmail`**
- `TeamUnlockedEmail`: "You can now invite unlimited team members"
- `DowngradeWarningEmail`: "Your plan is changing to Starter (1 user). You currently have X team members. You have 30 days to adjust."
- If creating full templates is too heavy, use the existing `send-email` function with `html` body content directly (the function already supports raw HTML)

### Files touched
- **Modified**: `supabase/functions/_shared/subscription-limits.ts`
- **Modified**: `supabase/functions/stripe-webhook/index.ts`

