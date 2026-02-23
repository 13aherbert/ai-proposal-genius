import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useCurrentOrganization } from '@/hooks/use-current-organization';
import { supabase } from '@/integrations/supabase/client';
import { enhancedKnowledgeCategories, getEssentialCategories } from '@/components/knowledge-base/data/categories';

export interface CategoryCoverage {
  name: string;
  priority: 'essential' | 'recommended' | 'optional';
  entryCount: number;
  hasContent: boolean;
  description: string;
}

export interface KnowledgeReadiness {
  // Overall scores
  overallScore: number; // 0-100
  essentialScore: number; // 0-100, based on essential categories only
  
  // Coverage details
  totalEntries: number;
  categoryCoverage: CategoryCoverage[];
  
  // Status flags
  isReady: boolean; // >= 60% essential coverage
  needsAttention: boolean; // < 40% essential coverage
  isEmpty: boolean; // 0 entries
  
  // Missing items
  missingEssential: string[];
  missingRecommended: string[];
  
  // Loading state
  isLoading: boolean;
  error: string | null;
}

const READINESS_THRESHOLD = 60; // Minimum % for "ready"
const ATTENTION_THRESHOLD = 40; // Below this needs attention

export function useKnowledgeReadiness(): KnowledgeReadiness {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const [entries, setEntries] = useState<{ category: string; content: string | null; parsed_content: string | null }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEntries() {
      if (!session?.user?.id) {
        setIsLoading(false);
        return;
      }
      if (!organization?.id) {
        return; // Org still loading, keep isLoading = true
      }

      try {
        setIsLoading(true);
        const { data, error: fetchError } = await supabase
          .from('knowledge_entries')
          .select('category, content, parsed_content')
          .eq('organization_id', organization.id);

        if (fetchError) throw fetchError;
        setEntries(data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching knowledge entries:', err);
        setError('Failed to load knowledge base');
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEntries();
  }, [session?.user?.id, organization?.id]);

  const readiness = useMemo((): Omit<KnowledgeReadiness, 'isLoading' | 'error'> => {
    // Count entries per category
    const entryCounts: Record<string, number> = {};
    entries.forEach(entry => {
      const category = entry.category;
      entryCounts[category] = (entryCounts[category] || 0) + 1;
    });

    // Build category coverage
    const categoryCoverage: CategoryCoverage[] = enhancedKnowledgeCategories.map(cat => ({
      name: cat.name,
      priority: cat.priority,
      entryCount: entryCounts[cat.name] || 0,
      hasContent: (entryCounts[cat.name] || 0) > 0,
      description: cat.description,
    }));

    // Calculate essential coverage
    const essentialCategories = getEssentialCategories();
    const essentialCovered = categoryCoverage
      .filter(c => c.priority === 'essential' && c.hasContent)
      .length;
    const essentialScore = Math.round((essentialCovered / essentialCategories.length) * 100);

    // Calculate overall score (weighted: essential=60%, recommended=30%, optional=10%)
    const recommendedCovered = categoryCoverage
      .filter(c => c.priority === 'recommended' && c.hasContent)
      .length;
    const optionalCovered = categoryCoverage
      .filter(c => c.priority === 'optional' && c.hasContent)
      .length;
    
    const recommendedTotal = categoryCoverage.filter(c => c.priority === 'recommended').length;
    const optionalTotal = categoryCoverage.filter(c => c.priority === 'optional').length;
    
    const weightedScore = 
      (essentialCovered / essentialCategories.length) * 60 +
      (recommendedCovered / recommendedTotal) * 30 +
      (optionalCovered / optionalTotal) * 10;
    
    const overallScore = Math.round(weightedScore);

    // Determine missing categories
    const missingEssential = categoryCoverage
      .filter(c => c.priority === 'essential' && !c.hasContent)
      .map(c => c.name);
    
    const missingRecommended = categoryCoverage
      .filter(c => c.priority === 'recommended' && !c.hasContent)
      .map(c => c.name);

    return {
      overallScore,
      essentialScore,
      totalEntries: entries.length,
      categoryCoverage,
      isReady: essentialScore >= READINESS_THRESHOLD,
      needsAttention: essentialScore < ATTENTION_THRESHOLD,
      isEmpty: entries.length === 0,
      missingEssential,
      missingRecommended,
    };
  }, [entries]);

  return {
    ...readiness,
    isLoading,
    error,
  };
}
