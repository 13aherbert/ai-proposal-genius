import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  Download,
  ArrowRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSourceLabel, getSourceIcon } from "./OpportunityCard";
import type { Opportunity } from "@/hooks/use-opportunity-search";

interface DraftProposalDialogProps {
  opportunity: Opportunity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type DraftStep = "confirm" | "fetching" | "creating" | "done" | "error";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "TBD";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    return dateStr;
  }
}

function getDocAvailability(opp: Opportunity) {
  const hasResourceLinks = opp.resource_links && opp.resource_links.length > 0;
  const hasDescription = !!opp.description_text_url;
  const linkCount = opp.resource_links?.length || 0;

  if (hasResourceLinks) {
    return {
      level: "high" as const,
      label: `${linkCount} document${linkCount !== 1 ? "s" : ""} available`,
      description: "Documents will be downloaded automatically from the source.",
      icon: <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />,
    };
  }
  if (hasDescription) {
    return {
      level: "medium" as const,
      label: "Description text available",
      description: "The opportunity description will be saved as a text file for analysis.",
      icon: <FileText className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
    };
  }
  return {
    level: "low" as const,
    label: "No documents detected",
    description: "You'll need to upload the RFP documents manually.",
    icon: <AlertCircle className="h-4 w-4 text-muted-foreground" />,
  };
}

function getSourceNote(source: string): string | null {
  switch (source) {
    case "sam_gov":
      return "SAM.gov documents are fetched directly from the federal API.";
    case "grants_gov":
      return "Grants.gov attachments will be downloaded automatically.";
    case "california_eprocure":
      return "California eProcure may have limited downloadable documents.";
    case "texas_smartbuy":
      return "Texas SmartBuy contracts may require manual document retrieval.";
    case "new_york":
      return "New York contract documents may need to be downloaded from the source site.";
    default:
      return null;
  }
}

