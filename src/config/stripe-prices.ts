/**
 * Single source of truth for Stripe Price IDs.
 *
 * IMPORTANT: These must be Stripe **Price** IDs (start with `price_`),
 * NOT Product IDs (`prod_`). Stripe Checkout will reject `prod_` IDs.
 *
 * To find them: Stripe Dashboard → Products → click product → "Pricing" section.
 *
 * Used by:
 *  - src/components/blocks/pricing-demo.tsx (public marketing pricing page)
 *  - src/components/subscription/UpgradeButton.tsx (in-app /subscription page)
 */
export const STRIPE_PRICE_IDS = {
  growth: {
    monthly: 'price_1QlhMNCcQ0GhLgJorKCY8aBE',
    annual: 'price_1QlhMNCcQ0GhLgJoVMuDzJRp',
  },
  business: {
    monthly: 'price_1QlhNHCcQ0GhLgJo8NIFKtlo',
    annual: 'price_1QlhNHCcQ0GhLgJoKuBKfXLa',
  },
} as const;

export type PaidPlanSlug = keyof typeof STRIPE_PRICE_IDS;
export type BillingInterval = 'monthly' | 'annual';

export function getPriceId(plan: PaidPlanSlug, interval: BillingInterval): string {
  return STRIPE_PRICE_IDS[plan][interval];
}
