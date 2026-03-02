import { useEffect, useRef, useState } from "react";
import { toast } from "@/hooks/use-toast";
import { KnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import confetti from "canvas-confetti";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

interface KBMilestonesProps {
  readiness: KnowledgeReadiness;
}

const MILESTONE_KEYS = {
  half: "kb_milestone_50",
  essentials: "kb_milestone_100_essential",
  all: "kb_milestone_100_all",
};

export const KBMilestones = ({ readiness }: KBMilestonesProps) => {
  const { essentialScore, overallScore, isLoading, categoryCoverage } = readiness;
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const hasChecked = useRef(false);

  const allFilled = categoryCoverage.length > 0 && categoryCoverage.every(c => c.hasContent);

  useEffect(() => {
    if (isLoading || hasChecked.current) return;
    hasChecked.current = true;

    // 50% essentials
    if (essentialScore >= 50 && !localStorage.getItem(MILESTONE_KEYS.half)) {
      localStorage.setItem(MILESTONE_KEYS.half, "true");
      toast({ title: "Halfway there! 🎉", description: "You've filled half of the essential categories." });
    }

    // 100% essentials
    if (essentialScore >= 100 && !localStorage.getItem(MILESTONE_KEYS.essentials)) {
      localStorage.setItem(MILESTONE_KEYS.essentials, "true");
      setShowCompleteModal(true);
      confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    // 100% all
    if (allFilled && !localStorage.getItem(MILESTONE_KEYS.all)) {
      localStorage.setItem(MILESTONE_KEYS.all, "true");
      toast({ title: "KB Master! 🏆", description: "All categories are filled. You're a Knowledge Base master!" });
    }
  }, [isLoading, essentialScore, allFilled]);

  return (
    <Dialog open={showCompleteModal} onOpenChange={setShowCompleteModal}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            Knowledge Base Ready!
          </DialogTitle>
          <DialogDescription>
            All essential categories are filled. You can now generate high-quality proposals powered by your company data.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end">
          <Button onClick={() => setShowCompleteModal(false)}>Got it!</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
