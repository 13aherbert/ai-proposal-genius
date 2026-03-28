import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExternalLink,
  Bookmark,
  Calendar,
  Building2,
  Hash,
  Eye,
  FileText,
  
  Clock,
  Zap,
  Timer,
  Shield,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface OpportunityCardProps {
  opportunity: Opportunity;
  onSave: (opportunity: Opportunity) => void;
  onViewDetails: (opportunity: Opportunity) => void;
  onDraftProposal: (opportunity: Opportunity) => void;
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

export function getSourceLabel(source: string) {
  switch (source) {
    case "sam_gov": return "SAM.gov";
    case "grants_gov": return "Grants.gov";
    case "fedconnect": return "FedConnect";
    case "california_eprocure": return "California";
    case "texas_smartbuy": return "Texas";
    case "new_york": return "New York";
    default: return source;
  }
}

export function getSourceShortLabel(source: string) {
  switch (source) {
    case "sam_gov": return "SAM";
    case "grants_gov": return "Grants";
    case "fedconnect": return "FC";
    case "california_eprocure": return "CA";
    case "texas_smartbuy": return "TX";
    case "new_york": return "NY";
    default: return source;
  }
}

export function getSourceFallbackUrl(source: string) {
  switch (source) {
    case "sam_gov": return "https://sam.gov";
    case "grants_gov": return "https://www.grants.gov";
    case "fedconnect": return "https://www.fedconnect.net";
    case "california_eprocure": return "https://caleprocure.ca.gov";
    case "texas_smartbuy": return "https://www.txsmartbuy.com";
    case "new_york": return "https://data.ny.gov";
    default: return "#";
  }
}

export function getSourceColor(source: string) {
  switch (source) {
    case "sam_gov": return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "grants_gov": return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "fedconnect": return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300";
    case "california_eprocure": return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "texas_smartbuy": return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
    case "new_york": return "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300";
    default: return "";
  }
}

export function getSourceIcon(source: string) {
  switch (source) {
    case "sam_gov": return "🇺🇸";
    case "grants_gov": return "💰";
    case "fedconnect": return "🔗";
    case "california_eprocure": return "🌴";
    case "texas_smartbuy": return "⭐";
    case "new_york": return "🗽";
    default: return "📄";
  }
}

/** Derive a notice type from SAM.gov ptype or general type field */
export function getNoticeType(opportunity: Opportunity): { label: string; color: string; icon?: string } | null {
  const raw = opportunity.raw_data || {};
  const ptype = (raw.type as string) || "";
  const typeField = (opportunity.type || "").toLowerCase();

  if (ptype === "p" || typeField.includes("presolicitation") || typeField.includes("pre-solicitation")) {
    return { label: "Early Access", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300", icon: "⏳" };
  }
  if (ptype === "r" || typeField.includes("sources sought")) {
    return { label: "Sources Sought", color: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300" };
  }
  if (ptype === "a" || typeField.includes("award")) {
    return { label: "Awarded", color: "bg-muted text-muted-foreground" };
  }
  if (ptype === "k" || typeField.includes("combined")) {
    return { label: "Open", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (ptype === "o" || typeField.includes("solicitation")) {
    return { label: "Open", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300" };
  }
  if (ptype === "s" || typeField.includes("special notice")) {
    return { label: "Notice", color: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300" };
  }

  return null;
}

/** For pre-solicitations, estimate days until expected solicitation release */
export function getDaysUntilRelease(opportunity: Opportunity): number | null {
  const raw = opportunity.raw_data || {};
  const ptype = (raw.type as string) || "";
  const typeField = (opportunity.type || "").toLowerCase();
  const isPreSol = ptype === "p" || typeField.includes("presolicitation") || typeField.includes("pre-solicitation");
  if (!isPreSol) return null;

  const deadline = opportunity.response_deadline;
  if (deadline) {
    try {
      const days = differenceInDays(parseISO(deadline), new Date());
      return days > 0 ? days : null;
    } catch { return null; }
  }
  if (opportunity.posted_date) {
    try {
      const days = differenceInDays(parseISO(opportunity.posted_date), new Date()) + 30;
      return days > 0 ? days : null;
    } catch { return null; }
  }
  return null;
}

/** Get response time urgency badge */
function getResponseTimeBadge(opportunity: Opportunity): { label: string; color: string; icon: React.ReactNode } | null {
  const deadline = opportunity.response_deadline;
  if (!deadline) return null;

  try {
    const days = differenceInDays(parseISO(deadline), new Date());
    if (days < 0) return null; // Expired
    if (days < 7) {
      return {
        label: `Rush: ${days}d left`,
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
        icon: <Zap className="h-3 w-3" />,
      };
    }
    if (days <= 30) {
      return {
        label: `${days}d remaining`,
        color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
        icon: <Timer className="h-3 w-3" />,
      };
    }
    return {
      label: `${days}d remaining`,
      color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      icon: <Shield className="h-3 w-3" />,
    };
  } catch {
    return null;
  }
}

export function OpportunityCard({ opportunity, onSave, onViewDetails, onDraftProposal, isSaved }: OpportunityCardProps) {
  const noticeType = getNoticeType(opportunity);
  const daysUntilRelease = getDaysUntilRelease(opportunity);
  const responseBadge = getResponseTimeBadge(opportunity);

  return (
    <Card className="hover:shadow-md transition-shadow relative group">
      <CardHeader className="pb-3">
        {/* Source badge - top right corner */}
        <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
          <Badge className={`text-[10px] border-0 gap-1 ${getSourceColor(opportunity.source)}`}>
            <span>{getSourceIcon(opportunity.source)}</span>
            {getSourceShortLabel(opportunity.source)}
          </Badge>
        </div>

        <div className="pr-20">
          <CardTitle className="text-base leading-snug line-clamp-2">
            {opportunity.title}
          </CardTitle>
        </div>

        {/* Badge row: notice type + response time */}
        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
          {noticeType && (
            <Badge className={`text-[10px] border-0 gap-1 ${noticeType.color}`}>
              {noticeType.icon && <span>{noticeType.icon}</span>}
              {noticeType.label}
            </Badge>
          )}
          {responseBadge && (
            <Badge className={`text-[10px] border-0 gap-1 ${responseBadge.color}`}>
              {responseBadge.icon}
              {responseBadge.label}
            </Badge>
          )}
          {!noticeType && opportunity.type && (
            <Badge variant="secondary" className="text-[10px]">
              {opportunity.type}
            </Badge>
          )}
        </div>

        {opportunity.solicitation_number && (
          <p className="text-xs text-muted-foreground font-mono mt-1">
            {opportunity.solicitation_number}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          {opportunity.department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span className="line-clamp-1">{opportunity.department}</span>
            </span>
          )}
          {opportunity.naics_code && (
            <span className="flex items-center gap-1">
              <Hash className="h-3.5 w-3.5 shrink-0" />
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
            onClick={() => onDraftProposal(opportunity)}
          >
            <FileText className="mr-1.5 h-3.5 w-3.5" />
            {opportunity.resource_links && opportunity.resource_links.length > 0
              ? `Draft Proposal (${opportunity.resource_links.length} docs)`
              : opportunity.description_text_url
                ? "Draft Proposal"
                : "Start Proposal"}
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
