import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";
import type { SearchParams } from "@/hooks/use-opportunity-search";

export interface SavedSearch {
  id: string;
  user_id: string;
  organization_id: string;
  name: string;
  search_params: SearchParams;
  alert_frequency: "daily" | "weekly" | "immediate";
  last_alert_sent: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useSavedSearches() {
  const { user } = useAuth();
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedSearches = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("saved_searches" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedSearches((data as any[]) || []);
    } catch (err) {
      console.error("Failed to load saved searches:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSavedSearches();
  }, [loadSavedSearches]);

  const saveSearch = useCallback(
    async (name: string, searchParams: SearchParams, alertFrequency: "daily" | "weekly" | "immediate") => {
      if (!user) return;

      // Get org id
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", user.id)
        .single();

      if (!profile?.current_organization_id) {
        toast.error("No organization found");
        return;
      }

      const { error } = await supabase.from("saved_searches" as any).insert({
        user_id: user.id,
        organization_id: profile.current_organization_id,
        name,
        search_params: searchParams as any,
        alert_frequency: alertFrequency,
        is_active: true,
      } as any);

      if (error) {
        toast.error("Failed to save search");
        console.error(error);
        return;
      }

      toast.success("Search saved! You'll receive alerts for new matches.");
      await loadSavedSearches();
    },
    [user, loadSavedSearches]
  );

  const updateSearch = useCallback(
    async (id: string, updates: Partial<Pick<SavedSearch, "name" | "alert_frequency" | "is_active">>) => {
      const { error } = await supabase
        .from("saved_searches" as any)
        .update({ ...updates, updated_at: new Date().toISOString() } as any)
        .eq("id", id);

      if (error) {
        toast.error("Failed to update saved search");
        return;
      }

      toast.success("Saved search updated");
      await loadSavedSearches();
    },
    [loadSavedSearches]
  );

  const deleteSearch = useCallback(
    async (id: string) => {
      const { error } = await supabase
        .from("saved_searches" as any)
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Failed to delete saved search");
        return;
      }

      toast.success("Saved search deleted");
      await loadSavedSearches();
    },
    [loadSavedSearches]
  );

  return {
    savedSearches,
    isLoading,
    saveSearch,
    updateSearch,
    deleteSearch,
    refetch: loadSavedSearches,
  };
}
