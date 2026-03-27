import React, { useCallback } from "react";
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
  Loader2,
  Download,
  Bell,
  Globe,
  MapPin,
  Tag,
  DollarSign,
  Users,
  Shield,
  Info,
} from "lucide-react";
import { format, parseISO, differenceInDays } from "date-fns";
import { useDraftProposal } from "@/hooks/use-draft-proposal";
import { toast } from "sonner";
import type { Opportunity } from "@/hooks/use-opportunity-search";
import {
  getSourceLabel,
  getSourceColor,
  getSourceIcon,
  getNoticeType,
  getDaysUntilRelease,
} from "./OpportunityCard";

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (opportunity: Opportunity) => void;
  isSaved?: boolean;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
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

function getDaysRemaining(dateStr: string | null): { text: string; urgency: "expired" | "rush" | "standard" | "plenty" } | null {
  if (!dateStr) return null;
  try {
    const deadline = parseISO(dateStr);
    const days = differenceInDays(deadline, new Date());
    if (days < 0) return { text: "Expired", urgency: "expired" };
    if (days === 0) return { text: "Due today", urgency: "rush" };
    if (days === 1) return { text: "1 day left", urgency: "rush" };
    if (days < 7) return { text: `${days} days left`, urgency: "rush" };
    if (days <= 30) return { text: `${days} days left`, urgency: "standard" };
    return { text: `${days} days left`, urgency: "plenty" };
  } catch {
    return null;
  }
}

function extractDescription(rawData: Record<string, unknown>): string {
  const fields = ["description", "synopsis", "additionalInformationOnEligibility"];
  for (const field of fields) {
    if (rawData[field] && typeof rawData[field] === "string") {
      return rawData[field] as string;
    }
  }
  if (rawData.description && typeof rawData.description === "object") {
    const desc = rawData.description as Record<string, unknown>;
    if (desc.body && typeof desc.body === "string") return desc.body;
  }
  return "";
}

/** Extract source-specific fields */
function getSourceSpecificFields(opportunity: Opportunity): { label: string; value: string; icon: React.ReactNode }[] {
  const raw = opportunity.raw_data || {};
  const fields: { label: string; value: string; icon: React.ReactNode }[] = [];

  switch (opportunity.source) {
    case "sam_gov": {
      if (raw.typeOfSetAside) fields.push({ label: "Set-Aside Type", value: String(raw.typeOfSetAside), icon: <Shield className="h-4 w-4" /> });
      if (raw.classificationCode || raw.psc) fields.push({ label: "PSC Code", value: String(raw.classificationCode || raw.psc), icon: <Tag className="h-4 w-4" /> });
      if (raw.organizationType) fields.push({ label: "Organization Type", value: String(raw.organizationType), icon: <Building2 className="h-4 w-4" /> });
      if (raw.officeAddress) {
        const addr = raw.officeAddress as Record<string, unknown>;
        const location = [addr.city, addr.state].filter(Boolean).join(", ");
        if (location) fields.push({ label: "Office Location", value: location, icon: <MapPin className="h-4 w-4" /> });
      }
      if (raw.pointOfContact) {
        const poc = (Array.isArray(raw.pointOfContact) ? raw.pointOfContact[0] : raw.pointOfContact) as Record<string, unknown> | undefined;
        if (poc?.fullName) fields.push({ label: "Point of Contact", value: String(poc.fullName), icon: <Users className="h-4 w-4" /> });
      }
      break;
    }
    case "grants_gov": {
      if (raw.awardCeiling) fields.push({ label: "Funding Ceiling", value: `$${Number(raw.awardCeiling).toLocaleString()}`, icon: <DollarSign className="h-4 w-4" /> });
      if (raw.awardFloor) fields.push({ label: "Funding Floor", value: `$${Number(raw.awardFloor).toLocaleString()}`, icon: <DollarSign className="h-4 w-4" /> });
      if (raw.estimatedTotalProgramFunding) fields.push({ label: "Total Program Funding", value: `$${Number(raw.estimatedTotalProgramFunding).toLocaleString()}`, icon: <DollarSign className="h-4 w-4" /> });
      if (raw.additionalInformationOnEligibility) fields.push({ label: "Eligibility", value: String(raw.additionalInformationOnEligibility).slice(0, 200), icon: <Users className="h-4 w-4" /> });
      if (raw.cfdaNumber) fields.push({ label: "CFDA Number", value: String(raw.cfdaNumber), icon: <Hash className="h-4 w-4" /> });
      break;
    }
    case "california_eprocure": {
      if (raw.eventType || raw.type) fields.push({ label: "Event Type", value: String(raw.eventType || raw.type), icon: <Tag className="h-4 w-4" /> });
      if (raw.department) fields.push({ label: "CA Department", value: String(raw.department), icon: <Building2 className="h-4 w-4" /> });
      if (raw.status) fields.push({ label: "Status", value: String(raw.status), icon: <Info className="h-4 w-4" /> });
      break;
    }
    case "texas_smartbuy": {
      if (raw.pcc_code || raw.commodity_code) fields.push({ label: "NIGP/Commodity Code", value: String(raw.pcc_code || raw.commodity_code), icon: <Tag className="h-4 w-4" /> });
      if (raw.contract_type || raw.contract_subtype) fields.push({ label: "Contract Type", value: String(raw.contract_type || raw.contract_subtype), icon: <FileText className="h-4 w-4" /> });
      if (raw.primary_vendor_name || raw.vendor_name_description) fields.push({ label: "Vendor", value: String(raw.primary_vendor_name || raw.vendor_name_description), icon: <Users className="h-4 w-4" /> });
      if (raw.total_amount) fields.push({ label: "Total Amount", value: `$${Number(raw.total_amount).toLocaleString()}`, icon: <DollarSign className="h-4 w-4" /> });
      if (raw.contract_manager) fields.push({ label: "Contract Manager", value: String(raw.contract_manager), icon: <Users className="h-4 w-4" /> });
      break;
    }
    case "new_york": {
      if (raw.contract_type || raw.procurement_type) fields.push({ label: "Contract Type", value: String(raw.contract_type || raw.procurement_type), icon: <FileText className="h-4 w-4" /> });
      if (raw.authority_name) fields.push({ label: "Authority", value: String(raw.authority_name), icon: <Building2 className="h-4 w-4" /> });
      if (raw.region || raw.county) fields.push({ label: "Region", value: String(raw.region || raw.county), icon: <MapPin className="h-4 w-4" /> });
      if (raw.vendor_is_a_mwbe) fields.push({ label: "MWBE Status", value: String(raw.vendor_is_a_mwbe), icon: <Shield className="h-4 w-4" /> });
      break;
    }
  }

  return fields;
}

