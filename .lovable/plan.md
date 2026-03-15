

## Plan: Fix Wrong $49 Pricing Across Codebase

The Growth plan is $199/mo, but several files still show an old "$49/mo" price. Two comparison pages are the primary culprits, plus a few legacy references elsewhere.

### Changes

**1. `src/pages/CompareLoopio.tsx`**
- Line 12: `"Free / $49/mo"` → `"Free / $199/mo"`
- Line 94: `"paid plans begin at just $49/month"` → `"paid plans begin at $199/month"`
- Also update "3 projects free" → "6 projects free" (line 13 and body text) to match current Starter tier

**2. `src/pages/CompareAutoRFP.tsx`**
- Line 12: `"Free / $49/mo"` → `"Free / $199/mo"`
- Line 53 area (hero quick verdict): update any `$49` references
- Body text mentioning "$49/month" → "$199/month"

**3. `src/pages/SubscriptionSuccess.tsx`**
- Line 61: `case 'basic': return '$49/month'` → remove or update legacy `basic` case (this maps to old plan naming)

**4. `src/components/subscription/DowngradeOption.tsx`**
- Line 51: `{ plan: 'basic', name: 'Basic', price: '$49/mo' }` → update or remove stale `basic` tier reference

**5. `src/components/organization/OrganizationCreator.tsx`**
- Line 212-213: Remove/update stale "Basic ($49/month)" and "Pro ($99/month)" select options to match current tier names (Starter/Growth/Business/Enterprise)

### Files Touched
- `src/pages/CompareLoopio.tsx`
- `src/pages/CompareAutoRFP.tsx`
- `src/pages/SubscriptionSuccess.tsx`
- `src/components/subscription/DowngradeOption.tsx`
- `src/components/organization/OrganizationCreator.tsx`

