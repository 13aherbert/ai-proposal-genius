
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useContentGeneration } from "@/hooks/use-content-generation";
import type { ProposalSection } from "../useProposalSections";

interface ContentGenerationButtonProps {
  sections: ProposalSection[];
  projectId: string;
  onUpdateSection: (sectionId: string, content: string, title: string) => Promise<void>;
  onProgressUpdate: (progress: number, isGenerating: boolean) => void;
}

export function ContentGenerationButton({
  sections,
  projectId,
  onUpdateSection,
  onProgressUpdate,
}: ContentGenerationButtonProps) {
  const [showRetryOption, setShowRetryOption] = useState(false);
  const { progress, generateAllContent, retryFailedSections } = useContentGeneration();

  const handleGenerateAllContent = async () => {
    if (sections.length === 0) {
      toast.error("No sections found", {
        description: "Please create sections first before generating content."
      });
      return;
    }

    // Check if any sections already have content
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
    await generateAllContent(sections, projectId, onUpdateSection);
    
    // Update parent progress
    onProgressUpdate(progress.completed / progress.total * 100, progress.isGenerating);
    
    // Show retry option if there were errors
    if (progress.errors.length > 0) {
      setShowRetryOption(true);
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          onClick={handleGenerateAllContent}
          disabled={progress.isGenerating}
          variant="outline"
          className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
        >
          {progress.isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Content...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate All Content
            </>
          )}
        </Button>
        
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
        </div>
      )}
    </div>
  );
}
