
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { withRetry } from "@/utils/network/retry";
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
  const [isGeneratingAllContent, setIsGeneratingAllContent] = useState(false);
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
    onProgressUpdate(0, true);
    toast.loading("Generating content for all sections...", {
      description: "This may take a few minutes. Please don't close the page."
    });

    let successCount = 0;
    let errorCount = 0;
    let actualFailures: string[] = [];

    try {
      // Generate content for each section sequentially
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        let sectionSuccess = false;
        
        try {
          console.log(`Generating content for section: ${section.section_title}`);
          
          // Retry generation with exponential backoff for rate limiting
          await withRetry(async () => {
            const { data, error } = await supabase.functions.invoke('generate-section-content', {
              body: { 
                sectionTitle: section.section_title,
                projectId: projectId,
                userId: session!.user.id
              },
            });

            if (error) {
              // Check if it's a rate limiting error
              const errorMessage = error.message?.toLowerCase() || '';
              if (errorMessage.includes('overloaded') || errorMessage.includes('rate limit')) {
                throw new Error('RATE_LIMITED'); // Will be retried
              }
              throw error;
            }
            
            if (!data?.content) throw new Error('No content generated');

            // Update the section with the generated content
            await onUpdateSection(section.section_id, data.content, section.section_title);
            return data;
          }, 3, 2000, 30000); // 3 retries, 2s initial delay, max 30s
          
          sectionSuccess = true;
          successCount++;
          
        } catch (error) {
          console.error(`Error generating content for section ${section.section_title}:`, error);
          
          // Verify if content was actually generated despite the error
          try {
            // Check the database to see if content was saved
            const { data: updatedSection } = await supabase
              .from('proposal_sections')
              .select('content')
              .eq('section_id', section.section_id)
              .single();
            
            if (updatedSection?.content && updatedSection.content.trim().length > 0) {
              console.log(`Content was actually generated for ${section.section_title} despite error`);
              sectionSuccess = true;
              successCount++;
            } else {
              actualFailures.push(section.section_title);
              errorCount++;
            }
          } catch (dbError) {
            console.error('Error checking section content:', dbError);
            actualFailures.push(section.section_title);
            errorCount++;
          }
        }
        
        // Update progress
        const progress = ((i + 1) / sections.length) * 100;
        onProgressUpdate(progress, true);
        
        // Add delay between requests to be respectful to the API
        if (i < sections.length - 1) { // Don't delay after the last section
          await new Promise(resolve => setTimeout(resolve, sectionSuccess ? 1000 : 2000));
        }
      }

      toast.dismiss();
      
      if (successCount > 0 && actualFailures.length === 0) {
        toast.success(`Successfully generated content for all ${successCount} sections!`, {
          description: "You can now review and edit the generated content."
        });
      } else if (successCount > 0 && actualFailures.length > 0) {
        toast.warning(`Generated content for ${successCount} sections`, {
          description: `${actualFailures.length} section(s) failed to generate: ${actualFailures.join(', ')}. You can try generating them individually.`
        });
      } else if (actualFailures.length > 0) {
        toast.error("Failed to generate content for any sections", {
          description: `Failed sections: ${actualFailures.join(', ')}. Please try again or generate sections individually.`
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
      onProgressUpdate(0, false);
    }
  };

  if (sections.length === 0) {
    return null;
  }

  return (
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
  );
}
