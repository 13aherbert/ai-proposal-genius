
/**
 * Subscription plan limits matching pricing_tiers table.
 * projects: -1 means unlimited
 * users: -1 means unlimited
 */
export const SUBSCRIPTION_PLAN_LIMITS = {
  starter: { projects: 6, users: 1 },
  growth: { projects: 36, users: -1 },
  business: { projects: 120, users: -1 },
  enterprise: { projects: -1, users: -1 },
  // Legacy aliases
  trial: { projects: 6, users: 1 },
  basic: { projects: 36, users: -1 },
  pro: { projects: 120, users: -1 },
};

/** Resolve project limit from a plan slug */
export function getProjectLimit(planSlug: string): number {
  const key = planSlug.toLowerCase() as keyof typeof SUBSCRIPTION_PLAN_LIMITS;
  return SUBSCRIPTION_PLAN_LIMITS[key]?.projects ?? SUBSCRIPTION_PLAN_LIMITS.starter.projects;
}

/** Resolve user limit from a plan slug */
export function getUserLimit(planSlug: string): number {
  const key = planSlug.toLowerCase() as keyof typeof SUBSCRIPTION_PLAN_LIMITS;
  return SUBSCRIPTION_PLAN_LIMITS[key]?.users ?? 1;
}

/** Check if a plan has unlimited users */
export function hasUnlimitedUsers(planSlug: string): boolean {
  return getUserLimit(planSlug) === -1;
}
