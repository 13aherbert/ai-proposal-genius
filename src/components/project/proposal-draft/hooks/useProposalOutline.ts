
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useProposalOutline(projectId: string) {
  const [proposalOutline, setProposalOutline] = useState<string | null>(null);

  useEffect(() => {
    const loadProposalOutline = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('proposal_outline')
          .eq('project_id', projectId)
          .single();

        if (error) throw error;
        setProposalOutline(data?.proposal_outline || null);
      } catch (error) {
        console.error('Error loading proposal outline:', error);
      }
    };

    loadProposalOutline();
  }, [projectId]);

  const extractSectionTitles = (outline: string): string[] => {
    const lines = outline.split('\n');
    const titles: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match markdown headers (# ## ###) and numbered items (1. 2. etc.)
      if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
        let title = trimmed
          .replace(/^#{1,3}\s+/, '') // Remove markdown headers
          .replace(/^\d+\.\s+/, '') // Remove numbered list items
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .trim();
        
        if (title && title.length > 3 && title.length < 100) {
          titles.push(title);
        }
      }
    }
    
    return titles;
  };

  return {
    proposalOutline,
    extractSectionTitles,
  };
}
