import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { toast } from "sonner";

const STARTER_TEMPLATES = [
  {
    category: "Company Overview & Mission",
    title: "Company Overview",
    content: "## Company Overview\n\n*Replace with your content*\n\nDescribe your company's history, mission, and vision. Include key facts like founding year, headquarters, number of employees, and areas of expertise.\n\n### Mission Statement\n[Your mission statement here]\n\n### Core Values\n- [Value 1]\n- [Value 2]\n- [Value 3]",
  },
  {
    category: "Team & Leadership Bios",
    title: "Team Bios",
    content: "## Team & Leadership Bios\n\n*Replace with your content*\n\nList key team members and their qualifications.\n\n### Leadership Team\n- **[Name]** — [Title], [Years of experience], [Key qualifications]\n- **[Name]** — [Title], [Years of experience], [Key qualifications]\n\n### Key Personnel\n- **[Name]** — [Role], [Relevant certifications]",
  },
  {
    category: "Past Performance & Case Studies",
    title: "Past Performance",
    content: "## Past Performance\n\n*Replace with your content*\n\nHighlight 3-5 relevant past projects that demonstrate your capabilities.\n\n### Project 1: [Project Name]\n- **Client:** [Client name]\n- **Value:** $[Amount]\n- **Duration:** [Timeline]\n- **Outcome:** [Key results achieved]",
  },
  {
    category: "Technical Capabilities & Methodologies",
    title: "Technical Capabilities",
    content: "## Technical Capabilities\n\n*Replace with your content*\n\nDescribe your technical approach, methodologies, tools, and certifications.\n\n### Methodologies\n- [Methodology 1]\n- [Methodology 2]\n\n### Certifications\n- [Certification 1]\n- [Certification 2]\n\n### Tools & Technologies\n- [Tool/Technology 1]",
  },
  {
    category: "Pricing & Rate Structures",
    title: "Pricing & Rates",
    content: "## Pricing & Rate Structures\n\n*Replace with your content*\n\nOutline your standard pricing models and rate structures.\n\n### Rate Card\n| Role | Hourly Rate |\n|------|------------|\n| [Role 1] | $[Rate] |\n| [Role 2] | $[Rate] |\n\n### Pricing Models\n- Fixed Price\n- Time & Materials\n- Cost-Plus",
  },
  {
    category: "Differentiators & Unique Value",
    title: "Differentiators",
    content: "## What Sets Us Apart\n\n*Replace with your content*\n\nDescribe what makes your organization unique and why clients should choose you.\n\n### Key Differentiators\n1. **[Differentiator 1]** — [Explanation]\n2. **[Differentiator 2]** — [Explanation]\n3. **[Differentiator 3]** — [Explanation]\n\n### Awards & Recognition\n- [Award 1]",
  },
];

export function useStarterTemplates() {
  const { session } = useAuth();
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedingProgress, setSeedingProgress] = useState(0);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (!session?.user?.id || hasChecked.current) return;
    hasChecked.current = true;

    const checkAndSeed = async () => {
      try {
        // Get user's organization
        const { data: profile } = await supabase
          .from("profiles")
          .select("current_organization_id")
          .eq("profile_id", session.user.id)
          .single();

        const orgId = profile?.current_organization_id;
        if (!orgId) return;

        // Check if KB already has entries
        const { count } = await supabase
          .from("knowledge_entries")
          .select("entry_id", { count: "exact", head: true })
          .eq("organization_id", orgId);

        if (count && count > 0) return;

        // Seed templates
        setIsSeeding(true);
        setSeedingProgress(0);

        for (let i = 0; i < STARTER_TEMPLATES.length; i++) {
          const template = STARTER_TEMPLATES[i];
          await supabase.from("knowledge_entries").insert({
            organization_id: orgId,
            user_id: session.user.id,
            category: template.category,
            title: template.title,
            content: template.content,
            parsing_status: "completed",
          });
          setSeedingProgress(Math.round(((i + 1) / STARTER_TEMPLATES.length) * 100));
        }

        toast.success("Knowledge base populated with starter templates!", {
          description: "Replace the placeholder content with your own.",
        });
      } catch (err) {
        console.error("Error seeding starter templates:", err);
      } finally {
        setIsSeeding(false);
      }
    };

    checkAndSeed();
  }, [session?.user?.id]);

  return { isSeeding, seedingProgress };
}
