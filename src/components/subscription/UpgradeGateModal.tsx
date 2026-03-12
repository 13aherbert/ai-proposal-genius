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

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit?: number;
}

const STARTER_FEATURES = [
  "3 projects",
  "Basic AI analysis",
  "Community support",
];

const BASIC_FEATURES = [
  "10 projects",
  "Enhanced AI analysis",
  "Email support",
  "Priority processing",
  "Data export",
];

export function UpgradeGateModal({
  open,
  onOpenChange,
  currentLimit = 3,
}: UpgradeGateModalProps) {
  const navigate = useNavigate();

  const handleUpgrade = () => {
    onOpenChange(false);
    navigate("/subscription", { state: { fromUpgradeButton: true } });
  };

  const handleSeePlans = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">
            You've reached your free plan limit
          </DialogTitle>
          <DialogDescription className="text-base">
            Your Free Plan includes {currentLimit} projects. Upgrade to unlock
            more.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {/* Starter / Current */}
          <div className="rounded-lg border border-border bg-muted/40 p-5 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold text-muted-foreground">
                Free Plan
              </span>
              <Badge variant="secondary" className="text-xs">
                Current
              </Badge>
            </div>
            <ul className="space-y-2 flex-1">
              {STARTER_FEATURES.map((f) => (
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

          {/* Basic / Recommended */}
          <div className="rounded-lg border-2 border-brand-green bg-card p-5 flex flex-col relative">
            <div className="flex items-center gap-2 mb-3">
              <span className="font-semibold">Basic Plan</span>
              <Badge className="text-xs bg-brand-green text-primary-foreground">
                Recommended
              </Badge>
            </div>
            <ul className="space-y-2 flex-1">
              {BASIC_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 shrink-0 text-brand-green" />
                  {f}
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-4">
              Most users save 20+ hours/month
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade to Basic — $49/month
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
        </p>
      </DialogContent>
    </Dialog>
  );
}
