import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle, BookOpen, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";

interface KnowledgeBaseCoverage {
  isAdequate: boolean;
  missingTopics: string[];
  coverageScore: number;
  relevantEntries: number;
  recommendations: string[];
}

interface KnowledgeBaseValidationProps {
  sectionTitle: string;
  onAddKnowledge?: () => void;
}

// Helper to detect executive summary sections that derive from proposal content
function isExecutiveSection(title: string): boolean {
  const t = title.toLowerCase();
  return t.includes('executive') || t.includes('summary') || t.includes('overview');
}

export function KnowledgeBaseValidation({ sectionTitle, onAddKnowledge }: KnowledgeBaseValidationProps) {
  const { session } = useAuth();
  const [coverage, setCoverage] = useState<KnowledgeBaseCoverage | null>(null);
  const [loading, setLoading] = useState(true);
  const isExec = isExecutiveSection(sectionTitle);

  useEffect(() => {
    if (isExec) {
      setLoading(false);
      return;
    }
    checkKnowledgeBaseCoverage();
  }, [sectionTitle, session, isExec]);

  const checkKnowledgeBaseCoverage = async () => {
    if (!session?.user?.id) return;

    setLoading(true);
    try {
      const { data: knowledgeEntries, error } = await supabase
        .from('knowledge_entries')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      const relevantEntries = knowledgeEntries?.filter(entry => {
        const entryText = (entry.title + ' ' + (entry.content || '')).toLowerCase();
        const sectionWords = sectionTitle.toLowerCase().split(' ');
        return sectionWords.some(word => entryText.includes(word));
      }) || [];

      const coverageScore = Math.min(100, relevantEntries.length * 25);
      const isAdequate = coverageScore >= 70;

      setCoverage({
        isAdequate,
        missingTopics: isAdequate ? [] : [`${sectionTitle} specific information`],
        coverageScore,
        relevantEntries: relevantEntries.length,
        recommendations: isAdequate ? [] : [
          `Add knowledge base entries related to "${sectionTitle}"`,
          'Include specific examples, data, and detailed information',
          'Upload relevant documents or case studies'
        ]
      });
    } catch (error) {
      console.error('Error checking knowledge base coverage:', error);
    }
    setLoading(false);
  };

  // Executive sections don't need KB coverage — they synthesize from proposal
  if (isExec) {
    return (
      <div className="flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-muted-foreground">
          This section will be generated from your other proposal sections
        </span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Checking knowledge base coverage...</span>
        </div>
        <Progress value={50} className="h-1" />
      </div>
    );
  }

  if (!coverage) return null;

  return (
    <div className="space-y-3">
      {/* Coverage Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4" />
          <span className="text-sm font-medium">Knowledge Base Coverage</span>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={coverage.coverageScore} className="h-2 w-20" />
          <Badge variant={coverage.isAdequate ? "default" : "destructive"}>
            {coverage.coverageScore}%
          </Badge>
        </div>
      </div>

      {/* Coverage Status */}
      {coverage.isAdequate ? (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            Knowledge base has adequate coverage for "{sectionTitle}" ({coverage.relevantEntries} relevant entries found)
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-700">
            <div className="space-y-2">
              <p>Limited knowledge base coverage for "{sectionTitle}" ({coverage.relevantEntries} relevant entries)</p>
              {coverage.recommendations.length > 0 && (
                <div>
                  <p className="font-medium">Recommendations:</p>
                  <ul className="list-disc list-inside ml-2 text-sm">
                    {coverage.recommendations.map((rec, index) => (
                      <li key={index}>{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Add Knowledge Button */}
      {!coverage.isAdequate && onAddKnowledge && (
        <Button 
          onClick={onAddKnowledge} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge Base Content
        </Button>
      )}
    </div>
  );
}
