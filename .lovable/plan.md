

## Plan: Billing and Account Management Routes

### Current State

Everything requested **already exists** as components — the routes just need wiring:

- `/account` — **Already works** (line 90 of App.tsx). Full account settings page with profile, credentials, subscription card, billing history, brand guidelines, delete account.
- `/billing` — No route exists, but all billing components exist: `BillingHistory`, `SubscriptionCard` (745 lines with cancel/renew/upgrade), `SubscriptionManager` (364 lines with usage, payment method, plan comparison).
- `/settings` — No route, but `OrganizationSettings` component exists.

### Changes

#### 1. Create `/billing` page — `src/pages/Billing.tsx`
A standalone billing dashboard that composes existing components:
- `SubscriptionCard` — current plan with cancel/renew
- `BillingHistory` — invoice list with PDF download
- `SubscriptionManager` — usage stats, payment method, plan comparison
- Link to Stripe portal for payment method updates via existing `renew-subscription` edge function

#### 2. Add routes to `App.tsx`
- `/billing` → new Billing page
- `/settings` → redirect to `/account` (already comprehensive)

#### 3. No new components needed
All UI pieces exist. The Billing page is a composition of `SubscriptionCard`, `SubscriptionManager`, and `BillingHistory` with a clean header layout.

### Files

| File | Action |
|------|--------|
| `src/pages/Billing.tsx` | **Create** — billing dashboard composing existing components |
| `src/App.tsx` | **Modify** — add `/billing` route and `/settings` redirect to `/account` |

### No database or edge function changes needed.

