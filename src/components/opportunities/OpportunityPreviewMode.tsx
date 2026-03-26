import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Bookmark,
  Calendar,
  Building2,
  Eye,
  ExternalLink,
  FileText,
  Lock,
  Sparkles,
  ArrowRight,
  Clock,
} from "lucide-react";
import { PlanComparisonModal } from "@/components/subscription/PlanComparisonModal";

interface SampleOpportunity {
  id: string;
  title: string;
  department: string;
  source: string;
  type: string;
  posted_date: string;
  response_deadline: string;
  solicitation_number: string;
  description: string;
  set_aside: string | null;
}

const SAMPLE_OPPORTUNITIES: SampleOpportunity[] = [
  {
    id: "sample-1",
    title: "IT Infrastructure Modernization & Cloud Migration Services",
    department: "U.S. Department of Energy",
    source: "SAM.gov",
    type: "Solicitation",
    posted_date: "Mar 15, 2026",
    response_deadline: "Apr 30, 2026",
    solicitation_number: "DE-SOL-0015847",
    description:
      "The Department of Energy seeks qualified vendors to provide IT infrastructure modernization services including cloud migration, cybersecurity enhancements, and legacy system decommissioning across multiple facilities. This is a multi-year contract with an estimated value of $2.5M–$5M.",
    set_aside: "Small Business",
  },
  {
    id: "sample-2",
    title: "Comprehensive Marketing & Communications Services RFP",
    department: "City of Philadelphia",
    source: "SAM.gov",
    type: "Combined Synopsis/Solicitation",
    posted_date: "Mar 10, 2026",
    response_deadline: "Apr 15, 2026",
    solicitation_number: "PHI-2026-MKT-0042",
    description:
      "The City of Philadelphia is seeking a full-service marketing and communications firm to develop and execute integrated campaigns across digital, print, and broadcast channels. The selected firm will support public engagement initiatives, brand development, and crisis communications.",
    set_aside: null,
  },
  {
    id: "sample-3",
    title: "Advanced Materials Research Grant — Sustainable Energy Applications",
    department: "NASA — Office of Technology",
    source: "Grants.gov",
    type: "Grant Opportunity",
    posted_date: "Mar 8, 2026",
    response_deadline: "May 20, 2026",
    solicitation_number: "NNH26-RES-0093",
    description:
      "NASA invites proposals for research into advanced materials with applications in sustainable energy systems for space and terrestrial use. Funding ranges from $250K–$1.2M over 24 months. Academic institutions, non-profits, and small businesses are eligible.",
    set_aside: "8(a)",
  },
];

function getSourceColor(source: string) {
  if (source === "SAM.gov")
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
  if (source === "Grants.gov")
    return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
  return "";
}

export function OpportunityPreviewMode() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<SampleOpportunity | null>(null);
  const [searchValue, setSearchValue] = useState("");

  const handleSearchAttempt = () => {
    setShowUpgradeModal(true);
  };

  return (
    <>
      {/* Preview banner */}
      <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-sm">You're viewing sample results</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to Growth to search live government databases including SAM.gov and Grants.gov.
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setShowUpgradeModal(true)} className="shrink-0">
            Unlock Live Search
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Opportunity Finder</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Search RFPs, contracts, and grant opportunities from SAM.gov and Grants.gov
        </p>
      </div>

      {/* Search form (disabled/preview) */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchAttempt();
            }}
            className="space-y-4"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="preview-keyword">Keyword</Label>
                <Input
                  id="preview-keyword"
                  placeholder="e.g., IT services, marketing, research"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Set-Aside</Label>
                <Select disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Any" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="gap-1.5">
              <Search className="h-4 w-4" />
              Search Opportunities
              <Lock className="h-3 w-3 ml-1 opacity-60" />
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Sample results */}
      <p className="text-sm text-muted-foreground mb-3">
        Showing 3 sample results
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {SAMPLE_OPPORTUNITIES.map((opp) => (
          <Card key={opp.id} className="hover:shadow-md transition-shadow relative">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug line-clamp-2">
                  {opp.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-[10px]">
                    Sample
                  </Badge>
                  <Badge className={`text-[10px] border-0 ${getSourceColor(opp.source)}`}>
                    {opp.source}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-muted-foreground font-mono">{opp.solicitation_number}</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  <span className="line-clamp-1">{opp.department}</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  Posted: {opp.posted_date}
                </span>
                <span className="flex items-center gap-1 text-destructive font-medium">
                  <Calendar className="h-3.5 w-3.5" />
                  Due: {opp.response_deadline}
                </span>
              </div>
              {opp.set_aside && (
                <Badge variant="outline" className="text-xs">{opp.set_aside}</Badge>
              )}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => setSelectedSample(opp)}>
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Details
                </Button>
                <Button size="sm" variant="secondary" disabled>
                  <Bookmark className="mr-1.5 h-3.5 w-3.5" />
                  Save
                  <Lock className="ml-1 h-3 w-3 opacity-60" />
                </Button>
                <Button size="sm" variant="outline" disabled>
                  <FileText className="mr-1.5 h-3.5 w-3.5" />
                  Draft Proposal
                  <Lock className="ml-1 h-3 w-3 opacity-60" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-8 rounded-lg border bg-muted/30 p-6 text-center">
        <Lock className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <h3 className="text-lg font-semibold mb-1">Unlock Live Search</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
          Access thousands of real government RFPs, contracts, and grants updated daily from SAM.gov and Grants.gov.
        </p>
        <Button onClick={() => setShowUpgradeModal(true)} size="lg">
          Start 14-Day Free Trial
          <ArrowRight className="ml-1.5 h-4 w-4" />
        </Button>
        <p className="text-xs text-muted-foreground mt-2">Growth plan · $199/month · Cancel anytime</p>
      </div>

      {/* Sample detail modal */}
      <Dialog open={!!selectedSample} onOpenChange={(open) => !open && setSelectedSample(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedSample && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-xs">
                    Sample
                  </Badge>
                  <Badge className={`text-xs border-0 ${getSourceColor(selectedSample.source)}`}>
                    {selectedSample.source}
                  </Badge>
                  {selectedSample.type && (
                    <Badge variant="secondary" className="text-xs">{selectedSample.type}</Badge>
                  )}
                </div>
                <DialogTitle className="text-lg">{selectedSample.title}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 mt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Building2 className="h-3.5 w-3.5" /> Department
                    </span>
                    <p className="font-medium">{selectedSample.department}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Calendar className="h-3.5 w-3.5" /> Posted
                    </span>
                    <p className="font-medium">{selectedSample.posted_date}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground flex items-center gap-1 mb-1">
                      <Clock className="h-3.5 w-3.5" /> Response Deadline
                    </span>
                    <p className="font-medium text-destructive">{selectedSample.response_deadline}</p>
                  </div>
                  {selectedSample.set_aside && (
                    <div>
                      <span className="text-muted-foreground text-xs">Set-Aside</span>
                      <p className="font-medium">{selectedSample.set_aside}</p>
                    </div>
                  )}
                </div>

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {selectedSample.description}
                  </p>
                </div>

                <Separator />

                <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                  <Lock className="h-5 w-5 mx-auto text-primary mb-2" />
                  <p className="text-sm font-medium mb-1">This is sample data</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Upgrade to search live opportunities and take action — save, draft proposals, and more.
                  </p>
                  <Button size="sm" onClick={() => { setSelectedSample(null); setShowUpgradeModal(true); }}>
                    Unlock Live Search
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <PlanComparisonModal open={showUpgradeModal} onOpenChange={setShowUpgradeModal} highlightPlan="growth" />
    </>
  );
}
