## Update Stripe Price IDs

Replace the placeholder price IDs in `src/config/stripe-prices.ts` with the real ones you just provided:

```ts
export const STRIPE_PRICE_IDS = {
  growth: {
    monthly: 'price_1QtVG4CcQ0GhLgJo2eeXvzLn',
    annual:  'price_1QtVG4CcQ0GhLgJokdbitinB',
  },
  business: {
    monthly: 'price_1QtVHQCcQ0GhLgJoRBDC9L4g',
    annual:  'price_1QtVHQCcQ0GhLgJos7ptpj8X',
  },
} as const;
```

That's the only file change — `pricing-demo.tsx` and `UpgradeButton.tsx` already pull from this config, so they'll pick up the new IDs automatically.

### After approval — quick smoke test
1. Sign up a test user.
2. Go to `/pricing`, toggle Monthly/Annual, click Growth and Business.
3. Confirm Stripe Checkout opens with the correct plan + interval (no "No such price" error).
4. Pay with test card `4242 4242 4242 4242`.
5. Confirm `subscriptions` row gets created with the right `user_id`, `plan_type`, and `billing_interval` via the webhook.
