
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionData, setSubscriptionData } from "@/utils/network";

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
};

export type SubscriptionResponse = {
  subscription: Subscription | null;
  isLoading: boolean;
  error: Error | null;
  checkSubscription: () => Promise<Subscription | null>;
  renewSubscription: () => Promise<{ success: boolean; url?: string; error?: any }>;
  isInGracePeriod: () => boolean;
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
      
      // Check for subscription data in localStorage first
      const cachedData = getSubscriptionData();
      if (cachedData) {
        console.log("Using cached subscription data");
        setSubscription(cachedData as Subscription);
        setIsLoading(false);
        
        // Refresh in background to ensure data is current
        refreshSubscriptionInBackground();
        
        return cachedData as Subscription;
      }
      
      if (!session?.user?.id) {
        console.log("No user session available for subscription check");
        setSubscription(null);
        setIsLoading(false);
        return null;
      }
      
      // Query Supabase for subscription data
      console.log("Fetching subscription data from Supabase");
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (error) {
        console.error("Error fetching subscription:", error);
        throw new Error(`Failed to fetch subscription: ${error.message}`);
      }
      
      // Store subscription data in state and cache
      if (data) {
        console.log("Subscription data received:", data);
        const subscriptionData = data as Subscription;
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
  
  // Background refresh without updating loading state
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
        const subscriptionData = data as Subscription;
        setSubscription(subscriptionData);
        setSubscriptionData(subscriptionData);
      }
    } catch (err) {
      console.error("Error in background subscription refresh:", err);
    }
  };

  // Check if the subscription is in its grace period (within 3 days of expiry)
  const isInGracePeriod = useCallback((): boolean => {
    if (!subscription?.current_period_end) return false;
    
    const now = new Date();
    const endDate = new Date(subscription.current_period_end);
    const daysUntilExpiry = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Days until subscription expiry: ${daysUntilExpiry}`);
    return daysUntilExpiry <= 3 && daysUntilExpiry >= 0;
  }, [subscription]);

  // Function to renew subscription via Supabase edge function
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

  // Initialize subscription on mount or when session changes
  useEffect(() => {
    if (session?.user?.id) {
      checkSubscription();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [session, checkSubscription]);

  return {
    subscription,
    isLoading,
    error,
    checkSubscription,
    renewSubscription,
    isInGracePeriod
  };
}
