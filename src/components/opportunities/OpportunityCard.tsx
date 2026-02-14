import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Bookmark, Calendar, Building2, Hash } from "lucide-react";
import { format, parseISO } from "date-fns";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    // SAM.gov sometimes uses MM/dd/yyyy format
    try {
      return format(new Date(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  }
}

export function OpportunityCard({ opportunity, onSave, isSaved }: OpportunityCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2">
            {opportunity.title}
          </CardTitle>
          {opportunity.type && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {opportunity.type}
            </Badge>
          )}
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

        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            variant={isSaved ? "secondary" : "default"}
            onClick={() => onSave(opportunity)}
            disabled={isSaved}
          >
            <Bookmark className="mr-1.5 h-3.5 w-3.5" />
            {isSaved ? "Saved" : "Save"}
          </Button>
          {opportunity.description_url && (
            <Button size="sm" variant="outline" asChild>
              <a href={opportunity.description_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View on SAM.gov
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
