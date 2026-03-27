import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2 } from "lucide-react";

interface SearchProgressIndicatorProps {
  isSearching: boolean;
  providers: string[];
}

const PROVIDER_ESTIMATES: Record<string, number> = {
  "SAM.gov": 3,
  "Grants.gov": 3,
  "California eProcure": 30,
  "Texas SmartBuy": 8,
};

export function SearchProgressIndicator({ isSearching, providers }: SearchProgressIndicatorProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isSearching) {
      setElapsed(0);
      return;
    }
    setElapsed(0);
    const interval = setInterval(() => setElapsed(s => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isSearching) return null;

  const maxEstimate = Math.max(...providers.map(p => PROVIDER_ESTIMATES[p] || 5));
  const progress = Math.min(95, (elapsed / maxEstimate) * 100);
  const hasCalifornia = providers.includes("California eProcure");

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span>Searching{elapsed > 0 ? ` · ${elapsed}s` : "..."}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {providers.map(p => (
          <Badge key={p} variant="secondary" className="text-xs">
            {p}
            {p === "California eProcure" && <span className="ml-1 opacity-60">~25s</span>}
          </Badge>
        ))}
      </div>
      <Progress value={progress} className="h-1.5" />
      {hasCalifornia && elapsed > 5 && (
        <p className="text-xs text-muted-foreground">
          California eProcure uses a web scraper and typically takes 20-30 seconds
        </p>
      )}
    </div>
  );
}