function isPreSolicitation(opportunity: Opportunity): boolean {
  const raw = opportunity.raw_data || {};
  const ptype = (raw.type as string) || "";
  const typeField = (opportunity.type || "").toLowerCase();
  return ptype === "p" || typeField.includes("presolicitation") || typeField.includes("pre-solicitation");
}

export function OpportunityDetailModal({
  opportunity,
  open,
  onOpenChange,
  onSave,
  isSaved,
}: OpportunityDetailModalProps) {
  const { draftProposal, isDrafting } = useDraftProposal();
  
  const handleExportPdf = useCallback(() => {
    if (!opportunity) return;
    // Use browser print to PDF as a lightweight export
    const printContent = `
      <html>
        <head>
          <title>${opportunity.title}</title>
          <style>
            body { font-family: system-ui, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; color: #1a1a1a; }
            h1 { font-size: 22px; line-height: 1.3; margin-bottom: 8px; }
            .meta { color: #666; font-size: 13px; margin-bottom: 16px; }
            .section { margin: 20px 0; }
            .section-title { font-size: 14px; font-weight: 600; color: #333; margin-bottom: 8px; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; }
            .field { display: flex; gap: 8px; margin: 6px 0; font-size: 13px; }
            .field-label { color: #666; min-width: 140px; }
            .field-value { color: #1a1a1a; }
            .badge { display: inline-block; background: #f0f0f0; border-radius: 4px; padding: 2px 8px; font-size: 11px; margin-right: 4px; }
            .description { font-size: 13px; line-height: 1.6; color: #444; white-space: pre-wrap; }
            @media print { body { margin: 20px; } }
          </style>
        </head>
        <body>
          <div class="meta">
            <span class="badge">${getSourceLabel(opportunity.source)}</span>
            ${opportunity.type ? `<span class="badge">${opportunity.type}</span>` : ""}
          </div>
          <h1>${opportunity.title}</h1>
          ${opportunity.solicitation_number ? `<p class="meta" style="font-family:monospace">${opportunity.solicitation_number}</p>` : ""}
          
          <div class="section">
            <div class="section-title">Key Details</div>
            ${opportunity.department ? `<div class="field"><span class="field-label">Agency</span><span class="field-value">${opportunity.department}</span></div>` : ""}
            <div class="field"><span class="field-label">Posted Date</span><span class="field-value">${formatDate(opportunity.posted_date)}</span></div>
            <div class="field"><span class="field-label">Response Deadline</span><span class="field-value">${formatDate(opportunity.response_deadline)}</span></div>
            ${opportunity.naics_code ? `<div class="field"><span class="field-label">NAICS Code</span><span class="field-value">${opportunity.naics_code}</span></div>` : ""}
            ${opportunity.set_aside ? `<div class="field"><span class="field-label">Set-Aside</span><span class="field-value">${opportunity.set_aside}</span></div>` : ""}
          </div>
          
          ${extractDescription(opportunity.raw_data) ? `
          <div class="section">
            <div class="section-title">Description</div>
            <div class="description">${extractDescription(opportunity.raw_data).slice(0, 3000)}</div>
          </div>` : ""}
          
          ${opportunity.description_url ? `
          <div class="section">
            <div class="section-title">Links</div>
            <a href="${opportunity.description_url}">${opportunity.description_url}</a>
          </div>` : ""}
          
          <div class="meta" style="margin-top:32px;font-size:11px">Exported from Opportunity Finder · ${format(new Date(), "MMMM d, yyyy")}</div>
        </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 300);
    }
    toast.success("PDF export window opened");
  }, [opportunity]);

  if (!opportunity) return null;

  const daysRemaining = getDaysRemaining(opportunity.response_deadline);
  const description = extractDescription(opportunity.raw_data);
  const noticeType = getNoticeType(opportunity);
  const daysUntilRelease = getDaysUntilRelease(opportunity);
  const sourceFields = getSourceSpecificFields(opportunity);
  const isPreSol = isPreSolicitation(opportunity);

  const urgencyColor = daysRemaining
    ? daysRemaining.urgency === "expired" || daysRemaining.urgency === "rush"
      ? "text-destructive"
      : daysRemaining.urgency === "standard"
        ? "text-amber-600 dark:text-amber-400"
        : "text-green-600 dark:text-green-400"
    : "";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto sm:max-h-[85vh] max-sm:h-[100dvh] max-sm:max-h-[100dvh] max-sm:rounded-none max-sm:border-0">
        <DialogHeader>
          {/* Source header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <Badge className={`text-xs border-0 gap-1.5 px-2.5 py-1 ${getSourceColor(opportunity.source)}`}>
              <span className="text-sm">{getSourceIcon(opportunity.source)}</span>
              {getSourceLabel(opportunity.source)}
            </Badge>
            {noticeType && (
              <Badge className={`text-[10px] border-0 gap-1 ${noticeType.color}`}>
                {noticeType.icon && <span>{noticeType.icon}</span>}
                {noticeType.label}
              </Badge>
            )}
            {!noticeType && opportunity.type && (
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
          {/* Pre-solicitation banner */}
          {isPreSol && daysUntilRelease !== null && (
            <div className="flex items-center gap-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-3">
              <Clock className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Pre-Solicitation — Expected release in ~{daysUntilRelease} days
                </p>
                <p className="text-xs text-yellow-700/80 dark:text-yellow-400/70 mt-0.5">
                  Get a head start on your proposal before the official solicitation drops
                </p>
              </div>
            </div>
          )}

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

            <div className="flex items-start gap-2">
              <Clock className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Response Deadline</p>
                <p className="text-sm font-medium">{formatDate(opportunity.response_deadline)}</p>
                {daysRemaining && (
                  <p className={`text-xs font-medium mt-0.5 ${urgencyColor}`}>
                    {daysRemaining.text}
                  </p>
                )}
              </div>
            </div>

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

          {/* Source-specific fields */}
          {sourceFields.length > 0 && (
            <>
              <Separator />
              <div>
                <div className="flex items-center gap-1.5 mb-3">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">{getSourceLabel(opportunity.source)} Details</p>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {sourceFields.map((field, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5 shrink-0">{field.icon}</span>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{field.label}</p>
                        <p className="text-sm font-medium truncate">{field.value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
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
              size="sm"
            >
              <Bookmark className="mr-1.5 h-4 w-4" />
              {isSaved ? "Saved" : isPreSol ? "Save & Alert" : "Save Opportunity"}
            </Button>

            {isPreSol && !isSaved && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSave(opportunity);
                  toast.success("You'll be notified when this becomes an active solicitation");
                }}
              >
                <Bell className="mr-1.5 h-4 w-4" />
                Set Alert
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => draftProposal(opportunity, () => onOpenChange(false))}
              disabled={isDrafting}
            >
              {isDrafting ? (
                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
              ) : (
                <FileText className="mr-1.5 h-4 w-4" />
              )}
              {isDrafting ? "Fetching..." : "Draft Proposal"}
            </Button>

            <Button variant="outline" size="sm" onClick={handleExportPdf}>
              <Download className="mr-1.5 h-4 w-4" />
              Export PDF
            </Button>

            {opportunity.description_url && (
              <Button variant="outline" size="sm" asChild>
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
