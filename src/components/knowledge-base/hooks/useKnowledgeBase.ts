
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { KnowledgeCategory } from "../types";
import { knowledgeCategories } from "../data/categories";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { debounce } from "lodash";
import { SearchResult } from "../SearchResults";

/**
 * Custom hook for managing knowledge base state
 * Handles category selection, dialog state, search, and URL parameter handling
 */
export function useKnowledgeBase() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { session } = useAuth();

  // Handle URL parameters for deep-linking (e.g., ?action=add&category=pricing)
  useEffect(() => {
    const action = searchParams.get("action");
    const category = searchParams.get("category");

    if (action === "add") {
      setOpen(true);
      if (category) {
        setSelectedCategory(category);
      }
      // Clean up URL params after handling
      searchParams.delete("action");
      searchParams.delete("category");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const TEMPLATE_MARKER = "Replace with your content";

  const performSearch = useCallback(async (query: string) => {
    if (!query.trim() || !session?.user?.id) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    try {
      // Search by title and content using ilike for case-insensitive matching
      // Future enhancement: Replace with AI-powered semantic/vector search for better relevance
      const searchTerm = `%${query}%`;

      let queryBuilder = supabase
        .from("knowledge_entries")
        .select("title, category, content, parsed_content, updated_at")
        .eq("user_id", session.user.id)
        .or(`title.ilike.${searchTerm},content.ilike.${searchTerm},parsed_content.ilike.${searchTerm}`)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (selectedCategory) {
        const formatted = selectedCategory.toLowerCase().replace(/\s+/g, "-");
        queryBuilder = queryBuilder.eq("category", formatted);
      }

      const { data, error } = await queryBuilder;
      if (error) throw error;

      const results: SearchResult[] = (data || []).map((entry) => {
        // Extract snippet around matching term
        const fullText = entry.parsed_content || entry.content || "";
        let snippet = "";
        const lowerText = fullText.toLowerCase();
        const lowerQuery = query.toLowerCase();
        const matchIndex = lowerText.indexOf(lowerQuery);

        if (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 60);
          const end = Math.min(fullText.length, matchIndex + query.length + 120);
          snippet = (start > 0 ? "..." : "") + fullText.slice(start, end).trim() + (end < fullText.length ? "..." : "");
        } else {
          snippet = fullText.slice(0, 180).trim() + (fullText.length > 180 ? "..." : "");
        }

        return {
          title: entry.title,
          category: entry.category,
          updated: new Date(entry.updated_at).toLocaleDateString(),
          snippet,
          isTemplate: entry.content?.includes(TEMPLATE_MARKER) ?? false,
        };
      });

      setSearchResults(results);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [session?.user?.id, selectedCategory]);

  // Re-run search when category changes while search is active
  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery);
    }
  }, [selectedCategory]);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query);
  }, [performSearch]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  return {
    // State
    open,
    selectedCategory,
    categories: knowledgeCategories,
    searchQuery,
    searchResults,
    isSearching,
    
    // Handlers
    setOpen,
    setSelectedCategory,
    handleSearchChange,
    clearSearch,
  };
}
