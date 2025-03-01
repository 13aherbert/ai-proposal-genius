
import { useState, useEffect } from "react";
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
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const formatCategoryForQuery = (category: string) => {
    return category.toLowerCase().replace(/\s+/g, '-');
  };

  useEffect(() => {
    // Reset to first page when category changes
    setCurrentPage(1);
  }, [selectedCategory]);

  const fetchEntries = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching entries with selected category:', selectedCategory);
      
      // Calculate pagination range
      const from = (currentPage - 1) * pageSize;
      const to = from + pageSize - 1;
      
      // Count query for total entries
      let countQuery = supabase
        .from('knowledge_entries')
        .select('*', { count: 'exact', head: true });
        
      if (selectedCategory) {
        const formattedCategory = formatCategoryForQuery(selectedCategory);
        console.log('Formatted category for query:', formattedCategory);
        countQuery = countQuery.eq('category', formattedCategory);
      }
      
      const { count, error: countError } = await countQuery;
      
      if (countError) throw countError;
      setTotalCount(count || 0);
      
      // Data query with pagination
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .order('updated_at', { ascending: false })
        .range(from, to);

      if (selectedCategory) {
        const formattedCategory = formatCategoryForQuery(selectedCategory);
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

  const exportEntries = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all entries for export without pagination
      let query = supabase
        .from('knowledge_entries')
        .select('*')
        .order('updated_at', { ascending: false });

      if (selectedCategory) {
        const formattedCategory = formatCategoryForQuery(selectedCategory);
        query = query.eq('category', formattedCategory);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format data for export
      const exportData = data.map(entry => ({
        title: entry.title,
        category: entry.category,
        content: entry.content || '',
        createdAt: new Date(entry.created_at).toLocaleString(),
        updatedAt: new Date(entry.updated_at).toLocaleString()
      }));

      // Convert to JSON string
      const jsonData = JSON.stringify(exportData, null, 2);
      
      // Create a blob and download link
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `knowledge-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      toast({
        title: "Export Complete",
        description: `Successfully exported ${exportData.length} entries`,
      });
    } catch (error) {
      console.error('Error exporting entries:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    entries,
    isLoading,
    totalCount,
    currentPage,
    pageSize,
    setCurrentPage,
    setPageSize,
    fetchEntries,
    exportEntries
  };
};
