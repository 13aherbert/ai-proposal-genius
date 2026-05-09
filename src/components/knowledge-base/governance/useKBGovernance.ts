import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { toast } from "sonner";

export interface ReviewCycle {
  id: string;
  category: string;
  review_frequency_days: number;
  assigned_to: string | null;
  last_reviewed_at: string | null;
  last_reviewed_by: string | null;
  next_review_at: string | null;
}

export interface ReviewHistoryEntry {
  id: string;
  category: string;
  reviewed_by: string;
  reviewed_at: string;
  notes: string | null;
}

export interface QAPair {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface HealthScore {
  category: string;
  total_entries: number;
  stale_entries: number;
  duplicate_count: number;
  completeness_score: number;
  freshness_score: number;
  overall_score: number;
  calculated_at: string;
}

export function useKBGovernance(enabled: boolean = true) {
  const { session } = useAuth();
  const { organization } = useCurrentOrganization();
  const orgId = organization?.id ?? null;
  const [reviewCycles, setReviewCycles] = useState<ReviewCycle[]>([]);
  const [healthScores, setHealthScores] = useState<HealthScore[]>([]);
  const [qaPairs, setQAPairs] = useState<QAPair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!orgId) return;
    setIsLoading(true);
    try {
      const [cyclesRes, healthRes, qaRes] = await Promise.all([
        supabase.from("kb_review_cycles").select("*").eq("organization_id", orgId),
        supabase.from("kb_health_scores").select("*").eq("organization_id", orgId),
        supabase.from("kb_qa_pairs").select("*").eq("organization_id", orgId).order("created_at", { ascending: false }),
      ]);
      if (cyclesRes.data) setReviewCycles(cyclesRes.data as ReviewCycle[]);
      if (healthRes.data) setHealthScores(healthRes.data as HealthScore[]);
      if (qaRes.data) setQAPairs(qaRes.data as QAPair[]);
      setHasFetched(true);
    } catch (err) {
      console.error("Error fetching governance data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [orgId]);

  // Lazy: only fetch when panel is opened (enabled=true) and org is known
  useEffect(() => {
    if (enabled && orgId && !hasFetched) {
      fetchAll();
    }
  }, [enabled, orgId, hasFetched, fetchAll]);

  const upsertReviewCycle = async (category: string, frequencyDays: number, assignedTo?: string | null) => {
    if (!orgId) return;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + frequencyDays);
    
    const { error } = await supabase.from("kb_review_cycles").upsert({
      organization_id: orgId,
      category,
      review_frequency_days: frequencyDays,
      assigned_to: assignedTo || null,
      next_review_at: nextReview.toISOString(),
      updated_at: new Date().toISOString(),
    }, { onConflict: "organization_id,category" });

    if (error) {
      toast.error("Failed to save review cycle");
      console.error(error);
    } else {
      toast.success("Review cycle updated");
      fetchAll();
    }
  };

  const markAsReviewed = async (category: string, notes?: string) => {
    if (!orgId || !session?.user?.id) return;
    const now = new Date().toISOString();

    // Find cycle to compute next review
    const cycle = reviewCycles.find(c => c.category === category);
    const freqDays = cycle?.review_frequency_days || 90;
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + freqDays);

    const [histRes, cycleRes] = await Promise.all([
      supabase.from("kb_review_history").insert({
        organization_id: orgId,
        category,
        reviewed_by: session.user.id,
        reviewed_at: now,
        notes: notes || null,
      }),
      supabase.from("kb_review_cycles").upsert({
        organization_id: orgId,
        category,
        review_frequency_days: freqDays,
        last_reviewed_at: now,
        last_reviewed_by: session.user.id,
        next_review_at: nextReview.toISOString(),
        updated_at: now,
      }, { onConflict: "organization_id,category" }),
    ]);

    if (histRes.error || cycleRes.error) {
      toast.error("Failed to mark as reviewed");
    } else {
      toast.success(`"${category}" marked as reviewed`);
      fetchAll();
    }
  };

  const addQAPair = async (category: string, question: string, answer: string, tags: string[] = []) => {
    if (!orgId || !session?.user?.id) return;
    const { error } = await supabase.from("kb_qa_pairs").insert({
      organization_id: orgId,
      user_id: session.user.id,
      category,
      question,
      answer,
      tags,
    });
    if (error) {
      toast.error("Failed to add Q&A pair");
    } else {
      toast.success("Q&A pair added");
      fetchAll();
    }
  };

  const deleteQAPair = async (id: string) => {
    const { error } = await supabase.from("kb_qa_pairs").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete Q&A pair");
    } else {
      toast.success("Q&A pair removed");
      fetchAll();
    }
  };

  const calculateHealthScores = async () => {
    if (!orgId || !session?.user?.id) return;
    try {
      // Fetch all entries for this org
      const { data: entries } = await supabase
        .from("knowledge_entries")
        .select("category, updated_at, content, title")
        .eq("organization_id", orgId);

      if (!entries) return;

      const now = new Date();
      const categoryMap: Record<string, typeof entries> = {};
      for (const e of entries) {
        if (!categoryMap[e.category]) categoryMap[e.category] = [];
        categoryMap[e.category].push(e);
      }

      const scores: Array<{
        organization_id: string;
        category: string;
        total_entries: number;
        stale_entries: number;
        duplicate_count: number;
        completeness_score: number;
        freshness_score: number;
        overall_score: number;
        calculated_at: string;
      }> = [];

      for (const [cat, catEntries] of Object.entries(categoryMap)) {
        const total = catEntries.length;
        const stale = catEntries.filter(e => {
          const updated = new Date(e.updated_at);
          return (now.getTime() - updated.getTime()) > 90 * 24 * 60 * 60 * 1000;
        }).length;

        // Simple title-based duplicate detection
        const titles = catEntries.map(e => e.title.toLowerCase().trim());
        const dupes = titles.length - new Set(titles).size;

        const completeness = Math.min(100, total * 20); // 5+ entries = 100%
        const freshness = total > 0 ? Math.round(((total - stale) / total) * 100) : 0;
        const overall = Math.round((completeness * 0.4 + freshness * 0.4 + Math.max(0, 100 - dupes * 20) * 0.2));

        scores.push({
          organization_id: orgId,
          category: cat,
          total_entries: total,
          stale_entries: stale,
          duplicate_count: dupes,
          completeness_score: completeness,
          freshness_score: freshness,
          overall_score: overall,
          calculated_at: now.toISOString(),
        });
      }

      // Upsert all scores
      for (const score of scores) {
        await supabase.from("kb_health_scores").upsert(score, { onConflict: "organization_id,category" });
      }

      toast.success("Health scores recalculated");
      fetchAll();
    } catch (err) {
      console.error("Error calculating health scores:", err);
      toast.error("Failed to calculate health scores");
    }
  };

  const checkDuplicates = async (title: string, content: string, category: string): Promise<string[]> => {
    if (!orgId) return [];
    try {
      const searchTerm = `%${title.split(" ").slice(0, 3).join(" ")}%`;
      const { data } = await supabase
        .from("knowledge_entries")
        .select("title, category")
        .eq("organization_id", orgId)
        .ilike("title", searchTerm)
        .limit(5);

      return (data || []).map(e => `${e.title} (${e.category})`);
    } catch {
      return [];
    }
  };

  return {
    reviewCycles,
    healthScores,
    qaPairs,
    isLoading,
    orgId,
    upsertReviewCycle,
    markAsReviewed,
    addQAPair,
    deleteQAPair,
    calculateHealthScores,
    checkDuplicates,
    refresh: fetchAll,
  };
}
