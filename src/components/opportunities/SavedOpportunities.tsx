import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ExternalLink,
  Trash2,
  Calendar,
  Building2,
  Loader2,
  Plus,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import type { SavedOpportunity } from "@/hooks/use-opportunity-search";

interface SavedOpportunitiesProps {
  opportunities: SavedOpportunity[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved", color: "bg-muted text-muted-foreground" },
  { value: "reviewing", label: "Reviewing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "pursuing", label: "Pursuing", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "dismissed", label: "Dismissed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "N/A";
  try {
    return format(parseISO(dateStr), "MMM d, yyyy");
  } catch {
    try { return format(new Date(dateStr), "MMM d, yyyy"); } catch { return dateStr; }
  }
}

export function SavedOpportunities({
  opportunities,
  isLoading,
  onUpdateStatus,
  onDelete,
}: SavedOpportunitiesProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-lg font-medium">No saved opportunities yet</p>
        <p className="text-sm mt-1">Search and save opportunities to track them here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {opportunities.map((opp) => {
        const statusConfig = STATUS_OPTIONS.find((s) => s.value === opp.status) || STATUS_OPTIONS[0];
        return (
          <Card key={opp.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base leading-snug line-clamp-2">
                  {opp.title}
                </CardTitle>
                <Badge className={statusConfig.color}>{statusConfig.label}</Badge>
              </div>
              {opp.solicitation_number && (
                <p className="text-xs text-muted-foreground font-mono">
                  {opp.solicitation_number}
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {opp.department && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{opp.department}</span>
                  </span>
                )}
                {opp.response_deadline && (
                  <span className="flex items-center gap-1 text-destructive font-medium">
                    <Calendar className="h-3.5 w-3.5" />
                    Due: {formatDate(opp.response_deadline)}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Select
                  value={opp.status}
                  onValueChange={(val) => onUpdateStatus(opp.id, val)}
                >
                  <SelectTrigger className="w-[140px] h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    navigate("/upload-rfp", {
                      state: {
                        prefillTitle: opp.title,
                        prefillDeadline: opp.response_deadline,
                      },
                    })
                  }
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Start Project
                </Button>

                {opp.description_url && (
                  <Button size="sm" variant="ghost" asChild>
                    <a href={opp.description_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDelete(opp.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
