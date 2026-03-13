import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useSubscriptionFeatures } from "./use-subscription-features";

const GROWTH_SEARCH_LIMIT = 10;

export function useSearchUsage() {
  const { session } = useAuth();
  const { plan } = useSubscriptionFeatures();
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const isUnlimited = plan === "business" || plan === "enterprise";
  const limit = isUnlimited ? -1 : GROWTH_SEARCH_LIMIT;
  const searchesRemaining = isUnlimited ? -1 : Math.max(0, GROWTH_SEARCH_LIMIT - searchesUsed);
  const isAtLimit = !isUnlimited && searchesUsed >= GROWTH_SEARCH_LIMIT;

  const fetchUsage = useCallback(async () => {
    if (!session?.user?.id || isUnlimited) {
      setLoading(false);
      return;
    }

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", session.user.id)
        .single();

      if (!profile?.current_organization_id) {
        setLoading(false);
        return;
      }

      const now = new Date();
      const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("organization_usage_metrics")
        .select("metric_value")
        .eq("organization_id", profile.current_organization_id)
        .eq("metric_type", "opportunity_search")
        .gte("metric_date", firstOfMonth);

      if (!error && data) {
        const total = data.reduce((sum, row) => sum + (row.metric_value || 0), 0);
        setSearchesUsed(total);
      }
    } catch (err) {
      console.error("Failed to fetch search usage:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, isUnlimited]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  const incrementUsage = useCallback(async () => {
    if (!session?.user?.id || isUnlimited) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", session.user.id)
        .single();

      if (!profile?.current_organization_id) return;

      await supabase.rpc("update_organization_usage_metric", {
        org_id: profile.current_organization_id,
        metric_type_param: "opportunity_search",
        increment_value: 1,
      });

      setSearchesUsed((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to increment search usage:", err);
    }
  }, [session?.user?.id, isUnlimited]);

  return {
    searchesUsed,
    searchesRemaining,
    limit,
    isAtLimit,
    isUnlimited,
    loading,
    incrementUsage,
    refetch: fetchUsage,
  };
}
