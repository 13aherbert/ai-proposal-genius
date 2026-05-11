import { Lock, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TierBadge } from "./TierBadge";
import { useNavigate } from "react-router-dom";

type RequiredTier = 'growth' | 'business' | 'enterprise';

const TIER_PRICING: Record<RequiredTier, string> = {
  growth: "$199/month",
  business: "$499/month",
  enterprise: "Custom pricing",
};

const TIER_DISPLAY: Record<RequiredTier, string> = {
  growth: "Growth",
  business: "Business",
  enterprise: "Enterprise",
};

interface GatedFeatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName: string;
  requiredTier: RequiredTier;
  description: string;
  benefits: string[];
}

export function GatedFeatureModal({
  open,
  onOpenChange,
  featureName,
  requiredTier,
  description,
  benefits,
}: GatedFeatureModalProps) {
  const navigate = useNavigate();
  const tierDisplay = TIER_DISPLAY[requiredTier];
  const pricing = TIER_PRICING[requiredTier];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3 pt-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-3">
              <Lock className="h-6 w-6 text-muted-foreground" />
            </div>
          </div>
          <DialogTitle className="text-xl">Unlock {featureName}</DialogTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {description}
          </p>
        </DialogHeader>

        <ul className="space-y-2.5 my-4">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm text-foreground">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-brand-green" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>

        <div className="flex justify-center mb-3">
          <TierBadge tier={requiredTier} />
        </div>

        <div className="space-y-2">
          <Button
            size="lg"
            onClick={() => { onOpenChange(false); navigate('/subscription'); }}
            className="w-full"
          >
            Upgrade to {tierDisplay} — {pricing}
          </Button>
          <Button
            variant="link"
            size="sm"
            onClick={() => { onOpenChange(false); navigate('/subscription'); }}
            className="w-full text-muted-foreground"
          >
            Compare All Plans <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