export function DraftProposalDialog({ opportunity, open, onOpenChange }: DraftProposalDialogProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<DraftStep>("confirm");
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [resultProjectId, setResultProjectId] = useState<string | null>(null);
  const [resultFileCount, setResultFileCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  if (!opportunity) return null;

  const docAvailability = getDocAvailability(opportunity);
  const sourceNote = getSourceNote(opportunity.source);
  const canAutoFetch = docAvailability.level !== "low";

  const handleReset = () => {
    setStep("confirm");
    setProgress(0);
    setStatusMessage("");
    setResultProjectId(null);
    setResultFileCount(0);
    setErrorMessage("");
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) handleReset();
    onOpenChange(isOpen);
  };

  const handleManualUpload = () => {
    handleOpenChange(false);
    navigate("/upload-rfp", {
      state: {
        prefillTitle: opportunity.title,
        prefillDeadline: opportunity.response_deadline,
        prefillAgency: opportunity.department,
      },
    });
  };

  const handleAutoFetch = async () => {
    setStep("fetching");
    setProgress(10);
    setStatusMessage("Connecting to source...");

    try {
      setProgress(25);
      setStatusMessage(`Downloading documents from ${getSourceLabel(opportunity.source)}...`);

      const { data, error } = await supabase.functions.invoke("fetch-opportunity-documents", {
        body: {
          resourceLinks: opportunity.resource_links || [],
          descriptionTextUrl: opportunity.description_text_url,
          title: opportunity.title,
          deadline: opportunity.response_deadline,
          agency: opportunity.department,
          source: opportunity.source,
          externalId: opportunity.external_id,
          autoAnalyze,
        },
      });

      if (error) throw error;

      if (data?.fallback || data?.error) {
        setStep("error");
        setErrorMessage(data?.error || "Could not download documents from this source.");
        return;
      }

      setStep("creating");
      setProgress(80);
      setStatusMessage("Project created successfully!");

      const fileCount = data?.filesDownloaded || 0;
      setResultFileCount(fileCount);
      setResultProjectId(data?.projectId);

      if (data?.warnings?.length) {
        for (const w of data.warnings) {
          toast.warning(w, { duration: 5000 });
        }
      }

      setProgress(100);
      setStep("done");
      setStatusMessage(`Project created with ${fileCount} document${fileCount !== 1 ? "s" : ""}!`);
    } catch (err: any) {
      console.error("Draft proposal error:", err);
      setStep("error");
      setErrorMessage(err?.message || "Failed to fetch documents.");
    }
  };

  const handleViewProject = () => {
    if (resultProjectId) {
      handleOpenChange(false);
      navigate(`/projects/${resultProjectId}`, {
        state: { autoStart: autoAnalyze },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {step === "confirm" && "Draft Proposal"}
            {step === "fetching" && "Downloading Documents..."}
            {step === "creating" && "Creating Project..."}
            {step === "done" && "Project Ready!"}
            {step === "error" && "Unable to Fetch Documents"}
          </DialogTitle>
          {step === "confirm" && (
            <DialogDescription>
              Review the opportunity details before creating a proposal project.
            </DialogDescription>
          )}
        </DialogHeader>

        {/* Confirm Step */}
        {step === "confirm" && (
          <div className="space-y-4">
            {/* Opportunity summary */}
            <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <p className="text-sm font-medium leading-snug line-clamp-2">{opportunity.title}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                {opportunity.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {opportunity.department}
                  </span>
                )}
                {opportunity.response_deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due: {formatDate(opportunity.response_deadline)}
                  </span>
                )}
              </div>
              <Badge className="text-[10px] border-0 gap-1 bg-muted text-muted-foreground">
                <span>{getSourceIcon(opportunity.source)}</span>
                {getSourceLabel(opportunity.source)}
              </Badge>
            </div>

            {/* Document availability */}
            <div className="rounded-lg border p-3 space-y-1.5">
              <div className="flex items-center gap-2">
                {docAvailability.icon}
                <span className="text-sm font-medium">{docAvailability.label}</span>
              </div>
              <p className="text-xs text-muted-foreground">{docAvailability.description}</p>
              {sourceNote && (
                <p className="text-xs text-muted-foreground/70 italic">{sourceNote}</p>
              )}
            </div>

            {/* Auto-analyze checkbox */}
            {canAutoFetch && (
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={autoAnalyze}
                  onCheckedChange={(checked) => setAutoAnalyze(!!checked)}
                />
                <span className="text-sm">Auto-analyze RFP after fetching</span>
              </label>
            )}

            {/* Action buttons */}
            <div className="flex flex-col gap-2 pt-1">
              {canAutoFetch && (
                <Button onClick={handleAutoFetch} className="gap-2">
                  <Download className="h-4 w-4" />
                  Auto-fetch & Create Project
                </Button>
              )}
              <Button
                variant={canAutoFetch ? "outline" : "default"}
                onClick={handleManualUpload}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                {canAutoFetch ? "Upload Manually Instead" : "Upload RFP Documents"}
              </Button>
            </div>
          </div>
        )}

        {/* Fetching / Creating Steps */}
        {(step === "fetching" || step === "creating") && (
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <Progress value={progress} className="w-full h-2" />
            <p className="text-sm text-center text-muted-foreground">{statusMessage}</p>
          </div>
        )}

        {/* Done Step */}
        {step === "done" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
              <p className="text-sm font-medium text-center">{statusMessage}</p>
              {autoAnalyze && (
                <p className="text-xs text-muted-foreground text-center">
                  RFP analysis will start automatically when you open the project.
                </p>
              )}
            </div>
            <Button onClick={handleViewProject} className="w-full gap-2">
              <ArrowRight className="h-4 w-4" />
              View Project
            </Button>
          </div>
        )}

        {/* Error Step */}
        {step === "error" && (
          <div className="space-y-4 py-2">
            <div className="flex flex-col items-center gap-3">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-sm text-center text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" onClick={handleManualUpload} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload RFP Manually
              </Button>
              <Button variant="ghost" onClick={handleReset} className="text-sm">
                Try Again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
