import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  AlertTriangle, 
  CheckCircle, 
  ChevronRight, 
  Database, 
  Lightbulb,
  XCircle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKnowledgeReadiness } from "@/hooks/use-knowledge-readiness";
import { cn } from "@/lib/utils";

interface KnowledgeBaseReadinessProps {
  compact?: boolean;
}

export function KnowledgeBaseReadiness({ compact = false }: KnowledgeBaseReadinessProps) {
  const navigate = useNavigate();
  const readiness = useKnowledgeReadiness();

  // Hide completely when all essential categories are filled
  if (!readiness.isLoading && readiness.missingEssential.length === 0) {
    return null;
  }

  if (readiness.isLoading) {
    return (
      <Card className={cn(compact && "border-0 shadow-none bg-transparent")}>
        <CardContent className="py-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-2 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Determine status color and icon
  const getStatusConfig = () => {
    if (readiness.isEmpty) {
      return {
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        borderColor: 'border-destructive/20',
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        label: 'Empty',
        message: 'Your knowledge base is empty. Add company information to generate winning proposals.',
      };
    }
    if (readiness.needsAttention) {
      return {
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        icon: <AlertTriangle className="h-5 w-5 text-amber-600" />,
        label: 'Needs Content',
        message: `Missing ${readiness.missingEssential.length} essential categories. Add more content to improve proposal quality.`,
      };
    }
    if (readiness.isReady) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: <CheckCircle className="h-5 w-5 text-green-600" />,
        label: 'Ready',
        message: 'Your knowledge base has good coverage. You can generate high-quality proposals.',
      };
    }
    return {
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      icon: <Lightbulb className="h-5 w-5 text-amber-600" />,
      label: 'Building',
      message: `Add ${readiness.missingEssential.length} more essential categories to unlock full potential.`,
    };
  };

  const status = getStatusConfig();

  // Compact version for sidebar
  if (compact) {
    return (
      <div 
        className={cn(
          "p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow",
          status.bgColor,
          status.borderColor
        )}
        onClick={() => navigate('/knowledge-base')}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Knowledge Base</span>
          </div>
          <Badge variant="outline" className={cn("text-xs", status.color)}>
            {readiness.essentialScore}%
          </Badge>
        </div>
        <Progress 
          value={readiness.essentialScore} 
          className="h-1.5"
        />
        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
          {readiness.isEmpty 
            ? "Add content to start" 
            : `${readiness.totalEntries} entries · ${6 - readiness.missingEssential.length}/6 essential`
          }
        </p>
      </div>
    );
  }

  // Full version
  return (
    <Card className={cn("border-2", status.borderColor)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {status.icon}
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                Knowledge Base Readiness
                <Badge variant="outline" className={status.color}>
                  {status.label}
                </Badge>
              </CardTitle>
              <CardDescription>{status.message}</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <div className={cn("text-3xl font-bold", status.color)}>
              {readiness.essentialScore}%
            </div>
            <div className="text-xs text-muted-foreground">Essential Coverage</div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={readiness.essentialScore} className="h-2" />
        
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold">{readiness.totalEntries}</div>
            <div className="text-xs text-muted-foreground">Total Entries</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold">{6 - readiness.missingEssential.length}/6</div>
            <div className="text-xs text-muted-foreground">Essential Categories</div>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <div className="font-semibold">{readiness.overallScore}%</div>
            <div className="text-xs text-muted-foreground">Overall Score</div>
          </div>
        </div>

        {readiness.missingEssential.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">
              Missing Essential Categories:
            </div>
            <div className="flex flex-wrap gap-2">
              {readiness.missingEssential.slice(0, 3).map((category) => (
                <Badge 
                  key={category} 
                  variant="outline" 
                  className="text-amber-700 border-amber-300 bg-amber-50"
                >
                  {category}
                </Badge>
              ))}
              {readiness.missingEssential.length > 3 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{readiness.missingEssential.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        <Button 
          onClick={() => navigate('/knowledge-base')} 
          className="w-full"
          variant={readiness.isEmpty || readiness.needsAttention ? "default" : "outline"}
        >
          {readiness.isEmpty ? "Set Up Knowledge Base" : "Manage Knowledge Base"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
