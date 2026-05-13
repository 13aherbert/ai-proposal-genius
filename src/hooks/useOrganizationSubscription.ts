import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { useToast } from "@/hooks/use-toast";

export interface OrganizationSubscription {
  id: string;
  organization_id: string;
  subscription_id: string;
  status: string;
  plan_type: string;
  billing_model: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  current_period_start?: string;
  current_period_end?: string;
  seat_limit?: number;
  used_seats: number;
  project_limit: number;
  features: Record<string, any>;
  custom_pricing?: Record<string, any>;
  cancel_at_period_end: boolean;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export function useOrganizationSubscription() {
  const { organization } = useCurrentOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const subscriptionQuery = useQuery({
    queryKey: ["organization-subscription", organization?.id],
    queryFn: async () => {
      if (!organization?.id) {
        throw new Error("No organization selected");
      }

      console.log("Fetching subscription for organization:", organization.id);
      
      // NOTE: stripe_customer_id / stripe_subscription_id are intentionally
      // excluded — they are revoked from authenticated clients at the column
      // level and only fetched server-side (or via the get_org_stripe_ids RPC
      // for owners/admins). Selecting them here would 401.
      const { data, error } = await supabase
        .from("organization_subscriptions")
        .select(
          "id, organization_id, subscription_id, status, plan_type, current_period_end, project_limit, member_limit, features, cancel_at_period_end, created_at, updated_at, billing_model, used_seats, max_seats, custom_pricing, billing_cycle, trial_ends_at, billing_contact_email, billing_address"
        )
        .eq("organization_id", organization.id)
        .single();

      if (error) {
        console.error("Error fetching organization subscription:", error);
        throw error;
      }

      console.log("Organization subscription:", data);
      return data as OrganizationSubscription;
    },
    enabled: !!organization?.id,
    staleTime: 600000, // 10 minutes — subscription state changes infrequently
    gcTime: 1800000, // 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const updateSubscriptionMutation = useMutation({
    mutationFn: async (updates: Partial<OrganizationSubscription>) => {
      if (!organization?.id) {
        throw new Error("No organization selected");
      }

      const { data, error } = await supabase
        .from("organization_subscriptions")
        .update(updates)
        .eq("organization_id", organization.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organization-subscription", organization?.id] });
      toast({
        title: "Success",
        description: "Subscription updated successfully",
      });
    },
    onError: (error) => {
      console.error("Error updating subscription:", error);
      toast({
        title: "Error",
        description: "Failed to update subscription",
        variant: "destructive",
      });
    },
  });

  const refreshSubscription = () => {
    queryClient.invalidateQueries({ queryKey: ["organization-subscription", organization?.id] });
  };

  return {
    subscription: subscriptionQuery.data,
    loading: subscriptionQuery.isLoading,
    error: subscriptionQuery.error,
    updateSubscription: updateSubscriptionMutation.mutate,
    updating: updateSubscriptionMutation.isPending,
    refreshSubscription,
  };
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plan-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("subscription_plan_templates")
        .select(
          "id,name,display_name,description,billing_model,base_price,price_per_seat,seat_limit,project_limit,features,is_enterprise,is_white_label,created_at,updated_at"
        )
        .order("base_price", { ascending: true });

      if (error) {
        throw error;
      }

      return data;
    },
    staleTime: 3600000, // 1 hour — plan templates rarely change
  });
}