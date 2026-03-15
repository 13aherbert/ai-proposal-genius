
import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { KnowledgeCategory } from "../types";
import { knowledgeCategories } from "../data/categories";

/**
 * Custom hook for managing knowledge base state
 * Handles category selection, dialog state, and URL parameter handling
 */
export function useKnowledgeBase() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();

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

  return {
    // State
    open,
    selectedCategory,
    categories: knowledgeCategories,
    
    // Handlers
    setOpen,
    setSelectedCategory,
  };
}
