
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, FileText } from "lucide-react";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { CompiledView } from "./components/CompiledView";
import { useProposalSections } from "./useProposalSections";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BackupManager } from "./BackupManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ProposalDraftProps {
  projectId: string;
  mode?: "draft" | "compiled";
}

export function ProposalDraft({ projectId, mode = "draft" }: ProposalDraftProps) {
  // Set the active tab based on the mode prop
  const [activeTab, setActiveTab] = useState<string>(mode === "compiled" ? "preview" : "sections");
  const [previewKey, setPreviewKey] = useState(0); // Add a key to force preview re-render
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [isCreatingSections, setIsCreatingSections] = useState(false);
  const [proposalOutline, setProposalOutline] = useState<string | null>(null);
  
  const {
    sections,
    isLoading,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
  } = useProposalSections(projectId);

  // Load proposal outline on component mount
  useEffect(() => {
    const loadProposalOutline = async () => {
      try {
        const { data, error } = await supabase
          .from('projects')
          .select('proposal_outline')
          .eq('project_id', projectId)
          .single();

        if (error) throw error;
        setProposalOutline(data?.proposal_outline || null);
      } catch (error) {
        console.error('Error loading proposal outline:', error);
      }
    };

    loadProposalOutline();
  }, [projectId]);

  // Force preview to refresh when sections change
  useEffect(() => {
    if (sections) {
      setPreviewKey(prevKey => prevKey + 1);
    }
  }, [sections]);

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const extractSectionTitles = (outline: string): string[] => {
    const lines = outline.split('\n');
    const titles: string[] = [];
    
    for (const line of lines) {
      const trimmed = line.trim();
      // Match markdown headers (# ## ###) and numbered items (1. 2. etc.)
      if (trimmed.match(/^#{1,3}\s+(.+)/) || trimmed.match(/^\d+\.\s+(.+)/)) {
        let title = trimmed
          .replace(/^#{1,3}\s+/, '') // Remove markdown headers
          .replace(/^\d+\.\s+/, '') // Remove numbered list items
          .replace(/\*\*/g, '') // Remove bold markdown
          .replace(/\*/g, '') // Remove italic markdown
          .trim();
        
        if (title && title.length > 3 && title.length < 100) {
          titles.push(title);
        }
      }
    }
    
    return titles;
  };

  const handleCreateSectionsFromOutline = async () => {
    if (!proposalOutline) {
      toast.error("No proposal outline found", {
        description: "Please generate a proposal outline first before creating sections."
      });
      return;
    }

    setIsCreatingSections(true);
    toast.loading("Creating sections from outline...");

    try {
      const sectionTitles = extractSectionTitles(proposalOutline);
      
      if (sectionTitles.length === 0) {
        toast.dismiss();
        toast.error("No valid section titles found in outline", {
          description: "The outline may not be in the expected format."
        });
        return;
      }

      // Create sections sequentially to maintain order
      for (const title of sectionTitles) {
        await addSection(title);
        // Small delay to ensure proper ordering
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast.dismiss();
      toast.success(`Created ${sectionTitles.length} sections from outline`, {
        description: "You can now start adding content to each section."
      });
    } catch (error) {
      console.error('Error creating sections from outline:', error);
      toast.dismiss();
      toast.error("Failed to create sections", {
        description: "Please try again or create sections manually."
      });
    } finally {
      setIsCreatingSections(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-2xl font-semibold">Proposal Draft</CardTitle>
          <CardDescription>
            Create and edit sections for your proposal
          </CardDescription>
        </div>
        <div className="flex items-center space-x-2">
          <BackupManager sections={sections} projectId={projectId} />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-6 pb-3 border-b">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sections">Sections</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="sections" className="p-6 pt-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3">
                  <AddSectionButton onAdd={addSection} />
                  
                  {proposalOutline && sections.length === 0 && (
                    <Button
                      onClick={handleCreateSectionsFromOutline}
                      disabled={isCreatingSections}
                      variant="outline"
                      className="flex-1 sm:flex-none"
                    >
                      {isCreatingSections ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Sections...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Create Sections from Outline
                        </>
                      )}
                    </Button>
                  )}
                </div>
                
                <SectionsList
                  sections={sections}
                  selectedSection={selectedSection}
                  onSelectSection={handleSelectSection}
                  onReorderSections={reorderSections}
                  isLoading={isLoading}
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="border-none p-0">
            <CompiledView key={previewKey} sections={sections} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default ProposalDraft;
