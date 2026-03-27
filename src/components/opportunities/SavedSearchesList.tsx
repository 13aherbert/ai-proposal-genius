import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bell, Trash2, Search, Clock, Zap, Loader2 } from "lucide-react";
import type { SavedSearch } from "@/hooks/use-saved-searches";
import type { SearchParams } from "@/hooks/use-opportunity-search";

interface SavedSearchesListProps {
  savedSearches: SavedSearch[];
  isLoading: boolean;
  onUpdate: (id: string, updates: Partial<Pick<SavedSearch, "name" | "alert_frequency" | "is_active">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRunSearch: (params: SearchParams) => void;
}

const FREQ_ICONS: Record<string, React.ReactNode> = {
  daily: <Clock className="h-3 w-3" />,
  weekly: <Bell className="h-3 w-3" />,
  immediate: <Zap className="h-3 w-3" />,
};

const FREQ_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  immediate: "Immediate",
};

const SOURCE_LABELS: Record<string, string> = {
  sam_gov: "SAM.gov",
  grants_gov: "Grants.gov",
  california_eprocure: "CA eProcure",
  texas_smartbuy: "TX SmartBuy",
  new_york: "NY State",
};

export function SavedSearchesList({ savedSearches, isLoading, onUpdate, onDelete, onRunSearch }: SavedSearchesListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (savedSearches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No saved searches yet</p>
        <p className="text-xs mt-1">Save a search to get alerts when new opportunities match</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {savedSearches.map((search) => {
        const params = search.search_params;
        const sources = params.sources?.map((s) => SOURCE_LABELS[s] || s) || [];

        return (
          <Card key={search.id} className={!search.is_active ? "opacity-60" : ""}>
            <CardContent className="py-3 px-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{search.name}</h4>
                    <Badge variant="outline" className="text-xs flex items-center gap-1 shrink-0">
                      {FREQ_ICONS[search.alert_frequency]}
                      {FREQ_LABELS[search.alert_frequency]}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap gap-1 text-xs text-muted-foreground">
                    {params.keyword && (
                      <Badge variant="secondary" className="text-xs">
                        {params.keyword}
                      </Badge>
                    )}
                    {sources.length > 0 && sources.length < 5 && (
                      <Badge variant="secondary" className="text-xs">
                        {sources.join(", ")}
                      </Badge>
                    )}
                    {params.naicsCode && (
                      <Badge variant="secondary" className="text-xs">
                        NAICS: {params.naicsCode}
                      </Badge>
                    )}
                    {params.setAside && (
                      <Badge variant="secondary" className="text-xs">
                        {params.setAside}
                      </Badge>
                    )}
                  </div>

                  {search.last_alert_sent && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Last alert: {new Date(search.last_alert_sent).toLocaleDateString()}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    title="Run this search"
                    onClick={() => onRunSearch(params)}
                  >
                    <Search className="h-3.5 w-3.5" />
                  </Button>

                  <Select
                    value={search.alert_frequency}
                    onValueChange={(v) => onUpdate(search.id, { alert_frequency: v as any })}
                  >
                    <SelectTrigger className="h-8 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="immediate">Immediate</SelectItem>
                    </SelectContent>
                  </Select>

                  <Switch
                    checked={search.is_active}
                    onCheckedChange={(checked) => onUpdate(search.id, { is_active: checked })}
                  />

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    onClick={() => onDelete(search.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
