

## Plan: Display Actual Prices with Annual-by-Default Toggle

### Problem
Prices show without "/month" labels, and billing defaults to monthly instead of annual.

### Changes

**1. `src/components/blocks/pricing/PricingProvider.tsx`**
- Change default state from `useState(true)` to `useState(false)` so `isMonthly` starts as `false` (annual by default)

**2. `src/components/blocks/pricing/PricingCard.tsx`**
- When annual is selected, display the per-month equivalent (yearlyPrice / 12) instead of the total annual price
- Update the period label: always show "/month", with "billed annually" or "billed monthly" subtitle
- For Starter: show "$0" with "Always free"
- For Enterprise annual: show "$449/month" with "billed annually"

**3. `src/components/subscription/SubscriptionPlans.tsx`**
- Change default `billingInterval` from `'monthly'` to `'annual'`
- When annual is selected, show per-month equivalent prices:
  - Basic: $39/mo (billed annually at $470/yr)
  - Pro: $79/mo (billed annually at $950/yr)
  - Enterprise: $449/mo (billed annually at $5,388/yr)
- Add "billed annually" / "billed monthly" subtitle under each price
- Starter stays "$0/forever"

**4. `src/components/blocks/pricing/BillingToggle.tsx`**
- Update save text: "Annual (Save 20%)" — already correct, no change needed
- Confetti fires on annual toggle — already works since annual is `checked=true`

### Price display logic (both components)
```
Monthly selected:   $49/month  — "billed monthly"
Annual selected:    $39/month  — "billed annually at $470/yr"
```

