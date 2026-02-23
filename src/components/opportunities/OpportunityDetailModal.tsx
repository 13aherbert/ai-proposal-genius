import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ExternalLink,
  Bookmark,
  Calendar,
  Building2,
  Hash,
  Clock,
  FileText,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMMM d, yyyy");
  } catch {
    try {
      return format(new Date(dateStr), "MMMM d, yyyy");
    } catch {
      return dateStr;
    }
  }
}

function getDaysRemaining(dateStr: string | null): string | null {
  if (!dateStr) return null;
  try {
    const deadline = parseISO(dateStr);
    const days = differenceInDays(deadline, new Date());
    if (days < 0) return "Expired";
    if (days === 0) return "Due today";
    if (days === 1) return "1 day left";
    return `${days} days left`;
  } catch {
    try {
      const deadline = new Date(dateStr);
      const days = differenceInDays(deadline, new Date());
      if (days < 0) return "Expired";
      if (days === 0) return "Due today";
      return `${days} days left`;
    } catch {
      return null;
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

function getSourceColor(source: string) {
  switch (source) {
    case "sam_gov": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "grants_gov": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    default: return "";
  }
}

function extractDescription(rawData: Record<string, unknown>): string {
  // Try common fields from both SAM.gov and Grants.gov
  const fields = [
    "description",
    "synopsis",
    "additionalInformationOnEligibility",
    "awardCeiling",
    "awardFloor",
  ];
  for (const field of fields) {
    if (rawData[field] && typeof rawData[field] === "string") {
      return rawData[field] as string;
    }
  }
  // For nested description objects
  if (rawData.description && typeof rawData.description === "object") {
    const desc = rawData.description as Record<string, unknown>;
    if (desc.body && typeof desc.body === "string") return desc.body;
  }
  return "";
}

export function OpportunityDetailModal({
  opportunity,
  open,
  onOpenChange,
  onSave,
  isSaved,
}: OpportunityDetailModalProps) {
  if (!opportunity) return null;

  const daysRemaining = getDaysRemaining(opportunity.response_deadline);
  const description = extractDescription(opportunity.raw_data);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`text-[10px] border-0 ${getSourceColor(opportunity.source)}`}>
              {getSourceLabel(opportunity.source)}
            </Badge>
            {opportunity.type && (
              <Badge variant="secondary" className="text-xs">
                {opportunity.type}
              </Badge>
            )}
          </div>
          <DialogTitle className="text-xl leading-snug">
            {opportunity.title}
          </DialogTitle>
          {opportunity.solicitation_number && (
            <p className="text-sm text-muted-foreground font-mono mt-1">
              {opportunity.solicitation_number}
            </p>
          )}
        </DialogHeader>

        <Separator />

        <div className="space-y-4">
          {/* Key Details */}
          <div className="grid gap-3 sm:grid-cols-2">
            {opportunity.department && (
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Agency</p>
                  <p className="text-sm font-medium">{opportunity.department}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2">
              <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Posted Date</p>
                <p className="text-sm font-medium">{formatDate(opportunity.posted_date)}</p>
              </div>
            </div>

            {opportunity.response_deadline && (
              <div className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 text-destructive shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">Response Deadline</p>
                  <p className="text-sm font-medium">{formatDate(opportunity.response_deadline)}</p>
                  {daysRemaining && (
                    <p className={`text-xs font-medium mt-0.5 ${
                      daysRemaining === "Expired" ? "text-destructive" : "text-amber-600 dark:text-amber-400"
                    }`}>
                      {daysRemaining}
                    </p>
                  )}
                </div>
              </div>
            )}

            {opportunity.naics_code && (
              <div className="flex items-start gap-2">
                <Hash className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-xs text-muted-foreground">NAICS Code</p>
                  <p className="text-sm font-medium">{opportunity.naics_code}</p>
                </div>
              </div>
            )}
          </div>

          {opportunity.set_aside && (
            <div>
              <p className="text-xs text-muted-foreground mb-1">Set-Aside / Category</p>
              <Badge variant="outline">{opportunity.set_aside}</Badge>
            </div>
          )}

          {/* Description */}
          {description && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Description</p>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {description.length > 2000 ? description.slice(0, 2000) + "…" : description}
                </p>
              </div>
            </>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={isSaved ? "secondary" : "default"}
              onClick={() => onSave(opportunity)}
              disabled={isSaved}
            >
              <Bookmark className="mr-1.5 h-4 w-4" />
              {isSaved ? "Saved" : "Save Opportunity"}
            </Button>
            {opportunity.description_url && (
              <Button variant="outline" asChild>
                <a href={opportunity.description_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="mr-1.5 h-4 w-4" />
                  View on {getSourceLabel(opportunity.source)}
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
