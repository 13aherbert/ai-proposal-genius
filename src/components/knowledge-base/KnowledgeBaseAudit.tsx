import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  AlertTriangle, 
  ArrowRight, 
  CheckCircle, 
  RefreshCw, 
  Sparkles,
  FileSearch,
  Loader2
} from "lucide-react";
import { useCurrentOrganization } from "@/hooks/use-current-organization";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface MigrationItem {
  entry_id: string;
  title: string;
  currentCategory: string;
  suggestedCategory: string;
}

interface ContentReviewItem {
  entry_id: string;
  title: string;
  category: string;
  reason: string;
}

interface AuditAnalysis {
  totalEntries: number;
  legacyEntries: number;
  migratedEntries: number;
  needsMigration: MigrationItem[];
  needsContentReview: ContentReviewItem[];
  categoryDistribution: Record<string, number>;
  essentialGaps: string[];
  readinessScore: number;
}

export function KnowledgeBaseAudit() {
  const { organization } = useCurrentOrganization();
  const [analysis, setAnalysis] = useState<AuditAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);

  const runAnalysis = async () => {
    if (!organization?.id) {
      toast.error("No organization selected");
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-knowledge-base', {
        body: { 
          action: 'analyze',
          organizationId: organization.id 
        }
      });

      if (error) throw error;
      setAnalysis(data);
      toast.success("Analysis complete");
    } catch (err: any) {
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const runMigration = async () => {
    if (!organization?.id || !analysis) {
      toast.error("Please run analysis first");
      return;
    }

    setIsMigrating(true);
    try {
      const { data, error } = await supabase.functions.invoke('audit-knowledge-base', {
        body: { 
          action: 'migrate',
          organizationId: organization.id,
          entryIds: analysis.needsMigration.map(m => m.entry_id)
        }
      });

      if (error) throw error;

      toast.success(`Migrated ${data.migrated} entries successfully`);
      if (data.errors?.length > 0) {
        toast.warning(`${data.errors.length} entries failed to migrate`);
      }

      // Re-run analysis to update the view
      await runAnalysis();
    } catch (err: any) {
      toast.error(`Migration failed: ${err.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-destructive";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Ready";
    if (score >= 60) return "Needs Work";
    return "Incomplete";
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSearch className="h-5 w-5" />
              Knowledge Base Audit
            </CardTitle>
            <CardDescription>
              Analyze and migrate entries to the enhanced category structure
            </CardDescription>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={isAnalyzing}
            variant="outline"
            size="sm"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            {analysis ? "Re-analyze" : "Analyze"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8 text-muted-foreground">
            <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Click "Analyze" to scan your knowledge base</p>
            <p className="text-sm mt-1">This will identify entries that need migration to the new category structure</p>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 mx-auto mb-3 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing knowledge base...</p>
          </div>
        )}

        {analysis && !isAnalyzing && (
          <>
            {/* Readiness Score */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <div className="text-sm font-medium text-muted-foreground">Proposal Readiness</div>
                <div className={cn("text-2xl font-bold", getScoreColor(analysis.readinessScore))}>
                  {analysis.readinessScore}%
                </div>
              </div>
              <Badge 
                variant="outline" 
                className={cn("text-sm", getScoreColor(analysis.readinessScore))}
              >
                {getScoreLabel(analysis.readinessScore)}
              </Badge>
            </div>

            <Progress value={analysis.readinessScore} className="h-2" />

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-muted/30">
                <div className="text-xl font-semibold">{analysis.totalEntries}</div>
                <div className="text-xs text-muted-foreground">Total Entries</div>
              </div>
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <div className="text-xl font-semibold text-amber-600">{analysis.needsMigration.length}</div>
                <div className="text-xs text-muted-foreground">Need Migration</div>
              </div>
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30">
                <div className="text-xl font-semibold text-green-600">{analysis.migratedEntries}</div>
                <div className="text-xs text-muted-foreground">Migrated</div>
              </div>
            </div>

            {/* Essential Gaps */}
            {analysis.essentialGaps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-600">
                  <AlertTriangle className="h-4 w-4" />
                  Missing Essential Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {analysis.essentialGaps.map((gap) => (
                    <Badge key={gap} variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                      {gap}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Migration Preview */}
            {analysis.needsMigration.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Pending Migrations</div>
                  <Button 
                    size="sm" 
                    onClick={runMigration}
                    disabled={isMigrating}
                  >
                    {isMigrating ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Migrate All
                  </Button>
                </div>
                <ScrollArea className="h-[180px] rounded-md border">
                  <div className="p-3 space-y-2">
                    {analysis.needsMigration.map((item) => (
                      <div 
                        key={item.entry_id} 
                        className="flex items-center gap-2 p-2 rounded bg-muted/50 text-sm"
                      >
                        <div className="flex-1 truncate font-medium">{item.title}</div>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {item.currentCategory}
                        </Badge>
                        <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                        <Badge className="shrink-0 text-xs bg-primary">
                          {item.suggestedCategory}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* Content Review */}
            {analysis.needsContentReview.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Content Quality Issues ({analysis.needsContentReview.length})
                </div>
                <ScrollArea className="h-[120px] rounded-md border">
                  <div className="p-3 space-y-2">
                    {analysis.needsContentReview.slice(0, 5).map((item) => (
                      <div 
                        key={item.entry_id} 
                        className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                      >
                        <span className="truncate">{item.title}</span>
                        <span className="text-xs text-muted-foreground">{item.reason}</span>
                      </div>
                    ))}
                    {analysis.needsContentReview.length > 5 && (
                      <div className="text-xs text-center text-muted-foreground py-1">
                        +{analysis.needsContentReview.length - 5} more
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* All good state */}
            {analysis.needsMigration.length === 0 && analysis.essentialGaps.length === 0 && (
              <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 text-green-700">
                <CheckCircle className="h-5 w-5" />
                <div>
                  <div className="font-medium">Knowledge Base Ready</div>
                  <div className="text-sm opacity-80">
                    All entries are using the enhanced category structure
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
