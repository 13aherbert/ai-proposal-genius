import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
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
  
  Plus,
  StickyNote,
  Check,
  X,
  ArrowUpDown,
  FileText,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import type { SavedOpportunity } from "@/hooks/use-opportunity-search";

interface SavedOpportunitiesProps {
  opportunities: SavedOpportunity[];
  isLoading: boolean;
  onUpdateStatus: (id: string, status: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onDelete: (id: string) => void;
  onDraftProposal: (opportunity: any) => void;
}

const STATUS_OPTIONS = [
  { value: "saved", label: "Saved", color: "bg-muted text-muted-foreground" },
  { value: "reviewing", label: "Reviewing", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  { value: "pursuing", label: "Pursuing", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  { value: "dismissed", label: "Dismissed", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
];

const SORT_OPTIONS = [
  { value: "created_desc", label: "Newest first" },
  { value: "created_asc", label: "Oldest first" },
  { value: "deadline_asc", label: "Deadline (soonest)" },
  { value: "deadline_desc", label: "Deadline (latest)" },
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
  onUpdateNotes,
  onDelete,
  onDraftProposal,
}: SavedOpportunitiesProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("created_desc");

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

  // Filter
  let filtered = statusFilter === "all"
    ? opportunities
    : opportunities.filter((o) => o.status === statusFilter);

  // Sort
  filtered = [...filtered].sort((a, b) => {
    switch (sortBy) {
      case "created_asc":
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      case "deadline_asc":
        return (a.response_deadline || "9999").localeCompare(b.response_deadline || "9999");
      case "deadline_desc":
        return (b.response_deadline || "0000").localeCompare(a.response_deadline || "0000");
      default: // created_desc
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    }
  });

  const startEditNotes = (opp: SavedOpportunity) => {
    setEditingNotes(opp.id);
    setNotesValue(opp.notes || "");
  };

  const saveNotes = (id: string) => {
    onUpdateNotes(id, notesValue);
    setEditingNotes(null);
  };

  return (
    <div className="space-y-4">
      {/* Filter / Sort controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[170px] h-8 text-xs">
            <ArrowUpDown className="mr-1.5 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {opportunities.length} opportunities
        </span>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map((opp) => {
          const statusConfig = STATUS_OPTIONS.find((s) => s.value === opp.status) || STATUS_OPTIONS[0];
          const isEditingThis = editingNotes === opp.id;

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

                {/* Notes section */}
                {isEditingThis ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      placeholder="Add notes about this opportunity..."
                      className="min-h-[60px] text-sm"
                      maxLength={1000}
                    />
                    <div className="flex gap-1.5">
                      <Button size="sm" variant="default" onClick={() => saveNotes(opp.id)}>
                        <Check className="mr-1 h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingNotes(null)}>
                        <X className="mr-1 h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {opp.notes ? (
                      <button
                        onClick={() => startEditNotes(opp)}
                        className="text-sm text-muted-foreground bg-muted/50 rounded px-2 py-1.5 w-full text-left hover:bg-muted transition-colors"
                      >
                        <StickyNote className="inline h-3 w-3 mr-1" />
                        {opp.notes}
                      </button>
                    ) : (
                      <button
                        onClick={() => startEditNotes(opp)}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        <StickyNote className="h-3 w-3" />
                        Add notes
                      </button>
                    )}
                  </div>
                )}

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
                      onDraftProposal({
                        external_id: opp.external_id,
                        source: opp.source,
                        title: opp.title,
                        solicitation_number: opp.solicitation_number || "",
                        department: opp.department || "",
                        naics_code: opp.naics_code || "",
                        posted_date: opp.posted_date,
                        response_deadline: opp.response_deadline,
                        set_aside: opp.set_aside || "",
                        description_url: opp.description_url || "",
                        type: "",
                        raw_data: (opp.raw_data as Record<string, unknown>) || {},
                        resource_links: [],
                        description_text_url: null,
                      })
                    }
                  >
                    <FileText className="mr-1.5 h-3.5 w-3.5" />
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
    </div>
  );
}
