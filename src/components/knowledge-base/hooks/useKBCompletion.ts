import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

const ESSENTIAL_CATEGORIES = [
  "Company Overview & Mission",
  "Team & Leadership Bios",
  "Past Performance & Case Studies",
  "Technical Capabilities & Methodologies",
  "Pricing & Rate Structures",
  "Differentiators & Unique Value",
];

const TEMPLATE_MARKER = "Replace with your content";

export function useKBCompletion() {
  const { session } = useAuth();
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    if (!session?.user?.id) return;

    const check = async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_organization_id")
          .eq("profile_id", session.user.id)
          .single();

        if (!profile?.current_organization_id) return;

        const { data: entries } = await supabase
          .from("knowledge_entries")
          .select("category, content")
          .eq("organization_id", profile.current_organization_id);

        if (!entries) return;

        let completed = 0;
        for (const cat of ESSENTIAL_CATEGORIES) {
          const matching = entries.filter((e) => e.category === cat);
          const hasReal = matching.some(
            (e) => e.content && !e.content.includes(TEMPLATE_MARKER)
          );
          if (hasReal) completed++;
        }

        setCompletedCount(completed);
        setAllComplete(completed >= ESSENTIAL_CATEGORIES.length);
      } catch (err) {
        console.error("Error checking KB completion:", err);
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [session?.user?.id]);

  return {
    completedCount,
    totalCategories: ESSENTIAL_CATEGORIES.length,
    isLoading,
    allComplete,
  };
}
