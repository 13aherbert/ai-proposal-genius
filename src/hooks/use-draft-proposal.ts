import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Opportunity } from "@/hooks/use-opportunity-search";

export function useDraftProposal() {
  const navigate = useNavigate();
  const [isDrafting, setIsDrafting] = useState(false);

  const draftProposal = useCallback(async (opportunity: Opportunity, onClose?: () => void) => {
    const hasDocuments = opportunity.resource_links && opportunity.resource_links.length > 0;

    if (!hasDocuments && !opportunity.description_text_url) {
      // No documents available — fallback to manual upload with prefill
      toast.info("No downloadable documents found. Redirecting to manual upload.");
      onClose?.();
      navigate("/upload-rfp", {
        state: {
          prefillTitle: opportunity.title,
          prefillDeadline: opportunity.response_deadline,
          prefillAgency: opportunity.department,
        },
      });
      return;
    }

    setIsDrafting(true);
    toast.info("Fetching RFP documents from source...", { duration: 10000, id: "draft-fetch" });

    try {
      const { data, error } = await supabase.functions.invoke("fetch-opportunity-documents", {
        body: {
          resourceLinks: opportunity.resource_links || [],
          descriptionTextUrl: opportunity.description_text_url,
          title: opportunity.title,
          deadline: opportunity.response_deadline,
          agency: opportunity.department,
          source: opportunity.source,
        },
      });

      if (error) throw error;

      if (data?.fallback || data?.error) {
        // Fallback to manual upload
        toast.dismiss("draft-fetch");
        toast.warning(data?.error || "Could not download documents. Redirecting to manual upload.");
        onClose?.();
        navigate("/upload-rfp", {
          state: {
            prefillTitle: opportunity.title,
            prefillDeadline: opportunity.response_deadline,
            prefillAgency: opportunity.department,
          },
        });
        return;
      }

      toast.dismiss("draft-fetch");
      const fileCount = data?.filesDownloaded || 0;
      toast.success(`Project created with ${fileCount} document${fileCount !== 1 ? "s" : ""}!`);

      if (data?.warnings?.length) {
        for (const w of data.warnings) {
          toast.warning(w, { duration: 5000 });
        }
      }

      onClose?.();
      navigate(`/project/${data.projectId}`, {
        state: { autoStart: true },
      });
    } catch (err: any) {
      toast.dismiss("draft-fetch");
      console.error("Draft proposal error:", err);
      toast.error("Failed to fetch documents. Redirecting to manual upload.");
      onClose?.();
      navigate("/upload-rfp", {
        state: {
          prefillTitle: opportunity.title,
          prefillDeadline: opportunity.response_deadline,
          prefillAgency: opportunity.department,
        },
      });
    } finally {
      setIsDrafting(false);
    }
  }, [navigate]);

  return { draftProposal, isDrafting };
}
