
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';

export type SubscriptionStatus = 'trialing' | 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'unpaid';

export interface SubscriptionPlan {
  id: string;
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
}

interface SubscriptionContextType {
  data: SubscriptionPlan | null;
  subscription: SubscriptionPlan | null;
  loading: boolean;
  isLoading: boolean;
  error: Error | null;
  checkSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType>({
  data: null,
  subscription: null,
  loading: true,
  isLoading: true,
  error: null,
  checkSubscription: async () => {},
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
        .select('id, user_id, created_at, updated_at, status, plan_type, project_limit, features, current_period_end, stripe_customer_id, stripe_subscription_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (subError) throw subError;
      
      if (data) {
        const subscriptionData: SubscriptionPlan = {
          ...data,
          status: data.status as SubscriptionStatus,
          features: (data.features || {}) as Record<string, any>,
          plan_type: data.plan_type || 'trial',
        };
        setSubscription(subscriptionData);
      } else {
        const newSubscription: SubscriptionPlan = {
          id: crypto.randomUUID(),
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
        checkSubscription
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
