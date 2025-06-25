
import { useState, useEffect, useCallback } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { getSafeProjectLimit, normalizePlanType } from "./subscription/feature-access";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { User } from "@supabase/supabase-js";

export function useProjectLimits(user: User | null) {
  const { data: subscriptionData } = useSubscription();
  
  const getProjectLimit = useCallback(() => {
    if (subscriptionData) {
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      return getSafeProjectLimit(normalizedPlan, subscriptionData.project_limit);
    }
    
    return SUBSCRIPTION_PLAN_LIMITS.trial;
  }, [subscriptionData]);
  
  const determineDisplayLimit = useCallback((currentLimit: number | null) => {
    if (subscriptionData) {
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      return getSafeProjectLimit(normalizedPlan, subscriptionData.project_limit);
    }
    
    return currentLimit || SUBSCRIPTION_PLAN_LIMITS.trial;
  }, [subscriptionData]);
  
  return {
    getProjectLimit,
    determineDisplayLimit
  };
}
