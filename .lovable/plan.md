

## Plan: Fix Signup CTA Buttons

### Root Cause

Two distinct bugs:

**Bug 1 — PricingCard signup dialog has broken layout**: In `PricingCard.tsx` line 190, `<AuthForm defaultView="sign_up" />` is missing `variant="dialog"`. The default `variant="page"` applies `min-h-screen` styling inside the dialog, making the signup form render with full-page layout crammed into a modal. This causes visual breakage and is likely what users report as "auth errors" or "doesn't work."

**Bug 2 — Comparison page CTAs go to homepage, not signup**: Both `CompareLoopio.tsx` and `CompareAutoRFP.tsx` sticky CTAs link to `/` with `<Link to="/">`. Users land on the homepage but have to find the signup button themselves.

### Changes

**1. `src/components/blocks/pricing/PricingCard.tsx`** — Line 190: Add `variant="dialog"` to the AuthForm inside the Dialog:
```tsx
<AuthForm defaultView="sign_up" variant="dialog" />
```

**2. `src/pages/CompareLoopio.tsx`** and **`src/pages/CompareAutoRFP.tsx`** — Replace the sticky CTA `<Link to="/">` with a Dialog that opens the signup form directly, or change the link to `/?view=sign_up`.

**3. `src/pages/Index.tsx`** — Add URL parameter handling: if `?view=sign_up` is present, auto-open a signup dialog on mount. This enables deep-linking to signup from comparison pages and external links.

### Files Touched (4)
`PricingCard.tsx`, `CompareLoopio.tsx`, `CompareAutoRFP.tsx`, `Index.tsx`

