
import { ProposalSection } from "../useProposalSections";
import { DndContext, DragEndEvent, MouseSensor, TouchSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableSection } from "./SortableSection";
import { SaveStatus } from "@/hooks/use-auto-save";

export interface SectionsListProps {
  sections: ProposalSection[];
  selectedSection: string | null;
  onSelectSection: (sectionId: string) => void;
  onReorderSections: (sections: ProposalSection[]) => void;
  isLoading?: boolean;
  error?: Error | null;
  onSaveStatusChange?: (sectionId: string, status: SaveStatus) => void;
  members?: Array<{ user_id: string; first_name?: string; last_name?: string; username?: string; role: string }>;
  showTeamFeatures?: boolean;
  onComment?: (sectionId: string, quotedText: string, from: number, to: number) => void;
}

export function SectionsList({ 
  sections, 
  selectedSection, 
  onSelectSection,
  onReorderSections,
  isLoading,
  error,
  onSaveStatusChange,
  members,
  showTeamFeatures,
  onComment,
}: SectionsListProps) {
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 10 },
  });
  
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((section) => section.section_id === active.id);
      const newIndex = sections.findIndex((section) => section.section_id === over.id);
      const newSections = [...sections];
      const [movedSection] = newSections.splice(oldIndex, 1);
      newSections.splice(newIndex, 0, movedSection);
      onReorderSections(newSections);
    }
  };

  if (isLoading) return <div>Loading sections...</div>;
  if (error) return <div className="text-destructive">Error loading sections: {error.message}</div>;
  if (sections.length === 0) {
    return (
      <div className="text-muted-foreground">
        No sections yet. Click "Add Section" to start drafting your proposal.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <SortableContext 
        items={sections.map(section => ({ id: section.section_id }))} 
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {sections.map((section) => (
            <SortableSection
              key={section.section_id}
              section={section}
              isSelected={selectedSection === section.section_id}
              onSelect={() => onSelectSection(section.section_id)}
              onSaveStatusChange={onSaveStatusChange}
              members={members}
              showTeamFeatures={showTeamFeatures}
              onComment={onComment}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
