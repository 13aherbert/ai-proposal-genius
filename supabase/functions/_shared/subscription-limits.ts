
/**
 * Subscription plan limits matching pricing_tiers table.
 * projects: -1 means unlimited
 * users: -1 means unlimited
 */
export const SUBSCRIPTION_PLAN_LIMITS = {
  starter: { projects: 12, users: 1 },
  growth: { projects: 36, users: -1 },
  business: { projects: 120, users: -1 },
  enterprise: { projects: -1, users: -1 },
};

/** Resolve project limit from a plan slug */
export function getProjectLimit(planSlug: string): number {
  const key = planSlug.toLowerCase() as keyof typeof SUBSCRIPTION_PLAN_LIMITS;
  return SUBSCRIPTION_PLAN_LIMITS[key]?.projects ?? SUBSCRIPTION_PLAN_LIMITS.starter.projects;
}

/** Check if a plan has unlimited users */
export function hasUnlimitedUsers(planSlug: string): boolean {
  const key = planSlug.toLowerCase() as keyof typeof SUBSCRIPTION_PLAN_LIMITS;
  return (SUBSCRIPTION_PLAN_LIMITS[key]?.users ?? 1) === -1;
}
