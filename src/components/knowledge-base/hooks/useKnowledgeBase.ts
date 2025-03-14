
import { useState } from "react";
import { KnowledgeCategory } from "../types";
import { knowledgeCategories } from "../data/categories";

/**
 * Custom hook for managing knowledge base state
 * Handles category selection and dialog state
 * 
 * @returns Object containing state and handlers for knowledge base
 */
export function useKnowledgeBase() {
  const [open, setOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
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
