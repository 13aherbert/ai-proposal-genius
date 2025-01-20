import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { KnowledgeEntry } from "../types";

/**
 * Custom hook to manage knowledge entries data and operations
 * @param selectedCategory - The currently selected category filter
 * @returns Object containing entries data and loading state
 */
export const useEntries = (selectedCategory: string | null) => {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const formatCategoryForQuery = (category: string) => {
    return category.toLowerCase().replace(/\s+/g, '-');
  };

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching entries with selected category:', selectedCategory);
      
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (selectedCategory) {
        const formattedCategory = formatCategoryForQuery(selectedCategory);
        console.log('Formatted category for query:', formattedCategory);
        query = query.eq('category', formattedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      console.log('Raw data from database:', data);

      const formattedEntries = data.map(entry => ({
        title: entry.title,
        category: entry.category,
        updated: new Date(entry.updated_at).toLocaleDateString()
      }));

      console.log('Formatted entries:', formattedEntries);
      setEntries(formattedEntries);
    } catch (error) {
      console.error('Error fetching entries:', error);
      toast({
        title: "Error",
        description: "Failed to fetch entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entries,
    isLoading,
    fetchEntries
  };
};