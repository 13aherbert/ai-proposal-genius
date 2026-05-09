import { useState, useCallback } from "react";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeEntry } from "../types";
import { debounce } from "lodash";
import { useAuth } from "@/components/AuthProvider";

const TEMPLATE_MARKER = "Replace with your content";

const formatCategoryForQuery = (category: string) =>
  category.toLowerCase().replace(/\s+/g, "-");

interface EntriesResult {
  entries: KnowledgeEntry[];
  totalCount: number;
}

/**
 * Manage knowledge entries data and operations using react-query for caching,
 * deduplication, and background revalidation.
 */
export const useEntries = (selectedCategory: string | null) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const { toast } = useToast();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const userId = session?.user?.id ?? null;

  const debouncedSetPageSize = useCallback(
    debounce((size: number) => {
      setPageSizeState(size);
      setCurrentPage(1);
    }, 300),
    []
  );

  const queryKey = [
    "knowledge-entries",
    userId,
    selectedCategory,
    currentPage,
    pageSize,
  ];

  const { data, isLoading, refetch } = useQuery<EntriesResult>({
    queryKey,
    enabled: !!userId,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      if (!userId) return { entries: [], totalCount: 0 };

      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;

      let countQuery = supabase
        .from("knowledge_entries")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (selectedCategory) {
        countQuery = countQuery.eq(
          "category",
          formatCategoryForQuery(selectedCategory)
        );
      }
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;

      let query = supabase
        .from("knowledge_entries")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .range(from, to);
      if (selectedCategory) {
        query = query.eq(
          "category",
          formatCategoryForQuery(selectedCategory)
        );
      }
      const { data: rows, error } = await query;
      if (error) throw error;

      const entries = (rows || []).map((entry) => ({
        title: entry.title,
        category: entry.category,
        updated: new Date(entry.updated_at).toLocaleDateString(),
        updatedAt: entry.updated_at,
        createdAt: entry.created_at,
        isTemplate: entry.content?.includes(TEMPLATE_MARKER) ?? false,
      })) as KnowledgeEntry[];

      return { entries, totalCount: count ?? 0 };
    },
  });

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["knowledge-entries"] });
  }, [queryClient]);

  const exportEntries = async () => {
    try {
      let query = supabase
        .from("knowledge_entries")
        .select("*")
        .order("updated_at", { ascending: false });
      if (selectedCategory) {
        query = query.eq(
          "category",
          formatCategoryForQuery(selectedCategory)
        );
      }
      const { data: rows, error } = await query;
      if (error) throw error;

      const exportData = (rows || []).map((entry) => ({
        title: entry.title,
        category: entry.category,
        content: entry.content || "",
        createdAt: new Date(entry.created_at).toLocaleString(),
        updatedAt: new Date(entry.updated_at).toLocaleString(),
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `knowledge-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      toast({
        title: "Export Complete",
        description: `Successfully exported ${exportData.length} entries`,
      });
    } catch (error) {
      console.error("Error exporting entries:", error);
      toast({
        title: "Export Failed",
        description: "Failed to export entries",
        variant: "destructive",
      });
    }
  };

  return {
    entries: data?.entries ?? [],
    isLoading,
    totalCount: data?.totalCount ?? 0,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize: debouncedSetPageSize,
    fetchEntries: refetch,
    exportEntries,
    invalidateCache,
  };
};
