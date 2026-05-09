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
    monthly: 'price_1QtVG4CcQ0GhLgJo2eeXvzLn',
    annual: 'price_1QtVG4CcQ0GhLgJokdbitinB',
  },
  business: {
    monthly: 'price_1QtVHQCcQ0GhLgJoRBDC9L4g',
    annual: 'price_1QtVHQCcQ0GhLgJos7ptpj8X',
  },
} as const;

export type PaidPlanSlug = keyof typeof STRIPE_PRICE_IDS;
export type BillingInterval = 'monthly' | 'annual';

export function getPriceId(plan: PaidPlanSlug, interval: BillingInterval): string {
  return STRIPE_PRICE_IDS[plan][interval];
}
