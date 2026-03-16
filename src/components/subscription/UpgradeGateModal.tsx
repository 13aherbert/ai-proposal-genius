import { useNavigate } from "react-router-dom";
import { Rocket, Zap, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type CurrentPlan = 'starter' | 'growth' | 'business' | 'enterprise';

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit?: number;
  currentPlan?: CurrentPlan;
}

const STARTER_BULLETS = [
  "36 projects per year (6× more)",
  "Unlimited team members",
  "No more watermarks on exports",
  "Opportunity Search to find new RFPs",
  "Email support",
];

const GROWTH_BULLETS = [
  "120 projects per year (3× more)",
  "Unlimited Opportunity Search",
  "API access for integrations",
  "AI Proposal Evaluation",
  "Priority support (4-hour response)",
];

export function UpgradeGateModal({
  open,
  onOpenChange,
  currentLimit = 6,
  currentPlan = 'starter',
}: UpgradeGateModalProps) {
  const navigate = useNavigate();

  const isGrowth = currentPlan === 'growth';

  const headline = isGrowth
    ? "You've reached your Growth plan limit"
    : `You've used all ${currentLimit} projects`;

  const subheadline = isGrowth
    ? "Upgrade to Business for $499/month:"
    : "Upgrade to Growth for $199/month and get:";

  const bullets = isGrowth ? GROWTH_BULLETS : STARTER_BULLETS;

  const primaryCta = isGrowth
    ? "Upgrade to Business — $499/month"
    : "Upgrade to Growth — $199/month";

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription", { state: { fromUpgradeButton: true } });
  };

  const handleExploreBusiness = () => {
    onOpenChange(false);
    navigate("/subscription", { state: { highlightPlan: "business" } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex justify-center mb-2">
            {isGrowth ? (
              <Zap className="h-8 w-8 text-primary" />
            ) : (
              <Rocket className="h-8 w-8 text-brand-green" />
            )}
          </div>
          <DialogTitle className="text-xl">{headline}</DialogTitle>
          <DialogDescription className="text-base">
            {subheadline}
          </DialogDescription>
        </DialogHeader>

        {/* Feature bullets */}
        <ul className="mt-4 space-y-2.5">
          {bullets.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-brand-green" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="flex flex-col gap-2 mt-6">
          <Button onClick={handleUpgrade} className="w-full">
            {primaryCta}
          </Button>

          {!isGrowth && (
            <Button variant="outline" onClick={handleExploreBusiness} className="w-full">
              Explore Business Plan
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>

        {/* Microcopy */}
        <p className="text-xs text-center text-muted-foreground mt-1">
          14-day free trial · Cancel anytime
        </p>

        {currentPlan === 'starter' && (
          <p className="text-xs text-center text-muted-foreground mt-1">
            Or{" "}
            <button
              onClick={() => {
                onOpenChange(false);
                navigate("/projects");
              }}
              className="underline hover:text-foreground transition-colors"
            >
              archive an existing project
            </button>{" "}
            to free up a slot.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
