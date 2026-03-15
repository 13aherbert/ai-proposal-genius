

## Plan: Fix Stale "3 Projects" References and Legacy Tier Data

The "3 projects" free tier count appears in 6 locations, and several files still reference the old Basic/Pro tier structure instead of the current Starter/Growth/Business/Enterprise model.

### Changes

**1. `src/components/subscription/TrialExpiredBanner.tsx`** — Line 18: `projectLimit = 3` → `projectLimit = 6`

**2. `src/components/subscription/TrialCountdown.tsx`** — Line 28: `projectLimit = 3` → `projectLimit = 6`

**3. `src/components/auth/onboarding/OnboardingRouter.tsx`** — Line 241: `"Up to 3 projects"` → `"6 projects per year"`

**4. `src/pages/Index.tsx`** — Line 39: SEO description `"Free plan with 3 projects"` → `"Free plan with 6 projects per year"`

**5. `src/components/blocks/faq.tsx`** — Full rewrite of FAQ pricing content:
- Line 17: `"up to 3 projects"` → `"6 projects per year"`
- Lines 28-41: Replace old Starter ($49/mo, 10 projects) / Pro ($99/mo, 30 projects) with current Growth ($199/mo, 36 projects/yr) / Business ($499/mo, 120 projects/yr) tiers

**6. `src/services/admin/userService.ts`** — Lines 570-575: Update project limits from old values (`3`/`10`/`30`) to current model (`6`/`36`/`120`) and fix plan name keys from `pro`/`starter` to `growth`/`business`/`enterprise`

**7. `src/pages/SubscriptionSuccess.tsx`** — Lines 67-90: Replace old `pro`/`basic` feature lists with current `growth`/`business`/`enterprise` tier features and correct project counts

### Files Touched (7)
`TrialExpiredBanner.tsx`, `TrialCountdown.tsx`, `OnboardingRouter.tsx`, `Index.tsx`, `faq.tsx`, `userService.ts`, `SubscriptionSuccess.tsx`

