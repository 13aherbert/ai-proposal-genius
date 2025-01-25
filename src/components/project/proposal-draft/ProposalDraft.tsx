import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useProposalSections } from "./useProposalSections";
import { AddSectionButton } from "./components/AddSectionButton";
import { SectionsList } from "./components/SectionsList";

interface ProposalDraftProps {
  projectId: string;
  outline: string | null;
}

/**
 * ProposalDraft Component
 * 
 * Manages the proposal drafting interface, allowing users to:
 * - Add new sections via a prompt dialog
 * - View and edit existing sections
 * - Track the currently selected section
 * 
 * @param projectId - The ID of the current project
 * @param outline - The proposal outline (currently unused, but maintained for future use)
 */
export function ProposalDraft({ projectId, outline }: ProposalDraftProps) {
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const { sections, isLoading, error, addSection } = useProposalSections(projectId);

  const handleAddSection = () => {
    const title = prompt("Enter section title:");
    if (title) {
      addSection(title);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Proposal Draft</CardTitle>
          <AddSectionButton onAdd={handleAddSection} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <SectionsList
          sections={sections}
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          isLoading={isLoading}
          error={error}
        />
      </CardContent>
    </Card>
  );
}