import { useNavigate } from "react-router-dom";
import { Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

type UpgradeReason = 'project_limit' | 'user_limit';

interface UpgradeGateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentLimit?: number;
  reason?: UpgradeReason;
}

const COMPARISON_ROWS = [
  { label: "Price", starter: "$0", growth: "$199/mo" },
  { label: "Projects", starter: "12", growth: "36" },
  { label: "Team Members", starter: "1 user", growth: "Unlimited 🚀", highlight: true },
  { label: "Support", starter: "Community", growth: "Email (24hr)" },
];

export function UpgradeGateModal({
  open,
  onOpenChange,
  currentLimit = 12,
  reason = 'project_limit',
}: UpgradeGateModalProps) {
  const navigate = useNavigate();

  const headline =
    reason === 'user_limit'
      ? "Add Your Entire Team"
      : `You've used ${currentLimit} of ${currentLimit} projects`;

  const subheadline =
    reason === 'user_limit'
      ? "Upgrade to invite unlimited team members"
      : "Upgrade for 3x more projects + unlimited team";

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
      <DialogContent className="max-w-lg">
        <DialogHeader className="text-center sm:text-center">
          <div className="flex justify-center mb-2">
            <Users className="h-8 w-8 text-brand-green" />
          </div>
          <DialogTitle className="text-xl">{headline}</DialogTitle>
          <DialogDescription className="text-base">
            {subheadline}
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Feature</TableHead>
                <TableHead className="text-center text-muted-foreground">Starter</TableHead>
                <TableHead className="text-center font-semibold">Growth</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPARISON_ROWS.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium text-sm">{row.label}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">
                    {row.starter}
                  </TableCell>
                  <TableCell
                    className={`text-center text-sm ${
                      row.highlight
                        ? "text-brand-green font-bold text-lg"
                        : "font-medium"
                    }`}
                  >
                    {row.growth}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Value calculation */}
        <div className="rounded-lg bg-muted/60 p-4 mt-3 space-y-1">
          <p className="text-sm font-semibold">For a 12-person team:</p>
          <div className="flex justify-between text-sm">
            <span>OptiRFP Growth</span>
            <span className="font-medium text-brand-green">$16.50/person</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Loopio</span>
            <span className="text-muted-foreground line-through">$1,667/person</span>
          </div>
          <p className="text-xs text-muted-foreground pt-1">Save 99% per user</p>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <Button onClick={handleUpgrade} className="w-full">
            Upgrade to Growth — $199/month
          </Button>
          <Button variant="outline" onClick={handleUpgrade} className="w-full">
            Start with 14-day free trial
          </Button>
          <Button variant="ghost" onClick={handleSeePlans} className="w-full text-muted-foreground">
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

        {reason === 'project_limit' && (
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
            to free up a slot.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
