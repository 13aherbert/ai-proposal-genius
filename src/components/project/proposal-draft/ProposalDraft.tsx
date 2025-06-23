
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { SectionCreationButton } from "./components/SectionCreationButton";
import { ContentGenerationButton } from "./components/ContentGenerationButton";
import { useProposalSections } from "./useProposalSections";
import { useProposalOutline } from "./hooks/useProposalOutline";
import { BackupManager } from "./BackupManager";
import { toast } from "sonner";

export interface ProposalDraftProps {
  projectId: string;
  mode?: "draft" | "compiled";
}

export function ProposalDraft({ projectId, mode = "draft" }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  
  const {
    sections,
    isLoading,
    addSection,
    updateSection,
    reorderSections,
    deleteSection,
    deleteAllSections,
  } = useProposalSections(projectId);

  const { proposalOutline, extractSectionTitles } = useProposalOutline(projectId);

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const handleCreateSections = async (titles: string[]) => {
    // Create sections sequentially to maintain order
    for (const title of titles) {
      await addSection(title);
      // Small delay to ensure proper ordering
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };

  // Wrap updateSection to return a Promise to match the expected interface
  const handleUpdateSection = async (sectionId: string, content: string, title: string): Promise<void> => {
    return new Promise((resolve) => {
      updateSection(sectionId, content, title);
      resolve();
    });
  };

  const handleDeleteAllSections = () => {
    if (sections.length === 0) {
      toast.error("No sections to delete");
      return;
    }

    // Show warning toast with confirmation
    toast.warning(`Delete all ${sections.length} sections?`, {
      description: "This action cannot be undone. A backup will be created automatically.",
      action: {
        label: "Delete All",
        onClick: () => deleteAllSections()
      }
    });
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
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <AddSectionButton onAdd={addSection} />
              
              <SectionCreationButton
                proposalOutline={proposalOutline}
                sectionsCount={sections.length}
                onCreateSections={handleCreateSections}
                extractSectionTitles={extractSectionTitles}
              />

              <ContentGenerationButton
                sections={sections}
                projectId={projectId}
                onUpdateSection={handleUpdateSection}
              />

              {sections.length > 0 && (
                <Button
                  onClick={handleDeleteAllSections}
                  variant="outline"
                  className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete All Sections
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
      </CardContent>
    </Card>
  );
}

export default ProposalDraft;
