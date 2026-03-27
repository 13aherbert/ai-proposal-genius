import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Bookmark, Calendar, Building2, Hash, Eye, FileText, Loader2, Clock } from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useDraftProposal } from "@/hooks/use-draft-proposal";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
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
    case "california_eprocure": return "CA";
    case "texas_smartbuy": return "TX";
    case "new_york": return "NY";
    default: return source;
  }
}

function getSourceFallbackUrl(source: string) {
  switch (source) {
    case "sam_gov": return "https://sam.gov";
    case "grants_gov": return "https://www.grants.gov";
    case "california_eprocure": return "https://caleprocure.ca.gov";
    case "texas_smartbuy": return "https://www.txsmartbuy.com";
    case "new_york": return "https://data.ny.gov";
    default: return "#";
  }
}

function getSourceColor(source: string) {
  switch (source) {
    case "sam_gov": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "grants_gov": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "california_eprocure": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "texas_smartbuy": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "new_york": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    default: return "";
  }
}

/** Derive a notice type from SAM.gov ptype or general type field */
function getNoticeType(opportunity: Opportunity): { label: string; color: string } | null {
  const raw = opportunity.raw_data || {};
  const ptype = (raw.type as string) || "";
  const typeField = (opportunity.type || "").toLowerCase();

  // SAM.gov ptype codes
  if (ptype === "p" || typeField.includes("presolicitation") || typeField.includes("pre-solicitation")) {
    return { label: "Coming Soon", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300" };
  }
  if (ptype === "r" || typeField.includes("sources sought")) {
    return { label: "Sources Sought", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  if (ptype === "a" || typeField.includes("award")) {
    return { label: "Awarded", color: "bg-gray-100 text-gray-600 dark:bg-gray-800/50 dark:text-gray-400" };
  }
  if (ptype === "k" || typeField.includes("combined")) {
    return { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (ptype === "o" || typeField.includes("solicitation")) {
    return { label: "Active", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (ptype === "s" || typeField.includes("special notice")) {
    return { label: "Notice", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" };
  }

  return null;
}

/** For pre-solicitations, estimate days until expected solicitation release */
function getDaysUntilRelease(opportunity: Opportunity): number | null {
  const raw = opportunity.raw_data || {};
  const ptype = (raw.type as string) || "";
  const typeField = (opportunity.type || "").toLowerCase();
  const isPreSol = ptype === "p" || typeField.includes("presolicitation") || typeField.includes("pre-solicitation");
  if (!isPreSol) return null;

  // Use response_deadline as estimated release, or fall back to 30 days from posted
  const deadline = opportunity.response_deadline;
  if (deadline) {
    try {
      const days = differenceInDays(parseISO(deadline), new Date());
      return days > 0 ? days : null;
    } catch { return null; }
  }
  // If no deadline, estimate ~30 days from posting
  if (opportunity.posted_date) {
    try {
      const days = differenceInDays(parseISO(opportunity.posted_date), new Date()) + 30;
      return days > 0 ? days : null;
    } catch { return null; }
  }
  return null;
}

export function OpportunityCard({ opportunity, onSave, onViewDetails, isSaved }: OpportunityCardProps) {
  const { draftProposal, isDrafting } = useDraftProposal();
  const noticeType = getNoticeType(opportunity);
  const daysUntilRelease = getDaysUntilRelease(opportunity);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug line-clamp-2">
            {opportunity.title}
          </CardTitle>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <Badge className={`text-[10px] border-0 ${getSourceColor(opportunity.source)}`}>
              {getSourceLabel(opportunity.source)}
            </Badge>
            {noticeType && (
              <Badge className={`text-[10px] border-0 ${noticeType.color}`}>
                {noticeType.label}
              </Badge>
            )}
            {!noticeType && opportunity.type && (
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
          <span className={`flex items-center gap-1 ${opportunity.response_deadline ? "text-destructive font-medium" : "text-muted-foreground"}`}>
            <Calendar className="h-3.5 w-3.5" />
            Due: {formatDate(opportunity.response_deadline)}
          </span>
        </div>

        {daysUntilRelease !== null && (
          <div className="flex items-center gap-1.5 text-xs text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded px-2 py-1 w-fit">
            <Clock className="h-3 w-3" />
            Expected release in ~{daysUntilRelease} days
          </div>
        )}

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
