import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Bookmark, Calendar, Building2, Hash, Eye, FileText, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useDraftProposal } from "@/hooks/use-draft-proposal";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  }
}

function getSourceLabel(source: string) {
  switch (source) {
    case "sam_gov": return "SAM.gov";
    case "grants_gov": return "Grants.gov";
    default: return source;
  }
}

function getSourceFallbackUrl(source: string) {
  switch (source) {
    case "sam_gov": return "https://sam.gov";
    case "grants_gov": return "https://www.grants.gov";
    default: return "#";
  }
}

function getSourceColor(source: string) {
  switch (source) {
    case "sam_gov": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "grants_gov": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    default: return "";
  }
}

export function OpportunityCard({ opportunity, onSave, onViewDetails, isSaved }: OpportunityCardProps) {
  const { draftProposal, isDrafting } = useDraftProposal();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2">
            {opportunity.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0">
            <Badge className={`text-[10px] border-0 ${getSourceColor(opportunity.source)}`}>
              {getSourceLabel(opportunity.source)}
            </Badge>
            {opportunity.type && (
              <Badge variant="secondary" className="text-xs">
                {opportunity.type}
              </Badge>
            )}
          </div>
        </div>
        {opportunity.solicitation_number && (
          <p className="text-xs text-muted-foreground font-mono">
            {opportunity.solicitation_number}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {opportunity.department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5" />
              <span className="line-clamp-1">{opportunity.department}</span>
            </span>
          )}
          {opportunity.naics_code && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5" />
              {opportunity.naics_code}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Posted: {formatDate(opportunity.posted_date)}
          </span>
          {opportunity.response_deadline && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              <Calendar className="h-3.5 w-3.5" />
              Due: {formatDate(opportunity.response_deadline)}
            </span>
          )}
        </div>

        {opportunity.set_aside && (
          <Badge variant="outline" className="text-xs">
            {opportunity.set_aside}
          </Badge>
        )}

        <div className="flex items-center gap-2 pt-1 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onViewDetails(opportunity)}
          >
            <Eye className="mr-1.5 h-3.5 w-3.5" />
            Details
          </Button>
          <Button
            size="sm"
            variant={isSaved ? "secondary" : "default"}
            onClick={() => onSave(opportunity)}
            disabled={isSaved}
          >
            <Bookmark className="mr-1.5 h-3.5 w-3.5" />
            {isSaved ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => draftProposal(opportunity)}
            disabled={isDrafting}
          >
            {isDrafting ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <FileText className="mr-1.5 h-3.5 w-3.5" />
            )}
            {isDrafting ? "Fetching..." : "Draft Proposal"}
          </Button>
          <Button size="sm" variant="ghost" asChild>
            <a href={opportunity.description_url || getSourceFallbackUrl(opportunity.source)} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
