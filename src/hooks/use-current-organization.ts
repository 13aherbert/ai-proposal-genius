
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useCurrentOrganization(user: User | null) {
  return useQuery({
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

      console.log("User's current organization:", profile.current_organization_id);
      return profile.current_organization_id;
    },
    enabled: !!user?.id,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}
