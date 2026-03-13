import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type UpgradeReason = 'project_limit' | 'user_limit';

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit?: number;
  reason?: UpgradeReason;
}

const PROJECT_LIMIT_CONFIG = {
  title: "You've reached your free plan limit",
  description: (limit: number) =>
    `Your Free Plan includes ${limit} projects. Upgrade to unlock more.`,
  starterFeatures: ["12 projects", "1 user", "Basic AI analysis", "Community support"],
  growthFeatures: [
    "36 projects",
    "Unlimited team members",
    "Enhanced AI analysis",
    "Email support",
    "Priority processing",
    "Data export",
  ],
  cta: "Upgrade to Growth — $199/month",
};

const USER_LIMIT_CONFIG = {
  title: "Add Your Team",
  description: () =>
    "Upgrade to invite unlimited team members and collaborate across your organization.",
  starterFeatures: ["12 projects", "1 user only", "Basic AI analysis", "Community support"],
  growthFeatures: [
    "Unlimited team members",
    "36 projects",
    "Enhanced AI analysis",
    "Priority processing",
    "Data export",
    "Email support",
  ],
  cta: "Upgrade to Growth — $199/month",
};

export function UpgradeGateModal({
  open,
  onOpenChange,
  currentLimit = 12,
  reason = 'project_limit',
}: UpgradeGateModalProps) {
  const navigate = useNavigate();
  const config = reason === 'user_limit' ? USER_LIMIT_CONFIG : PROJECT_LIMIT_CONFIG;

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription", { state: { fromUpgradeButton: true } });
  };

  const handleSeePlans = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  const descriptionText =
    reason === 'user_limit'
      ? USER_LIMIT_CONFIG.description()
      : PROJECT_LIMIT_CONFIG.description(currentLimit);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">{config.title}</DialogTitle>
          <DialogDescription className="text-base">
            {descriptionText}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Starter / Current */}
          <div className="rounded-lg border border-border bg-muted/40 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-muted-foreground">
                Starter
              </span>
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            </div>
            <ul className="space-y-2 flex-1">
              {config.starterFeatures.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <Check className="h-4 w-4 shrink-0 text-muted-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Growth / Recommended */}
          <div className="rounded-lg border-2 border-brand-green bg-card p-5 flex flex-col relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">Growth</span>
              <Badge className="text-xs bg-brand-green text-primary-foreground">
                Recommended
              </Badge>
            </div>
            <ul className="space-y-2 flex-1">
              {config.growthFeatures.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-brand-green" />
                  {f}
                </li>
              ))}
            </ul>
            {reason === 'user_limit' && (
              <p className="text-xs text-muted-foreground mt-4">
                $199/month for unlimited users — just $16.50/user for a 12-person team
              </p>
            )}
            {reason === 'project_limit' && (
              <p className="text-xs text-muted-foreground mt-4">
                Most users save 20+ hours/month
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleUpgrade} className="w-full">
            {config.cta}
          </Button>
          <Button
            variant="outline"
            onClick={handleSeePlans}
            className="w-full"
          >
            See all plans
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full text-muted-foreground"
          >
            Maybe later
          </Button>
        </div>

        <p className="text-xs text-center text-muted-foreground mt-1">
          {reason === 'project_limit' ? (
            <>
              Or{" "}
              <button
                onClick={() => {
                  onOpenChange(false);
                  navigate("/dashboard");
                }}
                className="underline hover:text-foreground transition-colors"
              >
                archive an existing project
              </button>{" "}
              to free up a slot. Upgrade when you're ready.
            </>
          ) : (
            <>
              Unlimited team members are included on all paid plans.
            </>
          )}
        </p>
      </DialogContent>
    </Dialog>
  );
}
