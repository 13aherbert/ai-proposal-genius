import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/components/AuthProvider";

export interface Opportunity {
  external_id: string;
  source: string;
  title: string;
  solicitation_number: string;
  department: string;
  naics_code: string;
  posted_date: string | null;
  response_deadline: string | null;
  set_aside: string;
  description_url: string;
  type: string;
  raw_data: Record<string, unknown>;
  resource_links?: string[];
  description_text_url?: string | null;
}

export interface SearchParams {
  keyword: string;
  postedFrom?: string;
  postedTo?: string;
  naicsCode?: string;
  setAside?: string;
  ptype?: string;
  source?: string;
  opportunityType?: string;
  agency?: string;
  limit?: number;
  offset?: number;
}

export interface ProviderStatus {
  provider: string;
  status: "success" | "timeout" | "api_error" | "no_results" | "skipped";
  count: number;
  message?: string;
  responseTimeMs?: number;
}

export type SearchState = "idle" | "loading" | "success" | "empty" | "timed_out" | "error";

export interface SavedOpportunity {
  id: string;
  organization_id: string;
  saved_by: string;
  external_id: string;
  source: string;
  title: string;
  solicitation_number: string | null;
  department: string | null;
  naics_code: string | null;
  posted_date: string | null;
  response_deadline: string | null;
  set_aside: string | null;
  description_url: string | null;
  raw_data: Record<string, unknown>;
  notes: string | null;
  status: string;
  created_at: string;
}

export function useOpportunitySearch() {
  const { session } = useAuth();
  const [results, setResults] = useState<Opportunity[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<ProviderStatus[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);

  const search = useCallback(async (params: SearchParams) => {
    if (!session?.access_token) {
      toast.error("You must be logged in to search opportunities");
      return;
    }

    setIsSearching(true);
    setSearchState("loading");
    setProviderStatuses([]);

    // Client-side safety timeout at 45s (edge function has 20s per-provider timeouts)
    let didTimeout = false;
    const clientTimeout = setTimeout(() => {
      didTimeout = true;
      setIsSearching(false);
      setSearchState("timed_out");
      toast.error("Search timed out. Try narrowing your search criteria or selecting a specific source.");
    }, 45000);

    try {
      const { data, error } = await supabase.functions.invoke("search-opportunities", {
        body: params,
      });

      clearTimeout(clientTimeout);
      if (didTimeout) return; // Response arrived after timeout fired

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const opportunities: Opportunity[] = data.opportunities || [];
      const statuses: ProviderStatus[] = data.providerStatuses || [];

      setResults(opportunities);
      setTotalRecords(data.totalRecords || 0);
      setProviderStatuses(statuses);

      // Determine search state from provider statuses
      const allTimedOut = statuses.length > 0 && statuses.every(s => s.status === "timeout");
      const someTimedOut = statuses.some(s => s.status === "timeout");
      const someErrored = statuses.some(s => s.status === "api_error");

      if (opportunities.length > 0) {
        setSearchState("success");
        if (someTimedOut) {
          toast.warning(`${statuses.filter(s => s.status === "timeout").map(s => s.provider).join(", ")} timed out. Showing partial results.`);
        }
      } else if (allTimedOut) {
        setSearchState("timed_out");
        toast.error("Search providers timed out. Try again or narrow your search.");
      } else if (someErrored && !opportunities.length) {
        setSearchState("error");
        toast.warning(`${statuses.filter(s => s.status === "api_error").map(s => s.provider).join(", ")} returned an error. Please try again.`);
      } else {
        setSearchState("empty");
      }

      if (someErrored && opportunities.length > 0) {
        toast.warning(`${statuses.filter(s => s.status === "api_error").map(s => s.provider).join(", ")} returned an error. Results may be incomplete.`);
      }
    } catch (err: any) {
      clearTimeout(clientTimeout);
      if (didTimeout) return;
      const msg = err?.message || "Search failed";
      toast.error(msg);
      setResults([]);
      setTotalRecords(0);
      setSearchState("error");
    } finally {
      if (!didTimeout) {
        clearTimeout(clientTimeout);
        setIsSearching(false);
      }
    }
  }, [session?.access_token]);

  const saveOpportunity = useCallback(async (opportunity: Opportunity) => {
    if (!session?.user?.id) return;

    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", session.user.id)
        .single();

      if (!profile?.current_organization_id) {
        toast.error("No organization found");
        return;
      }

      const insertData: any = {
        organization_id: profile.current_organization_id,
        saved_by: session.user.id,
        external_id: opportunity.external_id,
        source: opportunity.source,
        title: opportunity.title,
        solicitation_number: opportunity.solicitation_number || null,
        department: opportunity.department || null,
        naics_code: opportunity.naics_code || null,
        posted_date: opportunity.posted_date,
        response_deadline: opportunity.response_deadline,
        set_aside: opportunity.set_aside || null,
        description_url: opportunity.description_url || null,
        raw_data: opportunity.raw_data || {},
      };

      const { error } = await supabase.from("saved_opportunities").insert(insertData);

      if (error) {
        if (error.code === "23505") {
          toast.info("Opportunity already saved");
        } else {
          throw error;
        }
      } else {
        toast.success("Opportunity saved");
        await loadSaved();
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to save opportunity");
    }
  }, [session?.user?.id]);

  const loadSaved = useCallback(async () => {
    if (!session?.user?.id) return;

    setIsLoadingSaved(true);
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("current_organization_id")
        .eq("profile_id", session.user.id)
        .single();

      if (!profile?.current_organization_id) return;

      const { data, error } = await supabase
        .from("saved_opportunities")
        .select("*")
        .eq("organization_id", profile.current_organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSavedOpportunities((data as unknown as SavedOpportunity[]) || []);
    } catch (err: any) {
      toast.error("Failed to load saved opportunities");
    } finally {
      setIsLoadingSaved(false);
    }
  }, [session?.user?.id]);

  const updateStatus = useCallback(async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from("saved_opportunities")
        .update({ status } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success(`Status updated to ${status}`);
      await loadSaved();
    } catch (err: any) {
      toast.error("Failed to update status");
    }
  }, [loadSaved]);

  const updateNotes = useCallback(async (id: string, notes: string) => {
    try {
      const { error } = await supabase
        .from("saved_opportunities")
        .update({ notes } as any)
        .eq("id", id);
      if (error) throw error;
      toast.success("Notes updated");
      await loadSaved();
    } catch (err: any) {
      toast.error("Failed to update notes");
    }
  }, [loadSaved]);

  const deleteOpportunity = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from("saved_opportunities")
        .delete()
        .eq("id", id);
      if (error) throw error;
      toast.success("Opportunity removed");
      await loadSaved();
    } catch (err: any) {
      toast.error("Failed to remove opportunity");
    }
  }, [loadSaved]);

  return {
    results,
    totalRecords,
    isSearching,
    search,
    providerStatuses,
    searchState,
    saveOpportunity,
    savedOpportunities,
    isLoadingSaved,
    loadSaved,
    updateStatus,
    updateNotes,
    deleteOpportunity,
  };
}
