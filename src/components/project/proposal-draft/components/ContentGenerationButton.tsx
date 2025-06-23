
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { AIProgress } from "@/components/shared/AIProgress";
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
  const [isGeneratingAllContent, setIsGeneratingAllContent] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const { session } = useAuth();

  const handleGenerateAllContent = async () => {
    if (!session?.user?.id) {
      toast.error("You must be logged in to generate content");
      return;
    }

    if (sections.length === 0) {
      toast.error("No sections found", {
        description: "Please create sections first before generating content."
      });
      return;
    }

    // Check if any sections already have content
    const sectionsWithContent = sections.filter(section => section.content && section.content.trim().length > 0);
    if (sectionsWithContent.length > 0) {
      // Show warning toast instead of browser confirm
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

  const proceedWithGeneration = async () => {
    setIsGeneratingAllContent(true);
    setGenerationProgress(0);
    toast.loading("Generating content for all sections...", {
      description: "This may take a few minutes. Please don't close the page."
    });

    let successCount = 0;
    let errorCount = 0;

    try {
      // Generate content for each section sequentially
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        
        try {
          console.log(`Generating content for section: ${section.section_title}`);
          
          const { data, error } = await supabase.functions.invoke('generate-section-content', {
            body: { 
              sectionTitle: section.section_title,
              projectId: projectId,
              userId: session!.user.id
            },
          });

          if (error) throw error;
          if (!data?.content) throw new Error('No content generated');

          // Update the section with the generated content
          await onUpdateSection(section.section_id, data.content, section.section_title);
          successCount++;
          
          // Update progress
          setGenerationProgress(((i + 1) / sections.length) * 100);
          
          // Small delay between requests to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error generating content for section ${section.section_title}:`, error);
          errorCount++;
          
          // Still update progress even on error
          setGenerationProgress(((i + 1) / sections.length) * 100);
        }
      }

      toast.dismiss();
      
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully generated content for all ${successCount} sections!`, {
          description: "You can now review and edit the generated content."
        });
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Generated content for ${successCount} sections`, {
          description: `${errorCount} section(s) failed to generate. You can try generating them individually.`
        });
      } else {
        toast.error("Failed to generate content for any sections", {
          description: "Please try again or generate sections individually."
        });
      }
    } catch (error) {
      console.error('Error in bulk content generation:', error);
      toast.dismiss();
      toast.error("Failed to generate content", {
        description: "Please try again or generate sections individually."
      });
    } finally {
      setIsGeneratingAllContent(false);
      setGenerationProgress(0);
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <>
      <Button
        onClick={handleGenerateAllContent}
        disabled={isGeneratingAllContent}
        variant="outline"
        className="flex-1 sm:flex-none bg-gradient-to-r from-purple-500 to-blue-500 text-white border-none hover:from-purple-600 hover:to-blue-600"
      >
        {isGeneratingAllContent ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating All Content...
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate All Content
          </>
        )}
      </Button>

      {isGeneratingAllContent && (
        <div className="bg-muted/50 p-4 rounded-lg">
          <AIProgress 
            progress={generationProgress} 
            label="Generating content for all sections"
          />
        </div>
      )}
    </>
  );
}
