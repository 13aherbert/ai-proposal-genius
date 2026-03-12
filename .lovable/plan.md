

## Plan: Replace Trial Messaging with Free Plan Messaging

### Problem
Multiple components still use "Trial Active," trial countdowns, and expiration language instead of the usage-based "Free Plan" framing established in the monetization strategy.

### Changes

**1. `src/components/account/SubscriptionCard.tsx`**
- `getStatusDescription`: Change `'trialing'` → `'Free Plan'` (instead of `'Trial Active'`)
- `defaultTrial` object (line ~97): Change `status: 'trialing'` → `status: 'active'`, `plan_type: 'trial'` → `plan_type: 'starter'`
- Remove the trial expiration badge block (lines 492-497) that shows "Trial expires in X days"
- Add usage-based info instead: "Projects: 0 of 3 used · Upgrade anytime"
- Update upgrade dialog text for `trial` plan type to say "Free Plan" instead of "Keep Free Plan"

**2. `src/components/dashboard/WelcomeMessage.tsx`**
- Change `plan !== 'trial'` check so trial users see a "Free Plan" badge instead of the generic fallback text
- Show `Free Plan` badge for trial/starter, plan name badge for paid plans

**3. `src/components/subscription/TrialCountdown.tsx`**
- Replace trial countdown logic with usage-based messaging (e.g., "Free Plan — X of 3 projects used")
- Remove time-based urgency levels, replace with usage-percentage color coding (green <70%, orange 70-90%, red >90%)

**4. `src/components/subscription/TrialExpiredBanner.tsx`**
- Replace "trial has expired" messaging with "You've reached your project limit" or remove entirely (since there's no expiration on free plans)

**5. `src/components/subscription/UpgradeBanner.tsx`**
- Replace "You're on a free trial" with "You're on the Free Plan"
- Remove `isTrialExpired` check (no expiration concept)

**6. `src/hooks/subscription/feature-access.ts`**
- Remove `isTrialExpired` function (no longer needed — free plan doesn't expire)
- Keep `normalizePlanType` mapping `'trial'` → `'starter'` for backward compatibility

