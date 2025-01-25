import { ProposalSection } from "../useProposalSections";
import { SectionEditor } from "../SectionEditor";

interface SectionsListProps {
  sections: ProposalSection[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string) => void;
  isLoading?: boolean;
  error?: Error | null;
}

/**
 * Renders the list of proposal sections
 * Handles loading, error, and empty states
 * Renders individual section editors when sections are available
 */
export function SectionsList({ 
  sections, 
  selectedSection, 
  onSelectSection,
  isLoading,
  error 
}: SectionsListProps) {
  if (isLoading) {
    return <div>Loading sections...</div>;
  }

  if (error) {
    return <div className="text-red-500">Error loading sections: {error.message}</div>;
  }

  if (sections.length === 0) {
    return (
      <div className="text-muted-foreground">
        No sections yet. Click "Add Section" to start drafting your proposal.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <SectionEditor
          key={section.id}
          section={section}
          isSelected={selectedSection === section.id}
          onSelect={() => onSelectSection(section.id)}
        />
      ))}
    </div>
  );
}