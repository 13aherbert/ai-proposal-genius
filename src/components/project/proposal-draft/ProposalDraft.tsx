
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useProposalSections } from "./useProposalSections";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";
import { CompiledView } from "./components/CompiledView";
import { toast } from "sonner";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
  mode?: 'draft' | 'compiled';
}

export function ProposalDraft({ projectId, outline, mode = 'draft' }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const { sections, isLoading, error, addSection, reorderSections } = useProposalSections(projectId);

  // Parse outline and create sections
  useEffect(() => {
    const createSectionsFromOutline = async () => {
      if (!outline || sections.length > 0) return; // Skip if no outline or sections already exist

      try {
        // Split the outline into lines and filter out empty lines
        const lines = outline.split('\n').filter(line => line.trim());
        
        // Find all main headings (lines starting with single #)
        const mainHeadings = lines.filter(line => line.trim().startsWith('# '));
        
        // Create sections for each main heading
        for (const heading of mainHeadings) {
          const title = heading.replace(/^#\s+/, '').trim();
          await addSection(title);
        }
        
        toast.success("Sections created from outline");
      } catch (error) {
        console.error('Error creating sections from outline:', error);
        toast.error("Failed to create sections from outline");
      }
    };

    createSectionsFromOutline();
  }, [outline, sections.length, addSection]);

  const handleAddSection = (title: string) => {
    addSection(title);
  };

  const handleSelectSection = (sectionId: string) => {
    setSelectedSection(selectedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="space-y-4">
      {mode === 'draft' ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-start flex-1">
                <CardTitle className="text-2xl font-semibold leading-none tracking-tight">
                  Proposal Draft
                </CardTitle>
                <CardDescription className="pt-2">
                  Create and manage your proposal sections
                </CardDescription>
              </div>
              <AddSectionButton onAdd={handleAddSection} />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SectionsList
              sections={sections}
              selectedSection={selectedSection}
              onSelectSection={handleSelectSection}
              onReorderSections={reorderSections}
              isLoading={isLoading}
              error={error}
            />
          </CardContent>
        </Card>
      ) : (
        <CompiledView sections={sections} />
      )}
    </div>
  );
}
