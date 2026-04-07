import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Activity, AlertTriangle, CheckCircle, RefreshCw, FileText, Clock, Copy } from "lucide-react";
import { HealthScore } from "./useKBGovernance";
import { enhancedKnowledgeCategories } from "../data/categories";

interface KBHealthDashboardProps {
  healthScores: HealthScore[];
  onRecalculate: () => void;
  isLoading: boolean;
}

export function KBHealthDashboard({ healthScores, onRecalculate, isLoading }: KBHealthDashboardProps) {
  const allCategories = enhancedKnowledgeCategories.map(c => c.name.toLowerCase().replace(/\s+/g, "-"));
  
  const totalEntries = healthScores.reduce((sum, s) => sum + s.total_entries, 0);
  const totalStale = healthScores.reduce((sum, s) => sum + s.stale_entries, 0);
  const totalDupes = healthScores.reduce((sum, s) => sum + s.duplicate_count, 0);
  const avgScore = healthScores.length > 0
    ? Math.round(healthScores.reduce((sum, s) => sum + Number(s.overall_score), 0) / healthScores.length)
    : 0;

  const coveredCategories = new Set(healthScores.map(s => s.category));
  const emptyCategories = allCategories.filter(c => !coveredCategories.has(c));

  const getStatusColor = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 40) return "text-amber-600";
    return "text-red-600";
  };

  const getStatusBadge = (score: number) => {
    if (score >= 70) return <Badge className="bg-green-100 text-green-800 border-green-200">Healthy</Badge>;
    if (score >= 40) return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Needs Attention</Badge>;
    return <Badge variant="destructive">Critical</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Knowledge Base Health
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onRecalculate} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Recalculate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{totalEntries}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <FileText className="h-3 w-3" /> Total Entries
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${totalStale > 0 ? "text-amber-600" : "text-green-600"}`}>
              {totalStale}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="h-3 w-3" /> Stale Entries
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${totalDupes > 0 ? "text-amber-600" : "text-green-600"}`}>
              {totalDupes}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Copy className="h-3 w-3" /> Duplicates
            </div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className={`text-2xl font-bold ${getStatusColor(avgScore)}`}>{avgScore}%</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </div>

        {/* Per-category breakdown */}
        {healthScores.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Category Health</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {healthScores
                .sort((a, b) => Number(a.overall_score) - Number(b.overall_score))
                .map((score) => (
                <div key={score.category} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{score.category}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={Number(score.overall_score)} className="h-1.5 flex-1" />
                      <span className={`text-xs font-medium ${getStatusColor(Number(score.overall_score))}`}>
                        {Math.round(Number(score.overall_score))}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {Number(score.stale_entries) > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>{score.stale_entries} stale entries</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {Number(score.duplicate_count) > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Copy className="h-3.5 w-3.5 text-amber-500" />
                          </TooltipTrigger>
                          <TooltipContent>{score.duplicate_count} potential duplicates</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {getStatusBadge(Number(score.overall_score))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty categories */}
        {emptyCategories.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
              Categories Needing Content
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {emptyCategories.map(cat => (
                <Badge key={cat} variant="outline" className="text-xs">
                  {cat}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {healthScores.length === 0 && !isLoading && (
          <div className="text-center py-6 text-muted-foreground">
            <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No health data yet. Click "Recalculate" to analyze your Knowledge Base.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
