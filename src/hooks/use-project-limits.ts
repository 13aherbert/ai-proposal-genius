import { useState, useEffect, useRef, useCallback } from "react";
import { useSubscription } from "@/hooks/use-subscription";
import { getSafeProjectLimit, normalizePlanType, isUserOfPlanType } from "./subscription/feature-access";
import { SUBSCRIPTION_PLAN_LIMITS } from "@/types/subscription";
import { User } from "@supabase/supabase-js";

type LogLevel = 'debug' | 'info' | 'warn' | 'error';
const LOG_LEVEL: LogLevel = 'error'; // Can be 'debug', 'info', 'warn', 'error'

// Helper function to conditionally log based on level
const conditionalLog = (level: LogLevel, ...args: any[]) => {
  const logLevelMap = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  // Only log if the current level is greater than or equal to the configured level
  if (logLevelMap[level] >= logLevelMap[LOG_LEVEL]) {
    console[level](...args);
  }
};

export function useProjectLimits(user: User | null) {
  const { data: subscriptionData } = useSubscription();
  const [forceStarterPlan, setForceStarterPlan] = useState(false);
  const [projectLimitApplied, setProjectLimitApplied] = useState(false);
  const lastProjectLimitUpdateTime = useRef<number>(0);
  const isStarterUserRef = useRef<boolean | null>(null);
  
  // Check if user is a starter user based on subscription data
  useEffect(() => {
    if (!user) return;
    
    // Check subscription data for plan type
    const isUserStarter = isUserOfPlanType('starter');
    isStarterUserRef.current = isUserStarter;
    
    if (isUserStarter) {
      conditionalLog('info', `*** STARTER USER DETECTED - SETTING STARTER PLAN ***`);
      setForceStarterPlan(true);
      
      try {
        localStorage.setItem('userIsStarter', 'true');
        sessionStorage.setItem('userIsStarter', 'true');
        localStorage.setItem('projectLimit', SUBSCRIPTION_PLAN_LIMITS.starter.toString());
      } catch (e) {
        conditionalLog('error', "Failed to store starter flags in storage", e);
      }
    }
  }, [user]);
  
  const getProjectLimit = useCallback(() => {
    // Debounce project limit updates to prevent rapid consecutive updates
    const now = Date.now();
    if (now - lastProjectLimitUpdateTime.current < 5000) {
      conditionalLog('info', "Skipping project limit update - too soon since last update");
      return null; // Skip update
    }
    
    lastProjectLimitUpdateTime.current = now;
    
    if (forceStarterPlan || isStarterUserRef.current || isUserOfPlanType('starter')) {
      conditionalLog('info', "CRITICAL: Using starter plan limit (10 projects)");
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    if (subscriptionData) {
      conditionalLog('debug', "Current subscription data:", subscriptionData);
      
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      
      if (normalizedPlan === 'starter') {
        conditionalLog('info', `CRITICAL: Starter plan detected, ENFORCING ${SUBSCRIPTION_PLAN_LIMITS.starter} projects limit (stored: ${subscriptionData.project_limit})`);
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      } else if (normalizedPlan === 'business') {
        return SUBSCRIPTION_PLAN_LIMITS.business;
      } else if (normalizedPlan === 'growth') {
        return SUBSCRIPTION_PLAN_LIMITS.growth;
      } else if (normalizedPlan === 'enterprise') {
        return SUBSCRIPTION_PLAN_LIMITS.enterprise;
      }
      
      const safeLimit = getSafeProjectLimit(
        normalizedPlan,
        subscriptionData.project_limit
      );
      
      conditionalLog('debug', `Plan type: ${normalizedPlan}, Safe limit: ${safeLimit}`);
      return safeLimit;
    }
    
    // Fallback checks without a full subscription record
    if (forceStarterPlan || isStarterUserRef.current || isUserOfPlanType('starter')) {
      return SUBSCRIPTION_PLAN_LIMITS.starter;
    }
    
    try {
      const storedData = localStorage.getItem('subscriptionData');
      if (storedData) {
        const data = JSON.parse(storedData);
        if (data && normalizePlanType(data.plan_type) === 'starter') {
          conditionalLog('info', 'Using stored starter plan data from localStorage');
          return SUBSCRIPTION_PLAN_LIMITS.starter;
        } else if (data && normalizePlanType(data.plan_type) === 'pro') {
          conditionalLog('info', 'Using stored pro plan data from localStorage');
          return SUBSCRIPTION_PLAN_LIMITS.pro;
        }
      }
      
      if (localStorage.getItem('userIsStarter') === 'true' || 
          sessionStorage.getItem('userIsStarter') === 'true') {
        conditionalLog('info', 'Found userIsStarter flag, using starter plan limit');
        return SUBSCRIPTION_PLAN_LIMITS.starter;
      }
      
      const storedLimit = localStorage.getItem('projectLimit');
      if (storedLimit) {
        const limitValue = parseInt(storedLimit, 10);
        conditionalLog('info', `Found projectLimit=${limitValue} in localStorage`);
        return limitValue;
      }
    } catch (e) {
      conditionalLog('error', 'Error checking localStorage:', e);
    }
    
    return SUBSCRIPTION_PLAN_LIMITS.starter;
  }, [subscriptionData, forceStarterPlan]);
  
  const determineDisplayLimit = useCallback((currentLimit: number | null) => {
    // Check for starter user based on subscription
    if (forceStarterPlan || isStarterUserRef.current || isUserOfPlanType('starter')) {
      conditionalLog('debug', "Using STARTER plan limit: 10 projects");
      return SUBSCRIPTION_PLAN_LIMITS.starter; // 10 projects
    }
    // Check for pro user based on subscription
    else if (isUserOfPlanType('pro')) {
      conditionalLog('debug', "Using PRO plan limit: 30 projects");
      return SUBSCRIPTION_PLAN_LIMITS.pro; // 30 projects  
    }
    // Otherwise use subscription data if available
    else if (subscriptionData) {
      const normalizedPlan = normalizePlanType(subscriptionData.plan_type);
      const limit = getSafeProjectLimit(normalizedPlan, subscriptionData.project_limit);
      conditionalLog('debug', `Using subscription-based limit for ${normalizedPlan} plan: ${limit} projects`);
      return limit;
    }
    // Use current limit as fallback
    else if (currentLimit) {
      conditionalLog('debug', `Using fallback project limit: ${currentLimit} projects`);
      return currentLimit;
    }
    
    return SUBSCRIPTION_PLAN_LIMITS.starter;
  }, [subscriptionData, forceStarterPlan]);
  
  return {
    forceStarterPlan,
    isStarterUserRef,
    projectLimitApplied,
    setProjectLimitApplied,
    getProjectLimit,
    determineDisplayLimit
  };
}
