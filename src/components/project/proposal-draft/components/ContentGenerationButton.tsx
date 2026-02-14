
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, RefreshCcw, Shield, AlertTriangle, Settings } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useContentGeneration } from "@/hooks/use-content-generation";
import { KnowledgeBaseValidation } from "@/components/shared/KnowledgeBaseValidation";
import type { ProposalSection } from "../useProposalSections";

interface ContentGenerationButtonProps {
  sections: ProposalSection[];
  projectId: string;
  onUpdateSection: (sectionId: string, content: string, title: string) => Promise<void>;
}

export function ContentGenerationButton({
  sections,
  projectId,
  onUpdateSection,
}: ContentGenerationButtonProps) {
  const [showRetryOption, setShowRetryOption] = useState(false);
  const [strictMode, setStrictMode] = useState(false);
  const [showKnowledgeValidation, setShowKnowledgeValidation] = useState(false);
  const { progress, generateAllContent, retryFailedSections } = useContentGeneration();

  const handleGenerateAllContent = async () => {
    if (sections.length === 0) {
      toast.error("No sections found", {
        description: "Please create sections first before generating content."
      });
      return;
    }

    const sectionsWithContent = sections.filter(section => section.content && section.content.trim().length > 0);
    if (sectionsWithContent.length > 0) {
      toast.warning(`${sectionsWithContent.length} section(s) already have content`, {
        description: "Content generation will overwrite existing content. Click 'Generate All Content' again to confirm.",
        action: {
          label: "Generate Anyway",
          onClick: () => proceedWithGeneration()
        }
      });
      return;
    }

    proceedWithGeneration();
  };

  const handleRetryFailed = async () => {
    if (progress.errors.length === 0) {
      toast.error("No failed sections to retry");
      return;
    }

    await retryFailedSections(progress.errors, sections, projectId, onUpdateSection);
    setShowRetryOption(false);
  };

  const proceedWithGeneration = async () => {
    setShowRetryOption(false);
    await generateAllContent(sections, projectId, onUpdateSection, { strictMode });
    
    if (progress.errors.length > 0) {
      setShowRetryOption(true);
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Knowledge Base Validation */}
      {showKnowledgeValidation && sections.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Knowledge Base Coverage Assessment</h4>
          {sections.slice(0, 3).map(section => (
            <KnowledgeBaseValidation 
              key={section.section_id}
              sectionTitle={section.section_title}
              onAddKnowledge={() => {
                toast.info("Navigate to Knowledge Base to add content");
              }}
            />
          ))}
        </div>
      )}

      {/* Generation Button Row */}
      <div className="flex gap-2 items-center">
        <Button
          onClick={handleGenerateAllContent}
          disabled={progress.isGenerating}
          variant="outline"
          className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
        >
          {progress.isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All Content {strictMode && <Shield className="ml-1 h-3 w-3" />}
            </>
          )}
        </Button>

        {/* Settings Popover */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon" className="flex-none h-10 w-10" disabled={progress.isGenerating}>
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 bg-popover">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Generation Settings</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">KB Coverage</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKnowledgeValidation(!showKnowledgeValidation)}
                >
                  {showKnowledgeValidation ? 'Hide' : 'Check'} Coverage
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="strict-mode"
                  checked={strictMode}
                  onCheckedChange={setStrictMode}
                  disabled={progress.isGenerating}
                />
                <Label htmlFor="strict-mode" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">KB Only Mode</span>
                </Label>
              </div>
              
              {strictMode && (
                <Alert className="border-blue-200 bg-blue-50">
                  <Shield className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Strict mode: AI will only use your knowledge base. Generation will fail if coverage is insufficient.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </PopoverContent>
        </Popover>
        
        {showRetryOption && progress.errors.length > 0 && (
          <Button
            onClick={handleRetryFailed}
            disabled={progress.isGenerating}
            variant="outline"
            size="sm"
            className="text-amber-600 border-amber-300 hover:bg-amber-50"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Retry Failed ({progress.errors.length})
          </Button>
        )}
      </div>
      
      {/* Progress Display */}
      {progress.isGenerating && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              {progress.currentSection && `Generating: ${progress.currentSection}`}
            </span>
            <span>{progress.completed}/{progress.total}</span>
          </div>
          <Progress value={(progress.completed / progress.total) * 100} />
          {progress.successes.length > 0 && (
            <div className="text-sm text-green-600">
              ✓ Completed: {progress.successes.join(', ')}
            </div>
          )}
          {progress.errors.length > 0 && (
            <div className="text-sm text-red-600">
              ✗ Failed: {progress.errors.join(', ')}
            </div>
          )}
          {progress.knowledgeBaseWarnings.length > 0 && (
            <div className="space-y-1">
              {progress.knowledgeBaseWarnings.map((warning, index) => (
                <Alert key={index} className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-700 text-sm">
                    {warning.sectionTitle}: {warning.coverageScore}% coverage. 
                    Missing: {warning.missingTopics.join(', ')}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
