
import { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, MoreVertical } from "lucide-react";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { SectionCreationButton } from "./components/SectionCreationButton";
import { ContentGenerationButton } from "./components/ContentGenerationButton";
import { CompiledView } from "./components/CompiledView";
import { GlobalSaveStatus } from "./components/GlobalSaveStatus";
import { useProposalSections } from "./useProposalSections";
import { useProposalOutline } from "./hooks/useProposalOutline";
import { BackupManager } from "./BackupManager";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { SaveStatus } from "@/hooks/use-auto-save";

export interface ProposalDraftProps {
  projectId: string;
  mode?: "draft" | "compiled";
}

export function ProposalDraft({ projectId, mode = "draft" }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, SaveStatus>>({});
  
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

  const statusValues = Object.values(sectionStatuses);
  const hasUnsaved = statusValues.some(s => s === "unsaved" || s === "saving");

  // Browser beforeunload guard
  useEffect(() => {
    if (!hasUnsaved) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsaved]);

  // React Router in-app navigation guard
  useBlocker(
    ({ currentLocation, nextLocation }) =>
      hasUnsaved && currentLocation.pathname !== nextLocation.pathname
  );

  const handleSaveStatusChange = useCallback((sectionId: string, status: SaveStatus) => {
    setSectionStatuses(prev => ({ ...prev, [sectionId]: status }));
  }, []);

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  const handleCreateSections = async (titles: string[]) => {
    try {
      for (const title of titles) {
        await addSection(title, true);
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      toast.success(`Created ${titles.length} sections from outline`, {
        description: "You can now start adding content to each section."
      });
    } catch (error) {
      console.error('Error creating sections:', error);
      toast.error("Failed to create some sections", {
        description: "Please try again or create sections manually."
      });
    }
  };

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

    toast.warning(`Delete all ${sections.length} sections?`, {
      description: "This action cannot be undone. A backup will be created automatically.",
      action: {
        label: "Delete All",
        onClick: () => deleteAllSections()
      }
    });
  };

  if (mode === "compiled") {
    return <CompiledView sections={sections} projectId={projectId} />;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <div className="flex items-center gap-3">
            <CardTitle className="text-xl sm:text-2xl font-semibold">Proposal Draft</CardTitle>
            {sections.length > 0 && (
              <GlobalSaveStatus sectionStatuses={statusValues} />
            )}
          </div>
          <CardDescription>
            Create and edit sections for your proposal
          </CardDescription>
        </div>
        <BackupManager sections={sections} projectId={projectId} />
      </CardHeader>
      <CardContent className="p-3 sm:p-6 pt-0">
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
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="flex-none">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-popover">
                    <DropdownMenuItem
                      onClick={handleDeleteAllSections}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete All Sections
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            
            <SectionsList
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onReorderSections={reorderSections}
              isLoading={isLoading}
              onSaveStatusChange={handleSaveStatusChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProposalDraft;
