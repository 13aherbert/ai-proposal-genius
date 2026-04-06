import { Check, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface FeatureComparisonTableProps {
  currentPlan: string;
}

const PLANS = [
  { key: "starter", name: "Starter", price: "Free" },
  { key: "growth", name: "Growth", price: "$199/mo" },
  { key: "business", name: "Business", price: "$499/mo" },
  { key: "enterprise", name: "Enterprise", price: "$1,499+/mo" },
] as const;

interface FeatureRow {
  label: string;
  category?: boolean;
  starter: string | boolean;
  growth: string | boolean;
  business: string | boolean;
  enterprise: string | boolean;
}

const FEATURES: FeatureRow[] = [
  // Projects & Usage
  { label: "Projects & Usage", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "Projects per year", starter: "6", growth: "36", business: "120", enterprise: "Unlimited" },
  { label: "Team members", starter: "1", growth: "Unlimited", business: "Unlimited", enterprise: "Unlimited" },
  
  // AI Features
  { label: "AI Capabilities", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "AI RFP Summary", starter: "Basic", growth: "Enhanced", business: "Advanced", enterprise: "Custom" },
  { label: "AI Proposal Outline", starter: true, growth: true, business: true, enterprise: true },
  { label: "AI Proposal Draft", starter: "Watermarked", growth: true, business: true, enterprise: true },
  { label: "AI Auto-Generated Proposal", starter: false, growth: false, business: true, enterprise: true },
  { label: "AI Proposal Evaluation", starter: false, growth: false, business: true, enterprise: true },
  
  // Proposal Workflow
  { label: "Proposal Workflow", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "Draft editing", starter: true, growth: true, business: true, enterprise: true },
  { label: "Compiled proposal view", starter: false, growth: true, business: true, enterprise: true },
  { label: "Review & approval workflow", starter: false, growth: true, business: true, enterprise: true },
  { label: "Design Studio", starter: false, growth: false, business: true, enterprise: true },
  { label: "Document export (PDF/DOCX)", starter: false, growth: true, business: true, enterprise: true },
  { label: "Export templates", starter: false, growth: "3", business: "8+", enterprise: "Custom" },
  { label: "Custom branding on exports", starter: false, growth: false, business: true, enterprise: true },
  
  // Opportunity Search
  { label: "Opportunity Search", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "Opportunity Finder", starter: "Samples only", growth: "10 searches/mo", business: "Unlimited", enterprise: "Unlimited" },
  { label: "SAM.gov integration", starter: false, growth: true, business: true, enterprise: true },
  { label: "Grants.gov integration", starter: false, growth: true, business: true, enterprise: true },
  { label: "State sources (CA, TX, NY)", starter: false, growth: true, business: true, enterprise: true },
  { label: "Saved search alerts", starter: false, growth: true, business: true, enterprise: true },

  // Knowledge Base
  { label: "Knowledge Base", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "Knowledge Base categories", starter: "12", growth: "12", business: "12", enterprise: "Custom" },
  { label: "Document parsing", starter: true, growth: true, business: true, enterprise: true },
  
  // Integrations
  { label: "Integrations & API", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "Google Drive / Dropbox", starter: true, growth: true, business: true, enterprise: true },
  { label: "Salesforce / HubSpot", starter: false, growth: false, business: true, enterprise: true },
  { label: "Slack / Teams notifications", starter: false, growth: false, business: true, enterprise: true },
  { label: "API access", starter: false, growth: false, business: "5,000 calls/mo", enterprise: "Unlimited" },
  { label: "Custom integrations", starter: false, growth: false, business: false, enterprise: true },
  
  // Security & Support
  { label: "Security & Support", category: true, starter: "", growth: "", business: "", enterprise: "" },
  { label: "SSO / SAML", starter: false, growth: false, business: false, enterprise: true },
  { label: "SOC 2 / FedRAMP", starter: false, growth: false, business: false, enterprise: true },
  { label: "White labeling", starter: false, growth: false, business: false, enterprise: true },
  { label: "Support", starter: "Community", growth: "Email", business: "Priority", enterprise: "Dedicated CSM" },
  { label: "SLA guarantee", starter: false, growth: false, business: false, enterprise: "4-hour" },
];

function CellContent({ value }: { value: string | boolean }) {
  if (value === true) return <Check className="h-4 w-4 text-brand-green mx-auto" />;
  if (value === false) return <Minus className="h-4 w-4 text-muted-foreground/30 mx-auto" />;
  if (value === "") return null;
  return <span className="text-sm">{value}</span>;
}

export function FeatureComparisonTable({ currentPlan }: FeatureComparisonTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[220px] sticky left-0 bg-muted/50 z-10">Feature</TableHead>
            {PLANS.map((p) => (
              <TableHead key={p.key} className={cn("text-center min-w-[130px]", p.key === currentPlan && "bg-primary/5")}>
                <div className="flex flex-col items-center gap-1">
                  <span className="font-semibold">{p.name}</span>
                  {p.key === currentPlan && (
                    <Badge variant="secondary" className="text-[10px]">Current</Badge>
                  )}
                  <span className="text-xs text-muted-foreground font-normal">{p.price}</span>
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FEATURES.map((row) => {
            if (row.category) {
              return (
                <TableRow key={row.label} className="bg-muted/30 hover:bg-muted/30">
                  <TableCell colSpan={5} className="font-semibold text-sm py-3">
                    {row.label}
                  </TableCell>
                </TableRow>
              );
            }

            return (
              <TableRow key={row.label}>
                <TableCell className="text-sm sticky left-0 bg-background z-10">{row.label}</TableCell>
                {PLANS.map((p) => (
                  <TableCell
                    key={p.key}
                    className={cn("text-center", p.key === currentPlan && "bg-primary/5")}
                  >
                    <CellContent value={row[p.key as keyof FeatureRow] as string | boolean} />
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
