
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { isPast, addDays } from 'date-fns';

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';

export interface SubscriptionPlan {
  subscription_id: string;
  status: SubscriptionStatus;
  plan_type: string;
  current_period_end: string | null;
  project_limit: number;
  features: Record<string, any>;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  cancel_at_period_end?: boolean;
}

interface SubscriptionContextType {
  data: SubscriptionPlan | null;
  subscription: SubscriptionPlan | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  checkSubscription: () => Promise<void>;
  renewSubscription: () => Promise<void>;
  isPastGracePeriod: () => boolean;
  isInGracePeriod: () => boolean;
  isActive: () => boolean;
  hasFailedPayment: () => boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  data: null,
  subscription: null,
  loading: true,
  isLoading: true,
  error: null,
  checkSubscription: async () => {},
  renewSubscription: async () => {},
  isPastGracePeriod: () => false,
  isInGracePeriod: () => false,
  isActive: () => false,
  hasFailedPayment: () => false,
});

const DEFAULT_TRIAL_SUBSCRIPTION: Partial<SubscriptionPlan> = {
  status: 'trialing',
  plan_type: 'trial',
  project_limit: 3,
  features: {},
  current_period_end: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
};

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [subscription, setSubscription] = useState<SubscriptionPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useAuth();

  const checkSubscription = async () => {
    try {
      if (!session?.user) {
        setSubscription(null);
        return;
      }

      const { data, error: subError } = await supabase
        .from('subscriptions')
        .select('subscription_id, user_id, created_at, updated_at, status, plan_type, project_limit, features, current_period_end, stripe_customer_id, stripe_subscription_id, cancel_at_period_end')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subError) throw subError;
      
      if (data) {
        const subscriptionData: SubscriptionPlan = {
          ...data,
          status: data.status as SubscriptionStatus,
          features: (data.features || {}) as Record<string, any>,
          plan_type: data.plan_type || 'trial',
          cancel_at_period_end: data.cancel_at_period_end || false,
        };
        setSubscription(subscriptionData);
      } else {
        // Create new trial subscription
        const newSubscription: SubscriptionPlan = {
          subscription_id: crypto.randomUUID(),
          user_id: session.user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...DEFAULT_TRIAL_SUBSCRIPTION
        } as SubscriptionPlan;

        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert([newSubscription]);

        if (insertError) {
          console.error('Error creating trial subscription:', insertError);
          setSubscription(newSubscription);
        } else {
          setSubscription(newSubscription);
        }
      }
    } catch (e) {
      console.error('Error fetching subscription:', e);
      setError(e as Error);
    } finally {
      setLoading(false);
    }
  };

  // Function to renew a failed or expired subscription
  const renewSubscription = async () => {
    try {
      if (!session?.user || !subscription?.stripe_subscription_id) {
        toast.error("Cannot renew subscription", { 
          description: "No active subscription found" 
        });
        return;
      }

      // Call the renew-subscription edge function
      const { error } = await supabase.functions.invoke('renew-subscription', {
        body: { 
          subscriptionId: subscription.stripe_subscription_id
        }
      });

      if (error) throw error;

      toast.success("Renewal initiated", {
        description: "Your subscription renewal has been initiated. Please check your email for payment details."
      });

      // Refresh subscription data
      await checkSubscription();
    } catch (error: any) {
      console.error('Error renewing subscription:', error);
      toast.error("Failed to renew subscription", {
        description: error.message || "Please try again or contact support"
      });
    }
  };

  // Check if subscription is past grace period
  const isPastGracePeriod = () => {
    if (!subscription?.current_period_end) return false;
    
    const endDate = new Date(subscription.current_period_end);
    const gracePeriodEnd = addDays(endDate, 3);
    
    return isPast(endDate) && isPast(gracePeriodEnd);
  };

  // Check if subscription is in grace period
  const isInGracePeriod = () => {
    if (!subscription?.current_period_end) return false;
    
    const endDate = new Date(subscription.current_period_end);
    const gracePeriodEnd = addDays(endDate, 3);
    
    return isPast(endDate) && !isPast(gracePeriodEnd);
  };

  // Check if subscription is active (either actually active or in grace period)
  const isActive = () => {
    return (
      subscription?.status === 'active' || 
      subscription?.status === 'trialing' || 
      isInGracePeriod()
    );
  };

  // Check if subscription has failed payment
  const hasFailedPayment = () => {
    return subscription?.status === 'past_due' || subscription?.status === 'unpaid';
  };

  useEffect(() => {
    checkSubscription();
  }, [session]);

  return (
    <SubscriptionContext.Provider 
      value={{ 
        data: subscription,
        subscription,
        loading,
        isLoading: loading,
        error,
        checkSubscription,
        renewSubscription,
        isPastGracePeriod,
        isInGracePeriod,
        isActive,
        hasFailedPayment
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
