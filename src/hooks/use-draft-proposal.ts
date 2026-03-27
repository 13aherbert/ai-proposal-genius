import { useState, useCallback } from "react";
import type { Opportunity } from "@/hooks/use-opportunity-search";

export function useDraftProposal() {
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const openDraftDialog = useCallback((opportunity: Opportunity, _onClose?: () => void) => {
    setSelectedOpportunity(opportunity);
    setIsDialogOpen(true);
  }, []);

  const closeDraftDialog = useCallback(() => {
    setIsDialogOpen(false);
    setSelectedOpportunity(null);
  }, []);

  return {
    selectedOpportunity,
    isDialogOpen,
    openDraftDialog,
    closeDraftDialog,
    setIsDialogOpen,
  };
}
