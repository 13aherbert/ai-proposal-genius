import { useNavigate } from "react-router-dom";
import { Check, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSubscriptionFeatures } from "@/hooks/use-subscription-features";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";

interface PlanComparisonModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  highlightPlan?: string;
}

const PLANS = [
  { key: "starter", name: "Starter", price: "Free", cta: null },
  { key: "growth", name: "Growth", price: "$199/mo", cta: "Upgrade to Growth" },
  { key: "business", name: "Business", price: "$499/mo", cta: "Upgrade to Business" },
  { key: "enterprise", name: "Enterprise", price: "$1,499/mo", cta: "Contact Sales" },
] as const;

interface FeatureRow {
  label: string;
  starter: string | boolean;
  growth: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
}

const FEATURES: FeatureRow[] = [
  { label: "Projects", starter: "6", growth: "36", business: "120", enterprise: "Unlimited" },
  { label: "Team Members", starter: "1 user", growth: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
  { label: "AI Analysis", starter: "Basic", growth: "Enhanced", business: "Advanced", enterprise: "Custom" },
  { label: "Support", starter: "Community", growth: "Email", business: "Priority", enterprise: "Dedicated" },
  { label: "Data Export", starter: false, growth: true, business: true, enterprise: true },
  { label: "Team Collaboration", starter: false, growth: true, business: true, enterprise: true },
  { label: "Opportunity Search", starter: false, growth: true, business: true, enterprise: true },
  { label: "Custom Templates", starter: false, growth: true, business: true, enterprise: true },
  { label: "API Access", starter: false, growth: false, business: true, enterprise: true },
  { label: "White Labeling", starter: false, growth: false, business: false, enterprise: true },
  { label: "SSO / SAML", starter: false, growth: false, business: false, enterprise: true },
];

function CellContent({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-brand-green mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/40 mx-auto" />;
  return <span className="text-sm">{value}</span>;
}

export function PlanComparisonModal({ open, onOpenChange, highlightPlan }: PlanComparisonModalProps) {
  const navigate = useNavigate();
  const { plan: currentPlan } = useSubscriptionFeatures();

  const recommended = highlightPlan || (currentPlan === "starter" ? "growth" : currentPlan === "growth" ? "business" : undefined);

  const handleCTA = (planKey: string) => {
    onOpenChange(false);
    if (planKey === "enterprise") {
      navigate("/subscription", { state: { showEnterprise: true } });
    } else {
      navigate("/subscription", { state: { fromUpgradeButton: true, selectedPlan: planKey } });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">Choose the right plan for you</DialogTitle>
          <DialogDescription>
            Compare features across plans. Upgrade when you're ready.
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Feature</TableHead>
                {PLANS.map((p) => (
                  <TableHead key={p.key} className="text-center min-w-[120px]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-semibold">{p.name}</span>
                      {p.key === currentPlan && (
                        <Badge variant="secondary" className="text-[10px]">Current</Badge>
                      )}
                      {p.key === recommended && p.key !== currentPlan && (
                        <Badge className="text-[10px] bg-brand-green text-primary-foreground">Recommended</Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-normal">{p.price}</span>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {FEATURES.map((row) => (
                <TableRow key={row.label}>
                  <TableCell className="font-medium text-sm">{row.label}</TableCell>
                  {PLANS.map((p) => (
                    <TableCell key={p.key} className={`text-center ${p.key === recommended ? "bg-brand-green/5" : ""}`}>
                      <CellContent value={row[p.key]} />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {/* CTA row */}
              <TableRow className="border-0">
                <TableCell />
                {PLANS.map((p) => (
                  <TableCell key={p.key} className="text-center pt-4">
                    {p.key === currentPlan ? (
                      <span className="text-xs text-muted-foreground">Current plan</span>
                    ) : p.cta && PLANS.findIndex(x => x.key === p.key) > PLANS.findIndex(x => x.key === currentPlan) ? (
                      <Button
                        size="sm"
                        variant={p.key === recommended ? "default" : "outline"}
                        onClick={() => handleCTA(p.key)}
                        className="w-full"
                      >
                        {p.cta}
                      </Button>
                    ) : null}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
