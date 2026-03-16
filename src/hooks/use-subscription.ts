import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionData, setSubscriptionData } from "@/utils/network";
import { SubscriptionPlan, SubscriptionStatus as SubscriptionStatusType } from "@/types/subscription";

// Define Subscription types
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trial';

export type Subscription = {
  subscription_id?: string;
  user_id?: string;
  status: SubscriptionStatus;
  plan_type: string;
  current_period_end?: string;
  project_limit: number;
  features?: Record<string, boolean>;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  cancel_at_period_end?: boolean;
  created_at: string;
  updated_at: string;
};

export type SubscriptionResponse = {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  checkSubscription: () => Promise<Subscription | null>;
  renewSubscription: () => Promise<{ success: boolean; url?: string; error?: any }>;
  isInGracePeriod: () => boolean;
  
  data: Subscription | null;
  loading: boolean;
  hasFailedPayment: () => boolean;
  refreshWithFallbacks?: (forceRecheck?: boolean) => Promise<void>;
  refreshSubscription?: () => Promise<void>;
};

export function useSubscription(): SubscriptionResponse {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkSubscription = useCallback(async (): Promise<Subscription | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const cachedData = getSubscriptionData();
      if (cachedData) {
        console.log("Using cached subscription data");
        
        const enrichedData = {
          ...cachedData,
          created_at: cachedData.created_at || new Date().toISOString(),
          updated_at: cachedData.updated_at || new Date().toISOString()
        } as Subscription;
        
        setSubscription(enrichedData);
        setIsLoading(false);
        
        refreshSubscriptionInBackground();
        
        return enrichedData;
      }
      
      if (!session?.user?.id) {
        console.log("No user session available for subscription check");
        setSubscription(null);
        setIsLoading(false);
        return null;
      }
      
      console.log("Fetching subscription data from Supabase");
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching subscription:", error);
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }
      
      if (data) {
        console.log("Subscription data received:", data);
        const subscriptionData = {
          ...data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        } as Subscription;
        
        setSubscription(subscriptionData);
        setSubscriptionData(subscriptionData);
        return subscriptionData;
      } else {
        console.log("No subscription data found");
        setSubscription(null);
        return null;
      }
    } catch (err) {
      console.error("Error in checkSubscription:", err);
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [session]);
  
  const refreshSubscriptionInBackground = async () => {
    try {
      if (!session?.user?.id) return;
      
      console.log("Refreshing subscription data in background");
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error("Background refresh error:", error);
        return;
      }
      
      if (data) {
        console.log("Updated subscription data received");
        const subscriptionData = {
          ...data,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.updated_at || new Date().toISOString()
        } as Subscription;
        
        setSubscription(subscriptionData);
        setSubscriptionData(subscriptionData);
      }
    } catch (err) {
      console.error("Error in background subscription refresh:", err);
    }
  };

  const isInGracePeriod = useCallback((): boolean => {
    if (!subscription?.current_period_end) return false;
    
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Days until subscription expiry: ${daysUntilExpiry}`);
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  }, [subscription]);

  const hasFailedPayment = useCallback((): boolean => {
    if (!subscription) return false;
    return subscription.status === 'past_due' || subscription.status === 'unpaid';
  }, [subscription]);

  const renewSubscription = async (): Promise<{ success: boolean; url?: string; error?: any }> => {
    try {
      if (!session?.user?.id) {
        throw new Error("User must be logged in to renew subscription");
      }
      
      console.log("Initiating subscription renewal process");
      const { data, error } = await supabase.functions.invoke('renew-subscription', {
        body: { user_id: session.user.id }
      });
      
      if (error) {
        console.error("Error renewing subscription:", error);
        throw new Error(`Renewal failed: ${error.message}`);
      }
      
      if (data?.url) {
        console.log("Renewal initiated, redirect URL received");
        return { success: true, url: data.url };
      } else {
        throw new Error("No redirect URL received from server");
      }
    } catch (err) {
      console.error("Exception in renewSubscription:", err);
      const error = err instanceof Error ? err : new Error(String(err));
      return { success: false, error };
    }
  };

  useEffect(() => {
    if (session?.user?.id) {
      checkSubscription();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [session, checkSubscription]);

  const refreshWithFallbacks = useCallback(async (forceRecheck?: boolean) => {
    try {
      await checkSubscription();
    } catch (error) {
      console.error("Error refreshing subscription with fallbacks:", error);
    }
  }, [checkSubscription]);
  
  const refreshSubscription = useCallback(async () => {
    await checkSubscription();
  }, [checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    checkSubscription,
    renewSubscription,
    isInGracePeriod,
    data: subscription,
    loading: isLoading,
    hasFailedPayment,
    refreshWithFallbacks,
    refreshSubscription
  };
}
