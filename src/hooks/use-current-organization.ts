import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export function useCurrentOrganization() {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ["current-organization", user?.id],
    queryFn: async () => {
      if (!user?.id) throw new Error("No authenticated user");

      // Single round-trip: fetch profile + joined organization in one query
      const { data, error } = await supabase
        .from("profiles")
        .select("current_organization_id, organization:organizations!profiles_current_organization_id_fkey(*)")
        .eq("profile_id", user.id)
        .maybeSingle();

      if (error) {
        // Fallback: relational join may fail if FK is not detected. Run two-step.
        console.warn("Relational org fetch failed, falling back:", error.message);
        const { data: profile, error: pErr } = await supabase
          .from("profiles")
          .select("current_organization_id")
          .eq("profile_id", user.id)
          .maybeSingle();
        if (pErr) throw pErr;
        if (!profile?.current_organization_id) return null;
        const { data: org, error: oErr } = await supabase
          .from("organizations")
          .select("*")
          .eq("id", profile.current_organization_id)
          .maybeSingle();
        if (oErr) throw oErr;
        return org;
      }

      if (!data?.current_organization_id) return null;
      // PostgREST returns the joined object directly when FK is unique
      return (data as any).organization ?? null;
    },
    enabled: !!user?.id,
    staleTime: 300000,
    gcTime: 600000,
  });

  const refreshOrganization = () => {
    queryClient.invalidateQueries({ queryKey: ["current-organization", user?.id] });
  };

  return {
    organization: organizationQuery.data,
    loading: organizationQuery.isLoading,
    error: organizationQuery.error,
    refreshOrganization,
  };
}
