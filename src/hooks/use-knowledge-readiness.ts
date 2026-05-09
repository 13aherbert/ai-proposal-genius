import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  overallScore: number;
  essentialScore: number;
  totalEntries: number;
  categoryCoverage: CategoryCoverage[];
  isReady: boolean;
  needsAttention: boolean;
  isEmpty: boolean;
  missingEssential: string[];
  missingRecommended: string[];
  templateOnlyCategories: string[];
  categoryLastUpdated: Record<string, string>;
  isLoading: boolean;
  error: string | null;
}

const READINESS_THRESHOLD = 60;
const ATTENTION_THRESHOLD = 40;
const TEMPLATE_MARKER = "Replace with your content";

export function useKnowledgeReadiness(): KnowledgeReadiness {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['kb-readiness', orgId],
    enabled: !!session?.user?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    queryFn: async () => {
      // Slim payload: only fields needed for readiness, template detection, and recency
      const { data, error } = await supabase
        .from('knowledge_entries')
        .select('category, content, updated_at')
        .eq('organization_id', orgId!)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const entries = data ?? [];

  return useMemo<KnowledgeReadiness>(() => {
    const entryCounts: Record<string, number> = {};
    const categoryLastUpdated: Record<string, string> = {};
    for (const e of entries) {
      entryCounts[e.category] = (entryCounts[e.category] || 0) + 1;
      if (!categoryLastUpdated[e.category]) categoryLastUpdated[e.category] = e.updated_at;
    }

    const templateOnlyCategories: string[] = [];
    enhancedKnowledgeCategories.forEach(cat => {
      const catEntries = entries.filter(e => e.category === cat.name);
      if (catEntries.length > 0 && catEntries.every(e => (e.content || '').includes(TEMPLATE_MARKER))) {
        templateOnlyCategories.push(cat.name);
      }
    });

    const categoryCoverage: CategoryCoverage[] = enhancedKnowledgeCategories.map(cat => ({
      name: cat.name,
      priority: cat.priority,
      entryCount: entryCounts[cat.name] || 0,
      hasContent: (entryCounts[cat.name] || 0) > 0,
      description: cat.description,
    }));

    const essentialCategories = getEssentialCategories();
    const essentialCovered = categoryCoverage.filter(c => c.priority === 'essential' && c.hasContent).length;
    const essentialScore = Math.round((essentialCovered / Math.max(essentialCategories.length, 1)) * 100);

    const recommendedCovered = categoryCoverage.filter(c => c.priority === 'recommended' && c.hasContent).length;
    const optionalCovered = categoryCoverage.filter(c => c.priority === 'optional' && c.hasContent).length;
    const recommendedTotal = Math.max(categoryCoverage.filter(c => c.priority === 'recommended').length, 1);
    const optionalTotal = Math.max(categoryCoverage.filter(c => c.priority === 'optional').length, 1);

    const overallScore = Math.round(
      (essentialCovered / Math.max(essentialCategories.length, 1)) * 60 +
      (recommendedCovered / recommendedTotal) * 30 +
      (optionalCovered / optionalTotal) * 10
    );

    return {
      overallScore,
      essentialScore,
      totalEntries: entries.length,
      categoryCoverage,
      isReady: essentialScore >= READINESS_THRESHOLD,
      needsAttention: essentialScore < ATTENTION_THRESHOLD,
      isEmpty: entries.length === 0,
      missingEssential: categoryCoverage.filter(c => c.priority === 'essential' && !c.hasContent).map(c => c.name),
      missingRecommended: categoryCoverage.filter(c => c.priority === 'recommended' && !c.hasContent).map(c => c.name),
      templateOnlyCategories,
      categoryLastUpdated,
      isLoading,
      error: error ? 'Failed to load knowledge base' : null,
    };
  }, [entries, isLoading, error]);
}
