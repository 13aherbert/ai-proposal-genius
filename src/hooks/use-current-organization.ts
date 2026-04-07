import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface Organization {
  id: string;
  name: string;
  slug: string;
  subscription_tier: string;
  is_white_label: boolean;
  settings: any;
}

export function useCurrentOrganization() {
  const { session } = useAuth();
  const user = session?.user ?? null;
  const queryClient = useQueryClient();

  const organizationQuery = useQuery({
    queryKey: ["current-organization", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("No authenticated user");
      }

      console.log("Fetching current organization for user:", user.id);
      
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (!profile?.current_organization_id) {
        console.warn("User has no current organization");
        return null;
      }

      // Fetch organization details
      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.current_organization_id)
        .single();

      if (orgError) {
        console.error("Error fetching organization:", orgError);
        throw orgError;
      }

      console.log("User's current organization:", org);
      return org;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });

  const refreshOrganization = () => {
    queryClient.invalidateQueries({ queryKey: ["current-organization", user?.id] });
  };

  return {
    organization: organizationQuery.data,
    loading: organizationQuery.isLoading,
    error: organizationQuery.error,
    refreshOrganization
  };
}
